/* practice.html 에서 분리 (v341) — 원래 15316번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const KEY='prac:read:v1';
const THEMES=[['paper','종이'],['plain','기본'],['night','밤'],['code','코드']];
let V=(()=>{ try{ return Object.assign({on:true,th:'paper'},JSON.parse(localStorage.getItem(KEY)||'{}')) }
             catch(e){ return {on:true,th:'paper'} } })();
function apply(){
  const b=document.body; if(!b) return;
  b.classList.toggle('rd-on',!!V.on);
  THEMES.forEach(([k])=>b.classList.toggle('rd-'+k, V.on && V.th===k));
  document.querySelectorAll('.rdsw [data-th]').forEach(x=>x.classList.toggle('on',V.on&&x.dataset.th===V.th));
  document.querySelectorAll('.rdsw [data-rdoff]').forEach(x=>x.classList.toggle('on',!V.on));
}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(V)) }catch(e){globalThis.__q?.(e)} }

/* «답 : 100[MVA]» 같은 줄을 찾아 노랗게 — 먼저 보이는 것이 답이어야 한다 */
function markAns(root){
  (root||document).querySelectorAll('.ez p, .easybox p, .qmd p').forEach(p=>{
    if(p.dataset.ansd) return;
    p.dataset.ansd='1';
    const t=(p.textContent||'').trim();
    if(/^(?:[▶►▷▸‣·•\-–—]\s*)?답\s*[:：]/.test(t)||/^\s*답\s*$/.test(t)) p.classList.add('ansline');
  });
}
const boot=setInterval(()=>{
  if(!document.body) return;
  apply(); markAns();
  /* ★ v197 — 붙일 자리를 못 찾아 «읽기» 고르개가 아예 안 나오던 것.
     예전에는 .deck .dcol-view 또는 .cvbar 만 봤는데, 폰 화면에는 둘 다 없다.
     그래서 폰에서는 결을 바꿀 길이 없었다(껍데기가 깔아 둔 어두운 색 그대로).
     이제 «📌 그림 크기 고정» 이 있는 칩 줄 → 자물쇠 줄 순으로 물러서며 찾는다 —
     이 둘은 폰에서도 늘 있다. */
  const host=document.querySelector('.deck .dcol-view')
          || document.querySelector('.cvbar')?.parentElement
          || document.getElementById('fImgFix')?.parentElement
          || document.getElementById('lockSet')?.parentElement;
  if(host&&!document.querySelector('.rdsw')){
    const w=document.createElement('div'); w.className='rdsw';
    w.innerHTML=`<span style="font:700 9px/1 var(--font-m);letter-spacing:.1em;color:var(--ink-2)">읽기</span>`
      + THEMES.map(([k,n])=>`<button type="button" data-th="${k}">${n}</button>`).join('')
      + `<button type="button" data-rdoff>예전</button>`;
    host.appendChild(w);
    w.addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b) return;
      if(b.hasAttribute('data-rdoff')) V.on=false;
      else { V.on=true; V.th=b.dataset.th; }
      save(); apply();
    });
    apply();
    clearInterval(boot);
  }
},600);
setTimeout(()=>clearInterval(boot),25000);

const w=setInterval(()=>{ const l=document.getElementById('list'); if(!l) return; clearInterval(w);
  new MutationObserver(()=>setTimeout(()=>markAns(l),60)).observe(l,{childList:true}); markAns(l); },400);
setTimeout(()=>clearInterval(w),20000);
setInterval(()=>{ const o=document.getElementById('ovl');
  if(o&&o.classList.contains('on')) markAns(o); },1500);

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
})();
