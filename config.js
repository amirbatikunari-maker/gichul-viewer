/* ═══════════════════════════════════════════════════════════════
   ★ v341 — «묻힌 오류» 기록장
   앱 곳곳의 빈 catch(e){} (600개 넘음)가 오류를 흔적 없이 삼켜서
   «가끔 안 그려짐» 같은 문제를 쫓을 수가 없었다. 이제 전부 여기로 모인다.
   - 화면 동작은 예전과 똑같음 (여전히 삼킴 — 앱이 멈추지 않음)
   - 최근 200개를 window.__errs 에 보관 → 개발자 도구 콘솔에서 __errs 로 확인
   - localStorage 'gv-debug' 를 '1' 로 두면 생길 때마다 콘솔에 경고로도 찍음
   ═══════════════════════════════════════════════════════════════ */
(function(){
  if (globalThis.__q) return;
  const L = globalThis.__errs = [];
  let loud = false;
  try { loud = localStorage.getItem("gv-debug") === "1"; } catch (e) {}
  globalThis.__q = function(e){
    try{
      const msg = String((e && e.message) || e).slice(0, 300);
      const at = String((e && e.stack) || "").split("\n")[1] || "";
      const last = L[L.length - 1];
      if (last && last.m === msg && last.at === at){ last.n++; last.t = Date.now(); }   /* 같은 오류 연속은 한 줄로 */
      else { L.push({ t: Date.now(), m: msg, at: at.trim(), n: 1 }); if (L.length > 200) L.shift(); }
      if (loud) console.warn("[묻힌 오류]", e);
    }catch(_){}
  };
})();

/* ─────────────────────────────────────────────
   Supabase 값 (뷰어·업로더용)
   Supabase 대시보드 → Project Settings → API
   ⚠ service_role 키는 절대 넣지 말 것.

   Worker 주소 (PDF 변환용)
   기존에 쓰시던 주소 그대로입니다.
   ───────────────────────────────────────────── */
window.APP_CONFIG = {
  SUPABASE_URL: "https://nfyyctinvlytykucbgzk.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_tRyg8GTus9I2_wt-VSmaRA_6gbU-lt5",
  APP_TITLE: "기출 해설 노트",
  CONFIG_VERSION: "v264",

  WORKER_URL:        "https://gichul-ai.amirbatikunari.workers.dev",
  WORKER_BACKUP_URL: "",

// ... (아래쪽 생략) ...
  /* ─────────────────────────────────────────────
     AI 대화 상자
     ─────────────────────────────────────────────
     AI_WORKER_URL — 새로 배포한 AI 중계 Worker 주소.
       `npx wrangler deploy` 를 마치면 터미널에 찍히는 주소를 그대로 넣으세요.
       예: https://sniper-ai.amirbatikunari.workers.dev

     AI_APP_KEY — Worker 에 APP_KEY 시크릿을 등록했을 때만 채웁니다.
       ⚠ 이 값은 브라우저에서 보이므로 «비밀» 이 아닙니다.
         지나가던 사람이 주소만 알고 함부로 쓰는 걸 막는 문고리일 뿐입니다.
       ★ v340 — 진짜 자물쇠는 Worker 의 «로그인 확인»(REQUIRE_AUTH / ALLOWED_EMAILS) 입니다.
         이 파일 맨 아래 attachWorkerAuth 가 워커로 가는 요청마다 로그인 토큰을 붙여 줍니다.

     AI_APP_NAME — 대화 기록을 앱별로 나눠 담는 이름표.
     ───────────────────────────────────────────── */
AI_WORKER_URL: "https://gichul-ai.amirbatikunari.workers.dev",
/* APP_KEY는 공개 소스에 넣지 않습니다. Worker 시크릿으로만 관리하세요. */
AI_APP_KEY: "",
  ADMIN_EMAILS:  ["amirbatikunari@gmail.com"],
  AI_APP_NAME:   "viewer",

  /* 해설 배치(explain-batch.html)가 쓰는 주소. 위 워커와 같은 곳입니다. */
  CLAUDE_WORKER_URL: "https://gichul-ai.amirbatikunari.workers.dev",
  CLAUDE_APP_KEY:    "",

  /* AI 를 쓸 수 있는 계정. AI 는 물어볼 때마다 요금이 붙으므로
     로그인한 사람만 쓰게 막아 둡니다.
     ⚠ 이 목록은 «화면을 잠그는» 용도일 뿐입니다.
       실제 차단은 Worker 의 REQUIRE_AUTH / ALLOWED_EMAILS 가 합니다.
     비워 두면 «로그인한 사람이면 누구나» 가 됩니다. */
  AI_ALLOWED_EMAILS: ["amirbatikunari@gmail.com"],
};

/* 오프라인/외부 CDN 차단 대비: supabase-js가 늦거나 내려가도 화면 자체는 살아 있게 둡니다.
   실제 Supabase 라이브러리가 로드되면 이 대체 객체는 만들지 않습니다. */
(function ensureSupabaseFallback(){
  if (window.supabase || !window.APP_CONFIG?.SUPABASE_URL) return;
  const offlineError = { message:'Supabase 라이브러리를 사용할 수 없습니다. 오프라인 상태에서는 화면과 로컬 기능만 사용할 수 있습니다.', code:'SUPABASE_OFFLINE' };
  const query = () => {
    const q = {
      select(){return q}, insert(){return q}, update(){return q}, upsert(){return q}, delete(){return q}, eq(){return q}, neq(){return q}, in(){return q}, or(){return q}, and(){return q}, ilike(){return q}, order(){return q}, limit(){return q}, range(){return q}, single(){return Promise.resolve({data:null,error:offlineError})}, maybeSingle(){return Promise.resolve({data:null,error:offlineError})},
      then(resolve,reject){ return Promise.resolve({data:null,error:offlineError}).then(resolve,reject) }, catch(reject){ return Promise.resolve({data:null,error:offlineError}).catch(reject) }
    };
    return q;
  };
  window.supabase = {
    createClient(){
      return {
        auth:{
          async getSession(){return {data:{session:null},error:offlineError}},
          async getUser(){return {data:{user:null},error:offlineError}},
          async signInWithPassword(){return {data:null,error:offlineError}},
          async signUp(){return {data:null,error:offlineError}},
          async signOut(){return {error:offlineError}},
          onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}
        },
        from(){return query()},
        storage:{from(){return {upload:async()=>({data:null,error:offlineError}),download:async()=>({data:null,error:offlineError}),remove:async()=>({data:null,error:offlineError}),list:async()=>({data:[],error:offlineError})}}}
      };
    }
  };
})();


/* ═══════════════════════════════════════════════════════════════
   ★ v340 — 워커로 가는 요청에 로그인 토큰을 자동으로 붙임

   워커가 이제 «로그인한 허용 계정» 만 받는다 (예전엔 주소만 알면 누구나 AI 를 불러 요금이 샐 수 있었음).
   워커를 부르는 곳이 index · practice · review · interview · ingest · explain-batch · ai-explain 등
   열 군데가 넘어서, 하나하나 고치지 않고 여기서 fetch 를 한 번 감싸 처리한다.

   - 워커 주소(WORKER_URL · AI_WORKER_URL · CLAUDE_WORKER_URL · WORKER_BACKUP_URL)로 가는 요청만 손댐
   - 이미 Authorization 이 붙어 있으면(ai-chat.js) 그대로 둠
   - 토큰은 그 화면의 Supabase 연결(sb)에서 받음 — 만료됐으면 supabase-js 가 알아서 새로 받아 줌
   - 워커가 401(로그인 만료)을 돌려주면 토큰을 한 번 새로 받아 딱 한 번만 다시 보냄
   ═══════════════════════════════════════════════════════════════ */
(function attachWorkerAuth(){
  if (window.__workerAuthPatched || typeof window.fetch !== "function") return;
  window.__workerAuthPatched = true;
  const C = window.APP_CONFIG || {};
  const HOSTS = new Set([C.WORKER_URL, C.WORKER_BACKUP_URL, C.AI_WORKER_URL, C.CLAUDE_WORKER_URL]
    .filter(Boolean).map(u => { try { return new URL(u).origin; } catch (e) { return ""; } }).filter(Boolean));
  if (!HOSTS.size) return;
  const orig = window.fetch.bind(window);

  const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
  /* 각 화면이 맨 위에 const sb = createClient(...) 로 만든 연결 */
  function pageSb(){
    try { return (typeof sb !== "undefined" && sb && sb.auth) ? sb : null; } catch (e) { return null; }
  }
  /* sb 를 못 쓸 때 대비: 저장소에 남은 supabase 세션 중 아직 살아 있는 토큰 */
  function storedToken(){
    const now = Date.now() / 1000 + 30;
    for (const st of [window.localStorage, window.sessionStorage]){
      try{
        for (let i = 0; i < st.length; i++){
          const k = st.key(i);
          if (!k || !k.startsWith("sb-")) continue;
          const o = JSON.parse(st.getItem(k) || "null");
          const s = o && (o.access_token ? o : o.currentSession);
          if (s && s.access_token && (!s.expires_at || s.expires_at > now)) return s.access_token;
        }
      }catch(e){globalThis.__q?.(e)}
    }
    return "";
  }
  async function getToken(refresh){
    const c = pageSb();
    if (c){
      try{
        const r = await withTimeout(refresh ? c.auth.refreshSession() : c.auth.getSession(), 4000);
        const t = r && r.data && r.data.session && r.data.session.access_token;
        if (t) return t;
      }catch(e){ console.warn("[워커 인증] 세션 읽기 실패", e); }
    }
    return storedToken();
  }
  function isWorker(input){
    try{
      const u = typeof input === "string" ? input : (input && (input.url || input.href)) || "";
      return HOSTS.has(new URL(u, location.href).origin);
    }catch(e){ return false; }
  }

  window.fetch = async function(input, init){
    if (!isWorker(input)) return orig(input, init);
    const base = new Headers((init && init.headers) || (input instanceof Request ? input.headers : undefined));
    if (base.has("Authorization")) return orig(input, init);

    const send = async refresh => {
      const h = new Headers(base);
      const t = await getToken(refresh);
      if (t) h.set("Authorization", "Bearer " + t);
      return orig(input, Object.assign({}, init || {}, { headers: h }));
    };
    const res = await send(false);
    /* 본문을 다시 보낼 수 있는 경우만 한 번 더 (Request 객체 본문은 한 번 읽으면 끝) */
    const replayable = !(input instanceof Request && input.body && !(init && "body" in init));
    if (res.status === 401 && replayable && pageSb()) return send(true);
    return res;
  };
})();
