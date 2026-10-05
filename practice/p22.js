/* practice.html 에서 분리 (v341) — 원래 12455번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const G=()=>window.NCS_GIJUN;

/* ══ ① 글을 셈할 수 있는 꼴로 ══
   낱말(2글자 이상)과 «글자 두 짝» 을 함께 쓴다.
   한국어는 어미·조사가 붙어 낱말이 자꾸 어긋나는데, 글자 두 짝은 그것을 넘어간다.
   («수용률을», «수용률은» → 둘 다 «수용/용률» 을 가진다) */
const CLEAN=t=>String(t||'')
  .replace(/\$[^$]*\$/g,' ')                 /* 수식은 뺀다 — 기호가 죄다 같아 섞인다 */
  .replace(/\[\[[^\]]*\]\]/g,' ')
  .replace(/https?:\/\/\S+/g,' ')
  .replace(/[^가-힣A-Za-z0-9]+/g,' ')
  .replace(/\s+/g,' ').trim();
function bag(t,cap){
  const s=CLEAN(t).slice(0,cap||900);
  const m=new Map();
  const add=(k,w)=>m.set(k,(m.get(k)||0)+w);
  (s.match(/[가-힣]{2,}|[A-Za-z]{2,}|\d{2,}/g)||[]).forEach(w=>{
    add(w,1.0);
    if(w.length>3) add(w.slice(0,2),0.3);
  });
  const h=s.replace(/ /g,'');
  for(let i=0;i<h.length-1;i++){
    const g=h.slice(i,i+2);
    if(/[가-힣]{2}/.test(g)) add('#'+g,0.55);
  }
  return m;
}

/* ══ ② 출제기준 쪽 벡터 ══ */
let DOCS=null, IDF=null;
function docs(){
  if(DOCS) return DOCS;
  const g=G(); if(!g) return null;
  DOCS=[];
  g.silgi.majors.forEach(M=>{
    (M.subs||[]).forEach(S=>{
      /* 항목 이름은 여러 번 적어 무게를 준다 — 이름이 곧 그 항목의 알맹이다 */
      const txt=[S.name,S.name,S.name,(S.keys||[]).join(' '),(S.keys||[]).join(' '),
                 S.text||'',M.name,M.name,(M.keys||[]).join(' ')].join(' ');
      DOCS.push({ major:M, sub:S.name, b:bag(txt,2000) });
    });
  });
  return DOCS;
}
/* 흔한 말은 값을 낮춘다 — «검토할 수 있다» 같은 말이 점수를 다 먹지 않게 */
function idf(){
  if(IDF) return IDF;
  const D=docs()||[], R=rowsAll();
  const df=new Map(); let N=0;
  const seen=b=>{ N++; new Set(b.keys()).forEach(k=>df.set(k,(df.get(k)||0)+1)) };
  D.forEach(d=>seen(d.b));
  R.slice(0,900).forEach(r=>seen(bag((r.q_md||r.q_text||''),700)));
  IDF=new Map();
  df.forEach((n,k)=>IDF.set(k, Math.log((N+1)/(n+0.5))));
  return IDF;
}
function vec(b){
  const I=idf(), v=new Map(); let n=0;
  b.forEach((tf,k)=>{
    const w=(1+Math.log(tf))*(I.get(k)||Math.log(30));
    if(w>0){ v.set(k,w); n+=w*w; }
  });
  n=Math.sqrt(n)||1;
  v.forEach((w,k)=>v.set(k,w/n));
  return v;
}
const cos=(a,b)=>{ let s=0; const [x,y]=a.size<b.size?[a,b]:[b,a];
  x.forEach((w,k)=>{ const u=y.get(k); if(u) s+=w*u }); return s };

/* ══ ③ AI 가 붙여 둔 표 ══ */
const AKEY='prac:ncsai:v1';
let AI=(()=>{ try{ return JSON.parse(localStorage.getItem(AKEY)||'{}') }catch(e){ return {} } })();
const asave=()=>{ try{ localStorage.setItem(AKEY,JSON.stringify(AI)) }catch(e){globalThis.__q?.(e)} };
window.__ncsAI=()=>AI;

/* ══ ④ 세 겹 판정 ══
   ★ 여기가 «한눈에를 누르면 화면이 뻗던» 자리였다.
     1200문항의 벡터를 «한 번에» 세느라 브라우저가 몇 초씩 멈췄고,
     하필 그 사이에 누른 단추는 먹지 않았다(멈춘 것이지 죽은 것이 아니다).
     그래서 셈을 잘게 쪼개 «틈날 때마다» 조금씩 돌린다.
       · 한 조각은 12ms 를 넘기지 않는다 — 손가락이 늘 먼저다.
       · 아직 다 못 셌으면 그냥 «없음» 으로 답한다. 화면은 먼저 뜬다.
       · 다 세고 나면 그때 뱃지를 붙인다.
     자료가 들어오는 중(문항 수가 계속 바뀔 때)에는 아예 세지 않는다. */
let NC=new Map(), NSIG='', NBUSY=false, NREADY=false;
const PROB=new Map();                     /* 문항 → {p, R, C, NE} 재출제 확률 */
window.__pracProb = id => { try{ return PROB.get(String(id))||null }catch(e){ return null } };
const idle = fn => (window.requestIdleCallback
  ? requestIdleCallback(()=>fn(), { timeout:220 })
  : setTimeout(fn, 0));
const sigNow = () => rowsAll().length + '|' + Object.keys(AI).length;

function startClassify(){
  if(NBUSY) return;
  const R=rowsAll(); if(!R.length) return;
  const D=docs(); if(!D) return;
  if(window.__pracSwap) return;                 /* 목록을 거르는 중에는 손대지 않는다 */
  NBUSY=true; NSIG=sigNow(); PROB.clear();

  const dv=D.map(d=>({d,v:vec(d.b)}));
  const out=new Map(), firm=[], vecs=new Map();
  let i=0;

  /* ── 1단계: 문항마다 출제기준과 닮은 정도 ── */
  function pass1(){
    try{
      const t0=performance.now();
      while(i<R.length && performance.now()-t0<12){
        const r=R[i++];
        const raw=(r.q_md||r.q_text||'');
        if(!CLEAN(raw)) continue;
        const v=vec(bag(raw,900));
        vecs.set(String(r.id),v);
        let k=null; try{ k=window.__pracTagKeyword&&window.__pracTagKeyword(r) }catch(e){globalThis.__q?.(e)}
        let b1=null,b2=0;
        for(const {d,v:w} of dv){
          let s=cos(v,w);
          if(k&&d.major.name===k.name) s += 0.05 + Math.min(k.sc,15)*0.004;
          if(!b1||s>b1.s){ b2=b1?b1.s:0; b1={s,d} } else if(s>b2) b2=s;
        }
        if(!b1) continue;
        const margin=b1.s>0?(b1.s-b2)/b1.s:0;
        const o={ name:b1.d.major.name, short:b1.d.major.short, sub:b1.d.sub,
                  src:'sim', conf:+b1.s.toFixed(3), margin:+margin.toFixed(2) };
        if(b1.s>=0.085) out.set(String(r.id),o);
        if(b1.s>=0.13&&margin>=0.10) firm.push({id:String(r.id),v,o});
      }
      if(i<R.length) return idle(pass1);
      i=0; return idle(pass2prep);
    }catch(e){ return fail(e) }
  }

  /* ── 2단계: 흐릿한 것은 «비슷한 문항» 에게 물어본다 ── */
  let inv=null, todo=null;
  function pass2prep(){
    try{
      inv=new Map();
      firm.forEach((f,n)=>{
        [...f.v.entries()].sort((a,b)=>b[1]-a[1]).slice(0,14)
          .forEach(([k])=>{ (inv.get(k)||inv.set(k,[]).get(k)).push(n) });
      });
      todo=[...vecs.keys()].filter(id=>{
        const cur=out.get(id);
        return !cur || cur.conf<0.13 || cur.margin<0.10;
      });
      return idle(pass2);
    }catch(e){ return fail(e) }
  }
  function pass2(){
    try{
      const t0=performance.now();
      while(i<todo.length && performance.now()-t0<12){
        const id=todo[i++], v=vecs.get(id);
        const cand=new Map();
        [...v.entries()].sort((a,b)=>b[1]-a[1]).slice(0,14).forEach(([k])=>{
          (inv.get(k)||[]).forEach(n=>{ if(firm[n].id!==id) cand.set(n,1) });
        });
        if(!cand.size) continue;
        const near=[...cand.keys()].map(n=>({n,s:cos(v,firm[n].v)}))
          .sort((a,b)=>b.s-a.s).slice(0,5).filter(x=>x.s>=0.18);
        if(near.length<2) continue;
        const vote=new Map();
        near.forEach(x=>{ const o=firm[x.n].o; const k=o.name+'|'+o.sub;
          vote.set(k,(vote.get(k)||0)+x.s) });
        const top=[...vote.entries()].sort((a,b)=>b[1]-a[1])[0];
        if(!top) continue;
        const tot=[...vote.values()].reduce((t,x)=>t+x,0)||1;
        if(top[1]/tot<0.5) continue;
        const [nm,sb]=top[0].split('|');
        const M=G().silgi.majors.find(m=>m.name===nm);
        out.set(id,{ name:nm, short:M?M.short:nm, sub:sb, src:'knn',
                     conf:+(top[1]/tot).toFixed(2), near:near.length });
      }
      if(i<todo.length) return idle(pass2);
      i=0; return idle(pass3prep);
    }catch(e){ return fail(e) }
  }

  /* ── 3단계: 재출제 확률 ──
     ★ 예전 방식이 틀렸던 곳.
       «드문 낱말을 함께 쓰면 같은 주제» 로 묶어 나갔는데, 이 묶기는 사슬로 번진다.
       ㄱ~ㄴ 이 낱말 하나로 붙고, ㄴ~ㄷ 이 다른 낱말로 붙으면 ㄱ~ㄷ 도 한 덩어리가 된다.
       덩어리가 커질수록 «걸친 회차» 는 저절로 늘어나고, 결국 확률이 아니라
       «덩어리가 얼마나 크냐» 를 재는 꼴이 됐다. 98% 가 그렇게 나온 숫자다.

     이제는 사슬을 타지 않는다. 그 문항과 «직접» 닮은 문항만 본다(코사인 0.30 이상).
     그리고 세 가지를 더 지킨다.
       · 최근 회차에 더 무게를 준다(오래된 것은 0.88배씩 깎는다).
       · 표본이 적을 때 100% 로 튀지 않게 평활(Laplace)을 넣는다.
       · 위로는 85%, 아래로는 3% 에서 멈춘다 — 어떤 주제도 «반드시 나온다» 는 없다. */
  let AINV=null, EXW=null, TOTW=0, EXAGE=null;
  function pass3prep(){
    try{
      AINV=new Map();
      vecs.forEach((v,id)=>{
        [...v.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12)
          .forEach(([k])=>{ (AINV.get(k)||AINV.set(k,[]).get(k)).push(id) });
      });
      const keyOf=r=>`${r.year}-${r.session}`;
      const ex=[...new Set(R.map(keyOf))].sort((a,b)=>{
        const [ay,as]=a.split('-').map(Number), [by,bs]=b.split('-').map(Number);
        return (by-ay)||(bs-as);
      });
      EXAGE=new Map(); EXW=new Map(); TOTW=0;
      ex.forEach((k,n)=>{ const w=Math.pow(0.88,n); EXAGE.set(k,n); EXW.set(k,w); TOTW+=w; });
      ROWEX=new Map(); R.forEach(r=>ROWEX.set(String(r.id),keyOf(r)));
      return idle(pass3);
    }catch(e){ return fail(e) }
  }
  let ROWEX=null;
  function pass3(){
    try{
      const ids=[...vecs.keys()];
      const t0=performance.now();
      while(i<ids.length && performance.now()-t0<12){
        const id=ids[i++], v=vecs.get(id);
        const cand=new Map();
        [...v.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([k])=>{
          const list=AINV.get(k); if(!list||list.length>260) return;   /* 너무 퍼진 말은 건너뛴다 */
          list.forEach(x=>{ if(x!==id) cand.set(x,1) });
        });
        const hit=new Set([ROWEX.get(id)]);
        let C=1;
        cand.forEach((_,x)=>{
          if(cos(v,vecs.get(x))>=0.30){ C++; hit.add(ROWEX.get(x)); }
        });
        let hw=0; hit.forEach(k=>{ hw += EXW.get(k)||0 });
        /* 평활 — 몇 안 되는 표본이 곧장 100% 가 되지 않게 */
        const p=Math.max(3,Math.min(85,Math.round((hw+0.30)/(TOTW+2.30)*100)));
        /* ★ v240 — «어느 해에 나왔는가» 를 그대로 넘긴다.
           문제집의 «출제 연도» 는 이 표에서 100문항 남짓에만 붙어 있다.
           나머지 1900문항은 그 기록이 아예 없어서, 등급이 사실상
           «이 줄이 몇 년도 회차냐» 만 재고 있었다 — 출제확률이 아니었다.
           그런데 표 자체가 26년치 기출이다. 같은 유형이 어느 해에 나왔는지는
           여기(닮은 문항 0.30 이상)에서 이미 세고 있었다. 그 해 목록을 넘긴다. */
        const yrs=new Set(); hit.forEach(k=>{ const y=+String(k).split('-')[0]; if(y>1900) yrs.add(y) });
        PROB.set(id,{ p, R:hit.size, C, NE:EXW.size, years:[...yrs].sort((a,b)=>b-a) });
      }
      if(i<ids.length) return idle(pass3);
      return idle(done);
    }catch(e){ return fail(e) }
  }

  /* ── 4단계: AI 가 붙인 것이 있으면 그것이 이긴다 ── */
  function done(){
    try{
      Object.entries(AI).forEach(([id,a])=>{
        if(!a||!a.name) return;
        const M=G().silgi.majors.find(m=>m.name===a.name);
        if(!M) return;
        out.set(String(id),{ name:a.name, short:M.short, sub:a.sub||'',
                             src:'ai', conf:1, why:a.why||'' });
      });
      NC=out; NREADY=true; NBUSY=false;
      /* 다 셌으니 이제 뱃지를 붙인다 — 다만 «한눈에» 를 보고 있는 중이면
         그 판이 닫힌 뒤로 미룬다. 보고 있는 화면을 밑에서 다시 그리면
         그 위에 얹힌 것들(주석·필기·그림 오리기)이 한꺼번에 다시 돌아 멎는다. */
      try{ window.__pracTagReset&&window.__pracTagReset(); }catch(e){globalThis.__q?.(e)}
      try{ (window.__pracRedraw||drawList)(); }catch(e){globalThis.__q?.(e)}
    }catch(e){ fail(e) }
  }
  function fail(e){
    NBUSY=false; NREADY=true;                    /* 실패해도 화면은 살아 있어야 한다 */
    try{ console.warn('출제기준 분류를 마치지 못했습니다', e) }catch(x){globalThis.__q?.(x)}
  }
  idle(pass1);
}

/* 아직 다 못 셌으면 «없음» 으로 답한다 — 절대 기다리게 하지 않는다 */
window.__ncsClassify = r => { try{ return NC.get(String(r.id))||null }catch(e){ return null } };
window.__ncsReady = () => NREADY;

/* 자료가 잠잠해지면(3초) 그때 한 번 센다 — 들어오는 중에는 세지 않는다 */
let lastN=-1, calm=0;
setInterval(()=>{
  try{
    const n=rowsAll().length;
    if(n!==lastN){ lastN=n; calm=0; return; }
    if(!n) return;
    calm++;
    if(calm===3 && NSIG!==sigNow()) startClassify();
  }catch(e){globalThis.__q?.(e)}
},1000);

/* ══ ⑤ AI 한꺼번에 분류 ══ */
function listForPrompt(){
  return G().silgi.majors.map((M,i)=>
    `${i+1}. ${M.name}\n   ` + (M.subs||[]).map(S=>S.name).join(' / ')).join('\n');
}
function promptFor(r){
  const q=(r.q_md||r.q_text||'').slice(0,1100);
  return `너는 한국산업인력공단 «전기기사» 출제기준(${G().period})으로 기출 문항을 분류하는 사람이다.

[실기 과목: ${G().silgi.subject}]
${listForPrompt()}

[분류할 문항]
${q}

[할 일]
위 목록에서 이 문항이 «가장 맞는» 주요항목 하나와 세부항목 하나를 고른다.
목록에 없는 이름을 지어내지 마라. 정말 어느 것에도 안 맞으면 major 를 빈 문자열로 둔다.
유형은 계산 · 회로 · 단답 · 서술 중 하나다.

아래 JSON «만» 출력한다. 앞뒤에 말이나 코드펜스를 붙이지 마라.
{"major":"주요항목 이름","sub":"세부항목 이름","type":"계산|회로|단답|서술","why":"고른 까닭 한 줄"}`;
}
function parseJSON(t){
  const s=String(t||'').replace(/```[a-z]*/gi,'').trim();
  const i=s.indexOf('{'), j=s.lastIndexOf('}');
  if(i<0||j<i) return null;
  try{ return JSON.parse(s.slice(i,j+1)) }catch(e){ return null }
}
async function aiOne(r){
  const md=await askAI(promptFor(r), null, 400);
  const j=parseJSON(md); if(!j) throw new Error('판정을 읽지 못했습니다');
  const M=G().silgi.majors.find(m=>m.name===(j.major||'').trim());
  if(!M){ AI[String(r.id)]={ name:'', sub:'', why:'해당 없음' }; return false; }
  const sub=(M.subs||[]).find(S=>S.name===(j.sub||'').trim());
  AI[String(r.id)]={ name:M.name, sub:sub?sub.name:'', type:j.type||'', why:(j.why||'').slice(0,90) };
  return true;
}
async function aiRun(scope){
  let busy=false; try{ busy=CVBUSY||EZBUSY }catch(e){globalThis.__q?.(e)}
  if(busy) return alert('지금 다른 작업이 돌고 있습니다.');
  const yr=$('#fYear')?.value||'', ss=$('#fSess')?.value||'';
  let pool=rowsAll().filter(r=>r.q_md||r.q_text);
  if(scope==='sess') pool=pool.filter(r=>(!yr||String(r.year)===String(yr))&&(!ss||String(r.session)===String(ss)));
  if(scope!=='again') pool=pool.filter(r=>!AI[String(r.id)]);
  if(!pool.length) return alert('AI 로 분류할 문항이 없습니다 (이미 다 돼 있습니다).');
  if(!confirm(`${pool.length}개를 AI 가 출제기준 항목에 붙입니다.\n`
    +`한 개에 3~6초쯤 걸리므로 대략 ${Math.ceil(pool.length*4.5/60)}분입니다.\n`
    +`«중지» 를 눌러도 거기까지는 남습니다. 계속할까요?`)) return;

  try{ CVSTOP=false }catch(e){globalThis.__q?.(e)}
  const stop=$('#cvStop'), prog=$('#cvProg'), bar=$('#cvBar');
  if(stop) stop.hidden=false; if(prog) prog.hidden=false;
  ['#ncsAiRun','#ncsAiSess'].forEach(x=>{ const b=$(x); if(b) b.disabled=true });
  let ok=0,bad=0,n=0;
  for(const r of pool){
    let s=false; try{ s=CVSTOP }catch(e){globalThis.__q?.(e)}
    if(s) break;
    n++;
    try{ cvSay(`AI 분류 ${n}/${pool.length} — ${r.year}년 제${r.session}회 ${r.no}번 · 됨 ${ok}`+(bad?` · 실패 ${bad}`:'')) }catch(e){globalThis.__q?.(e)}
    if(bar) bar.style.width=(n/pool.length*100)+'%';
    try{ (await aiOne(r)) ? ok++ : ok++; }catch(e){ bad++; }
    if(n%10===0){ asave(); refresh(); }
    await new Promise(x=>setTimeout(x,250));
  }
  asave(); refresh();
  if(stop) stop.hidden=true; if(prog) prog.hidden=true;
  ['#ncsAiRun','#ncsAiSess'].forEach(x=>{ const b=$(x); if(b) b.disabled=false });
  try{ cvSay(`AI 분류 ${ok}개 완료`+(bad?` · ${bad}개 실패`:'')) }catch(e){globalThis.__q?.(e)}
}
function refresh(){
  NSIG='';                       /* 다시 세게 만든다 (다음 조용한 틈에 잘게 돈다) */
  try{ window.__pracTagReset&&window.__pracTagReset() }catch(e){globalThis.__q?.(e)}
  try{ drawList() }catch(e){globalThis.__q?.(e)}
}

/* 도구 탭에 단추를 끼운다 — «다시 해석» 옆 */
function mountBtns(){
  const host=$('#ezRedoAll')?.parentElement; if(!host||$('#ncsAiRun')) return;
  const mk=(id,txt,title)=>{ const b=document.createElement('button');
    b.className='chip'; b.type='button'; b.id=id; b.textContent=txt; b.title=title; return b };
  const a=mk('ncsAiSess','🏷 이 회차 AI 분류','지금 고른 회차를 AI 가 출제기준 항목에 붙입니다');
  const b=mk('ncsAiRun','🏷 전체 AI 분류','아직 안 붙은 문항을 AI 가 출제기준 항목에 붙입니다');
  const c=mk('ncsAiClear','↺ AI 분류 지우기','AI 가 붙인 표를 지우고 닮은 정도로 되돌립니다');
  host.append(a,b,c);
  a.onclick=()=>aiRun('sess');
  b.onclick=()=>aiRun('all');
  c.onclick=()=>{ if(!confirm('AI 가 붙인 분류를 모두 지웁니다.')) return; AI={}; asave(); refresh(); };
}
/* 도구 단추는 한 번만 붙이면 된다 — 붙고 나면 시계를 끈다 */
const mbT=setInterval(()=>{ mountBtns(); if(document.getElementById('ncsAiRun')) clearInterval(mbT); },900);
mountBtns();
setTimeout(()=>clearInterval(mbT),30000);

/* 출제기준 쪽 벡터는 자료가 바뀌어도 그대로다 — 다시 만들지 않는다 */
})();
