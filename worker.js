/* ═══════════════════════════════════════════════════════════
   sniper-backend  —  AI 프록시 + 노트 동기화   (PDF·JSON 모드 지원판)

   기존 워커에서 바뀐 것은 네 군데입니다.
   ① /get-data 가 generationConfig / systemInstruction 을 그대로 전달합니다.
      → responseMimeType:"application/json" (JSON 모드), maxOutputTokens 조절 가능
   ② 응답에 finishReason 과 usage 를 담아 보냅니다. (잘림 감지용)
   ③ Claude 경로가 PDF(application/pdf)를 document 블록으로 넘깁니다.
   ④ 사용한 모델 이름을 응답에 넣습니다.

   나머지(로그인 · /sync · 모델 폴백)는 손대지 않았습니다.

   ★ 고칠 곳: PROVIDER 한 줄
   ★ API 키: 워커 Settings → Variables and Secrets → MY_SECRET_KEY
   ★ 동기화를 쓰려면 KV 저장소를 NOTES_KV 라는 이름으로 연결하세요.
   ═══════════════════════════════════════════════════════════ */

const PROVIDER = "gemini";

const LOGIN_ID = "jj";
const LOGIN_PW = "jj";

const MODELS = {
  gemini: ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"],
  claude: ["claude-sonnet-5", "claude-haiku-4-5-20251001"],
  openai: ["gpt-5.1", "gpt-4o"],
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-sync-key",
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { ...cors, "Content-Type": "application/json" },
      });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    /* ── 로그인 ── */
    if (url.pathname === "/login" && request.method === "POST") {
      try {
        const b = await request.json();
        if (b.username === LOGIN_ID && b.password === LOGIN_PW) {
          return json({ success: true, message: "로그인 성공!" });
        }
        return json({ detail: "아이디 또는 비밀번호가 틀렸습니다." }, 400);
      } catch (e) {
        return json({ detail: "잘못된 요청 형식입니다." }, 400);
      }
    }

    /* ══════════ 노트 동기화 (변경 없음) ══════════ */
    if (url.pathname === "/sync") {
      if (!env.NOTES_KV) {
        return json({
          detail: "동기화 저장소(KV)가 연결되지 않았습니다. 워커 Settings → Bindings 에서 KV 네임스페이스를 만들고 이름을 NOTES_KV 로 연결하세요.",
          needSetup: true,
        }, 501);
      }

      const key = request.headers.get("x-sync-key") || "";
      const want = env.SYNC_KEY || LOGIN_PW;
      if (key !== want) return json({ detail: "동기화 암호가 맞지 않습니다." }, 401);

      if (request.method === "GET") {
        const raw = await env.NOTES_KV.get("notes");
        if (!raw) return json({ exists: false, count: 0, updatedAt: null, notes: [] });
        try {
          const d = JSON.parse(raw);
          return json({ exists: true, count: (d.notes || []).length, updatedAt: d.updatedAt || null, notes: d.notes || [] });
        } catch (e) {
          return json({ detail: "서버에 저장된 자료를 읽지 못했습니다." }, 500);
        }
      }

      if (request.method === "POST") {
        let body;
        try { body = await request.json(); } catch (e) { return json({ detail: "요청 본문을 읽지 못했습니다." }, 400); }
        const notes = Array.isArray(body.notes) ? body.notes : null;
        if (!notes) return json({ detail: "notes 목록이 없습니다." }, 400);

        const payload = JSON.stringify({ notes, updatedAt: new Date().toISOString(), count: notes.length });
        if (payload.length > 24 * 1024 * 1024) {
          return json({ detail: "자료가 너무 큽니다(24MB 초과). 사진이 많은 노트를 줄여주세요." }, 413);
        }
        await env.NOTES_KV.put("notes", payload);
        return json({ ok: true, count: notes.length, updatedAt: new Date().toISOString() });
      }

      return json({ detail: "지원하지 않는 방식입니다." }, 405);
    }

    const apiKey = env.MY_SECRET_KEY;
    if (!apiKey) return json({ detail: "MY_SECRET_KEY 가 설정되지 않았습니다." }, 500);

    /* ── 진단 ── */
    if (url.pathname === "/test" || url.pathname === "/models") {
      const r = await callAI(apiKey, [{ role: "user", parts: [{ text: "안녕이라고만 답해줘" }] }], {});
      return json({
        provider: PROVIDER,
        keyStartsWith: apiKey.slice(0, 4),
        keyLength: apiKey.length,
        syncReady: !!env.NOTES_KV,
        ok: r.ok,
        usedModel: r.model || null,
        answer: r.ok ? r.text.slice(0, 100) : null,
        error: r.ok ? null : r.detail,
      });
    }

    /* ── AI 프록시 ── */
    if (url.pathname === "/get-data") {
      let payload;
      try {
        payload = request.method === "POST"
          ? await request.json()
          : { contents: [{ parts: [{ text: url.searchParams.get("prompt") || "안녕" }] }] };
      } catch (e) {
        return json({ detail: "요청 본문을 읽지 못했습니다: " + e.message }, 400);
      }

      /* ★ 여기가 핵심 변경 — 설정을 버리지 않고 그대로 넘긴다 */
      const cfg = {
        generationConfig: payload.generationConfig || null,
        systemInstruction: payload.systemInstruction || null,
        model: payload.model || null,   // 특정 모델을 콕 집고 싶을 때
      };

      const r = await callAI(apiKey, payload.contents || [], cfg);
      if (!r.ok) return json({ detail: r.detail, status: r.status }, r.status || 500);

      return json({
        usedModel: r.model || null,
        finishReason: r.truncated ? "MAX_TOKENS" : (r.finishReason || "STOP"),
        usage: r.usage || null,
        candidates: [{
          content: { parts: [{ text: r.text }] },
          finishReason: r.truncated ? "MAX_TOKENS" : (r.finishReason || "STOP"),
        }],
      });
    }

    return json({ detail: "없는 주소입니다: " + url.pathname }, 404);
  },
};

/* ─────────── 제공자별 호출 ─────────── */
async function callAI(apiKey, contents, cfg = {}) {
  const list = cfg.model ? [cfg.model] : (MODELS[PROVIDER] || MODELS.gemini);
  let last = { ok: false, detail: "시도한 모델이 없습니다.", status: 500 };

  for (const model of list) {
    try {
      const r =
        PROVIDER === "claude" ? await callClaude(apiKey, model, contents, cfg)
        : PROVIDER === "openai" ? await callOpenAI(apiKey, model, contents, cfg)
        : await callGemini(apiKey, model, contents, cfg);

      if (r.ok) return { ...r, model };
      last = r;
      if (r.status !== 404 && r.status !== 400) break;
    } catch (err) {
      last = { ok: false, detail: "[" + model + "] " + err.message, status: 500 };
    }
  }
  return last;
}

async function callGemini(apiKey, model, contents, cfg = {}) {
  const body = { contents };
  if (cfg.generationConfig) body.generationConfig = cfg.generationConfig;
  if (cfg.systemInstruction) {
    body.systemInstruction = typeof cfg.systemInstruction === "string"
      ? { parts: [{ text: cfg.systemInstruction }] }
      : cfg.systemInstruction;
  }

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
    { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify(body) }
  );
  const d = await res.json();
  if (!res.ok) return { ok: false, status: res.status, detail: "[" + model + "] " + (d?.error?.message || "오류") };

  const c = d.candidates?.[0];
  const text = (c?.content?.parts || []).map((p) => p.text || "").join("");

  /* 안전필터 등으로 내용이 통째로 비는 경우를 구분해서 알려준다 */
  if (!text && c?.finishReason && c.finishReason !== "STOP") {
    return { ok: false, status: 502, detail: "[" + model + "] 응답이 비었습니다 (finishReason: " + c.finishReason + ")" };
  }

  return {
    ok: true,
    text,
    finishReason: c?.finishReason || "STOP",
    truncated: c?.finishReason === "MAX_TOKENS",
    usage: d.usageMetadata
      ? { in: d.usageMetadata.promptTokenCount, out: d.usageMetadata.candidatesTokenCount }
      : null,
  };
}

function toMessages(contents, forClaude) {
  return contents.map((c) => {
    const blocks = [];
    for (const p of (c.parts || [])) {
      if (p.text) blocks.push({ type: "text", text: p.text });
      else if (p.inline_data) {
        const mime = p.inline_data.mime_type || "";
        /* ★ PDF 처리 추가 */
        if (mime === "application/pdf") {
          if (forClaude) blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: p.inline_data.data } });
          else blocks.push({ type: "text", text: "(PDF는 이 제공자에서 지원되지 않습니다)" });
        } else if (forClaude) {
          blocks.push({ type: "image", source: { type: "base64", media_type: mime, data: p.inline_data.data } });
        } else {
          blocks.push({ type: "image_url", image_url: { url: "data:" + mime + ";base64," + p.inline_data.data } });
        }
      }
    }
    return { role: c.role === "model" ? "assistant" : "user", content: blocks };
  });
}

async function callClaude(apiKey, model, contents, cfg = {}) {
  const body = {
    model,
    max_tokens: cfg.generationConfig?.maxOutputTokens || 8192,
    messages: toMessages(contents, true),
  };
  if (cfg.generationConfig?.temperature != null) body.temperature = cfg.generationConfig.temperature;
  if (cfg.systemInstruction) {
    body.system = typeof cfg.systemInstruction === "string"
      ? cfg.systemInstruction
      : (cfg.systemInstruction.parts || []).map((p) => p.text).join("\n");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  });
  const d = await res.json();
  if (!res.ok) return { ok: false, status: res.status, detail: "[" + model + "] " + (d?.error?.message || "오류") };
  return {
    ok: true,
    text: (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join(""),
    finishReason: d.stop_reason === "max_tokens" ? "MAX_TOKENS" : "STOP",
    truncated: d.stop_reason === "max_tokens",
    usage: d.usage ? { in: d.usage.input_tokens, out: d.usage.output_tokens } : null,
  };
}

async function callOpenAI(apiKey, model, contents, cfg = {}) {
  const body = {
    model,
    max_tokens: cfg.generationConfig?.maxOutputTokens || 8192,
    messages: toMessages(contents, false),
  };
  if (cfg.generationConfig?.temperature != null) body.temperature = cfg.generationConfig.temperature;
  if (cfg.generationConfig?.responseMimeType === "application/json") body.response_format = { type: "json_object" };
  if (cfg.systemInstruction) {
    const sys = typeof cfg.systemInstruction === "string"
      ? cfg.systemInstruction
      : (cfg.systemInstruction.parts || []).map((p) => p.text).join("\n");
    body.messages.unshift({ role: "system", content: sys });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
    body: JSON.stringify(body),
  });
  const d = await res.json();
  if (!res.ok) return { ok: false, status: res.status, detail: "[" + model + "] " + (d?.error?.message || "오류") };
  const c = d.choices?.[0];
  return {
    ok: true,
    text: c?.message?.content || "",
    finishReason: c?.finish_reason === "length" ? "MAX_TOKENS" : "STOP",
    truncated: c?.finish_reason === "length",
    usage: d.usage ? { in: d.usage.prompt_tokens, out: d.usage.completion_tokens } : null,
  };
}
