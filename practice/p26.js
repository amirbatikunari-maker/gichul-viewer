/* practice.html 에서 분리 (v341) — 원래 13407번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const SAFE0=/[?&]safe=1/.test(location.search);
let SAFE=SAFE0;

const tip=document.createElement('div');
tip.className='ovsafe';
tip.innerHTML=`<span data-msg>한눈에 보기가 늦어집니다…</span>
  <button type="button" data-go>안전 모드로 다시 열기</button>
  <button type="button" data-x>닫기</button>`;
document.body.appendChild(tip);
tip.querySelector('[data-x]').onclick=()=>tip.classList.remove('on');
tip.querySelector('[data-go]').onclick=()=>{
  SAFE=true; document.body.classList.add('ovsafemode');
  tip.classList.remove('on');
  try{ ovDraw() }catch(e){globalThis.__q?.(e)}
  say('안전 모드로 열었습니다 — 주석 다시 칠하기 · 여백 자르기 · 그림 오리기를 껐습니다.');
};
function show(msg){
  tip.querySelector('[data-msg]').textContent=msg;
  tip.classList.add('on');
}
function say(t){ try{ const el=$('#cvStat'); if(el) el.textContent=t }catch(e){globalThis.__q?.(e)} }

/* ① 여는 길을 감싼다 */
const wrap=setInterval(()=>{
  if(typeof window.ovOpen!=='function'||window.ovOpen.__safe) return;
  clearInterval(wrap);

  const o0=window.ovOpen, d0=window.ovDraw;
  const guardedOpen=function(id){
    const t0=performance.now();
    let late=setTimeout(()=>show('한눈에 보기가 2.5초 넘게 걸립니다 — 무언가 걸린 것 같습니다.'),2500);
    try{
      return o0.apply(this,arguments);
    }catch(e){
      try{ $('#ovl')?.classList.remove('on'); document.body.classList.remove('ovlopen') }catch(x){globalThis.__q?.(x)}
      say('한눈에 보기를 열지 못했습니다 — '+((e&&e.message)||e));
      show('한눈에 보기를 열지 못했습니다: '+String((e&&e.message)||e).slice(0,60));
      try{ console.error('[ovOpen]',e) }catch(x){globalThis.__q?.(x)}
    }finally{
      clearTimeout(late);
      const ms=Math.round(performance.now()-t0);
      if(ms>1200) say(`한눈에 보기를 여는 데 ${ms}ms 걸렸습니다.`);
    }
  };
  guardedOpen.__safe=1; window.ovOpen=guardedOpen;

  if(typeof d0==='function'){
    const guardedDraw=function(){
      try{ return d0.apply(this,arguments); }
      catch(e){
        say('한눈에 내용을 그리지 못했습니다 — '+((e&&e.message)||e));
        try{ console.error('[ovDraw]',e) }catch(x){globalThis.__q?.(x)}
      }
    };
    guardedDraw.__safe=1; window.ovDraw=guardedDraw;
  }
},250);
setTimeout(()=>clearInterval(wrap),20000);

/* ② 안전 모드 — 판 위에서 도는 무거운 것들을 끈다 */
function offHeavy(){
  if(!SAFE) return false;
  return true;
}
const patch=setInterval(()=>{
  if(typeof window.applySqueeze!=='function'||window.applySqueeze.__safe) return;
  clearInterval(patch);
  const s0=window.applySqueeze, t0=window.applyTrim, f0=window.figFill, r0=window.__pracAnnRepaint;
  const skip=async()=>{};
  const mk=(fn)=>{ const g=function(root){
      if(SAFE&&root&&root.id==='ovl') return skip();
      if(SAFE&&root&&root.closest&&root.closest('#ovl')) return skip();
      return fn.apply(this,arguments); };
    g.__safe=1; return g };
  if(typeof s0==='function') window.applySqueeze=mk(s0);
  if(typeof t0==='function') window.applyTrim=mk(t0);
  if(typeof f0==='function'){
    const g=function(root,url){
      if(SAFE&&root&&root.closest&&root.closest('#ovl')) return Promise.resolve();
      return f0.apply(this,arguments); };
    g.__safe=1; window.figFill=g;
  }
  if(typeof r0==='function'){
    const g=function(){
      if(SAFE&&$('#ovl')?.classList.contains('on')) return;
      return r0.apply(this,arguments); };
    g.__safe=1; window.__pracAnnRepaint=g;
  }
},250);
setTimeout(()=>clearInterval(patch),20000);

if(SAFE0){ document.body.classList.add('ovsafemode');
  setTimeout(()=>say('안전 모드(?safe=1)로 열렸습니다 — 한눈에 판의 무거운 손질을 껐습니다.'),1500); }

window.__ovSafe=v=>{ SAFE=!!v; document.body.classList.toggle('ovsafemode',SAFE); };
})();
