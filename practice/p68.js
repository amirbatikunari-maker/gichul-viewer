/* practice.html 에서 분리 (v341) — 원래 26651번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const KEY='prac:mv:v1';
let S={}; try{ S=JSON.parse(localStorage.getItem(KEY)||'{}')||{} }catch(e){ S={} }
const save=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(S)) }catch(e){globalThis.__q?.(e)} };
const phone=()=>{ try{ return matchMedia('(max-width:899px)').matches }catch(e){ return innerWidth<900 } };
const oneup=()=>document.body.classList.contains('oneup');
const on=()=>!!S.on && phone() && oneup();
/* ★ v321 — «바뀔 때만» 쓴다. classList.add·style.setProperty 는 값이 같아도 «바뀌었다» 신호를 내서,
   이 신호를 지켜보는 이 칸이 또 돌고 → 또 쓰고 … 가만히 있어도 3초에 700번 넘게 돌던 것 */
const cls=(el,c,v)=>{ if(el.classList.contains(c)!==!!v) el.classList.toggle(c, !!v); };
const prop=(el,k,v)=>{ if(el.style.getPropertyValue(k)!==v) el.style.setProperty(k, v); };
const unprop=(el,k)=>{ if(el.style.getPropertyValue(k)) el.style.removeProperty(k); };
const MIN=56;                                              /* 한 칸 최소 높이(px) — 이름줄 + 한두 줄 */
const DEF={ 2:[1,1], 3:[1.1,0.9,1] };
const PRE={ q:{2:[2,1],3:[2,1,1]}, eq:{2:[1,1],3:[1,1,1]}, ez:{2:[1,2],3:[1,1,2]} };

/* 보이는 칸들 (접힘 포함) — .pcol 중 display:none 아닌 것 */
const cols=g=>[...g.children].filter(c=>c.classList && c.classList.contains('pcol') && getComputedStyle(c).display!=='none');
const folded=c=>c.classList.contains('pfold') || !!c.querySelector(':scope > .ez.pfold');

/* 화면 위·아래를 덮고 있는 고정 막대(위 탭줄 · 아래 탭줄 · 실시간 기록 등) 높이를 «실제로 재서» 뺀다 */
/* 고정(fixed) 막대 · 또는 지금 «실제로 붙어 있는» sticky 막대만 — 아직 제자리에 있는 sticky 는 화면을 덮지 않음 */
const pinned=el=>{ for(let x=el; x && x!==document.body; x=x.parentElement){ const cs=getComputedStyle(x), p=cs.position;
  if(p==='fixed') return !x.closest('.pgrid');
  if(p==='sticky'){ if(x.closest('.pgrid')) return false; const r=x.getBoundingClientRect(), tp=parseFloat(cs.top), bt=parseFloat(cs.bottom);
    if((tp===tp && r.top<=tp+2) || (bt===bt && Math.abs(innerHeight-r.bottom-bt)<=2)) return true; } } return false; };
let EDGE={ t:0, b:0, at:0, vh:0 };
function edges(){
  const vh=(window.visualViewport && visualViewport.height) || innerHeight;
  /* ★ v321 — 무거운 측정이라 «화면 크기가 바뀌었을 때 · 켤 때» 만 다시 잰다 (예전: 1.5초마다) */
  if(EDGE.at && EDGE.vh===vh && EDGE.vw===innerWidth) return EDGE;
  const xs=[innerWidth*0.3, innerWidth*0.5];
  let t=0, bt=0;
  /* 막대 사이 빈틈이 있어도 끝까지 훑어 «가장 깊이 덮은 곳» 까지 뺀다 */
  const hit=y=>xs.some(x=>{ const e=document.elementFromPoint(x,y); return e && pinned(e); });
  for(let y=2; y<Math.min(200, vh/3); y+=6) if(hit(y)) t=y+6;
  for(let y=vh-2; y>vh-300 && y>vh/2; y-=6) if(hit(y)) bt=vh-y+6;
  EDGE={ t, b:bt, at:Date.now(), vh, vw:innerWidth };
  return EDGE;
}
function height(){
  const vh=(window.visualViewport && visualViewport.height) || innerHeight, E=edges();
  return Math.max(220, Math.round(vh - E.t - E.b - 12));      /* 폰 가로(높이 낮음)도 한 화면 안에 */
}
function ratios(n){ const r=S['r'+n]; return Array.isArray(r) && r.length===n ? r : DEF[n] || Array(n).fill(1); }
/* ★ v321 — 칸마다 읽던 위치 기억 — 동기화 등으로 목록이 다시 그려져도 칸 스크롤이 맨 위로 튀지 않게 */
const POS=new Map();
const pkey=c=>{ const id=c.closest('.pcard')?.dataset.id; const k=['pcol-q','pcol-ans','pcol-ez'].find(x=>c.classList.contains(x)); return id&&k ? id+'|'+k : ''; };
document.addEventListener('scroll', e=>{ const c=e.target;
  if(!(c && c.classList && c.classList.contains('pcol') && c.parentElement && c.parentElement.classList.contains('mvon'))) return;
  const k=pkey(c); if(!k) return; POS.delete(k); POS.set(k, c.scrollTop); if(POS.size>60) POS.delete(POS.keys().next().value); }, true);
function apply(g){
  const cs=cols(g), n=cs.length;
  const r=ratios(n);
  cs.forEach((c,i)=>prop(c,'--mvf', String(r[i]||1)));
  /* 새로 그려진 칸이면(표시 없음) 기억한 자리로 */
  cs.forEach(c=>{ if(c.__mvPos) return; c.__mvPos=1; const v=POS.get(pkey(c)); if(v>0 && c.scrollTop===0) requestAnimationFrame(()=>{ c.scrollTop=v; }); });
}
function strip(g){
  cls(g,'mvon',false);
  $$(':scope > .mvgrip', g).forEach(x=>x.remove());
  $$(':scope > .pcol', g).forEach(c=>unprop(c,'--mvf'));
}
function mount(g){
  if(!on()){ if(g.classList.contains('mvon') || g.querySelector(':scope > .mvgrip')) strip(g); return; }
  const cs=cols(g);
  if(cs.length<2){ if(g.classList.contains('mvon')) strip(g); return; }
  cls(g,'mvon',true);
  prop(g,'--mvh', height()+'px');
  /* 손잡이: 보이는 칸 사이마다 하나 — 이미 맞게 있으면 그대로 */
  const want=cs.slice(0,-1).map(c=>c);
  const have=$$(':scope > .mvgrip', g);
  const okNow=have.length===want.length && have.every((h,i)=>h.previousElementSibling===want[i]);
  if(!okNow){
    have.forEach(x=>x.remove());
    want.forEach((c,i)=>{ const h=document.createElement('div'); h.className='mvgrip'; h.dataset.i=i;
      h.title='위아래로 끌어 높이 조절 · 두 번 톡 = 처음 비율'; h.appendChild(document.createElement('i')); c.after(h); });
  }
  apply(g);
}
function bar(card){
  if(card.querySelector('.mvbar')) return;
  const g=card.querySelector('.pgrid'); if(!g) return;
  const b=document.createElement('div'); b.className='mvbar';
  b.innerHTML=`<span class="mvseg" role="group" aria-label="폰 보기"><button type="button" data-mv="off">☰ 이어 보기</button><button type="button" data-mv="on">↕ 나눠 보기</button></span>
    <span class="mvp" role="group" aria-label="빠른 비율"><button type="button" data-mvp="q" title="문제 칸을 크게">문제↑</button><button type="button" data-mvp="eq" title="똑같이">균등</button><button type="button" data-mvp="ez" title="아래(답·풀이) 칸을 크게">풀이↑</button></span>`;
  g.before(b);
}
function paintBars(){ $$('.mvbar [data-mv]').forEach(x=>cls(x,'on', (x.dataset.mv==='on')===!!S.on)); }
let raf=0;
function run(){
  cls(document.body,'pvsplit', on());
  if(phone()) $$('#list > .pcard').forEach(bar);
  $$('#list .pcard .pgrid').forEach(mount);
  paintBars();
}
function scan(){
  if(raf || D) return;
  raf=requestAnimationFrame(()=>{ raf=0; if(!D) run(); });
}
/* ★ 목록이 다시 그려지면 «그 자리에서 바로» 붙인다 — 다음 프레임까지 기다리면 한 번 번쩍 풀려 보임
   ★ v321 — 칸 구조와 상관없는 변화(공부 타이머 숫자 · 단추 제목 등)에는 반응 안 함 */
const MATTER=t=>t && t.nodeType===1 && (t.id==='list' || t.matches('.pcard, .pgrid, .pcol, .ez'));
function onMut(recs){
  if(recs && !recs.some(r=>MATTER(r.target))) return;
  if(!D && on() && document.querySelector('#list .pcard .pgrid:not(.mvon), #list > .pcard:not(:has(.mvbar))')){ cancelAnimationFrame(raf); raf=0; run(); }
  else scan();
}

/* ── 누르기 ── */
document.addEventListener('click', e=>{
  const m=e.target.closest && e.target.closest('.mvbar [data-mv]');
  if(m){ S.on = m.dataset.mv==='on'; save(); EDGE.at=0; scan();
    if(S.on) setTimeout(()=>{ const g=m.closest('.pcard')?.querySelector('.pgrid'); if(g){ EDGE.at=0; const y=g.getBoundingClientRect().top+scrollY-edges().t-6; scrollTo({ top:Math.max(0,y), behavior:'smooth' }); } }, 60);
    return; }
  const p=e.target.closest && e.target.closest('.mvbar [data-mvp]');
  if(p){ [2,3].forEach(n=>{ S['r'+n]=PRE[p.dataset.mvp][n].slice(); }); save(); scan(); return; }
}, true);

/* ── 끌기 ── 두 칸 높이를 서로 주고받음 */
let D=null, lastT=0, lastH=null;
addEventListener('pointerdown', e=>{
  const h=e.target.closest && e.target.closest('.mvgrip'); if(!h) return;
  const g=h.parentElement; if(!g) return;
  e.preventDefault(); e.stopPropagation();
  const now=Date.now();
  if(h===lastH && now-lastT<380){ lastH=null; lastT=0; const n=cols(g).length; delete S['r'+n]; save(); scan(); return; }
  lastH=h; lastT=now;
  const cs=cols(g), i=+h.dataset.i, A=cs[i], B=cs[i+1];
  if(!A || !B || folded(A) || folded(B)) return;
  const hs=cs.map(c=>c.getBoundingClientRect().height);
  D={ g, cs, i, y:e.clientY, hs, h };
  h.classList.add('on'); document.body.classList.add('mvdrag');
  try{ h.setPointerCapture(e.pointerId) }catch(x){globalThis.__q?.(x)}
}, true);
addEventListener('pointermove', e=>{
  if(!D) return; e.preventDefault();
  const { cs, i, hs }=D, dy=e.clientY-D.y, pair=hs[i]+hs[i+1];
  let a=hs[i]+dy; a=Math.max(MIN, Math.min(pair-MIN, a));
  const w=hs.slice(); w[i]=a; w[i+1]=pair-a;
  /* 접힌 칸은 몫 계산에서 빼고, 펼친 칸끼리 비율로 */
  const open=cs.map(c=>!folded(c)), tot=w.reduce((s,v,k)=>s+(open[k]?v:0),0)||1;
  const r=w.map((v,k)=>open[k]? +(v/tot*cs.filter((_,j)=>open[j]).length).toFixed(4) : (ratios(cs.length)[k]||1));
  cs.forEach((c,k)=>c.style.setProperty('--mvf', String(r[k])));
  D.r=r;
}, { passive:false });
function stop(){
  if(!D) return; const d=D; D=null;
  d.h.classList.remove('on'); document.body.classList.remove('mvdrag');
  if(d.r){ S['r'+d.cs.length]=d.r; save(); }
  scan();
}
addEventListener('pointerup', stop, true);
addEventListener('pointercancel', stop, true);

/* ── 따라가기 ── 목록을 다시 그리거나 · 접거나 · 화면 크기가 바뀌면 */
const reEdge=()=>{ EDGE.at=0; scan(); };
addEventListener('resize', reEdge);
addEventListener('orientationchange', reEdge);
try{ window.visualViewport && visualViewport.addEventListener('resize', reEdge); }catch(e){globalThis.__q?.(e)}
function watch(){
  const list=$('#list');
  if(list) new MutationObserver(onMut).observe(list, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  new MutationObserver(scan).observe(document.body, { attributes:true, attributeFilter:['class'] });
  scan();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', watch); else watch();
setTimeout(scan, 800);
window.__pracMv={ scan, get state(){ return S; } };
})();
