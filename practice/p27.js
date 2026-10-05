/* practice.html 에서 분리 (v341) — 원래 13562번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);

const LAYERS=[
  { k:'rail',    n:'문항 레일',        d:'판 위쪽에 문항 번호 줄' },
  { k:'dock',    n:'왼쪽 도크',        d:'음악 · 바탕(모눈·줄눈) · 쉬운 풀이 다시 해석' },
  { k:'swipe',   n:'옆으로 넘기기',     d:'손가락으로 밀어 이전·다음 문항' },
  { k:'back',    n:'뒤로가기로 닫기',   d:'브라우저 뒤로가기가 판을 닫는다' },
  { k:'ann',     n:'형광펜 · 주석',     d:'판 안에서도 칠하고 주석 달기 (가장 무거운 겹)' },
  { k:'squeeze', n:'그림 여백 자르기',  d:'그림 둘레와 속의 빈 띠를 좁힌다 (픽셀을 훑는다)' },
  { k:'fig',     n:'그림 오려 채우기',  d:'[[그림]] 자리를 원본에서 오려 넣는다' },
  { k:'ai',      n:'AI 풀이 띠',        d:'고른 자리를 AI 가 풀어 준다' }
];

/* ── 재는 자 ─────────────────────────────────────────────
   ① 여는 데 걸린 시간 ② 1.5초 동안 다시 그린 횟수 ③ 그 사이 오류 */
let errs=0;
addEventListener('error',()=>{errs++});
addEventListener('unhandledrejection',()=>{errs++});

function sampleId(){
  try{
    const cur=(typeof OVID!=='undefined'&&OVID)?OVID:null;
    if(cur) return cur;
    const rows=Array.isArray(window.SHOWN)&&window.SHOWN.length?window.SHOWN:(Array.isArray(ROWS)?ROWS:[]);
    /* 무거운 문항으로 재는 편이 낫다 — 글이 길고 그림이 있는 것 */
    const pick=rows.slice(0,80).sort((a,b)=>
      ((b.q_md||'').length+(b.a_md||'').length)-((a.q_md||'').length+(a.a_md||'').length))[0];
    return pick?pick.id:null;
  }catch(e){ return null }
}

const PROBE='prac:ovprobe:v1';
function probeOn(k){ try{ localStorage.setItem(PROBE,JSON.stringify({k,at:Date.now()})) }catch(e){globalThis.__q?.(e)} }
function probeOff(){ try{ localStorage.removeItem(PROBE) }catch(e){globalThis.__q?.(e)} }

function check(k){
  return new Promise(res=>{
    const id=sampleId();
    if(!id) return res({ok:false,why:'잴 문항이 없습니다'});
    /* ★ 화면이 통째로 멎으면 아무것도 잴 수 없다(재는 코드도 같이 멎으니까).
       그래서 «지금 이 겹을 켜고 여는 중» 이라고 먼저 적어 둔다.
       멎어서 새로고침하면, 다음에 뜰 때 이 발자국을 보고 그 겹을 꺼 준다. */
    if(k) probeOn(k);
    try{ window.__moStorm=[] }catch(e){globalThis.__q?.(e)}
    const e0=errs;

    /* ★ 무엇을 세는가 — 여기가 지난번에 틀렸던 곳.
       예전에는 «#ovl 안이 몇 번 바뀌었나» 를 셌다. 그런데 수식 한 줄만 그려도
       태그가 수십 개 끼어들어 그 수가 20~40 이 된다. 겹과 아무 상관이 없다.
       진짜 되풀이는 «판을 다시 그리는 함수가 몇 번 불렸나» 다. 그것을 센다.
       덧붙여, 처음 그리는 450ms 는 빼고 «잠잠해진 뒤» 에만 바뀜을 센다. */
    let drawN=0, listN=0, settle=0;
    const d0=window.ovDraw, l0=window.drawList;
    if(typeof d0==='function'){ const g=function(){ drawN++; return d0.apply(this,arguments) }; g.__probe=1; window.ovDraw=g; }
    if(typeof l0==='function'){ const g=function(){ listN++; return l0.apply(this,arguments) }; g.__probe=1; g.__tag=l0.__tag; g.__guard=l0.__guard; window.drawList=g; }

    let counting=false;
    const mo=new MutationObserver(()=>{ if(counting) settle++; });
    const ovl=$('#ovl');
    try{ if(ovl) mo.observe(ovl,{childList:true,subtree:true}); }catch(x){globalThis.__q?.(x)}

    const t0=performance.now();
    let openMs=0;
    try{ (window.ovOpen||function(){})(id); openMs=Math.round(performance.now()-t0); }
    catch(x){
      mo.disconnect(); if(d0) window.ovDraw=d0; if(l0) window.drawList=l0;
      probeOff();
      return res({ok:false,why:'여는 중 오류: '+((x&&x.message)||x)});
    }
    setTimeout(()=>{ counting=true; drawN=0; listN=0; }, 450);   /* 처음 그리기는 빼고 센다 */
    setTimeout(()=>{
      mo.disconnect();
      if(d0) window.ovDraw=d0;
      if(l0) window.drawList=l0;
      try{ (window.ovClose||function(){})(); }catch(x){globalThis.__q?.(x)}
      const de=errs-e0;
      probeOff();
      const storm=(window.__moStorm||[]).length;
      const ok = openMs<=1200 && drawN<=1 && listN<=1 && settle<=14 && de===0 && storm===0;
      res({ ok, openMs, paints:settle, drawN, listN, errs:de,
            why: ok?'' : [
              openMs>1200 ? `여는 데 ${openMs}ms` : '',
              drawN>1     ? `판 다시 그리기 ${drawN}번` : '',
              listN>1     ? `목록 다시 그리기 ${listN}번` : '',
              settle>14   ? `잠잠해진 뒤에도 ${settle}번 바뀜` : '',
              de          ? `오류 ${de}건` : '',
              storm       ? `감시자 폭주 ${storm}건 — ${(window.__moStorm[0]||'').slice(0,60)}` : ''
            ].filter(Boolean).join(' · ') });
    },1900);
  });
}

/* ── 판 ── */
let box=null;
function build(){
  if(box) return box;
  box=document.createElement('div'); box.className='ovlab';
  box.innerHTML=`<h4>한눈에 기능 — 한 겹씩 켜기</h4>
    <div class="sub">겹을 켤 때마다 판을 한 번 열어 «여는 시간 · 다시 그린 횟수 · 오류» 를 잽니다.
      하나라도 걸리면 그 겹을 도로 끕니다.</div>
    ${LAYERS.map(L=>`<div class="row" data-k="${L.k}">
      <div class="nm"><b>${L.n}</b><span>${L.d}</span></div>
      <div class="st"></div>
      <button type="button" class="sw" aria-label="${L.n} 켜기"><i></i></button>
    </div>`).join('')}
    <div class="acts">
      <button type="button" class="go" data-seq>▶ 차례로 켜며 검증</button>
      <button type="button" data-reset>처음값</button>
      <button type="button" data-x>닫기</button>
    </div>
    <div class="log" data-log>아직 검증하지 않았습니다.</div>`;
  document.body.appendChild(box);

  box.addEventListener('click',async e=>{
    if(e.target.closest('[data-x]')) return box.classList.remove('on');
    if(e.target.closest('[data-reset]')){ window.OVL.reset(); paint(); log('처음값으로 되돌렸습니다.'); return; }
    if(e.target.closest('[data-seq]')) return seq();
    const sw=e.target.closest('.sw'); if(!sw) return;
    const k=sw.closest('.row').dataset.k;
    const next=!window.OVL.get(k);
    window.OVL.set(k,next); paint();
    if(!next){ mark(k,'',''); log(`«${nameOf(k)}» 를 껐습니다.`); return; }
    mark(k,'재는 중','run');
    const r=await check(k);
    if(r.ok){ mark(k,'정상','ok'); log(`«${nameOf(k)}» 켬 — 정상 (여는 데 ${r.openMs}ms · 판 다시 그리기 ${r.drawN}번)`); }
    else{ window.OVL.set(k,false); paint(); mark(k,'이상','bad');
          log(`«${nameOf(k)}» 를 켜니 이상 — ${r.why}\n→ 도로 껐습니다.`); }
  });
  return box;
}
const nameOf=k=>LAYERS.find(L=>L.k===k)?.n||k;
function mark(k,txt,cls){
  const el=box?.querySelector(`.row[data-k="${k}"] .st`); if(!el) return;
  el.textContent=txt; el.className='st'+(cls?' '+cls:'');
}
function log(t){
  const el=box?.querySelector('[data-log]'); if(!el) return;
  el.textContent=t+'\n'+(el.textContent||'').split('\n').slice(0,8).join('\n');
}
function paint(){
  try{ window.OVLPAINT&&window.OVLPAINT() }catch(e){globalThis.__q?.(e)}
  if(!box) return;
  LAYERS.forEach(L=>{
    box.querySelector(`.row[data-k="${L.k}"] .sw`)?.classList.toggle('on',window.OVL.get(L.k));
  });
}

/* ── 차례로 켜며 검증 ── */
let running=false;
async function seq(){
  if(running) return;
  running=true;
  const btn=box.querySelector('[data-seq]'); btn.disabled=true; btn.textContent='재는 중…';
  /* 바닥부터 — 모두 끄고, 기본 판만 남긴 채 하나씩 올린다 */
  LAYERS.forEach(L=>window.OVL.set(L.k,false)); paint();
  log('모두 끈 상태에서 시작합니다.');
  const base=await check(null);
  if(!base.ok){
    log(`⚠ 아무 겹도 안 켠 «기본 판» 부터 이상합니다 — ${base.why}\n   겹 문제가 아닙니다. 이 줄을 그대로 알려 주세요.`);
    btn.disabled=false; btn.textContent='▶ 차례로 켜며 검증'; running=false; return;
  }
  log(`기본 판 정상 (여는 데 ${base.openMs}ms · 다시 그리기 ${base.paints}번)`);
  let stopped=null;
  for(const L of LAYERS){
    mark(L.k,'재는 중','run');
    window.OVL.set(L.k,true); paint();
    await new Promise(r=>setTimeout(r,250));
    const r=await check(L.k);
    if(r.ok){ mark(L.k,'정상','ok'); log(`✓ ${L.n} — 정상 (${r.openMs}ms · ${r.paints}번)`); }
    else{
      window.OVL.set(L.k,false); paint();
      mark(L.k,'이상','bad');
      log(`✗ ${L.n} — ${r.why}\n→ 이 겹을 끄고 멈춥니다.`);
      stopped=L; break;
    }
  }
  log(stopped ? `여기까지입니다. «${stopped.n}» 가 걸립니다 — 나머지 겹은 안 켰습니다.`
              : '모든 겹이 정상입니다. 그대로 쓰셔도 됩니다.');
  btn.disabled=false; btn.textContent='▶ 차례로 켜며 검증'; running=false;
}

/* ── 여는 길 ── */
function open(){ build().classList.add('on'); paint(); }
window.__ovLab=open;

/* 도구 탭에 단추를 끼운다 */
const mt=setInterval(()=>{
  const host=document.getElementById('ezRedoAll')?.parentElement;
  if(!host) return;
  if(!document.getElementById('ovLabBtn')){
    const b=document.createElement('button');
    b.className='chip'; b.type='button'; b.id='ovLabBtn';
    b.textContent='⛶ 한눈에 기능';
    b.title='한눈에 판의 겹을 하나씩 켜며 검증합니다';
    b.onclick=open;
    host.appendChild(b);
  }
  clearInterval(mt);
},900);
setTimeout(()=>clearInterval(mt),30000);

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&box?.classList.contains('on')) box.classList.remove('on');
});

/* 지난번에 멎은 채로 끝났다면 — 그 겹을 꺼 두고 알려 준다 */
(function(){
  let v=null;
  try{ v=JSON.parse(localStorage.getItem(PROBE)||'null') }catch(e){globalThis.__q?.(e)}
  if(!v||!v.k) return;
  probeOff();
  try{ window.OVL.set(v.k,false) }catch(e){globalThis.__q?.(e)}
  setTimeout(()=>{
    try{ window.OVLPAINT&&window.OVLPAINT() }catch(e){globalThis.__q?.(e)}
    const nm=nameOf(v.k);
    try{ const el=document.getElementById('cvStat');
      if(el) el.textContent=`⚠ 지난번 «${nm}» 을 켜는 중에 화면이 멎었습니다 — 그 겹을 꺼 두었습니다.`; }catch(e){globalThis.__q?.(e)}
    build(); box.classList.add('on'); paint();
    mark(v.k,'멎음','bad');
    log(`⚠ 지난번 «${nm}» 을 켜자 화면이 통째로 멎었습니다(잴 틈도 없이).\n→ 그 겹을 꺼 두었습니다. 나머지는 그대로입니다.`);
  },1800);
})();

paint();
})();
