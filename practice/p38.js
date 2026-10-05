/* practice.html 에서 분리 (v341) — 원래 16331번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const FAILS =()=>{ try{ return (window.__pracFail&&window.__pracFail())||{} }catch(e){ return {} } };

/* ── 무엇이 «안 된 것» 인가 ── 셈과 거르개가 한 식을 쓴다 ── */
const needQ  = r => !!(r.q_url && !r.q_md);
const needA  = r => !!(r.a_url && !r.a_md);
const needEz = r => window.__needEz ? window.__needEz(r) : !!(!r.easy_md && (r.q_url || r.q_md));
const failed = r => !!FAILS()[String(r.id)];
const PRED = {
  any : r => needQ(r)||needA(r)||needEz(r)||failed(r),
  q   : needQ,
  a   : needA,
  ez  : needEz,
  fail: failed
};
const NAME = { any:'안 된 것', q:'문제 글자', a:'답안 글자', ez:'쉬운 풀이', fail:'실패' };

let MODE='off';                                   /* 새로 들어오면 늘 «모두 보기» 로 시작한다 */

/* ── ① drawList 를 감싼다 ─────────────────────────────────── */
let HOOKED=false;
function hook(){
  if(HOOKED) return true;
  if(typeof window.drawList!=='function') return false;
  const orig=window.drawList;
  const w=function(){
    if(MODE==='off') return orig.apply(this,arguments);
    const all=rowsAll();
    let use;
    try{ use=all.filter(PRED[MODE]||(()=>true)) }catch(e){ use=all }
    /* 다 끝내서 하나도 안 남으면 스스로 거르개를 푼다 — 빈 화면을 만들지 않는다 */
    if(!use.length){ MODE='off'; use=all; }
    try{
      window.__pracSwap=true; ROWS=use;
      return orig.apply(this,arguments);
    }catch(e){
      ROWS=all; return orig.apply(this,arguments);
    }finally{
      ROWS=all; window.__pracSwap=false; setTimeout(paint,0);
    }
  };
  w.__todo=1; w.__tag=orig.__tag; w.__dup=orig.__dup; w.__probe=orig.__probe;
  window.drawList=w; HOOKED=true;
  return true;
}

/* ── ② 단추 ───────────────────────────────────────────────── */
const ITEMS=[['any','전부'],['q','문제 글자'],['a','답안 글자'],['ez','쉬운 풀이'],['fail','지난번 실패']];

function build(){
  if(document.getElementById('todoWrap')) return true;
  const host=document.getElementById('dView2') || document.querySelector('.cvbar');
  if(!host) return false;

  const w=document.createElement('div');
  w.className='dmenu'; w.id='todoWrap';
  w.innerHTML=`<button type="button" class="chip dm-t" id="todoT"
      title="아직 글자로 안 바뀐 문항 · 해설이 없는 문항 · 지난번 실패한 문항만 모아 봅니다">⚠ 안 된 것</button>
    <div class="dmenu-pop" id="todoPop">
      <div class="dmenu-lab">모아 보기</div>
      ${ITEMS.map(([k,t])=>`<button type="button" data-m="${k}">${t}<b data-n="${k}">0</b></button>`).join('')}
      <div class="dmenu-lab">되돌리기</div>
      <button type="button" data-m="off">모두 보기</button>
    </div>`;

  /* 기능 줄에서는 «도구» 차림표 앞에 세운다 */
  const before=host.querySelector('.dmenu');
  before ? host.insertBefore(w,before) : host.appendChild(w);

  const t=w.querySelector('#todoT');
  t.onclick=e=>{
    e.stopPropagation();
    document.querySelectorAll('.dmenu.open').forEach(m=>{ if(m!==w) m.classList.remove('open') });
    w.classList.toggle('open');
    if(w.classList.contains('open')) paint();
  };
  w.querySelector('#todoPop').addEventListener('click',e=>{
    const b=e.target.closest('button[data-m]'); if(!b) return;
    e.stopPropagation();
    w.classList.remove('open');
    apply(b.dataset.m);
  });
  paint();
  return true;
}

function apply(m){
  if(m!=='off'){
    const n=rowsAll().filter(PRED[m]).length;
    if(!n){ alert('해당하는 문항이 없습니다 — 이 과목은 다 돼 있습니다.'); return; }
  }
  MODE=m;
  try{ window.drawList&&window.drawList() }catch(e){globalThis.__q?.(e)}
  /* 한 문항씩 보고 있었다면 걸러 낸 첫 문항으로 옮긴다 */
  try{
    if(document.body.classList.contains('oneup') && typeof window.showAt==='function') window.showAt(0);
  }catch(e){globalThis.__q?.(e)}
  paint();
}

function paint(){
  const t=document.getElementById('todoT'); if(!t) return;
  const all=rowsAll();
  const n={};
  ITEMS.forEach(([k])=>{ try{ n[k]=all.filter(PRED[k]).length }catch(e){ n[k]=0 } });

  ITEMS.forEach(([k])=>{
    const el=document.querySelector(`#todoPop b[data-n="${k}"]`); if(!el) return;
    el.textContent=n[k];
    const b=el.parentElement;
    b.classList.toggle('zero',!n[k]);
    b.classList.toggle('on',MODE===k);
  });

  const on = MODE!=='off';
  t.textContent = on ? `⚠ ${NAME[MODE]} ${n[MODE]||0}` : (n.any ? `⚠ 안 된 것 ${n.any}` : '⚠ 안 된 것');
  t.classList.toggle('hit',on);
  t.classList.toggle('on',on);
}

/* ── ③ 붙을 자리가 생길 때까지 기다린다 ── */
const tm=setInterval(()=>{ const a=hook(), b=build(); if(a&&b) clearInterval(tm); },600);
/* ★ 시계를 끄지 않는다 — 붙일 자리(#dView2)가 늦게 생기면 40초 만에 포기해
   기능 줄에 칩이 아예 안 붙는 일이 있었다. 붙고 나면 스스로 멈춘다. */
hook(); build();

window.__pracTodo=(m)=>apply(m||'any');
})();
