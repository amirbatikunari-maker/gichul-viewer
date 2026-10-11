/* ═══════════════════════════════════════════════════════════════
   v361 · 한눈에 머리줄 정리 — 맨 위에는 «닫기» 만 남기고 단추를 각 칸 이름줄로 옮긴다
     문제 이름줄   : [◧ 이지뷰] [이지뷰|원래대로] [✂ 잘라 넣기] [🗺 미니맵] … [− 75% ＋] [🏷 유형]
     답안 이름줄   : [✕ 틀림] [− n회독 ＋] …
     쉬운 풀이 줄  : [해설 AUTO] [✎ 해설 돌리기] [− 가 9pt ＋] [− √100% ＋] [＋ 줄간격 −] …
   맨 위 «＋ 회독 · ✕ 틀림» 은 없앤다 (회독은 답안 줄 ＋, 틀림은 답안 줄 단추).
   한눈에 칸은 문항을 넘길 때마다 새로 그려지므로, 그때마다 제자리로 다시 옮긴다.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const q_=e=>{ try{ globalThis.__q?.(e) }catch(x){} };

const st=document.createElement('style');
st.textContent=`
#ovl .oh #pxOvBtns,#ovl .oh [data-ova="ok"],#ovl .oh [data-ova="no"],#ovl .oh > #ovFs,#ovl .oh > #ovTs{display:none!important}
.ovl .plab .mv71{order:6;margin-left:6px;height:20px!important;min-height:0!important;padding:0 8px!important;flex:0 0 auto;
  border:1px solid var(--line,#e2e8f0);border-radius:6px;background:var(--surface,#fff);color:var(--ink,#0f172a);cursor:pointer;
  font:700 9.5px/1 var(--font-d,system-ui)!important;letter-spacing:0!important;text-transform:none;white-space:nowrap;display:inline-flex;align-items:center;gap:3px}
.ovl .plab .mv71:hover{border-color:var(--accent,#2563eb);color:var(--accent,#2563eb)}
.ovl .plab .mv71.on{background:#eef3ff;border-color:#b9c8f3;color:#1e3a8a}
.ovl .plab .mv71.no71{border-color:#f3b4b4;color:#b42318;background:#fff5f5}
.ovl .plab .mv71.run71{background:#1e3a8a;border-color:#1e3a8a;color:#fff}
.ovl .plab #ovFs,.ovl .plab #ovTs{order:6;margin-left:6px;height:20px;display:inline-flex;align-items:center;gap:0;
  border:1px solid var(--line,#e2e8f0);border-radius:6px;background:var(--surface,#fff);overflow:hidden;letter-spacing:0}
.ovl .plab #ovFs button,.ovl .plab #ovTs button{height:100%;width:20px;border:0!important;border-radius:0!important;background:none!important;
  color:var(--ink,#0f172a)!important;cursor:pointer;padding:0!important;min-width:0!important;font:800 11px/1 var(--font-d,system-ui)!important}
.ovl .plab #ovFs button:disabled,.ovl .plab #ovTs button:disabled{opacity:.3}
.ovl .plab #ovFs .sv,.ovl .plab #ovTs .sv{min-width:0;padding:0 5px;font:700 9.5px/1 var(--font-d,system-ui);color:var(--muted,#64748b);
  border-left:1px solid var(--line,#e2e8f0);border-right:1px solid var(--line,#e2e8f0);height:100%;display:inline-flex;align-items:center}
.ovl .plab #ovFs,.ovl .plab #ovTs,.ovl .plab .mv71,/* 문제 줄: [− 75% ＋][🏷 유형] ───── [◧ 이지뷰][이지뷰|원래대로][✂ 잘라 넣기][🗺 미니맵][📐 공식] */
#ovLeft > .plab > #qtBtn{order:0!important;margin-left:4px}
#ovLeft > .plab > .ev71{order:9!important;margin-left:auto!important}
#ovLeft > .plab > .ezxb[data-ezx="off"],#ovLeft > .plab > .cut71{order:9!important;margin-left:5px!important}
#ovLeft > .plab > .mmb{margin-left:5px!important}
#ovRight .seg[data-seg="e"] > .plab > #pxRunBtn,#ovRight .seg[data-seg="e"] > .plab > #ovFs,#ovRight .seg[data-seg="e"] > .plab > #ovTs{order:6!important}
#ovRight .seg[data-seg="a"] > .plab > .no71{order:9!important;margin-left:auto!important}
#ovRight .seg[data-seg="a"] > .plab > .no71 + .rdk{margin-left:5px!important}
.ovl .plab #qtBtn{flex:0 0 auto!important}
.ovl .plab #ovFs button,.ovl .plab #ovTs button{flex:0 0 20px!important}
/* 단추가 많아져 한 줄에 안 들어가면 줄을 바꾼다 (줄어들어 사라지지 않게) */
#ovLeft > .plab,#ovRight .seg > .plab{flex-wrap:wrap!important;row-gap:3px;height:auto!important;min-height:22px}
.ovl .plab #qtBtn{order:6;margin-left:6px;height:20px!important;min-height:0!important;padding:0 8px!important;font-size:9.5px!important;letter-spacing:0!important}
`;
document.head.appendChild(st);

const lab=k=> k==='q' ? $('#ovLeft > .plab') : $(`#ovRight .seg[data-seg="${k}"] > .plab`);
/* el 을 lab 안 ref 의 앞(before)/뒤(after) 에 — 이미 그 자리면 건드리지 않음 (지켜보기와 맞물려 돌지 않게) */
function place(el, L, ref, where){
  if(!el || !L) return;
  if(ref && ref.parentNode===L){
    if(where==='after'){ if(ref.nextSibling===el) return; ref.after(el); }
    else { if(el.nextSibling===ref) return; ref.before(el); }
  }else if(el.parentNode!==L) L.appendChild(el);
}
function mk(L, cls, html, attrs){
  let b=L.querySelector(':scope > .'+cls);
  if(!b){ b=document.createElement('button'); b.type='button'; b.className='mv71 '+cls; b.innerHTML=html;
    Object.entries(attrs||{}).forEach(([k,v])=>b.setAttribute(k,v)); }
  return b;
}

/* 한눈에 칸을 새로 그리면(문항 넘김) 옮겨 둔 단추도 같이 지워진다 → 붙잡아 두었다가 다시 단다.
   그 사이 다른 코드가 같은 id 로 새로 만들었으면 새것은 치우고 붙잡아 둔 것을 쓴다 (손잡이·상태 유지) */
const REF={};
function keep(id){
  const live=[...document.querySelectorAll('#'+id)];
  if(!REF[id] && live.length) REF[id]=live[0];
  const r=REF[id];
  live.forEach(x=>{ if(x!==r) x.remove(); });
  return r||null;
}
function arrange(){
  if(!$('#ovl')?.classList.contains('on')) return;
  /* ── 문제 줄 ── */
  const Q=lab('q');
  if(Q){
    const mm=Q.querySelector(':scope > .mmb');
    const ev=mk(Q,'ev71','◧ 이지뷰',{'data-pxeasyview':'1',title:'문제·답안은 왼쪽, 쉬운 풀이는 오른쪽에 길게 — 두 칸으로 봅니다'});
    ev.classList.toggle('on', document.body.classList.contains('easyview'));
    let sw=Q.querySelector(':scope > .ezxb[data-ezx="off"]');
    if(!sw){ sw=document.createElement('button'); sw.type='button'; sw.className='ezxb'; sw.dataset.ezx='off'; }
    const cut=mk(Q,'cut71','✂ 잘라 넣기',{'data-pxcut':'',title:'가로 절단선을 긋고 칸마다 문제·답으로 나눠 넣습니다'});
    place(ev, Q, mm, 'before'); place(sw, Q, mm||null, 'before'); place(cut, Q, mm||null, 'before');
    if(mm){ place(sw, Q, mm, 'before'); place(ev, Q, sw, 'before'); place(cut, Q, mm, 'before'); }
    try{ window.__ezxPaintSw && window.__ezxPaintSw() }catch(e){q_(e)}
    const gz=Q.querySelector(':scope > .gvz'), qt=keep('qtBtn');
    if(qt) place(qt, Q, gz, 'after');
  }
  /* ── 답안 줄 ── */
  const A=lab('a');
  if(A){
    const rd=A.querySelector(':scope > .rdk');
    const no=mk(A,'no71','✕ 틀림',{title:'틀림으로 기록하고 다음 문항'});
    no.classList.add('no71');
    if(!no.__b){ no.__b=1; no.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); $('#ovl .oh [data-ova="no"]')?.click(); }); }
    place(no, A, rd, 'before');
  }
  /* ── 쉬운 풀이 줄 ── */
  const E=lab('e');
  if(E){
    const au=E.querySelector(':scope > .ezauto'), gp=E.querySelector(':scope > .ezgap');
    const run=keep('pxRunBtn'); if(run){ run.classList.add('mv71','run71'); place(run, E, au, 'after'); }
    const fs=keep('ovFs'), ts=keep('ovTs');
    if(gp){ place(ts, E, gp, 'before'); place(fs, E, ts, 'before'); }
    else if(run){ place(fs, E, run, 'after'); place(ts, E, fs, 'after'); }
  }
}
let raf=0;
const soon=()=>{ if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; try{ arrange() }catch(e){q_(e)} }); };
(function watch(){
  const o=$('#ovl'); if(!o) return void setTimeout(watch,400);
  new MutationObserver(soon).observe(o,{ childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  soon();
})();
setInterval(soon, 700);
})();
