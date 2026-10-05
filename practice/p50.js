/* practice.html 에서 분리 (v341) — 원래 19656번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=s=>document.querySelector(s);
const KEY='prac:where:v1';
let restored=false, booted=Date.now();

const subNow=()=>{ try{ return localStorage.getItem('prac:sub')||'' }catch(e){ return '' } };

/* 지금 보고 있는 문항 — 한 문항씩 모드면 그 문항, 목록이면 화면에 걸친 첫 장 */
function hereId(){
  try{
    if(window.ONEUP && Array.isArray(window.SHOWN) && SHOWN[window.ONEAT|0])
      return String(SHOWN[window.ONEAT|0].id);
    for(const c of document.querySelectorAll('#list > .pcard')){
      const b=c.getBoundingClientRect();
      if(b.bottom>72) return String(c.dataset.id||'');
    }
  }catch(e){globalThis.__q?.(e)}
  return '';
}

function save(){
  if(!restored) return;                     /* 되돌리기 전에는 덮어쓰지 않는다 */
  try{
    const v={ s:subNow(),
              y:($('#fYear')?.value||''), ss:($('#fSess')?.value||''),
              q:($('#fQ')?.value||''), id:hereId() };
    if(!v.s) return;
    localStorage.setItem(KEY, JSON.stringify(v));
  }catch(e){globalThis.__q?.(e)}
}
let t=null;
const saveSoon=()=>{ clearTimeout(t); t=setTimeout(save,400); };

/* ── 되돌리기 — 문항이 다 실린 뒤 딱 한 번 ── */
function tryRestore(){
  if(restored) return true;
  if(Date.now()-booted > 30000){ restored=true; return true; }   /* 너무 늦으면 포기 */
  let v=null;
  try{ v=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){globalThis.__q?.(e)}
  if(!v || !v.s){ restored=true; return true; }                  /* 적어 둔 게 없음 */
  if(v.s!==subNow()){ restored=true; return true; }              /* 과목이 바뀌었으면 그냥 둔다 */

  const rows=(()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } })();
  if(!rows.length) return false;                                 /* 아직 안 실렸다 */
  const yEl=$('#fYear'), sEl=$('#fSess');
  if(!yEl||!sEl||yEl.options.length<2) return false;

  /* 거르개를 되돌린다 — 없는 값이면 건너뛴다 */
  const has=(el,val)=>[...el.options].some(o=>o.value===val);
  if(v.y && has(yEl,v.y)) yEl.value=v.y;
  if(v.ss && has(sEl,v.ss)) sEl.value=v.ss;
  if(v.q && $('#fQ')) $('#fQ').value=v.q;

  restored=true;
  try{ if(typeof drawList==='function') drawList(); }catch(e){globalThis.__q?.(e)}

  /* 보던 문항으로 — 목록을 다시 그린 뒤라야 자리를 찾을 수 있다 */
  if(v.id) setTimeout(()=>{
    try{
      const sh=Array.isArray(window.SHOWN)?SHOWN:[];
      const i=sh.findIndex(r=>String(r.id)===String(v.id));
      if(i<0) return;
      if(window.ONEUP && typeof window.showAt==='function') showAt(i);
      else document.querySelector(`#list > .pcard[data-id="${v.id}"]`)
                   ?.scrollIntoView({block:'start'});
    }catch(e){globalThis.__q?.(e)}
  }, 120);
  return true;
}

const iv=setInterval(()=>{ if(tryRestore()) clearInterval(iv); }, 250);
setTimeout(()=>clearInterval(iv), 31000);

/* ── 적어 두기 ── */
['#fYear','#fSess'].forEach(k=>$(k)?.addEventListener('change',saveSoon));
$('#fQ')?.addEventListener('input',saveSoon);
addEventListener('scroll',saveSoon,{passive:true});
document.addEventListener('visibilitychange',()=>{ if(document.hidden) save(); });
addEventListener('pagehide',save);
setInterval(saveSoon,3000);                 /* 넘기기·거르기 어디서 일어나든 놓치지 않게 */
})();
