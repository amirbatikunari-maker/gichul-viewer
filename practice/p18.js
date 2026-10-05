/* practice.html 에서 분리 (v341) — 원래 11102번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const ovlOn=()=>!!$('#ovl')?.classList.contains('on');

/* ── ① 가로 손짓 ── */
let SW=null;
function body(){ return $('#ovl .ob') }
function attach(){
  const ovl=$('#ovl'); if(!ovl||ovl.__sw) return false;
  ovl.__sw=1;

  ovl.addEventListener('pointerdown',e=>{
    if(!ovlOn()||!OVFLAG('swipe')) return;
    /* 글자를 고르는 중 · 필기 중 · 단추 위에서는 넘기지 않는다 */
    if(document.body.classList.contains('inkon')) return;
    if(e.target.closest('button,a,input,select,textarea,canvas,.annbar,.annpop,.aix-panel,.ovdock,.ovpop')) return;
    if(e.pointerType==='mouse' && e.button!==0) return;
    if(e.pointerType==='mouse' && e.target.closest('.qmd,.easybox,.ez,.otx,p,li,td,th,h4')) return;
    SW={ x:e.clientX, y:e.clientY, id:e.pointerId, lock:null };
  },{passive:true});

  ovl.addEventListener('pointermove',e=>{
    if(!SW||e.pointerId!==SW.id) return;
    const dx=e.clientX-SW.x, dy=e.clientY-SW.y;
    if(SW.lock===null){
      if(Math.abs(dx)<18&&Math.abs(dy)<18) return;
      SW.lock=Math.abs(dx)>Math.abs(dy)*1.4?'h':'v';
      /* ★ 예전에는 #ovl 에 붙였다. 그런데 #ovl 의 class 를 지켜보는 감시자가 아홉이라,
         손가락을 밀 때마다 수식 그리기·주석 다시 칠하기까지 통째로 깨어났다.
         body 에 붙이면 아무도 안 깬다. */
      if(SW.lock==='h') document.body.classList.add('ovswiping');
    }
    if(SW.lock!=='h') return;
    e.preventDefault();
    const b=body(); if(b) b.style.transform=`translateX(${dx*.4}px)`;
  },{passive:false});

  const end=e=>{
    if(!SW||(e.pointerId!=null&&e.pointerId!==SW.id)) return;
    const dx=(e.clientX??SW.x)-SW.x, lock=SW.lock;
    SW=null;
    const ovl=$('#ovl'); document.body.classList.remove('ovswiping');
    const b=body(); if(b) b.style.transform='';
    if(lock!=='h'||Math.abs(dx)<64) return;
    /* 왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전 — 위쪽 단추와 같은 것을 누른다 */
    (dx<0?$('#ovNext'):$('#ovPrev'))?.click();
  };
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>ovl.addEventListener(t,end,{passive:true}));
  return true;
}

/* ── ③ 뒤로 가기는 «판 닫기» 로 ── */
let MARK=false;
function watch(){
  const ovl=$('#ovl'); if(!ovl) return;
  new MutationObserver(()=>{
    const on=ovl.classList.contains('on');
    if(!OVFLAG('back')) return;
    if(on&&!MARK){
      MARK=true;
      try{ history.pushState({ovl:1},''); }catch(e){globalThis.__q?.(e)}
    }else if(!on&&MARK){
      MARK=false;
      /* ★ 예전에는 여기서 history.back() 을 불러 «남은 발자국» 을 걷어냈다.
         그런데 판이 닫히는 길이 여럿(단추 · 뒤로 · Esc)이라 타이밍이 어긋나면
         그 back() 이 앞 화면(필기뷰어)으로 되돌아가 버렸다. 발자국 하나는 그냥 둔다. */
    }
  }).observe(ovl,{attributes:true,attributeFilter:['class']});
}
addEventListener('popstate',()=>{
  if(!ovlOn()||!OVFLAG('back')) return;
  MARK=false;
  $('#ovClose')?.click();
});

const boot=setInterval(()=>{ if(attach()){ watch(); clearInterval(boot); } },200);
setTimeout(()=>clearInterval(boot),20000);
})();
