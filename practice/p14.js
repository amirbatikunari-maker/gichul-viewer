/* practice.html 에서 분리 (v341) — 원래 9789번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
  const NAMES = ['문제','답안','쉬운 풀이'];
  const KEY = 'prac:fold3';

  /* 접은 칸은 이 기기에 남는다 — 목록을 다시 그려도 그대로 접혀 있다 */
  let FOLD = {};
  try{ FOLD = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }catch(e){ FOLD = {}; }
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(FOLD)); }catch(e){globalThis.__q?.(e)} };

  const nameOf = lab => {
    const t = (lab.childNodes[0] && lab.childNodes[0].textContent || lab.textContent || '').trim();
    return NAMES.includes(t) ? t : null;
  };
  /* 접을 덩어리 — 이름표를 담고 있는 상자 그 자체다.
     문제·답안은 .pcol, 쉬운 풀이는 .ez, 한눈에 보기는 .pane 또는 .seg. */
  const boxOf = lab => lab.parentElement;

  function applyFold(root){
    $$('.plabel, .ovl .plab', root || document).forEach(lab => {
      const n = nameOf(lab); if(!n) return;
      const box = boxOf(lab); if(!box) return;
      box.classList.toggle('pfold', !!FOLD[n]);
      /* ★ 접힌 칸은 «빈 칸» 처럼 보인다 — 내용이 없는 건지 접힌 건지 알 수 없다.
         눌러서 펴라는 말을 이름표에 남긴다. (답안이 사라진 줄 알았던 그 일) */
      let hint = lab.querySelector('.foldhint');
      if(FOLD[n]){
        if(!hint){
          hint = document.createElement('span');
          hint.className = 'foldhint';
          hint.textContent = '눌러서 펴기';
          lab.insertBefore(hint, lab.querySelector('.edb') || null);
        }
      }else if(hint) hint.remove();
      if(!lab.__fold){
        lab.__fold = 1;
        lab.addEventListener('click', e => {
          if(e.target.closest && e.target.closest('.edb')) return;   /* 고치기 단추는 비켜 준다 */
          e.preventDefault(); e.stopPropagation();
          FOLD[n] = !FOLD[n]; save();
          applyFold();
        });
      }
    });
  }
  window.__pracFold = applyFold;
  /* 밖에서 접힘 상태를 바꿀 수 있게 열어 둔다 (v135 의 «답안 가리개» 가 쓴다) */
  window.__pracFoldSet = function(name, v){
    if(!NAMES.includes(name)) return;
    FOLD[name] = !!v; save(); applyFold();
  };

  /* ══ 처음 켤 때 — 다 보이게, 한 문항씩 ══
     단추를 없앴으니 손으로 못 켠다. 이미 있는 손잡이를 한 번 눌러 상태만 맞춘다
     (그래야 이 기기에 남는 설정까지 같이 맞는다). */
  let done = 0;
  const boot = setInterval(() => {
    if(!$('#list')) return;
    if(done++ > 40){ clearInterval(boot); return; }
    let ok = true;
    try{
      if(typeof HIDE_ALL !== 'undefined' && HIDE_ALL && $('#fAns')) $('#fAns').click();
      else if(typeof HIDE_ALL === 'undefined') ok = false;
      if(typeof EZ_HIDE !== 'undefined' && EZ_HIDE && $('#fEz')) $('#fEz').click();
      if(typeof ONEUP !== 'undefined' && !ONEUP && $('#fOne')) $('#fOne').click();
    }catch(e){ ok = false; }
    if(ok){ clearInterval(boot); applyFold(); }
  }, 200);
  setTimeout(() => clearInterval(boot), 15000);

  applyFold();
  ['#list', '#ovl'].forEach(sel => {
    const wait = setInterval(() => {
      const n = document.querySelector(sel);
      if(!n) return;
      clearInterval(wait);
      new MutationObserver(() => setTimeout(() => applyFold(n), 20))
        .observe(n, { childList:true, subtree:true });
      applyFold(n);
    }, 250);
    setTimeout(() => clearInterval(wait), 20000);
  });
  setInterval(() => applyFold(), 1500);
})();
