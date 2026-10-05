/* practice.html 에서 분리 (v341) — 원래 13828번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const cur=()=>{ try{ return (typeof OVID!=='undefined'&&OVID)?String(OVID):null }catch(e){ return null } };
const card=()=>{ const id=cur(); return id?document.querySelector(`#list > .pcard[data-id="${id}"]`):null };

/* 카드 안의 «진짜» 단추를 찾아 대신 눌러 준다 — 새 길을 만들지 않는다 */
function hit(sel){
  const c=card(); if(!c) return false;
  const b=c.querySelector(sel); if(!b) return false;
  b.click(); return true;
}

const ACTS=[
  { k:'pen',  ico:'✍', t:'필기',   title:'필기 켜기 / 끄기' },
  { k:'ai',   ico:'🤖', t:'AI',    title:'AI 에게 묻기' },
  { k:'fav',  ico:'☆',  t:'북마크', title:'이 문항 북마크' },
  { k:'ok',   ico:'＋',  t:'회독',   title:'회독 +1 (풀었음) 하고 다음 문항 — 틀렸으면 옆 ✕ 틀림' },
  { k:'no',   ico:'✕',  t:'틀림',   title:'틀림으로 기록하고 다음 문항' },
  { k:'lab',  ico:'⛶',  t:'기능',   title:'한눈에 겹 켜기 · 검증' }
];

function build(){
  const head=$('#ovl .oh'); if(!head||$('.ovacts',head)) return false;
  const box=document.createElement('div'); box.className='ovacts';
  box.innerHTML=ACTS.map(a=>
    `<button type="button" data-ova="${a.k}" class="${a.k}" title="${a.title}">`
    + `${a.ico}<span class="t"> ${a.t}</span></button>`).join('');
  /* «닫기» 앞에 끼워 넣는다 — 닫기는 늘 맨 끝이어야 손이 안 헷갈린다 */
  const close=$('#ovClose',head);
  close ? head.insertBefore(box,close) : head.appendChild(box);

  box.addEventListener('click',e=>{
    const b=e.target.closest('[data-ova]'); if(!b) return;
    e.preventDefault(); e.stopPropagation();
    const k=b.dataset.ova;
    try{
      if(k==='pen'){
        const bar=document.querySelector('.pbar');
        if(bar&&!bar.classList.contains('mini')) bar.querySelector('[data-off]')?.click();
        else bar?.querySelector('.fab')?.click();
        return sync();
      }
      if(k==='ai'){ document.querySelector('.aic-fab')?.click(); return; }
      if(k==='lab'){ (window.__ovLab||function(){})(); return; }
      if(k==='fav'){ hit('[data-study-fav]'); return setTimeout(sync,60); }
      if(k==='ok'||k==='no'){
        /* 카드가 화면에 없으면(창 밖) 기록만 하고 넘어간다 */
        let done=hit(`[data-result="${k}"]`);
        /* ★ v304 — 미니맵·분류판으로 연 먼 문항은 목록에 카드가 없다(앞뒤 12장만 그림) → 기록 함수로 바로 */
        if(!done && cur() && typeof window.__pracBump==='function'){ window.__pracBump(cur(), k); done=true; }
        if(!done) return alert('이 문항 카드가 화면에 없어 기록하지 못했습니다. 판을 닫고 눌러 주세요.');
        setTimeout(sync,60);
        setTimeout(()=>{ $('#ovNext')?.click() },220);   /* 기록했으면 다음 문항으로 */
        return;
      }
    }catch(x){ try{ window.__pracTrouble&&window.__pracTrouble('한눈에 기능 단추',x) }catch(y){globalThis.__q?.(y)} }
  });
  return true;
}

/* 지금 상태를 단추에 비춘다 — 지켜보지 않고, 판이 열려 있을 때만 가끔 본다 */
function sync(){
  const head=$('#ovl .oh'); if(!head) return;
  const box=$('.ovacts',head); if(!box) return;
  const on=(k,v)=>box.querySelector(`[data-ova="${k}"]`)?.classList.toggle('on',!!v);
  try{
    on('pen', document.body.classList.contains('inkon'));
    const c=card();
    const f=c?.querySelector('[data-study-fav]');
    const favOn=!!f&&f.classList.contains('on');
    on('fav', favOn);
    const b=box.querySelector('[data-ova="fav"]');
    if(b) b.firstChild.nodeValue = favOn ? '★' : '☆';
    /* 이 문항을 이미 체크했는지 — 진도 자루에서 바로 읽는다 */
    let p=null; try{ p=(window.__pracProg&&window.__pracProg())[cur()] }catch(x){globalThis.__q?.(x)}
    on('ok', p&&p.r==='ok');
    on('no', p&&p.r==='no');
    /* ★ v284 — 맞힌 횟수 뱃지 (몇 회독째인지) */
    const okb=box.querySelector('[data-ova="ok"]');
    if(okb){ const n=window.__pracChkN?window.__pracChkN(cur()):0, o=window.__pracOkN?window.__pracOkN(cur()):0;
      if(n) okb.dataset.cnt=`${n}회·✓${o}`; else delete okb.dataset.cnt; }
  }catch(x){globalThis.__q?.(x)}
}

/* 붙이기 — 판이 있을 때 한 번만. 그 뒤로는 판이 열릴 때마다 상태만 맞춘다. */
const boot=setInterval(()=>{ if(build()) clearInterval(boot); },400);
setTimeout(()=>clearInterval(boot),20000);

/* 시계는 하나만 — 판이 닫혀 있으면 아무 일도 하지 않는다 */
let was=false, tick=0;
setInterval(()=>{
  const open=document.body.classList.contains('ovlopen');
  if(!open){ was=false; return; }
  if(!was){ was=true; return setTimeout(sync,80); }
  if(++tick%3===0) sync();          /* 열려 있는 동안 2초에 한 번쯤 맞춘다 */
},700);

/* 이전·다음으로 옮기면 문항이 바뀌므로 다시 맞춘다 */
['#ovPrev','#ovNext'].forEach(sel=>{
  const w=setInterval(()=>{ const b=$(sel); if(!b) return; clearInterval(w);
    b.addEventListener('click',()=>setTimeout(sync,180)); },400);
  setTimeout(()=>clearInterval(w),20000);
});
})();
