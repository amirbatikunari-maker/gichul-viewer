/* practice.html 에서 분리 (v341) — 원래 12957번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);

/* ══ ① 음악은 한 벌로 ══
   위쪽 «♪ 음악» · 한눈에 도크의 ♪ 를 누르면 아래쪽 배경음 창이 열린다.
   잡는 단계에서 가로채므로 옛 차림표는 뜨지 않는다. */
function openMusic(){
  if(window.Music&&window.Music.open){ window.Music.open(); return true }
  const fab=$('.mus-fab'); if(fab){ fab.click(); return true }
  return false;
}
document.addEventListener('click',e=>{
  const t=e.target;
  const hit=t.closest?.('#bgmBtn, .ovdock [data-d="music"], [data-od="music"]');
  if(!hit) return;
  if(!openMusic()) return;                      /* 배경음 창이 아직 없으면 옛것을 그대로 둔다 */
  e.preventDefault(); e.stopPropagation();
  document.querySelector('.bgm')?.classList.remove('open');
  document.querySelector('#ovPop')?.classList.remove('on');
},true);

/* 위쪽 단추 글씨는 아래의 «한 개짜리 시계» 가 같이 맞춘다 */
function syncMusicLabel(){
  const txt=$('#bgmTxt'), btn=$('#bgmBtn'); if(!txt||!window.Music) return;
  const cur=window.Music.current;
  const name=cur&&cur!=='off'
    ? (window.Music.tracks||[]).find(t=>t.id===cur)?.name || '켜짐' : '';
  txt.textContent=name||'음악';
  btn?.classList.toggle('on',!!name);
}

/* ══ ② 동그라미 한 곳에 ══ */
const ITEMS=[
  { k:'pen',   ico:'✍', t:'필기 (S펜)' },
  { k:'ai',    ico:'🤖', t:'AI 대화' },
  { k:'music', ico:'♪',  t:'배경음' },
  { k:'fav',   ico:'☆',  t:'즐겨찾기' },
  { k:'top',   ico:'↑',  t:'맨 위로' },
  { k:'jump',  ico:'🔢', t:'문항 고르기' },
  { k:'keys',  ico:'⌨',  t:'단축키' },
  { k:'menu',  ico:'⌘',  t:'전체 메뉴' }
];
const dock=document.createElement('div');
dock.className='odock';
dock.innerHTML=`<button type="button" class="od-main" title="도구 펴기/접기" aria-label="도구"><span class="ic">✛</span></button>
  <div class="od-items">${ITEMS.map(i=>
    `<button type="button" data-od="${i.k}" title="${i.t}" aria-label="${i.t}"><span class="ic">${i.ico}</span></button>`).join('')}</div>`;
document.body.appendChild(dock);

const wide=()=>matchMedia('(min-width:1000px)').matches;
if(wide()) dock.classList.add('open');

/* «한눈에» 를 열면 접는다 — 그 판은 판대로 왼쪽에 제 도크가 있다 */
const ovl=()=>document.getElementById('ovl');
const w0=setInterval(()=>{
  const o=ovl(); if(!o) return; clearInterval(w0);
  new MutationObserver(()=>{
    if(o.classList.contains('on')) dock.classList.remove('open');
    else if(wide()) dock.classList.add('open');
  }).observe(o,{attributes:true,attributeFilter:['class']});
},300);
setTimeout(()=>clearInterval(w0),20000);

let shut=0;
function autoshut(){
  clearTimeout(shut);
  if(wide()) return;
  shut=setTimeout(()=>dock.classList.remove('open'),5000);
}
dock.querySelector('.od-main').addEventListener('click',e=>{
  e.stopPropagation();
  dock.classList.toggle('open');
  autoshut();
});
document.addEventListener('pointerdown',e=>{
  if(wide()||e.target.closest('.odock')) return;
  dock.classList.remove('open');
},true);

/* 하는 일은 원래 있던 단추들이 그대로 한다 — 우리는 대신 눌러 줄 뿐이다 */
dock.addEventListener('click',e=>{
  const b=e.target.closest('[data-od]'); if(!b) return;
  e.stopPropagation();
  autoshut();
  const k=b.dataset.od;
  try{
    if(k==='pen'){
      const bar=document.querySelector('.pbar');
      if(bar&&!bar.classList.contains('mini')) bar.querySelector('[data-off]')?.click();
      else bar?.querySelector('.fab')?.click();
      return;
    }
    if(k==='ai'){ document.querySelector('.aic-fab')?.click(); return; }
    if(k==='music'){ openMusic(); return; }        /* 위의 가로채기가 먼저 잡아 준다 */
    if(k==='fav'){ document.querySelector('.app-float [data-favorite]')?.click(); return; }
    if(k==='top'){ scrollTo({top:0,behavior:'smooth'}); return; }
    if(k==='menu'){ (window.openCmd||function(){})(); return; }
    if(k==='keys'){ (window.__pracShortcutsOpen||function(){})(); return; }
    if(k==='jump'){ (window.__pracJumpOpen||function(){})(); return; }
  }catch(x){ try{ window.__pracTrouble&&window.__pracTrouble('도구 도크',x) }catch(y){globalThis.__q?.(y)} }
});

/* 시계는 하나만 돌린다 — 켜져 있는 것 표시 + 위쪽 음악 글씨를 같이 맞춘다 */
setInterval(()=>{
  try{
    const on=(k,v)=>dock.querySelector(`[data-od="${k}"]`)?.classList.toggle('on',!!v);
    on('pen', document.body.classList.contains('inkon'));
    on('music', window.Music ? (window.Music.current&&window.Music.current!=='off')
                             : (window.BGM&&window.BGM.mode!=='off'));
    on('fav', document.querySelector('.app-float [data-favorite]')?.textContent==='★');
    syncMusicLabel();
  }catch(e){globalThis.__q?.(e)}
},1200);

/* 없는 단추는 아예 안 보여 준다 (화면마다 있는 것이 다르다) */
setTimeout(()=>{
  const gone=k=>dock.querySelector(`[data-od="${k}"]`)?.remove();
  if(!document.querySelector('.pbar')) gone('pen');
  if(!document.querySelector('.aic-fab')) gone('ai');
  if(!window.Music&&!document.querySelector('.mus-fab')) gone('music');
  if(!document.querySelector('.app-float [data-favorite]')) gone('fav');
  if(!window.openCmd) gone('menu');
  if(!window.__pracShortcutsOpen) gone('keys');
  if(!window.__pracJumpOpen) gone('jump');
},2500);
})();
