/* practice.html 에서 분리 (v341) — 원래 1385번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
/* «자동 변환» 탭이 이 쪽을 ?only=import 로 불러 쓴다.
   그때는 자료함·PDF 가져오기만 남기고 나머지를 걷어낸다. */
const IMPORT_ONLY = new URLSearchParams(location.search).get("only") === "import";
const CFG = window.APP_CONFIG || {};
const sb = (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY)
  ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;
if(typeof window.pdfjsLib !== "undefined")
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const say = (el, t, k="info") => { el.className = "msg " + k; el.textContent = t; };
const logEl = $("#log");
function log(t){
  logEl.hidden = false;
  logEl.textContent += `${new Date().toLocaleTimeString("ko-KR",{hour12:false})}  ${t}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

/* ═══════════════════════════════════════════════
   로그인 — 이 블록은 로그인해야 아무것도 안 보인다
   ═══════════════════════════════════════════════ */
/* ★ 서버가 대답을 안 하면 화면이 «통째로 멈추던» 자리.
   getSession() 은 답이 올 때까지 영원히 기다린다. 그 사이 #gate 도 #main 도
   숨은 채라, 사용자에게는 제목만 남은 백지가 보인다. 무엇이 잘못됐는지도 알 수 없다.
   그래서 시간 제한을 걸고, 시간이 지나면 «연결하지 못했다» 고 분명히 말한다. */
function withTimeout(promise, ms, what){
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${what} — ${ms/1000}초 안에 응답이 없습니다`)), ms))
  ]);
}
async function gate(){
  if(!sb){ $("#gate").hidden = false; say($("#am"), "config.js 에 Supabase 정보가 없습니다.", "err"); return false; }
  let data;
  try{
    ({ data } = await withTimeout(sb.auth.getSession(), 9000, "서버 연결"));
  }catch(e){
    $("#gate").hidden = false;
    $("#main").hidden = true;
    say($("#am"),
      "서버에 연결하지 못했습니다 — " + (e.message || e) + "\n\n"
      + "· 인터넷이 끊겼거나\n"
      + "· Supabase 프로젝트가 «일시중지(Paused)» 됐을 수 있습니다.\n"
      + "  무료 플랜은 한동안 안 쓰면 저절로 멈춥니다.\n"
      + "  supabase.com 대시보드에서 프로젝트를 열어 «Restore» 를 누르면 살아납니다.", "err");
    return false;
  }
  const on = !!data.session;
  $("#gate").hidden = on;
  $("#main").hidden = !on;
  return on;
}
$("#loginBtn").onclick = async () => {
  const email = $("#em").value.trim(), password = $("#pw").value;
  if(!email || !password) return say($("#am"), "이메일과 비밀번호를 넣어 주세요.", "err");
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if(error) return say($("#am"), "로그인하지 못했습니다 — " + error.message, "err");
  /* boot 은 bootFor 가 한 번만 돌린다 (로그인 알림과 겹쳐도 두 번 돌지 않게) */
  if(await gate()){
    let uid = null;
    try{ uid = (await sb.auth.getSession())?.data?.session?.user?.id || null; }catch(e){globalThis.__q?.(e)}
    bootFor(uid);
  }
};
$("#logoutBtn").onclick = async () => { await sb.auth.signOut(); gate(); };

/* ═══════════════════════════════════════════════
   실기 과목 — 필기 과목과 따로 관리한다
   "공조냉동 필기"와 "공조냉동 실기"는 범위도 형식도 다르고, 실기만 있는 종목도 있다.
   같은 목록을 쓰면 필기에만 있는 과목이 실기 칸에 뜨고 반대도 마찬가지라 헷갈린다.
   ═══════════════════════════════════════════════ */
let SUBJECTS = [];
async function loadSubjects(){
  const { data, error } = await sb.from("practical_subjects").select("*")
    .order("sort_order").order("id");
  if(error){
    const miss = /practical_subjects|schema cache/i.test(error.message || "");
    $("#fSub").innerHTML = `<option value="">${miss ? "과목 표 없음" : "불러오기 실패"}</option>`;
    $("#impSub").innerHTML = $("#fSub").innerHTML;
    say($("#im"), miss
      ? "실기 과목 표가 아직 없습니다 — supabase-실기.sql 을 다시 한 번 돌려 주세요."
      : "과목을 불러오지 못했습니다 — " + error.message, "err");
    return;
  }
  SUBJECTS = data || [];
  const opt = SUBJECTS.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
  $("#fSub").innerHTML   = opt || `<option value="">과목을 먼저 만드세요</option>`;
  $("#impSub").innerHTML = opt || `<option value="">과목을 먼저 만드세요</option>`;
  const keep = localStorage.getItem("prac:sub");
  if(keep && SUBJECTS.some(s => String(s.id) === keep)){ $("#fSub").value = keep; $("#impSub").value = keep; }
  const has = !!SUBJECTS.length;
  $("#subRen").disabled = !has; $("#subDel").disabled = !has;
  if(!has) $("#list").innerHTML = `<div class="empty">실기 과목이 아직 없습니다. <b>+ 과목</b> 을 눌러
    "전기기사 실기" 처럼 이름을 지어 주세요.</div>`;
}

$("#subAdd").onclick = async () => {
  const name = prompt("실기 과목 이름 (예: 전기기사 실기)", "");
  if(name === null) return;
  if(!name.trim()) return;
  const r = await sb.from("practical_subjects")
    .insert({ name:name.trim(), sort_order:(SUBJECTS.at(-1)?.sort_order ?? 0) + 1 }).select().single();
  if(r.error) return say($("#im"), "만들지 못했습니다 — " + r.error.message, "err");
  await loadSubjects();
  $("#fSub").value = r.data.id; $("#impSub").value = r.data.id;
  localStorage.setItem("prac:sub", String(r.data.id));
  await loadList(); paintScope(); await loadFiles();
};

$("#subRen").onclick = async () => {
  const id = +$("#fSub").value; if(!id) return;
  const cur = SUBJECTS.find(s => s.id === id);
  const name = prompt("과목 이름", cur?.name || "");
  if(name === null || !name.trim()) return;
  const r = await sb.from("practical_subjects").update({ name:name.trim() }).eq("id", id);
  if(r.error) return say($("#im"), "바꾸지 못했습니다 — " + r.error.message, "err");
  await loadSubjects();
};

$("#subDel").onclick = async () => {
  const id = +$("#fSub").value; if(!id) return;
  const cur = SUBJECTS.find(s => s.id === id);
  const { count } = await sb.from("practicals").select("id", { count:"exact", head:true }).eq("subject_id", id);
  if(count) return say($("#im"),
    `"${cur?.name}" 에 문제 ${count}개가 들어 있어 지울 수 없습니다.\n문제를 먼저 정리하거나 이름만 바꿔 쓰세요.`, "err");
  if(!confirm(`"${cur?.name}" 과목을 지웁니다.`)) return;
  const r = await sb.from("practical_subjects").delete().eq("id", id);
  if(r.error) return say($("#im"), "지우지 못했습니다 — " + r.error.message, "err");
  localStorage.removeItem("prac:sub");
  await loadSubjects(); await loadList({ force:true }); await loadFiles();
};

/* ═══════════════════════════════════════════════
   목록 그리기
   ═══════════════════════════════════════════════ */
let ROWS = [], HIDE_ALL = true, EZ_HIDE = false, RAND = null;

/* ══════════════════════════════════════════════════════════════
   v234 — 한 번 받은 문항은 이 기기에 두고 쓴다 (Supabase 전송량)

   예전에는 이 화면이 열릴 때마다 practicals 표를 «통째로» 다시 받았다.
   select("*") 는 문제·답안 글, 쉬운 풀이, 필기 자국까지 전부 딸려 오므로
   한 번에 수 MB 다. 탭을 옮겼다 돌아오기만 해도 그만큼이 또 나갔다.

   이제는
     ① 받은 것을 브라우저 안(IndexedDB)에 넣어 둔다,
     ② 다음에 열 때는 «줄 수만» 가볍게 물어본다 (head 요청 — 본문 0바이트),
     ③ 줄 수가 같으면 캐시를 그대로 쓴다. 다르면 그때만 다시 받는다.
   이 화면에서 고친 내용(해설·글자 변환 등)은 메모리에 그대로 남으므로
   자리를 뜰 때 캐시에도 같이 적어 둔다.
   손으로 다시 받고 싶으면 «↻ 새로 받기» 를 누른다.
   ══════════════════════════════════════════════════════════════ */
const RCACHE = (() => {
  const DB = "gichul-cache", ST = "rows";
  let p = null;
  const open = () => p || (p = new Promise((res, rej) => {
    const q = indexedDB.open(DB, 1);
    q.onupgradeneeded = () => { try{ q.result.createObjectStore(ST); }catch(e){globalThis.__q?.(e)} };
    q.onsuccess = () => res(q.result);
    q.onerror   = () => rej(q.error);
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(ST, mode), r = fn(t.objectStore(ST));
      r.onsuccess = () => res(r.result);
      r.onerror   = () => rej(r.error);
    });
  };
  return {
    get: k => run("readonly",  s => s.get(k)).catch(() => null),
    put: (k, v) => run("readwrite", s => s.put(v, k)).catch(() => null),
    del: k => run("readwrite", s => s.delete(k)).catch(() => null)
  };
})();

let CACHE_SID = null;          /* 지금 메모리에 올라와 있는 과목 */
/* ★ v287 — 북마크 한 곳 { id: {on, at} }. 처음 한 번, 예전 거르기별 북마크를 모아 옮긴다 */
window.__favAll = () => {
  try{
    const raw = localStorage.getItem('prac:fav:v1');
    if(raw) return JSON.parse(raw) || {};
    const F = {}, now = Date.now();
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i); if(!/^pracux:|^prac:ux:/.test(k || '')) continue;
      try{ const o = JSON.parse(localStorage.getItem(k) || '{}'); Object.keys((o && o.fav) || {}).forEach(id => { if(o.fav[id]) F[String(id)] = { on:true, at:now }; }); }catch(e){globalThis.__q?.(e)}
    }
    localStorage.setItem('prac:fav:v1', JSON.stringify(F));
    return F;
  }catch(e){ return {}; }
};
window.__favSave = F => { try{ localStorage.setItem('prac:fav:v1', JSON.stringify(F)) }catch(e){globalThis.__q?.(e)} };
function cacheSaveRows(){      /* 이 화면에서 고친 것을 캐시에도 반영 */
  if(!CACHE_SID || !Array.isArray(ROWS) || !ROWS.length) return;
  try{ RCACHE.put("rows:" + CACHE_SID, { at:Date.now(), rows:ROWS }); }catch(e){globalThis.__q?.(e)}
}
document.addEventListener("visibilitychange", () => { if(document.hidden) cacheSaveRows(); });
addEventListener("pagehide", cacheSaveRows);
window.__pracRefetch = () => { try{ RCACHE.del("rows:" + (+$("#fSub").value || 0)); }catch(e){globalThis.__q?.(e)} return loadList({ force:true }); };

/* ── 받아 올 «칸 목록» — 필기 자국(ink)만 뺀다 (v235) ──
   ink 는 획 좌표가 통째로 들어 있어 표에서 제일 무거운 칸이다.
   그런데 목록에서는 한 번도 쓰지 않는다 — 문항을 열었을 때만 필요하다.
   예전에는 select("*") 라 1700문항치 획을 매번 같이 받아 왔다.
   칸 이름을 손으로 적어 두면 나중에 칸이 늘었을 때 빠지므로,
   한 줄만 맛보기로 받아서 «있는 칸 - ink» 로 만든다. */
let COLS = null;
async function listCols(sid){
  if(COLS) return COLS;
  try{
    const { data } = await sb.from("practicals").select("*").eq("subject_id", sid).limit(1);
    const k = data && data[0] ? Object.keys(data[0]) : null;
    if(k && k.length) return (COLS = k.filter(c => c !== "ink").join(","));
  }catch(e){globalThis.__q?.(e)}
  return "*";                                   /* 못 알아냈으면 예전처럼 전부 */
}

/* 필기 자국은 «있는 것만» 따로 받는다 — 대개 몇 문항뿐이라 아주 가볍다 */
async function inkSync(sid){
  if(!sb) return;
  try{
    const { data, error } = await sb.from("practicals").select("id,ink")
      .eq("subject_id", sid).not("ink", "is", null);
    if(error || !Array.isArray(data)) return;
    let n = 0;
    data.forEach(d => {
      const row = ROWS.find(r => String(r.id) === String(d.id));
      if(row) row.ink = d.ink;
      ["q","a"].forEach(side => {
        const srv = d.ink && d.ink[side];
        if(!Array.isArray(srv) || !srv.length) return;
        const k = `${d.id}:${side}`;
        let mine = INK[k];
        if(!mine){
          try{ mine = JSON.parse(localStorage.getItem(`pink:${d.id}:${side}`) || "[]"); }catch(e){ mine = []; }
        }
        if(srv.length > (mine || []).length){ INK[k] = srv; n++; }
      });
    });
    if(n) document.querySelectorAll(".inkc").forEach(c => c._redraw?.());
  }catch(e){globalThis.__q?.(e)}
}

async function loadList(opt){
  const sid = +$("#fSub").value;
  if(!sid) return;
  const force = !!(opt && opt.force);
  localStorage.setItem("prac:sub", String(sid));
  $("#list").innerHTML = `<div class="empty">불러오는 중…</div>`;

  /* ── ① 캐시가 쓸 만한지 먼저 본다 ── */
  let out = null;
  if(!force){
    const hit = await RCACHE.get("rows:" + sid);
    if(hit && Array.isArray(hit.rows) && hit.rows.length){
      let same = false;
      try{
        const { count, error } = await sb.from("practicals")
          .select("id", { count:"exact", head:true }).eq("subject_id", sid);
        /* 못 물어봤으면(오프라인 등) 여섯 시간까지는 캐시를 믿는다 */
        same = error ? (Date.now() - (hit.at || 0) < 6 * 3600e3) : (count === hit.rows.length);
      }catch(e){ same = true; }
      if(same) out = hit.rows;
    }
  }

  /* ── ② 캐시가 없거나 어긋나면 그때만 다시 받는다 ── */
  if(!out){
    out = [];
    const cols = await listCols(sid);
    /* 한 요청에 1000줄까지만 오므로 끝까지 이어 받는다 */
    for(let from = 0; from < 20000; from += 1000){
      const { data, error } = await sb.from("practicals").select(cols)
        .eq("subject_id", sid).order("year", { ascending:false })
        .order("session", { ascending:false }).order("no")
        .range(from, from + 999);
      if(error){
        return void ($("#list").innerHTML = `<div class="empty">${/practicals|schema cache/i.test(error.message)
          ? "실기 표가 아직 없습니다 — <b>supabase-실기.sql</b> 을 먼저 돌려 주세요."
          : esc(error.message)}</div>`);
      }
      out.push(...(data || []));
      if(!data || data.length < 1000) break;
    }
    try{ await RCACHE.put("rows:" + sid, { at:Date.now(), rows:out }); }catch(e){globalThis.__q?.(e)}
  }
  ROWS = out;
  CACHE_SID = sid;

  /* ★ v231 — 문제집(가짜 연도)을 목록 뒤로 보낸다.
     표에서 «연도 내림차순» 으로 받아 오는데, 9523(소방)·9425(단답)·9302(핵심빈출)
     같은 이름표가 2026 보다 크다. 그래서 아무 거르개 없이 열면 목록 맨 위가
     언제나 소방 시퀀스 문제였다 — 정작 풀어야 할 최신 기출은 한참 아래에 있었다.
     이름표는 «회차가 없는 자료» 에 붙인 번호일 뿐이므로 정렬에서 뒤로 뺀다. */
  const realY = r => ((+r.year > 0 && +r.year < 3000) ? 0 : 1);
  ROWS.sort((a,b) =>
    realY(a) - realY(b) ||
    ((+b.year||0) - (+a.year||0)) ||
    ((+b.session||0) - (+a.session||0)) ||
    ((+a.no||0) - (+b.no||0)));

  const years = [...new Set(ROWS.map(r => r.year))].sort((a,b) => b-a);
  $("#fYear").innerHTML = `<option value="">모든 연도</option>` + years.map(y => `<option>${y}</option>`).join("");
  const sess = [...new Set(ROWS.map(r => r.session))].sort();
  $("#fSess").innerHTML = `<option value="">모든 회차</option>` + sess.map(s => `<option value="${s}">제${s}회</option>`).join("");
  /* 표시(막히는 곳)는 화면에 그리기 전에 같이 받아 둔다 — 없으면 넘어간다 */
  try{ await loadMarks(ROWS.map(r => r.id), sid); }catch(e){ MARKS = {}; }
  drawList();
  setTimeout(() => inkSync(sid), 400);          /* 필기 자국은 화면을 그린 뒤 조용히 */
}

/* ── 한 문항씩 보기 ── */
let ONEUP = localStorage.getItem("prac:oneup") !== "0";
let ONEAT = 0;          // 지금 보고 있는 순번
let SHOWN = [];         // 화면에 걸린 문항들(거른 뒤)
/* UX 확장 레이어가 기존 학습 상태를 읽기 위한 read-only 공개 */
try{Object.defineProperty(window,"SHOWN",{configurable:true,get:()=>SHOWN});Object.defineProperty(window,"ONEAT",{configurable:true,get:()=>ONEAT});}catch(e){globalThis.__q?.(e)}

function applyOneUp(){
  document.body.classList.toggle("oneup", ONEUP);
  $("#fOne")?.classList.toggle("on", ONEUP);
  if(ONEUP) showAt(Math.min(ONEAT, Math.max(0, SHOWN.length - 1)));
  else $$("#list > .pcard").forEach(c => c.classList.add("show"));
}

function drawRail(){
  if(!ONEUP) return;
  /* 1200장을 전부 단추로 만들면 폰에서 눈에 띄게 버벅인다.
     지금 자리 앞뒤 60개만 만들고, 끝에는 «처음/끝으로» 를 붙인다. */
  const W = 60;
  const a = Math.max(0, ONEAT - W), b = Math.min(SHOWN.length, ONEAT + W + 1);
  /* ★ v253 — 내용이 그대로면 다시 그리지 않는다.
     다시 그릴 때마다 스크롤 자리가 0으로 돌아가고 단추가 손 밑에서 사라졌다. */
  const railHtml =
    (a > 0 ? `<button class="pb" type="button" data-go="0">↤ 처음</button>` : "")
    + SHOWN.slice(a, b).map((r, k) => {
      const i = a + k;
      const has = (MARKS[r.id] || []).length;
      return `<button class="pb ${i === ONEAT ? "now" : ""} ${has ? "mark" : ""} ${r.easy_md ? "easy" : ""}"
        type="button" data-go="${i}" data-y="${r.year}">${r.year % 100}-${r.session} ${r.no}</button>`
        + (window.__grpTail ? window.__grpTail(r) : "");   /* ★ v269 — 묶음 ▼ 꼬리도 같이 그린다 */
    }).join("")
    + (b < SHOWN.length ? `<button class="pb" type="button" data-go="${SHOWN.length - 1}">끝 ↦</button>` : "");
  const railEl = $("#prail");
  if(railEl.__sig !== railHtml){
    railEl.__sig = railHtml;
    railEl.innerHTML = railHtml;
    $$("#prail .pb").forEach(b => b.onclick = () => showAt(+b.dataset.go));
  }
  /* ★ 방금 안(innerHTML)을 통째로 새로 짰다 — 스크롤 자리는 이미 0으로 리셋된 뒤다.
     여기서 «부드럽게» 옮기면 0으로 훅 꺼졌다가 다시 스르륵 돌아오는 것처럼 보인다
     (반동처럼 느껴지는 원인). 새로 그린 직후 한 번은 즉시 자리를 잡는다.
     ★ v253 — 다만 «문항이 바뀐 때» 만. 예전에는 다시 그릴 때마다 끌어다 놓아서
       옆 회차를 보려고 밀어 둔 자리가 번번이 날아갔다. */
  const nowBtn = $("#prail .pb.now");
  if(railEl && nowBtn && railEl.__at !== ONEAT){
    railEl.__at = ONEAT;
    const prevSB = railEl.style.scrollBehavior;
    railEl.style.scrollBehavior = "auto";
    nowBtn.scrollIntoView({ block:"nearest", inline:"center" });
    railEl.style.scrollBehavior = prevSB || "";
  }
}

function showAt(i){
  if(!SHOWN.length) return;
  ONEAT = Math.max(0, Math.min(i, SHOWN.length - 1));
  const want = String(SHOWN[ONEAT].id);
  /* 만들어 둔 창(앞뒤 12장) 밖으로 나가면 그 자리를 중심으로 다시 만든다 */
  if(ONEUP && !document.querySelector(`#list > .pcard[data-id="${want}"]`)){
    drawList();
    return;
  }
  $$("#list > .pcard").forEach(c => c.classList.toggle("show", c.dataset.id === want));
  const r = SHOWN[ONEAT];
  $("#pnavAt").textContent = `${ONEAT + 1} / ${SHOWN.length} · ${r.year}년 제${r.session}회 ${r.no}번`;
  drawRail(); edgeSync();
  document.querySelector("#list > .pcard.show")?.scrollIntoView({ block:"start" });
  swipeMark();
}

/* ══════════════════════════════════════════════════════
   손가락으로 좌우 넘기기 — 필기뷰어와 같은 감각으로
   ──────────────────────────────────────────────────────
   스크롤만으로 죽 훑으면 지금 몇 번째를 보고 있는지 감이 안 온다.
   한 문항씩 보기에서는 옆으로 밀어 넘긴다.

   조심할 것 세 가지.
   · 그림을 확대해 둔 상태에서는 «그림을 끄는 것» 이 우선이라 넘기지 않는다.
   · 세로로 긋는 손짓은 스크롤이다. 가로가 세로보다 확실히 우세할 때만 넘김으로 본다.
   · 마우스는 아예 안 받는다. 글자를 고르다 화면이 넘어가면 형광펜을 못 칠한다.
   ══════════════════════════════════════════════════════ */
let SW = null;
function swipeMark(){
  const card = document.querySelector("#list > .pcard.show");
  if(card) card.style.transform = "";
}
(function attachSwipe(){
  const host = $("#list"); if(!host) return;
  host.addEventListener("pointerdown", e => {
    if(!ONEUP) return;
    if(e.target.closest("[data-pz].zoomed, .inkc, textarea, input, select, button, a, .qsrc")) return;
    /* ★ 마우스도 받는다. 다만 «글자 위» 에서 시작한 끌기는 글자를 고르는 것이므로 건너뛴다.
       빈 여백·그림 위에서 끌 때만 넘김으로 본다. 그래서 형광펜을 칠하다 화면이
       넘어가는 일은 여전히 없다. */
    if(e.pointerType === "mouse"){
      if(e.button !== 0) return;
      if(e.target.closest(".qmd, .easybox, .mkb, .qtext, .plabel, p, li, td, th, h4")) return;
    }
    SW = { x:e.clientX, y:e.clientY, id:e.pointerId, lock:null, mouse:e.pointerType === "mouse",
           card:document.querySelector("#list > .pcard.show") };
  }, { passive:true });

  host.addEventListener("pointermove", e => {
    if(!SW || e.pointerId !== SW.id) return;
    const dx = e.clientX - SW.x, dy = e.clientY - SW.y;
    if(SW.lock === null){
      if(Math.abs(dx) < 16 && Math.abs(dy) < 16) return;
      SW.lock = Math.abs(dx) > Math.abs(dy) * 1.5 ? "h" : "v";
    }
    if(SW.lock !== "h") return;
    e.preventDefault();
    /* 끄는 만큼 살짝 따라오게 — 넘어간다는 느낌이 있어야 손이 안 헛돈다.
       끝에서는 절반만 움직여 «더 없다» 를 몸으로 알린다. */
    const edge = (dx > 0 && ONEAT <= 0) || (dx < 0 && ONEAT >= SHOWN.length - 1);
    if(SW.card) SW.card.style.transform = `translateX(${dx * (edge ? .25 : .55)}px)`;
  }, { passive:false });

  const end = e => {
    if(!SW || (e.pointerId != null && e.pointerId !== SW.id)) return;
    const dx = (e.clientX ?? SW.x) - SW.x;
    const card = SW.card, lock = SW.lock, SWMOUSE = SW.mouse;
    SW = null;
    if(card){ card.style.transition = "transform .16s"; card.style.transform = "";
      setTimeout(() => { card.style.transition = ""; }, 200); }
    if(lock !== "h") return;
    const MIN = lock === "h" && SWMOUSE ? 110 : 60;  /* 마우스는 더 많이 끌어야 넘어간다 */
    if(Math.abs(dx) < MIN) return;
    showAt(ONEAT + (dx < 0 ? 1 : -1));
    edgeWake?.();
  };
  /* ── 트랙패드 옆쓸기 · Shift+휠 ──
     노트북에서 두 손가락으로 옆으로 쓰는 손짓이 가장 자연스럽다.
     한 번 넘긴 뒤에는 관성으로 계속 넘어가지 않게 잠깐 잠근다. */
  let wheelLock = 0;
  host.addEventListener("wheel", e => {
    if(!ONEUP) return;
    const dx = e.shiftKey ? e.deltaY : e.deltaX;
    if(Math.abs(dx) < 28 || Math.abs(dx) < Math.abs(e.deltaY) * 1.2 && !e.shiftKey) return;
    if(e.target.closest("[data-pz].zoomed, .qsrc[open]")) return;
    const now = Date.now();
    if(now - wheelLock < 420) return;
    wheelLock = now;
    e.preventDefault();
    showAt(ONEAT + (dx > 0 ? 1 : -1));
    edgeWake?.();
  }, { passive:false });

  host.addEventListener("pointerup", end);
  host.addEventListener("pointercancel", end);
  host.addEventListener("pointerleave", end);
})();

/* ── 화면 좌우 넘김 단추 ──
   한 문항씩 보기일 때만 나온다. 스크롤할 때 잠깐 또렷해졌다가 다시 흐려진다. */
let EDGE_T = null;
function edgeWake(){
  const a = $("#edgePrev"), b = $("#edgeNext"); if(!a || !b) return;
  a.classList.add("wake"); b.classList.add("wake");
  clearTimeout(EDGE_T);
  EDGE_T = setTimeout(() => { a.classList.remove("wake"); b.classList.remove("wake"); }, 1600);
}
function edgeSync(){
  const a = $("#edgePrev"), b = $("#edgeNext"); if(!a || !b) return;
  a.disabled = !ONEUP || ONEAT <= 0;
  b.disabled = !ONEUP || ONEAT >= SHOWN.length - 1;
}
$("#edgePrev")?.addEventListener("click", () => { showAt(ONEAT - 1); edgeWake(); });
$("#edgeNext")?.addEventListener("click", () => { showAt(ONEAT + 1); edgeWake(); });
addEventListener("scroll", edgeWake, true);
addEventListener("wheel",  edgeWake, { passive:true });

$("#fOne").onclick = () => {
  ONEUP = !ONEUP;
  localStorage.setItem("prac:oneup", ONEUP ? "1" : "0");
  applyOneUp();
};
$$("#pnav [data-step]").forEach(b => b.onclick = () => showAt(ONEAT + (+b.dataset.step)));
$$("#pnav [data-jump]").forEach(b => b.onclick = () =>
  showAt(b.dataset.jump === "end" ? SHOWN.length - 1 : 0));
addEventListener("keydown", e => {
  if(!ONEUP || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)) return;
  if(window.__typingIn && window.__typingIn(e)) return;          /* ★ v307 — 글 편집·AI 창 안 */
  if(e.key === "ArrowRight") { e.preventDefault(); showAt(ONEAT + 1); }
  if(e.key === "ArrowLeft")  { e.preventDefault(); showAt(ONEAT - 1); }
});

function drawList(){
  const y = $("#fYear").value, s = $("#fSess").value, q = $("#fQ").value.trim();
  let rows = ROWS;
  if(y) rows = rows.filter(r => String(r.year) === y);
  if(s) rows = rows.filter(r => String(r.session) === s);
  if(q) rows = rows.filter(r => (r.q_text || "").includes(q) || (r.a_text || "").includes(q));

  /* 랜덤은 지금 걸린 조건 안에서만 뽑는다 — 연도를 좁혀 두면 그 안에서, 안 좁혔으면 전체에서.
     뽑은 목록은 다시 누르기 전까지 그대로라, 풀다가 화면을 건드려도 순서가 안 흐트러진다. */
  if(RAND){
    { const byId = new Map(rows.map(r => [r.id, r])); rows = RAND.map(id => byId.get(id)).filter(Boolean); }   /* ★ v312 — 최신순은 2000문항 전부라 find 반복은 느림 */
    if(!rows.length){ RAND = null; return drawList(); }
  }

  if(!rows.length){
    $("#list").innerHTML = `<div class="empty">${ROWS.length ? "조건에 맞는 문제가 없습니다." : "아직 올린 실기 문제가 없습니다. 아래에서 PDF 를 넣어 주세요."}</div>`;
    return;
  }

  /* 한 문항씩 볼 때는 200개 제한이 의미가 없다 — 어차피 한 장만 보이므로 500개까지 걸어 둔다 */
  /* ★ 한 문항씩 보기는 «한 장만» 화면에 나온다. 그런데도 500장에서 잘라
     «1261개 중 500개만 보이고 있습니다» 가 떴다 — 501번째 문항으로는 아예 못 갔다.
     한 문항씩일 때는 자르지 않는다. 대신 화면에는 지금 것과 앞뒤 몇 장만 그린다. */
  /* 한 문항만 다시 변환하거나 해설을 붙여도 위쪽 숫자가 그대로 남아 있었다.
     목록을 다시 그리는 자리에서 같이 고친다. (돌고 있는 중에는 cvCount 가 스스로 비킨다) */
  setTimeout(() => { try{ cvCount(); }catch(e){globalThis.__q?.(e)} }, 0);

  const cap = ONEUP ? rows.length : 200;
  SHOWN = rows.slice(0, cap);
  /* 다 그리면 폰이 멈춘다. 지금 것 앞뒤 12장만 만들고, 넘길 때 다시 그린다. */
  const WIN = 12;
  const draw = ONEUP
    ? SHOWN.slice(Math.max(0, ONEAT - WIN), Math.min(SHOWN.length, ONEAT + WIN + 1))
    : SHOWN;
  $("#list").innerHTML = draw.map(r => {
    const rot = r.rotate ? `transform:rotate(${r.rotate}deg)` : "";
    const marks = MARKS[r.id] || [];
    const dots = t => marks.filter(m => (m.target || "q") === t).map((m, k) =>
      `<button class="mk" type="button" data-mk="${m.id}"
         style="left:${(m.x*100).toFixed(2)}%;top:${(m.y*100).toFixed(2)}%;width:${(m.w*100).toFixed(2)}%;height:${(m.h*100).toFixed(2)}%"
         title="${esc((m.note_md || m.memo || "").slice(0, 60))}"><i>${k+1}</i></button>`).join("");
    const img = (u, alt, t) => `<div class="pz" data-pz data-trim="${esc(u)}"><div class="pz-stage" data-mkhost="${t}" data-qid="${r.id}">
        <img src="${esc(u)}" loading="lazy" alt="${esc(alt)}" style="${rot}">
        <canvas class="inkc"></canvas>${dots(t)}</div></div>`;
    /* 글자로 보기 — 바꿔 둔 것이 있으면 그림 대신 글로 보여 준다.
       원본이 궁금할 때를 위해 접어 둔 «원본 그림» 을 아래에 남긴다. */
    const asText = (u, md, t, alt) => `<div class="qmd" data-qmd="${t}" data-src="${esc(u)}">${mdRich(md)}</div>
      <details class="qsrc"><summary>원본 그림 보기</summary>${img(u, alt, t)}</details>`;
    /* 그림이 아예 없는 줄(글자로만 들어온 줄)은 «그림으로 보기» 여부와 상관없이 글자로 보여 준다.
       예전에는 여기서 그림만 찾다가 «문제 그림이 없습니다» 만 띄웠다 — 글자를 이미 들고 있는데도. */
    const textOnly = (md, t) => `<div class="qmd" data-qmd="${t}">${mdRich(md)}</div>`;
    /* ★ 손으로 고친 글은 «그림으로 보기» 에서도 보여 준다.
       원본 그림은 아래 «원본 그림 보기» 에 그대로 접혀 남는다. */
    const hand = t => { try{ return !!(window.__handMd && window.__handMd(r.id, t)) }catch(e){ return false } };
    const useText = t => (t === "a" ? !!r.a_md : !!r.q_md) && (TEXTMODE || hand(t));
    const block = (u, md, t, alt) =>
      !u ? textOnly(md, t) : (useText(t) ? asText(u, md, t, alt) : img(u, alt, t));

    /* ── 답안칸 ──
       필기뷰어처럼 «가림판» 을 덮어 두고, 눌러야 열린다. */
    const ansBlock = (r.a_url || r.a_md)
      ? `<div class="ans ${HIDE_ALL ? "hide" : ""}" data-ans>
           <button class="ansbtn ${HIDE_ALL ? "" : "on"}" type="button" data-toggle>${HIDE_ALL ? "보기" : "가리기"}</button>
           <div style="margin-top:4px">${block(r.a_url, r.a_md, "a", "답안")}</div>
         </div>`
      : `<div class="noans">
           <b>답안이 붙어 있지 않습니다.</b>
           원본에서 «답안작성» 표시를 못 찾아 잘리지 않았거나, 답안이 다른 파일에 있는 경우입니다.
           <div class="bar" style="margin-top:8px">
             <button class="zb" type="button" data-ansadd="${r.id}">답안 그림 넣기</button>
             <span class="hintx">파일을 고르거나, 캡처해 두고 이 자리를 누른 뒤 <b>Ctrl+V</b></span>
           </div>
         </div>`;

    return `
    <div class="pcard" data-id="${r.id}">
      <div class="phead ovhead" data-ov="${r.id}" title="눌러서 한눈에 보기 (f)">
        <span class="pno">${r.no}</span>
        <span class="pmeta">${r.year}년 제${r.session}회${r.asked ? " · 출제 " + esc(r.asked) : ""}</span>
        ${r.points ? `<span class="ppt">${r.points}점</span>` : ""}
        <span class="cvbadge${r.q_md ? "" : " no"}" title="${
          r.q_md ? (r.q_url ? "글자로 바꿔 둔 문항" : "그림 없이 글자로만 들어온 문항") : "아직 그림만 있습니다"
        }">${r.q_md ? (r.q_url ? "가 글자" : "가 글자만") : "그림"}</span>
        <span class="ovhint">⛶ 한눈에</span>
      </div>
      <div class="pbody">
        <div class="pgrid${SPLIT === 2 ? " split split3" : SPLIT === 1 ? " split" : ""}">
          <section class="pcol pcol-q">
            <div class="plabel">문제</div>
            ${(r.q_url || r.q_md) ? block(r.q_url, r.q_md, "q", `문제 ${r.no}`) : `<div class="empty">문제 그림이 없습니다.</div>`}
          </section>
          <section class="pcol pcol-ans">
            <div class="plabel">답안</div>
            ${ansBlock}
          </section>
          <section class="pcol pcol-ez">
            <div class="ez ${EZ_HIDE ? "hide" : ""}" data-ez>
              <div class="plabel">쉬운 풀이</div>
              <button class="ansbtn ezb ${EZ_HIDE ? "" : "on"}" type="button" data-eztoggle>${EZ_HIDE ? "보기" : "가리기"}</button>
              <div class="easybox${r.easy_md ? "" : " empty"}">${
                r.easy_md ? mdLite(r.easy_md)
                          : `<span class="wait">아직 해설이 없습니다. 아래 «해설 만들기» 또는 위의 «✎ 자동 해설 진행».</span>`}</div>
            </div>
          </section>
        </div>
        <div class="marknotes" data-notes="${r.id}">${marks.map((m, k) => `
          <div class="mknote" data-note="${m.id}">
            <div class="mkh"><b>${k+1}</b><span>${(m.target||"q")==="a"?"답안":"문제"} 부분</span>
              <button class="zb" type="button" data-mkredo="${m.id}">다시 설명</button>
              <button class="zb" type="button" data-mkdel="${m.id}">지우기</button></div>
            <div class="mkb">${m.note_md ? mdLite(m.note_md) : `<span class="wait">아직 설명이 없습니다.</span>`}</div>
          </div>`).join("")}</div>
        <div class="ptools">
          <button class="zb" type="button" data-ov="${r.id}">⛶ 한눈에 보기</button>
          <button class="zb pick" type="button" data-pick="${r.id}">✎ 막히는 곳 표시</button>
          <button class="zb${r.easy_md ? "" : " pick"}" type="button" data-easy="${r.id}">${
            r.easy_md ? "↻ 다시 해석하기" : "✎ 해설 만들기"}</button>
          ${r.easy_md ? `<button class="zb" type="button" data-easyedit="${r.id}">고쳐 쓰기</button>` : ""}
          ${r.easy_md ? `<button class="zb" type="button" data-easydel="${r.id}">해설 지우기</button>` : ""}
          <button class="zb" type="button" data-cv="${r.id}" title="이 문항만 다시 글자로 바꿉니다">${r.q_md ? "↻ 다시 변환" : "가 글자로 변환"}</button>
          <button class="zb" type="button" data-rot="${r.id}" title="90° 씩 돌립니다">↻ 회전${r.rotate ? " " + r.rotate + "°" : ""}</button>
          <button class="zb" type="button" data-swap="${r.id}" title="문제와 답안이 뒤바뀌었을 때">문제 ↔ 답안</button>
          <button class="zb" type="button" data-qdel="${r.id}">삭제</button>
        </div>
      </div>
    </div>`; }).join("")
    + (!ONEUP && rows.length > cap
        ? `<div class="empty">${rows.length}개 중 ${cap}개만 보이고 있습니다.
             연도·회차로 좁히거나, <b>한 문항씩</b> 으로 보면 전부 넘겨 볼 수 있습니다.</div>` : "");

  /* ── 답안 그림을 손으로 붙이기 ──
     원본에 «답안작성» 표시가 없어 못 잘린 문항, 답안이 다른 파일에 있는 문항을
     여기서 바로 채운다. 파일을 고르거나 캡처한 것을 Ctrl+V 로 붙인다. */
  $$("#list [data-ansadd]").forEach(b => b.onclick = () => {
    const id = b.dataset.ansadd;
    ANS_TARGET = id;
    b.closest(".noans")?.classList.add("armed");
    if(!ANS_INPUT){
      ANS_INPUT = document.createElement("input");
      ANS_INPUT.type = "file"; ANS_INPUT.accept = "image/*";
      ANS_INPUT.style.display = "none";
      document.body.appendChild(ANS_INPUT);
    }
    ANS_INPUT.value = "";
    ANS_INPUT.onchange = e => { const f = e.target.files[0]; if(f) putAnswer(id, f); };
    ANS_INPUT.click();
  });

  /* ── 막히는 곳 표시 ── */
  $$("#list [data-pick]").forEach(b => b.onclick = () => startPick(b.dataset.pick, b));

  $$("#list .mk").forEach(b => b.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    const el = $(`#list [data-note="${b.dataset.mk}"]`);
    if(!el) return;
    el.scrollIntoView({ behavior:"smooth", block:"center" });
    el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1200);
  });

  $$("#list [data-mkdel]").forEach(b => b.onclick = async () => {
    if(!confirm("이 표시와 설명을 지웁니다.")) return;
    const { error } = await sb.from("practical_marks").delete().eq("id", b.dataset.mkdel);
    if(error) return log("지우지 못했습니다 — " + error.message);
    await loadMarks(ROWS.map(r => r.id), CACHE_SID); drawList();
  });

  $$("#list [data-mkredo]").forEach(b => b.onclick = async () => {
    const id = b.dataset.mkredo;
    let m = null;
    for(const k in MARKS){ const f = MARKS[k].find(x => String(x.id) === id); if(f){ m = f; break; } }
    if(!m) return;
    const box = $(`#list [data-note="${id}"] .mkb`);
    box.innerHTML = `<span class="wait">그 부분만 다시 읽어 설명하는 중…</span>`;
    try{
      const md = await markExplain(m.practical_id, m.target || "q", m, id);
      m.note_md = md; box.innerHTML = mdLite(md);
    }catch(e){ box.innerHTML = `<span class="wait">설명하지 못했습니다 — ${esc(e.message || e)}</span>`; }
  });

  /* ── 해설 만들기 · 다시 해석하기 ──
     이미 써 둔 해설은 건드리지 않는다. 이 단추를 눌렀을 때만 갈아엎는다. */
  $$("#list [data-easy]").forEach(b => b.onclick = () => {
    const r = ROWS.find(x => String(x.id) === b.dataset.easy);
    if(!r?.q_url && !r?.q_md) return log("문제 그림도 글자도 없습니다.");
    if(r.easy_md && !confirm("지금 해설을 버리고 처음부터 다시 씁니다. 계속할까요?")) return;
    ezMake(r.id, true);
  });
  $$("#list [data-easydel]").forEach(b => b.onclick = () => ezDel(b.dataset.easydel));
  $$("#list [data-ov]").forEach(b => b.onclick = () => ovOpen(b.dataset.ov));

  /* ── 고쳐 쓰기 ──
     AI 해설이 대체로 맞는데 한두 줄만 틀린 경우가 많다. 그때마다 통째로 다시
     만들면 맞았던 부분까지 날아간다. 그래서 그 자리에서 직접 고칠 수 있게 둔다.
     고친 것도 Supabase 에 그대로 남는다. */
  $$("#list [data-easyedit]").forEach(b => b.onclick = () => {
    const r = ROWS.find(x => String(x.id) === b.dataset.easyedit);
    const card = document.querySelector(`.pcard[data-id="${r.id}"]`);
    const box = card?.querySelector(".easybox"); if(!box) return;
    if(box.dataset.editing === "1") return;
    box.dataset.editing = "1";
    const ta = document.createElement("textarea");
    ta.value = r.easy_md || "";
    ta.style.cssText = "width:100%;min-height:320px;font-family:var(--font-m);font-size:12.5px;"
      + "line-height:1.7;padding:11px;border:1.4px solid var(--accent);border-radius:9px;"
      + "background:var(--card);color:var(--ink);resize:vertical";
    const bar = document.createElement("div");
    bar.className = "ptools"; bar.style.marginTop = "8px";
    bar.innerHTML = `<button class="zb pick" type="button" data-esave>저장</button>
      <button class="zb" type="button" data-ecancel>취소</button>
      <span class="hintx">**굵게** 와 - 목록만 씁니다</span>`;
    box.innerHTML = ""; box.append(ta, bar);
    ta.focus();
    bar.querySelector("[data-ecancel]").onclick = () => {
      box.dataset.editing = ""; box.innerHTML = mdLite(r.easy_md || "");
    };
    bar.querySelector("[data-esave]").onclick = async () => {
      const md = ta.value.trim();
      const up = await sb.from("practicals").update({ easy_md: md || null }).eq("id", r.id);
      if(up.error) return alert("저장하지 못했습니다 — " + up.error.message);
      r.easy_md = md || null;
      box.dataset.editing = "";
      if(md) box.innerHTML = mdLite(md); else drawList();
    };
  });
  $$("#list [data-rot]").forEach(b => b.onclick = async () => {
    const r = ROWS.find(x => String(x.id) === b.dataset.rot);
    const next = ((r.rotate || 0) + 180) % 360;      /* 뒤집힌 쪽을 되돌리는 게 대부분이라 180° 씩 */
    const up = await sb.from("practicals").update({ rotate: next }).eq("id", r.id);
    if(up.error) return alert(/rotate|schema cache/i.test(up.error.message)
      ? "rotate 칸이 아직 없습니다 — supabase-실기.sql 을 다시 한 번 돌려 주세요."
      : up.error.message);
    r.rotate = next; drawList();
  });

  $$("#list [data-swap]").forEach(b => b.onclick = async () => {
    const r = ROWS.find(x => String(x.id) === b.dataset.swap);
    const up = await sb.from("practicals").update({
      q_url:r.a_url, a_url:r.q_url, q_text:r.a_text, a_text:r.q_text }).eq("id", r.id);
    if(up.error) return alert(up.error.message);
    [r.q_url, r.a_url] = [r.a_url, r.q_url];
    [r.q_text, r.a_text] = [r.a_text, r.q_text];
    drawList();
  });

  $$("#list [data-qdel]").forEach(b => b.onclick = async () => {
    const r = ROWS.find(x => String(x.id) === b.dataset.qdel);
    if(!confirm(`${r.year}년 제${r.session}회 ${r.no}번을 지웁니다.`)) return;
    const del = await sb.from("practicals").delete().eq("id", r.id);
    if(del.error) return alert(del.error.message);
    await dropFigs([r]);                       /* 저장소에 남는 그림도 같이 치운다 */
    ROWS = ROWS.filter(x => x.id !== r.id);
    drawList();
  });

  $$("#list [data-toggle]").forEach(b => b.onclick = () => ansToggle(b.closest(".pcard")));
  $$("#list [data-eztoggle]").forEach(b => b.onclick = () => ezToggle(b.closest(".pcard")));
  $$("#list .pbody > [data-pz]").forEach(attachZoom);
  /* 접어 둔 «원본 그림» 은 펼칠 때 붙인다 — 안 보이는 상태에서 재면 크기가 0 이라 어긋난다 */
  $$("#list .qsrc").forEach(d => d.addEventListener("toggle", () => {
    if(!d.open) return;
    d.querySelectorAll("[data-pz]:not([data-zoomed])").forEach(el => {
      el.dataset.zoomed = "1";
      try{ attachZoom(el); }catch(e){globalThis.__q?.(e)}
    });
  }));

  /* ── 이 문항만 글자로 변환 ── */
  $$("#list [data-cv]").forEach(b => b.onclick = async () => {
    const r = ROWS.find(x => String(x.id) === b.dataset.cv);
    if(!r?.q_url && !r?.a_url) return log("그림이 없습니다.");
    if(r.q_md && !confirm("지금 글자를 버리고 처음부터 다시 옮깁니다. 계속할까요?")) return;
    const old = b.textContent; b.disabled = true; b.textContent = "옮기는 중…";
    try{ await cvRow(r, true); TEXTMODE = true; paintText(); drawList(); }
    catch(e){ b.disabled = false; b.textContent = old; alert("변환하지 못했습니다 — " + (e.message || e)); }
  });

  /* 수식을 그리고, [[그림]] 자리를 원본에서 오려 채운다 */
  $$("#list .qmd").forEach(el => { tex(el); figFill(el, el.dataset.src); });
  /* 그림의 흰 여백을 좁힌다 (원본은 그대로 두고 «보이는 창» 만 줄인다) */
  applyTrim($("#list"));

  /* 새로 그린 뒤 한 문항씩 모드를 다시 적용한다 */
  if(ONEAT >= SHOWN.length) ONEAT = 0;
  applyOneUp();
  setTimeout(cvCount, 0);
}

["#fYear","#fSess"].forEach(k => $(k).onchange = () => { RAND = null; paintRand(); drawList(); });
$("#fQ").oninput = () => { clearTimeout(window._t); window._t = setTimeout(() => { RAND = null; paintRand(); drawList(); }, 250); };

function paintRand(){
  $("#fRand").classList.toggle("on", !!RAND);
  $("#fRand").textContent = RAND ? `🎲 랜덤 해제 (${RAND.length})` : "🎲 랜덤";
}
$("#fRand").onclick = () => {
  if(RAND){ RAND = null; paintRand(); return drawList(); }
  const y = $("#fYear").value, s = $("#fSess").value;
  let pool = ROWS;
  if(y) pool = pool.filter(r => String(r.year) === y);
  if(s) pool = pool.filter(r => String(r.session) === s);
  /* ★ 예전에는 «등급·유형» 을 무시하고 전체에서 뽑았다. 그래서 20문항을 뽑아도
     뒤에서 걸러지며 16문항만 남는 일이 생겼다. 이제 걸러진 뒤의 것에서 뽑는다. */
  try{ if(window.__pracRowPass) pool = pool.filter(window.__pracRowPass); }catch(e){globalThis.__q?.(e)}
  if(!pool.length) return alert("지금 조건에 맞는 문항이 없습니다. 등급·유형을 조금 풀어 보세요.");
  const want = $("#fRandN").value;
  const n = (want === "all") ? pool.length : +want;
  RAND = [...pool].sort(() => Math.random() - .5).slice(0, n).map(r => r.id);
  HIDE_ALL = true;                                  /* 랜덤은 풀어 보는 용도라 답안을 가린 채로 시작한다 */
  $("#fAns").classList.add("on"); $("#fAns").textContent = "답안 모두 가리기";
  paintRand(); drawList();
};
$("#fRandN").onchange = () => { if(RAND) $("#fRand").onclick(); };
$("#fSub").onchange = async () => {
  await loadList();
  /* 과목이 바뀌면 자료함의 연도·회차 목록도 새 과목 것으로 갈아 끼운다 */
  $("#aYear").innerHTML = `<option value="">연도 전체</option>`;
  $("#aSess").innerHTML = `<option value="">회차 전체</option>`;
  paintScope();
  await loadFiles();
};
$("#fAns").onclick = () => {
  HIDE_ALL = !HIDE_ALL;
  $("#fAns").classList.toggle("on", HIDE_ALL);
  $("#fAns").textContent = HIDE_ALL ? "답안 모두 가리기" : "답안 모두 보이기";
  drawList();
};
$("#fAns").classList.add("on");

/* 쉬운 풀이도 답안과 똑같이 «모두» 와 «하나씩» 을 함께 둔다.
   풀이를 먼저 보면 푼 게 아니라 읽은 것이 되어 버린다. */
$("#fEz").onclick = () => {
  EZ_HIDE = !EZ_HIDE;
  $("#fEz").classList.toggle("on", EZ_HIDE);
  $("#fEz").textContent = EZ_HIDE ? "쉬운 풀이 모두 가리기" : "쉬운 풀이 모두 보이기";
  drawList();
};
function ezToggle(card){
  const box = card?.querySelector("[data-ez]"); if(!box) return;
  const hid = box.classList.toggle("hide");
  const b = box.querySelector("[data-eztoggle]");
  if(b){ b.textContent = hid ? "보기" : "가리기"; b.classList.toggle("on", !hid); }
}

/* ── 답안 그림 붙이기 ── */
let ANS_TARGET = null, ANS_INPUT = null;

async function putAnswer(id, file){
  if(!/^image\//.test(file.type)) return log("이미지 파일만 붙일 수 있습니다.");
  const r = ROWS.find(x => String(x.id) === String(id));
  if(!r) return;
  log(`${r.year}-${r.session} ${r.no}번 답안 올리는 중…`);
  try{
    /* 폭 1400px 로 줄여 올린다. 캡처 원본을 그대로 올리면 몇 MB 씩 쌓인다. */
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1400 / bmp.width);
    const cv = document.createElement("canvas");
    cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    const g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(bmp, 0, 0, cv.width, cv.height);
    bmp.close?.();
    const blob = await new Promise(res => cv.toBlob(res, "image/jpeg", 0.88));

    const path = `prac/${r.subject_id}/${r.year}_${r.session}_${String(r.no).padStart(2,"0")}_a_manual_${Date.now()}.jpg`;
    const url = await put(path, blob);
    const up = await sb.from("practicals").update({ a_url:url }).eq("id", r.id);
    if(up.error) throw up.error;
    r.a_url = url;
    ANS_TARGET = null;
    log("답안을 붙였습니다.");
    drawList();
  }catch(e){ log("붙이지 못했습니다 — " + niceErr(e)); }
}

/* 답안 넣기를 누른 문항이 있으면 그 문항에, 없으면 무시한다 */
addEventListener("paste", e => {
  if(!ANS_TARGET) return;
  if(/^(INPUT|TEXTAREA)$/.test(e.target?.tagName)) return;
  const it = [...(e.clipboardData?.items || [])].find(x => x.type.startsWith("image/"));
  if(!it) return;
  e.preventDefault();
  const f = it.getAsFile();
  if(f) putAnswer(ANS_TARGET, f);
});

/* ── 네모로 집기 ──
   그림 위에서 끌어 네모를 만든다. 좌표는 그림 크기로 나눈 0~1 비율로 저장하므로
   확대 배율이나 화면 폭이 달라져도 같은 자리에 남는다. */
function startPick(id, btn){
  if(PICKING){ endPick(); return; }
  const card = btn.closest(".pcard");
  const hosts = [...card.querySelectorAll("[data-mkhost]")];
  if(!hosts.length) return log("집을 그림이 없습니다.");
  PICKING = { id, card, hosts, btn };
  btn.classList.add("on"); btn.textContent = "✎ 그만두기";
  card.classList.add("picking");
  log("막히는 곳을 네모로 끌어서 집어 주세요.");

  hosts.forEach(host => {
    host.style.cursor = "crosshair";
    host.__pick = ev => {
      if(ev.button != null && ev.button !== 0) return;
      ev.preventDefault(); ev.stopPropagation();
      const img = host.querySelector("img");
      const box = img.getBoundingClientRect();
      const sx = (ev.clientX - box.left) / box.width, sy = (ev.clientY - box.top) / box.height;
      const sel = document.createElement("div");
      sel.className = "selbox"; host.appendChild(sel);

      const move = e2 => {
        const x1 = Math.min(Math.max((e2.clientX - box.left) / box.width, 0), 1);
        const y1 = Math.min(Math.max((e2.clientY - box.top) / box.height, 0), 1);
        const r = { x:Math.min(sx,x1), y:Math.min(sy,y1), w:Math.abs(x1-sx), h:Math.abs(y1-sy) };
        sel.style.cssText = `left:${r.x*100}%;top:${r.y*100}%;width:${r.w*100}%;height:${r.h*100}%`;
        sel.__r = r;
      };
      const up = async () => {
        host.removeEventListener("pointermove", move);
        host.removeEventListener("pointerup", up);
        const r = sel.__r; sel.remove();
        if(!r || r.w < 0.02 || r.h < 0.01){ log("너무 작습니다. 조금 더 크게 끌어 주세요."); return; }
        await addMark(id, host.dataset.mkhost, r);
      };
      host.addEventListener("pointermove", move);
      host.addEventListener("pointerup", up, { once:true });
    };
    host.addEventListener("pointerdown", host.__pick);
  });
}

function endPick(){
  if(!PICKING) return;
  PICKING.hosts.forEach(h => { h.style.cursor = ""; if(h.__pick) h.removeEventListener("pointerdown", h.__pick); });
  PICKING.card.classList.remove("picking");
  PICKING.btn.classList.remove("on"); PICKING.btn.textContent = "✎ 막히는 곳 표시";
  PICKING = null;
}

async function addMark(id, target, rect){
  endPick();
  const ins = await sb.from("practical_marks").insert({
    practical_id: +id, target, x: rect.x, y: rect.y, w: rect.w, h: rect.h
  }).select("*").single();
  if(ins.error) return log(/practical_marks|schema cache/i.test(ins.error.message)
    ? "supabase-실기.sql 을 다시 돌려 주세요 (practical_marks 표가 없습니다)."
    : "표시하지 못했습니다 — " + ins.error.message);
  (MARKS[+id] ||= []).push(ins.data);
  drawList();
  /* 표시부터 화면에 남기고, 설명은 뒤이어 채운다 — 실패해도 표시는 남는다 */
  const box = $(`#list [data-note="${ins.data.id}"] .mkb`);
  if(box) box.innerHTML = `<span class="wait">그 부분만 읽어 설명하는 중…</span>`;
  try{
    const md = await markExplain(id, target, rect, ins.data.id);
    ins.data.note_md = md;
    const b2 = $(`#list [data-note="${ins.data.id}"] .mkb`);
    if(b2) b2.innerHTML = mdLite(md);
  }catch(e){
    const b2 = $(`#list [data-note="${ins.data.id}"] .mkb`);
    if(b2) b2.innerHTML = `<span class="wait">설명하지 못했습니다 — ${esc(e.message || e)}. «다시 설명» 을 눌러 보세요.</span>`;
  }
}

/* ── 두 손가락으로 넓히고 끌기 ── */
function attachZoom(wrap){
  const stage = wrap.querySelector(".pz-stage");
  if(!stage || wrap.dataset.zon === "1") return;
  wrap.dataset.zon = "1";
  let k = 1, tx = 0, ty = 0, start = null, lastTap = 0;
  const pts = new Map();
  const apply = () => {
    const z = k > 1.01;
    if(!z){ tx = 0; ty = 0; }
    else {
      tx = Math.min(0, Math.max(wrap.clientWidth  - stage.offsetWidth  * k, tx));
      ty = Math.min(0, Math.max(wrap.clientHeight - stage.offsetHeight * k, ty));
    }
    stage.style.transform = `translate(${tx}px,${ty}px) scale(${k})`;
    wrap.classList.toggle("zoomed", z);
    wrap.style.height = z ? wrap.clientHeight + "px" : "";
    const lv = wrap.parentElement.querySelector(".lv");
    if(lv) lv.textContent = Math.round(k * 100) + "%";
  };
  const zoomTo = (nk, cx, cy) => {
    const b = wrap.getBoundingClientRect();
    const px = (cx ?? b.width/2) - b.left, py = (cy ?? b.height/2) - b.top;
    const old = k; k = Math.min(6, Math.max(1, nk));
    tx = px - (px - tx) * (k/old); ty = py - (py - ty) * (k/old);
    apply();
  };
  wrap.addEventListener("pointerdown", e => {
    pts.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if(pts.size === 1){
      const now = Date.now();
      if(now - lastTap < 300){ zoomTo(k > 1.01 ? 1 : 2.4, e.clientX, e.clientY); lastTap = 0; return; }
      lastTap = now;
      if(k > 1.01){ start = { x:e.clientX, y:e.clientY, tx, ty }; wrap.setPointerCapture(e.pointerId); }
    } else if(pts.size === 2){
      const [a,b] = [...pts.values()];
      start = { d:Math.hypot(a.x-b.x, a.y-b.y), k, cx:(a.x+b.x)/2, cy:(a.y+b.y)/2 };
    }
  });
  wrap.addEventListener("pointermove", e => {
    if(!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if(pts.size === 2 && start?.d){
      const [a,b] = [...pts.values()];
      zoomTo(start.k * (Math.hypot(a.x-b.x, a.y-b.y) / start.d), start.cx, start.cy);
      e.preventDefault();
    } else if(pts.size === 1 && start && k > 1.01){
      tx = start.tx + (e.clientX - start.x); ty = start.ty + (e.clientY - start.y);
      apply(); e.preventDefault();
    }
  });
  ["pointerup","pointercancel","pointerleave"].forEach(t =>
    wrap.addEventListener(t, e => { pts.delete(e.pointerId); if(pts.size < 2) start = null; }));
  wrap.addEventListener("wheel", e => {
    if(!e.ctrlKey && !e.metaKey) return;
    e.preventDefault(); zoomTo(k * (e.deltaY < 0 ? 1.12 : 0.89), e.clientX, e.clientY);
  }, { passive:false });

  const qid = stage.dataset.qid, side = stage.dataset.mkhost;
  const canInk = !!(qid && side && stage.querySelector("canvas.inkc"));
  const card   = wrap.closest(".pcard");
  const ansBox = card?.querySelector("[data-ans]");
  /* 답안 접기·펼치기는 문제 그림 쪽 도구줄에만 단다 (답안 위에 또 달면 어지럽다) */
  const canFold = !!(ansBox && side === "q");

  const tools = document.createElement("div");
  tools.className = "ptools";
  tools.innerHTML = `<button class="zb" type="button" data-z="-">−</button><span class="lv">100%</span>
    <button class="zb" type="button" data-z="+">+</button>
    <button class="zb" type="button" data-z="0">처음</button>`
    + (canInk ? `<span class="sep"></span>
    <button class="zb" type="button" data-inkon title="문제와 답안에 동시에 씁니다">✎ 필기</button>
    <button class="zb hide" type="button" data-inktool="pen">펜</button>
    <button class="zb hide" type="button" data-inktool="hi">형광</button>
    <button class="zb hide" type="button" data-inktool="er">지우개</button>
    ${INK_COLORS.map(c => `<button class="inkswatch hide" type="button" data-inkcolor="${c}" style="background:${c}"></button>`).join("")}
    <button class="zb hide" type="button" data-inkw="1.4" title="얇게">│</button>
    <button class="zb hide" type="button" data-inkw="2.6" title="보통">┃</button>
    <button class="zb hide" type="button" data-inkw="4.6" title="굵게">█</button>
    <button class="zb hide" type="button" data-inkpen title="펜으로만 쓰기 — 손가락은 화면을 굴립니다">✍ 펜만</button>
    <button class="zb hide" type="button" data-inkundo>되돌리기</button>
    <button class="zb hide" type="button" data-inkclear>전부 지우기</button>` : "")
    + (canFold ? `<button class="zb fold" type="button" data-ansfold>답안 펼치기</button>` : "");
  wrap.after(tools);
  tools.onclick = e => {
    const t = e.target.closest("[data-z]");
    if(t) return zoomTo(t.dataset.z === "+" ? k*1.35 : t.dataset.z === "-" ? k/1.35 : 1);
    if(e.target.closest("[data-ansfold]")) ansToggle(card);
  };
  apply();
  if(canFold) ansSync(card);
  if(canInk) attachInk(wrap, stage, tools, qid, side);
}

/* ═══ 답안 접기·펼치기 — 도구줄 단추와 아래 점선 띠가 늘 같은 상태를 가리키게 한다 ═══ */
function ansToggle(card, force){
  const box = card?.querySelector("[data-ans]"); if(!box) return;
  const hid = force === undefined ? box.classList.toggle("hide")
                                  : (box.classList.toggle("hide", force), box.classList.contains("hide"));
  if(!hid){
    box.querySelectorAll("[data-pz]").forEach(attachZoom);   /* 안에서 중복을 막는다 */
    /* 문제 쪽에서 필기를 켜 둔 채 답안을 펼치면, 답안에도 바로 필기가 켜지게 한다 */
    if(card.dataset.inkon === "1") inkBroadcast(card, true);
  }
  ansSync(card);
}
function ansSync(card){
  const box = card?.querySelector("[data-ans]"); if(!box) return;
  const hid = box.classList.contains("hide");
  card.querySelectorAll("[data-ansfold]").forEach(b => {
    b.textContent = hid ? "답안 펼치기" : "답안 접기";
    b.classList.toggle("on", !hid);
  });
  const strip = box.querySelector("[data-toggle]");
  if(strip){ strip.textContent = hid ? "보기" : "가리기"; strip.classList.toggle("on", !hid); }
}

/* 한 카드 안의 모든 그림(문제·답안)에 필기 상태를 한꺼번에 전한다 */
function inkBroadcast(card, on){
  if(!card) return;
  card.dataset.inkon = on ? "1" : "";
  (card._inkSetters || []).forEach(fn => { try{ fn(on); }catch(e){globalThis.__q?.(e)} });
}

/* ═══════════════════════════════════════════════
   필기 — 그림 위에 직접 쓴다
   ───────────────────────────────────────────────
   좌표는 그림을 0~1 로 본 «비율» 로 저장한다.
   확대하든, 폰이든 PC 든, 나중에 더 큰 해상도로 다시 뜨든 같은 자리에 남는다.
   캔버스를 pz-stage 안에 두었으므로 확대하면 글씨도 같이 커진다.

   저장은 두 군데. 브라우저(localStorage)에 바로 남기고,
   practicals.ink 칸이 있으면 거기에도 조용히 올려 다른 기기에서도 보이게 한다.
   (칸이 없으면 그냥 이 기기에만 남는다 — 오류를 띄우지 않는다)
   ═══════════════════════════════════════════════ */
const INK_COLORS = ["#BE2B26", "#1D4ED8", "#137A4B", "#10233D"];
const INK = {};                                   /* `${qid}:${side}` → [stroke, …] */
const inkKey = (qid, side) => `pink:${qid}:${side}`;
let INK_TOOL = "pen", INK_COLOR = INK_COLORS[0];
const inkQueue = new Map();

function inkGet(qid, side){
  const k = `${qid}:${side}`;
  if(INK[k]) return INK[k];
  let v = [];
  try{ v = JSON.parse(localStorage.getItem(inkKey(qid, side)) || "[]"); }catch(e){globalThis.__q?.(e)}
  if(!Array.isArray(v)) v = [];
  /* 서버에 올려 둔 게 있으면 그걸 우선한다 */
  const row = ROWS.find(r => String(r.id) === String(qid));
  const srv = row?.ink?.[side];
  if(Array.isArray(srv) && srv.length > v.length) v = srv;
  return (INK[k] = v);
}
function inkStore(qid, side){
  const k = `${qid}:${side}`, v = INK[k] || [];
  try{ localStorage.setItem(inkKey(qid, side), JSON.stringify(v)); }catch(e){globalThis.__q?.(e)}
  clearTimeout(inkQueue.get(qid));
  inkQueue.set(qid, setTimeout(async () => {
    const row = ROWS.find(r => String(r.id) === String(qid));
    const bag = { ...(row?.ink || {}), [side]: v };
    if(row) row.ink = bag;
    /* ink 칸이 없으면 조용히 넘어간다 — 이 기기에는 이미 남아 있다 */
    await sb.from("practicals").update({ ink: bag }).eq("id", qid);
  }, 1200));
}

function attachInk(wrap, stage, tools, qid, side){
  const cv = stage.querySelector("canvas.inkc");
  const img = stage.querySelector("img");
  if(!cv || !img) return;
  const ctx = cv.getContext("2d");
  let on = false, drawing = false, cur = null;

  let DPR = 1;
  function size(){
    const w = stage.clientWidth, h = stage.clientHeight;
    if(!w || !h) return false;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    if(cv.width !== Math.round(w*DPR) || cv.height !== Math.round(h*DPR)){
      cv.width = Math.round(w*DPR); cv.height = Math.round(h*DPR);
    }
    return true;
  }
  /* 비율(0~1)을 실제 픽셀로 바꿔 그린다.
     좌표계를 통째로 늘리는 방법(setTransform)을 쓰면 세로로 긴 그림에서
     펜 굵기까지 같이 늘어나 붓끝이 타원이 된다. 그래서 점만 손으로 환산한다. */
  function stroke(st){
    if(!st.pts.length) return;
    ctx.save();
    ctx.globalAlpha = st.a ?? 1;
    ctx.strokeStyle = st.c;
    ctx.lineWidth  = (st.w || 2.6) * DPR;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    /* 곧은 선으로 이으면 빨리 그을 때 각이 진다 — 가운뎃점을 잡아 곡선으로 잇는다 */
    const P = st.pts.map(([x,y]) => [x*cv.width, y*cv.height]);
    if(P.length === 1){ ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[0][0]+.6, P[0][1]); }
    else if(P.length === 2){ ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]); }
    else{
      ctx.moveTo(P[0][0], P[0][1]);
      for(let i=1;i<P.length-1;i++){
        const mx=(P[i][0]+P[i+1][0])/2, my=(P[i][1]+P[i+1][1])/2;
        ctx.quadraticCurveTo(P[i][0], P[i][1], mx, my);
      }
      ctx.lineTo(P[P.length-1][0], P[P.length-1][1]);
    }
    ctx.stroke();
    ctx.restore();
  }
  function redraw(){
    if(!size()) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    inkGet(qid, side).forEach(stroke);
  }
  img.complete ? setTimeout(redraw, 0) : img.addEventListener("load", redraw, { once:true });
  new ResizeObserver(redraw).observe(stage);

  const at = e => {
    const b = cv.getBoundingClientRect();
    return [ Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)),
             Math.max(0, Math.min(1, (e.clientY - b.top)  / b.height)) ];
  };
  /* 지우개는 «지나간 자리에 걸린 획» 을 통째로 지운다 — 부분 지우기는 손가락으로 너무 어렵다 */
  function erase(p){
    const list = inkGet(qid, side);
    const R = 0.02;
    const keep = list.filter(st => !st.pts.some(([x,y]) => Math.hypot(x-p[0], y-p[1]) < R));
    if(keep.length !== list.length){
      INK[`${qid}:${side}`] = keep; inkStore(qid, side); redraw();
    }
  }
  /* ── 태블릿 펜(S펜) 대응 ─────────────────────────────────
     · 펜을 한 번 대면 그 뒤로는 손바닥이 닿아도 선이 안 그어진다(팜 리젝션).
       손가락은 그대로 화면을 굴린다.
     · 누르는 세기(pressure)만큼 굵기가 달라진다.
     · 펜 뒤쪽 지우개(buttons&32)를 대면 그대로 지우개가 된다.
     · 태블릿은 초당 수백 번 점을 보낸다 — 삼킨 점(coalesced)까지 받아 각지지 않게 잇는다. */
  function allow(e){
    if(e.pointerType === "pen"){ window.__inkPenSeen = true; return true; }
    if(e.pointerType === "mouse") return true;
    if(window.__inkPenSeen && window.__inkPenOnly !== false) return false;
    return true;
  }
  function widthOf(e){
    const base = INK_TOOL === "hi" ? (window.__inkW || 2.6) * 6 : (window.__inkW || 2.6);
    if(e.pointerType !== "pen") return base;
    const pr = (e.pressure && e.pressure > 0) ? e.pressure : .5;
    return Math.max(base * .45, Math.min(base * 1.9, base * (.45 + pr * 1.3)));
  }
  /* S펜 뒤쪽 지우개·옆 단추는 기기마다 다르게 온다.
     크롬은 지우개를 buttons&32 로, 삼성인터넷·일부 펌웨어는 옆 단추를 buttons&2 로 준다.
     button 값(2·5)으로만 오는 것도 있어 셋 다 받는다. */
  const eraserTip = e => e.pointerType === "pen" &&
    (((e.buttons & 32) === 32) || ((e.buttons & 2) === 2) || e.button === 5 || e.button === 2);

  cv.addEventListener("pointerdown", e => {
    if(!on) return;
    if(!allow(e)) return;
    e.preventDefault(); e.stopPropagation();
    try{ cv.setPointerCapture(e.pointerId); }catch(x){globalThis.__q?.(x)}
    drawing = true;
    if(INK_TOOL === "er" || eraserTip(e)) return erase(at(e));
    const w = widthOf(e);
    cur = INK_TOOL === "hi"
      ? { c:"#FDE047", w, a:.42, pts:[at(e)] }
      : { c:INK_COLOR, w, a:1,   pts:[at(e)] };
    inkGet(qid, side).push(cur);
    redraw();
  });
  cv.addEventListener("pointermove", e => {
    if(!on || !drawing) return;
    if(!allow(e)) return;
    e.preventDefault(); e.stopPropagation();
    /* 빈 배열이 오면 이벤트 자신을 쓴다 — 안 그러면 점이 하나도 안 쌓인다 */
    let evs = null;
    try{ evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null; }catch(x){globalThis.__q?.(x)}
    if(!evs || !evs.length) evs = [e];
    if(INK_TOOL === "er" || eraserTip(e)){ evs.forEach(ev => erase(at(ev))); return; }
    if(!cur) return;
    evs.forEach(ev => cur.pts.push(at(ev)));
    if(e.pointerType === "pen") cur.w = (cur.w * 3 + widthOf(e)) / 4;
    stroke(cur);
  });
  ["pointerup","pointercancel","pointerleave"].forEach(t => cv.addEventListener(t, () => {
    if(!drawing) return;
    drawing = false; cur = null; inkStore(qid, side); redraw();
  }));

  const show = el => el.classList.remove("hide");
  const hide = el => el.classList.add("hide");
  const subs = () => tools.querySelectorAll("[data-inktool],[data-inkcolor],[data-inkundo],[data-inkclear],[data-inkw],[data-inkpen]");
  const paint = () => {
    tools.querySelectorAll("[data-inktool]").forEach(b => b.classList.toggle("on", b.dataset.inktool === INK_TOOL));
    tools.querySelectorAll("[data-inkcolor]").forEach(b => b.classList.toggle("on", b.dataset.inkcolor === INK_COLOR));
    tools.querySelectorAll("[data-inkw]").forEach(b => b.classList.toggle("on", +b.dataset.inkw === (window.__inkW || 2.6)));
    tools.querySelectorAll("[data-inkpen]").forEach(b => b.classList.toggle("on", window.__inkPenOnly !== false));
  };

  /* ★ 필기는 «카드 단위» 다.
     문제 그림에서 켜면 답안 그림에서도 같이 켜진다. 한쪽만 켜지면
     풀이를 쓰다가 답안에 표시하려 할 때마다 다시 눌러야 해서 성가시다. */
  const card = wrap.closest(".pcard");
  function setOn(v){
    on = v;
    wrap.dataset.ink = on ? "1" : "";
    tools.querySelectorAll("[data-inkon]").forEach(b => b.classList.toggle("on", on));
    subs().forEach(x => on ? show(x) : hide(x));
    paint();
  }
  if(card){
    (card._inkSetters = card._inkSetters || []).push(setOn);
    if(card.dataset.inkon === "1") setOn(true);       /* 이미 켜둔 카드라면 바로 따라간다 */
  }

  tools.addEventListener("click", e => {
    const b = e.target.closest("button"); if(!b) return;
    if(b.hasAttribute("data-inkon")){
      const next = !on;
      /* 답안이 접혀 있으면 펼쳐 준다 — 켜 놓고 안 보이면 켠 줄도 모른다 */
      if(next && card?.querySelector("[data-ans].hide")) ansToggle(card, false);
      card ? inkBroadcast(card, next) : setOn(next);
      return;
    }
    if(b.dataset.inktool){ INK_TOOL = b.dataset.inktool; return card ? cardPaint(card) : paint(); }
    if(b.dataset.inkcolor){ INK_COLOR = b.dataset.inkcolor; INK_TOOL = "pen"; return card ? cardPaint(card) : paint(); }
    if(b.dataset.inkw){ window.__inkW = +b.dataset.inkw;
      try{ localStorage.setItem("prac:inkw", b.dataset.inkw); }catch(x){globalThis.__q?.(x)}
      return card ? cardPaint(card) : paint(); }
    if(b.hasAttribute("data-inkpen")){
      window.__inkPenOnly = (window.__inkPenOnly === false);
      try{ localStorage.setItem("prac:inkpen", window.__inkPenOnly ? "1" : "0"); }catch(x){globalThis.__q?.(x)}
      return card ? cardPaint(card) : paint(); }
    if(b.hasAttribute("data-inkundo")){
      inkGet(qid, side).pop(); inkStore(qid, side); return redraw();
    }
    if(b.hasAttribute("data-inkclear")){
      if(!confirm("이 문제의 문제·답안에 쓴 필기를 전부 지웁니다.")) return;
      ["q","a"].forEach(t => { INK[`${qid}:${t}`] = []; inkStore(qid, t); });
      card ? card.querySelectorAll(".inkc").forEach(c => c._redraw?.()) : redraw();
      return;
    }
  });
  cv._redraw = redraw;
}

/* 펜·색을 바꾸면 그 카드의 도구줄을 모두 같은 모양으로 맞춘다 */
function cardPaint(card){
  card.querySelectorAll(".ptools").forEach(t => {
    t.querySelectorAll("[data-inktool]").forEach(b => b.classList.toggle("on", b.dataset.inktool === INK_TOOL));
    t.querySelectorAll("[data-inkcolor]").forEach(b => b.classList.toggle("on", b.dataset.inkcolor === INK_COLOR));
  });
}

/* ═══════════════════════════════════════════════
   PDF 가르기
   ───────────────────────────────────────────────
   머리글 "문제 NN  출제년도 : ..." 은 예외 없이 규칙적이라 AI 없이 잡힌다.
   한 문제는 그 머리글부터 다음 머리글 직전까지이고, 쪽을 넘길 수도 있다.
   ═══════════════════════════════════════════════ */
/* 머리글 모양은 교재마다 다르다. «문제 03» 만 알던 예전 방식은
   «3.» 이나 «Q3» 로 시작하는 단답형 PDF 를 한 문제도 못 잡았다. */
const HDR_SET = {
  /* 스캔본은 «문 제 0 1» 처럼 사이가 벌어져 읽히기도 한다. 「년」이 뒤따르면 본문이다. */
  "문제": /^\s*문\s*제\s*(\d{1,3})(?![\d년])/,
  "번호": /^(\d{1,3})\s*[.)]\s*(?!\d)/,        /* 1. · 01) — 뒤에 숫자가 또 오면 소수점이니 제외 */
  /* 소방설비기사 기출은 «09 번.» 처럼 «번» 이 끼어 있다 */
  "번문": /^(\d{1,3})\s*번\s*[.)]?/,
  "Q":    /^(?:Q\s*|\[\s*)(\d{1,3})\s*\]?/i,
  /* 단답 정리본은 번호가 없다. «∎ 콘덴서의 시설 방법» 처럼 글머리표로만 나뉜다.
     그래서 번호를 못 뽑으면 나온 순서대로 1, 2, 3 … 을 붙인다. */
  "항목": /^[∎■▪◼◾□▣●•]\s*\S/
};
function hdrKey(){ return $("#impHdr")?.value || "문제"; }
function hdrRe(){
  const k = hdrKey();
  if(k === "쪽" || k === "출제") return null;      /* 이 둘은 아래에서 따로 다룬다 */
  if(k !== "자유") return HDR_SET[k] || HDR_SET["문제"];
  const w = ($("#impHdrCustom")?.value || "").trim();
  if(!w) return HDR_SET["문제"];
  return new RegExp("^" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*(\\d{1,3})?\\b");
}
/* ── 다산 문제집형 머리글 ──
   실제 PDF 를 뜯어보면 세 갈래다.
     ① 오고초려   : «01» 이 한 줄, 바로 다음 줄에 «‣ 출제년도 : 13-1 / 13-3 …»
     ② 핵심빈출   : «핵심 빈출 3 ▶ 출제년도 : 기사 04, 10, 19, 25» 한 줄
     ③ 단답       : «2025년 1회 전기기사 실기» 아래로 «1.» «2.» … (기존 «번호» 로 처리)
   ①②는 회차가 아니라 «장(章)» 으로 묶인다. 그래서 장 번호를 회차 자리에 넣는다. */
/* ★ 이 책이 쓰는 화살표는 «►» 다. ‣ 와 ▶ 만 받고 있어서
   오고초려·핵심빈출이 통째로 0개로 나왔다. 셋 다 받는다. */
const HDR_BOOK  = /^(?:핵심\s*빈[출줄]\s*)?([\d\s]{0,5})?[‣▶►>]\s*•?\s*출제\s*[년연]?도/;
const HDR_NUMLN = /^(\d{1,3})$/;                  /* 번호만 덩그러니 있는 줄 */
/* 구간별 성적표 — 초록 상자에도 띄우려고 밖으로 내놓는다.
   기록칸 위쪽에만 찍으니 스크롤에 묻혀 아무도 못 봤다. */
let SECTREPORT = [];
/* «1장. 송･배전선로» 또는 «01. 송･배전선로» — 두 자리로 못 박아
   본문 속 «3. 변류기의 부담» 같은 목록 줄에 속지 않게 한다. */
const CHAP = /^(?:제\s*)?(\d{1,2})\s*장[.\s]|^(0[1-9])\.\s*[가-힣A-Za-z]/;

/* ═══════════════════════════════════════════════════════════
   구간 자동 나누기 — «파일 하나 주면 알아서»
   ───────────────────────────────────────────────────────────
   다산 기출문제집 한 권(1204쪽)에는 성격이 다른 다섯 덩어리가 들어 있다.
   덩어리마다 머리글 생김새가 달라서, 하나로 맞춰 놓으면 나머지는 반드시 0개가 나온다.
   그래서 쪽마다 «지금 어느 덩어리인가» 를 보고 규칙을 갈아 끼운다.

     기출      2~852     문제 01 · 회차 표지에서 연도·회차를 읽음
     오고초려  854~897   01 ‣ 출제년도 …          (장으로 묶임)
     핵심빈출  899~1050  핵심 빈출 3 ▶ 출제년도 …  (장으로 묶임)
     단답      1051~1186 2019년 3회 전기기사 실기 / 1. 2. 3. …
     소방설비  1187~1204 09 번.

   회차가 없는 덩어리는 «없는 연도» 를 이름표로 쓴다. 기출과 절대 안 겹치고,
   숫자만 보고도 무엇인지 되짚을 수 있게 규칙을 뒀다.

     9301년  오고초려 (회차 = 장)
     9302년  핵심빈출 (회차 = 장)
     94NN년  단답     — 9419년 3회 = 2019년 3회 단답
     95NN년  소방설비 — 9521년 1회 = 소방설비기사 21년 1회

   ※ 예전에 쓰던 9001·9002·9003 과 일부러 다른 번호를 골랐다. 섞이면 못 가른다.
   ═══════════════════════════════════════════════════════════ */
const SECT_NAME = {
  "기출":"기출문제", "오고초려":"오고초려", "핵심빈출":"핵심 빈출 146제",
  "단답":"연도별 단답", "소방":"소방설비기사"
};
/* 덩어리마다 어느 머리글 규칙을 쓸지 */
const SECT_HDR = {
  "기출":"문제", "오고초려":"출제", "핵심빈출":"출제", "단답":"번호", "소방":"번문"
};
/* 쪽 글자를 보고 어느 덩어리인지 고른다. 못 고르면 앞 쪽을 그대로 이어받는다.
   («핵심 빈출 146제» 같은 되풀이 머리글이 쪽마다 찍혀 있어서 이어받기가 잘 먹는다) */
function sectionOf(pageText, prev){
  if(/소방설비기사/.test(pageText))                       return "소방";
  if(/단\s*답\s*[（(]\s*\d{2}/.test(pageText))             return "단답";
  if(/핵심\s*빈출/.test(pageText))                        return "핵심빈출";
  if(/오고초려/.test(pageText))                            return "오고초려";
  /* 단답 구간 안쪽 쪽에는 «2019년 3회 전기기사 실기» 만 있고 표시가 없다.
     기출 구간에는 «문제 NN» 이 반드시 함께 있으므로 그것으로 가른다. */
  if(prev === "단답" && !/문\s*제\s*\d{1,2}/.test(pageText)) return "단답";
  for(const re of ROUND_SET) if(re.test(pageText))         return "기출";
  return prev || "기출";
}
/* 덩어리별 이름표(연도·회차) */
function sectLabel(sect, read, chap){
  if(sect === "기출")     return read;                       /* 읽은 그대로 */
  if(sect === "오고초려") return { year:9301, session:Math.max(1, chap || 1) };
  if(sect === "핵심빈출") return { year:9302, session:Math.max(1, chap || 1) };
  if(sect === "단답")     return read ? { year:9400 + (read.year % 100), session:read.session } : null;
  if(sect === "소방")     return read ? { year:9500 + (read.year % 100), session:read.session } : null;
  return read;
}
/* 소방설비 쪽에 붙은 «21년 1회» 를 읽는다 */
const SOBANG_RND = /소방설비기사[^\n]{0,14}?(\d{2})\s*년\s*(\d)\s*회/;

/* PDF 안에 «2025년 제1회» 가 없을 때 쓸 회차. 위 입력칸에서 읽는다. */
function manualRound(){
  const y = parseInt($("#impYear")?.value, 10), n = parseInt($("#impSess")?.value, 10);
  return (y && n) ? { year:y, session:n } : null;
}

/* ── v215 · 제목을 알아서 읽는다 ────────────────────────────
   쪽 안에 «2025년 제1회» 가 안 적힌 PDF 가 흔하다. 그동안은 사람이
   연도·회차 칸을 채워야 했고, 안 채우면 문항 0개로 끝났다.
   파일 이름에는 거의 언제나 적혀 있으므로 거기서 먼저 읽는다.  */
const NAME_RND = [
  /(20\d{2})\s*[년\-_. ]\s*제?\s*([1-4])\s*회/,      /* 2025년 3회 · 2025-3회 · 2025_3 회 */
  /(20\d{2})\s*[\-_.]\s*([1-4])(?!\d)/,               /* 2025-3 · 2025_3 · 2025.3 */
  /(?<!\d)(\d{2})\s*[년\-_.]\s*제?\s*([1-4])\s*회/  /* 25년 3회 · 25-3회 */
];
function roundFromName(name){
  const t = String(name || "").replace(/\.[a-z0-9]+$/i, "");
  for(const re of NAME_RND){
    const m = t.match(re);
    if(!m) continue;
    let y = +m[1]; if(y < 100) y += 2000;
    const n = +m[2];
    if(y >= 2000 && y <= 2099 && n >= 1 && n <= 4) return { year:y, session:n };
  }
  return null;
}

/* 앞 몇 쪽을 훑어 «○○○○년 제○회» 가 한 번이라도 나오는지 본다.
   나오면 쪽마다 읽으면 되니 이름표를 억지로 씌우지 않는다. */
async function hasRoundInPdf(doc, upto){
  const n = Math.min(doc.numPages, upto || 6);
  for(let i = 1; i <= n; i++){
    try{
      const tc = await (await doc.getPage(i)).getTextContent();
      const txt = tc.items.map(x => x.str).join(" ");
      for(const re of ROUND_SET) if(re.test(txt)) return true;
    }catch(e){globalThis.__q?.(e)}
  }
  return false;
}
let HDR = HDR_SET["문제"], HDRK = "문제", IMPORT_MODE = "qa";
/* v215 — 파일 이름에서 읽어 낸 회차. 손으로 지정한 값이 없을 때만 쓴다. */
let AUTO_RND = null;
let FAILS = [];

/* 서버가 JSON 대신 오류 페이지(<!DOCTYPE html …)를 돌려주면 원래 메시지가
   "Unexpected token '<'" 로만 보인다. 무슨 일인지 알 수 없어서 풀어 준다. */
function niceErr(e){
  const m = String(e?.message || e || "");
  if(/Unexpected token '<'|<!DOCTYPE/i.test(m))
    return "서버가 오류 페이지를 돌려줬습니다 (그림이 너무 크거나 잠시 막힌 것일 수 있습니다)";
  if(/payload|too large|413/i.test(m)) return "그림 용량이 한도를 넘었습니다";
  if(/timeout|aborted|network|Failed to fetch/i.test(m)) return "연결이 끊겼습니다";
  if(/duplicate key|conflict/i.test(m)) return "같은 번호가 이미 있습니다";
  return m || "알 수 없는 오류";
}
document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("impHdr"), cus = document.getElementById("impHdrCustom");
  if(sel && cus) sel.addEventListener("change", () => cus.classList.toggle("hide", sel.value !== "자유"));
});
const ASKED = /출제\s*[년연]?\s*도?\s*[:：]\s*([0-9.\s()가-힣]*)/;
/* ── 배점 ──
   스캔본은 «점» 이 «정» 이나 «§» 로 읽히는 일이 흔하다. ►·‣ 화살표도 붙었다 떨어졌다 한다.
   글자 하나 틀렸다고 배점을 통째로 놓치면 회차 총점(100점) 검산을 못 한다. */
const POINT = /(?:점\s*수|배\s*점|[►▶‣>])\s*[:：;\-]?\s*(\d{1,2})\s*[점정§]/;
/* ── 회차 표시 ──
   ★ 여기가 «문제 0개» 의 첫 번째 원인이었다.
     예전 규칙은 «2025년 제3회» 처럼 «년» 이 반드시 있어야 했다.
     그런데 다산 기출문제집 머리글에는 «년» 이 없다 —
        2025 제3회전기기사실기        ■ 합격률 63.0%
        2026    전 기 기 사 실 기    1회
     그래서 회차를 한 번도 못 찾았고, 마지막 걸러내기(it.year && it.session)에서
     1005개를 잡아 놓고도 전부 버려 0개가 됐다. 생김새별로 나눠서 받는다. */
const ROUND_SET = [
  /(20\d{2})\s*년\s*제?\s*(\d)\s*회/,                        /* 2025년 제3회 */
  /(20\d{2})\s*제\s*(\d)\s*[·,.\s]*\d?\s*회/,                /* 2025 제3회전기기사실기 · 2020 제4·5회 */
  /(20\d{2})[^\n]{0,20}?실\s*기[^\n]{0,8}?제?\s*(\d)\s*회/,  /* 2026 전 기 기 사 실 기  1회 */
  /(20\d{2})[^\n]{0,8}?제?\s*(\d)\s*회[^\n]{0,14}?전\s*기/   /* 조각 순서가 뒤바뀐 경우 */
];
/* 회차 표시는 «쪽 맨 위» 에만 있다. 본문까지 뒤지면 문제 속 숫자에 끌려간다. */
function findRound(sorted){
  const head = sorted.slice(0, 4).map(l => l.txt).join("\n");
  for(const re of ROUND_SET){
    const m = head.match(re);
    if(m) return { year:+m[1], session:+m[2] };
  }
  return null;
}
/* 쪽마다 되풀이되는 머리글·꼬리글. 이것만 건너뛴다 (높이로 자르지 않는다) */
const RUNNING_HEAD = /^(?:\d{1,4}|[A-Z]|전\s*기\s*기\s*사\s*실\s*기.*|.*합격률.*|.*다산에듀.*|핵심\s*빈출.*)$/;
/* 대각선 워터마크가 글 사이에 조각조각 끼어든다. 검색용 글에서만 걷어낸다. */
const cleanText = t => String(t || "")
  .replace(/값진[^\n]*응원합니다!*/g, "")
  .replace(/다산에듀\s*www\.[^\s]+/g, "")
  .replace(/\b[0-9a-z]{1,4}@?(kakao|naver|gmail)?\.?(com)?\b(?=\s)/gi, m => m.length <= 4 ? "" : m)
  .replace(/[ \t]{2,}/g, " ")
  .replace(/\n{3,}/g, "\n\n").trim();

let PICKED = [], PARSED = [], STOP = false, DUPES = [];

const drop = $("#drop");
drop.onclick = () => $("#file").click();
["dragenter","dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("on"); }));
["dragleave","drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("on"); }));
drop.addEventListener("drop", e => take([...e.dataTransfer.files]));
$("#file").onchange = e => take([...e.target.files]);

function take(files){
  PICKED = files.filter(f => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
  if(!PICKED.length) return say($("#im"), "PDF 만 넣을 수 있습니다.", "err");
  drop.innerHTML = `<b>${PICKED.length}개 파일</b>${PICKED.map(f => f.name).join(" · ")}`;
  $("#run").disabled = false;
  { const b = document.getElementById("probe"); if(b) b.disabled = false; }

  /* 파일 이름에 과목 이름이 들어 있으면 과목을 미리 맞춰 둔다.
     "전기기사실기_기출25_20.pdf" 처럼 띄어쓰기가 제각각이라 공백을 지우고 견준다.
     확실할 때만 손대고, 애매하면 건드리지 않는다 — 엉뚱한 과목에 968문제가 들어가면 되돌리기 어렵다. */
  const flat = s => String(s).replace(/[\s_\-]+/g, "");
  const names = PICKED.map(f => flat(f.name));
  const hit = SUBJECTS.filter(s => names.some(n => n.includes(flat(s.name))));
  let note = "";
  if(hit.length === 1){
    $("#impSub").value = hit[0].id;
    note = `\n파일 이름에서 "${hit[0].name}" 을 찾아 과목을 맞춰 두었습니다.`;
  }else if(hit.length > 1){
    note = `\n파일 이름에 과목이 여럿(${hit.map(s => s.name).join(", ")}) 걸려 자동으로 못 정했습니다. 아래에서 골라 주세요.`;
  }
  say($("#im"), "훑어보기를 누르면 문제 단위로 잘라 미리 세어 봅니다. 아직 아무것도 올리지 않습니다." + note, "info");
}

$("#stop").onclick = () => { STOP = true; log("중지 요청"); };

$("#run").onclick = async () => {
  if(!PICKED.length) return;
  STOP = false; PARSED = []; DUPES = [];
  $("#run").disabled = true; $("#stop").disabled = false; $("#save").disabled = true;
  logEl.textContent = "";
  HDR = hdrRe(); HDRK = hdrKey();
  const MODE = IMPORT_MODE = $("#impMode")?.value || "qa";
  let mr = manualRound();
  AUTO_RND = null;   /* 파일마다 이름에서 읽은 회차 — scanDoc 이 마지막 보루로 쓴다 */
  log(`앱 ${CFG.CONFIG_VERSION || "?"} · 구간 자동 나누기 ${hdrKey() === "전체" ? "켬" : "끔"}`);
  log(`머리글 «${$("#impHdr").value === "자유" ? $("#impHdrCustom").value.trim() : $("#impHdr").options[$("#impHdr").selectedIndex].text}» · ${ {qa:"문제+답안", q:"문제만", a:"답안만"}[MODE] }`);
  log(mr ? `회차 직접 지정 — ${mr.year}년 제${mr.session}회 (PDF 에 회차가 없으면 이 값을 씁니다)`
         : `회차는 PDF 안의 «○○○○년 제○회» 에서 읽습니다 — 없으면 파일 이름에서 찾습니다`);
  try{
    for(const f of PICKED){
      if(STOP) break;
      log(`${f.name} 여는 중…`);
      const buf = await f.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      doc.__id = f.name + "|" + f.size;               /* 잰 여백을 파일별로 담아 두려고 */
      try{ LEFTPAD.clear(); LEFTMIN.clear(); }catch(e){globalThis.__q?.(e)}
      log(`${f.name} · ${doc.numPages}쪽`);

      /* v215 — 제목(연도·회차)을 알아서 정한다.
         ① 손으로 지정한 값이 있으면 그것
         ② 쪽 안에 «2025년 제1회» 가 있으면 손대지 않는다 (쪽마다 읽는 게 정확하다)
         ③ 둘 다 없으면 파일 이름에서 읽는다 — 여기서 못 찾으면 문항 0개가 된다 */
      AUTO_RND = null;
      if(!mr){
        const inside = await hasRoundInPdf(doc, 8);
        if(inside){
          log(`  회차 표시가 쪽 안에 있습니다 — 쪽마다 읽습니다`);
        }else{
          AUTO_RND = roundFromName(f.name);
          if(AUTO_RND) log(`  쪽 안에 회차가 없어 파일 이름에서 읽었습니다 — ${AUTO_RND.year}년 제${AUTO_RND.session}회`);
          else log(`  ⚠ 쪽에도 파일 이름에도 회차가 없습니다 — 위 «연도·회차» 칸을 채우거나 파일 이름을 «2025년 3회.pdf» 처럼 바꿔 주세요`, "warn");
        }
      }
      const found = await scanDoc(doc, f.name, MODE);
      PARSED.push({ file:f, doc, items:found });
      log(`${f.name} → 문제 ${found.length}개`);
    }
    const total = PARSED.reduce((a, p) => a + p.items.length, 0);
    const rounds = new Set(PARSED.flatMap(p => p.items.map(i => `${i.year}-${i.session}`)));
    DUPES.forEach(d => log("겹침 — " + d));

    /* ── 잘 잘렸는지 스스로 검사한다 ──
       "스캔이 제대로 됐나" 를 눈으로 다 넘겨 보며 확인할 수는 없다.
       그래서 수상한 것만 골라서 알려 준다. */
    const all = PARSED.flatMap(p => p.items);
    repairPoints(all);                       /* ★ 배점 되찾기 — 아래 함수 참고 */
    const spans = all.filter(i => i.end && i.end.page > i.start.page);          // 쪽을 넘어간 문제
    const noAns = all.filter(i => !i.ansAt);                                    // 답안 표시를 못 찾음
    const thin  = all.filter(i => (i.text || "").replace(/\s/g, "").length < 12); // 글이 거의 없음
    const byRound = new Map();
    all.forEach(i => { const k = `${i.year}년 제${i.session}회`; byRound.set(k, (byRound.get(k) || 0) + 1); });
    const counts = [...byRound.values()];
    const mid = counts.slice().sort((a,b) => a-b)[Math.floor(counts.length/2)] || 0;
    const odd = [...byRound.entries()].filter(([, n]) => mid && Math.abs(n - mid) > Math.max(3, mid * 0.25));

    log("── 잘린 상태 점검 ──");
    log(`쪽을 넘어간 문제 ${spans.length}개 (2쪽짜리는 여기 잡힙니다)`);
    log(`답안 표시를 못 찾은 문제 ${noAns.length}개`);
    log(`글이 거의 없는 문제 ${thin.length}개 (도면만 있는 문제면 정상)`);
    if(spans.length) log("  쪽 넘김 예: " + spans.slice(0, 8).map(i => `${i.year}-${i.session} ${i.no}번(${i.start.page}→${i.end.page}쪽)`).join(", "));
    if(noAns.length) log("  답안 없음 예: " + noAns.slice(0, 8).map(i => `${i.year}-${i.session} ${i.no}번`).join(", "));
    if(odd.length) log("\u26a0 문항 수가 다른 회차와 크게 다릅니다: " + odd.map(([k, n]) => `${k}(${n})`).join(", "));
    /* ── 한 권을 통째로 넣었을 때: 어느 덩어리가 얼마나 나왔는지 ── */
    const secs = new Map();
    all.forEach(i => { if(i.sect) secs.set(i.sect, (secs.get(i.sect) || 0) + 1); });
    if(secs.size > 1){
      log("");
      log("── 책을 이렇게 나눴습니다 ──");
      log("덩어리            문항   들어갈 자리");
      const 자리 = {
        "기출":"실제 연도·회차 그대로",
        "오고초려":"9301년 1회~ (20문항씩)",
        "핵심빈출":"9302년 1회~ (20문항씩)",
        "단답":"94NN년 — 9419년 3회 = 2019년 3회 단답",
        "소방":"95NN년 — 소방설비기사"
      };
      [...secs.entries()].forEach(([k, n]) =>
        log(`${(SECT_NAME[k] || k).padEnd(16)}${String(n).padStart(5)}   ${자리[k] || ""}`));
      log("");
      log("※ 9301·9302·94··· 는 «회차가 없는 자료» 에 붙인 이름표입니다.");
      log("   기출(2008~2026)과 절대 안 겹치고, 검수 화면에서 따로 골라 볼 수 있습니다.");
    }

    const 진단 = roundReport(all);
    log("");
    log("── 회차별 상태 ── (실기는 회차 총점이 100점이다. 그게 제일 확실한 잣대다)");
    log("회차          문항  배점합  판정        손볼것");
    진단.forEach(r => log(
      `${String(r.key).padEnd(13)}${String(r.n).padStart(3)}${String(r.sum).padStart(7)}   ${r.verdict.padEnd(10)}${r.fix ? r.fix + "문항" : "-"}`));
    const 미달 = 진단.filter(r => r.sum < 98);
    log("");
    log(`배점 100점으로 딱 맞는 회차 ${진단.filter(r => r.verdict === "정상").length} / ${진단.length}`);
    if(미달.length) log(`배점이 모자란 회차 ${미달.length}개 — 그만큼이 PDF 에서 안 읽힌 것입니다: `
      + 미달.slice(0, 12).map(r => `${r.key}(${r.sum})`).join(", "));

    const warn =
      (spans.length ? `\n· 쪽을 넘어간 문제 ${spans.length}개는 두 쪽을 이어 붙여 한 장으로 만듭니다. 올린 뒤 그 문제들만 눈으로 확인해 보세요.` : "")
      + (noAns.length ? `\n· 답안 표시("답안작성")를 못 찾은 문제가 ${noAns.length}개입니다. 문제만 저장되고 답안 칸은 비어 있게 됩니다.` : "")
      + (odd.length ? `\n· ${odd.map(([k, n]) => k + " " + n + "문항").join(", ")} — 다른 회차와 문항 수가 많이 다릅니다. 잘못 잘렸을 수 있습니다.` : "");
    say($("#im"),
      `앱 ${CFG.CONFIG_VERSION || "?"} · 문제 ${total}개 · 회차 ${rounds.size}개를 찾았습니다.`
      + (SECTREPORT.length
        ? "\n\n── 구간별 성적표 ──\n구간            쪽 범위        머리글  최종\n"
          + SECTREPORT.map(r =>
              `${r.name.padEnd(14)}${String(r.from).padStart(5)}~${String(r.to).padEnd(6)}`
              + `${String(r.hits).padStart(6)}${String(r.final).padStart(6)}`
              + (r.final ? "" : "   ← 0개")).join("\n")
          + (SECTREPORT.some(r => !r.final)
              ? "\n\n" + SECTREPORT.filter(r => !r.final).map(r => r.hits
                  ? `· «${r.name}» 머리글 ${r.hits}개를 찾고도 최종 0개 — 회차 이름표가 안 붙었습니다.`
                  : `· «${r.name}» 머리글을 하나도 못 찾았습니다 — 머리글 규칙이 안 맞습니다.`).join("\n")
              : "")
        : "")
      + (DUPES.length ? `\n\n같은 회차가 ${DUPES.length}번 겹칩니다. 원본 PDF 에 그 회차가 두 번 들어 있다는 뜻이라,\n올릴 때 뒤엣것이 앞엣것을 덮어씁니다. 내용이 같으면 문제되지 않습니다. 자세한 건 아래 기록을 보세요.` : "")
      + warn
      + `\n\n"Supabase 에 올리기" 를 누르면 그림을 만들어 올립니다. 시간이 꽤 걸립니다.`, "ok");
    $("#save").disabled = !total;
    $("#peek").disabled = !total;
    $("#fillGap").disabled = !total;
    { const b = document.getElementById("reCut"); if(b) b.disabled = !total; }
  }catch(e){
    say($("#im"), "읽지 못했습니다 — " + e.message, "err");
  }finally{
    $("#run").disabled = false; $("#stop").disabled = true;
    { const b = document.getElementById("probe"); if(b) b.disabled = !PICKED.length; }
  }
};

/* ═══════════════════════════════════════════════════════════
   이 PDF 스스로 살펴보기 — 책이 자기 구조를 말하게 한다
   ───────────────────────────────────────────────────────────
   «핵심 빈출»·«오고초려» 같은 글자를 하나도 박지 않는다.
   줄의 «생김새»(앞머리 글자 + 숫자 + 뒤 기호)와 «왼쪽 자리»만 세어서
   어디가 한 덩어리이고 그 덩어리의 머리글이 무엇인지 스스로 찾는다.

   가르는 잣대 셋
     ① 길게 이어 세는가   — 머리글은 1→20 까지 죽 올라간다.
                             보기 «(1)(2)(3)» 은 서너 개마다 다시 1이다.
     ② 한 쪽에 몇 개인가   — 머리글은 한 쪽에 한둘, 보기는 대여섯.
     ③ 왼쪽 끝에 붙는가   — 머리글은 마진에 붙고 보기는 들여쓴다.

   창(24쪽)을 밀며 대목마다 우승 열쇠를 뽑는다. 통째로 세면
   본문 속 «1. 2. 3.» 이 다 섞여서 아무것도 안 보이기 때문이다.
   ═══════════════════════════════════════════════════════════ */
const LEADRE = /^([^\d\n]{0,8}?)\s*(\d{1,3})\s*(\D?)/;
/* «[번호] ► 출제년도» 꼴. OCR 이 번호를 통째로 못 읽어도 같은 열쇠로 본다.
   실제로 오고초려 45개 중 16개는 번호가 안 읽혀 다른 열쇠로 갈라졌고,
   그 바람에 45쪽짜리 덩어리가 통째로 안 보였다. */
const ARROW_ASKED = /^[►▶‣>]?\s*\d{0,3}\s*[►▶‣>]\s*출\s*제\s*[년연]?\s*도/;
function keyOf(t){
  const q = String(t || "").replace(/\s+/g, " ").trim();
  if(ARROW_ASKED.test(q)){
    /* «출제년도 : 01-2» 의 01 을 번호로 오해하면 번호열이 엉켜 머리글로 안 보인다.
       머리글 자리의 숫자만 받고, 없으면 0(«모르는 번호»)으로 둔다. */
    const m0 = q.match(/^\s*(\d{1,3})\s*[►▶‣>]/);
    return { key:"#►", no: m0 ? +m0[1] : 0 };
  }
  const m = q.match(LEADRE);
  if(!m) return null;
  const head = m[1].replace(/[\s.·]/g, "");
  if(head.length > 6) return null;
  const tail = ".)►▶‣>번:".includes(m[3]) ? m[3] : "";
  if(!head && !tail) return null;
  return { key:`${head}#${tail}`, no:+m[2] };
}
/* 이 열쇠가 «이 대목» 에서 머리글다운가 */
function headerScore(v, pageLeft){
  if(v.length < 4) return 0;
  const runs = []; let cur = 1;
  for(let i = 1; i < v.length; i++){
    /* 0 은 «번호를 못 읽음» 이다. 끊긴 것으로 보지 않고 이어 세운다. */
    if(v[i].no === 0 || v[i-1].no === 0 || v[i].no === v[i-1].no + 1) cur++;
    else { runs.push(cur); cur = 1; }
  }
  runs.push(cur); runs.sort((a,b) => a-b);
  const run = runs[runs.length >> 1];
  const pgs = new Set(v.map(z => z.p)).size;
  if(run < 4 || v.length / Math.max(1, pgs) > 5) return 0;
  const xs = v.map(z => z.x).sort((a,b) => a-b);
  const indent = Math.max(0, xs[xs.length >> 1] - pageLeft);
  return run * (1 + Math.sqrt(v.length)) / (1 + indent / 12);
}
async function probeDoc(doc, name){
  log(`${name} · 구조를 스스로 살펴봅니다…`);
  const hits = new Map(), leftOf = new Map();
  const N = doc.numPages;
  for(let p = 1; p <= N; p++){
    if(STOP) break;
    if(p % 30 === 0){ $("#bar").style.width = (p / N * 100) + "%"; await new Promise(r => setTimeout(r)); }
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale:1 });
    const tc = await page.getTextContent();
    const keys = [], map = new Map();
    for(const it of tc.items){
      if(!it.str.trim()) continue;
      const pt = vp.convertToViewportPoint(it.transform[4], it.transform[5]);
      let k = keys.find(v => Math.abs(v - pt[1]) < 4);
      if(k === undefined){ keys.push(pt[1]); k = pt[1]; }
      if(!map.has(k)) map.set(k, []);
      map.get(k).push({ x:pt[0], s:it.str });
    }
    const xsAll = [];
    for(const [, frags] of map){
      frags.sort((a,b) => a.x - b.x);
      xsAll.push(frags[0].x);
      /* 머리글은 줄의 «맨 왼쪽 조각» 이다. 줄을 통째로 이으면
         오른쪽 끝의 «►점수 : 6점» 이 앞에 붙는 쪽이 섞여 열쇠가 쪼개진다. */
      const head = frags.slice(0, 2).map(f => f.s).join(" ").slice(0, 28);
      const k = keyOf(head);
      if(!k) continue;
      if(!hits.has(k.key)) hits.set(k.key, []);
      hits.get(k.key).push({ p, x:frags[0].x, no:k.no });
    }
    xsAll.sort((a,b) => a-b);
    leftOf.set(p, xsAll.length >= 10 ? xsAll[Math.floor(xsAll.length/10)] : (xsAll[0] || 0));
  }

  /* 창을 밀며 대목마다 우승 열쇠를 뽑는다 */
  /* 창이 넓으면 45쪽·18쪽짜리 짧은 덩어리가 큰 덩어리에 묻힌다 */
  const WIN = 14, STEP = 4, vote = new Map();
  for(let i = 1; i <= N; i += STEP){
    const lo = i, hi = Math.min(N, i + WIN - 1);
    const pl = []; for(let p = lo; p <= hi; p++) if(leftOf.has(p)) pl.push(leftOf.get(p));
    pl.sort((a,b) => a-b);
    const pageLeft = pl.length ? pl[pl.length >> 2] : 0;
    let best = 0, bk = null;
    for(const [k, v] of hits){
      const w = v.filter(z => z.p >= lo && z.p <= hi);
      const sc = headerScore(w, pageLeft);
      if(sc > best){ best = sc; bk = k; }
    }
    if(bk) for(let p = lo; p <= hi; p++){
      if(!vote.has(p)) vote.set(p, new Map());
      vote.get(p).set(bk, (vote.get(p).get(bk) || 0) + 1);
    }
  }
  const pick = []; let prev = null;
  for(let p = 1; p <= N; p++){
    const c = vote.get(p);
    prev = c ? [...c.entries()].sort((a,b) => b[1]-a[1])[0][0] : prev;
    pick[p] = prev;
  }
  let secs = [], cur = Symbol();
  for(let p = 1; p <= N; p++){
    if(pick[p] !== cur){ secs.push({ from:p, to:p, key:pick[p] }); cur = pick[p]; }
    else secs[secs.length-1].to = p;
  }
  const keep = [];
  secs.forEach(s => {
    if(keep.length && (s.to - s.from + 1) < 8) keep[keep.length-1].to = s.to;
    else keep.push(s);
  });
  secs = [];
  keep.forEach(s => {
    if(secs.length && secs[secs.length-1].key === s.key) secs[secs.length-1].to = s.to;
    else secs.push(s);
  });
  /* 경계를 «그 열쇠가 실제로 나온 자리» 로 바짝 당긴다 */
  secs = secs.filter(s => s.key);
  secs.forEach(s => {
    const v = (hits.get(s.key) || []).filter(z => z.p >= s.from && z.p <= s.to);
    if(v.length){ s.from = Math.min(...v.map(z => z.p)); s.to = Math.max(...v.map(z => z.p)); }
    const xs = v.map(z => z.x).sort((a,b) => a-b);
    s.margin = xs.length >= 10 ? xs[Math.floor(xs.length/10)] : (xs[0] || 0);
    s.count = v.length;
  });
  secs = secs.filter(s => s.count >= 8);

  log("");
  log("── 이 PDF 는 이렇게 생겼습니다 ──");
  log("쪽 범위        머리글 생김새        문항   왼쪽자리");
  secs.forEach(s => log(
    `${String(s.from).padStart(5)}~${String(s.to).padEnd(6)} «${s.key}»`.padEnd(32)
    + `${String(s.count).padStart(5)}   ${s.margin.toFixed(0)}pt`));
  log("");
  log("«#» 은 번호 자리입니다. «문제#» 은 «문제 01», «#.» 은 «1.», «#►» 는 «01 ►» 꼴입니다.");
  log("여기 안 잡힌 짧은 대목이 있으면 그 쪽 범위를 적어 따로 넣으세요.");
  return secs;
}

$("#probe").onclick = async () => {
  if(!PICKED.length) return;
  STOP = false; logEl.textContent = "";
  $("#probe").disabled = true; $("#stop").disabled = false;
  try{
    for(const f of PICKED){
      if(STOP) break;
      const doc = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
      const secs = await probeDoc(doc, f.name);
      say($("#im"),
        `${f.name} · ${doc.numPages}쪽 — 덩어리 ${secs.length}개를 찾았습니다.\n\n`
        + "쪽 범위        머리글          문항   왼쪽자리\n"
        + secs.map(s => `${String(s.from).padStart(5)}~${String(s.to).padEnd(6)} «${s.key}»`.padEnd(28)
            + `${String(s.count).padStart(5)}   ${s.margin.toFixed(0)}pt`).join("\n")
        + "\n\n이건 살펴보기만 한 것입니다. 넣으려면 «훑어보기» 를 누르세요.", "info");
    }
  }catch(e){ say($("#im"), "살펴보다 멈췄습니다 — " + e.message, "err"); }
  finally{ $("#probe").disabled = false; $("#stop").disabled = true; $("#bar").style.width = "0%"; }
};

/* 한 파일을 훑어 문제 경계를 잡는다.
   회차는 쪽 머리글에서 읽는데, 짝수 쪽은 "다산에듀" 머리글이라 회차가 안 적혀 있다.
   그래서 회차 경계가 짝수 쪽에서 시작하면 앞 회차로 잘못 딸려 들어간다.
   문제 번호가 되돌아가는 지점이 곧 회차가 바뀌는 지점이므로(실제 PDF 세 개 모두에서 정확했다),
   번호 리셋으로 먼저 묶고, 묶음 안에서 가장 많이 본 회차를 그 묶음의 회차로 삼는다. */
/* ═══════════════════════════════════════════════
   배점 되찾기 · 회차별 자동 분류
   ───────────────────────────────────────────────
   스캔본은 오른쪽 끝에 작게 찍힌 «►점수 : 5점» 을 곧잘 통째로 흘린다.
   이 교재만 세어 보면 1007문항 중 101개가 그렇다.
   그런데 실기는 회차 총점이 «반드시 100점» 이라, 빈칸이 하나만 남으면
   나머지를 더해서 뺀 값이 곧 정답이다 — 추측이 아니라 계산이다.
   ═══════════════════════════════════════════════ */
function repairPoints(all){
  const byRound = new Map();
  all.filter(i => !i.sect || i.sect === "기출").forEach(i => {
    const k = `${i.year}-${i.session}`;
    if(!byRound.has(k)) byRound.set(k, []);
    byRound.get(k).push(i);
  });
  /* ① 같은 문제가 다른 회차에도 실려 있으면 그 배점을 가져온다.
        («출제년도 : 07. 12. 17. 23. 25.» 처럼 되풀이 출제되는 문항이 많다)
        값이 갈리면 안 쓴다 — 애매한 건 그냥 비워 두는 게 낫다. */
  const bank = new Map();
  const 지문 = t => String(t || "").replace(/[^0-9A-Za-z가-힣]/g, "").slice(0, 55);
  all.forEach(i => {
    if(!i.points) return;
    const k = 지문(i.text);
    if(k.length < 40) return;
    if(!bank.has(k)) bank.set(k, new Set());
    bank.get(k).add(i.points);
  });

  let 계산 = 0, 복사 = 0;
  for(let pass = 0; pass < 5; pass++){
    let 바뀜 = false;
    for(const grp of byRound.values()){
      /* ② 총점 100 — 빈칸이 딱 하나면 계산으로 확정된다 */
      const 빈칸 = grp.filter(i => !i.points);
      if(빈칸.length === 1){
        const gap = 100 - grp.reduce((a, i) => a + (i.points || 0), 0);
        if(gap >= 1 && gap <= 20){
          빈칸[0].points = gap; 빈칸[0].ptSrc = "총점100"; 계산++; 바뀜 = true;
        }
      }
      /* ③ 남은 빈칸은 «같은 문제» 에서. 단, 총점 100 을 넘기지 않는 선에서만 */
      let 여유 = 100 - grp.reduce((a, i) => a + (i.points || 0), 0);
      for(const i of grp){
        if(i.points) continue;
        const c = bank.get(지문(i.text));
        if(!c || c.size !== 1) continue;
        const v = [...c][0];
        if(v <= 여유){ i.points = v; i.ptSrc = "같은문제"; 여유 -= v; 복사++; 바뀜 = true; }
      }
    }
    if(!바뀜) break;
  }
  if(계산 || 복사) log(`배점 되찾음 — 총점 100점 계산 ${계산}개 · 같은 문제에서 ${복사}개`);
  return all;
}

/* 회차마다 «뭐가 없는지» 를 한 줄로 판정한다 */
function roundReport(all){
  const m = new Map();
  /* 총점 100 규칙은 실기 «기출» 에만 있다. 문제집·단답은 배점 자체가 없다. */
  all.filter(i => !i.sect || i.sect === "기출").forEach(i => {
    const k = `${i.year}년 ${i.session}회`;
    if(!m.has(k)) m.set(k, []);
    m.get(k).push(i);
  });
  return [...m.entries()].map(([key, g]) => {
    const sum = g.reduce((a, i) => a + (i.points || 0), 0);
    const fix = g.filter(i =>
      !i.ansAt ||                                                  /* 답을 못 나눔 */
      !i.points ||                                                 /* 배점 없음 */
      (i.text || "").replace(/\s/g, "").length < 40                /* 글이 거의 없음 */
    ).length;
    return { key, n:g.length, sum, fix,
      verdict: sum >= 98 && sum <= 102 ? "정상"
             : sum < 98 ? `${100 - sum}점 모자람` : `${sum - 100}점 넘침` };
  }).sort((a, b) => b.key.localeCompare(a.key));
}

async function scanDoc(doc, name, MODE = 'qa'){
  const items = [];
  let cur = null, seen = null, autoNo = 0, hdrHits = 0, roundHits = 0, lastNo = 0;
  SECTREPORT = [];
  /* 손으로 지정 > 파일 이름에서 읽은 것 > 없음 */
  const MAN = manualRound() || AUTO_RND;
  /* 문제집형에서 쓰는 «장» 상태. 장이 바뀌면 문제 번호를 1부터 다시 센다. */
  let chap = 0, bookYear = MAN?.year || 0;
  /* 오고초려·핵심빈출은 장 표시가 «[1] [2] [3] [1] [2]…» 처럼 단원마다 다시 1로 돌아간다.
     그걸 회차로 삼으면 번호가 뒤엉킨다. 그래서 나온 순서대로 20문항씩 끊어
     1회·2회·3회 … 로 만든다. 뷰어 한 화면에 들어가는 양과도 맞다. */
  let bookSeq = 0;
  const PER_ROUND = 20;

  /* ── 머리글 모양은 «파일마다» 정한다 ──
     한 번에 여러 PDF 를 올리는데 오고초려·핵심빈출·단답은 생김새가 전부 다르다.
     하나로 맞춰 두면 나머지는 반드시 0개가 나온다. */
  let HK = HDRK, RE = HDR;
  /* «전체» 는 쪽마다 어느 덩어리인지 보고 규칙을 갈아 끼운다. 미리 정할 게 없다. */
  const AUTOSECT = (HK === "전체");
  let SECT = null;
  const SECTPAGES = {}, SECTHITS = {};
  if(AUTOSECT){ HK = "문제"; RE = HDR_SET["문제"]; }
  if(HK === "자동"){
    const probe = [];
    const q0 = Math.max(1, parseInt($("#impFrom")?.value, 10) || 1);
    for(let q = q0; q <= Math.min(doc.numPages, q0 + 13); q++){
      const c = await doc.getPage(q).then(pg => pg.getTextContent());
      probe.push(c.items.map(x => x.str).join("\n"));
    }
    const T = probe.join("\n");
    const cnt = re => (T.match(re) || []).length;
    /* pdf.js 는 한 줄을 여러 조각으로 쪼개 준다. «‣» 가 따로 떨어져 나올 수 있어
       화살표는 세지 않고 «출제년도» 라는 낱말만 센다. */
    const nBook = cnt(/출제\s*년?\s*도/g);
    const nQ    = cnt(/(^|\n)\s*문제\s*\d{1,3}\b/g);
    const nNum  = cnt(/(^|\n)\s*\d{1,3}\s*[.)]\s*[가-힣(]/g);
    const nRnd  = cnt(/(20\d{2})\s*(?:년\s*)?제?\s*\d\s*[·,.\s]*\d?\s*회/g);
    const nDot  = cnt(/(^|\n)\s*[∎■▪◼]/g);
    /* ★ 2026년 회차 PDF 가 «문제 0개» 로 끝나던 자리.
       예전에는 «출제년도» 라는 낱말 개수(nBook)만 보고 문제집형이라 단정했다.
       그런데 회차 기출 PDF 도 문제마다 «문제 01  출제년도 : 84. 91. …» 을 달고 나온다.
       그래서 20문항짜리 회차본이 통째로 문제집형으로 잡혔고,
       정작 문제집형 머리글(«01 ‣ 출제년도»)은 한 줄도 없어 0개가 됐다.
       «문제 01» 이 뚜렷하면 그쪽이 먼저다 — 문제집형에는 «문제 01» 이 아예 없다. */
    if(nQ >= 3){ HK = "문제"; RE = HDR_SET["문제"]; }
    else if(nBook >= 3){ HK = "출제"; RE = null; }
    else if(nNum >= 8 && nRnd >= 1){ HK = "번호"; RE = HDR_SET["번호"]; }
    else if(nDot >= 8){ HK = "항목"; RE = HDR_SET["항목"]; }
    else if(nNum >= 8){ HK = "번호"; RE = HDR_SET["번호"]; }
    else { HK = "쪽"; RE = null; }
    const 이름 = { 출제:"01 ‣ 출제년도 (문제집형)", 문제:"문제 01", 번호:"1. · 01.",
                   항목:"∎ 단답 항목", 쪽:"쪽마다 한 장" }[HK];
    log(`   ${name} → 머리글을 «${이름}» 으로 잡았습니다`
      + ` (출제년도 ${nBook} · 문제 ${nQ} · 번호 ${nNum} · 회차 ${nRnd} · ∎ ${nDot})`);
  }

  /* 몇 쪽부터 몇 쪽까지. 비워 두면 전체. */
  const P0 = Math.max(1, parseInt($("#impFrom")?.value, 10) || 1);
  const P1 = Math.min(doc.numPages, parseInt($("#impTo")?.value, 10) || doc.numPages);
  if(P0 > 1 || P1 < doc.numPages) log(`   ${P0}~${P1}쪽만 봅니다 (전체 ${doc.numPages}쪽)`);

  for(let p = P0; p <= P1; p++){
    if(STOP) break;
    if(p % 20 === 0){ $("#bar").style.width = ((p - P0) / Math.max(1, P1 - P0) * 100) + "%"; await new Promise(r => setTimeout(r)); }
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale:1 });
    const tc = await page.getTextContent();

    /* 글자 좌표를 화면 좌표로 바꿔서 쓴다.
       PDF 안의 좌표는 아래가 0 이고, 게다가 쪽마다 회전값(/Rotate)이 따로 붙을 수 있다.
       실제로 이 교재의 어떤 쪽은 혼자 180° 돌아가 있는데, 그걸 모르고 "높이 - y" 로만
       뒤집으면 그 쪽만 위아래가 거꾸로 잡혀 문제와 답안이 반대로 잘린다.
       convertToViewportPoint 는 회전까지 반영해 주므로 어떤 쪽이든 위가 위가 된다. */
    const topOf = it => vp.convertToViewportPoint(it.transform[4], it.transform[5])[1];

    /* 줄 단위로 묶는다 — 위에서부터의 거리가 4pt 안쪽이면 같은 줄로 본다.
       "문제 03" 과 "‣점수 : 7점" 은 같은 줄이지만 좌우로 멀리 떨어져 있어
       딱 맞는 좌표로만 묶으면 배점을 놓친다. */
    const keys = [], lines = new Map();
    for(const it of tc.items){
      if(!it.str.trim()) continue;
      const y = topOf(it);
      let k = keys.find(v => Math.abs(v - y) < 4);
      if(k === undefined){ keys.push(y); k = y; }
      lines.set(k, (lines.get(k) || "") + it.str);
    }
    const sorted = [...lines.entries()].map(([y, txt]) => ({ y, txt })).sort((a,b) => a.y - b.y);
    const pageText = sorted.map(l => l.txt).join("\n");

    /* ── 지금 어느 덩어리인가 (전체 모드일 때만) ── */
    if(AUTOSECT){
      const ns = sectionOf(pageText, SECT);
      if(ns !== SECT){
        SECT = ns;
        HK = SECT_HDR[SECT] || "문제";
        RE = (HK === "출제") ? null : HDR_SET[HK];
        chap = 0; autoNo = 0; lastNo = 0; bookSeq = 0; seen = null; cur = null;
        log(`   ${p}쪽 — «${SECT_NAME[SECT]}» 구간으로 들어갑니다`);
      }
      (SECTPAGES[SECT] = SECTPAGES[SECT] || []).push(p);
    }

    const rm = findRound(sorted);
    if(rm){ seen = rm; roundHits++; }
    /* 소방설비는 «(기출) 소방설비기사 전기분야 21년 1회» 가 문항마다 붙는다 */
    if(AUTOSECT && SECT === "소방"){
      const sm = pageText.replace(/\s+/g, " ").match(SOBANG_RND);
      if(sm){ seen = { year:2000 + (+sm[1]), session:+sm[2] }; roundHits++; }
    }

    /* ── 문제집형 : 장(章) 을 회차 자리에 넣는다 ── */
    if(HK === "출제"){
      if(!bookYear){
        /* 표지·머리글의 «2026 전기기사 실기 …» 에서 연도를 줍는다 */
        const y = pageText.match(/(20\d\d)\s*(?:년\s*)?전기|전기기사[^\n]{0,12}?(20\d\d)/);
        if(y) bookYear = +(y[1] || y[2]);
      }
      for(const L of sorted){
        const c = L.txt.trim().match(CHAP);
        if(c){
          const n = +(c[1] || c[2]);
          /* 장은 앞으로만 간다. 본문 속 «10. …» 같은 목록 줄에 끌려가
             없는 장이 하나 더 생기는 일을 막는다. */
          if(n && n > chap && n <= chap + 2){ chap = n; autoNo = 0; }
          break;                                   /* 그 쪽의 첫 장 표시만 본다 */
        }
      }
      seen = { year: bookYear || new Date().getFullYear(), session: chap || 1 };
      roundHits++;
    }
    /* 덩어리별 이름표로 바꿔 단다 (기출은 읽은 그대로) */
    if(AUTOSECT && SECT && SECT !== "기출"){
      const lab = sectLabel(SECT, seen, chap);
      if(lab) seen = lab;
    }

    /* «머리글 없음 — 쪽마다 한 장» — 단답 정리본처럼 문제 번호가 아예 없는 자료용.
       한 쪽을 통째로 한 장으로 만든다. */
    if(HK === "쪽"){
      /* 한 쪽 = 한 장. 시작과 끝을 그 쪽 안에서 바로 닫아 둔다
         (다음 문제 시작으로 끝을 잡는 뒤처리에 걸려 두 쪽이 붙어 버리지 않게). */
      cur = { no:++autoNo, seen, asked:"", points:null, source:name,
              start:{ page:p, top:0 }, end:{ page:p, top:null }, ansAt:null,
              lastPage:p, text:cleanText(pageText) };
      items.push(cur);
      continue;
    }

    for(let li = 0; li < sorted.length; li++){
      const L = sorted[li];
      const t = L.txt.replace(/\s+/g, " ").trim();
      let top = L.y;                                  /* 이미 위에서부터의 거리다 */
      /* ★ «문제 0개» 의 두 번째 원인이 여기 있었다.
           예전에는 쪽 위쪽 60pt 를 통째로 건너뛰었다. 되풀이 머리글을 피하려던 것인데,
           이 교재는 앞 문제가 앞쪽에서 끝나면 다음 쪽 «맨 위» 에서 새 문제가 시작한다.
           실제로 세어 보니 «문제 NN» 머리글 1005개 중 449개(45%)가 60pt 위에 있었다.
           절반 가까이가 통째로 사라지고 있었다. 높이로 자르지 말고 «생김새» 로 거른다. */
      /* 되풀이 머리글은 «전기기사 실기 완벽 대비 - 핵심 빈출 146제» 처럼 글자만 있다.
         «핵심 빈출 2 ► 출제년도 : …» 은 진짜 머리글이므로 살려 둔다. */
      if(top < 60 && RUNNING_HEAD.test(t) && !/출제\s*[년연]?도/.test(t)) continue;

      let h = RE ? t.match(RE) : null;
      let bookNo = 0;
      if(HK === "출제"){
        const b = t.match(HDR_BOOK);
        if(b){
          h = [t];
          /* 오고초려는 번호가 «앞줄» 에 홀로 있다. 그 줄부터 오려야 번호가 안 잘린다. */
          const prev = li > 0 ? sorted[li-1].txt.trim() : "";
          if(!b[1] && HDR_NUMLN.test(prev)){ bookNo = +prev; top = sorted[li-1].y; }
          else if(b[1]) bookNo = +b[1];
        }
      }
      /* ── 머리글 글자가 통째로 날아간 경우 ──
         스캔본에서 «문제 02» 넉 자만 안 읽히고, 그 옆의
         «출제년도 : 09. 12. 23.   ►점수 : 3점» 은 멀쩡히 남는 쪽이 있다.
         그러면 그 문제가 앞 문제에 통째로 먹혀서 두 문제가 한 장이 된다.
         출제년도와 점수가 한 줄에 같이 있으면 그것도 머리글로 본다 — 번호는 앞 번호 + 1. */
      let ghost = false;
      if(!h && HK === "문제"){
        /* ① 조각 순서가 뒤바뀌어 «►점수 : 6점  문제 01  출제년도…» 로 읽힌 줄.
              pdf.js 는 글자 조각을 «쓰인 순서» 로 주기 때문에 쪽에 따라 앞뒤가 바뀐다. */
        const m2 = t.match(/문\s*제\s*(\d{1,3})(?![\d년])/);
        if(m2 && (ASKED.test(t) || POINT.test(t))) h = m2;
        /* ② 번호 넉 자가 통째로 안 읽힌 줄. 출제년도와 점수가 같이 있으면 머리글로 본다. */
        else if(ASKED.test(t) && POINT.test(t)){ h = [t]; ghost = true; }
      }
      if(h){
        hdrHits++;
        if(AUTOSECT && SECT) SECTHITS[SECT] = (SECTHITS[SECT] || 0) + 1;
        if(cur) cur.end = { page:p, top:top - 6 };
        /* ★ 문제집형은 «항상» 순서대로 다시 센다.
           워터마크 글자가 번호 사이에 끼어들어 «핵심 빈출 1» 이 «14» 로,
           «16» 이 «416» 으로 읽히는 일이 실제로 있다. 종이에 적힌 번호를 믿으면
           문제 순서가 통째로 뒤엉킨다. 장이 바뀔 때 1부터 다시 센다. */
        const num = HK === "출제" ? ++autoNo
                  : ghost ? lastNo + 1
                  : (h[1] && /^\d{1,3}$/.test(h[1])) ? +h[1] : ++autoNo;
        lastNo = num;
        cur = {
          no:num, seen, ghost, sect:SECT,
          asked:(t.match(ASKED)?.[1] || "").trim().replace(/\s+/g," "),
          points:+(t.match(POINT)?.[1] || 0) || null,
          source:name,
          start:{ page:p, top:Math.max(0, top - 8) }, end:null, ansAt:null, text:""
        };
        /* 오고초려·핵심빈출 — 20문항마다 회차를 하나 올린다 */
        if(AUTOSECT && (SECT === "오고초려" || SECT === "핵심빈출")){
          const seq = ++bookSeq;
          cur.no = ((seq - 1) % PER_ROUND) + 1;
          cur.seen = { year: SECT === "오고초려" ? 9301 : 9302,
                       session: Math.floor((seq - 1) / PER_ROUND) + 1 };
        }
        items.push(cur);
        continue;
      }
      /* «답안만» / «문제만» PDF 는 답안 경계가 없다. 그럴 땐 통째로 한 장으로 둔다. */
      /* 스캔본은 «답안작성» 사이가 벌어져 «답 안 작 성» 으로 읽히기도 한다 */
      if(MODE === "qa" && cur && !cur.ansAt && /답\s*안\s*작\s*성/.test(t)) cur.ansAt = { page:p, top:top - 8 };
      if(cur && !(RUNNING_HEAD.test(t) && !/출제\s*[년연]?도/.test(t))) cur.text += t + "\n";
    }
    if(cur && !cur.end) cur.lastPage = p;
  }

  /* 끝이 안 잡힌 문제는 다음 문제 시작 직전까지, 마지막은 그 쪽 끝까지 */
  items.forEach((it, i) => {
    if(!it.end){
      const nx = items[i+1];
      it.end = nx ? { page:nx.start.page, top:nx.start.top } : { page:it.lastPage || it.start.page, top:null };
    }
  });

  /* 번호 리셋으로 묶고, 묶음마다 회차를 정한다 */
  const groups = [];
  let g = [], last = 0;
  for(const it of items){
    if(it.no <= last && g.length){ groups.push(g); g = []; }
    g.push(it); last = it.no;
  }
  if(g.length) groups.push(g);

  const seenKeys = new Map();
  DUPES = DUPES || [];
  for(const grp of groups){
    const tally = new Map();
    grp.forEach(x => { if(x.seen){ const k = `${x.seen.year}-${x.seen.session}`; tally.set(k, (tally.get(k) || 0) + 1); } });
    let best = [...tally.entries()].sort((a,b) => b[1] - a[1])[0];
    /* PDF 어디에도 회차가 안 적혀 있으면, 위에서 직접 넣은 값을 쓴다.
       예전에는 여기서 그냥 건너뛰어 «문제 0개» 로 끝났고, 이유도 안 알려 줬다. */
    if(!best && MAN) best = [`${MAN.year}-${MAN.session}`, 1];
    if(!best) continue;
    const [year, session] = best[0].split("-").map(Number);
    const 앞서 = seenKeys.get(best[0]);
    if(앞서){
      /* ★ 같은 회차가 두 번 나왔다.
           기출이면 «책에 두 번 인쇄된 것» 이라 덮어쓰는 게 맞다.
           단답처럼 회차 표시가 쪽마다 없는 자료는 다르다 — 한 회차가
           번호 리셋 때문에 여러 묶음으로 갈린 것이라, 덮어쓰면 앞엣것이 사라진다.
           그럴 땐 번호를 이어 붙여 한 회차로 합친다. */
      const 기출 = grp[0] && (!grp[0].sect || grp[0].sect === "기출");
      if(!기출){
        const off = 앞서.max || 0;
        grp.forEach(x => { x.no += off; });
        앞서.max = off + Math.max(...grp.map(x => x.no - off));
        grp.forEach(x => { x.year = year; x.session = session; });
        continue;
      }
      DUPES.push(`${name} · ${year}년 제${session}회 가 ${앞서.n}번째와 겹칩니다 (${grp.length}문항)`);
      seenKeys.set(best[0], { n:앞서.n + 1, max:앞서.max });
    }else{
      seenKeys.set(best[0], { n:1, max:Math.max(...grp.map(x => x.no)) });
    }
    grp.forEach(x => { x.year = year; x.session = session; });
  }
  const out = items.filter(it => it.year && it.session);

  /* ── 구간별 성적표 ──
     구간은 제대로 들어갔는데 문항이 0개인지, 구간 자체를 못 알아봤는지는
     고치는 자리가 완전히 다르다. 그래서 «쪽 범위 · 머리글 잡은 수 · 살아남은 수» 를
     구간마다 따로 남긴다. 이게 없어서 그동안 캄캄했다. */
  if(AUTOSECT){
    const order = ["기출","오고초려","핵심빈출","단답","소방"];
    SECTREPORT = order.filter(k => SECTPAGES[k])
      .concat(Object.keys(SECTPAGES).filter(k => !order.includes(k)))
      .map(k => ({
        key:k, name:SECT_NAME[k] || k,
        from:SECTPAGES[k][0], to:SECTPAGES[k][SECTPAGES[k].length-1],
        hits:SECTHITS[k] || 0, final:out.filter(i => i.sect === k).length
      }));
    log("");
    log("── 구간별 성적표 ──");
    log("구간            쪽 범위        머리글  최종");
    if(!SECTREPORT.length) log("   구간을 하나도 못 갈랐습니다 — «전체» 모드가 아닌 것 같습니다.");
    SECTREPORT.forEach(r => log(
      `${r.name.padEnd(14)}${String(r.from).padStart(5)}~${String(r.to).padEnd(6)}`
      + `${String(r.hits).padStart(6)}${String(r.final).padStart(6)}` + (r.final ? "" : "   ← 0개")));
    SECTREPORT.filter(r => !r.final).forEach(r => log(r.hits
      ? `   «${r.name}» — 머리글은 ${r.hits}개 찾았는데 최종 0개입니다. 회차 이름표가 안 붙은 것입니다.`
      : `   «${r.name}» — 머리글을 하나도 못 찾았습니다. 머리글 규칙이 안 맞습니다.`));
  }

  /* 0개로 끝났을 때 «왜» 인지 반드시 남긴다. 이게 없어서 그동안 캄캄했다. */
  if(!out.length){
    log(`   ── 왜 0개인지 ──`);
    if(HK === "쪽") log(`   쪽마다 자르기인데도 0개면 PDF 가 안 열린 것입니다.`);
    else log(`   머리글 «${HK}» 로 찾은 줄 ${hdrHits}개` +
             (hdrHits ? "" : "  → 머리글 모양이 안 맞습니다. 위에서 다른 모양을 골라 보세요."));
    if(!roundHits && !MAN)
      log(`   «○○○○년 제○회» 표시를 한 번도 못 찾았습니다.` +
          `  → 위의 «연도 · 회차» 칸을 채우고 다시 훑어보기를 누르세요.`);
  }else{
    log(`   머리글 ${hdrHits}개 · 회차 표시 ${roundHits}쪽` + (MAN && !roundHits ? " (직접 지정값 사용)" : ""));
  }
  return out;
}

/* ═══════════════════════════════════════════════
   막히는 곳 표시 · 쉬운 해설

   실기는 문항마다 그림 크기가 제각각이라, 필기 쪽처럼 "가상 페이지 좌표"를 쓰면
   문항마다 좌표계를 새로 잡아야 한다. 그래서 아예 다른 기준을 쓴다 —
   ★ 그림 자체를 0~1 로 본 비율 좌표.
     확대하든, 화면 폭이 바뀌든, 나중에 더 큰 해상도로 다시 뜨든 같은 자리에 붙는다.

   그리고 필기(자유 곡선)보다 이쪽이 낫다고 봤다.
   손으로 그은 선은 나중에 다시 봐도 "내가 왜 여기 표시했더라" 가 되는데,
   네모로 집으면 그 자리에 대한 설명·메모가 같이 붙어 남는다.
   ═══════════════════════════════════════════════ */
const ENDPOINTS = [CFG.WORKER_URL, CFG.WORKER_BACKUP_URL].filter(Boolean);
let MARKS = {};        // practical_id → 표시 목록
let PICKING = null;    // 지금 네모를 그리는 중인 카드

/* ★ v264 — 그림을 «여러 장» 실어 보낼 수 있게 했다.
   여태 이 함수는 그림 한 장만 받았다. 그래서 해설을 만들 때 문제 그림만 가고
   답안 그림은 아예 안 갔다(아래 ezMake 참고). 한 장을 주든 배열을 주든 받는다. */
/* ★ v268 — 넷째 인자 opt { model, json } — 없으면 예전과 똑같다(워커 기본 모델).
   유형 추천처럼 «짧은 글만 보내는 일» 은 싼 모델로 돌리려고 붙였다. */
async function askAI(prompt, blob, maxTokens = 2200, opt){
  const parts = [];
  const blobs = (Array.isArray(blob) ? blob : [blob]).filter(Boolean);
  for(const bl of blobs){
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(",")[1]);
      r.onerror = () => rej(new Error("그림을 읽지 못했습니다"));
      r.readAsDataURL(bl);
    });
    parts.push({ inline_data:{ mime_type: bl.type || "image/jpeg", data: b64 } });
  }
  parts.push({ text: prompt });
  const body = { contents:[{ role:"user", parts }],
                 generationConfig:{ maxOutputTokens:maxTokens, temperature:0.3 } };
  if(opt && opt.model) body.model = opt.model;
  if(opt && opt.json) body.generationConfig.responseMimeType = "application/json";
  let last = "";
  for(const base of ENDPOINTS){
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 120000);
    try{
      const res = await fetch(base.replace(/\/$/,"") + "/get-data", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(body), signal: ac.signal });
      const d = await res.json();
      if(!res.ok){ last = d.detail || String(res.status); continue; }
      return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }catch(e){ last = e.name === "AbortError" ? "응답이 너무 오래 걸립니다" : e.message; }
    finally{ clearTimeout(t); }
  }
  throw new Error(last || "서버가 응답하지 않습니다");
}

/* 아주 단순한 마크다운 — 굵게·목록·제목만 */
function mdLite(t){
  const lines = esc(String(t || "")).split("\n");
  let out = "", ul = false;
  const close = () => { if(ul){ out += "</ul>"; ul = false; } };
  let i = 0;
  while(i < lines.length){
    const x = lines[i].trim();
    if(!x){
      close();
      let blanks=1;
      while(i+blanks<lines.length && !lines[i+blanks].trim()) blanks++;
      if(blanks>=2) out += '<p class="gap">&nbsp;</p>';
      i+=blanks; continue;
    }
    if(x === '[[box]]'){
      close();
      const body=[]; i++;
      while(i < lines.length && lines[i].trim() !== '[[/box]]'){ body.push(lines[i]); i++; }
      if(i < lines.length) i++;
      const isBoxHead = l => /^\d+\.\s+[^\d$]{1,20}$/.test(l);
      const inner = body.map(l=>l.trim()).filter(Boolean)
        .map((l,idx) => {
          if(isBoxHead(l)) return `<p class="boxhead">${inl(l)}</p>`;
          let html = `<p>${inl(l)}</p>`;
          if(idx===0) html = html.replace(/(<strong>)(\(\d{1,2}\)|[①-⑳㉑-㉟])(\s*)/, '$1<span class="numbadge">$2</span>$3');
          return html;
        }).join('');
      out += `<div class="qbox">${inner}</div>`;
      continue;
    }
    /* ★ v310 — 표 (| 머리 | … | 다음 줄 |---|) : 해설 맨 아래 용어 풀이·공식 이유·헷갈리는 짝 */
    if(/^\|.*\|$/.test(x) && /^\|[\s:\-|]+\|?$/.test((lines[i+1] || '').trim())){
      close();
      const cl = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cl(x); i += 2;
      const body = [];
      while(i < lines.length && /^\|.*\|$/.test(lines[i].trim())){ body.push(cl(lines[i])); i++; }
      out += `<div class="tblwrap eztblw"><table class="eztbl"><thead><tr>${head.map(h => `<th>${inl(h)}</th>`).join('')}</tr></thead><tbody>`
           + body.map(r => `<tr>${r.map(c => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')
           + '</tbody></table></div>';
      continue;
    }
    if(/^-{3,}$/.test(x)){ close(); out += '<hr>'; i++; continue; }
    const fence = x.match(/^```\s*([\w+-]*)\s*$/);
    if(fence){
      close();
      const lang = fence[1] || '';
      const body=[]; i++;
      while(i < lines.length && !/^```\s*$/.test(lines[i].trim())){ body.push(lines[i]); i++; }
      if(i < lines.length) i++;
      const hl = raw => raw
        .replace(/(#.*|\/\/.*)$/gm, m => `<span class="cmt">${m}</span>`)
        .replace(/\b(\d+\.?\d*)\b/g, m => `<span class="num">${m}</span>`);
      out += `<div class="codeblk">${lang ? `<div class="codeblk-head">${lang}</div>` : ''}`
        + `<pre><code>${hl(body.join('\n'))}</code></pre></div>`;
      continue;
    }
    if(/^#{1,6}\s/.test(x)){ close(); out += `<h4>${inl(x.replace(/^#+\s/,""))}</h4>`; i++; continue; }
    if(/^[-*]\s/.test(x)){ if(!ul){ out += "<ul>"; ul = true; }
      /* ★ v333 — 한 칸 안의 줄바꿈: «- 왜: …» 다음 줄들이 칸 밖으로 빠져 노란 상자에 첫 줄만 들어가던 것
         ① 두 칸 이상 들여 쓴 다음 줄 ② «왜:» 칸이면 빈 줄 · 새 목록 · 머리줄 · 식 줄 · 답 줄 전까지 → 같은 칸에 줄바꿈으로 */
      const body = x.replace(/^[-*]\s/,"");
      let li = inl(body); i++;
      const whyLi = /^(?:왜|읽기)\s*[:：]/.test(body);
      const BLK = /^(?:[-*]\s|\d+[.)]\s|#{1,6}\s|\||\$\$|&gt;|>|```|\[\[|-{3,}$|\(\d{1,2}\)|[①-⑳]|\*\*[^*]+\*\*\s*$)/;
      while(i < lines.length){
        const raw = lines[i].replace(/&nbsp;|\uE000/g, " "), y = raw.trim();   /* 들여쓰기 살리기(v153)가 빈칸을 \uE000 으로 바꿔 둠 → 빈칸으로 보고 앞 빈칸은 떼고 붙임 */
        if(!y) break;
        if(/^\s{2,}\S/.test(raw) && !/^\s*[-*]\s/.test(raw)){ li += "<br>" + inl(y); i++; continue; }
        if(whyLi && !BLK.test(y)){ li += "<br>" + inl(y); i++; continue; }
        break;
      }
      out += `<li>${li}</li>`; continue; }
    close(); out += `<p>${inl(x)}</p>`; i++;
  }
  close(); return out;
}
/* ══════════════════════════════════════════════════════════════
   v192 · «고쳐도 안 깨지는» 서식 알아보기

   여태 서식은 «글자가 정확히 이 모양일 때만» 입혀졌다. 그래서 고치기 창에서
   글자 몇 개만 지워도 — 괄호 한 짝, 뒤에 붙은 빈칸 하나 — 파란 줄과 박스가
   통째로 풀렸다. 고치는 건 당연히 할 수 있어야 하는 일이므로, 알아보는 쪽을
   너그럽게 만든다. 아래 세 가지를 견딘다.
     ① 굵게 감싼 것      **(1) …**  __(1) …__   → 벗겨 내고 본다
     ② 전각 괄호·번호     （1）  ⑴              → 반각으로 맞춰 본다
     ③ 번호 뒤 빈칸 없음  (1)내용                → 있든 없든 같게 본다
   ══════════════════════════════════════════════════════════════ */
/* 굵게 표시를 벗긴다 — 알아보기용으로만 쓰고, 그려낼 땐 원래 줄을 쓴다 */
const unbold = s => String(s)
  .replace(/^\s*(?:\*\*|__)\s*([\s\S]*?)\s*(?:\*\*|__)\s*$/, '$1').trim();
/* 괄호·번호를 반각으로 맞춘다 */
const flatnum = s => String(s)
  .replace(/[（(]\s*(\d{1,2})\s*[）)]/g, '($1)')
  .replace(/[⑴-⒇]/g, m => '(' + (m.charCodeAt(0) - 0x2473) + ')');
/* 알아보기용 «맨몸» 줄 */
const bareline = s => flatnum(unbold(s));

/* 박스 여닫는 표시 — [[box]] · [[ box ]] · [box] · [[박스]] · [[BOX]] 다 받는다 */
const BOXOPEN  = t => /^\[{1,2}\s*(?:box|박스)\s*\]{1,2}\s*$/i.test(String(t).trim());
const BOXCLOSE = t => /^\[{1,2}\s*\/\s*(?:box|박스|end)\s*\]{1,2}\s*$/i.test(String(t).trim())
                   || /^\[{1,2}\s*(?:\/box|endbox|박스끝)\s*\]{1,2}\s*$/i.test(String(t).trim());

/* 큰 물음 (1)(2)(3) — 뒤에 빈칸이 없어도, 굵게 감싸도 알아본다 */
const NUMLINE = t => /^\(\d{1,2}\)/.test(bareline(t));
/* 잔물음 ①②③ · 1) · 가. */
const SUBLINE = t => /^(?:[①-⑳㉑-㉟]|\d{1,2}\)|[가-핳]\.)/.test(bareline(t));
/* «답 : 4000[kVA]» — 앞에 ▶ ► ▷ - • 같은 머리표가 붙어 있어도 답 줄로 본다 */
const ANSLINE = t => /^(?:[▶►▷▸‣·•\-–—]\s*)?답\s*[:：]/.test(bareline(t));
/* 박스 안의 «1. 주어진 값» 같은 짧은 소제목 (계산식은 제외) */
const BOXHEAD = t => /^\d+\.\s*[^\d$]{1,20}$/.test(bareline(t));

/* ★ 예전에는 여기서 $…$ 를 «벗겨» 버렸다. 해설에 LaTeX 를 못 쓰게 막아 두었기 때문이다.
   이제 해설도 수식으로 쓴다 — 달러 기호를 그대로 남겨 KaTeX 가 그리게 한다. */
const inl = x => x.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                  .replace(/`([^`]+)`/g, "<code>$1</code>");

/* ══════════════════════════════════════════════════════════════
   글자로 변환 — 실기 문항을 «그림» 이 아니라 «글» 로 읽는다

   오려낸 PDF 조각은 원본 여백까지 그대로 들고 온다. 폰에서는 찌부러지고,
   확대해도 표가 안 읽히고, 찾기도 안 되고, 형광펜도 못 긋는다.
   그래서 한 번만 AI 로 훑어 «마크다운 + 수식 + 표» 로 옮겨 두고,
   그 다음부터는 필기뷰어와 똑같이 글로 읽는다.

   글로 옮길 수 없는 것 — 결선도·시퀀스도·래더·그래프 — 은 억지로 쓰지 않는다.
   그 자리에 [[그림 x0,y0,x1,y1]] 만 남기게 하고, 화면에서 그 네모만
   원본에서 오려 «글 중간에» 끼워 넣는다.

   결과는 practicals.q_md · a_md 에 남는다(추가SQL_실기변환.sql).
   ══════════════════════════════════════════════════════════════ */

/* 마크다운 — 표·제목·목록·굵게·코드·수식까지. 필기뷰어 해설칸과 같은 결. */
/* 박스 «안» 을 그린다 — 밖과 같은 규칙(파란 물음 줄 · 잔물음 · 목록 · 답 줄)을 쓰고,
   빈 줄은 친 만큼 벌린다. 안쪽에서 또 박스를 열지는 않는다(겹박스는 읽기 나쁘다). */
/* ★ v198 · 여러 줄로 쪼개진 표 행을 도로 한 줄로 붙인다.

   AI 가 칸 안에서 줄을 바꿔 쓰면(«단면적⏎[mm²]») 한 행이 물리적으로 여러 줄이 된다.
   마크다운 표는 «한 줄 = 한 행» 이라, 이 상태로는 표로 안 보이고 날글자로 찍힌다
   (실제로 후강전선관 규격표가 통째로 이렇게 깨졌다).
   그래서 세로 막대(|) 로 시작한 줄은, 막대 개수가 첫 줄만큼 찰 때까지 다음 줄을
   이어 붙인다. 칸 안의 줄바꿈은 <br> 로 바꿔 살려 둔다 — 두 줄짜리 머리글이
   한 줄로 뭉개지지 않게. */
function mendRows(lines){
  const bars = l => (l.match(/\|/g) || []).length;
  const out = [];
  for(let i = 0; i < lines.length; i++){
    const t = lines[i];
    if(!/^\s*\|/.test(t)){ out.push(t); continue; }
    /* 이 행이 몇 칸짜리인지 — 구분줄(|---|---|)이 있으면 그것을 기준으로 삼는다 */
    let want = bars(t);
    for(let j = i + 1; j < lines.length; j++){
      const s = (lines[j] || '').trim();
      if(/^\|[\s:\-|]+\|?$/.test(s)){ want = Math.max(want, bars(s)); break; }
      if(!/^\s*\|/.test(s) && !s) break;
    }
    let acc = t;
    /* 끝이 | 로 안 닫혔거나 막대가 모자라면, 다음 줄을 <br> 로 이어 붙인다 */
    while(i + 1 < lines.length
       && (bars(acc) < want || !/\|\s*$/.test(acc))
       && !/^\s*\|[\s:\-|]+\|?\s*$/.test((lines[i+1] || '').trim())
       && (lines[i+1] || '').trim() !== ''){
      i++;
      acc = acc.replace(/\s*$/, '') + '<br>' + lines[i].trim();
      if(bars(acc) >= want && /\|\s*$/.test(acc)) break;
    }
    /* 칸 시작 바로 뒤에 붙은 <br> 는 군더더기다 — 없앤다 */
    out.push(acc.replace(/\|\s*<br>/g, '| ').replace(/<br>\s*\|/g, ' |'));
  }
  return out;
}

function boxInner(rawLines){
  /* ★ v198 — 박스 «안» 의 표가 통째로 깨져 나오던 것을 고쳤다.
     ① 박스 안에서는 표를 그리는 갈래가 아예 없어서, | 로 그린 표가 그대로
        «| 단면적 | 허용전류[A] | …» 라는 날글자로 찍혔다.
     ② 게다가 칸 안에서 줄을 바꾼 표(«단면적⏎[mm²]»)는 한 행이 여러 줄로
        쪼개져 있어서, 밖에서 그리더라도 표로 안 보였다. 그래서 먼저 행을
        도로 붙여 놓고(mendRows) 그린다 — 세로 막대 개수가 찰 때까지 잇는다. */
  const rows = mendRows(rawLines);
  let html = '', ul = false, first = true;
  const shutUl = () => { if(ul){ html += '</ul>'; ul = false; } };
  const isRow2 = l => /^\s*\|.*\|\s*$/.test(l);
  const cells2 = l => l.trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
  for(let k = 0; k < rows.length; k++){
    const line = rows[k];
    const t = line.trim();
    /* 표 — 둘째 줄이 |---|---| 모양이면 표로 본다 (밖과 같은 규칙) */
    if(isRow2(t) && /^\|[\s:\-|]+\|?$/.test((rows[k+1] || '').trim())){
      shutUl();
      const head = cells2(rows[k]); k += 2;
      const body = [];
      while(k < rows.length && isRow2(rows[k].trim())){ body.push(cells2(rows[k])); k++; }
      k--;
      html += `<div class="tblwrap"><table><thead><tr>${head.map(h => `<th>${inlR(h)}</th>`).join('')}</tr></thead><tbody>`
            + body.map(r => `<tr>${r.map(c => `<td>${inlR(c)}</td>`).join('')}</tr>`).join('')
            + '</tbody></table></div>';
      first = false; continue;
    }
    if(!t){
      /* 빈 줄 — 이어진 만큼 세어서 그만큼 벌린다 (엔터 두 번이면 한 칸, 세 번이면 두 칸) */
      shutUl();
      let blanks = 1;
      while(k + blanks < rows.length && !rows[k + blanks].trim()) blanks++;
      if(!first) html += `<div class="boxgap"${blanks >= 3 ? ' data-big="1"' : ''}></div>`;
      k += blanks - 1; continue;
    }
    if(BOXHEAD(t)){ shutUl(); html += `<p class="boxhead">${inlR(t)}</p>`; first = false; continue; }
    if(/^[-*]\s/.test(t)){
      if(!ul){ html += '<ul>'; ul = true; }
      html += `<li>${inlR(t.replace(/^[-*]\s/, ''))}</li>`; first = false; continue;
    }
    shutUl();
    const bare = bareline(t);
    if(NUMLINE(t)){
      const pm = bare.match(/^(\(\d{1,2}\))\s*([\s\S]*)$/);
      html += `<p class="num"><span class="numbadge">${pm[1]}</span>${inlR(pm[2])}</p>`;
      first = false; continue;
    }
    if(SUBLINE(t)){
      const pm = bare.match(/^([①-⑳㉑-㉟]|\d{1,2}\)|[가-핳]\.)\s*([\s\S]*)$/);
      html += `<p class="subnum"><span class="numbadge">${pm[1]}</span>${inlR(pm[2])}</p>`;
      first = false; continue;
    }
    if(ANSLINE(t)){ html += `<p class="ansline">${inlR(t)}</p>`; first = false; continue; }
    if(/^#{1,6}\s/.test(t)){ html += `<h4>${inlR(t.replace(/^#+\s/, ''))}</h4>`; first = false; continue; }
    html += `<p>${inlR(t)}</p>`; first = false;
  }
  shutUl();
  return html;
}

function mdRich(src){
  /* ★ v198 — 칸 안에서 줄바꿈된 표는 한 행이 여러 줄로 쪼개져 표로 안 보인다.
     그리기 전에 도로 붙여 둔다(박스 안팎 모두 같은 손질을 받게). */
  const lines = mendRows(esc(String(src || "")).split("\n"));
  let out = "", ul = false, ol = false, i = 0;
  const close = () => { if(ul){ out += "</ul>"; ul = false; } if(ol){ out += "</ol>"; ol = false; } };
  const isRow = t => /^\|.*\|/.test(t);
  const cells = t => t.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());

  while(i < lines.length){
    let t = lines[i].trim();
    if(!t){
      close();
      /* 빈 줄이 둘 이상 이어지면 — 엔터를 한 번 더 쳐서 일부러 더 띄운 것이니,
         그 티가 나게 빈 줄 하나를 더 그린다. 하나뿐이면(보통의 문단 나눔) 아무것도
         안 한다 — 문단 사이엔 이미 기본 여백이 있다. */
      let blanks=1;
      while(i+blanks<lines.length && !lines[i+blanks].trim()) blanks++;
      if(blanks>=2) out += '<p class="gap">&nbsp;</p>';
      i+=blanks; continue;
    }

    /* 줄 맞춤 — 줄 맨 앞의 ::c:: ::r:: ::l:: 을 읽고 떼어 낸다.
       왼쪽(기본)은 표시가 없어도 되니, 실제로 넣는 건 가운데·오른쪽뿐이다. */
    let align = '';
    const am = t.match(/^::([clr])::\s*/);
    if(am){ align = am[1]==='c' ? 'center' : am[1]==='r' ? 'right' : ''; t = t.slice(am[0].length); if(!t){ close(); i++; continue; } }
    const alignAttr = align ? ` style="text-align:${align}"` : '';

    /* 구분선 — ---(하이픈 셋 이상)만 있는 줄은 가로줄로 그린다.
       예전엔 저장할 때(오른쪽 화면→글) 만 되돌아 나왔지, 정작 이렇게 쳐서
       그릴 때는 지원한 적이 없었다 — 그냥 «---» 라는 글자로만 보였다. */
    if(/^-{3,}$/.test(t)){ close(); out += '<hr>'; i++; continue; }

    /* 코드 블록 — ```글자 ... ``` 사이를 어두운 상자로 그린다.
       숫자·주석(#·//) 만 살짝 색을 입힌다 — 실제 문제 내용은 프로그래밍 언어가
       아니니 진짜 문법 강조는 못 하지만, 이 정도만으로도 "코드처럼" 보인다. */
    const fence = t.match(/^```\s*([\w+-]*)\s*$/);
    if(fence){
      close();
      const lang = fence[1] || '';
      const body=[]; i++;
      while(i < lines.length && !/^```\s*$/.test(lines[i].trim())){ body.push(lines[i]); i++; }
      if(i < lines.length) i++;
      const hl = raw => raw
        .replace(/(#.*|\/\/.*)$/gm, m => `<span class="cmt">${m}</span>`)
        .replace(/\b(\d+\.?\d*)\b/g, m => `<span class="num">${m}</span>`);
      out += `<div class="codeblk">${lang ? `<div class="codeblk-head">${lang}</div>` : ''}`
        + `<pre><code>${hl(body.join('\n'))}</code></pre></div>`;
      continue;
    }

    /* 박스 — [[box]] 로 열고 [[/box]] 로 닫은 사이를 테두리 있는 박스로 그린다.

       ★ v192 — 손으로 «고치기» 하다가 서식이 통째로 풀리던 것을 고쳤다.
       예전에는 여는 표시를 t === '[[box]]' 로 «글자 하나까지 똑같을 때만» 알아봤다.
       그래서 대괄호 한 짝을 지우거나([[box]), 사이에 빈칸이 들어가거나([[ box ]]),
       한글로 쓰면([[박스]]) 못 알아보고 박스가 통째로 사라졌다. 이제 웬만큼
       흐트러져도 알아본다 — 글자를 고치는 게 서식을 깨는 일이 되면 안 된다.

       ★ 그리고 박스 «안» 도 밖과 똑같은 규칙으로 그린다. 예전엔 안쪽을 죄다
       맨 문단(<p>)으로만 찍어서, 박스에 넣는 순간 (1) 파란 줄도 ① 잔물음도
       다 풀려 밋밋해졌다. 이제 안에서도 (1)·①·목록·소제목이 살아 있다.

       ★ 빈 줄도 살린다. 예전엔 .filter(Boolean) 로 빈 줄을 통째로 버려서,
       박스 안에서 엔터를 두 번 세 번 쳐도 아무 일도 안 일어났다(그래서 ** 같은
       가짜 빈 줄을 넣어 쓰시게 만들었다). 이제 친 만큼 벌어진다. */
    if(BOXOPEN(t)){
      close();
      const body=[]; i++;
      let depth=1;
      while(i < lines.length){
        const s = lines[i].trim();
        if(BOXCLOSE(s)){ depth--; if(!depth){ i++; break; } }
        else if(BOXOPEN(s)) depth++;          /* 안에 또 열려 있어도 안 터지게 */
        body.push(lines[i]); i++;
      }
      out += `<div class="qbox">${boxInner(body)}</div>`;
      continue;
    }

    /* 표 — 둘째 줄이 |---|---| 모양이면 표로 본다 */
    if(isRow(t) && isRow((lines[i+1] || "").trim()) && /^\|[\s:\-|]+\|?$/.test((lines[i+1] || "").trim())){
      close();
      const head = cells(lines[i]); i += 2;
      const body = [];
      while(i < lines.length && isRow(lines[i].trim())){ body.push(cells(lines[i])); i++; }
      out += `<div class="tblwrap"><table><thead><tr>${head.map(h => `<th>${inlR(h)}</th>`).join("")}</tr></thead><tbody>`
           + body.map(r => `<tr>${r.map(c => `<td>${inlR(c)}</td>`).join("")}</tr>`).join("")
           + "</tbody></table></div>";
      continue;
    }
    /* 글로 못 옮기는 그림 자리 — 나중에 원본에서 오려 채운다.
       «=60%» 가 붙어 있으면 그 폭으로 그린다 (그림 크기 조절). */
    const fig = t.match(/^\[\[\s*그림\s*([0-9.,\s]*?)(?:=\s*(\d{1,3})\s*%)?\s*\]\]\s*(.*)$/);
    if(fig){
      close();
      const nums = (fig[1] || "").split(",").map(v => parseFloat(v)).filter(v => !isNaN(v));
      const box = nums.length === 4 ? nums.join(",") : "";
      out += `<figure data-fig="${box}"${fig[2] ? ` data-w="${fig[2]}"` : ""}><div class="figwait">그림을 오려 오는 중…</div>`
           + (fig[3] ? `<figcaption>${inlR(fig[3])}</figcaption>` : "") + `</figure>`;
      i++; continue;
    }
    if(/^#{1,6}\s/.test(t)){ close(); out += `<h4${alignAttr}>${inlR(t.replace(/^#+\s/, ""))}</h4>`; i++; continue; }
    if(/^[-*]\s/.test(t)){ if(ol){ out += "</ol>"; ol = false; } if(!ul){ out += "<ul>"; ul = true; }
      out += `<li>${inlR(t.replace(/^[-*]\s/, ""))}</li>`; i++; continue; }
    if(/^\d+[.)]\s/.test(t)){ if(ul){ out += "</ul>"; ul = false; } if(!ol){ out += "<ol>"; ol = true; }
      out += `<li>${inlR(t.replace(/^\d+[.)]\s/, ""))}</li>`; i++; continue; }
    /* 【규모】 [조건] 처럼 꺾쇠로만 된 줄은 작은 소제목으로 띄운다 */
    if(/^(【[^】]{1,14}】|\[[^\]]{1,14}\])$/.test(t.replace(/&lt;|&gt;/g,""))){
      close(); out += `<p class="blk"${alignAttr}>${inlR(t)}</p>`; i++; continue;
    }
    /* (1)(2)(3) 은 큰 물음 구분 — 파란 줄을 친다.
       ①②③ · 가.나.다. 는 그 «안의» 잔물음이라, 굵은 글자로만 가볍게 — 안 그러면
       (2) 안에 ①②가 또 있을 때 파란 줄이 겹겹이 쌓여 꾸역꾸역 들어찬 것처럼 보인다.
       ★ v192 — **(1)** 처럼 굵게 감싸거나 «(1)내용» 처럼 빈칸을 빼먹어도 알아본다.
         (AI 가 자꾸 굵게 감싸는 바람에 색이 사라지던 것을, 프롬프트로 막는 대신
          알아보는 쪽을 너그럽게 해서 근본에서 없앴다) */
    if(NUMLINE(t)){
      close();
      const pm = bareline(t).match(/^(\(\d{1,2}\))\s*([\s\S]*)$/);
      out += `<p class="num"${alignAttr}><span class="numbadge">${pm[1]}</span>${inlR(pm[2])}</p>`;
      i++; continue;
    }
    if(SUBLINE(t)){
      close();
      const pm = bareline(t).match(/^([①-⑳㉑-㉟]|\d{1,2}\)|[가-핳]\.)\s*([\s\S]*)$/);
      out += `<p class="subnum"${alignAttr}><span class="numbadge">${pm[1]}</span>${inlR(pm[2])}</p>`;
      i++; continue;
    }
    if(ANSLINE(t)){ close(); out += `<p class="ansline"${alignAttr}>${inlR(t)}</p>`; i++; continue; }
    close(); out += `<p${alignAttr}>${inlR(t)}</p>`; i++;
  }
  close();
  /* 물음 앞의 설명글(지문)에 시인성을 준다 — 첫 번호 물음이 나오기 전까지를
     강조 상자로 감싼다. 번호 물음이 아예 없으면(짧은 단일 문제) 손대지 않는다.

     ★ v192 — 여기서 박스가 통째로 비어 보이던 버그를 잡았다.
     예전에는 «첫 <p class="num">» 자리를 글자 위치로만 찾아 그 앞뒤를 잘랐다.
     그런데 그 물음 줄이 박스 «안» 에 있으면, 자르는 자리가 <div class="qbox"> 의
     한복판이 된다 — 여는 태그와 닫는 태그가 갈라져 박스가 빈 껍데기로 나오고
     내용은 박스 밖으로 쏟아졌다(**(1)번문항** 을 넣으면 늘 이랬다).
     그래서 박스가 먼저 나오면 거기서 자른다 — 태그를 가로지르지 않는다. */
  let firstNumAt = out.indexOf('<p class="num"');
  const firstBoxAt = out.indexOf('<div class="qbox"');
  if(firstBoxAt >= 0 && (firstNumAt < 0 || firstNumAt > firstBoxAt)) firstNumAt = firstBoxAt;
  if(firstNumAt > 0) out = `<div class="introbox">${out.slice(0, firstNumAt)}</div>${out.slice(firstNumAt)}`;
  return out;
}
/* 줄 안쪽 — 수식은 KaTeX 가 나중에 그리도록 $…$ 를 그대로 둔다 */
const inlR = x => x.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                   .replace(/`([^`]+)`/g, "<code>$1</code>")
                   /* 줄 맨 앞이 아니라 문장 «중간» 에 낀 ①②③ 도 옅게라도 표시를 준다 —
                      «(2) ① 부하전류…» 처럼 큰 물음과 잔물음이 한 줄에 붙어 나올 때,
                      앞의 (2) 는 따로 배지로 떼어내지만 뒤에 남은 ① 은 그냥 맨 글자로
                      묻혀 버렸었다. */
                   .replace(/([①-⑳㉑-㉟])/g, '<span class="numbadge">$1</span>');

function tex(el){
  if(!el || !window.renderMathInElement) return;
  try{ renderMathInElement(el, { delimiters:[
    { left:"$$", right:"$$", display:true }, { left:"$", right:"$", display:false },
    { left:"\\[", right:"\\]", display:true }, { left:"\\(", right:"\\)", display:false }
  ], throwOnError:false, ignoredTags:["script","style","textarea","pre","code"] }); }catch(e){globalThis.__q?.(e)}
}

/* ══ 흰 여백 재기 ══
   그림을 작게 줄여 한 번 훑어 «글자·선이 있는 네모» 를 찾는다.
   원본은 손대지 않는다 — 화면에서 보이는 창만 그 네모로 좁힌다.
   그래서 그 위에 저장해 둔 필기와 «막히는 곳» 좌표가 어긋나지 않는다. */
const TRIM = new Map();
async function trimBox(url){
  if(TRIM.has(url)) return TRIM.get(url);
  const p = (async () => {
    const blob = await fetch(url).then(r => r.blob());
    const bmp  = await createImageBitmap(blob);
    const W = 260, H = Math.max(1, Math.round(W * bmp.height / bmp.width));
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const cx = cv.getContext("2d", { willReadFrequently:true });
    cx.fillStyle = "#fff"; cx.fillRect(0, 0, W, H);
    cx.drawImage(bmp, 0, 0, W, H);
    const iar = bmp.width / bmp.height;
    bmp.close?.();
    const d = cx.getImageData(0, 0, W, H).data;
    /* 워터마크는 아주 흐리다. 문턱을 조금 낮춰 «진짜 글자» 만 센다 */
    const INK = 208;
    const rowHas = new Array(H).fill(0), colHas = new Array(W).fill(0);
    for(let y = 0; y < H; y++){
      for(let x = 0; x < W; x++){
        const i = (y * W + x) * 4;
        if(Math.min(d[i], d[i+1], d[i+2]) < INK){ rowHas[y]++; colHas[x]++; }
      }
    }
    const firstIdx = (a, min) => { for(let i = 0; i < a.length; i++) if(a[i] > min) return i; return -1; };
    const lastIdx  = (a, min) => { for(let i = a.length - 1; i >= 0; i--) if(a[i] > min) return i; return -1; };
    const t = firstIdx(rowHas, 0), b = lastIdx(rowHas, 0);
    const l = firstIdx(colHas, 0), r = lastIdx(colHas, 0);
    if(t < 0 || l < 0 || b <= t || r <= l) return { on:false, iar };
    const PAD = 0.008;                                   /* 글자가 딱 붙지 않게 아주 조금 남긴다 */
    const tl = Math.max(0, l / W - PAD), tt = Math.max(0, t / H - PAD);
    const tr = Math.min(1, (r + 1) / W + PAD), tb = Math.min(1, (b + 1) / H + PAD);
    const tw = tr - tl, th = tb - tt;
    /* 잘라 봐야 얼마 안 줄면 굳이 손대지 않는다 */
    if(tw > 0.97 && th > 0.97) return { on:false, iar };
    return { on:true, tl, tt, tw, th, iar, tar: iar * tw / th };
  })().catch(() => ({ on:false, iar:1 }));
  TRIM.set(url, p);
  return p;
}

/* ══════════════════════════════════════════════════════════════
   그림 «속» 의 빈 띠까지 줄인다 — 한눈에 보기 전용
   ──────────────────────────────────────────────────────────────
   바깥 여백만 잘라 내는 것으로는 부족한 그림이 있다.
   PDF 두 쪽을 위아래로 이어 붙인 문항이 그렇다. 이어 붙인 자리에
     ① 앞 쪽의 아래 빈 곳  ② 쪽 번호 줄  ③ 뒤 쪽의 위 빈 곳
   이 그대로 남아, 지문과 물음 사이가 손가락 두 마디만큼 벌어진다.

   그래서 «글자가 한 톨도 없는 가로 띠» 를 찾아 얇게 눌러 준다.
   원본 파일은 건드리지 않는다 — 화면에 붙일 그림만 캔버스에서 새로 그린다.

   ★ 목록 화면(.pz)에는 일부러 쓰지 않는다.
     거기에는 그림 위에 손으로 그린 필기와 «막히는 곳» 표시가 좌표로 얹혀 있어서,
     중간을 접으면 그 좌표가 통째로 어긋난다. 필기가 없는 한눈에 판에서만 쓴다.
   ══════════════════════════════════════════════════════════════ */
const SQZ = new Map();
const SQZ_MAX = 40;                 /* 만들어 둔 그림을 이만큼만 들고 있는다 */

async function squeeze(url){
  if(SQZ.has(url)) return SQZ.get(url);
  const job = (async () => {
    const blob = await fetch(url).then(r => r.blob());
    const bmp  = await createImageBitmap(blob);
    try{
      /* ── 1) 작게 줄여서 «어디에 글자가 있나» 만 훑는다 ── */
      const AW = 320, AH = Math.max(1, Math.round(AW * bmp.height / bmp.width));
      const ac = document.createElement("canvas"); ac.width = AW; ac.height = AH;
      const ax = ac.getContext("2d", { willReadFrequently:true });
      ax.fillStyle = "#fff"; ax.fillRect(0, 0, AW, AH);
      ax.drawImage(bmp, 0, 0, AW, AH);
      const d = ax.getImageData(0, 0, AW, AH).data;

      const INK = 208;                       /* 워터마크는 흐리다 — 이 아래만 «글자» 로 본다 */
      const rowInk = new Array(AH).fill(0), colInk = new Array(AW).fill(0);
      for(let y = 0; y < AH; y++){
        for(let x = 0; x < AW; x++){
          const i = (y * AW + x) * 4;
          if(Math.min(d[i], d[i+1], d[i+2]) < INK){ rowInk[y]++; colInk[x]++; }
        }
      }
      /* ── 2) 바깥 테두리 ── */
      const first = a => { for(let i = 0; i < a.length; i++) if(a[i] > 0) return i; return -1; };
      const last  = a => { for(let i = a.length - 1; i >= 0; i--) if(a[i] > 0) return i; return -1; };
      const t = first(rowInk), b = last(rowInk), l = first(colInk), r = last(colInk);
      if(t < 0 || l < 0 || b <= t || r <= l) return null;

      const PADX = Math.round(AW * 0.008), PADY = Math.round(AH * 0.006);
      const x0 = Math.max(0, l - PADX), x1 = Math.min(AW, r + 1 + PADX);
      const y0 = Math.max(0, t - PADY), y1 = Math.min(AH, b + 1 + PADY);

      /* ── 3) 안쪽의 «글자 없는 가로 띠» 를 찾는다 ──
         너무 짧은 것은 줄 사이 간격이니 건드리지 않는다. 문단이 붙어 버린다. */
      const MINRUN = Math.max(6, Math.round(AH * 0.022));   /* 이보다 긴 빈 띠만 */
      const KEEP   = Math.max(3, Math.round(AH * 0.008));   /* 이만큼만 남기고 눌러 준다 */
      const segs = [];                                      /* 남길 [시작,끝) 구간들 */
      let cut = 0, s0 = y0;
      for(let y = y0; y < y1; y++){
        if(rowInk[y] > 0) continue;
        let e = y; while(e < y1 && rowInk[e] === 0) e++;
        const run = e - y;
        if(run > MINRUN){
          segs.push([s0, y + KEEP]);                        /* 빈 띠를 KEEP 만큼만 남긴다 */
          cut += run - KEEP;
          s0 = e;
        }
        y = e - 1;
      }
      segs.push([s0, y1]);

      /* 줄어드는 게 얼마 안 되면 굳이 새로 그리지 않는다 — 원래 방식(CSS 창 자르기)이 더 싸다 */
      const outAH = (y1 - y0) - cut;
      if(cut / Math.max(1, AH) < 0.02 && (x1 - x0) / AW > 0.97 && (y1 - y0) / AH > 0.97) return null;

      /* ── 4) 제 해상도로 다시 그린다 ── */
      const sx = bmp.width / AW, sy = bmp.height / AH;
      const srcW = (x1 - x0) * sx;
      const OW = Math.min(srcW, 1600);        /* 원본보다 크게 늘리지는 않는다 */
      const scale = OW / srcW;
      const OH = Math.max(1, Math.round(outAH * sy * scale));
      const oc = document.createElement("canvas"); oc.width = Math.round(OW); oc.height = OH;
      const ox = oc.getContext("2d");
      ox.fillStyle = "#fff"; ox.fillRect(0, 0, oc.width, oc.height);
      ox.imageSmoothingQuality = "high";
      let dy = 0;
      for(const [a, z] of segs){
        if(z <= a) continue;
        const h = Math.round((z - a) * sy * scale);
        ox.drawImage(bmp,
          x0 * sx, a * sy, (x1 - x0) * sx, (z - a) * sy,
          0, dy, oc.width, h);
        dy += h;
      }
      const out = await new Promise(res => oc.toBlob(res, "image/webp", 0.92));
      if(!out) return null;
      return { src: URL.createObjectURL(out), ar: oc.width / oc.height };
    } finally { bmp.close?.(); }
  })().catch(() => null);

  SQZ.set(url, job);
  /* 오래된 것부터 놓아 준다 — 안 그러면 오래 켜 둔 만큼 메모리가 는다 */
  if(SQZ.size > SQZ_MAX){
    const old = SQZ.keys().next().value;
    SQZ.get(old)?.then(v => { if(v?.src) URL.revokeObjectURL(v.src); }).catch(() => {});
    SQZ.delete(old);
  }
  return job;
}

/* 한눈에 판의 그림을 «속까지 좁힌» 것으로 갈아 끼운다 */
async function applySqueeze(root){
  const els = [...(root || document).querySelectorAll(".tw[data-trim]:not([data-sqz])")];
  for(const el of els){
    el.dataset.sqz = "1";
    const url = el.dataset.trim; if(!url) continue;
    let v; try{ v = await squeeze(url); }catch(e){ continue; }
    if(!v) continue;
    const im = el.querySelector("img"); if(!im) continue;
    im.dataset.orig = im.dataset.orig || im.src;   /* 원본 크기로 펼 때 되돌릴 것 */
    im.src = v.src;
    /* 이미 그림 자체가 좁혀졌으니 CSS 창 자르기는 쓰지 않는다 (두 번 자르면 글자가 잘린다) */
    el.dataset.trimmed = "1"; el.dataset.done = "1";
    el.classList.remove("on");
    el.style.aspectRatio = "";
  }
}

/* 화면에 붙은 그림들의 여백을 실제로 좁힌다 */
async function applyTrim(root){
  if(!TRIMON) return;
  const els = [...(root || document).querySelectorAll("[data-trim]:not([data-trimmed])")];
  for(const el of els){
    const url = el.dataset.trim; if(!url) continue;
    el.dataset.trimmed = "1";
    let t; try{ t = await trimBox(url); }catch(e){ continue; }
    if(!t?.on) continue;
    el.style.setProperty("--tl", t.tl.toFixed(4));
    el.style.setProperty("--tt", t.tt.toFixed(4));
    el.style.setProperty("--tw", t.tw.toFixed(4));
    el.style.setProperty("--th", t.th.toFixed(4));
    el.style.setProperty("--iar", t.iar.toFixed(4));
    el.style.setProperty("--tar", t.tar.toFixed(4));
    el.classList.add(el.classList.contains("pz") ? "trim" : "on");
  }
}
/* ★ 여백 자르기는 끌 이유가 없다 — 끄면 종이 여백만 보느라 글자가 작아진다.
   단추를 없애고 늘 켠 것으로 못 박는다. 목록도, 한눈에 보기도 같은 값을 쓴다. */
const TRIMON = true;

/* [[그림 …]] 자리를 원본에서 오려 채운다. 좌표가 없으면 그림 전체를 넣는다. */
const FIGCACHE = new Map();
async function figFill(root, url){
  if(!root || !url) return;
  const jobs = [...root.querySelectorAll("figure[data-fig]")].filter(f => !f.dataset.done);
  for(const f of jobs){
    f.dataset.done = "1";
    const nums = (f.dataset.fig || "").split(",").map(v => parseFloat(v)).filter(v => !isNaN(v));
    try{
      let src;
      if(nums.length === 4){
        const [x0, y0, x1, y1] = nums;
        const rect = { x:Math.min(x0,x1), y:Math.min(y0,y1),
                       w:Math.abs(x1-x0), h:Math.abs(y1-y0) };
        /* 너무 작게 잡히면 잘못 읽은 것이다 — 그럴 땐 통째로 보여 준다 */
        if(rect.w < 0.06 || rect.h < 0.03) throw new Error("small");
        const key = `${url}|${nums.map(n => n.toFixed(3)).join(",")}`;
        if(!FIGCACHE.has(key)){
          const blob = await cropRect(url, rect);
          FIGCACHE.set(key, URL.createObjectURL(blob));
        }
        src = FIGCACHE.get(key);
      }else src = url;
      const im = document.createElement("img");
      im.src = src; im.loading = "lazy"; im.alt = "원본에서 오려 온 그림";
      f.querySelector(".figwait")?.replaceWith(im);
    }catch(e){
      const im = document.createElement("img");
      im.src = url; im.loading = "lazy"; im.alt = "원본 그림";
      f.querySelector(".figwait")?.replaceWith(im);
    }
  }
}

/* ── 변환 프롬프트 ── */
const CV_PROMPT = (what) =>
`너는 전기기사 실기 기출문제집을 «글자» 로 옮기는 사람이다.
첨부한 그림은 기출 PDF 에서 오려 낸 ${what} 한 덩어리다. 보이는 그대로 한국어 마크다운으로 옮겨라.

[반드시 지켜라]
1. 없는 내용을 지어내지 마라. 안 보이면 안 보인다고 두고 넘어가라. 풀이·해설을 새로 쓰지도 마라.
2. 문제 번호·머리글(«문제 01», «출제년도», «점수», «답안작성»)은 옮기지 마라. 본문만 옮긴다.
3. 수식은 LaTeX 로 쓰고 $ … $ 로 감싼다. 여러 줄로 크게 보여야 하는 식은 $$ … $$ 로 감싼다.
   예) $P_s=\\sqrt{3}\\,V I_s$ , $\\dfrac{22900}{\\sqrt{3}}=13221.32$
4. 표는 반드시 마크다운 표로 옮긴다. 표를 글로 풀어쓰지 마라.
   | 동별 | 세대당면적[m²] | 세대수 |
   |---|---|---|
   | 1동 | 50 | 30 |
5. ①②③ · (1)(2)(3) · 가나다 같은 번호 매김은 원문 그대로 살린다.
6. ★ 글로 옮길 수 없는 그림 — 단선결선도 · 시퀀스도 · 래더 · 논리회로 · 철탑 배치도 ·
   부하곡선 그래프 · 계기 배치 그림 — 은 «절대 글로 설명하지 마라».
   그 자리에 아래 한 줄만 넣어라.
       [[그림 x0,y0,x1,y1]] 짧은 이름
   x0,y0,x1,y1 은 그림 전체를 가로 0~1 · 세로 0~1 로 봤을 때
   그 도면이 차지하는 네모의 왼쪽위·오른쪽아래 좌표다. 소수 둘째 자리까지.
   넉넉하게 잡아라 — 잘려 나가는 것보다 여백이 좀 붙는 편이 낫다.
   예) [[그림 0.10,0.22,0.92,0.58]] 특고압 수전설비 단선결선도
7. 마크다운 코드펜스(\`\`\`)로 감싸지 마라. 머리말·맺음말도 쓰지 마라. 옮긴 본문만 출력한다.`;

let CVSTOP = false, CVBUSY = false;
const cvSay = t => { const el = $("#cvStat"); if(el) el.textContent = t; };

async function cvOne(r, side){
  const url = side === "a" ? r.a_url : r.q_url;
  if(!url) return null;
  const blob = await fetch(url).then(x => x.blob());
  const raw = await askAI(CV_PROMPT(side === "a" ? "답안" : "문제"), blob, 4096);
  const md = String(raw || "").replace(/```[a-z]*\n?/gi, "").trim();
  return md || null;
}

async function cvRow(r, force){
  const patch = {};
  /* ★ v192 — 잠긴 칸은 손대지 않는다. 여기 한 곳만 막으면 낱개든 일괄이든
     («변환» · «이 회차 전체» · «한 번에») 전부 이 자물쇠를 지키게 된다. */
  const lockQ = (()=>{ try{ return window.__locked && window.__locked('q') }catch(e){ return false } })();
  const lockA = (()=>{ try{ return window.__locked && window.__locked('a') }catch(e){ return false } })();
  if(r.q_url && !lockQ && (force || !r.q_md)){ const m = await cvOne(r, "q"); if(m) patch.q_md = m; }
  if(r.a_url && !lockA && (force || !r.a_md)){ const m = await cvOne(r, "a"); if(m) patch.a_md = m; }
  if(!Object.keys(patch).length) return false;
  const up = await sb.from("practicals").update(patch).eq("id", r.id);
  if(up.error) throw new Error(/q_md|a_md|schema cache/i.test(up.error.message)
    ? "q_md · a_md 칸이 아직 없습니다 — 추가SQL_실기변환.sql 을 먼저 돌려 주세요."
    : up.error.message);
  Object.assign(r, patch);
  return true;
}

/* ★ v199 · 한 칸만 그림 → 글자로 다시 뽑는다.

   cvRow 는 문제·답안을 «둘 다» 본다. 그런데 실제로는 «답안 표만 뭉개졌으니
   답안만 다시 읽고 싶다» 같은 일이 훨씬 잦다. 둘 다 돌리면 멀쩡한 문제까지
   새로 뽑혀 덮어써지고 시간도 두 배로 든다. 그래서 한 칸만 도는 길을 낸다.
   which 는 'q' 또는 'a'. 잠긴 칸은 여기서도 건드리지 않는다. */
async function cvField(r, which){
  const url = which === 'q' ? r.q_url : r.a_url;
  const key = which === 'q' ? 'q_md' : 'a_md';
  const nm  = which === 'q' ? '문제' : '답안';
  if(!url) throw new Error(`${nm}는 원본 그림이 없어 글자로 뽑을 수 없습니다`);
  if(window.__locked && window.__locked(which))
    throw new Error(`${nm} 칸이 «변환 금지» 로 잠겨 있습니다`);
  const md = await cvOne(r, which);
  if(!md || !md.trim()) throw new Error(`${nm}에서 글자를 못 읽었습니다`);
  const patch = {}; patch[key] = md;
  const up = await sb.from("practicals").update(patch).eq("id", r.id);
  if(up.error) throw new Error(/q_md|a_md|schema cache/i.test(up.error.message)
    ? "q_md · a_md 칸이 아직 없습니다 — 추가SQL_실기변환.sql 을 먼저 돌려 주세요."
    : up.error.message);
  Object.assign(r, patch);
  return true;
}
try{ window.cvField = cvField; }catch(e){globalThis.__q?.(e)}

/* 지금 화면에 걸린 조건 안의 문항을 죽 훑는다.
   force 가 false 면 «아직 안 바뀐 것» 만 골라 채운다 — 중간에 끊겨도 이어서 하면 된다. */
async function cvRun(force){
  if(CVBUSY) return;
  /* ★ 예전에는 «지금 화면에 걸린 것» 만 돌았다. 연도·회차를 걸어 둔 채 누르면
     나머지가 통째로 빠지는데 화면에는 «완료» 로 보여 오해를 부른다.
     «변환» 은 이 과목 전체를 본다. 한 문항만 다시 하려면 카드의 «↻ 다시 변환». */
  /* «남은 것» 의 뜻을 cvCount 와 한 글자까지 맞춘다 —
     답안 그림만 있고 그 글자가 이미 있는 줄이 매번 헛돌던 것을 막는다. */
  /* ★ v193 — 잠근 칸은 아예 담지 않는다. force(처음부터 다시)일 때도 마찬가지다:
     둘 다 잠겼으면 그 문항은 할 일이 없다. */
  const lkQ = () => !!(window.__locked && window.__locked('q'));
  const lkA = () => !!(window.__locked && window.__locked('a'));
  const pool = ROWS
    .filter(r => force ? ((r.q_url && !lkQ()) || (r.a_url && !lkA()))
                       : ((r.q_url && !r.q_md && !lkQ()) || (r.a_url && !r.a_md && !lkA())));
  if(!pool.length){
    cvSay("변환할 문항이 없습니다 — 지금 조건 안은 모두 글자로 바뀌어 있습니다.");
    return;
  }
  if(force && !confirm(`${pool.length}개를 처음부터 다시 변환합니다.\n이미 바꿔 둔 글자는 새 것으로 덮어씁니다. 계속할까요?`)) return;

  CVBUSY = true; CVSTOP = false;
  $("#cvStop").hidden = false;
  $("#cvProg").hidden = false;
  ["#cvGap","#ezRun","#cvAll","#cvAllSess"].forEach(k => { const b = $(k); if(b) b.disabled = true; });

  let ok = 0, bad = 0, n = 0;
  const fails = [];
  for(const r of pool){
    if(CVSTOP) break;
    n++;
    cvSay(`변환 중 ${n}/${pool.length} — ${r.year}년 제${r.session}회 ${r.no}번 · 됨 ${ok} · 실패 ${bad}`);
    $("#cvBar").style.width = (n / pool.length * 100) + "%";
    try{
      if(await cvRow(r, force)) ok++;
    }catch(e){
      bad++;
      const why = e.message || String(e);
      fails.push(`${r.year}-${r.session} ${r.no}번 — ${why}`);
      log(`변환 실패 ${r.year}-${r.session} ${r.no}번 — ${why}`);
      if(/추가SQL_실기변환/.test(why)) break;      /* 칸이 없으면 더 돌려 봐야 소용없다 */
    }
    /* 서버가 몰려서 죄다 거절하는 일을 막는다 */
    await new Promise(s => setTimeout(s, 350));
  }

  $("#cvStop").hidden = true;
  $("#cvProg").hidden = true;
  ["#cvGap","#ezRun","#cvAll","#cvAllSess"].forEach(k => { const b = $(k); if(b) b.disabled = false; });
  CVBUSY = false;
  cvSay((CVSTOP ? "중지했습니다. " : "") + `변환 ${ok}개 완료` + (bad ? ` · ${bad}개 실패` : "")
    + (bad ? "  (아래 기록을 보세요)" : ""));
  if(fails.length) log("[변환 실패]\n" + fails.join("\n"));
  if(!TEXTMODE && ok){ TEXTMODE = true; paintText(); }
  drawList(); cvCount();
}

/* ── 글자로 보기 ↔ 그림으로 보기 ── */
let TEXTMODE = (()=>{ try{ return localStorage.getItem("prac:text") === "1"; }catch(e){ return false; } })();
function paintText(){
  /* v203 — «텍스트로 보기» 를 걷어냈다.
     TEXTMODE 를 켜는 곳이 변환 완료·자동 전환 등 여러 군데라, 단추만 숨기면
     글자 모드에 갇혀 빠져나올 방법이 없어진다. 그래서 여기서 늘 꺼 둔다.
     이 함수는 그 모든 자리에서 바로 뒤따라 불리므로 한 곳만 막으면 된다.
     되살리려면 아래 한 줄만 지우면 됨. */
  TEXTMODE = false;
  $("#fText")?.classList.toggle("on", TEXTMODE);
  const b = $("#fText"); if(b) b.textContent = TEXTMODE ? "🖼 그림으로 보기" : "가 글자로 보기";
  OVTXT = TEXTMODE;
  try{ localStorage.setItem("prac:text", TEXTMODE ? "1" : "0"); }catch(e){globalThis.__q?.(e)}
}
$("#fText")?.addEventListener("click", () => { TEXTMODE = !TEXTMODE; paintText(); drawList(); });

/* ── 보기 설정 — 글자 크기 · 칸 수 ── (여백 자르기는 늘 켜져 있다)
   한 번 정해 두면 이 기기에 남는다.
   ★ 예전엔 참/거짓 하나였다 — 켜면 무조건 세 칸(문제·답안·쉬운 풀이)이 떴다.
     그런데 단추 글씨는 «두 칸» 이라 실제로 뭐가 뜨는지와 글씨가 어긋나 있었다.
     이제 한 칸 → 두 칸(문제·답안) → 세 칸(+쉬운 풀이) 을 눌러서 돌려 가며 고른다. */
let SPLIT = (()=>{
  try{
    const v = localStorage.getItem("prac:split");
    if(v === null) return 2;               /* 처음 쓰는 사람은 예전과 같이 세 칸부터 */
    if(v === "1") return 2;                 /* 예전의 «켜짐» = 지금의 세 칸 */
    if(v === "0") return 0;
    const n = +v; return (n===1||n===2) ? n : 0;
  }catch(e){ return 2; }
})();
function paintView(){
  const fs = (()=>{ try{ return localStorage.getItem("prac:fs") || "14"; }catch(e){ return "14"; } })();
  document.documentElement.style.setProperty("--qfs", fs + "px");
  const sel = $("#fSize"); if(sel) sel.value = fs;
  const b = $("#fSplit");
  if(b){
    b.classList.toggle("on", SPLIT > 0);
    b.textContent = SPLIT === 2 ? "▥ 세 칸" : SPLIT === 1 ? "▥ 두 칸" : "▥ 한 칸";
    b.title = SPLIT === 2 ? "문제·답안·쉬운 풀이를 나란히 (다음엔 한 칸으로)"
      : SPLIT === 1 ? "문제·답안만 나란히 (다음엔 세 칸으로)" : "한 줄로 이어서 (다음엔 두 칸으로)";
  }
}
$("#fSize")?.addEventListener("change", e => {
  try{ localStorage.setItem("prac:fs", e.target.value); }catch(x){globalThis.__q?.(x)}
  paintView();
});
$("#fSplit")?.addEventListener("click", () => {
  SPLIT = (SPLIT + 1) % 3;
  try{ localStorage.setItem("prac:split", String(SPLIT)); }catch(e){globalThis.__q?.(e)}
  paintView(); drawList();
});
/* 📌 그림 크기 고정 — 저장된 낱장 크기(%)를 무시하고 다 같은 기준으로 보여준다.
   저장값 자체는 안 건드리므로, 끄면 바로 원래 크기로 돌아온다. */
(() => {
  const on = () => { try{ return localStorage.getItem("prac:imgfix") === "1"; }catch(e){ return false; } };
  const paint = () => {
    const v = on();
    document.body.classList.toggle("img-fix", v);
    $("#fImgFix")?.classList.toggle("on", v);
    $("#ovImgFix")?.classList.toggle("on", v);
    /* 단추 글씨도 지금 상태를 말하게 한다 — 눌러 놓고 «켜졌나?» 되묻지 않게 */
    const ov = $("#ovImgFix"); if(ov) ov.textContent = v ? "📌 고정됨" : "📌 그림 고정";
    const fb = $("#fImgFix"); if(fb) fb.textContent = v ? "📌 그림 크기 고정됨" : "📌 그림 크기 고정";
    /* 아직 글자로 안 바꾼 원본 그림은 CSS 만으로 안 되고 다시 그려 줘야 한다 */
    try{ window.__rawPaintAll && window.__rawPaintAll(); }catch(e){globalThis.__q?.(e)}
  };
  paint();

  /* 오른쪽 아래에 잠깐 뜨는 알림 — 본문을 가리지 않는다 */
  let bEl = null, bT = 0;
  const badge = v => {
    if(!bEl){ bEl = document.createElement("div"); bEl.className = "fixbadge"; document.body.appendChild(bEl); }
    bEl.textContent = v ? "📌 그림 크기 고정됨" : "📌 그림 고정 해제";
    bEl.classList.toggle("off", !v);
    requestAnimationFrame(() => bEl.classList.add("show"));
    clearTimeout(bT);
    bT = setTimeout(() => bEl.classList.remove("show"), 1600);
  };

  const flip = () => {
    const next = !on();
    try{ localStorage.setItem("prac:imgfix", next ? "1" : "0"); }catch(e){globalThis.__q?.(e)}
    paint();
    badge(next);
  };
  $("#fImgFix")?.addEventListener("click", flip);
  $("#ovImgFix")?.addEventListener("click", flip);
})();
/* ══ v192 · 진행 상황을 한눈에보기 «안» 에서 보여 준다 ═══════════════
   여태 로그는 목록 화면 아래에만 있었다. 한눈에를 띄워 놓고 «✨ 꾸미기» 를
   누르면 화면은 가만히 있고 아무 말도 없어서, 되는 중인지 죽은 건지 알 수가
   없었다. 이제 위쪽에 판이 하나 뜨고 — 무엇을 하는 중인지 · 몇 번째인지 ·
   막대 · 지나간 줄이 남고 · 끝나면 «완료» 라고 초록으로 못 박는다.
   목록 쪽 로그(window.__pracLog)에도 그대로 같이 적는다. */
let RFBUSY = false, RFSTOP = false;
const rfEl = k => document.getElementById(k);
function rfShow(){ const j = rfEl("ovJob"); if(j){ j.hidden = false; j.classList.remove("done","bad"); } }
function rfSay(msg, alsoAlert){
  const t = rfEl("ovJobT"); if(t) t.textContent = msg;
  try{ cvSay(msg); }catch(e){globalThis.__q?.(e)}
  if(alsoAlert && !rfEl("ovJob")) alert(msg);
}
function rfLog(line){
  const box = rfEl("ovJobLog"); if(box){
    const d = document.createElement("div");
    d.textContent = line;
    if(/^✗/.test(line)) d.className = "bad";
    else if(/^✓/.test(line)) d.className = "ok";
    box.appendChild(d); box.scrollTop = box.scrollHeight;
  }
  try{ window.__pracLog && window.__pracLog(line); }catch(e){globalThis.__q?.(e)}
}
function rfStart(total, name){
  RFBUSY = true; RFSTOP = false;
  rfShow();
  const box = rfEl("ovJobLog"); if(box) box.innerHTML = "";
  const bar = rfEl("ovJobBar"); if(bar) bar.style.width = "0%";
  const stop = rfEl("ovRfStop"); if(stop) stop.hidden = false;
  const n = rfEl("ovJobN"); if(n) n.textContent = `0 / ${total}`;
  const b = document.getElementById("ovReformat");
  if(b){ b.disabled = true; b.dataset.t0 = b.textContent; b.textContent = "✨ 손보는 중…"; }
  rfSay("와꾸 다시 맞추는 중…");
  rfLog(`시작 — ${name} · 손볼 칸 ${total}개`);
}
function rfStep(n, total, msg){
  const el = rfEl("ovJobN"); if(el) el.textContent = `${n} / ${total}`;
  const bar = rfEl("ovJobBar"); if(bar) bar.style.width = ((n - 1) / total * 100) + "%";
  rfSay(msg);
}
function rfEnd(ok, bad, stopped){
  RFBUSY = false; RFSTOP = false;
  const bar = rfEl("ovJobBar"); if(bar) bar.style.width = "100%";
  /* 세던 숫자도 끝까지 채운다 — 예전엔 «2 / 3» 에 멈춰 있어서 다 된 건지 헷갈렸다 */
  const cnt = rfEl("ovJobN");
  if(cnt){ const m = (cnt.textContent || "").match(/\/\s*(\d+)/); if(m) cnt.textContent = `${m[1]} / ${m[1]}`; }
  const stop = rfEl("ovRfStop"); if(stop) stop.hidden = true;
  const b = document.getElementById("ovReformat");
  if(b){ b.disabled = false; b.textContent = b.dataset.t0 || "✨ 이 문제 꾸미기"; }
  const j = rfEl("ovJob");
  const msg = stopped ? `중지함 — ${ok}개까지 됨` + (bad ? ` · ${bad}개 실패` : "")
            : bad ? `끝남 — ${ok}개 됨 · ${bad}개 실패`
                  : `✅ 완료 — ${ok}개 다 손봤습니다`;
  if(j) j.classList.add(bad || stopped ? "bad" : "done");
  rfSay(msg);
  rfLog(msg);
  /* 깨끗이 끝났으면 잠시 뒤 스스로 접는다 — 실패가 있으면 남겨 둔다(읽어야 하니까) */
  if(!bad && !stopped) setTimeout(() => { const x = rfEl("ovJob"); if(x && !RFBUSY) x.hidden = true; }, 6000);
}
document.getElementById("ovJobX")?.addEventListener("click", () => { const j = rfEl("ovJob"); if(j) j.hidden = true; });

/* ══ v192 · 변환 중지 단추를 한눈에보기에도 ═══════════════════════
   목록 쪽 «중지» 는 화면을 나가야 눌렀다. 돌고 있는 동안에는 여기서도 세울 수
   있어야 한다. 목록 쪽 #cvStop 을 그대로 대신 눌러 주는 방식이라, 멈추는 규칙이
   두 벌이 되지 않는다(한쪽만 고쳐도 양쪽이 같이 맞는다). */
document.getElementById("ovCvStop")?.addEventListener("click", () => {
  try{ CVSTOP = true; }catch(e){globalThis.__q?.(e)}
  const s = document.getElementById("cvStop");
  if(s && !s.hidden) s.click();
  rfShow(); rfSay("멈추는 중… 지금 하고 있는 문항이 끝나면 섭니다.");
});
/* 돌고 있을 때만 보이게 하고, 목록 쪽 진행 상황을 한눈에 판에 그대로 옮겨 적는다 */
setInterval(() => {
  const ovl = document.getElementById("ovl");
  if(!ovl || !ovl.classList.contains("on")) return;
  let busy = false;
  try{ busy = CVBUSY || EZBUSY; }catch(e){globalThis.__q?.(e)}
  const b = document.getElementById("ovCvStop");
  if(b) b.hidden = !busy;
  if(!busy || RFBUSY) return;             /* 꾸미기가 돌 때는 그쪽 글이 우선 */
  const stat = document.getElementById("cvStat");
  const txt = stat ? (stat.textContent || "").trim() : "";
  if(!txt || txt === window.__ovLastStat) return;
  window.__ovLastStat = txt;
  rfShow();
  const t = rfEl("ovJobT"); if(t) t.textContent = txt;
  const src = document.getElementById("cvBar");
  const bar = rfEl("ovJobBar");
  if(src && bar) bar.style.width = src.style.width || "0%";
}, 700);

/* ══ v192 · 칸별 «변환 금지» 자물쇠 ══════════════════════════════
   문제·답안·쉬운 풀이 세 칸을 따로 잠근다. 잠근 칸은 «✨ 이 문제 꾸미기» 도,
   일괄 작업도 통째로 건너뛴다. 왜 필요했나 — 세 칸 중 «이미 손봐 둬서 건드리면
   안 되는 칸» 이 늘 있는데, 예전엔 한 번 누르면 셋 다 덮어써져서 멀쩡하던 것까지
   날아갔다. 잠금은 이 기기에 남는다(사람마다 손봐 둔 칸이 다르므로). */
(() => {
  const LK = "prac:lock:v1";
  const read = () => { try{ return JSON.parse(localStorage.getItem(LK) || "{}") || {}; }catch(e){ return {}; } };
  let L = read();
  const paint = () => {
    $$('.lockset .lk').forEach(b => {
      const on = !!L[b.dataset.lock];
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  };
  const flip = f => {
    L[f] = !L[f];
    try{ localStorage.setItem(LK, JSON.stringify(L)); }catch(e){globalThis.__q?.(e)}
    paint();
    const NM = { q:"문제", a:"답안", ez:"쉬운 풀이" };
    try{ cvSay(`${NM[f]} — ${L[f] ? "변환 금지로 잠갔습니다 (앞으로 건너뜁니다)" : "잠금을 풀었습니다"}`); }catch(e){globalThis.__q?.(e)}
    try{ window.__pracLog && window.__pracLog(`${NM[f]} ${L[f] ? "잠금" : "잠금 해제"}`); }catch(e){globalThis.__q?.(e)}
    try{ window.__rfFieldsPaint && window.__rfFieldsPaint(); }catch(e){globalThis.__q?.(e)}
  };
  /* ★ v197 — «✨ 꾸미기» 쪽지 안에서도 같은 자물쇠를 여닫을 수 있게 내준다.
     설정을 두 벌 만들면 «머리줄에선 잠갔는데 쪽지에선 왜 켜져 있지?» 가 된다. */
  window.__lockSet = (f, v) => {
    L[f] = !!v;
    try{ localStorage.setItem(LK, JSON.stringify(L)); }catch(e){globalThis.__q?.(e)}
    paint();
    try{ window.__rfFieldsPaint && window.__rfFieldsPaint(); }catch(e){globalThis.__q?.(e)}
  };
  window.__lockClear = () => {
    L = {};
    try{ localStorage.setItem(LK, "{}"); }catch(e){globalThis.__q?.(e)}
    paint();
    try{ window.__rfFieldsPaint && window.__rfFieldsPaint(); }catch(e){globalThis.__q?.(e)}
  };
  document.addEventListener("click", e => {
    const b = e.target.closest(".lockset .lk"); if(!b) return;
    e.preventDefault(); e.stopPropagation(); flip(b.dataset.lock);
  }, true);
  /* 다른 곳(일괄 작업 · 꾸미기)에서 물어볼 수 있게 내준다 */
  window.__locked = f => { L = read(); return !!L[f]; };
  window.__lockPaint = paint;

  /* ★ v193 — «아직 할 일이 남았나» 를 한 곳에서만 판단한다.
     v192 에서는 자물쇠를 cvRow·ezMake «안» 에서만 막았다. 그런데 그 둘을 부르는
     쪽(빠르게·동시 돌리기·한 번에)은 여전히 «아직 안 됐네?» 라고 여겨서,
     잠긴 문항을 계속 물어 오고 → 돌려도 안 채워지니 → «돌렸으나 채워지지 않음» 으로
     세 번 다시 하고 → 끝내 «실패» 로 적어 두었다. 잠글수록 실패 목록만 쌓였다.
     그래서 판단 자체를 자물쇠까지 아는 하나로 모은다 — 잠긴 칸은 «할 일» 이 아니다. */
  window.__needCv = r => !!(
       (r.q_url && !r.q_md && !window.__locked('q'))
    || (r.a_url && !r.a_md && !window.__locked('a')));
  window.__needEz = r => !!(!r.easy_md && (r.q_url || r.q_md) && !window.__locked('ez')
    && !(window.__ezFixed && window.__ezFixed(r.id)));   /* ★ v267 — 고정 문항은 «할 일» 이 아니다 */

  paint();
  setTimeout(paint, 800);
})();

/* ══ v194 · «✨ 이 문제 꾸미기» 에 범위를 붙인다 ═══════════════════
   한 문항씩 눌러서는 1000개를 못 고친다. «도구» 메뉴의 빠르게 돌리기와 똑같이
   범위를 고르고 여러 개를 동시에 돌린다 — 다만 이쪽은 그림을 새로 읽지 않고
   «있는 글의 와꾸» 만 고치므로 훨씬 싸고 빠르다.
     · 이 문제만    — 지금 보고 있는 문항
     · 이 회차      — 화면에 걸린 연도·회차 (없으면 지금 문항의 회차)
     · 전체         — 이 과목 전부
     · 실패한 것    — 아래 «꾸미기 실패» 로 적힌 것만 다시
   동시에 몇 개씩 돌릴지는 «도구» 의 «동시» 값을 그대로 따른다(따로 안 만든다). */
const RFF_KEY = "prac:rffail:v1";
const rffAll = () => { try{ return JSON.parse(localStorage.getItem(RFF_KEY) || "{}") || {}; }catch(e){ return {}; } };
const rffPut = (id, why) => { const F = rffAll(); F[String(id)] = String(why || "").slice(0, 80);
  try{ localStorage.setItem(RFF_KEY, JSON.stringify(F)); }catch(e){globalThis.__q?.(e)} };
const rffDel = id => { const F = rffAll(); delete F[String(id)];
  try{ localStorage.setItem(RFF_KEY, JSON.stringify(F)); }catch(e){globalThis.__q?.(e)} };

/* 잠기지 않았고 내용이 있는 칸만 «손볼 칸» 이다 */
function rfFields(r){
  return [["q_md","문제","q"],["a_md","답안","a"],["easy_md","쉬운 풀이","ez"]]
    .filter(([key,, lk]) => r[key] && !window.__locked(lk)
      && !(lk === "ez" && window.__ezFixed && window.__ezFixed(r.id)));   /* ★ v267 */
}
function rfPool(scope){
  const rows = Array.isArray(ROWS) ? ROWS : [];
  if(scope === "one"){
    const r = rows.find(x => String(x.id) === String(OVID));
    return r ? [r] : [];
  }
  if(scope === "fail"){
    const F = rffAll();
    return rows.filter(r => F[String(r.id)] && rfFields(r).length);
  }
  /* ★ v196 — «🎲 랜덤» 으로 뽑아 놓은 것만. 랜덤이 안 걸려 있으면 지금 화면에
     걸린 문항(SHOWN)을 쓴다 — 눈앞에 보이는 것만 손보고 싶을 때가 그때다. */
  if(scope === "rand"){
    const ids = (Array.isArray(RAND) && RAND.length) ? RAND
              : (Array.isArray(SHOWN) ? SHOWN.map(r => r.id) : []);
    const set = new Set(ids.map(String));
    return rows.filter(r => set.has(String(r.id)) && rfFields(r).length);
  }
  let pool = rows.filter(r => rfFields(r).length);
  if(scope === "sess"){
    const yr = $("#fYear")?.value || "", ss = $("#fSess")?.value || "";
    if(yr || ss) pool = pool.filter(r => (!yr || String(r.year) === yr) && (!ss || String(r.session) === ss));
    else{
      const cur = rows.find(x => String(x.id) === String(OVID)) || (Array.isArray(SHOWN) ? SHOWN[0] : null);
      if(!cur) return [];
      pool = pool.filter(r => String(r.year) === String(cur.year) && String(r.session) === String(cur.session));
    }
  }
  return pool;
}

/* 한 문항의 손볼 칸을 차례로 고친다. 돌려주는 값 : null(됨) 또는 { why } */
async function rfOne(r){
  const fields = rfFields(r);
  if(!fields.length) return null;              /* 다 잠겼거나 비었으면 할 일이 없다 */
  let hurt = "";
  for(const [field, label] of fields){
    if(RFSTOP) break;
    try{ await reformatRow(r, field); }
    catch(e){ hurt = `${label} — ${(e && e.message) || e}`; break; }
  }
  return hurt ? { why: hurt } : null;
}

async function rfRun(scope){
  if(RFBUSY) return;
  let busy = false; try{ busy = CVBUSY || EZBUSY; }catch(e){globalThis.__q?.(e)}
  if(busy) return alert("지금 변환·해설 작업이 돌고 있습니다. 그것부터 끝내거나 중지해 주세요.");

  const NM = { one:"이 문제", rand:"랜덤 뽑은 것", sess:"이 회차", all:"전체", fail:"실패한 것" };
  const pool = rfPool(scope);
  if(!pool.length){
    const locked = ["q","a","ez"].filter(f => window.__locked(f)).length;
    return alert(scope === "fail" ? "꾸미기에 실패한 문항이 없습니다."
      : scope === "rand" ? "뽑혀 있는 문항이 없습니다 — «🎲 랜덤» 을 먼저 돌리거나 목록을 띄워 주세요."
      : locked === 3 ? "세 칸이 모두 «변환 금지» 로 잠겨 있습니다.\n잠금을 먼저 푸세요."
      : "손볼 문항이 없습니다 — 이 범위는 내용이 비어 있거나 다 잠겨 있습니다.");
  }

  /* 몇 칸을 손보는지 미리 세어 보여 준다 — 그래야 시간·비용을 가늠할 수 있다 */
  const cells = pool.reduce((n, r) => n + rfFields(r).length, 0);
  const lockedNames = ["q","a","ez"].filter(f => window.__locked(f))
    .map(f => ({ q:"문제", a:"답안", ez:"쉬운 풀이" })[f]);
  let conc = 8; try{ conc = (window.__fastConc && window.__fastConc()) || 8; }catch(e){globalThis.__q?.(e)}
  conc = Math.max(1, Math.min(conc, pool.length));

  if(pool.length > 1 && !confirm(`${NM[scope]} — 문항 ${pool.length}개 · 손볼 칸 ${cells}개의 와꾸를 다시 맞춥니다.\n`
    + (lockedNames.length ? `잠겨서 건너뜀 : ${lockedNames.join(" · ")}\n` : "")
    + `\n동시에 ${conc}개씩 돌립니다. 그림은 건드리지 않고, 숫자·정답도 그대로 둡니다.\n`
    + `지금 있는 글은 새 것으로 덮어씁니다. 계속할까요?`)) return;

  rfStart(pool.length, NM[scope]);
  try{ CVSTOP = false; }catch(e){globalThis.__q?.(e)}

  let idx = 0, done = 0, ok = 0, bad = 0;
  async function worker(){
    while(true){
      if(RFSTOP) return;
      const k = idx++; if(k >= pool.length) return;
      const r = pool[k];
      const nm = `${r.year}년 제${r.session}회 ${r.no}번`;
      const out = await rfOne(r);
      done++;
      if(out){ bad++; rffPut(r.id, out.why); rfLog(`✗ ${nm} — ${out.why}`); }
      else{ ok++; rffDel(r.id); rfLog(`✓ ${nm}`); }
      rfStep(done, pool.length, `와꾸 맞추는 중 — 됨 ${ok}` + (bad ? ` · 실패 ${bad}` : ""));
      /* 열어 둔 문항이 방금 끝났으면 그 자리에서 바로 갈아 끼운다 */
      try{ if(String(OVID) === String(r.id)) ovDraw(); }catch(e){globalThis.__q?.(e)}
      if(done % 8 === 0){ try{ drawList(); }catch(e){globalThis.__q?.(e)} }
      await new Promise(x => setTimeout(x, 150));
    }
  }
  /* 한꺼번에 던지면 첫머리에서만 몰려 거절당한다 — 150ms 씩 벌려 넣는다 */
  const live = [];
  for(let i = 0; i < conc; i++){
    live.push(worker());
    await new Promise(x => setTimeout(x, 150));
  }
  await Promise.all(live);

  rfEnd(ok, bad, RFSTOP);
  if(bad) rfLog(`실패한 ${bad}개는 «✨ 꾸미기 → 실패한 것» 으로 다시 돌릴 수 있습니다.`);
  try{ (window.__pracRedraw || drawList)(); }catch(e){globalThis.__q?.(e)}
  try{ cvCount(); }catch(e){globalThis.__q?.(e)}
  try{ if(String(OVID)) ovDraw(); }catch(e){globalThis.__q?.(e)}
}

/* 단추를 누르면 범위 고르는 쪽지가 뜬다 (한 문항만 하려면 «이 문제만») */
$("#ovReformat")?.addEventListener("click", e => {
  e.preventDefault(); e.stopPropagation();
  if(RFBUSY) return;
  const p = $("#rfPop"); if(!p) return;
  p.hidden = !p.hidden;
  if(!p.hidden){ try{ window.__rfFieldsPaint(); }catch(e){globalThis.__q?.(e)} }
});
document.addEventListener("click", e => {
  const p = $("#rfPop"); if(!p || p.hidden) return;
  if(e.target.closest("#rfPop") || e.target.closest("#ovReformat")) return;
  p.hidden = true;
});
/* ★ v197 · 쪽지 안의 «손볼 칸» — 머리줄 🔒 자물쇠와 같은 값을 뒤집어 보여 준다.
   자물쇠는 «금지» 라 켜짐이 «안 함» 이고, 여기는 «손볼 칸» 이라 켜짐이 «함» 이다.
   값을 두 벌로 두면 어긋나므로, 보여 주는 말만 뒤집고 저장은 한 곳만 쓴다. */
window.__rfFieldsPaint = () => {
  $$('#rfFld [data-fld]').forEach(b => {
    const on = !window.__locked(b.dataset.fld);
    b.classList.toggle("on", on);
    b.title = on ? "이 칸을 손봅니다 — 누르면 잠급니다" : "잠겨 있어 건너뜁니다 — 누르면 켭니다";
  });
  /* 고른 칸이 반영된 개수를 각 범위 단추에 바로 보여 준다 */
  const cnt = sc => { try{ return rfPool(sc).length; }catch(e){ return 0; } };
  [["one","✨ 이 문제만"],["sess","⚡ 이 회차 빠르게"],["all","⚡ 전체 빠르게"]].forEach(([sc, label]) => {
    const b = $(`#rfPop [data-scope="${sc}"]`); if(!b) return;
    const n = cnt(sc);
    b.textContent = `${label} (${n})`;
    b.disabled = !n;
  });
  const rb = $('#rfPop [data-scope="rand"]');
  if(rb){
    const on = Array.isArray(RAND) && RAND.length;
    const m = cnt("rand");
    rb.textContent = on ? `🎲 랜덤 뽑은 것만 (${m})` : `🎲 지금 화면의 것만 (${m})`;
    rb.disabled = !m;
  }
  const fb = $('#rfPop [data-scope="fail"]');
  if(fb){ const n = Object.keys(rffAll()).length;
    fb.textContent = n ? `↻ 실패한 것 다시 (${n})` : "↻ 실패한 것 다시 (없음)"; fb.disabled = !n; }
  /* 그림 → 글자 단추는 «원본 그림이 있고 + 잠기지 않은» 칸만 누를 수 있게 */
  const cur = (Array.isArray(ROWS) ? ROWS : []).find(x => String(x.id) === String(OVID));
  $$('#rfPop [data-ocr]').forEach(b => {
    const w = b.dataset.ocr;
    const hasImg = !!(cur && (w === 'q' ? cur.q_url : cur.a_url));
    const lk = window.__locked(w);
    b.disabled = !hasImg || lk;
    b.title = !cur ? "문항을 먼저 열어 주세요"
            : !hasImg ? "이 문항은 원본 그림이 없습니다"
            : lk ? "이 칸이 «변환 금지» 로 잠겨 있습니다"
            : "원본 그림에서 이 칸의 글자를 다시 읽습니다 (지금 글은 덮어씁니다)";
  });
};
$$('#rfFld [data-fld]').forEach(b => b.addEventListener("click", e => {
  e.preventDefault(); e.stopPropagation();
  const f = b.dataset.fld;
  window.__lockSet(f, !window.__locked(f));   /* 켜짐 ↔ 잠금 */
}));
$("#rfFldAll")?.addEventListener("click", e => {
  e.preventDefault(); e.stopPropagation();
  window.__lockClear();
});
/* ★ v199 · «그림 → 글자 다시 읽기» — 지금 보고 있는 문항의 한 칸만 다시 읽는다.
   와꾸 고치기(꾸미기)와 달리 이건 원본 그림을 다시 읽는 일이라 값이 통째로 바뀐다.
   그래서 한 문항 · 한 칸으로 좁혀 두고, 무엇을 덮어쓰는지 먼저 물어본다. */
$$('#rfPop [data-ocr]').forEach(b => b.addEventListener("click", async () => {
  const which = b.dataset.ocr;
  const nm = which === 'q' ? '문제' : '답안';
  const p = $("#rfPop"); if(p) p.hidden = true;
  if(RFBUSY) return;
  let busy = false; try{ busy = CVBUSY || EZBUSY; }catch(e){globalThis.__q?.(e)}
  if(busy) return alert("지금 다른 작업이 돌고 있습니다. 그것부터 끝내거나 중지해 주세요.");

  const r = ROWS.find(x => String(x.id) === String(OVID));
  if(!r) return alert("지금 보고 있는 문항을 찾지 못했습니다.");
  if(window.__locked(which))
    return alert(`${nm} 칸이 «변환 금지» 로 잠겨 있습니다.\n쪽지 위쪽 «손볼 칸» 에서 ${nm}를 먼저 켜 주세요.`);
  if(!(which === 'q' ? r.q_url : r.a_url))
    return alert(`이 문항은 ${nm} 원본 그림이 없어 다시 읽을 수 없습니다.`);

  const name = `${r.year}년 제${r.session}회 ${r.no}번`;
  if(!confirm(`${name} 의 ${nm}를 원본 그림에서 다시 읽습니다.\n\n`
    + `지금 ${nm} 글은 새로 읽은 것으로 덮어씁니다 — 손으로 고쳐 두신 게 있으면 사라집니다.\n`
    + `계속할까요?`)) return;

  rfStart(1, `${name} · ${nm} 그림 → 글자`);
  let ok = 0, bad = 0;
  try{
    rfStep(1, 1, `${nm} 그림을 글자로 읽는 중…`);
    await window.cvField(r, which);
    ok = 1; rfLog(`✓ ${name} — ${nm} 다시 읽음`);
  }catch(e){
    bad = 1; rfLog(`✗ ${name} — ${nm} — ${(e && e.message) || e}`);
  }
  rfEnd(ok, bad, false);
  try{ (window.__pracRedraw || drawList)(); }catch(e){globalThis.__q?.(e)}
  try{ cvCount(); }catch(e){globalThis.__q?.(e)}
  try{ if(String(OVID) === String(r.id)) ovDraw(); }catch(e){globalThis.__q?.(e)}
}));

$$('#rfPop [data-scope]').forEach(b => b.addEventListener("click", () => {
  const p = $("#rfPop"); if(p) p.hidden = true;
  rfRun(b.dataset.scope);
}));
$("#rfPop [data-rfclear]")?.addEventListener("click", () => {
  if(!confirm("꾸미기 실패 기록을 모두 지웁니다. 계속할까요?")) return;
  try{ localStorage.removeItem(RFF_KEY); }catch(e){globalThis.__q?.(e)}
  const p = $("#rfPop"); if(p) p.hidden = true;
  rfShow(); rfSay("꾸미기 실패 기록을 비웠습니다.");
});
$("#ovRfStop")?.addEventListener("click", () => { RFSTOP = true; rfSay("멈추는 중… 지금 문항이 끝나면 섭니다."); });
$("#cvGap")?.addEventListener("click", () => cvRun(false));
$("#cvAll")?.addEventListener("click", () => cvRun(true));

/* ── 한눈에 보기 안에서도 글자 크기를 바꾼다 ──
   그동안 «가- 13 가+» 는 목록 쪽 «보기·모드» 칸에만 있어서, 한눈에를 열어 둔 채로는
   글자를 못 키웠다 — 닫고 나가서 바꾼 뒤 다시 열어야 했다. 같은 --qfs 변수와
   prac:fs 저장 칸을 그대로 쓰므로, 여기서 바꾸면 목록 쪽 드롭다운도 같이 따라온다.

   ★ 수식(라텍스) 크기는 따로 뗀다 — 글자만 조절하는 --qfs 와 다르게, 수식은
   em 단위라 글자 크기를 따라 어느 정도 같이 커지긴 하지만, "수식만 더 크게/작게"
   보고 싶을 때가 있어서 --texScale 이라는 곱셈 값을 따로 둔다. */
(() => {
  const STEPS = [7, 7.5, 8, 8.5, 9, 10, 11, 11.5, 12.5, 14, 16, 19];   /* ★ v262 — 더 작게 */
  const cur = () => { try{ return +(localStorage.getItem("prac:fs") || "14"); }catch(e){ return 14; } };
  const nearest = v => STEPS.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
  $$('.ovfs [data-fs]').forEach(b => b.onclick = () => {
    const i = STEPS.indexOf(nearest(cur()));
    const next = STEPS[Math.max(0, Math.min(STEPS.length - 1, i + (+b.dataset.fs)))];
    try{ localStorage.setItem("prac:fs", String(next)); }catch(e){globalThis.__q?.(e)}
    document.documentElement.style.setProperty("--qfs", next + "px");
    const sel = $("#fSize"); if(sel) sel.value = String(next);
  });

  const TSTEPS = [0.55, 0.62, 0.7, 0.8, 0.9, 1, 1.15, 1.3, 1.5];   /* ★ v262 — 수식도 더 작게 */
  const curTs = () => { try{ return +(localStorage.getItem("prac:texscale") || "1"); }catch(e){ return 1; } };
  const nearestTs = v => TSTEPS.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
  const applyTs = v => { try{ localStorage.setItem("prac:texscale", String(v)); }catch(e){globalThis.__q?.(e)} document.documentElement.style.setProperty("--texScale", String(v)); };
  applyTs(curTs());   /* 페이지를 열 때 저장해 둔 값을 바로 입힌다 */
  $$('.ovfs [data-ts]').forEach(b => b.onclick = () => {
    const i = TSTEPS.indexOf(nearestTs(curTs()));
    const next = TSTEPS[Math.max(0, Math.min(TSTEPS.length - 1, i + (+b.dataset.ts)))];
    applyTs(next);
  });
})();

/* 지금 고른 회차만 처음부터 다시 글자로 — cvRun 은 과목 전체를 보므로 여기서 따로 돈다 */
$("#cvAllSess")?.addEventListener("click", async () => {
  if(CVBUSY || EZBUSY) return alert("지금 다른 작업이 돌고 있습니다.");
  const yr = $("#fYear").value, ss = $("#fSess").value;
  /* ★ v193 — 잠근 칸은 담지 않는다 */
  const lkQ2 = !!(window.__locked && window.__locked('q'));
  const lkA2 = !!(window.__locked && window.__locked('a'));
  if(lkQ2 && lkA2) return alert('문제·답안이 둘 다 «변환 금지» 로 잠겨 있습니다.\n잠금을 먼저 푸세요.');
  let pool = ROWS.filter(r => (r.q_url && !lkQ2) || (r.a_url && !lkA2));
  let label = "이 과목 전체";
  if(yr || ss){
    pool = pool.filter(r => (!yr || String(r.year) === yr) && (!ss || String(r.session) === ss));
    label = `${yr || "모든 연도"} ${ss ? "제" + ss + "회" : ""}`.trim();
  }else{
    const cur = SHOWN[ONEAT] || SHOWN[0];
    if(!cur) return alert("먼저 연도·회차를 고르거나, 문항을 하나 열어 주세요.");
    pool = pool.filter(r => String(r.year) === String(cur.year) && String(r.session) === String(cur.session));
    label = `${cur.year}년 제${cur.session}회`;
  }
  if(!pool.length) return alert("그림이 있는 문항이 없습니다.");
  if(!confirm(`${label} — ${pool.length}개를 처음부터 다시 글자로 바꿉니다.\n`
    + `이미 바꿔 둔 글자는 새 것으로 덮어씁니다.\n`
    + `한 개에 20~40초쯤 걸리므로 대략 ${Math.ceil(pool.length * 30 / 60)}분입니다. 계속할까요?`)) return;

  CVBUSY = true; CVSTOP = false;
  $("#cvStop").hidden = false; $("#cvProg").hidden = false;
  ["#cvGap","#ezRun","#cvAll","#cvAllSess"].forEach(k => { const b = $(k); if(b) b.disabled = true; });
  let ok = 0, bad = 0, n = 0;
  for(const r of pool){
    if(CVSTOP) break;
    n++;
    cvSay(`전체 변환 ${n}/${pool.length} — ${r.year}년 제${r.session}회 ${r.no}번 · 됨 ${ok}` + (bad ? ` · 실패 ${bad}` : ""));
    $("#cvBar").style.width = (n / pool.length * 100) + "%";
    try{ (await cvRow(r, true)) ? ok++ : 0; }
    catch(e){ bad++; log(`변환 실패 ${r.year}-${r.session} ${r.no}번 — ${e.message || e}`); }
    await new Promise(x => setTimeout(x, 400));
  }
  $("#cvStop").hidden = true; $("#cvProg").hidden = true;
  ["#cvGap","#ezRun","#cvAll","#cvAllSess"].forEach(k => { const b = $(k); if(b) b.disabled = false; });
  CVBUSY = false;
  cvSay((CVSTOP ? "중지했습니다. " : "") + `전체 변환 ${ok}개 완료` + (bad ? ` · ${bad}개 실패` : ""));
  TEXTMODE = true; paintText();
  (window.__pracRedraw || drawList)(); cvCount();
});
$("#cvStop")?.addEventListener("click", () => { CVSTOP = true; cvSay("중지하는 중…"); });

/* ── 그림에서 네모 부분만 잘라 낸다 (비율 좌표 → 실제 픽셀) ── */
async function cropRect(url, rect){
  const blob = await fetch(url).then(r => r.blob());
  const bmp = await createImageBitmap(blob);
  const x = Math.max(0, Math.round(rect.x * bmp.width));
  const y = Math.max(0, Math.round(rect.y * bmp.height));
  const w = Math.min(bmp.width - x,  Math.round(rect.w * bmp.width));
  const h = Math.min(bmp.height - y, Math.round(rect.h * bmp.height));
  const cv = document.createElement("canvas");
  /* 너무 작게 집으면 글자가 뭉개져 못 읽는다 — 최소 2배로 키워 보낸다 */
  const up = Math.min(3, Math.max(1, 700 / Math.max(w, 1)));
  cv.width = Math.round(w * up); cv.height = Math.round(h * up);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(bmp, x, y, w, h, 0, 0, cv.width, cv.height);
  bmp.close?.();
  return await new Promise(res => cv.toBlob(res, "image/jpeg", 0.9));
}

const EASY_RULE = `
[1. 기본 말투 및 표기 규칙]
- 처음 보는 사람도 이해할 수 있게 담백한 평서문으로 작성한다. 감탄사, 이모지, 불필요한 격려 금지.
- "초등학생도 알게", "쉽게 말해" 등 독자를 낮추는 표현이나 유치한 비유 금지. 용어는 간결히 뜻만 푼다.
- 수식·기호·단위는 하나도 빠짐없이 LaTeX로 작성한다. (문장 안 $…$ / 단독 수식 $$…$$ / 곱하기는 \\cdot 또는 \\times / 단위는 로만체 [\\mathrm{A}], [\\mathrm{MVA}] 등)
- 본문에 특수문자(× ÷ ± ≤ ≥ ∠ ∴ Ω Δ μ π θ ² ³ ㎸ ㎾ 등)를 그대로 쓰지 말고 무조건 LaTeX로 변환한다.
- ★ 분수는 반드시 \\dfrac{위}{아래} 로 쓴다. (1/58) · P/(√3·V) 처럼 빗금으로 쓰지 마라 — 분자·분모가 위아래로 안 서면 식이 눈에 안 들어온다.
  다만 단위 속 빗금([Wb/m²])과 변압비(22.9kV/3.3kV)는 빗금 그대로 둔다. 그건 나눗셈이 아니다.
- 불필요한 서술어("~를 구합니다", "~에 대입합니다" 등)와 인사말, 감탄사는 전면 제거한다. 군더더기 없이 '핵심 정보'와 '수식'만 간결하게 나열한다.
- 억지로 빈칸("해당 없음" 등)을 채우지 마라. 서술형은 서술형에 맞게, 계산형은 계산형에 맞게 유연하게 작성한다.
- ★ 해당 없는 항목은 «없음» 이라고 쓰지 말고 그 줄을 통째로 빼라. «쓰는 값: 없음»,
  «쓰는 식: 없음», «넣고 계산: 없음», «목적: …를 작성합니다» 같은 줄은 아무것도 알려 주지
  않으면서 자리만 차지한다. 계산이 없는 물음이면 답과 그 근거 한두 줄로 끝내라.
- ★ 단답형(명칭·약어 풀이·용어)은 세 줄을 넘기지 마라. 답을 먼저 쓰고, 필요하면
  왜 그런지 한 줄만 붙인다. 틀을 채우려고 문장을 늘리지 마라.
- ★ «이 문제가 물고 늘어질 수 있는 것», «이 문제가 파고들 수 있는 것», «더 나아가면»,
  «출제 변형», «비슷한 문제였다면» 같은 «다른 문제였다면 이랬을 것» 류의 항목은 절대 쓰지 마라.
  지금 이 문제만 푼다. 묻지도 않은 가정을 붙이면 외울 것만 늘고 정작 이 문제의 답이 묻힌다.
- 마크다운은 **굵게** 와 - 목록만 쓴다.`;

/* ══════════════════════════════════════════════════════════════
   v195 · 안 볼 항목 걷어내기 — «이 문제가 물고 늘어질 수 있는 것»

   프롬프트에서 못 쓰게 막아 둬도, 이미 만들어 둔 1330개 해설 «안» 에는 그 글이
   그대로 남아 있다. 그걸 지우자고 1330개를 다시 돌리는 건 돈과 시간 낭비다 —
   그래서 «그릴 때» 걷어낸다. 저장된 글은 그대로 두므로, 나중에 마음이 바뀌면
   아래 목록에서 한 줄만 빼면 도로 보인다. («✨ 꾸미기» 를 돌리면 저장된 글에서도
   영영 사라진다 — 아래 dropCut 을 AI 에 넘기기 전에 한 번 더 태우기 때문이다)

   지우는 범위 — 그 제목 줄부터 «다음 큰 제목이 나오기 전까지». 다음 큰 제목은
   #제목 · [[box]] · 굵게만 있는 짧은 줄 셋 중 하나로 본다. 못 찾으면 글 끝까지다
   (실제로 이 항목은 늘 맨 끝에 붙어 있었다). */
const CUT_HEADS = [
  /이\s*문제가\s*물고\s*늘어질/,
  /이\s*문제가\s*파고들/,
  /출제\s*변형/,
  /더\s*나아가면/
];
/* ★ v196 · 자리만 차지하는 «없음» 줄 — 단답형 해설이 길어 보이던 진짜 까닭.
   «쓰는 값: 없음 / 쓰는 식: 없음 / 넣고 계산: 없음» 세 줄이 답 하나짜리 물음에도
   꼬박꼬박 붙어서, 정작 답이 그 밑에 묻혔다. 아무것도 알려 주지 않는 줄이므로
   그릴 때 걷어낸다(저장된 글은 그대로 두고, 꾸미기를 돌리면 영영 사라진다). */
const FILL_LINE = /^[\s\-*•·▶►]*(?:\*\*|__)?\s*(?:쓰는\s*값|쓰는\s*식|넣고\s*계산|주어진\s*값|계산\s*과정|목적)\s*(?:\*\*|__)?\s*[:：]\s*(?:없음|없다|해당\s*없음|-|—|N\/?A)\s*\.?\s*$/i;
function dropCut(src){
  const s = String(src == null ? "" : src);
  const hasCut = CUT_HEADS.some(re => re.test(s));
  /* FILL_LINE 은 ^…$ 로 «한 줄» 을 겨누는 무늬라, 글 전체에 대고 물으면 늘 아니라고 한다.
     (v196 에서 실제로 이래서 «없음» 줄이 하나도 안 지워졌다) 줄마다 물어야 한다. */
  const rows0 = s.split("\n");
  const hasFill = rows0.some(l => FILL_LINE.test(l));
  if(!hasCut && !hasFill) return s;                    /* 흔한 경우 — 손대지 않는다 */
  const lines = s.split("\n");
  const out = [];
  const isHead = l => {
    const t = l.trim();
    if(!t) return false;
    if(/^#{1,6}\s/.test(t)) return true;
    if(/^\[{1,2}\s*(?:box|박스)\s*\]{1,2}$/i.test(t)) return true;
    /* «**자주 틀리는 곳**» 처럼 굵게만 있는 짧은 줄 */
    if(/^(?:\*\*|__).{1,24}(?:\*\*|__)$/.test(t)) return true;
    return false;
  };
  /* 제목이 굵게 감싸여 있거나 앞에 ■ ▶ 같은 머리표가 붙어 있어도 잡는다 */
  const bare = l => l.trim().replace(/^[■▶►◆●·\-–—\s]+/, "").replace(/^(?:\*\*|__)|(?:\*\*|__)$/g, "").trim();
  for(let i = 0; i < lines.length; i++){
    if(FILL_LINE.test(lines[i])) continue;             /* «…: 없음» 줄은 버린다 */
    const b = bare(lines[i]);
    if(b && CUT_HEADS.some(re => re.test(b))){
      i++;
      while(i < lines.length && !isHead(lines[i])) i++;
      i--;                                             /* 그 큰 제목은 남긴다 */
      continue;
    }
    out.push(lines[i]);
  }
  return out.join("\n").replace(/\n{3,}$/, "\n");
}
try{ window.__dropCut = dropCut; }catch(e){globalThis.__q?.(e)}

/* 그리기 직전에 한 번 태운다 — 저장된 글은 안 건드린다 */
['mdLite','mdRich'].forEach(k => {
  const f = window[k];
  if(typeof f !== 'function' || f.__cut) return;
  const w = function(src){ return f.call(this, dropCut(src)); };
  w.__cut = 1;
  ['__mlmath','__cellbr','__indent','__crop','__sz','__img','__tex','__sci'].forEach(t => { w[t] = f[t]; });
  try{ window[k] = w; }catch(e){globalThis.__q?.(e)}
});
/* ★ v264 — «어느 그림이 무엇인지» 를 말해 준다.
   여태는 그림을 한 장(문제)만 보내면서 «답안 글이 없으면 그림만 보고 판단» 이라고
   적어 두었다. 그림에는 답이 없으니, 모델은 답을 «지어내는» 수밖에 없었다.
   이제 문제·답안 두 장을 같이 보내고, 둘째 장이 채점 기준임을 못 박는다. */
function easyPrompt(r, textOnly, have){
  /* 글자로 바꿔 둔 것(q_md·a_md)이 있으면 그쪽이 훨씬 정확하다 — OCR 원문(q_text)보다 먼저 쓴다 */
  const qs = (r.q_md || r.q_text || "");
  const as = (r.a_md || r.a_text || "");
  const qi = have ? !!have.q : !textOnly;     /* 문제 그림을 실었나 */
  const ai = have ? !!have.a : false;         /* 답안 그림을 실었나 */
  const head = textOnly
    ? "실기 시험 문제를 글자로 옮겨 둔 것이다. 그림은 없으니 아래 글만 보고 판단해라."
    : (qi && ai)
      ? ["그림 두 장을 붙였다. **첫째 장이 문제 그림, 둘째 장이 답안 그림(모범답안·해설)** 이다.",
         "- 두 장을 반드시 다 읽어라. 둘째 장을 안 보고 쓴 해설은 틀린 해설이다.",
         "- 도면이 있으면 기기 약호·정격·결선·번호표(A)(B)(C) 까지 그림에서 직접 읽어라.",
         "- 최종값·단위·유효숫자·반올림은 둘째 장(답안)에 적힌 것을 그대로 따른다. 네 판단으로 바꾸지 마라.",
         "- 답안에 없는 값을 지어내지 마라. 그림이 흐리거나 잘려 확신이 안 서면 그 줄 앞에 «[확인필요] » 를 붙여라."
        ].join("\n")
      : ai
        ? "답안 그림(모범답안·해설)이다. 여기 적힌 최종값·단위를 정답 기준으로 삼아라. 답안에 없는 값을 지어내지 마라."
        : "실기 시험 문제 그림이다. 도면이 있으면 기기 약호·정격·결선까지 그림에서 직접 읽어라.";
  return `${head} 이 문제를 처음 보는 사람이 혼자 풀 수 있을 만큼 자세히 해설해라.

[문제 글${textOnly ? "" : (qi ? "(그림으로도 붙여 뒀다. 글이 비어 있으면 그림을 읽어라)" : "(참고용, 불완전할 수 있음)")}]
${qs.slice(0, 2400) || "(없음 — 그림을 읽어라)"}

[답안 글${textOnly ? "" : (ai ? "(그림으로도 붙여 뒀다. 글이 비어 있으면 둘째 그림을 읽어라)" : "(있으면 참고)")}]
${as.slice(0, 1800) || (ai ? "(없음 — 둘째 그림이 답안이다)" : "(없음)")}

[공통 규칙 — 전기기사 실기 맞춤형 해설]
${EASY_RULE}

[2. 본문 구조 — 문제 유형에 따라 아래 A, B, C 중 하나만 선택하여 작성]

■ 유형 A: 계산 문제 (수식 위주)
1. 주어진 값
- 기호, 값, 뜻만 짧게 나열. (예: $P = 10\\mathrm{[kW]}$ (출력))
2. 핵심 공식 (★ 3단 표기 필수)
- 사용할 핵심 공식을 설명 문장 없이 다음 3줄로만 연달아 쓴다.
  1) 기호 수식: $$P = \\sqrt{3} \\cdot V \\cdot I \\cdot \\cos\\theta \\cdot \\eta$$
  2) 의미 수식: $$\\text{출력} = \\sqrt{3} \\times \\text{선간전압} \\times \\text{선전류} \\times \\text{역률} \\times \\text{효율}$$
     ★ 1)과 «구조가 글자 하나까지 똑같아야» 한다. 분수는 분수로, 괄호는 괄호로, 곱은 \\times 로.
       기호 자리에만 한글 이름을 넣고, 한글은 반드시 \\text{} 안에 넣는다.
       «나누기»·«곱하기»·«루트3»·«그 다음»·«~를 곱함» 같은 말을 절대 쓰지 마라. 그건 3) 발음 수식이 할 일이다.
     예(분수가 둘인 식):
       1) $$i_p = \\dfrac{P}{\\sqrt{3} V_1} \\times \\dfrac{1}{n_1}$$
       2) $$\\text{CT1차전류} = \\dfrac{\\text{변압기정격용량}}{\\sqrt{3} \\times \\text{1차전압}} \\times \\dfrac{1}{\\text{CT변류비}}$$
     나쁜 예(이렇게 쓰면 안 됨): $$\\text{CT1차전류} = \\text{변압기정격용량 나누기 (루트3 곱하기 1차전압) 그 다음 ...}$$
  3) 발음 수식: $$피 = 루트삼 \\times 브이 \\times 아이 \\times 코사인세타 \\times 에타$$
  (※ 발음 수식 주의: 기호나 단위는 철저히 실제 읽는 소리대로 적는다. 예: %는 '퍼센트', 기호가 영문이면 영문 발음 그대로 표기)
3. 풀이 및 정답
- 변형된 공식에 한글 뜻을 = 로 연결하여 표기한 뒤, 바로 아래에 숫자 대입과 계산 결과를 연달아 적는다.
- 반드시 아래 양식을 지킨다.
  [계산 과정] :
  $$I = \\frac{P}{\\sqrt{3} \\cdot V \\cdot \\cos\\theta \\cdot \\eta} = \\frac{\\text{출력}}{\\sqrt{3} \\cdot \\text{선간전압} \\cdot \\text{역률} \\cdot \\text{효율}}$$
  $$I = \\frac{10 \\times 10^3}{\\sqrt{3} \\cdot 380 \\cdot 0.80 \\cdot 0.85}$$
  $$I \\approx 22.34\\mathrm{[A]}$$
  [답] : $22.34\\mathrm{[A]}$
4. 단위 계산 방법 및 주의점 (※ 필요시)
- 단위의 환산이나 도출 과정이 필요할 경우 따로 $$...$$ 로 표기하여 직관적으로 보여준다.
  (예: $$[\\mathrm{kVA}] = \\frac{\\mathrm{[kW]}}{\\cos\\theta}$$)
- 주의점은 맨 앞에 * 를 붙여 간략히 쓴다.

■ 유형 B: 단답형 / 서술형 문제 (글 위주)
- 서론, 본론 등 쓸데없는 설명은 모두 빼고 전기기사 실기 채점 기준에 맞춰 최소한의 분량으로 압축하여 작성한다.
- 문제에서 요구한 개수(3가지, 5가지 등)에 정확히 맞춰서 작성한다.
- ★ «N가지를 쓰시오» 인 물음은 반드시 두문자(첫 글자 모음)로 외우게 쓴다. 아래 틀을 지켜라.
    ① 제목 줄 끝에 두문자를 붙인다 — **(1)번문항: 노글보광균**
    ② 그 아래에 답을 하나씩 줄을 갈라 쓰되, 번호 다음에 «그 항목의 첫 글자 + 콜론» 을 붙인다.
       ① 노: 노면의 높은 평균휘도
       ② 글: 글레어가 적을 것
       ③ 보: 보도·건축물 전면의 충분한 조도
       ④ 광: 광색·연색성 적절
       ⑤ 균: 균제도(휘도가 고른 정도) 확보
    ③ 두문자는 답의 «첫 글자» 를 그대로 이어 붙인 것이어야 한다. 말이 되게 만들려고
       답에 없는 글자를 넣거나 순서를 바꾸지 마라 — 그러면 외운 대로 못 쓴다.
    ④ 두문자가 말이 되도록 다듬을 수 있으면 제목 줄 뒤에 한 줄만 덧붙여도 좋다.
       (예: 난소유전내 — «난 소유하고 있는 전을 내놓는다»)
- 짧게 «무엇»만 묻는 단답형(명칭·약어)은 두문자 없이 답 한 줄로 끝낸다.
- 한 항목은 한 줄이다. 항목마다 긴 설명을 붙이지 마라 — 외울 게 늘어난다.

■ 유형 C: 시퀀스 / 논리 회로 / 도면 문제 (의식의 흐름 전개)
1. 초기 논리식 도출 원리 (Why & How)
- 주어진 진리표나 타임차트에서 '어떻게' 식을 뽑아냈는지 첫 단추를 반드시 설명한다.
- (예: "진리표에서 출력이 '1'이 되는 행만 찾습니다. 이때 입력이 0이면 부정($\\bar{A}$), 1이면 긍정($A$)으로 곱한 뒤 모두 더해줍니다.")
2. 논리식 간략화와 개념 풀이
- 수식을 전개할 때 사용된 불 대수 법칙이나 드모르간의 정리 등은 이름만 던지지 말고 그 자리에서 뜻을 한 줄로 푼다.
- (예: "드모르간의 정리(전체 부정을 쪼개면 곱 기호는 더하기로, 더하기는 곱 기호로 바뀌는 법칙)를 적용합니다.")
- 계산 과정은 한 줄에 한 단계씩 보여준다.
3. 도면 및 회로 변환 규칙
- 간략화된 최종 식을 보며 도면을 어떻게 그리는지 직관적으로 매칭해 준다.
- (예: "논리곱($\\cdot$)은 AND 게이트(직렬)로, 논리합($+$)은 OR 게이트(병렬)로 연결합니다.")

[여러 물음이 있을 때]
문제에 (1) (2) … 또는 ① ② … 처럼 물음이 여러 개면, 물음마다 위 A·B·C 짜임새를 하나씩
통째로 반복해서 쓴다. 덩어리 제목은 원문 번호를 그대로 쓴다. 물음마다 유형이 다르면
(계산형·서술형·시퀀스형이 섞여 있으면) 그 물음에 맞는 유형(A·B·C)을 골라 쓴다. 답안에 있는 번호는
전부 나와야 한다 — 물음이 5개면 덩어리도 5개다.

[박스로 감싸기 — 반드시 지킬 것]
- 물음이 여러 개면, 물음 하나(그 안의 «주어진 값 → 핵심 공식 → 풀이 및 정답» 전체,
  또는 유형 B·C 라면 그 물음의 전체 내용)를 [[box]] 줄로 열고 [[/box]] 줄로 닫아서,
  물음 하나당 박스 하나가 되게 한다. 박스 첫 줄은 그 물음 제목을 **(1) 문제를 한마디로**
  처럼 굵게 써서 넣는다.
- 물음이 하나뿐이면 답 전체를 박스 하나로 감싼다.
- [[box]] 와 [[/box]] 는 반드시 줄 맨 앞에 단독으로 써라 — 앞뒤에 다른 글자를 붙이지 마라.
- 박스와 박스 사이에는 --- 줄을 하나 넣어 구분한다.
- 어느 유형(A·B·C)을 쓰든 이 박스 규칙은 똑같이 적용한다 — 유형은 박스 «안의» 내용을
  어떻게 짤지 정할 뿐, 박스로 감싸는지 여부와는 상관없다.`;
}

/* ══════════════════════════════════════════════════════
   자동 해설
   ──────────────────────────────────────────────────────
   문제를 «볼 때» 해설이 없으면 그 자리에서 만든다. 한 번 만든 것은
   Supabase 에 남으므로 다음부터는 그대로 꺼내 쓴다(다시 만들지 않는다).
   한 번에 하나씩만 부른다 — 목록을 주르륵 넘길 때 요청이 몰리면
   서버가 죄다 거절해서 오히려 하나도 안 나온다.
   ══════════════════════════════════════════════════════ */
/* ── 쉬운 풀이 ──
   예전에는 «화면에 보이면 알아서 쓴다» 였다. 그런데 조금만 굴려도 요청이 우수수
   나가서 서버가 죄다 거절하고, 결국 하나도 안 나오는 일이 잦았다.
   그래서 지켜보는 것을 걷어내고, 누를 때 한꺼번에 도는 단추 하나만 남긴다. */
let EZBUSY = false;
const EZQUEUE = [];

function ezEnqueue(id){
  const r = ROWS.find(x => String(x.id) === String(id));
  if(!r || r.easy_md || !r.q_url) return;
  if(EZQUEUE.includes(String(id))) return;
  EZQUEUE.push(String(id));
  ezPump();
}
/* ★ v235 — 문항을 «넘길 때마다» 해설을 만들게 두면 돈이 샌다.
   한눈에 보기에서 좌우로 훑기만 해도 지나친 문항 수만큼 AI 를 부르고,
   이미 다른 문항으로 넘어간 뒤에도 뒤에서 계속 돌았다.
   2.5초쯤 머무른 문항만 «정말 보는 것» 으로 치고 만든다. */
let EZWAIT = null;
function ezEnqueueSoon(id){
  clearTimeout(EZWAIT);
  EZWAIT = setTimeout(() => ezEnqueue(id), 2500);
}
function ezCancelSoon(){ clearTimeout(EZWAIT); EZWAIT = null; }
async function ezPump(){
  if(EZBUSY || !EZQUEUE.length) return;
  EZBUSY = true;
  const id = EZQUEUE.shift();
  try{ await ezMake(id, false); }catch(e){globalThis.__q?.(e)}
  EZBUSY = false;
  if(EZQUEUE.length) setTimeout(ezPump, 400);
}

/* ★ v264 — 그림 한 장 받아 오기.
   · 못 받으면 조용히 null — 한 장이 없다고 해설 만들기가 통째로 엎어지면 안 된다.
   · 워커는 한 장이 4.6MB 를 넘으면 그 장을 «말없이» 빼 버린다. 그러면 화면에서는
     그림을 보냈다고 믿는데 모델은 못 본 채로 답한다. 그래서 큰 그림은 여기서
     1600px · JPEG 로 줄여서 보낸다(저장된 원본은 안 건드린다). */
const EZ_IMG_MAX = 3.2 * 1024 * 1024;
async function ezImg(url){
  if(!url) return null;
  let b = null;
  try{
    const res = await fetch(url);
    if(!res.ok) return null;
    b = await res.blob();
  }catch(e){ return null; }
  if(!b || !b.size) return null;
  if(b.size <= EZ_IMG_MAX) return b;
  let obj = null;
  try{
    obj = URL.createObjectURL(b);
    const im = await new Promise((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i); i.onerror = () => no(new Error("그림을 열지 못했습니다"));
      i.src = obj;
    });
    const sc = Math.min(1, 1600 / (im.naturalWidth || 1600));
    const cv = document.createElement("canvas");
    cv.width  = Math.max(1, Math.round((im.naturalWidth  || 1) * sc));
    cv.height = Math.max(1, Math.round((im.naturalHeight || 1) * sc));
    const cx = cv.getContext("2d");
    /* 투명한 PNG 를 그대로 JPEG 로 구우면 바탕이 새까매진다 — 흰 바탕을 먼저 깐다 */
    cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height);
    cx.drawImage(im, 0, 0, cv.width, cv.height);
    const small = await new Promise(ok => cv.toBlob(ok, "image/jpeg", 0.85));
    return small && small.size ? small : b;
  }catch(e){ return b; }
  finally{ if(obj) URL.revokeObjectURL(obj); }
}

/* force = true 면 이미 있는 해설도 갈아엎는다 (다시 해석하기) */
async function ezMake(id, force, quiet){
  const r = ROWS.find(x => String(x.id) === String(id));
  /* 그림이 없어도 글자(q_md)만 있으면 해설을 쓸 수 있다. 예전에는 여기서 조용히 되돌아가
     «해설 만들기» 를 눌러도 아무 일도 안 일어나는 것처럼 보였다. */
  if(!r || (!r.q_url && !r.q_md)) return;
  if(r.easy_md && !force) return;
  /* ★ v192 — 쉬운 풀이를 잠가 뒀으면 여기서 바로 돌아간다.
     한 곳만 막으면 낱개·일괄·자동 채우기가 전부 이 자물쇠를 지킨다. */
  try{ if(window.__locked && window.__locked('ez')) return; }catch(e){globalThis.__q?.(e)}
  /* ★ v267 — 문항별 «쉬운해설 고정». 전체 자물쇠와 같은 자리에서 막는다 */
  try{ if(window.__ezFixed && window.__ezFixed(r.id)) return; }catch(e){globalThis.__q?.(e)}

  /* ★ v275 — 자동 해설 진행 · 다시 해석 · 2.5초 자동 생성도 «상세 Opus» 와 같은 길(/explain)로.
     그래야 어느 단추로 만들든 식 네 줄 · 자세한 «왜» · 부호 · 검산 · 흔한 실수가 같은 틀로 나온다.
     답(그림·글)이 없는 문항만 예전 방식으로 쓴다 — /explain 은 답을 근거로 쓰기 때문. */
  if(typeof window.__pxSolOne === "function" && (r.a_url || r.a_text || r.a_md)){
    try{ await window.__pxSolOne(r.id, "opus"); }
    catch(e){
      const bx = document.querySelector(`.pcard[data-id="${id}"] .easybox`);
      if(bx) bx.innerHTML = `<span class="wait">해설을 쓰지 못했습니다 — ${esc(e.message || e)}
        <button class="zb" type="button" style="margin-left:8px" onclick="ezMake('${id}', true)">다시 시도</button></span>`;
      if(!quiet) try{ toast("해설 실패 — " + (e.message || e)); }catch(x){globalThis.__q?.(x)}
    }
    return;
  }

  const card = document.querySelector(`.pcard[data-id="${id}"]`);
  let box = card?.querySelector(".easybox");
  if(card && !box){
    box = document.createElement("div"); box.className = "easybox";
    card.querySelector(".ptools")?.before(box);
  }
  if(box){
    box.classList.remove("empty");
    box.innerHTML = `<span class="wait">해설을 쓰는 중입니다… 20~40초쯤 걸립니다.</span>`;
  }
  try{
    /* ★ v264 — 여태 여기서 «문제 그림» 한 장만 받아 보냈다.
       답안이 그림으로만 있는 문항(a_md·a_text 가 빈 문항)은 모델이 정답을
       볼 길이 아예 없었다 — 그래서 답을 지어내거나, 칸을 못 채우고 껍데기만 왔다.
       이제 문제·답안 두 장을 같은 차례(문제 → 답안)로 실어 보낸다. */
    const qb = await ezImg(r.q_url);
    const ab = await ezImg(r.a_url);
    /* ★ 문제 그림이 «있는데» 못 받았고 대신 읽을 글자도 없으면, 조용히 글자만으로
       넘어가면 안 된다 — 아무것도 안 보고 쓴 해설이 그럴듯하게 저장돼 버린다.
       예전 판은 fetch 가 터지면서 저절로 멈췄다. 그 멈춤을 되살린다. */
    if(r.q_url && !qb && !(r.q_md || r.q_text))
      throw new Error("문제 그림을 받지 못했습니다 — 주소가 죽었는지 확인해 주세요");
    const imgs = [qb, ab].filter(Boolean);
    const md0 = await askAI(easyPrompt(r, !imgs.length, { q:!!qb, a:!!ab }), imgs, 3600);
    /* ★ v195 — 프롬프트로 막아 뒀지만, 그래도 써 오면 저장 전에 잘라 낸다 */
    const md = (window.__dropCut ? window.__dropCut(md0 || "") : md0);
    const up = await sb.from("practicals").update({ easy_md: md }).eq("id", r.id);
    if(up.error) throw new Error(/easy_md|schema cache/i.test(up.error.message)
      ? "easy_md 칸이 없습니다 — supabase-실기.sql 을 다시 돌려 주세요." : up.error.message);
    r.easy_md = md;
    if(box) box.innerHTML = mdLite(md);
    /* 단추 줄(다시 해석하기 · 고쳐 쓰기 · 지우기)을 손으로 끼워 맞추면 손잡이가 어긋난다.
       한 번 다시 그리는 편이 확실하다. 필기는 저장돼 있으므로 그대로 되살아난다.
       ★ 다만 «한눈에» 를 보고 있는 중이면 그 판이 닫힌 뒤로 미룬다 —
         보고 있는 화면 밑에서 목록을 갈아엎으면 얹힌 것들이 한꺼번에 다시 돈다. */
    if(!quiet) (window.__pracRedraw || drawList)();
    if(String(OVID) === String(r.id)) ovDraw();   /* 한눈에 보기가 열려 있으면 거기도 갈아 끼운다 */
    drawRail?.();
  }catch(e){
    if(box) box.innerHTML = `<span class="wait">해설을 쓰지 못했습니다 — ${esc(e.message || e)}
      <button class="zb" type="button" style="margin-left:8px" onclick="ezMake('${id}', true)">다시 시도</button></span>`;
  }
}
async function ezDel(id){
  const r = ROWS.find(x => String(x.id) === String(id));
  if(!confirm("이 해설을 지웁니다.")) return;
  await sb.from("practicals").update({ easy_md: null }).eq("id", r.id);
  r.easy_md = null; drawList();
}

async function markExplain(id, target, rect, markId){
  const r = ROWS.find(x => String(x.id) === String(id));
  const url = target === "a" ? r.a_url : r.q_url;
  const blob = await cropRect(url, rect);
  const prompt = `실기 시험 문제의 한 부분을 오려 낸 그림이다. 이 부분에서 막혔다고 한다.

[문제 전체 글(참고용, 불완전할 수 있음)]
${(r.q_text || "").slice(0, 1200) || "(없음)"}

[할 일]
1. 오려 낸 부분이 무엇을 말하는지 한 줄로 짚어라.
2. 여기서 막히는 이유로 흔한 것 한두 가지를 말하고, 그걸 풀어 준다.
3. 이 부분을 넘어가려면 무엇을 알아야 하는지 짧게 정리한다.
${EASY_RULE}
길게 쓰지 마라. 대여섯 줄이면 충분하다.`;
  const md = await askAI(prompt, blob);
  const up = await sb.from("practical_marks").update({ note_md: md }).eq("id", markId);
  if(up.error) throw up.error;
  return md;
}

/* ★ v235 — 문항을 지워도 그림 파일은 저장소에 그대로 남아 있었다.
   표에서만 사라지고 qfig 버킷에는 계속 쌓여, 쓰지도 않는 그림이 용량을 먹었다.
   (storage-clean 화면으로 «나중에» 치울 수는 있었지만, 애초에 안 남기는 게 낫다) */
function qfigPath(url){
  const m = String(url || "").match(/\/storage\/v1\/object\/(?:public\/)?qfig\/(.+?)(?:\?|$)/);
  return m ? decodeURIComponent(m[1]) : null;
}
window.dropFigs = dropFigs;
async function dropFigs(rows){
  try{
    const paths = [];
    (rows || []).forEach(r => [r.q_url, r.a_url].forEach(u => { const p = qfigPath(u); if(p) paths.push(p); }));
    if(paths.length) await sb.storage.from("qfig").remove(paths);
  }catch(e){globalThis.__q?.(e)}
}

/* ★ v235 — 예전에는 문항 번호 1700여 개를 주소줄에 그대로 실어 보냈다(12KB 넘음).
   서버가 «주소가 너무 길다» 며 거절하면 표시(형광펜·주석)가 통째로 안 나왔다.
   이제 과목으로 한 번에 걸러 받고, 그 방법이 막히면 400개씩 나눠 받는다. */
async function loadMarks(ids, sid){
  MARKS = {};
  if(!ids || !ids.length) return;
  if(sid){
    const { data, error } = await sb.from("practical_marks")
      .select("*, practicals!inner(subject_id)")
      .eq("practicals.subject_id", sid).order("id");
    if(!error && Array.isArray(data)){
      data.forEach(m => { delete m.practicals; (MARKS[m.practical_id] ||= []).push(m); });
      return;
    }
  }
  for(let i = 0; i < ids.length; i += 400){
    const { data } = await sb.from("practical_marks").select("*")
      .in("practical_id", ids.slice(i, i + 400)).order("id");
    (data || []).forEach(m => { (MARKS[m.practical_id] ||= []).push(m); });
  }
}

/* ═══════════════════════════════════════════════
   그림 만들어 올리기
   ═══════════════════════════════════════════════ */
/* ── 올리기 전에 잘린 모습 보기 ──
   "2쪽짜리 문제가 제대로 이어졌나" 는 숫자로는 확인이 안 된다.
   실제로 자른 그림을 그대로 그려서 눈으로 보게 한다. 아무것도 올리지 않는다.
   쪽을 넘어간 문제를 먼저 보여 준다 — 확인이 필요한 건 그것들이니까. */
$("#peek").onclick = async () => {
  const box = $("#peekBox");
  const all = PARSED.flatMap(P => P.items.map(it => ({ P, it })));
  if(!all.length) return;

  const spans = all.filter(x => x.it.end && x.it.end.page > x.it.start.page);
  const rest  = all.filter(x => !(x.it.end && x.it.end.page > x.it.start.page));
  const pick  = [...spans.slice(0, 6), ...rest.slice(0, 4)];

  box.innerHTML = `<div class="peekhead">쪽을 넘어간 문제 ${spans.length}개 중 ${Math.min(spans.length,6)}개와
    한 쪽짜리 ${Math.min(rest.length,4)}개를 골라 그려 봅니다. 올리지는 않습니다.</div>
    <div class="peekwrap" id="peekWrap"><div class="empty">그리는 중…</div></div>`;
  const wrap = $("#peekWrap"); wrap.innerHTML = "";

  for(const { P, it } of pick){
    if(STOP) break;
    const span = it.end && it.end.page > it.start.page;
    const card = document.createElement("div");
    card.className = "peekcard";
    card.innerHTML = `<div class="peektag">${it.year}-${it.session} <b>${it.no}번</b>
      · ${it.start.page}${span ? `→${it.end.page}` : ""}쪽 ${span ? `<span class="warn2">쪽 넘김</span>` : ""}
      ${it.ansAt ? "" : `<span class="warn2">답안 없음</span>`}</div>
      <div class="peekimgs"><div class="empty">…</div></div>`;
    wrap.appendChild(card);
    try{
      const q = await crop(P.doc, it.start, it.ansAt || it.end, 1.2);
      const a = it.ansAt ? await crop(P.doc, it.ansAt, it.end, 1.2) : null;
      card.querySelector(".peekimgs").innerHTML =
        `<figure><figcaption>문제</figcaption><img src="${URL.createObjectURL(q)}" alt="문제"></figure>`
        + (a ? `<figure><figcaption>답안</figcaption><img src="${URL.createObjectURL(a)}" alt="답안"></figure>` : "");
    }catch(e){
      card.querySelector(".peekimgs").innerHTML = `<div class="empty">그리지 못했습니다 — ${esc(e.message || e)}</div>`;
    }
    await new Promise(r => setTimeout(r));
  }
  if(!wrap.children.length) wrap.innerHTML = `<div class="empty">그릴 문제가 없습니다.</div>`;
};

/* ── 실제로 올리는 몸통 ──
   "전부 올리기" 와 "빠진 것만 채우기" 가 같은 코드를 쓰도록 떼어냈다. */
async function uploadItems(list, sid, scale, MODE, label){
  const total = list.length;
  let done = 0, ok = 0, bad = 0;
  FAILS = [];
  STOP = false;
  /* ★ v204 — 경로에서 판 도장(_v…)을 뺐다.
     도장이 붙어 있으면 다시 올릴 때마다 «새 파일» 이 생기고 옛 jpg 는 저장소에
     그대로 남는다. 지우는 코드가 없어서 회차를 다시 올린 만큼 겹겹이 쌓였다.
     이제는 같은 문항이면 같은 파일을 덮어쓴다.

     도장을 붙였던 원래 이유(CDN·브라우저가 옛 그림을 들고 있는 것)는
     put() 이 주소 끝에 ?t= 을 붙여 해결한다 — 파일은 하나, 주소만 새것. */
  /* 다시 올릴 때 옛 글자(q_md·a_md)·옛 답안을 지울지 */
  const WIPE = !!document.getElementById("impWipe")?.checked;
  $("#save").disabled = $("#fillGap").disabled = true; $("#stop").disabled = false;

  try{
    for(const { P, it } of list){
      if(STOP) break;
      try{
        const base = `prac/${sid}/${it.year}_${it.session}_${String(it.no).padStart(2,"0")}`;
        const whole = cleanText(it.text);

        if(MODE === "a"){
          const img = await crop(P.doc, it.start, it.end, scale, 36);
          const aUrl = await put(`${base}_a.jpg`, img);
          const up = await sb.from("practicals").update({ a_url:aUrl, a_text:whole, st_a:"raw" })
            .eq("subject_id", sid).eq("year", it.year).eq("session", it.session).eq("no", it.no).select("id");
          if(up.error) throw up.error;
          if(!up.data?.length){
            bad++; FAILS.push({ P, it, why:"붙일 문제가 없습니다(문제부터 올려 주세요)" });
            done++; continue;
          }
          ok++;
        }else{
          /* 짧은 문항은 최소 한 뼘은 뜨게 해서 «영역 없음» 으로 죽지 않게 한다 */
          const qImg = await crop(P.doc, it.start, it.ansAt || it.end, scale, 36);
          const aImg = it.ansAt ? await crop(P.doc, it.ansAt, it.end, scale, 24) : null;
          const qUrl = await put(`${base}_q.jpg`, qImg);
          const aUrl = aImg ? await put(`${base}_a.jpg`, aImg) : null;
          const cut = whole.search(/답안\s*작성/);
          const row = {
            subject_id:sid, year:it.year, session:it.session, no:it.no,
            points:it.points, asked:it.asked || null, q_url:qUrl,
            q_text: cut > 0 ? whole.slice(0, cut) : whole,
            source:it.source, page_from:it.start.page, page_to:it.end.page
          };
          /* 답안을 실제로 만들어 냈을 때만 그 칸을 건드린다.
             예전에는 «문제+답안» 모드로 다시 올리면 이번에 답안이 안 잘렸다는 이유로
             전에 잘 들어가 있던 답안까지 null 로 덮어써 버렸다. */
          if(aUrl){ row.a_url = aUrl; row.a_text = cut > 0 ? whole.slice(cut) : null; }

          /* ★ v217 — 상태 칸을 같이 적는다.
             여태 안 적었더니 칸의 기본값 «empty» 가 그대로 남아,
             검수 화면에서 그림·글이 멀쩡히 있는 문항까지 «빈 껍데기» 로
             세어졌다. 기계가 갓 자른 것이므로 «검수 전(raw)» 로 둔다. */
          row.st_q = "raw";
          if(row.a_url || row.a_text) row.st_a = "raw";

          /* ★ v153 — 다시 올릴 때 옛 껍데기를 지운다.
             upsert 는 «적어 보낸 칸» 만 갱신한다. 그래서 같은 (과목·연도·회차·번호) 에
             다시 올리면 그림만 새것이고 q_md · a_md 는 지난 판 그대로 남았다.
             쪼개진 개수가 조금만 달라져도 번호가 한 칸씩 밀려, 58번 답안 자리에
             57번 답이 앉는 «꼬임» 이 여기서 났다. */
          if(WIPE){
            row.q_md = null; row.a_md = null;
            if(!aUrl){ row.a_url = null; row.a_text = null; }
          }
          const r = await sb.from("practicals").upsert(row, { onConflict:"subject_id,year,session,no" });
          if(r.error) throw r.error;
          ok++;
        }
      }catch(e){
        bad++;
        const why = niceErr(e);
        FAILS.push({ P, it, why });
        log(`${it.year}-${it.session} ${it.no}번 실패 — ${why}`);
      }
      done++;
      $("#bar").style.width = (done / total * 100) + "%";
      if(done % 5 === 0){
        say($("#im"), `${label} ${done}/${total} · 올림 ${ok} · 실패 ${bad}`, "info");
        await new Promise(r => setTimeout(r));
      }
    }

    /* 실패가 로그에 파묻히지 않게, 어느 문제가 왜 실패했는지 그대로 적는다 */
    const lines = FAILS.map(f => `· ${f.it.year}년 제${f.it.session}회 ${f.it.no}번 — ${f.why}`).join("\n");
    say($("#im"),
      (STOP ? `중지했습니다. ${ok}개 올렸습니다.` : `${label} 끝 — ${ok}개 올림, ${bad}개 실패.`)
      + (bad ? `\n\n[실패한 문제]\n${lines}\n\n"빠진 문제만 채우기" 를 누르면 이것들만 다시 시도합니다.` : ""),
      bad ? "err" : "ok");
    await loadList({ force:true });
  }catch(e){
    say($("#im"), "올리다 멈췄습니다 — " + niceErr(e), "err");
  }finally{
    $("#save").disabled = false; $("#fillGap").disabled = false; $("#stop").disabled = true;
  }
}

$("#save").onclick = async () => {
  const sid = +$("#impSub").value;
  if(!sid) return say($("#im"), "넣을 과목을 고르세요.", "err");
  const all = PARSED.flatMap(P => P.items.map(it => ({ P, it })));
  await uploadItems(all, sid, +$("#impScale").value, IMPORT_MODE, "올리기");
};

/* ── 빠진 문제만 채우기 ──
   실패 목록은 새로고침하면 사라진다. 그래서 기억에 기대지 않고
   Supabase 에 실제로 뭐가 들어 있는지 물어본 뒤, 없는 것만 올린다.
   지난번에 실패한 것도, 중간에 중지한 것도 이 한 번으로 다 메워진다. */
/* ═══════════════════════════════════════════════════════════
   글자 잘린 문항만 다시 올리기
   ───────────────────────────────────────────────────────────
   예전에는 어떤 쪽이든 좌우 22pt 를 무조건 깎았다. 글자가 그 안쪽에서
   시작하는 쪽은 앞머리가 잘려 나갔다 (오고초려 x≈14 · 소방 x≈16 ·
   본문에서 표가 왼쪽으로 튀어나온 쪽).

   이미 올라간 그림에서는 잘린 글자를 되살릴 수 없다. 원본에서 다시 떠야 한다.
   그렇다고 1700개를 통째로 다시 돌리는 건 두 시간짜리 벌이다.
   그래서 쪽마다 글자 시작점을 재서 «예전 규칙이었다면 잘렸을 쪽» 만 골라 다시 올린다.
   ═══════════════════════════════════════════════════════════ */
const OLD_MARGIN = 22;
$("#reCut").onclick = async () => {
  const sid = +$("#impSub").value;
  if(!sid) return void say($("#im"), "과목을 먼저 고르세요.", "err");
  if(!PARSED.length) return void say($("#im"), "먼저 «훑어보기» 를 누르세요.", "err");

  /* 앞 작업에서 STOP 이 켜진 채 남아 있으면 아래 반복이 첫 바퀴에 빠져나가
     «잘린 것 없음» 으로 끝난다. 반드시 내려 두고 시작한다. */
  STOP = false;
  $("#reCut").disabled = true; $("#stop").disabled = false;
  logEl.textContent = "";
  log("잘린 쪽을 찾는 중… (쪽마다 글자가 어디서 시작하는지 잽니다)");
  const 잘림 = [], 쪽 = new Set();
  try{
    for(const P of PARSED){
      const need = new Set();
      P.items.forEach(it => {
        for(let p = it.start.page; p <= (it.end?.page || it.start.page); p++) need.add(p);
      });
      let n = 0; const cut = new Set();
      for(const p of [...need].sort((a,b) => a-b)){
        if(STOP) break;
        const minx = await leftMinOf(P.doc, p);
        /* 글자가 22pt 안쪽에서 시작한다 = 예전 규칙이 글자를 파고들었다.
           표·회로도 선까지 생각해 2pt 여유를 둔다. */
        if(minx < OLD_MARGIN + 2) cut.add(p);
        if(++n % 40 === 0){ $("#bar").style.width = (n / need.size * 100) + "%"; await new Promise(r => setTimeout(r)); }
      }
      P.items.forEach(it => {
        for(let p = it.start.page; p <= (it.end?.page || it.start.page); p++){
          if(cut.has(p)){ 잘림.push({ P, it }); 쪽.add(p); break; }
        }
      });
    }
  }catch(e){
    $("#reCut").disabled = false; $("#stop").disabled = true;
    return void say($("#im"), "재다가 멈췄습니다 — " + e.message, "err");
  }
  $("#bar").style.width = "0%"; $("#stop").disabled = true;

  if(!잘림.length){
    $("#reCut").disabled = false;
    return void say($("#im"), "글자가 잘린 문항이 없습니다. 다시 올릴 것이 없습니다.", "ok");
  }
  const 회차 = new Map();
  잘림.forEach(({it}) => {
    const k = `${it.year}년 ${it.session}회`;
    회차.set(k, (회차.get(k) || 0) + 1);
  });
  log(`잘린 쪽 ${쪽.size}개 · 그 위의 문항 ${잘림.length}개`);
  [...회차.entries()].forEach(([k, n]) => log(`   ${k} — ${n}문항`));

  if(!confirm(`예전 규칙(좌우 22pt 고정)이었다면 글자가 잘렸을 문항 ${잘림.length}개를 찾았습니다.\n`
    + [...회차.entries()].slice(0, 10).map(([k, n]) => `  ${k} ${n}문항`).join("\n")
    + (회차.size > 10 ? `\n  … 그 밖 ${회차.size - 10}회차` : "")
    + `\n\n이 문항들만 원본에서 다시 떠 올립니다. 나머지는 건드리지 않습니다.`
    + (document.getElementById("impWipe")?.checked
        ? `\n\n※ «옛 글자·옛 답안 지우기» 가 켜져 있습니다. 검수에서 손으로 잘라 넣거나
   고쳐 둔 것이 있으면 이 문항들에 한해 덮입니다. 그게 싫으면 끄고 다시 누르세요.`
        : "")
    + `\n\n계속할까요?`)){
    $("#reCut").disabled = false;
    return;
  }
  await uploadItems(잘림, sid, +$("#impScale").value, IMPORT_MODE, `잘린 ${잘림.length}개 다시`);
  $("#reCut").disabled = false;
};

$("#fillGap").onclick = async () => {
  const sid = +$("#impSub").value;
  if(!sid) return say($("#im"), "넣을 과목을 고르세요.", "err");
  if(!PARSED.length) return say($("#im"), "먼저 훑어보기를 눌러 주세요.", "err");

  say($("#im"), "이미 올라간 문제를 확인하는 중…", "info");
  const have = new Set();
  for(let from = 0; from < 40000; from += 1000){
    const { data, error } = await sb.from("practicals")
      .select("year,session,no,q_url,a_url").eq("subject_id", sid).range(from, from + 999);
    if(error) return say($("#im"), "확인하지 못했습니다 — " + niceErr(error), "err");
    (data || []).forEach(r => {
      /* 답안만 올리는 모드면 답안이 있어야 "있는 것", 아니면 문제 그림이 있어야 한다 */
      const okRow = IMPORT_MODE === "a" ? !!r.a_url : !!r.q_url;
      if(okRow) have.add(`${r.year}-${r.session}-${r.no}`);
    });
    if(!data || data.length < 1000) break;
  }

  const missing = PARSED.flatMap(P => P.items.map(it => ({ P, it })))
    .filter(({ it }) => !have.has(`${it.year}-${it.session}-${it.no}`));

  if(!missing.length)
    return say($("#im"), `빠진 문제가 없습니다. 훑어본 ${PARSED.reduce((a,p)=>a+p.items.length,0)}개가 모두 올라가 있습니다.`, "ok");

  const preview = missing.slice(0, 12).map(({it}) => `${it.year}-${it.session} ${it.no}번`).join(", ");
  log(`빠진 문제 ${missing.length}개: ${preview}${missing.length > 12 ? " …" : ""}`);

  /* 용량 때문에 튕긴 경우가 많아, 다시 넣을 때는 조금 작게 만들어 성공률을 올린다 */
  const scale = Math.max(1.2, +$("#impScale").value * 0.75);
  await uploadItems(missing, sid, scale, IMPORT_MODE, `빠진 ${missing.length}개 채우기`);
};


/* 시작 지점부터 끝 지점까지를 하나의 그림으로 잘라 붙인다. 쪽을 넘어가도 이어 붙인다. */
/* 쪽마다 «글자가 실제로 어디서 시작하는지» 를 재 둔다 (쪽당 한 번만) */
const LEFTPAD = new Map(), LEFTMIN = new Map();
async function leftPadOf(doc, p){
  const k = `${doc.__id || ""}#${p}`;
  if(LEFTPAD.has(k)) return LEFTPAD.get(k);
  let pad = 22, minx = 999;
  try{
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale:1 });
    const tc = await page.getTextContent();
    const xs = [];
    for(const it of tc.items){
      if(!it.str.trim()) continue;
      xs.push(vp.convertToViewportPoint(it.transform[4], it.transform[5])[0]);
    }
    if(xs.length){
      xs.sort((a,b) => a-b);
      minx = xs[0];
      /* ★ 글자가 있으면 절대 안 자른다.
           제일 왼쪽 글자보다 14pt 더 바깥까지 남기고, 그래도 최대 14pt 만 깎는다.
           표·회로도 선은 글자보다 조금 더 왼쪽으로 튀어나오므로 여유가 필요하다.
           흰 여백이 남는 건 손해가 없지만, 한 글자라도 잘리면 문제를 못 읽는다. */
      pad = Math.max(0, Math.min(14, xs[0] - 14));
    }
  }catch(e){globalThis.__q?.(e)}
  LEFTPAD.set(k, pad); LEFTMIN.set(k, minx);
  return pad;
}
/* 그 쪽 글자가 시작하는 x. 예전 규칙(22pt 고정)이 파고들었는지 판정할 때 쓴다. */
async function leftMinOf(doc, p){
  const k = `${doc.__id || ""}#${p}`;
  if(!LEFTMIN.has(k)) await leftPadOf(doc, p);
  return LEFTMIN.get(k) ?? 999;
}

async function crop(doc, from, to, scale, minH){
  /* 예전에는 어떤 쪽이든 좌우 22pt 를 무조건 깎았다. 기출은 본문이 x=24 라
     아슬아슬하게 살았지만, 오고초려(x≈14)·소방(x≈16)은 «(1)» 같은 앞머리가 날아갔다. */
  const M = await leftPadOf(doc, from.page);
  const parts = [];
  const last = to?.page ?? from.page;
  /* ★ 얇은 조각은 «건너뛰기» 가 아니라 «넓혀서» 잡는다.
       단답은 한 문항이 두 줄인 것이 흔해, 시작과 끝 사이가 14pt 뿐인 경우가 있다.
       예전에는 12pt 미만이면 건너뛰어, 조각이 하나도 안 남으면
       «자를 영역이 없습니다» 로 죽었다. */
  const FLOOR = 4;
  for(let p = from.page; p <= last; p++){
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale });
    const H = vp.height;
    let top = (p === from.page ? from.top : 46) * scale;
    let bot = (p === last && to?.top != null ? to.top : vp.height / scale - 34) * scale;
    if(bot - top < (minH || 0)) bot = Math.min(H, top + (minH || 0));
    if(bot - top < FLOOR && p === last && parts.length === 0){
      bot = Math.min(H, top + 60 * scale);
      if(bot - top < FLOOR) top = Math.max(0, bot - 60 * scale);
    }
    if(bot - top < FLOOR) continue;

    const c = document.createElement("canvas");
    c.width = Math.round(vp.width - M * 2 * scale);
    c.height = Math.round(bot - top);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.translate(-M * scale, -top);
    await page.render({ canvasContext:ctx, viewport:vp }).promise;
    parts.push(c);
  }
  if(!parts.length){
    /* 그래도 안 되면 머리글 자리부터 아래로 한 뼘을 통째로 뜬다.
       옆 문제가 조금 딸려 들어오는 편이, 그림이 아예 없는 것보다 낫다. */
    const page = await doc.getPage(from.page);
    const vp = page.getViewport({ scale });
    const top = Math.max(0, Math.min(vp.height - 40 * scale, (from.top || 0) * scale));
    const bot = Math.min(vp.height, top + 110 * scale);
    const c = document.createElement("canvas");
    c.width = Math.round(vp.width - M * 2 * scale);
    c.height = Math.round(bot - top);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.translate(-M * scale, -top);
    await page.render({ canvasContext:ctx, viewport:vp }).promise;
    parts.push(c);
  }
  if(!parts.length) throw new Error("자를 영역이 없습니다");

  const W = Math.max(...parts.map(c => c.width));
  const H = parts.reduce((a,c) => a + c.height, 0);
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const g = out.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
  let y = 0;
  for(const c of parts){ g.drawImage(c, 0, y); y += c.height; }
  /* ★ v235 — 폭을 1200px 로 묶는다.
     화면에서 제일 넓게 봐야 1080px 안쪽인데 배율을 올려 뜨면 2000px 짜리가
     저장소로 올라갔다. 보이는 것은 그대로면서 파일만 두세 배로 컸다. */
  let fin = out;
  if(out.width > 1200){
    fin = document.createElement("canvas");
    fin.width = 1200; fin.height = Math.round(out.height * 1200 / out.width);
    const fg = fin.getContext("2d");
    fg.fillStyle = "#fff"; fg.fillRect(0, 0, fin.width, fin.height);
    fg.drawImage(out, 0, 0, fin.width, fin.height);
  }
  return await new Promise(r => fin.toBlob(r, "image/jpeg", 0.82));
}

/* 그림을 폭 기준으로 줄인다 (실패한 것을 다시 올릴 때 씀) */
async function shrink(blob, ratio = 0.7){
  const bmp = await createImageBitmap(blob);
  const cv = document.createElement("canvas");
  cv.width = Math.max(200, Math.round(bmp.width * ratio));
  cv.height = Math.max(120, Math.round(bmp.height * ratio));
  const g = cv.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, cv.width, cv.height);
  g.drawImage(bmp, 0, 0, cv.width, cv.height);
  bmp.close?.();
  return await new Promise(r => cv.toBlob(r, "image/jpeg", 0.78));
}

async function put(path, blob){
  let up = await sb.storage.from("qfig").upload(path, blob, { contentType:"image/jpeg", upsert:true });
  if(up.error){
    /* 용량 때문에 튕긴 경우가 대부분이라, 한 번은 줄여서 다시 시도한다 */
    const m = String(up.error.message || "");
    if(/payload|too large|413|Unexpected token '<'|<!DOCTYPE/i.test(m) && blob.size > 300000){
      const small = await shrink(blob, 0.65);
      up = await sb.storage.from("qfig").upload(path, small, { contentType:"image/jpeg", upsert:true });
    }
    if(up.error) throw up.error;
  }
  /* v204 — 파일은 덮어쓰고 주소만 새것으로 만든다.
     저장소는 모르는 물음표 값을 무시하므로 파일에는 영향이 없고,
     저장소 정리 화면도 ? 앞부분만 보고 맞춰 본다. */
  return sb.storage.from("qfig").getPublicUrl(path).data.publicUrl + "?t=" + Date.now();
}

/* ═══════════════════════════════════════════════
   자료함 — 년도·회차·문항별 첨부파일
   실기는 참고자료가 문항 하나에만 붙기도 하고 회차 전체에 붙기도 한다.
   그래서 붙일 자리를 (연도, 회차, 문항)으로 잡되 뒤쪽을 비울 수 있게 했다.
   비운 만큼 넓은 범위에 붙는다.
   ═══════════════════════════════════════════════ */
const A_MAX = 45 * 1024 * 1024;
let AFILES = [];

const kindOf = f => /^image\//.test(f.type) ? "image"
                  : (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)) ? "pdf" : "file";
const sizeText = b => b == null ? "" : b > 1048576 ? (b/1048576).toFixed(1) + "MB"
                                                   : Math.max(1, Math.round(b/1024)) + "KB";

function aScope(){
  const y = $("#aYear").value, s = $("#aSess").value, n = $("#aNo").value.trim();
  return { year: y ? +y : null, session: s ? +s : null, no: (y && s && n) ? +n : null };
}
function paintScope(){
  const { year, session, no } = aScope();
  $("#aScope").textContent = !year ? "과목 전체"
    : !session ? `${year}년 전체`
    : no ? `${year}년 제${session}회 ${no}번`
    : `${year}년 제${session}회`;
  $("#aNo").disabled = !(year && session);
}

async function loadFiles(){
  const sid = +$("#fSub").value;
  if(!sid) return;
  const years = [...new Set(ROWS.map(r => r.year))].sort((a,b) => b-a);
  if($("#aYear").options.length <= 1)
    $("#aYear").innerHTML = `<option value="">연도 전체</option>` + years.map(y => `<option>${y}</option>`).join("");
  if($("#aSess").options.length <= 1)
    $("#aSess").innerHTML = `<option value="">회차 전체</option>`
      + [...new Set(ROWS.map(r => r.session))].sort().map(s => `<option value="${s}">제${s}회</option>`).join("");

  const { data, error } = await sb.from("practical_files").select("*")
    .eq("subject_id", sid)
    .order("year", { ascending:false, nullsFirst:false })
    .order("session", { ascending:false, nullsFirst:false })
    .order("no", { nullsFirst:true }).order("id");
  if(error){
    return void ($("#aList").innerHTML = `<div class="empty">${/practical_files|schema cache/i.test(error.message)
      ? "자료함 표가 아직 없습니다 — <b>supabase-실기.sql</b> 을 다시 한 번 돌려 주세요."
      : esc(error.message)}</div>`);
  }
  AFILES = data || [];
  drawFiles();
}

function drawFiles(){
  const y = $("#aYear").value, s = $("#aSess").value, q = $("#aQ").value.trim();
  let rows = AFILES;
  if(y) rows = rows.filter(r => String(r.year) === y || r.year == null);
  if(s) rows = rows.filter(r => String(r.session) === s || r.session == null);
  if(q) rows = rows.filter(r => (r.name || "").includes(q));

  if(!rows.length){
    $("#aList").innerHTML = `<div class="empty">${AFILES.length ? "조건에 맞는 자료가 없습니다." : "아직 올린 자료가 없습니다."}</div>`;
    return;
  }

  const label = r => !r.year ? "과목 전체"
    : !r.session ? `${r.year}년`
    : r.no ? `${r.year}·${r.session}회 ${r.no}번`
    : `${r.year}·${r.session}회`;

  $("#aList").innerHTML = rows.map(r => `
    <div class="pcard" data-file="${r.id}">
      <div class="phead">
        <span class="pno">${esc(label(r))}</span>
        <span class="pmeta">${esc(r.name)}${r.bytes ? " · " + sizeText(r.bytes) : ""}</span>
        <span class="ppt">${r.kind === "image" ? "사진" : r.kind === "pdf" ? "PDF" : "파일"}</span>
      </div>
      <div class="pbody">
        ${r.kind === "image" || r.kind === "pdf"
          ? `<button class="ansbtn" type="button" data-open="${r.id}">펼쳐 보기</button>
             <div data-slot="${r.id}"></div>`
          : ""}
        <div class="ptools" style="margin-top:9px">
          <a class="zb" href="${esc(r.url)}" target="_blank" rel="noopener">새 창에서 열기</a>
          <button class="zb" type="button" data-fdel="${r.id}">삭제</button>
        </div>
      </div>
    </div>`).join("");

  $$("#aList [data-open]").forEach(b => b.onclick = () => {
    const r = AFILES.find(x => String(x.id) === b.dataset.open);
    const slot = $(`#aList [data-slot="${r.id}"]`);
    if(slot.innerHTML){ slot.innerHTML = ""; b.textContent = "펼쳐 보기"; return; }
    slot.innerHTML = r.kind === "pdf"
      ? `<iframe src="${esc(r.url)}" style="width:100%;height:72vh;border:1px solid var(--rule);border-radius:10px;margin-top:9px;background:#fff"></iframe>`
      : `<div class="pz" data-pz style="margin-top:9px"><div class="pz-stage"><img src="${esc(r.url)}" alt="${esc(r.name)}"></div></div>`;
    b.textContent = "접기";
    slot.querySelectorAll("[data-pz]").forEach(attachZoom);
  });

  $$("#aList [data-fdel]").forEach(b => b.onclick = async () => {
    const r = AFILES.find(x => String(x.id) === b.dataset.fdel);
    if(!confirm(`"${r.name}" 을 지웁니다.`)) return;
    const del = await sb.from("practical_files").delete().eq("id", r.id);
    if(del.error) return say($("#am2"), "지우지 못했습니다 — " + del.error.message, "err");
    if(r.path) await sb.storage.from("qfig").remove([r.path]).catch(() => {});
    loadFiles();
  });
}

/* ── 올리기 ── */
const aDrop = $("#aDrop");
aDrop.onclick = () => $("#aFile").click();
["dragenter","dragover"].forEach(t => aDrop.addEventListener(t, e => { e.preventDefault(); aDrop.classList.add("on"); }));
["dragleave","drop"].forEach(t => aDrop.addEventListener(t, e => { e.preventDefault(); aDrop.classList.remove("on"); }));
aDrop.addEventListener("drop", e => putFiles([...e.dataTransfer.files]));
$("#aFile").onchange = e => putFiles([...e.target.files]);
["#aYear","#aSess"].forEach(k => $(k).addEventListener("change", () => { paintScope(); drawFiles(); }));
$("#aNo").addEventListener("input", paintScope);
$("#aQ").addEventListener("input", () => { clearTimeout(window._t2); window._t2 = setTimeout(drawFiles, 250); });

async function putFiles(files){
  const sid = +$("#fSub").value;
  if(!sid) return say($("#am2"), "과목을 먼저 고르세요.", "err");
  if(!files.length) return;
  const scope = aScope();
  const fails = [];
  const big = files.filter(f => f.size > A_MAX);
  big.forEach(f => fails.push(`${f.name} — 45MB를 넘습니다 (${sizeText(f.size)})`));
  const list = files.filter(f => f.size <= A_MAX);
  if(!list.length) return say($("#am2"), "올리지 못했습니다.\n" + fails.join("\n"), "err");

  let done = 0, ok = 0;
  for(const f of list){
    try{
      /* 보관함(Storage) 키에는 한글·공백·괄호를 넣을 수 없다.
         예전에는 «가-힣» 을 살려 뒀다가 «Invalid key: …전기기사실기_단답….pdf» 로 통째로 거절당했다.
         파일 이름은 표(practical_files.name)에 원래대로 남으니, 키만 영문·숫자로 바꾼다. */
      const ext  = (f.name.match(/\.([A-Za-z0-9]{1,8})$/) || [,"bin"])[1].toLowerCase();
      const stem = f.name.replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9._-]+/g, "-")
                         .replace(/-{2,}/g, "-").replace(/^-|-$/g, "").slice(0, 40);
      const safe = (stem || "file") + "." + ext;
      const path = `prac/${sid}/files/${Date.now()}_${Math.random().toString(36).slice(2,7)}_${safe}`;
      const up = await sb.storage.from("qfig").upload(path, f, { contentType: f.type || "application/octet-stream", upsert:true });
      if(up.error) throw new Error("보관함 — " + (up.error.message || up.error));
      const url = sb.storage.from("qfig").getPublicUrl(path).data.publicUrl;
      const ins = await sb.from("practical_files").insert({
        subject_id:sid, year:scope.year, session:scope.session, no:scope.no,
        name:f.name, kind:kindOf(f), url, path, bytes:f.size });
      if(ins.error) throw new Error("표 — " + (ins.error.message || ins.error));
      ok++;
    }catch(e){
      /* 실패 이유를 모아 뒀다가 끝에 한꺼번에 보여 준다.
         예전에는 바로 아래 진행률 줄이 곧장 덮어써서, 왜 안 올라갔는지 알 길이 없었다. */
      fails.push(`${f.name} — ${e.message || e}`);
    }
    done++;
    $("#aBar").style.width = (done / list.length * 100) + "%";
    if(done < list.length) say($("#am2"), `${done}/${list.length} 올리는 중… (성공 ${ok})`, "info");
  }
  say($("#am2"),
    fails.length ? `${ok}개 올렸고 ${fails.length}개 실패했습니다.\n\n${fails.join("\n")}`
                 : `${ok}개를 모두 올렸습니다.`,
    fails.length ? "err" : "ok");
  $("#aFile").value = "";
  loadFiles();
}

/* ══════════════════════════════════════════════════════
   한눈에 보기
   ──────────────────────────────────────────────────────
   확대 단추를 «찔끔찔끔» 누르며 그림을 키우는 대신, 화면을 통째로 쓴다.
   왼쪽에 문제, 오른쪽에 답안과 해설. 폰에서는 위아래로 나누고
   아래를 탭으로 갈아 끼운다.
   그림은 눌러서 원본 크기로 폈다가 다시 화면 폭에 맞출 수 있다.
   ══════════════════════════════════════════════════════ */
let OVID = null, OVSEG = "a";
/* 한눈에 보기를 «글자» 로 열지 «그림» 으로 열지 — 목록 쪽 «가 글자로 보기» 와 같은 값을 쓴다.
   두 곳이 따로 놀면 «목록은 글자인데 펼치면 그림» 이 되어 헷갈린다. */
let OVTXT = TEXTMODE;

function ovIndex(){ return SHOWN.findIndex(x => String(x.id) === String(OVID)); }

function ovOpen(id){
  const r = ROWS.find(x => String(x.id) === String(id)); if(!r) return;
  OVID = String(id);
  document.body.classList.add("ovlopen");
  /* v253 — 판을 새로 열 때만 레일을 가운데로 맞춘다 (그 뒤엔 손으로 민 자리를 지킴) */
  if(!$("#ovl").classList.contains("on")) window.__ovrRailReset?.();
  $("#ovl").classList.add("on");
  ovDraw();
  /* 해설이 아직 없으면 여기서도 만들어 준다 — 보러 들어왔으니 필요한 것이다
     (넘기기만 한 문항까지 만들지 않게, 잠깐 머무른 뒤에) */
  if(!r.easy_md && r.q_url) ezEnqueueSoon(r.id); else ezCancelSoon();
}
function ovClose(){
  ezCancelSoon();
  $("#ovl").classList.remove("on");
  document.body.classList.remove("ovlopen");
  OVID = null;
}
/* 한눈에 판에서 쓰는 그림 한 장 — 흰 여백을 좁혀서 보여 준다 */
const twImg = (url, alt, rot) =>
  `<div class="tw" data-trim="${esc(url)}"><img src="${esc(url)}" alt="${esc(alt)}" style="${rot}"></div>`;

function ovDraw(){
  const r = ROWS.find(x => String(x.id) === String(OVID)); if(!r) return;
  const rot = r.rotate ? `transform:rotate(${r.rotate}deg)` : "";
  const i = ovIndex();
  $("#ovTitle").textContent = `${r.year}년 제${r.session}회 ${r.no}번`;
  $("#ovSub").textContent = (r.points ? `${r.points}점 · ` : "")
    + (r.asked ? `출제 ${r.asked}` : "") + (i >= 0 ? `  ${i + 1}/${SHOWN.length}` : "");
  $("#ovPrev").disabled = i <= 0;
  $("#ovNext").disabled = i < 0 || i >= SHOWN.length - 1;

  /* 글자로 볼 것인가, 오려낸 그림으로 볼 것인가.
     그림은 원본 여백까지 그대로 들고 와서 화면이 헐렁해진다.
     글은 이미 뽑아 두었으니(q_text · a_text) 빽빽하게 읽고 싶으면 이쪽을 쓴다.
     다만 결선도·시퀀스도는 글로 옮기면 형체가 사라지므로, 그림도 아래에 같이 남겨 둔다. */
  const paneBody = (url, md, txt, what) => {
    if(OVTXT){
      /* 글자로 바꿔 둔 것이 있으면 그걸 쓴다. 없으면 PDF 에서 뽑아 둔 날글이라도 보여 준다. */
      if(md) return `<div class="qmd" data-qmd data-src="${esc(url || "")}">${mdRich(md)}</div>`
        + (url ? `<details class="qsrc"><summary>원본 그림 보기</summary>
            <div class="imgbox">${twImg(url, what, rot)}</div></details>` : "");
      const t = (txt || "").trim();
      return t
        ? `<div class="otx">${esc(t)}</div>`
          + (url ? `<div class="tnote">아직 글자로 변환하지 않은 문항입니다 — «⚡ 전체 변환 진행» 을 누르면 표·수식까지 제대로 옮깁니다.</div>
                    <div class="imgbox">${twImg(url, what, rot)}</div>` : "")
        : `<div class="miss">뽑아 둔 글자가 없습니다. 그림으로 봅니다.</div>`
          + (url ? `<div class="imgbox">${twImg(url, what, rot)}</div>` : "");
    }
    /* «그림으로» 를 켜 두었어도 그림이 없으면 글자라도 보여 준다 —
       빈 칸에 «그림이 없습니다» 만 띄우면 이미 들고 있는 글자를 못 읽는다.
       ★ 손으로 고쳐 넣은 글도 마찬가지다. 그림 뒤에 숨겨 두면 고친 줄을 모른다. */
    const hand = (() => { try{
      return !!(md && window.__handMd && window.__handMd(r.id, what === "답안" ? "a" : "q"));
    }catch(e){ return false } })();
    if(md && hand) return `<div class="qmd" data-qmd data-src="${esc(url || "")}">${mdRich(md)}</div>`
      + (url ? `<details class="qsrc"><summary>원본 그림 보기</summary>
          <div class="imgbox">${twImg(url, what, rot)}</div></details>` : "");
    if(url) return `<div class="imgbox">${twImg(url, what, rot)}</div>`;
    if(md)  return `<div class="qmd" data-qmd>${mdRich(md)}</div>`;
    const t0 = (txt || "").trim();
    if(t0)  return `<div class="otx">${esc(t0)}</div>`;
    return `<div class="imgbox"><div class="miss">${what} 그림이 없습니다.</div></div>`;
  };

  $("#ovText").textContent = OVTXT ? "🖼 그림으로" : "가 글자로";
  $("#ovLeft").innerHTML = `<div class="plab">문제</div>${paneBody(r.q_url, r.q_md, r.q_text, "문제")}`;

  $("#ovRight").innerHTML = `
    <div class="seg${OVSEG === "a" ? " on" : ""}" data-seg="a">
      <div class="plab">답안</div>
      ${paneBody(r.a_url, r.a_md, r.a_text, "답안")}
    </div>
    <div class="seg${OVSEG === "e" ? " on" : ""}" data-seg="e">
      <div class="plab">쉬운 풀이</div>
      <div class="ez">${r.easy_md ? mdLite(r.easy_md)
        : `<div class="miss">해설이 없습니다. 목록의 «해설 만들기» 또는 «✎ 자동 해설 진행» 을 누르세요.</div>`}</div>
    </div>`;

  /* 그림을 누르면 원본 크기로 폈다가 다시 화면 폭에 맞춘다 */
  $("#ovl").querySelectorAll(".imgbox img").forEach(im => {
    im.onclick = () => {
      const on = im.classList.toggle("zoom");
      const box = im.closest(".tw");
      /* 원본 크기로 펼 때는 여백 자르기를 잠시 푼다 — 안 그러면 잘린 창 안에서만 커진다.
         속까지 좁혀 둔 그림은 «진짜 원본» 으로 갈아 끼웠다가 다시 돌아온다. */
      if(box?.dataset.done){
        if(on && im.dataset.orig) im.src = im.dataset.orig;
        else if(!on){ squeeze(box.dataset.trim).then(v => { if(v) im.src = v.src; }); }
        return;
      }
      box?.classList.toggle("on", !on && TRIMON);
    };
  });
  $$("#ovl .otabs button").forEach(b => b.classList.toggle("on", b.dataset.oseg === OVSEG));
  /* 먼저 «속의 빈 띠까지» 좁혀 보고, 그게 안 되는 그림만 예전처럼 창으로 자른다 */
  /* 그림 여백 자르기·속 좁히기 — 픽셀을 훑는 무거운 일이다. 켜 두었을 때만 돈다. */
  if(OVFLAG('squeeze')) applySqueeze($("#ovl")).then(() => applyTrim($("#ovl")));

  /* 글자로 옮긴 칸은 수식을 그리고, [[그림]] 자리를 원본에서 오려 채운다 */
  $$("#ovl .qmd").forEach(el => { tex(el); if(OVFLAG('fig')) figFill(el, el.dataset.src); });
  tex($("#ovl .ez"));
}
function ovStep(d){
  const i = ovIndex(); if(i < 0) return;
  const nx = SHOWN[i + d]; if(!nx) return;
  OVID = String(nx.id);
  if(ONEUP) showAt(i + d);
  ovDraw();
  if(!nx.easy_md && nx.q_url) ezEnqueueSoon(nx.id); else ezCancelSoon();
  $$("#ovl .pane").forEach(p => p.scrollTop = 0);
}
$("#ovText")?.addEventListener("click", () => {
  TEXTMODE = !TEXTMODE;
  paintText();          /* OVTXT 도 여기서 같이 맞춰진다 */
  ovDraw(); drawList();
});
$("#ovClose")?.addEventListener("click", ovClose);
$("#ovPrev")?.addEventListener("click", () => ovStep(-1));
$("#ovNext")?.addEventListener("click", () => ovStep(1));
$$("#ovl .otabs button").forEach(b => b.onclick = () => { OVSEG = b.dataset.oseg; ovDraw(); });
/* ★ v307 — 글자를 치는 중이면(입력칸·글 편집·AI 창) 한눈에 단축키(← → Esc)를 쓰지 않는다.
   여태 이 처리만 입력칸 확인이 없어, AI 에게 묻는 중 ← → 로 커서를 옮기면 뒤의 문제가 넘어가고 Esc 면 한눈에가 닫혔다 */
function typingIn(e){
  const t = e.target, tg = t && t.tagName;
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(tg||"")) return true;
  if(t && (t.isContentEditable || (t.closest && t.closest('[contenteditable=""],[contenteditable="true"],.aic-panel,.aic,[class*="aic-"],.qtpop,.qtbd,.mnpop,.mmpop,.edw,.qastack .qed,.qastack .qx-ed')))) return true;
  if(e.isComposing) return true;
  return false;
}
window.__typingIn = typingIn;
addEventListener("keydown", e => {
  if(!$("#ovl").classList.contains("on")) return;
  if(typingIn(e)) return;
  if(e.key === "Escape"){ e.preventDefault(); return ovClose(); }
  if(e.key === "ArrowRight"){ e.preventDefault(); return ovStep(1); }
  if(e.key === "ArrowLeft"){ e.preventDefault(); return ovStep(-1); }
});
/* t 키로 글자 ↔ 그림 */
addEventListener("keydown", e => {
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || typingIn(e)) return;
  if(e.key !== "t" && e.key !== "T") return;
  if(!$("#ovl").classList.contains("on")) return;
  e.preventDefault();
  $("#ovText")?.click();
});
/* f 키로 지금 보고 있는 문제를 한눈에 편다 */
addEventListener("keydown", e => {
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || typingIn(e)) return;
  if(e.key !== "f" && e.key !== "F") return;
  if($("#ovl").classList.contains("on")) return ovClose();
  const r = ONEUP ? SHOWN[ONEAT] : SHOWN[0];
  if(r) ovOpen(r.id);
});

/* ── 접었다 펴기 — 접은 상태를 기기에 기억해 둔다 ── */
$$("[data-fold]").forEach(b => {
  const box = document.getElementById(b.dataset.fold);
  /* 문제 보기는 펼친 채로 시작한다. 자료함·가져오기는 접은 채로.
     한 번이라도 손대면 그 뒤로는 손댄 상태를 따른다. */
  const saved = localStorage.getItem("prac:fold:" + b.dataset.fold);
  const def = b.dataset.fold === "boxView";
  box.classList.toggle("open", saved === null ? def : saved === "1");
  b.onclick = () => {
    const on = box.classList.toggle("open");
    localStorage.setItem("prac:fold:" + b.dataset.fold, on ? "1" : "0");
    if(on) box.scrollIntoView({ behavior:"smooth", block:"start" });
  };
});

/* ══════════════════════════════════════════════════════════════
   자료함 · PDF 가져오기는 «자동 변환» 탭으로 옮겼다

   실기뷰어에서는 늘 접혀 있으면서도 문제를 보려면 그 밑까지 스크롤해야 했다.
   그렇다고 코드를 자동 변환 쪽으로 통째로 베끼면, 두 문서가
   #run · #stop · #drop · #file · #log 같은 이름을 똑같이 써서 서로의 단추를 집어 간다.
   그래서 «화면만» 옮긴다 — 자동 변환 탭이 이 쪽을 ?only=import 로 불러 쓴다.
   고치는 자리는 여기 한 곳으로 남고, 실기뷰어 본화면은 문제 보기만 남는다.
   ══════════════════════════════════════════════════════════════ */
let IMPORT_UI_DONE = false;
function applyImportOnly(){
  if(IMPORT_UI_DONE) return;            /* boot() 은 로그인 상태가 바뀔 때마다 다시 돈다 */
  IMPORT_UI_DONE = true;
  const files = $("#boxFiles"), imp = $("#boxImport"), view = $("#boxView");
  if(IMPORT_ONLY){
    document.body.classList.add("onlyimport");
    /* 불러 쓰는 쪽에서는 늘 펼쳐 둔다 — 한 번 더 눌러야 하면 옮긴 보람이 없다 */
    files?.classList.add("open"); imp?.classList.add("open");
    view?.setAttribute("hidden", "");
    document.title = "실기 변환 · 기출 해설 노트";
    return;
  }
  /* 본화면 — 두 상자를 걷어내고, 어디로 갔는지만 적어 둔다 */
  files?.setAttribute("hidden", "");
  imp?.setAttribute("hidden", "");
  const head = view?.querySelector(".foldh");
  if(head) head.innerHTML = `<span class="arw">◀</span>문제 보기`;
  view?.classList.add("open");
  $("#main")?.insertAdjacentHTML("beforeend",
    `<div class="movednote">
       <b>자료함</b>과 <b>PDF 에서 문제 가져오기</b>는 위쪽 <b>자동 변환</b> 탭으로 옮겼습니다.
       거기서 <b>필기 변환 / 실기 변환</b>으로 갈라 두었습니다.
       <br><a href="./ingest.html">자동 변환 탭으로 가기 →</a>
     </div>`);
}

/* ═══════════════════════════════════════════════ */
async function boot(){
  applyImportOnly();
  paintView();
  paintText();
  await loadSubjects();
  await loadList();
  paintScope();
  await loadFiles();
  cvCount();
}

/* 지금 과목에 «아직 안 된 것» 이 몇 개인지 알려 준다.
   ★ 예전에는 이 줄이 처음 들어올 때 한 번만 돌았다. 그래서 변환을 다 돌린 뒤에도
     «1061개가 아직 그림입니다» 가 그대로 남아 있었다. 이제 목록을 그릴 때마다 다시 센다. */
function cvCount(){
  if(CVBUSY || EZBUSY) return;
  /* ★ 예전 셈이 틀렸던 곳.
     ① 세는 조건과 실제로 도는 조건이 서로 달랐다.
        여기서는 «q_md 가 없는 것» 만 셌는데, 정작 «변환» 단추는
        «그림이 있는데 글자가 없는 쪽» 을 돈다. 그래서 답안 그림만 있고
        문제 그림이 없는 줄은 아무리 돌려도 숫자가 안 줄어, 이미 글자로
        다 가지고 있는데도 «1061개 남음» 이 그대로 붙어 있었다.
     ② 그림이 아예 없는 줄(글자로만 들어온 줄)까지 «남았다» 에 넣었다.
        그건 채울 것이 없으니 이미 다 된 것이다.
     이제 두 단추의 대상과 «똑같은 식» 으로 센다 — 숫자가 0 이면 정말 0 이다. */
  /* ★ v193 — 잠근 칸은 «남은 것» 으로 세지 않는다 (한 곳에서만 판단한다) */
  const cvLeft = r => window.__needCv ? window.__needCv(r) : ((r.q_url && !r.q_md) || (r.a_url && !r.a_md));
  const ezLeft = r => window.__needEz ? window.__needEz(r) : (!r.easy_md && (r.q_url || r.q_md));

  const has = ROWS.filter(r => r.q_url || r.a_url || r.q_md || r.a_md);
  if(!has.length) return cvSay("");
  const nCv = has.filter(cvLeft).length;
  const nEz = has.filter(ezLeft).length;
  const nTxt = has.filter(r => !r.q_url && !r.a_url).length;   /* 그림 없이 글자로만 들어온 줄 */

  cvSay(`이 과목 ${has.length}개 — `
    + (nCv ? `글자 변환 ${nCv}개 남음` : "글자 변환 다 됨") + " · "
    + (nEz ? `쉬운 풀이 ${nEz}개 남음` : "쉬운 풀이 다 됨")
    + (nTxt ? `   (그중 ${nTxt}개는 그림 없이 글자로만 들어온 것)` : "")
    + (nCv || nEz ? "   (두 단추는 «남은 것만» 골라 돕니다)" : ""));
}

/* ── 쉬운 풀이 일괄 ── 변환과 같은 자리에서 같은 모양으로 돈다 */
/* ══════════════════════════════════════════════════════
   다시 꾸미기 — 내용은 그대로 두고 «보기 좋게» 만 다시 손본다
   ──────────────────────────────────────────────────────
   자동 해설 프롬프트가 바뀌면서(박스·굵은 소제목) 새로 만든 것과 옛날에
   만든 것이 서로 다르게 보인다. 이건 그 차이를 메운다 — 답을 다시 계산
   하거나 문장을 다시 쓰는 게 아니라, 같은 내용을 새 겉모습(박스 · 굵게 ·
   크기)으로만 갈아입힌다. 문제·답안·해설 세 칸 다 따로 돌릴 수 있다.
   ══════════════════════════════════════════════════════ */
function reformatPrompt(text, kind){
  const body = String(text || "").slice(0, 3000);
  if(kind === 'ez'){
    return `아래는 이미 완성된 «쉬운 풀이» 다. 사실 관계(숫자·식·정답·설명 방향)는 하나도
바꾸지 말고, 군더더기를 걷어내고 아래 [규칙] 에 맞게 다시 앉혀라. 새로 계산하지 마라.

[규칙]
- 마크다운은 **굵게** 와 - 목록만 쓴다.
- 물음이 여러 개면, 물음 하나(그 안의 모든 내용)를 [[box]] 줄로 열고 [[/box]] 줄로
  닫아서 물음 하나당 박스 하나가 되게 한다. 박스 첫 줄은 그 물음 제목을
  **(1) 문제를 한마디로** 처럼 굵게 써서 넣는다. 물음이 하나뿐이면 전체를 박스 하나로.
- [[box]] 와 [[/box]] 는 줄 맨 앞에 단독으로 쓴다. 박스 사이에는 --- 줄을 하나 넣는다.
- 수식·LaTeX 표기가 이미 있으면 그대로 둔다. 손대지 마라.

[★ 걷어낼 것 — 이것이 이번 손질의 핵심이다]
- «쓰는 값: 없음», «쓰는 식: 없음», «넣고 계산: 없음», «해당 없음» 처럼 «없다» 고만
  말하는 줄은 통째로 지운다. 아무것도 알려 주지 않으면서 자리만 차지한다.
- «목적: …를 작성합니다», «…를 구하는 문제입니다» 처럼 물음을 되풀이하기만 하는
  줄도 지운다. 물음은 왼쪽에 이미 있다.
- 단답형(명칭·약어 풀이·용어)은 세 줄 안쪽으로 줄인다. 답을 먼저 쓰고, 필요하면
  왜 그런지 한 줄만 남긴다. 틀을 채우려고 늘려 둔 문장은 지운다.
- «이 문제가 물고 늘어질 수 있는 것» 처럼 다른 문제를 가정하는 대목이 있으면 통째로 지운다.

[★ N가지를 쓰라는 물음 — 두문자로 외우게 바꾼다]
답이 여러 개 나열된 물음이면 아래 모양으로 다시 앉힌다.
**(1)번문항: 노글보광균**
① 노: 노면의 높은 평균휘도
② 글: 글레어가 적을 것
③ 보: 보도·건축물 전면의 충분한 조도
④ 광: 광색·연색성 적절
⑤ 균: 균제도(휘도가 고른 정도) 확보
- 두문자는 각 답의 «첫 글자» 를 그 차례대로 이어 붙인 것이어야 한다. 원문에 없는
  글자를 넣거나 차례를 바꾸지 마라 — 외운 대로 못 쓰게 된다.
- 한 항목은 한 줄이다. 항목마다 긴 설명을 새로 붙이지 마라.

- 원문에 없는 내용을 지어내지 마라. 위에서 «걷어낼 것» 으로 짚은 것 말고는 빼지 마라.

[원문]
${body}`;
  }
  /* ★ v192 — 답안 와꾸를 사진처럼 못 박는다.
     그동안 «읽기 좋게 정리해라» 정도로만 말해 둬서, 돌릴 때마다 결과가 달랐다
     (답이 계산식 뒤에 붙기도 하고, 번호가 한 줄에 몰리기도 했다).
     이제 나올 모양을 통째로 예시로 보여 주고 «이 틀에서 벗어나지 마라» 고 한다.
     (1)(2) 를 **굵게** 감싸도 이제는 화면이 알아보므로, 굵게 쓰라고 시켜도 안전하다 —
     v192 에서 알아보는 쪽을 너그럽게 고쳤다. */
  if(kind === 'a'){
    return `아래는 이미 완성된 «답안» 이다. 숫자·식·계산 결과·최종 답은 단 하나도 바꾸지 말고,
줄 나눔과 배치만 아래 [틀] 과 똑같이 맞춰서 다시 써라. 새로 계산하지 마라.

[틀] — 이 모양에서 벗어나지 마라
[[box]]
**(1)번문항**
① $여기에 원문의 식 그대로$
▶답 : 4000[kVA]
② $여기에 원문의 식 그대로$
▶답 : 3000[kVA]

**(2)번문항**
$여기에 원문의 식 그대로$
▶답 : 10,000[kVA]

**(5)번문항**
- 명칭 : 주변압기 차동 계전기
- 역할 : 변압기의 내부 고장 보호
[[/box]]

[규칙]
- 전체를 [[box]] 한 개로 감싼다. [[box]] 와 [[/box]] 는 줄 맨 앞에 단독으로 쓴다.
- ★ 원문에 있는 물음은 (1)(2)(3)… 하나도 빠짐없이 다 옮겨라. 마지막 물음까지
  반드시 쓰고 [[/box]] 로 닫아라. 중간에서 끊지 마라 — 이게 제일 중요하다.
- ★ 표는 «한 줄에 한 행» 이다. 칸 안에서 줄을 바꾸지 마라. 두 줄로 쓰고 싶으면
  칸 안에 <br> 을 넣어라 (예: | 단면적<br>[mm²] | 허용전류[A] |).
  표는 원문에 있는 행을 하나도 빼지 말고 그대로 옮긴다.
- 물음 제목은 **(1)번문항** 처럼 굵게, 한 줄에 하나씩 쓴다.
- 물음과 물음 사이에는 반드시 빈 줄을 한 줄 넣는다.
- 잔물음이 있으면 ① ② ③ 을 줄 맨 앞에 쓰고, 한 줄에 하나씩만 둔다.
- 최종 답은 반드시 «▶답 : 값» 형태로 «따로 한 줄» 을 만들어 쓴다.
  계산식과 같은 줄에 붙이지 마라 — 이게 제일 중요하다.
- 서술형 물음(명칭·역할·이유)은 «- 명칭 : …» 처럼 목록으로 쓴다.
- 수식은 원문의 LaTeX 를 글자 하나 안 바꾸고 그대로 옮긴다. $ 표시도 그대로 둔다.
- 원문에 없는 내용을 지어내지 말고, 있는 물음을 빠뜨리지도 마라.

[원문]
${body}`;
  }
  /* 문제 — 지문 한 덩어리 + (1)(2) 물음. 굵게 감싸도 되지만 목록 남발은 막는다. */
  const qaPart = `
- 물음 앞의 설명글(지문)은 하나의 문단으로 정리해 앞에 둔다 — 이 부분은 화면이
  자동으로 상자를 그려 주니 너는 그냥 «보통 문장» 으로만 써라.
- 조건·단서(«단, …»)도 빠짐없이 지문에 남겨라.`;
  return `아래는 이미 완성된 «문제» 다. 사실 관계(조건·숫자·표·최종 물음)는 단 하나도
바꾸지 말고, 그 사실을 «어떻게 나열하는지» 만 다시 정리해서 훨씬 읽기 좋게 새로 써라.
문장을 다시 쓰는 것은 괜찮다 — 다만 값이나 조건이 원문과 달라지면 안 된다.

[규칙]
- 물음 번호 (1) (2) (3) … 은 반드시 줄 맨 앞에 두고, 한 줄에 하나씩만 쓴다.
  (굵게 감싸도 되고 안 감싸도 된다 — 화면이 알아서 파랗게 칠한다)
- 물음과 물음 사이에는 빈 줄을 한 줄 넣는다.
- 물음 하나의 내용은 한 문단(또는 몇 줄)으로 잇는다 — 목록(- )을 남발하지 마라.${qaPart}
- 수식·LaTeX 표기는 원문 그대로 살린다. 손대지 마라. $ 표시도 그대로 둔다.
- [[그림 …]] 표시가 있으면 그 줄을 그대로 옮겨라 — 지우면 그림이 사라진다.
- 원문에 없는 내용을 지어내지 마라. 원문에 있는 조건·숫자·결과를 빼지도 마라.

[원문]
${body}`;
}

async function reformatRow(r, field){
  const src = r[field]; if(!src) return false;
  if(field === 'easy_md' && window.__ezFixed && window.__ezFixed(r.id)) return false;   /* ★ v267 */
  const kind = field === 'easy_md' ? 'ez' : field === 'q_md' ? 'q' : 'a';
  /* ★ v195 — 안 볼 항목은 AI 에 넘기기 «전» 에 잘라 낸다. 그래야 새로 쓴 글에
     그 부분이 되살아나지 않고, 저장될 때 영영 사라진다(그리기 때만 감추는 게 아니라). */
  const clean = (window.__dropCut ? window.__dropCut(src) : src);

  /* ★ v198 — 길이를 넉넉히 준다. 3600 으로는 물음이 서너 개인 긴 답안이
     중간에서 끊겨, 마지막 물음이 통째로 사라진 채로 저장됐다(실제로 (3)번이
     날아갔다). 원문 길이에 맞춰 올려 잡되 위쪽으로 넉넉하게 둔다. */
  const budget = Math.min(16000, Math.max(4000, Math.ceil(clean.length / 1.6) + 2500));
  const md0 = await askAI(reformatPrompt(clean, kind), null, budget);
  const md = (window.__dropCut ? window.__dropCut(md0 || "") : md0);
  if(!md || !md.trim()) return false;

  /* ★ v198 · 내용이 사라졌으면 «성공» 으로 덮어쓰지 않는다.
     와꾸를 고치는 일이지 내용을 줄이는 일이 아니다. 물음 번호가 하나라도
     없어졌거나 글이 너무 많이 짧아졌으면 원문을 그대로 두고 실패로 알린다 —
     조용히 덮어써 버리면 뭘 잃었는지도 모르게 된다. */
  const nums = txt => {
    const set = new Set();
    String(txt).split("\n").forEach(l => {
      const m = l.trim()
        .replace(/^\s*(?:\*\*|__)\s*/, "")
        .replace(/[（(]\s*(\d{1,2})\s*[）)]/, "($1)")
        .match(/^\((\d{1,2})\)/);
      if(m) set.add(m[1]);
    });
    return set;
  };
  const was = nums(clean), now = nums(md);
  const lost = [...was].filter(n => !now.has(n));
  if(lost.length) throw new Error(`(${lost.join(")(")})번 물음이 사라져서 되돌렸습니다`);
  /* 표 줄이 통째로 날아간 경우도 잡는다 */
  const barLines = t => String(t).split("\n").filter(l => /^\s*\|.*\|/.test(l)).length;
  if(barLines(clean) >= 3 && barLines(md) < Math.ceil(barLines(clean) * 0.6))
    throw new Error("표가 사라져서 되돌렸습니다");
  if(md.replace(/\s/g, "").length < clean.replace(/\s/g, "").length * 0.55)
    throw new Error("글이 절반 넘게 줄어서 되돌렸습니다");
  const up = await sb.from("practicals").update({ [field]: md }).eq("id", r.id);
  if(up.error) throw new Error(up.error.message);
  r[field] = md;
  return true;
}

/* ★ 예전엔 여기 «다시 꾸미기» 를 문항 여러 개씩 한꺼번에 돌리는 함수가 있었다 —
   범위 고르기(이 문항만·이 회차·전체) 팝업까지 딸려서 오히려 복잡했다.
   지금은 한눈에보기의 «✨ 이 문항 다시 쓰기» 하나로 합쳤다(위쪽 «한눈에 헤더»
   부분 참고) — 누르면 바로 지금 보는 문항 하나의 문제·답안·해설을 순서대로
   고쳐 쓴다. reformatPrompt·reformatRow(위)는 그대로 쓰고, 여러 개를
   훑는 부분만 걷어냈다. */

async function ezRunAll(){
  if(CVBUSY || EZBUSY) return;
  const pool = ROWS.filter(r => (r.q_url || r.q_md) && !r.easy_md && !(window.__ezFixed&&window.__ezFixed(r.id)));
  if(!pool.length) return cvSay("이 과목은 쉬운 풀이가 다 돼 있습니다.");
  if(!confirm(`해설이 없는 ${pool.length}개에 쉬운 풀이를 씁니다.\n`
    + `한 개에 20~40초쯤 걸리므로 대략 ${Math.ceil(pool.length * 30 / 60)}분입니다.\n`
    + `«중지» 를 눌러도 거기까지는 저장됩니다. 계속할까요?`)) return;

  EZBUSY = true; CVSTOP = false;
  $("#cvStop").hidden = false; $("#cvProg").hidden = false;
  ["#cvGap","#ezRun","#cvAll","#cvAllSess"].forEach(k => { const b = $(k); if(b) b.disabled = true; });
  let ok = 0, bad = 0, n = 0;
  for(const r of pool){
    if(CVSTOP) break;
    n++;
    cvSay(`쉬운 풀이 ${n}/${pool.length} — ${r.year}년 제${r.session}회 ${r.no}번 · 됨 ${ok}` + (bad ? ` · 실패 ${bad}` : ""));
    $("#cvBar").style.width = (n / pool.length * 100) + "%";
    try{ await ezMake(r.id, false, true); r.easy_md ? ok++ : bad++; }
    catch(e){ bad++; log(`해설 실패 ${r.year}-${r.session} ${r.no}번 — ${e.message || e}`); }
    await new Promise(x => setTimeout(x, 400));
  }
  $("#cvStop").hidden = true; $("#cvProg").hidden = true;
  ["#cvGap","#ezRun","#cvAll","#cvAllSess"].forEach(k => { const b = $(k); if(b) b.disabled = false; });
  EZBUSY = false;
  cvSay((CVSTOP ? "중지했습니다. " : "") + `쉬운 풀이 ${ok}개 완료` + (bad ? ` · ${bad}개 실패` : ""));
  drawList(); cvCount();
}
$("#ezRun")?.addEventListener("click", ezRunAll);
/* ══════════════════════════════════════════════════════════════
   v234 — «잠깐 딴 데 갔다 오면 처음 화면으로 돌아가던» 자리

   supabase-js 는 로그인·로그아웃뿐 아니라 «토큰 자동 갱신(TOKEN_REFRESHED)»
   «첫 세션 알림(INITIAL_SESSION)» 같은 것도 이 한 통로로 알려 준다.
   탭을 다른 데 두었다가 돌아오면 그때 갱신이 일어나는데,
   예전 코드는 그 알림마다 boot() 을 다시 돌렸다 — 목록을 처음부터 새로 받고
   연도·회차 거르개와 보던 문항이 전부 초기화됐다. Supabase 전송량도 그만큼 더 나갔다.

   이제 «사람이 바뀌었을 때(로그인 / 로그아웃)» 만 다시 세운다.
   토큰만 새로 받은 것은 화면을 건드리지 않는다.
   ══════════════════════════════════════════════════════════════ */
let BOOTED = false, AUTH_UID = null;
function bootFor(uid){                          /* 같은 사람이면 두 번 세우지 않는다 */
  if(BOOTED && uid === AUTH_UID) return;
  AUTH_UID = uid; BOOTED = true;
  boot();
}
(async () => {
  if(await gate()){
    let uid = null;
    try{ uid = (await sb.auth.getSession())?.data?.session?.user?.id || null; }catch(e){globalThis.__q?.(e)}
    bootFor(uid);
  }
})();
/* ★ 이 콜백 안에서 getSession()·sb.from() 을 부르면 인증 잠금이 서로를 기다려 굳는다.
   그래서 잠금 밖(setTimeout 0)으로 나온 뒤, 세션도 콜백이 준 값을 그대로 쓴다. */
sb?.auth?.onAuthStateChange?.((evt, session) => setTimeout(() => {
  const uid = session?.user?.id || null;
  if(evt === "SIGNED_OUT" || !uid){
    BOOTED = false; AUTH_UID = null;
    $("#gate").hidden = false; $("#main").hidden = true;
    return;
  }
  if(BOOTED && uid === AUTH_UID) return;        /* 토큰만 갱신됨 — 보던 화면 그대로 둔다 */
  $("#gate").hidden = true; $("#main").hidden = false;
  bootFor(uid);
}, 0));
