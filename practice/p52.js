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
  /* ★ v360 — 새로고침(Ctrl+Shift+R)하면 «마지막에 보던 문항» 이 아니라 엉뚱한 문항으로 튀던 것
     ① 한눈에로 넘겨 보던 문항(OVID)을 안 적고 목록 순번(ONEAT)만 적었다 — 한 문항씩 보기가 아니면 둘이 달랐다
     ② 필기·실기가 같은 칸을 써서 서로 덮었다
     ③ p55(묶음별 자리)가 켜질 때 먼저 «0번째» 를 적어 두고 그리로 끌고 갔다
     → 필기/실기 따로 · 한눈에 문항 id 와 «한눈에 열려 있었나» 까지 적고, 돌아온 뒤 몇 초간 자리를 지킨다 */
  const W = (() => { try{ return !!W_MODE }catch(e){ return /[?&]w=1\b/.test(location.search) } })();
  const KEY = "prac:view:v1" + (W ? ":w" : "");
  const $ = s => document.querySelector(s);
  const rd = () => { try{ return JSON.parse(localStorage.getItem(KEY) || "null"); }catch(e){ return null; } };
  const wr = o => { try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){globalThis.__q?.(e)} };
  let ready = false;
  window.__viewReady = false;
  const ovOn = () => !!$("#ovl")?.classList.contains("on");
  const ovId = () => { try{ return OVID != null ? String(OVID) : "" }catch(e){ return "" } };

  function now(){
    const rs = window.SHOWN || [];
    const r  = rs[window.ONEAT | 0];
    const ov = ovOn() && ovId();
    return { sid:String($("#fSub")?.value || ""),
             y:String($("#fYear")?.value || ""), s:String($("#fSess")?.value || ""),
             q:String($("#fQ")?.value || ""),
             id: ov ? ovId() : (r ? String(r.id) : ""), ov: !!ov, at:window.ONEAT | 0, ts:Date.now() };
  }
  const save = () => { if(ready && (window.SHOWN || []).length) wr(now()); };

  setInterval(save, 2000);
  document.addEventListener("visibilitychange", () => { if(document.hidden) save(); });
  addEventListener("pagehide", save);
  addEventListener("beforeunload", save);
  /* 문항을 옮길 때마다 바로 적는다 (2초 안에 새로고침해도 맞게) */
  document.addEventListener("click", () => setTimeout(save, 300), true);
  document.addEventListener("keyup", () => setTimeout(save, 300), true);

  const done = () => { ready = true; window.__viewReady = true; };

  /* ── 다시 켜졌을 때 그 자리로 ── */
  const want = rd();
  const wait = setInterval(() => {
    const rs = window.SHOWN;
    if(!rs || !rs.length) return;
    clearInterval(wait);
    if(!want || !want.id || want.sid !== String($("#fSub")?.value || "")){ done(); return; }

    let changed = false;
    const pick = (sel, v) => {
      const el = $(sel);
      if(el && v != null && el.value !== v && [...el.options].some(o => o.value === v)){ el.value = v; changed = true; }
    };
    pick("#fYear", want.y); pick("#fSess", want.s);
    const q = $("#fQ");
    if(q && (want.q || "") !== q.value){ q.value = want.q || ""; changed = true; }
    if(changed) $("#fYear")?.dispatchEvent(new Event("change"));

    const curId = () => ovOn() ? ovId() : (() => { const r = (window.SHOWN || [])[window.ONEAT | 0]; return r ? String(r.id) : ""; })();
    const go = () => {
      const list = window.SHOWN || [];
      let i = list.findIndex(r => String(r.id) === String(want.id));
      if(i < 0) return false;
      if(typeof window.showAt === "function" && (window.ONEAT | 0) !== i){
        window.showAt(i);
        document.querySelector("#list > .pcard.show")?.scrollIntoView({ block:"start" });
      }
      if(want.ov && typeof window.ovOpen === "function" && (!ovOn() || ovId() !== String(want.id))) window.ovOpen(want.id);
      return true;
    };
    setTimeout(() => {
      go();
      /* 켜지는 동안 다른 코드가 0번째로 끌고 가는 일이 있어 4초간 자리를 지킨다 — 손대면 바로 그만 */
      let stop = false;
      const quit = () => { stop = true; };
      ["pointerdown", "keydown", "wheel", "touchstart"].forEach(ev => addEventListener(ev, quit, { capture:true, once:true }));
      const t0 = Date.now();
      const keep = setInterval(() => {
        if(stop || Date.now() - t0 > 4000){ clearInterval(keep); done(); return; }
        if(curId() !== String(want.id)) go();
      }, 300);
    }, changed ? 700 : 150);
  }, 200);
  setTimeout(() => { clearInterval(wait); done(); }, 20000);

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
