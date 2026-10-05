/* practice.html 에서 분리 (v341) — 원래 20026번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

/* ══════════════════════════════════════════════════════════════
   v234 · 자리 기억 — 어떤 이유로 화면이 다시 세워져도 보던 데로 돌아온다

   브라우저(크롬)는 오래 안 보는 탭을 스스로 «버리고» 다시 켤 때가 있다
   (메모리 절약 기능). 그러면 화면은 새로고침과 똑같이 처음 상태가 된다.
   앱이 막을 수 있는 일이 아니므로, 대신 «어디를 보고 있었는지» 를 적어 두고
   다시 켜질 때 그 자리로 데려다 놓는다.

   적어 두는 것: 과목 · 연도 · 회차 · 찾는 말 · 보던 문항
   ══════════════════════════════════════════════════════════════ */
(function(){
  const KEY = "prac:view:v1";
  const $ = s => document.querySelector(s);
  const rd = () => { try{ return JSON.parse(localStorage.getItem(KEY) || "null"); }catch(e){ return null; } };
  const wr = o => { try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){globalThis.__q?.(e)} };
  let ready = false;

  function now(){
    const rs = window.SHOWN || [];
    const r  = rs[window.ONEAT | 0];
    return { sid:String($("#fSub")?.value || ""),
             y:String($("#fYear")?.value || ""), s:String($("#fSess")?.value || ""),
             q:String($("#fQ")?.value || ""),
             id:r ? String(r.id) : "", at:window.ONEAT | 0, ts:Date.now() };
  }
  const save = () => { if(ready && (window.SHOWN || []).length) wr(now()); };

  setInterval(save, 4000);
  document.addEventListener("visibilitychange", () => { if(document.hidden) save(); });
  addEventListener("pagehide", save);

  /* ── 다시 켜졌을 때 그 자리로 ── */
  const want = rd();
  const wait = setInterval(() => {
    const rs = window.SHOWN;
    if(!rs || !rs.length) return;
    clearInterval(wait);
    if(!want || want.sid !== String($("#fSub")?.value || "")){ ready = true; return; }

    let changed = false;
    const pick = (sel, v) => {
      const el = $(sel);
      if(el && v && el.value !== v && [...el.options].some(o => o.value === v)){ el.value = v; changed = true; }
    };
    pick("#fYear", want.y); pick("#fSess", want.s);
    const q = $("#fQ");
    if(q && want.q && q.value !== want.q){ q.value = want.q; changed = true; }
    if(changed) $("#fYear")?.dispatchEvent(new Event("change"));

    setTimeout(() => {
      const list = window.SHOWN || [];
      let i = list.findIndex(r => String(r.id) === String(want.id));
      if(i < 0) i = Math.min(Math.max(0, want.at | 0), list.length - 1);
      if(i >= 0 && typeof window.showAt === "function"){
        window.showAt(i);
        document.querySelector("#list > .pcard.show")?.scrollIntoView({ block:"start" });
      }
      ready = true;
    }, changed ? 700 : 150);
  }, 200);
  setTimeout(() => { clearInterval(wait); ready = true; }, 20000);

  /* ── «↻ 새로 받기» — 캐시를 버리고 표를 다시 받는다 ── */
  const put = setInterval(() => {
    const host = document.querySelector("#dFind1") || document.querySelector(".filters");
    if(!host || document.querySelector("#pracRefetch")) return;
    clearInterval(put);
    const b = document.createElement("button");
    b.type = "button"; b.id = "pracRefetch"; b.className = "chip";
    b.textContent = "↻ 새로 받기";
    b.title = "이 기기에 저장해 둔 문항을 버리고 Supabase 에서 다시 받습니다\n(다른 기기·다른 화면에서 고친 것을 가져올 때만 쓰세요)";
    b.onclick = async () => {
      if(!window.__pracRefetch) return;
      b.disabled = true; const t = b.textContent; b.textContent = "받는 중…";
      try{ await window.__pracRefetch(); }catch(e){globalThis.__q?.(e)}
      b.disabled = false; b.textContent = t;
    };
    host.appendChild(b);
  }, 300);
  setTimeout(() => clearInterval(put), 20000);
})();
