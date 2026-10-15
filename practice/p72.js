/* ═══════════════════════════════════════════════════════════════
   v375 · «썩» 표시 — 버려도 되는 문제
   문항 줄(한눈에 #ovrS · 일반 보기 #prail) 칸 왼쪽 위에 작은 네모 «썩».

   썩 = 한 번만 나온 유형(똥 등급)  그리고  풀기 어려운 문제
     · 똥이어도 쉬우면(풀이 짧음·서술형) 표시 안 함 — 쉬운 건 가져간다
     · 어려움 판정
         ① 답안(a_md / a_text)의 «=» 개수가 이 과목 문항 중 위쪽 40% 이고 4개 이상
         ② 답안 글이 없으면 쉬운 풀이(easy_md)의 «=» 로 같은 방식
         ③ 내가 2번 이상 틀린 문제
     · 손으로 바꾸기: 칸을 Alt+클릭 → 자동 → 썩 → 합(표시 안 함) → 자동 … 차례로 돈다
       (이 기기에만 저장 · localStorage prac:sseok:v1)
   줄을 그리는 쪽 코드는 손대지 않음 — p64 와 같은 방식으로 칸 글자·data-y 로 문항을 찾는다.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const q_=e=>{ try{ globalThis.__q?.(e) }catch(x){} };
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const prog=()=>{ try{ return (window.__pracProg&&window.__pracProg())||{} }catch(e){ return {} } };
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||console.log)(m) }catch(e){ q_(e) } };

/* ── 손으로 정한 값 ── id → 's'(썩) | 'h'(합) */
const LK='prac:sseok:v1';
let MAN={};
try{ MAN=JSON.parse(localStorage.getItem(LK)||'{}')||{} }catch(e){ MAN={} }
const saveMan=()=>{ try{ localStorage.setItem(LK,JSON.stringify(MAN)) }catch(e){ q_(e) } };

/* ── 어려움 판정 ── */
/* 계산식의 «=» 만 센다 — 그림 주소(?a=b)·HTML 속성(style="…")·비교기호는 빼고 */
const eqN=s=>{ s=String(s||''); if(!s) return 0;
  s=s.replace(/!\[[^\]]*\]\([^)]*\)/g,' ')          /* ![그림](주소) */
     .replace(/\]\([^)]*\)/g,']')                    /* [글](주소) */
     .replace(/<[^>]*>/g,' ')                        /* <태그 속성="…"> */
     .replace(/(?:https?:|data:)\S+/g,' ')           /* 맨 주소 */
     .replace(/==|<=|>=|!=|\\neq|\\leq|\\geq/g,' ');
  return (s.match(/[=＝]/g)||[]).length; };
let HARD=null, HSIG='';
function pct(arr,p){ if(!arr.length) return Infinity; const a=[...arr].sort((x,y)=>x-y); return a[Math.min(a.length-1,Math.floor(a.length*p))]; }
function hardMap(){
  const R=rows();
  /* 답안·해설을 고치거나 새로 만들면 다시 센다 — 글 길이 합으로 알아챔 */
  let L=0; for(const r of R) L+=String(r.a_md||r.a_text||'').length+String(r.easy_md||'').length;
  const sig=R.length+'|'+(R[0]?R[0].id:'')+'|'+L;
  if(HARD && HSIG===sig) return HARD;
  const A=[], E=[];
  const m=R.map(r=>{
    const a=eqN(r.a_md||r.a_text), e=eqN(r.easy_md);
    if(a) A.push(a); else if(e) E.push(e);
    return [r,a,e];
  });
  const cA=Math.max(4,pct(A,0.6)), cE=Math.max(6,pct(E,0.6));
  HARD=new Map();
  m.forEach(([r,a,e])=>HARD.set(String(r.id), a ? a>=cA : (e ? e>=cE : null)));
  HSIG=sig;
  return HARD;
}

/* 이 문항이 썩인가 — true/false (아직 셀 수 없으면 false) */
function isSseok(r){
  const id=String(r.id);
  if(MAN[id]==='s') return true;
  if(MAN[id]==='h') return false;
  let t=null; try{ t=window.__pracTag&&window.__pracTag(id) }catch(e){ q_(e) }
  if(!t || t.tier!=='r') return false;                 /* 똥(한 번만 나온 유형)만 */
  const p=prog()[id];
  if(p && (p.no|0)>=2) return true;                    /* 내가 두 번 넘게 틀림 */
  return hardMap().get(id)===true;
}
window.__pracSseok=id=>{ const r=rows().find(x=>String(x.id)===String(id)); return r?isSseok(r):false; };

/* ── 칸 → 문항 (p64 와 같은 방식) ── */
let IDX=new Map(), IDXS='';
const key=(y,s,n)=>y+'|'+s+'|'+n;
function index(){
  const R=rows(), s=R.length+'|'+(R[0]?R[0].id:'');
  if(s!==IDXS){ IDX=new Map(); R.forEach(r=>IDX.set(key(+r.year,+r.session,String(r.no).trim()),r)); IDXS=s; }
  return IDX;
}
function rowOf(b){
  const y=+b.dataset.y; if(!y) return null;
  const n0=b.firstChild; const t=String(n0&&n0.nodeType===3?n0.nodeValue:b.textContent).trim();
  const m=t.match(/^\S+?-(\d+)\s+(\S+)/); if(!m) return null;
  return index().get(key(y,+m[1],m[2]))||null;
}

const st=document.createElement('style');
st.textContent=`
#ovrS .pb .ssk,#prail .pb .ssk{position:absolute;left:-1px;top:-6px;z-index:3;
  font:700 9px/1 system-ui,sans-serif;font-style:normal;padding:2px 2px 1px;border-radius:3px;
  background:#6b4a2b;color:#fff;border:1px solid #fff;pointer-events:none;letter-spacing:0}
#ovrS .pb .ssk.man,#prail .pb .ssk.man{background:#8a2b2b}
#ovrS .pb,#prail .pb{position:relative}`;
document.head.appendChild(st);

function deco(){
  const bs=document.querySelectorAll('#ovrS .pb[data-ovgo], #prail .pb[data-go]');
  if(!bs.length) return;
  bs.forEach(b=>{
    try{
      const r=rowOf(b); if(!r) return;
      const on=isSseok(r), man=MAN[String(r.id)]==='s';
      let s=b.querySelector(':scope > .ssk');
      if(on){
        if(!s){ s=document.createElement('i'); s.className='ssk'; s.textContent='썩'; b.appendChild(s); }
        s.classList.toggle('man',man);
      } else if(s) s.remove();
    }catch(e){ q_(e) }
  });
}
window.__sseokDeco=deco;

/* Alt+클릭 — 자동 → 썩 → 합 → 자동 */
document.addEventListener('click',e=>{
  if(!e.altKey) return;
  const b=e.target.closest && e.target.closest('#ovrS .pb[data-ovgo], #prail .pb[data-go]'); if(!b) return;
  const r=rowOf(b); if(!r) return;
  e.preventDefault(); e.stopPropagation();
  const id=String(r.id), cur=MAN[id];
  const next = !cur ? 's' : cur==='s' ? 'h' : null;
  if(next) MAN[id]=next; else delete MAN[id];
  saveMan(); deco();
  const nm=`${String(r.year).slice(-2)}-${r.session} ${r.no}번`;
  say(next==='s' ? `썩 ${nm} — 손으로 썩 지정` : next==='h' ? `합 ${nm} — 손으로 합 지정 (썩 표시 안 함)` : `${nm} — 자동 판정으로 되돌림 (${isSseok(r)?'썩':'합'})`);
},true);

let T=0; const soon=()=>{ clearTimeout(T); T=setTimeout(deco,60); };
const hook=sel=>{ const el=document.querySelector(sel); if(!el||el.__sskdeco) return !!el; el.__sskdeco=1;
  new MutationObserver(ms=>{ if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&n.classList&&n.classList.contains('pb')))) soon(); })
    .observe(el,{childList:true}); soon(); return true; };
const boot=setInterval(()=>{ const a=hook('#prail'), c=hook('#ovrS'); if(a&&c) clearInterval(boot); },400);
setTimeout(()=>clearInterval(boot),30000);
/* 등급(똥)은 틈날 때 세어지므로 처음엔 비어 있다 — 가볍게 자주 맞춘다 */
setInterval(()=>{ if(!document.hidden) deco(); },1500);
})();
