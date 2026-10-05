/* practice.html 에서 분리 (v341) — 원래 19517번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

/* 실기뷰어 몫만 여기서 등록한다 — 사이트 전체 몫(app-enhance.js)은 이미 등록돼 있다.
   register() 는 이미 있는 id 는 다시 안 넣으니, 두 번 실행돼도 안전하다. */
function registerMine(){
  if(!window.__gkey) return false;
  window.__gkey.register([
    { id:'p-find',   key:'F',     label:'찾기 칸으로 이동',      note:'문항 목록 위 «본문에서 찾기» 칸에 커서를 둔다', group:'실기뷰어' },
    { id:'p-rand',   key:'R',     label:'무작위로 뽑기',         note:'«랜덤» 단추와 같다', group:'실기뷰어' },
    { id:'p-fav',    key:'B',     label:'북마크 켜고 끄기',      note:'지금 보고 있는 문항을 북마크한다', group:'실기뷰어' },
    { id:'p-toggle', key:'Space', label:'답안 가리기 / 보기',    note:'지금 카드의 가림판을 연다', group:'실기뷰어' },
    { id:'p-ok',     key:'1',     label:'맞음으로 기록',         note:'지금 문항을 맞음 처리하고 진도를 올린다', group:'실기뷰어' },
    { id:'p-no',     key:'2',     label:'틀림으로 기록',         note:'지금 문항을 틀림 처리하고 진도를 올린다', group:'실기뷰어' },
    { id:'p-jump',   key:'G',     label:'문항 고르기',           note:'전체 문항을 펼쳐 번호로 바로 이동', group:'실기뷰어' }
  ]);
  return true;
}
{ const b=setInterval(()=>{ if(registerMine()) clearInterval(b); }, 100); setTimeout(()=>clearInterval(b), 10000); }

let OV=null, rec=null;   /* rec: 지금 «키를 누르세요» 상태로 기다리고 있는 단추의 id */
function closeOv(){ if(OV){ OV.remove(); OV=null; rec=null; } }

function render(){
  if(!OV) return;
  const G=window.__gkey; if(!G) return;
  const groups={};
  G.all().forEach(d=>{ (groups[d.group||'기타'] ||= []).push(d); });
  const order=['실기뷰어','전체'];
  const keys=Object.keys(groups).sort((a,b)=>{
    const ia=order.indexOf(a), ib=order.indexOf(b);
    return (ia<0?99:ia)-(ib<0?99:ib);
  });
  const list=$('.skList',OV);
  list.innerHTML=keys.map(g=>{
    return `<div class="skGrp">${g==='전체'?'사이트 전체':g}</div>`
      + groups[g].map(d=>{
        const row=G.row(d.id);
        const on=row.on!==false;
        const showKey = rec===d.id ? '키를…' : (row.mod==='ctrl' ? 'Ctrl+'+(row.key||'') : (row.key||'—'));
        return `<div class="skRow" data-row="${d.id}">
          <span class="skKey${rec===d.id?' rec':''}" data-keybtn="${d.id}" title="눌러서 이 단축키의 키를 바꿉니다">${showKey}</span>
          <span class="skLab">${d.label}<small>${d.note||''}</small></span>
          <button type="button" class="skSw ${on?'on':''}" data-sw="${d.id}" aria-label="${d.label} 켜고 끄기"><i></i></button>
        </div>`;
      }).join('');
  }).join('');

  $$('.skSw',list).forEach(b=>b.onclick=()=>{
    const id=b.dataset.sw;
    G.setOn(id, G.row(id).on===false);
    b.classList.toggle('on', G.row(id).on!==false);
  });
  $$('[data-keybtn]',list).forEach(b=>b.onclick=()=>{
    rec = (rec===b.dataset.keybtn) ? null : b.dataset.keybtn;
    render();
  });
}

function openOv(){
  closeOv();
  registerMine();
  const G=window.__gkey;
  OV=document.createElement('div');
  OV.className='skOv on';
  OV.innerHTML=`<div class="skBox">
    <div class="skTop"><b>⌨ 단축키</b><span class="sp"></span>
      <button type="button" data-close>닫기 (Esc)</button></div>
    <div class="skBulk">
      <button type="button" data-all-on>전체 켜기</button>
      <button type="button" data-all-off>전체 끄기</button>
      <span class="skMsg">키 배지를 누르고 원하는 키를 누르면 바뀝니다</span>
    </div>
    <div class="skList"></div>
  </div>`;
  document.body.appendChild(OV);
  render();

  $('[data-close]',OV).onclick=closeOv;
  OV.addEventListener('click', e=>{ if(e.target===OV) closeOv(); });
  $('[data-all-on]',OV).onclick=()=>{ if(G) G.all().forEach(d=>G.setOn(d.id,true)); render(); };
  $('[data-all-off]',OV).onclick=()=>{ if(G) G.all().forEach(d=>G.setOn(d.id,false)); render(); };
}
window.__pracShortcutsOpen = openOv;   /* 오른쪽 아래 +(도구) 버튼에서도 열 수 있게 */

document.addEventListener('keydown', e=>{
  if(!OV) return;
  if(e.key==='Escape'){ e.preventDefault(); if(rec){ rec=null; render(); } else closeOv(); return; }
  if(!rec) return;
  /* 키를 기다리는 중 — Tab·Shift 같은 보조 키는 무시하고, 실제 키 하나를 받는다 */
  if(['Shift','Control','Alt','Meta','Tab'].includes(e.key)) return;
  e.preventDefault();
  const G=window.__gkey; if(!G) return;
  const id=rec, newKey = e.code==='Space' ? 'Space' : e.key.toUpperCase();
  /* 겹치는 다른(켜진) 단축키가 있으면 알려만 주고, 그래도 바꿔 준다 */
  const clash = G.all().find(d=>d.id!==id && G.row(d.id).on!==false
    && (G.row(d.id).key||'').toUpperCase()===newKey.toUpperCase());
  G.setKey(id, newKey);
  rec=null; render();
  const msg=$('.skMsg',OV);
  if(msg) msg.textContent = clash ? `«${clash.label}» 도 같은 키를 씁니다 — 겹칩니다.` : '키를 바꿨습니다.';
}, true);

/* 아래 이동줄(#pnav)의 «🔢 고르기» 옆에 «⌨» 를 나란히 붙인다 — 새 줄 없이 한 줄로 */
function ensureBtn(){
  const nav=$('#pnav'); if(!nav || $('#pnavShortcuts',nav)) return;
  const b=document.createElement('button');
  b.type='button'; b.className='zb'; b.id='pnavShortcuts';
  b.title='단축키 보기 · 켜고 끄기';
  b.textContent='⌨';
  b.onclick=openOv;
  nav.appendChild(b);
}
const boot=setInterval(()=>{ if($('#pnav')){ ensureBtn(); clearInterval(boot); } }, 250);
setTimeout(()=>clearInterval(boot), 20000);
})();
