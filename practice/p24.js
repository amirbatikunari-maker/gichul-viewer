/* practice.html 에서 분리 (v341) — 원래 13112번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const ovlOpen=()=>!!document.getElementById('ovl')?.classList.contains('on');

/* ② 다시 그리기 문지기 */
let pending=false, stamps=[];
function later(){
  if(pending) return; pending=true;
  const tick=()=>{
    if(ovlOpen()) return setTimeout(tick,400);   /* 판이 닫힐 때까지 기다린다 */
    pending=false;
    try{ window.drawList&&window.drawList() }catch(e){globalThis.__q?.(e)}
  };
  setTimeout(tick,300);
}
window.__pracRedraw=function(){
  if(ovlOpen()) return later();
  try{ window.drawList&&window.drawList() }catch(e){globalThis.__q?.(e)}
};

/* 되풀이 끊기 — 어떤 길로 들어와도 여기서 걸린다 */
const wrap=setInterval(()=>{
  if(typeof window.drawList!=='function'||window.drawList.__guard) return;
  clearInterval(wrap);
  const inner=window.drawList;
  const guarded=function(){
    const now=Date.now();
    stamps=stamps.filter(t=>now-t<1500);
    if(stamps.length>=8){
      try{ window.__pracTrouble&&window.__pracTrouble('목록 다시 그리기가 되풀이되어 끊었습니다',
            new Error('redraw loop')) }catch(e){globalThis.__q?.(e)}
      stamps=[]; return;
    }
    stamps.push(now);
    return inner.apply(this,arguments);
  };
  guarded.__guard=1; guarded.__tag=inner.__tag;
  window.drawList=guarded;
},300);
setTimeout(()=>clearInterval(wrap),20000);

/* «한눈에» 가 닫히면 미뤄 둔 것을 한 번만 그린다 */
const w0=setInterval(()=>{
  const o=document.getElementById('ovl'); if(!o) return; clearInterval(w0);
  new MutationObserver(()=>{ if(!o.classList.contains('on')&&pending) later(); })
    .observe(o,{attributes:true,attributeFilter:['class']});
},300);
setTimeout(()=>clearInterval(w0),20000);
})();
