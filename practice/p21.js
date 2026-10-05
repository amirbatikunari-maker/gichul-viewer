/* practice.html 에서 분리 (v341) — 원래 11679번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };

/* ══ ① 낱말 뽑기 ══ */
const STOP=new Set(('것 이것 그것 다음 아래 위의 경우 때 대하여 대한 관하여 구하시오 구하라 쓰시오 쓰라 하시오 하라 설명 이때 각각 모두 사용 이용 다만 단위 조건 문제 답안 계산 과정 답 정격 사용하는 그림 같은 있는 없는 하는 되는 이며 이고 한다 된다 얼마 무엇 어떤 몇개 개의 시의 값은 값을').split(/\s+/));
function toks(r){
  const src=((r.q_md||r.q_text||'')+' ').slice(0,600);
  return [...new Set((src.match(/[가-힣A-Za-z]{2,}/g)||[])
    .map(w=>w.replace(/(으로|에서|에는|이다|한다|인가|하면|보다|까지|부터|에게|에서는|하여|하고|이란|라고)$/,''))
    .filter(w=>w.length>=2&&!STOP.has(w)))];
}

/* ══ ② 유형 ══ */
const TYPES=[
  ['계산','계산'],
  ['회로','회로·도면'],
  ['단답','단답'],
  ['서술','서술']
];
function typeOf(r){
  const t=(r.q_md||r.q_text||'');
  let calc=0,circ=0,short_=0,desc=0;
  if(/구하시오|구하라|계산|산출|얼마|몇\s*\[|용량|전류|전압|역률|효율|손실|저항|리액턴스|전력|백분율|퍼센트|kVA|kW|MVA|\[A\]|\[V\]|\[kW\]|\[kVA\]/.test(t)) calc+=2;
  if(/\$|\\dfrac|\\sqrt|=\s*\d/.test(t)) calc+=1;
  if(/결선도|단선도|복선도|시퀀스|회로|도면|접점|계전기|타임차트|논리|래더|배치도|블록선도/.test(t)) circ+=2;
  if(r.q_url&&/\[\[\s*그림/.test(t)) circ+=1;
  if(/설명하시오|기술하시오|서술|이유|까닭|목적|역할|기능|비교하시오/.test(t)) desc+=2;
  if(/쓰시오|쓰라|명칭|용어|약호|기호|무엇인가|나열|들시오|답하시오/.test(t)) short_+=2;
  const best=[[calc,'계산'],[circ,'회로'],[desc,'서술'],[short_,'단답']].sort((a,b)=>b[0]-a[0])[0];
  return best[0]>0?best[1]:'단답';
}

/* ══ ②-2 NCS 출제기준 항목 ══
   ncs-gijun.js 에 담아 둔 «주요항목별 낱말 꾸러미» 와 문제 글을 맞대 본다.
   그 항목에서만 쓰는 말(keys)은 3점, 출제기준 문장에서 자동으로 뽑은 말(weak)은 1점.
   가장 점수가 높은 항목을 붙이고, 어느 것도 못 맞추면 비워 둔다(억지로 붙이지 않는다). */
function ncsOf(r){
  const G=window.NCS_GIJUN; if(!G) return null;
  const raw=((r.q_md||r.q_text||'')+' '+(r.a_md||r.a_text||'')).slice(0,900);
  if(!raw.trim()) return null;
  /* ★ 빈칸을 걷어내고 맞댄다 — «전력용 콘덴서» 와 «전력용콘덴서» 가 서로 다른 말이
     되어 낱말이 통째로 안 걸리던 것을 막는다. */
  const t=raw.replace(/\s+/g,'');
  const has=k=>t.includes(String(k).replace(/\s+/g,''));
  let best=null;
  G.silgi.majors.forEach(M=>{
    let sc=0;
    M.keys.forEach(k=>{ if(has(k)) sc+=3 });
    (M.weak||[]).forEach(k=>{ if(has(k)) sc+=1 });
    if(has(M.name)) sc+=4;
    if(!best||sc>best.sc) best={sc,M};
  });
  if(!best||best.sc<3) return null;
  /* 세부항목까지 — 같은 방식으로 한 겹 더 */
  let sub=null,ss=0;
  (best.M.subs||[]).forEach(S=>{
    let x=0; (S.keys||[]).forEach(k=>{ if(has(k)) x+=1 });
    if(has(S.name.replace(/하기$/,''))) x+=3;
    if(x>ss){ ss=x; sub=S.name }
  });
  return { name:best.M.name, short:best.M.short, sub, sc:best.sc };
}

/* ══════════════════════════════════════════════════════════════
   출제 이력 읽기 (v237) — «출제자 눈» 으로 고쳐 놓은 자리

   예전에는 문항 글을 서로 닮았는지 재서(TF-IDF) 확률을 세웠다.
   추정이라 흔들렸고, 무엇보다 «최근 5개년» 이라는 잣대가 없었다.

   그런데 문제집이 이미 답을 적어 놓았다 — 머리에 붙은 «출제 84.91.96.11.26.»
   이것이 그 문제가 실제로 나온 해의 목록이다. 추정할 까닭이 없다.
   그래서 이것을 첫째 근거로 삼고, 이 값이 없는 문항만 예전 방식으로 메운다.
   ══════════════════════════════════════════════════════════════ */
const NOWY = new Date().getFullYear();

/* ── 저울 (v240) ──
   ① 반감기 5년 — 처음에 3.5년(출제기준 개정 주기)으로 잡았는데 너무 짧았다.
      실기 기출의 재출제 주기가 대체로 3~8년이라, 반감기가 그보다 짧으면
      «주기 5년짜리 유형» 을 제 주기가 돌아오기도 전에 반쯤 잊어버린다.
      주기를 재려면 저울이 주기보다 조금 길어야 한다.
   ② 20년보다 오래된 이력은 «횟수만» 본다 — 그때 문제 꼴은 지금과 다르다.
      다만 아주 지우지는 않는다. 40년을 버틴 문항은 그 자체가 «핵심» 이라는 증거다(바닥값 0.04).
   ③ 관측 폭(W)도 같은 저울로 잰다 — 안 나온 해도 세야 «확률» 이 된다.
   이 저울에서는 «한 번만 나온 문항» 은 아무리 최신이어도 금·은에 못 든다.
   금·은은 «되풀이가 확인된 유형» 의 자리다. */
const HALF = 5, BACK = 20, FAR = 45, FLOOR = 0.04;
const WIN5 = 5;                                   /* 최근 몇 개년을 볼 것인가 */
const Y0   = NOWY - (WIN5 - 1);

function askedYears(r){
  const out = new Set();
  (String(r.asked || '').match(/\d{2,4}/g) || []).forEach(t => {
    let y = +t;
    if(t.length === 4){ if(y >= 1970 && y <= NOWY + 1) out.add(y); return; }
    if(t.length !== 2) return;
    y = y >= 70 ? 1900 + y : 2000 + y;            /* 84 → 1984, 26 → 2026 */
    if(y >= 1970 && y <= NOWY + 1) out.add(y);
  });
  const y = +r.year;                               /* 이 문항이 실린 회차도 한 번의 출제 */
  if(y >= 1970 && y <= NOWY + 1) out.add(y);
  return [...out].sort((a, b) => b - a);
}

/* ── 같은 문제는 이력을 합친다 (v238b) ──
   같은 문항이 여러 회차에 실려 표에 여러 줄로 들어 있다.
   그런데 문제집이 적어 준 «출제 연도» 는 그 책이 찍힌 시점까지만이라,
   2011년 줄에는 26 이 없고 2026년 줄에만 있다.
   그대로 두면 «같은 문제인데 한쪽은 똥, 한쪽은 은» 이 된다 — 말이 안 된다.
   그래서 «중복 묶기» 가 이미 묶어 둔 덩어리의 연도를 합집합으로 쓴다. */
let GYEARS = null;
function groupYears(){
  if(GYEARS) return GYEARS;
  GYEARS = new Map();
  let d = null;
  try{ d = window.__pracDup && window.__pracDup(); }catch(e){globalThis.__q?.(e)}
  if(!d || !d.ready || !d.groups || !d.groups.size) return GYEARS;   /* 아직이면 비워 둔다 */
  d.groups.forEach(list => {
    const set = new Set();
    (list || []).forEach(r => askedYears(r).forEach(y => set.add(y)));
    const ys = [...set].sort((a, b) => b - a);
    (list || []).forEach(r => GYEARS.set(String(r.id), ys));
  });
  return GYEARS;
}

/* 관측 폭 — 문항과 무관하므로 한 번만 센다 */
let WOBS = null;
function wobs(){
  if(WOBS != null) return WOBS;
  let w = 0;
  for(let k = 0; k < BACK; k++) w += Math.pow(0.5, k / HALF);
  return (WOBS = w);
}

/* 연간 출제율 λ — «한 해에 몇 번 나오는 유형인가» */
function rateOf(ys){
  let A = 0, far = 0;
  (ys || []).forEach(y => {
    const k = NOWY - y;
    if(k < 0 || k > FAR) return;
    if(k < BACK) A += Math.pow(0.5, k / HALF);
    else far += FLOOR;                 /* 옛 이력은 «핵심이라는 증거» 로만 */
  });
  A += Math.min(0.30, far);            /* 옛 이력이 아무리 많아도 여기까지 */
  /* 표본이 적을 때 튀지 않게 살짝 눌러 준다 */
  return (A + 0.10) / (wobs() + 1.0);
}

/* λ 를 사람 말로 */
const cycleOf = l => (l > 0 ? 1 / l : 99);          /* 평균 재출제 주기(년) */
/* 다음 «1년» 안에 나올 확률.
   ★ v242 — 여기가 틀려 있었다.
     A 는 «나온 해의 수» 다. 한 해에 두 번 나와도 1로 센다(출제 연도 기록이 연 단위라서).
     그러니 λ = A/W 는 이미 «어떤 해에 나올 확률» 그 자체다 — 비율이지 «횟수» 가 아니다.
     그런데 포아송(1−e^−λ)을 한 번 더 씌우고 있었다. 되풀이 횟수를 확률로 바꾸는 식인데,
     이미 확률인 값에 씌우니 위쪽이 통째로 눌렸다 — «매년 나오는 유형» 이 59% 로 나왔다.
     그럴 리가 없다. 그대로 쓴다. */
function probOf(l){
  return Math.max(1, Math.min(97, Math.round(l * 100)));
}

/* 등급 — 뱃지에 적힌 «출제확률» 그 숫자로 끊는다 (v240).
   주기로 끊었더니 뱃지 숫자와 색이 따로 놀았다. 눈에 보이는 값으로 끊는 것이 맞다.
   (등급 잣대는 아래 tierOf 참고 — v246 에서 «누적 횟수» 축이 하나 더 붙었다) */
/* ★ v246 — 축을 둘로 늘린다.
   여태는 «최근 가중 확률» 한 축이었다. 그러면 26년 동안 열 번 나왔지만
   요 몇 해 뜸한 «고전 단골» 이 통째로 아래로 밀린다. 실제로 금이 30문항밖에 안 나왔다.
   문제집(타우린 등)이 «24개년 누적 출제 횟수» 로 금은동을 나누는 데는 까닭이 있다 —
   여러 번 나왔다는 사실 자체가 «출제자가 좋아하는 주제» 라는 증거다.
   그래서 둘 중 하나만 넘으면 그 등급을 준다.
     금  확률 25% 이상  또는  통틀어 5번 이상 나온 유형
     은  확률 15% 이상  또는  통틀어 3번 이상
     동  확률  8% 이상  또는  통틀어 2번 이상
     똥  한 번 나오고 만 유형
   확률 축은 «지금 뜨는 것» 을, 횟수 축은 «원래 단골» 을 잡는다. 둘 다 필요하다. */
function tierOf(l, nAll){
  const p = probOf(l);
  const n = nAll || 0;
  if(p >= 25 || n >= 5) return 'g';
  if(p >= 15 || n >= 3) return 's';
  if(p >= 8  || n >= 2) return 'b';
  return 'r';
}
/* 출제 이력이 비어 있는 문항 — 예전에는 아주 다른 셈(닮은 정도)으로 등급을 매겨
   두 체계가 한 화면에 섞였다. 이제는 «한 핏줄 문항» 들이 실린 해를 빌려 와
   똑같은 저울에 올린다. 기준이 하나여야 견줄 수 있다. */
function kinYears(r){
  const set = new Set(askedYears(r));
  let rel = [];
  try{ rel = (window.__pracRel && window.__pracRel(r.id)) || []; }catch(e){globalThis.__q?.(e)}
  rel.forEach(x => {
    if(!x || x.sim < 0.5) return;                 /* 어지간히 닮은 것만 */
    let k = null;
    try{ k = (Array.isArray(ROWS) ? ROWS : []).find(z => String(z.id) === String(x.id)); }catch(e){globalThis.__q?.(e)}
    if(k) askedYears(k).forEach(y => set.add(y));
  });
  return [...set].sort((a, b) => b - a);
}

/* ══ ③ 주제 묶기 · 확률 · 등급 ══ */
let TAG=null, SIG='', BUILDING=false;
/* ★ 등급·주제 묶기도 «부를 때 그 자리에서» 세면 화면이 잠깐 멎는다.
   그래서 셈은 틈날 때 한 번만 돌리고, 그전에는 그냥 «아직 없음» 으로 답한다. */
function ensure(){
  if(window.__pracSwap||BUILDING) return TAG;
  const rows=rowsAll();
  if(!rows.length) return TAG;
  if(TAG&&SIG===rows.length) return TAG;
  BUILDING=true;
  const run=()=>{
    try{ buildNow() }catch(e){ try{ console.warn('등급을 세지 못했습니다',e) }catch(x){globalThis.__q?.(x)} }
    BUILDING=false;
    try{ stamp(); paintChips(); }catch(e){globalThis.__q?.(e)}
    if(anyOn()){ try{ (window.__pracRedraw||drawList)() }catch(e){globalThis.__q?.(e)} }
  };
  (window.requestIdleCallback ? requestIdleCallback(()=>run(),{timeout:500}) : setTimeout(run,80));
  return TAG;
}
function buildNow(){
  /* ★ 목록을 «거르는 중» 에는 절대 다시 세지 않는다.
     예전에는 걸러진 목록으로 등급을 새로 매기다가, 걸러진 목록이
     또 새 열쇠가 되어 셈이 끝없이 되풀이됐다 — 화면이 뻗던 두 번째 까닭이다. */
  if(window.__pracSwap) return TAG;
  const rows=rowsAll();
  const sig=rows.length;                       /* 순서가 바뀌어도 다시 세지 않는다 */
  if(TAG&&SIG===sig) return TAG;
  if(!rows.length) return null;
  SIG=sig;

  const N=rows.length;
  const T=rows.map(toks);
  const df=new Map();
  T.forEach(ts=>ts.forEach(t=>df.set(t,(df.get(t)||0)+1)));
  const COMMON=Math.max(6,Math.floor(N*0.05)), RARE=Math.max(2,Math.floor(N*0.012));
  const keys=T.map(ts=>ts.filter(t=>{ const d=df.get(t); return d>=2&&d<=COMMON }));

  const inv=new Map();
  keys.forEach((ks,i)=>ks.forEach(t=>{ (inv.get(t)||inv.set(t,[]).get(t)).push(i) }));
  const pair=new Map(), strong=new Map();
  inv.forEach((list,t)=>{
    if(list.length>40) return;
    const rare=df.get(t)<=RARE;
    for(let a=0;a<list.length;a++) for(let b=a+1;b<list.length;b++){
      const k=list[a]+'|'+list[b];
      pair.set(k,(pair.get(k)||0)+1);
      if(rare) strong.set(k,true);
    }
  });
  const par=[...Array(N).keys()];
  const find=x=>par[x]===x?x:(par[x]=find(par[x]));
  const uni=(a,b)=>{ a=find(a); b=find(b); if(a!==b) par[b]=a };
  pair.forEach((n,k)=>{ if(n>=2||strong.get(k)){ const [a,b]=k.split('|').map(Number); uni(a,b) } });

  /* 회차 최신 순서 */
  const exams=[...new Set(rows.map(r=>`${r.year}-${r.session}`))]
    .sort((a,b)=>{ const [ay,as]=a.split('-').map(Number), [by,bs]=b.split('-').map(Number);
                   return (by-ay)||(bs-as) });
  const rank={}; exams.forEach((e,i)=>rank[e]=i);
  const NE=Math.max(1,exams.length);

  const groups=new Map();
  for(let i=0;i<N;i++){ const g=find(i); (groups.get(g)||groups.set(g,[]).get(g)).push(i) }

  const out=new Map();                              /* row.id → {p, tier, type, key} */
  const score=[];
  groups.forEach(idxs=>{
    const R=new Set(idxs.map(i=>`${rows[i].year}-${rows[i].session}`)).size;
    const C=idxs.length;
    const fresh=Math.min(...idxs.map(i=>rank[`${rows[i].year}-${rows[i].session}`]??NE));
    /* 옛 방식은 «덩어리가 걸친 회차 / 전체 회차» 였다 — 덩어리가 커지면 저절로 100% 에 붙는다.
       이제는 문항마다 따로 센 재출제 확률을 쓰고, 이것이 아직 안 나왔을 때만 옛 셈으로 버틴다. */
    const blob = C > Math.max(12, N*0.08);      /* 사슬로 부푼 덩어리 — 주제어를 못 믿는다 */
    const freq=new Map();
    idxs.forEach(i=>keys[i].forEach(t=>freq.set(t,(freq.get(t)||0)+1)));
    const key=[...freq.entries()].sort((a,b)=>b[1]-a[1]||(df.get(a[0])-df.get(b[0])))[0]?.[0]||'';
    idxs.forEach(i=>{
      const r=rows[i];

      /* ── 출제 이력을 모은다 (v238b) ──
         ① 이 줄에 적힌 «출제 연도»  ② 같은 문제로 묶인 다른 회차의 것까지 합쳐서
         ③ 그래도 한 번뿐이면 «한 핏줄» 문항들이 실린 해를 빌린다 */
      const own  = askedYears(r);
      const grp  = groupYears().get(String(r.id)) || own;
      const hasA = !!String(r.asked || '').trim();

      /* «같은 유형이 실제로 나온 해» 를 모두 모은다 (v240)
         ① 문제집이 적어 준 출제 연도  ② 같은 문제로 묶인 다른 회차
         ③ 표 안에서 닮은 문항(0.30 이상)이 실린 회차 — 이 표가 곧 26년치 기출이다 */
      const set = new Set(grp);
      let nearY = null;
      try{ nearY = (window.__pracProb && window.__pracProb(r.id) || {}).years; }catch(e){globalThis.__q?.(e)}
      (nearY || []).forEach(y => set.add(y));
      if(!nearY) kinYears(r).forEach(y => set.add(y));       /* 닮은꼴 셈이 아직이면 연관으로 */
      let ys = [...set].sort((a, b) => b - a);

      const SRC = hasA ? 'asked'
                : (nearY && nearY.length > grp.length) ? 'near'
                : ys.length > grp.length ? 'kin' : 'thin';

      /* «이 문제 그대로» 와 «같은 유형» 을 따로 들고 있는다 (v241)
         — 직전 회차 문제가 그대로 또 나오는 일은 드물다. 그래서 확률은 «유형» 으로 센다.
           다만 그 둘이 얼마나 다른지는 눈으로 볼 수 있어야 한다. */
      const selfN = grp.length, selfLast = grp[0] || 0;

      const n5   = ys.filter(y => y >= Y0).length;
      const nAll = ys.length;
      const last = ys[0] || 0;
      const gap  = last ? Math.max(0, NOWY - last) : 99;
      const LAM  = rateOf(ys), CYC = cycleOf(LAM);
      const P    = probOf(LAM), TIER = tierOf(LAM, nAll);

      const o={ p:P, tier:TIER, n5, nAll, last, gap, years:ys, lam:LAM, cyc:CYC,
                selfN, selfLast,
                key:(blob?'':key), type:typeOf(r), exp:P/100, src:SRC,
                ncs:(window.__ncsClassify ? window.__ncsClassify(r) : ncsOf(r)) };
      out.set(String(r.id),o); score.push([P,String(r.id)]);
    });
  });
  return (TAG=out);
}
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)) }
const info=id=>{ const m=ensure(); return m?m.get(String(id))||null:null };
window.__pracTag=info;
window.__pracTagKeyword=ncsOf;                 /* 낱말표만 쓰는 예전 방식 — 되돌림용 */
window.__pracTagReset=()=>{ TAG=null; SIG=''; GYEARS=null; CL=null; NEWR=null; TMALL=null; try{ ensure() }catch(e){globalThis.__q?.(e)} };

/* ══ ④ 문항 머리에 적기 — «가 글자» 왼쪽 ══ */
function stamp(root){
  try{ stamp_(root) }catch(e){ try{ console.warn('문항 뱃지를 붙이지 못했습니다', e) }catch(x){globalThis.__q?.(x)} }
}
function stamp_(root){
  $$('#list > .pcard',root||document).forEach(card=>{
    const head=card.querySelector('.phead'); if(!head) return;
    const t=info(card.dataset.id); if(!t) return;
    const sig=`${t.p}|${t.tier}|${t.n5}|${t.nAll}|${t.type}|${t.ncs?t.ncs.short:''}`;
    if(head.dataset.fqsig===sig) return;
    head.dataset.fqsig=sig;
    head.querySelectorAll('.fqb').forEach(x=>x.remove());
    const cv=head.querySelector('.cvbadge');
    const mk=(cls,txt,title)=>{ const s=document.createElement('span');
      s.className='fqb '+cls; s.textContent=txt; s.title=title; return s };
    const TL={g:'금',s:'은',b:'동',r:'똥'};
    const cycTxt = (t.cyc||0) < 20 ? (t.cyc||0).toFixed(1)+'년꼴' : '20년+';
    const whereFrom = t.src==='near'
        ? `\n(문제집 «출제 연도» 기록이 없어, 표 안에서 같은 유형이 실린 회차로 셌습니다)`
      : t.src==='kin'
        ? `\n(기록이 없어 «한 핏줄» 문항들이 실린 해를 빌렸습니다)`
      : t.src==='thin'
        ? `\n(이 표 안에서 되풀이된 적이 아직 없습니다 — 한 번뿐)`
        : '';
    const selfLine = (t.selfN||0) >= 1
        ? `\n이 문제 그대로: ${t.selfN}번${t.selfLast?` (마지막 ${t.selfLast}년)`:''}`
          + `   ·   같은 유형: ${t.nAll}번`
        : '';
    const histTip = `다음 1년 안에 이 «유형» 이 나올 확률입니다`
        + `\n직전 회차 문제가 그대로 또 나오는 일은 드뭅니다.`
        + `\n그래서 «그 문제» 가 아니라 «값만 바꿔 다시 나오는 것» 까지 세어 «유형» 으로 셉니다.`
        + selfLine
        + `\n\n출제된 해: ${(t.years||[]).join(' · ')||'—'}`
        + `\n최근 ${WIN5}개년 안에 ${t.n5}해 · 통틀어 ${t.nAll}번`
        + `\n마지막 출제 ${t.last||'?'}년 (${t.gap>=99?'아주 오래전':t.gap+'년 전'})`
        + `\n평균 ${(t.cyc||0)<50?(t.cyc||0).toFixed(1)+'년':'수십 년'}마다 한 번 도는 유형`
        + whereFrom
        + `\n\n등급 — 확률 25/15/8% 또는 누적 5/3/2번 중 하나만 넘으면 금/은/동`
        + `\n저울 — 반감기 ${HALF}년(출제기준 개정 주기에 맞춤)`
        + `\n${BACK}년보다 오래된 이력은 «핵심이라는 증거» 로만 조금 셉니다`
        + `\n안 나온 해도 함께 세므로 «확률» 이 됩니다`;
    const frag=[
      mk(t.tier==='g'?'hot':'', '출제확률 '+t.p+'%', histTip),
      mk('yr', `${cycTxt} · 5년 ${t.n5}회 · 누적 ${t.nAll}회`, histTip),
      mk('ty', TYPES.find(x=>x[0]===t.type)?.[1]||t.type, '문제 유형'),
      ...(t.ncs ? [mk('ncs'+(t.ncs.src==='ai'?' ai':''), (t.ncs.src==='ai'?'✓ ':'')+t.ncs.short,
          `출제기준 ${t.ncs.name}${t.ncs.sub?' › '+t.ncs.sub:''}`
          + `\n${window.__ncsWhy?window.__ncsWhy(t.ncs):''}`
          + (t.ncs.why?`\n«${t.ncs.why}»`:'')
          + `\n(${window.NCS_GIJUN?.period||''})`)] : []),
      mk(t.tier, TL[t.tier],
         '등급 — «출제확률» 과 «누적 횟수» 두 축 중 하나만 넘으면 됩니다'
         + '\n금  확률 25% 이상  또는  통틀어 5번 이상'
         + '\n은  확률 15% 이상  또는  통틀어 3번 이상'
         + '\n동  확률  8% 이상  또는  통틀어 2번 이상'
         + '\n똥  한 번 나오고 만 유형'
         + '\n\n확률 축은 «지금 뜨는 것» 을, 횟수 축은 «원래 단골» 을 잡습니다.'
         + `\n이 문항 — 확률 ${t.p}% · 누적 ${t.nAll}번`)
    ];
    frag.forEach(el=>cv?head.insertBefore(el,cv):head.appendChild(el));
  });
}

/* ══ ⑤ 고르기 띠 ══ */
const FKEY='prac:tagfilter:v1';
/* 등급·유형은 «겹쳐 고르기» 다 — 금+동 처럼 여러 개를 함께 켤 수 있다.
   예전에 한 개만 담던 값(tier:'g')도 그대로 읽어 옮긴다. */
const DEF={tiers:[],types:[],ncs:'',sort:''};
let F=(()=>{
  let v={};
  try{ v=JSON.parse(localStorage.getItem(FKEY)||'{}') }catch(e){globalThis.__q?.(e)}
  const out=Object.assign({},DEF,v);
  if(!Array.isArray(out.tiers)) out.tiers = v.tier ? [v.tier] : [];
  if(!Array.isArray(out.types)) out.types = v.type ? [v.type] : [];
  delete out.tier; delete out.type;
  /* ★ v269 — 유형(계산·회로·단답·서술) 단추와 빈출순·기대점수순을 뺐다.
     예전에 켜 둔 값이 남아 있으면 단추도 없이 몰래 거르므로 비운다. */
  out.types=[]; out.sort='';
  return out;
})();
const picked=(a,v)=>Array.isArray(a)&&a.includes(v);
function toggle(list,v){
  const i=list.indexOf(v);
  if(i<0) list.push(v); else list.splice(i,1);
  return list;
}
const fsave=()=>{ try{ localStorage.setItem(FKEY,JSON.stringify(F)) }catch(e){globalThis.__q?.(e)} };

function anyOn(){ return F.tiers.length||F.types.length||F.ncs||F.sort }
/* 랜덤 뽑기처럼 «지금 걸린 조건» 이 필요한 곳에서 쓴다 */
window.__pracRowPass = r => { try{ return rowPass(r) }catch(e){ return true } };
function rowPass(r){
  if(!F.tiers.length&&!F.types.length&&!F.ncs) return true;
  let t=null; try{ t=info(r.id) }catch(e){ return true }
  if(!t) return true;
  if(F.tiers.length&&!F.tiers.includes(t.tier)) return false;
  if(F.types.length&&!F.types.includes(t.type)) return false;
  if(F.ncs&&(t.ncs?.name||'')!==F.ncs) return false;
  return true;
}

/* drawList 를 감싼다 — 목록을 만들기 «직전» 에 ROWS 를 걸러 두고, 만든 뒤 되돌린다.
   목록·랜덤·한 문항씩·진도까지 모두 원래 길을 그대로 타므로 따로 손볼 것이 없다. */
function hook(){
  if(typeof drawList!=='function'||drawList.__tag) return false;
  const orig=drawList;
  const wrapped=function(){
    if(!anyOn()) return orig.apply(this,arguments);
    const all=rowsAll();
    let use;
    try{
      use=all.filter(rowPass);
      if(F.sort==='hot'){
        use=use.slice().sort((a,b)=>{
          const x=info(a.id)?.p??0, y=info(b.id)?.p??0;
          return y-x || (b.year-a.year) || (b.session-a.session);
        });
      }
      /* 기대점수 = 출제확률 × 배점. 배점이 안 적힌 문항은 평균(5.6점)으로 본다 */
      if(F.sort==='pt'){
        const AVG=100/18;
        const val=r=>((info(r.id)?.p??0)/100)*((+r.points)||AVG);
        use=use.slice().sort((a,b)=>{
          const d=val(b)-val(a);
          return d || (b.year-a.year) || (b.session-a.session);
        });
      }
      if(!use.length) use=all;            /* 하나도 안 남으면 거르지 않은 것으로 */
    }catch(e){ use=all }
    try{
      window.__pracSwap=true; ROWS=use;
      return orig.apply(this,arguments);
    }catch(e){
      /* 거르다 무엇이 잘못돼도 «아무것도 안 나오는 화면» 은 만들지 않는다 */
      try{ console.warn('거르기에서 문제가 생겨 전체 목록으로 되돌립니다', e) }catch(x){globalThis.__q?.(x)}
      ROWS=all; return orig.apply(this,arguments);
    }finally{ ROWS=all; window.__pracSwap=false; }
  };
  wrapped.__tag=1;
  window.drawList=wrapped;
  return true;
}

function paintChips(){
  const row=$('#tagRow'); if(!row) return;
  $$('button[data-tier]',row).forEach(b=>b.classList.toggle('on',picked(F.tiers,b.dataset.tier)));
  $$('button[data-type]',row).forEach(b=>b.classList.toggle('on',picked(F.types,b.dataset.type)));
  $$('button[data-sort]',row).forEach(b=>b.classList.toggle('on',b.dataset.sort===F.sort&&!!F.sort));
  const note=$('#tagNote');
  if(note){
    const m=ensure();
    if(!m){ note.textContent = BUILDING ? '문항을 세는 중입니다…' : ''; return }
    const picked=rowsAll().filter(rowPass);
    const n=picked.length;
    const cnt={g:0,s:0,b:0,r:0};
    m.forEach(v=>cnt[v.tier]=(cnt[v.tier]||0)+1);
    let un=0; m.forEach(v=>{ if(!v.ncs) un++ });

    /* ① 등급마다 «유형 수» 를 함께 — 문항 줄 수만 보면 공부량을 못 가늠한다 */
    let tcnt={g:0,s:0,b:0,r:0}, tAll=0;
    try{
      const tm=typeMapAll();
      tAll=tm.size;
      tm.forEach(v=>tcnt[v.tier]=(tcnt[v.tier]||0)+1);
    }catch(e){globalThis.__q?.(e)}
    const cell=(k,nm)=>`${nm} ${cnt[k]}` + (tAll?`(${tcnt[k]}유형)`:'');

    note.textContent=`${cell('g','금')} · ${cell('s','은')} · ${cell('b','동')} · ${cell('r','똥')}`
      + (window.NCS_GIJUN?`   · 출제기준 미분류 ${un}문항`:'')
      + ((F.tiers.length||F.types.length||F.ncs)?`   → 지금 조건 ${n}문항`:'');

    /* ②③ 커버리지 한 줄 — «다 봐야 하나» 에 숫자로 답한다
       ★ v249 — 이 줄을 만드느라 0.4초마다 2000줄을 다시 세고 있었다.
         해마다 붙은 연도를 글자로 이어 붙이는 일까지 2000번씩 — 화면이 끊겼다.
         «거른 조건과 문항 수가 그대로면» 다시 세지 않는다. */
    const note2=$('#tagNote2');
    if(note2){
      const ck = JSON.stringify(F) + '|' + n + '|' + (TMALL?TMALL.size:0) + '|' + (NEWR?NEWR.n:0);
      if(note2.dataset.ck === ck) return;
      note2.dataset.ck = ck;
      let txt='';
      try{
        const cv=coverage(typeMap(picked));
        if(cv){
          txt=`지금 고른 ${cv.types}유형 → 다음 시험 기대 ${cv.q.toFixed(1)}문항 · ${Math.round(cv.pt)}점`
            + `   (전체 ${cv.allTypes}유형)`;
          const nr=newRate();
          if(nr) txt += `   ·   최근 ${nr.exams}회차 신규 ${Math.round(nr.rate*100)}%`
                      + ` → 기출로 덮을 수 있는 몫 ${Math.round((1-nr.rate)*100)}%`;
        }
      }catch(e){globalThis.__q?.(e)}
      note2.textContent=txt;
      note2.title='한 회차 18문항을 100점으로 놓고 셉니다.\n'
        + '모든 유형의 기대값을 더하면 18문항이 되도록 눈금을 맞춰 두었습니다.\n'
        + '신규 %는 최근 회차에서 «그 전에 나온 적 없는» 문항의 몫입니다 — 기출로는 못 덮는 몫입니다.';
    }
  }
}
/* ══════════════════════════════════════════════════════════════
   v242 — «문항 줄 수» 가 아니라 «유형 수» 로, 그리고 커버리지

   여태 «금 98» 은 «금 문항 98줄» 이었다. 같은 유형이 여러 회차에 실려 있으면
   그 줄이 다 금으로 세어졌으므로, 공부량을 가늠할 수가 없었다.
   («금 98» 이 실제로는 41가지일 수 있다)

   그래서 세 가지를 더 센다.
     ① 유형 수  — 중복 묶기 덩어리 + 연관(닮음 0.5 이상)을 이어 붙인 한 덩어리를 1유형으로
     ② 커버리지 — 지금 고른 유형들이 다음 시험에서 몇 문항 · 몇 점을 덮을지
     ③ 신규율   — 최근 회차에서 «이전에 나온 적 없는» 문항이 몇 %인가
                  = 기출로는 어차피 못 덮는 몫. 어디서 끊을지 정하는 근거다.
   ══════════════════════════════════════════════════════════════ */
let CL=null;                                   /* row id → 유형 대표 id */
function clusters(){
  if(CL) return CL;
  /* ★ v247b — 목록을 거를 때 ROWS 가 «걸러진 것» 으로 잠깐 바뀐다(__pracSwap).
     하필 그때 유형을 세면 걸러진 것만 세어 놓고 그대로 굳어 버린다.
     그 순간에는 세지 않고 넘긴다 — 곧 다시 부른다. */
  if(window.__pracSwap) return new Map();
  const rows=rowsAll(); if(!rows.length) return new Map();
  CL=new Map();
  const par=new Map();
  const find=x=>{ let r=x; while(par.get(r)!==r) r=par.get(r); while(par.get(x)!==r){ const n=par.get(x); par.set(x,r); x=n; } return r };
  const uni=(a,b)=>{ if(!par.has(a)||!par.has(b)) return; const ra=find(a), rb=find(b); if(ra!==rb) par.set(rb,ra); };
  rows.forEach(r=>par.set(String(r.id),String(r.id)));
  /* 같은 문제(중복 묶기) */
  try{
    const d=window.__pracDup && window.__pracDup();
    if(d&&d.groups) d.groups.forEach(list=>{
      const ids=(list||[]).map(x=>String(x.id)).filter(x=>par.has(x));
      for(let i=1;i<ids.length;i++) uni(ids[0],ids[i]);
    });
  }catch(e){globalThis.__q?.(e)}
  /* 문제집이 같은 «출제 연도» 목록을 적어 준 것끼리 (v245)
     — 책이 «같은 문제» 라고 표시해 준 것이므로 가장 믿을 만하다. 사슬로 번질 일도 없다 */
  try{
    const byA=new Map();
    rows.forEach(r=>{
      const a=String(r.asked||'').replace(/\s+/g,'');
      if(a.length<4) return;                       /* 한 해만 적힌 것은 근거가 못 된다 */
      (byA.get(a)||byA.set(a,[]).get(a)).push(String(r.id));
    });
    byA.forEach(ids=>{ for(let i=1;i<ids.length;i++) uni(ids[0],ids[i]); });
  }catch(e){globalThis.__q?.(e)}
  /* 한 핏줄(연관) — 0.5 이상만. 느슨하게 이으면 사슬로 번져 한 덩어리가 된다 */
  try{
    if(window.__pracRel) rows.forEach(r=>{
      const id=String(r.id);
      (window.__pracRel(id)||[]).forEach(x=>{ if(x&&x.sim>=0.5) uni(id,String(x.id)); });
    });
  }catch(e){globalThis.__q?.(e)}
  rows.forEach(r=>CL.set(String(r.id), find(String(r.id))));
  return CL;
}

/* 한 유형의 대표값 — 그 덩어리에서 확률이 가장 높은 문항을 대표로 삼는다 */
function typeMap(list){
  const cl=clusters(), m=ensure();
  const out=new Map();                          /* 대표 id → {p, tier, pt} */
  if(!m) return out;
  /* ★ v246 — «나온 해 목록이 똑같은 것» 끼리 한 유형으로 본다.
     글자 닮음으로 못 묶은 조각도 이력이 같으면 같은 문제다. 사슬로 번질 일도 없다.
     («2034문항 → 1665유형» 처럼 유형이 잘게 쪼개지던 것을 여기서 줄인다) */
  const sigMap=new Map();
  (list||[]).forEach(r=>{
    let key=cl.get(String(r.id))||String(r.id);
    const t=m.get(String(r.id)); if(!t) return;
    const ys=t.years;
    if(ys&&ys.length>=2){
      const sig=ys.join(',');
      if(sigMap.has(sig)) key=sigMap.get(sig); else sigMap.set(sig,key);
    }
    const cur=out.get(key);
    if(!cur || t.p>cur.p) out.set(key,{ p:t.p, tier:t.tier, pt:(+r.points||0) });
    else if(!cur.pt && +r.points) cur.pt=+r.points;
  });
  return out;
}

let TMALL=null;
function typeMapAll(){
  if(TMALL) return TMALL;
  if(window.__pracSwap) return new Map();       /* 거르는 중에는 굳히지 않는다 */
  return (TMALL = typeMap(rowsAll()));
}

/* 커버리지 — 한 회차(18문항) 기준.
   한 해 확률 p 를 한 회차 확률로 내린다: 1−(1−p)^(1/3)
   그리고 모든 유형을 더한 값이 실제 출제 문항 수가 되도록 눈금을 맞춘다.
   («전체 합 = 한 회차 문항 수» 라는 것은 셈이 아니라 사실이므로 기댈 수 있다) */
const PER_EXAM = 18;
function coverage(sel){
  const all=typeMapAll();
  if(!all.size) return null;
  const per=p=>1-Math.pow(1-Math.min(0.97,p/100),1/3);
  let tot=0; all.forEach(v=>tot+=per(v.p));
  const k = tot>0 ? PER_EXAM/tot : 1;            /* 눈금 맞춤 */
  const pts=[...all.values()].map(v=>v.pt).filter(x=>x>0);
  const avgPt = pts.length ? pts.reduce((a,b)=>a+b,0)/pts.length : 100/PER_EXAM;
  let q=0, pt=0;
  sel.forEach(v=>{ const e=per(v.p)*k; q+=e; pt+=e*(v.pt||avgPt); });
  return { types:sel.size, q, pt, allTypes:all.size };
}

/* 신규율 — 최근 회차에서 «그 전에 나온 적 없는» 문항의 몫
   ★ v247b — 예전에는 «나온 해» 로만 견주었다. 그런데 출제 이력은 연 단위라,
     26년 1회에 나온 것이 26년 2회에 또 나와도 «같은 해» 라서 앞선 것으로 안 쳤다.
     실기는 한 해에 세 번 보므로 이 구멍이 컸다 — 신규율이 통째로 부풀었다.
     이제는 «같은 유형 덩어리 안에 나보다 앞선 회차가 있는가» 로 회차 단위로 본다. */
let NEWR=null;
function newRate(){
  if(NEWR!=null) return NEWR;
  const rows=rowsAll();
  if(!rows.length || window.__pracSwap) return null;
  const ord=r=>(+r.year)*10+(+r.session||0);
  const keyOf=r=>`${r.year}-${r.session}`;
  const ex=[...new Set(rows.map(keyOf))].sort((a,b)=>{
    const [ay,as]=a.split('-').map(Number), [by,bs]=b.split('-').map(Number);
    return (by-ay)||(bs-as);
  }).slice(0,5);
  if(!ex.length) return null;

  /* 유형 덩어리마다 «가장 이른 회차» 를 미리 구해 둔다 */
  const cl=clusters(), first=new Map();
  rows.forEach(r=>{
    const k=cl.get(String(r.id))||String(r.id), o=ord(r);
    if(!first.has(k)||o<first.get(k)) first.set(k,o);
  });
  const m=ensure();
  let n=0, fresh=0;
  rows.forEach(r=>{
    if(!ex.includes(keyOf(r))) return;
    n++;
    const k=cl.get(String(r.id))||String(r.id);
    let earlier = first.get(k) < ord(r);               /* 덩어리 안에 앞선 회차가 있나 */
    if(!earlier){                                      /* 표에 없는 옛 출제는 이력으로 본다 */
      const t=m&&m.get(String(r.id));
      earlier = !!(t && (t.years||[]).some(y=>y<+r.year));
    }
    if(!earlier) fresh++;
  });
  return (NEWR = n ? { n, fresh, rate:fresh/n, exams:ex.length } : null);
}

function mount(){
  const find=$('.deck .dcol-find'); if(!find||$('#tagRow')) return false;
  const box=document.createElement('div');
  box.innerHTML=`<div class="tagrow" id="tagRow">
      <span class="tl">등급</span><span class="tl2">겹쳐 고를 수 있습니다</span>
      <button type="button" class="g" data-tier="g" title="또 나올 확률이 가장 높은 무리">금</button>
      <button type="button" class="s" data-tier="s">은</button>
      <button type="button" class="b" data-tier="b">동</button>
      <button type="button" class="r" data-tier="r" title="어느 무리에도 안 든 나머지 문항">똥</button>
      <span class="sep"></span><span class="tl">출제기준</span>
      <select id="tagNcs" title="한국산업인력공단 출제기준(2024.1.1.~2026.12.31.) 주요항목"><option value="">전체 항목</option></select>
      <span class="sep"></span>
      <button type="button" data-clear>초기화</button>
    </div>
    <div class="tagnote" id="tagNote"></div>
    <div class="tagnote" id="tagNote2"></div>`;
  find.appendChild(box);

  /* 출제기준 주요항목 채우기 */
  const sel=$('#tagNcs',box);
  if(sel&&window.NCS_GIJUN){
    window.NCS_GIJUN.silgi.majors.forEach(M=>{
      const o=document.createElement('option');
      o.value=M.name; o.textContent=M.name; sel.appendChild(o);
    });
    sel.value=F.ncs||'';
    sel.addEventListener('change',()=>{
      F.ncs=sel.value; fsave(); paintChips();
      try{ RAND=null }catch(x){globalThis.__q?.(x)}
      try{ drawList() }catch(x){globalThis.__q?.(x)}
    });
  }

  box.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.hasAttribute('data-clear')){ F={tiers:[],types:[],ncs:'',sort:''}; if(sel) sel.value=''; }
    else if(b.dataset.tier!=null) toggle(F.tiers,b.dataset.tier);
    else if(b.dataset.type!=null) toggle(F.types,b.dataset.type);
    else if(b.dataset.sort!=null) F.sort = F.sort===b.dataset.sort?'':b.dataset.sort;
    fsave(); paintChips();
    /* 랜덤을 뽑아 둔 채로 조건을 바꾸면, 그 조건 안에서 다시 뽑아 준다 —
       예전에는 조용히 풀려서 «갑자기 전체가 나오는» 것처럼 보였다. */
    let had=false; try{ had=!!RAND }catch(x){globalThis.__q?.(x)}
    try{ RAND=null }catch(x){globalThis.__q?.(x)}
    if(had){ try{ return document.getElementById('fRand')?.click() }catch(x){globalThis.__q?.(x)} }
    try{ drawList() }catch(x){globalThis.__q?.(x)}
  });
  paintChips();
  return true;
}

/* ★ v322 — 랜덤 줄의 등급 단추가 «같은 설정» 을 쓰게 여는 창구 (두 곳이 따로 놀지 않게)
   list: ['g','s'] 처럼 · 빈 배열 = 전체 */
window.__pracTiers=()=>F.tiers.slice();
window.__pracTierSet=list=>{
  F.tiers=(Array.isArray(list)?list:[]).filter(t=>['g','s','b','r'].includes(t));
  if(F.tiers.length===4) F.tiers=[];                 /* 넷 다 = 전체 */
  fsave(); paintChips();
  let had=false; try{ had=!!RAND }catch(x){globalThis.__q?.(x)}
  try{ RAND=null }catch(x){globalThis.__q?.(x)}
  if(had){ try{ return document.getElementById('fRand')?.click() }catch(x){globalThis.__q?.(x)} }
  try{ drawList() }catch(x){globalThis.__q?.(x)}
};

/* ══ ⑥ 붙이기 ══ */
let done=false;
const boot=setInterval(()=>{
  hook();
  if(mount()) done=true;
  if(done&&rowsAll().length){ ensure(); paintChips(); stamp(); }
},400);
setTimeout(()=>clearInterval(boot),30000);

const wait=setInterval(()=>{
  const list=$('#list'); if(!list) return;
  clearInterval(wait);
  new MutationObserver(()=>setTimeout(()=>{ stamp(); paintChips(); },60))
    .observe(list,{childList:true});
  stamp();
},250);
setTimeout(()=>clearInterval(wait),20000);
})();
