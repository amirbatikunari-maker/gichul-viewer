/* practice.html 에서 분리 (v341) — 원래 17367번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const FAILS=()=>{ try{ return (window.__pracFail&&window.__pracFail())||{} }catch(e){ return {} } };
const FKEY='prac:jobfail:v1';
const needCv = r => window.__needCv ? window.__needCv(r) : !!((r.q_url&&!r.q_md)||(r.a_url&&!r.a_md));
const needEz = r => window.__needEz ? window.__needEz(r) : !!(!r.easy_md && (r.q_url||r.q_md));

/* ══ ① 사유 가르기 ══ */
const KINDS=[
  { k:'sql',  t:'표에 칸이 없음',       re:/칸이 아직 없|칸이 없|schema cache|easy_md|q_md/i,
    fix:'추가SQL_실기변환.sql · supabase-실기.sql 을 먼저 돌려 주세요. 이건 몇 번을 다시 해도 안 됩니다.' },
  { k:'busy', t:'서버가 거절함',        re:/429|quota|rate|too many|과부하|overload|503|502|한도/i,
    fix:'동시 개수를 낮추고 다시 돌리면 대부분 들어갑니다.' },
  { k:'slow', t:'응답이 너무 늦음',     re:/오래|timeout|abort|응답하지 않/i,
    fix:'그냥 다시 돌리면 됩니다. 그림이 큰 문항에서 잦습니다.' },
  { k:'img',  t:'그림을 못 받음',       re:/그림을 읽지|fetch|network|failed to fetch|404|storage/i,
    fix:'원본 그림이 지워졌거나 주소가 끊긴 것입니다. 그 문항만 다시 올려야 합니다.' },
  { k:'empty',t:'AI 가 빈 답을 줌',     re:/채워지지 않음|빈|empty/i,
    fix:'대개 다시 돌리면 들어갑니다. 계속 같은 문항만 비면 그림이 글자로 옮기기 어려운 것(결선도 등)입니다.' },
  { k:'etc',  t:'그 밖에',              re:/.*/,
    fix:'사유를 그대로 적어 두었습니다. 우선 한 번 다시 돌려 보세요.' }
];
const kindOf = why => (KINDS.find(x=>x.re.test(String(why||'')))||KINDS[KINDS.length-1]).k;

function collect(){
  const F=FAILS();
  const rows=rowsAll();
  const out=[];
  rows.forEach(r=>{
    const f=F[String(r.id)];
    const cv=needCv(r), ez=needEz(r);
    if(!f && !cv && !ez) return;
    out.push({ r, why:f? f.why : (cv||ez ? '아직 안 함' : ''), logged:!!f, cv, ez,
               kind: f? kindOf(f.why) : 'todo' });
  });
  return out;
}

/* ══ ② 목록에 «이것만» ══ */
let PICK=null;                        /* id 집합 */
(function hook(){
  const orig=window.drawList;
  if(typeof orig!=='function' || orig.__fb) return;
  const w=function(){
    if(!PICK) return orig.apply(this,arguments);
    const all=rowsAll();
    let use=all.filter(r=>PICK.has(String(r.id)));
    if(!use.length){ PICK=null; use=all; }
    try{ window.__pracSwap=true; ROWS=use; return orig.apply(this,arguments); }
    finally{ ROWS=all; window.__pracSwap=false; }
  };
  w.__fb=1; w.__tag=orig.__tag; w.__dup=orig.__dup; w.__todo=orig.__todo;
  w.__src=orig.__src; w.__probe=orig.__probe;
  window.drawList=w;
})();
function only(ids){
  PICK = ids && ids.length ? new Set(ids.map(String)) : null;
  try{ drawList() }catch(e){globalThis.__q?.(e)}
  try{ if(document.body.classList.contains('oneup')&&window.showAt) window.showAt(0) }catch(e){globalThis.__q?.(e)}
}
window.__pracOnly=only;

/* ══ ③ 다시 돌리기 (동시 4개) ══ */
let BUSY=false;
async function retry(list, say){
  if(BUSY) return alert('이미 돌고 있습니다.');
  let b=false; try{ b=CVBUSY||EZBUSY }catch(e){globalThis.__q?.(e)}
  if(b) return alert('다른 작업이 돌고 있습니다.');
  if(!list.length) return;
  if(!confirm(`${list.length}개를 다시 돌립니다. 계속할까요?`)) return;

  BUSY=true;
  try{ CVSTOP=false; CVBUSY=true; EZBUSY=true }catch(e){globalThis.__q?.(e)}
  const stop=$('#cvStop'), prog=$('#cvProg'), bar=$('#cvBar');
  if(stop) stop.hidden=false; if(prog) prog.hidden=false;

  let i=0, ok=0, bad=0, done=0;
  const F=FAILS();
  const worker=async()=>{
    while(true){
      let s=false; try{ s=CVSTOP }catch(e){globalThis.__q?.(e)}
      if(s) return;
      const k=i++; if(k>=list.length) return;
      const r=list[k];
      let why=null;
      try{
        if(needCv(r)) await cvRow(r,false);
        if(needEz(r)) await ezMake(r.id,false,true);
        if(needCv(r)||needEz(r)) why='돌렸으나 채워지지 않음';
      }catch(e){ why=(e&&e.message)||String(e) }
      done++;
      if(why){ bad++; F[String(r.id)]={ why:String(why).slice(0,80), at:Date.now() } }
      else { ok++; delete F[String(r.id)] }
      try{ localStorage.setItem(FKEY,JSON.stringify(F)) }catch(e){globalThis.__q?.(e)}
      say(`다시 ${done}/${list.length} · 됨 ${ok}`+(bad?` · 실패 ${bad}`:''));
      try{ cvSay(`다시 ${done}/${list.length} · 됨 ${ok}`+(bad?` · 실패 ${bad}`:'')) }catch(e){globalThis.__q?.(e)}
      if(bar) bar.style.width=(done/list.length*100)+'%';
    }
  };
  await Promise.all([worker(),worker(),worker(),worker()]);

  try{ CVBUSY=false; EZBUSY=false }catch(e){globalThis.__q?.(e)}
  BUSY=false;
  if(stop) stop.hidden=true; if(prog) prog.hidden=true;
  say(`${ok}개 됨`+(bad?` · ${bad}개 여전히 실패`:' · 다 됐습니다'));
  try{ drawList(); cvCount() }catch(e){globalThis.__q?.(e)}
}

/* ══ ④ 창 ══ */
let W=null;
function say(t,bad){ const m=W&&$('.msg',W); if(m){ m.textContent=t||''; m.classList.toggle('bad',!!bad) } }
function open_(){
  if(!W){
    W=document.createElement('div'); W.className='fbw';
    W.innerHTML=`<div class="fbbox">
      <div class="h"><b>실패함 — 못 한 문항</b><span class="sp"></span>
        <button type="button" data-x="all">전체 보기로</button>
        <button type="button" data-x="close">닫기</button></div>
      <div class="fbsum" id="fbSum"></div>
      <div class="fblist" id="fbList"></div>
      <div class="fbf"><span class="msg"></span>
        <button type="button" data-x="retryAll">전부 다시</button>
        <button type="button" data-x="clear" class="warn">기록 비우기</button></div></div>`;
    document.body.appendChild(W);
    W.addEventListener('click',e=>{
      if(e.target===W) return W.classList.remove('on');
      const b=e.target.closest('button[data-x]'); if(!b) return;
      const x=b.dataset.x;
      if(x==='close') W.classList.remove('on');
      else if(x==='all'){ only(null); paint() }
      else if(x==='clear'){
        if(!confirm('실패 기록만 지웁니다 (문항은 그대로).')) return;
        try{ localStorage.setItem(FKEY,'{}') }catch(e){globalThis.__q?.(e)}
        const F=FAILS(); Object.keys(F).forEach(k=>delete F[k]);
        paint(); say('기록을 비웠습니다.');
      }
      else if(x==='retryAll'){ const l=collect().map(x2=>x2.r); retry(l,say).then(paint) }
    });
    addEventListener('keydown',e=>{ if(e.key==='Escape'&&W.classList.contains('on')) W.classList.remove('on') });
  }
  W.classList.add('on'); paint();
}

function paint(){
  if(!W) return;
  const all=collect();
  const nCv=all.filter(x=>x.cv).length, nEz=all.filter(x=>x.ez).length, nLog=all.filter(x=>x.logged).length;
  $('#fbSum',W).innerHTML = all.length
    ? `못 한 문항 <em>${all.length}</em>개 · 글자 변환 ${nCv} · 쉬운 풀이 ${nEz} · 실패로 기록된 것 ${nLog}`
    : '못 한 문항이 없습니다 — 이 과목은 다 돼 있습니다.';

  const L=$('#fbList',W);
  if(!all.length){ L.innerHTML=''; return; }

  const order=['sql','busy','img','empty','slow','etc','todo'];
  const g=new Map();
  all.forEach(x=>{ (g.get(x.kind)||g.set(x.kind,[]).get(x.kind)).push(x) });
  const title=k=> k==='todo' ? '아직 안 돌린 것' : (KINDS.find(x=>x.k===k)||{}).t || k;
  const fixOf=k=> k==='todo' ? '실패한 적은 없습니다 — 그냥 아직 차례가 안 온 것입니다.'
                             : (KINDS.find(x=>x.k===k)||{}).fix || '';

  L.innerHTML=order.filter(k=>g.has(k)).map(k=>{
    const list=g.get(k);
    const ex=list.slice(0,6).map(x=>`${x.r.year}-${x.r.session} ${x.r.no}번`).join(' · ');
    const why=list.find(x=>x.logged)?.why||'';
    return `<div class="fbg" data-k="${k}">
      <div class="t"><b>${title(k)} — ${list.length}개</b>
        <span>${ex}${list.length>6?` 외 ${list.length-6}개`:''}${why?`<br>사유: ${String(why).replace(/</g,'&lt;')}`:''}</span></div>
      <div class="fix">${fixOf(k)}</div>
      <div class="a">
        <button type="button" data-g="see">이것만 목록에 보기</button>
        <button type="button" data-g="retry">이것만 다시 (동시 4)</button>
      </div></div>`;
  }).join('');

  $$('.fbg button[data-g]',L).forEach(b=>{
    b.onclick=()=>{
      const k=b.closest('.fbg').dataset.k;
      const list=g.get(k)||[];
      if(b.dataset.g==='see'){ only(list.map(x=>x.r.id)); W.classList.remove('on'); }
      else retry(list.map(x=>x.r),say).then(paint);
    };
  });
}

/* ══ ⑤ 붙이기 — 도구 차림표(늘 있다) + 기능 줄 ══ */
function mount(){
  const host=document.getElementById('ezRedoAll')?.parentElement;
  if(host && !document.getElementById('fbOpen')){
    const lab=document.createElement('div');
    lab.className='dmenu-lab'; lab.textContent='못 한 것';
    const b=document.createElement('button');
    b.className='chip'; b.type='button'; b.id='fbOpen'; b.textContent='⚠ 실패함 열기';
    b.title='글자 변환·쉬운 풀이를 못 한 문항을 사유별로 모아 봅니다';
    b.onclick=open_;
    host.append(lab,b);
  }
  /* 기능 줄에도 하나 — 자리가 늦게 생겨도 계속 기다린다 */
  const row=document.getElementById('dView2')||document.querySelector('.deck .dcol-view .drow')||document.querySelector('.cvbar');
  if(row && !document.getElementById('fbChip')){
    const c=document.createElement('button');
    c.className='chip'; c.type='button'; c.id='fbChip'; c.textContent='⚠ 실패함';
    c.title='못 한 문항 모아 보기';
    c.onclick=open_;
    row.appendChild(c);
  }
  return !!document.getElementById('fbOpen') && !!document.getElementById('fbChip');
}
const mt=setInterval(()=>{ if(mount()) clearInterval(mt) },700);
mount();

window.__pracFailBox=open_;
window.__pracWhere=()=>({
  도구단추: !!document.getElementById('fbOpen'),
  기능칩: !!document.getElementById('fbChip'),
  안된것칩: !!document.getElementById('todoWrap'),
  기능줄: !!document.getElementById('dView2')
});
})();
