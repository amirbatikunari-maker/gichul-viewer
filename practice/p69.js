/* practice.html 에서 분리 (v341) — 원래 26911번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const KEY='prac:evh:v1';
const phone=()=>{ try{ return matchMedia('(max-width:899px)').matches }catch(e){ return innerWidth<900 } };
let S={}; try{ S=JSON.parse(localStorage.getItem(KEY)||'{}')||{} }catch(e){ S={} }
const save=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(S)) }catch(e){globalThis.__q?.(e)} };
const ob=()=>document.querySelector('#ovl .ob');
const setv=(el,k,v)=>{ if(el.style.getPropertyValue(k)!==v) el.style.setProperty(k,v); };
/* 기억해 둔 비율(전체 높이 대비) → 픽셀 */
function apply(){
  const o=ob(); if(!o) return;
  if(!(phone() && document.body.classList.contains('easyview'))){ o.style.removeProperty('--evh1'); o.style.removeProperty('--evh2'); return; }
  const H=o.clientHeight; if(H<100) return;
  /* 단답(문제+답 한 칸 · solo): 손잡이는 하나 — 그 칸 높이 하나만 따로 기억 (hs) */
  if(document.getElementById('ovl').classList.contains('solo')){
    if(S.hs){ setv(o,'--evh1', Math.max(40,Math.round(S.hs*H)-14)+'px'); setv(o,'--evh2','0px'); }
    else { o.style.removeProperty('--evh1'); o.style.removeProperty('--evh2'); }
    return;
  }
  if(S.h1) setv(o,'--evh1', Math.round(S.h1*H)+'px'); else o.style.removeProperty('--evh1');
  if(S.h2) setv(o,'--evh2', Math.round(S.h2*H)+'px'); else o.style.removeProperty('--evh2');
}
/* «쉬운 풀이» 글자를 감싸 숨길 수 있게 */
function wrapLabel(){
  const pl=document.querySelector('#ovl .seg[data-seg="e"] > .plab'); if(!pl || pl.querySelector(':scope > .plabt')) return;
  const t=[...pl.childNodes].find(n=>n.nodeType===3 && /쉬운\s*풀이/.test(n.nodeValue)); if(!t) return;
  const sp=document.createElement('span'); sp.className='plabt'; pl.insertBefore(sp,t); sp.appendChild(t);
}
let DRAG=null;
function mount(){
  wrapLabel();
  const o=ob(); if(!o) return;
  [1,2].forEach(g=>{
    if(o.querySelector(`:scope > .evgrip[data-g="${g}"]`)) return;
    const d=document.createElement('div'); d.className='evgrip'; d.dataset.g=String(g);
    d.title='위아래로 끌어 칸 높이 조절 · 두 번 톡 = 처음 높이'; d.setAttribute('role','separator'); d.innerHTML='<i></i>';
    o.appendChild(d);
    let last=0;
    d.addEventListener('pointerdown', e=>{
      const now=Date.now();
      const soloNow=document.getElementById('ovl').classList.contains('solo');
      if(now-last<320){ delete S[soloNow?'hs':'h'+g]; save(); apply(); last=0; return; }   /* 두 번 톡 = 처음대로 */
      last=now;
      const L=document.querySelector('#ovLeft'), A=document.querySelector('#ovl .seg[data-seg="a"]');
      const solo=document.getElementById('ovl').classList.contains('solo');
      const top = g===1 ? L : (solo ? L : A);
      if(!top) return;
      DRAG={ g, y:e.clientY, h:top.getBoundingClientRect().height, H:o.clientHeight, el:d, solo };
      d.classList.add('on'); document.body.classList.add('evdrag');
      try{ d.setPointerCapture(e.pointerId) }catch(x){globalThis.__q?.(x)}
      e.preventDefault();
    });
    d.addEventListener('pointermove', e=>{
      if(!DRAG || DRAG.el!==d) return;
      const o2=ob(); const other = DRAG.g===1 ? (S.h2? S.h2*DRAG.H : 120) : (S.h1? S.h1*DRAG.H : 120);
      const max=Math.max(60, DRAG.H - other - 28 - 70);                         /* 아래 쉬운 풀이 칸이 최소 70px 은 남게 */
      if(DRAG.solo){
        const h=Math.min(DRAG.H-28-70, Math.max(60, DRAG.h + (e.clientY-DRAG.y)));
        setv(o2,'--evh1', Math.round(h-14)+'px'); setv(o2,'--evh2','0px'); S.hs=h/DRAG.H; e.preventDefault(); return;
      }
      const h=Math.min(max, Math.max(40, DRAG.h + (e.clientY-DRAG.y)));
      setv(o2, DRAG.g===1?'--evh1':'--evh2', Math.round(h)+'px');
      S['h'+DRAG.g]=h/DRAG.H;
      e.preventDefault();
    });
    const up=()=>{ if(!DRAG || DRAG.el!==d) return; d.classList.remove('on'); document.body.classList.remove('evdrag'); DRAG=null; save(); };
    d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
  });
  apply();
}
setInterval(()=>{ try{ mount() }catch(e){globalThis.__q?.(e)} }, 600);
addEventListener('resize', ()=>{ try{ apply() }catch(e){globalThis.__q?.(e)} });
try{ new MutationObserver(()=>{ try{ apply() }catch(e){globalThis.__q?.(e)} }).observe(document.body,{ attributes:true, attributeFilter:['class'] }); }catch(e){globalThis.__q?.(e)}
})();
