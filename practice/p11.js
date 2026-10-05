/* practice.html 에서 분리 (v341) — 원래 8925번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

  /* «자동 변환» 탭이 불러 쓸 때는 곧바로 표시를 달아 둔다.
     예전에는 로그인까지 끝난 뒤(boot)에야 달려서, 그 사이에 자료함·PDF 칸이 숨어 버렸다. */
  try{ if(/[?&]only=import/.test(location.search)) document.body.classList.add('onlyimport'); }catch(e){globalThis.__q?.(e)}

  /* 저장해 둔 필기 설정을 되살린다 */
  try{
    const w=localStorage.getItem('prac:inkw'); if(w) window.__inkW=+w;
    const po=localStorage.getItem('prac:inkpen'); if(po==='0') window.__inkPenOnly=false;
  }catch(e){globalThis.__q?.(e)}
  if(window.__inkW==null) window.__inkW=2.6;

  /* ── 문항줄을 «가운데» 로 맞춘다 ─────────────────────────────
     scrollIntoView 는 «화면 안에만 들어오면» 멈춰서 지금 칸이 구석에 붙었다.
     직접 재서 한가운데로 밀어 준다. */
  function centerRail(sc, now, smooth){
    if(!sc||!now) return;
    const want = now.offsetLeft - (sc.clientWidth - now.offsetWidth)/2;
    const max = sc.scrollWidth - sc.clientWidth;
    const to = Math.max(0, Math.min(max, Math.round(want)));
    if(Math.abs(sc.scrollLeft - to) < 2) return;
    try{ sc.scrollTo({left:to, behavior: smooth ? 'smooth':'auto'}); }
    catch(e){ sc.scrollLeft = to; }
  }
  function centerAll(smooth){
    const r=$('#prail'); centerRail(r, r&&r.querySelector('.pb.now'), smooth);
    const o=$('#ovrS');  centerRail(o, o&&o.querySelector('.pb.now'), smooth);
  }
  window.__railCenter=centerAll;

  const rail=$('#prail');
  if(rail) new MutationObserver(()=>{ setTimeout(()=>centerAll(true),30); })
    .observe(rail,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  const boot=setInterval(()=>{ if($('#ovrS')){ clearInterval(boot);
    new MutationObserver(()=>setTimeout(()=>centerAll(true),30))
      .observe($('#ovrS'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }},300);
  setTimeout(()=>clearInterval(boot),20000);
  addEventListener('resize',()=>centerAll(false));
  setInterval(()=>centerAll(true),1500);

  /* «문제 풀이» 접기 머리를 없앴으니 항상 펴 둔다 */
  const openBox=()=>{ const b=$('#boxView'); if(b&&!b.classList.contains('open')) b.classList.add('open'); };
  openBox(); setInterval(openBox,1200);
})();
