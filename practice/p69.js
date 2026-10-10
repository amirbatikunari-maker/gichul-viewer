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

/* ★ v345 — 한눈에: 문제·답안 그림 크기 −/＋ (v352 부터 30~100%)
   · 문제 칸·답안 칸 이름줄에 각각 «− 80% ＋» — 칸마다 따로, 기기에 기억됨
   · 꾹 누르고 있으면 쭉 내려가고/올라감 (0.35초 뒤부터 0.08초마다 5%씩)
   · 그림 상자(.imgbox) 폭을 줄이는 방식 — 필기 층·여백 자르기는 «좁은 화면» 처럼 그대로 따라옴 */
(function(){
  'use strict';
  const MIN=30, MAX=100, STEP=5;   /* ★ v352 — 30% 까지 */
  const KEY=f=>'prac:ovz:'+f;
  const get=f=>{ let v=100; try{ v=+localStorage.getItem(KEY(f))||100 }catch(e){globalThis.__q?.(e)} return Math.max(MIN,Math.min(MAX,Math.round(v/STEP)*STEP)); };
  const put=(f,v)=>{ try{ localStorage.setItem(KEY(f),String(v)) }catch(e){globalThis.__q?.(e)} };
  const host=f=>f==='q' ? document.getElementById('ovLeft') : document.querySelector('#ovRight .seg[data-seg="a"]');
  const lab=f=>{ const h=host(f); return h && h.querySelector(':scope > .plab'); };

  const st=document.createElement('style');
  st.textContent=`
#ovl [data-gvz] .imgbox{width:calc(var(--gvz,100) * 1%)!important;max-width:100%;margin-left:auto!important;margin-right:auto!important}
#ovl .gvz{display:inline-flex;align-items:center;gap:2px;margin:0 6px;padding:1px 3px;border:1px solid #d3d9e2;border-radius:8px;background:#fff;
  font:700 11px/1 var(--font-m,ui-monospace,monospace);vertical-align:middle;user-select:none;-webkit-user-select:none}
#ovl .gvz button{width:22px;height:22px;padding:0;border:0;border-radius:6px;background:#eef2f7;color:#0f172a;font:800 14px/22px system-ui;cursor:pointer;touch-action:none}
#ovl .gvz button:active,#ovl .gvz button.hold{background:#1d4ed8;color:#fff}
#ovl .gvz button:disabled{opacity:.35;cursor:default}
#ovl .gvz b{min-width:34px;text-align:center;color:#334155}
html body.rd-night #ovl .gvz{background:#1d2a44;border-color:#33415c}
html body.rd-night #ovl .gvz button{background:#26324d;color:#cfe0ff}
html body.rd-night #ovl .gvz b{color:#cfe0ff}`;
  document.head.appendChild(st);

  function apply(f){
    const h=host(f); if(!h) return;
    const v=get(f);
    if(v>=MAX){ h.removeAttribute('data-gvz'); h.style.removeProperty('--gvz'); }
    else { h.setAttribute('data-gvz',''); h.style.setProperty('--gvz',String(v)); }
    const w=lab(f)?.querySelector('.gvz');
    if(w){ const t=v+'%', bb=w.querySelector('b'); if(bb.textContent!==t) bb.textContent=t;   /* 같으면 안 건드림 — 감시(MutationObserver)가 제 손질에 다시 돌지 않게 */
      w.querySelector('[data-z="-1"]').disabled=v<=MIN; w.querySelector('[data-z="1"]').disabled=v>=MAX; }
  }
  function bump(f,d){
    const v=get(f), n=Math.max(MIN,Math.min(MAX,v+d*STEP));
    if(n===v) return false;
    put(f,n); apply(f); return true;
  }
  /* 꾹 누르기 — pointer 로 한 번에 처리 (마우스 · 손가락 · S펜 공통) */
  function holdable(btn,f,d){
    let t1=0,t2=0;
    const stop=()=>{ clearTimeout(t1); clearInterval(t2); t1=t2=0; btn.classList.remove('hold'); };
    btn.addEventListener('pointerdown',e=>{
      e.preventDefault(); e.stopPropagation();
      try{ btn.setPointerCapture(e.pointerId) }catch(x){globalThis.__q?.(x)}
      stop(); btn.classList.add('hold');
      bump(f,d);
      t1=setTimeout(()=>{ t2=setInterval(()=>{ if(!bump(f,d)) stop(); },80); },350);
    });
    ['pointerup','pointercancel','lostpointercapture','pointerleave'].forEach(ev=>btn.addEventListener(ev,stop));
    btn.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); });   /* 이름줄 접기 등으로 번지지 않게 */
    btn.addEventListener('contextmenu',e=>e.preventDefault());                      /* 폰에서 길게 누를 때 메뉴 안 뜨게 */
  }
  function mount(f){
    const l=lab(f); if(!l) return;
    if(!l.querySelector('.gvz')){
      const w=document.createElement('span'); w.className='gvz'; w.title='그림 크기 (30~100%) — 꾹 누르면 쭉';
      w.innerHTML='<button type="button" data-z="-1" aria-label="그림 작게">−</button><b>100%</b><button type="button" data-z="1" aria-label="그림 크게">＋</button>';
      holdable(w.querySelector('[data-z="-1"]'),f,-1);
      holdable(w.querySelector('[data-z="1"]'),f,1);
      ['mousedown','touchstart'].forEach(ev=>w.addEventListener(ev,e=>e.stopPropagation(),{passive:true}));
      const ed=l.querySelector('.edb'); ed ? l.insertBefore(w,ed) : l.appendChild(w);
    }
    apply(f);
  }
  const mountAll=()=>{ try{ mount('q'); mount('a'); }catch(e){globalThis.__q?.(e)} };
  window.__ovZoom={ get, set:(f,v)=>{ put(f,v); apply(f); }, mount:mountAll };
  (function watch(){
    const L=document.getElementById('ovLeft'), R=document.getElementById('ovRight');
    if(!L||!R) return void setTimeout(watch,500);
    let T=0; const mo=new MutationObserver(()=>{ clearTimeout(T); T=setTimeout(mountAll,30); });
    mo.observe(L,{childList:true}); mo.observe(R,{childList:true,subtree:true});
    mountAll();
  })();
})();

/* ★ v352 — 이지뷰(넓은 화면): 문제 칸 ↕ 답안 칸 사이 손잡이로 높이 조절
   · 왼쪽 열의 문제·답안 사이에 가로 손잡이 — 위아래로 끌면 문제 칸 높이가 바뀌고 답안이 나머지를 씀
   · 비율로 기기에 기억 · 두 번 클릭 = 처음 높이 · 단답(solo)은 한 칸이라 손잡이 숨김 */
(function(){
  'use strict';
  const KEY='prac:evd:v1';
  const wide=()=>{ try{ return matchMedia('(min-width:900px)').matches }catch(e){ return innerWidth>=900 } };
  let R=0; try{ R=+localStorage.getItem(KEY)||0 }catch(e){ R=0 }
  const save=()=>{ try{ R? localStorage.setItem(KEY,String(R)) : localStorage.removeItem(KEY) }catch(e){globalThis.__q?.(e)} };
  const ob=()=>document.querySelector('#ovl .ob');
  const st=document.createElement('style');
  st.textContent=`
.evgripd{display:none}
@media(min-width:900px){
  html body.easyview #ovl .ob{grid-template-rows:var(--evd1,fit-content(58%)) 10px minmax(0,1fr)!important}
  html body.easyview #ovl .pane.left{grid-row:1!important}
  html body.easyview #ovl .ob[style*="--evd1"] > .pane.left{min-height:0!important;max-height:none!important;overflow:auto}
  html body.easyview #ovl .pane.right > .seg[data-seg="a"]{grid-column:1;grid-row:3!important}
  html body.easyview #ovl .pane.right > .seg[data-seg="e"]{grid-column:2;grid-row:1 / span 3!important}
  html body.easyview #ovl.solo .pane.left{grid-row:1 / span 3!important}
  html body.easyview #ovl .evgripd{display:flex;grid-column:1;grid-row:2;align-items:center;justify-content:center;cursor:row-resize;touch-action:none;
    -webkit-user-select:none;user-select:none;background:var(--surface-2,#f1f5f9);border-top:1px solid var(--line,#e2e8f0);border-bottom:1px solid var(--line,#e2e8f0);z-index:2}
  html body.easyview #ovl .evgripd:hover i{background:#64748b}
  html body.easyview #ovl .evgripd i{display:block;width:44px;height:4px;border-radius:99px;background:#94a3b8;transition:width .12s,background .12s}
  html body.easyview #ovl .evgripd.on i{width:72px;background:#1d4ed8}
  html body.easyview #ovl.solo .evgripd{display:none!important}
  html body.evdrag, body.evdrag *{-webkit-user-select:none!important;user-select:none!important;cursor:row-resize!important}
}
html body.rd-night #ovl .evgripd{background:#111827;border-color:#33415c}`;
  document.head.appendChild(st);
  function apply(){
    const o=ob(); if(!o) return;
    if(!(wide() && document.body.classList.contains('easyview')) || !R){ o.style.removeProperty('--evd1'); return; }
    const H=o.clientHeight; if(H<100) return;
    const v=Math.max(60, Math.min(H-10-80, Math.round(R*H)))+'px';
    if(o.style.getPropertyValue('--evd1')!==v) o.style.setProperty('--evd1', v);
  }
  let D=null, last=0;
  function mount(){
    const o=ob(); if(!o) return;
    if(!o.querySelector(':scope > .evgripd')){
      const g=document.createElement('div'); g.className='evgripd'; g.setAttribute('role','separator');
      g.title='위아래로 끌어 문제·답안 칸 높이 조절 · 두 번 클릭 = 처음 높이'; g.innerHTML='<i></i>';
      o.appendChild(g);
      g.addEventListener('pointerdown', e=>{
        const now=Date.now();
        if(now-last<320){ R=0; save(); apply(); last=0; return; }
        last=now;
        const L=document.getElementById('ovLeft'); if(!L) return;
        D={ y:e.clientY, h:L.getBoundingClientRect().height, H:o.clientHeight };
        g.classList.add('on'); document.body.classList.add('evdrag');
        try{ g.setPointerCapture(e.pointerId) }catch(x){globalThis.__q?.(x)}
        e.preventDefault();
      });
      g.addEventListener('pointermove', e=>{
        if(!D) return;
        const h=Math.max(60, Math.min(D.H-10-80, D.h+(e.clientY-D.y)));   /* 답안 칸이 최소 80px 은 남게 */
        o.style.setProperty('--evd1', Math.round(h)+'px'); R=h/D.H; e.preventDefault();
      });
      const up=()=>{ if(!D) return; g.classList.remove('on'); document.body.classList.remove('evdrag'); D=null; save(); };
      g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    }
    apply();
  }
  setInterval(()=>{ try{ mount() }catch(e){globalThis.__q?.(e)} }, 600);
  addEventListener('resize', ()=>{ try{ apply() }catch(e){globalThis.__q?.(e)} });
  try{ new MutationObserver(()=>{ try{ apply() }catch(e){globalThis.__q?.(e)} }).observe(document.body,{ attributes:true, attributeFilter:['class'] }); }catch(e){globalThis.__q?.(e)}
})();
