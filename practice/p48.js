/* practice.html 에서 분리 (v341) — 원래 19372번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rows=()=>{ try{ return Array.isArray(window.SHOWN)?window.SHOWN:[] }catch(e){ return [] } };
const at=()=>{ try{ return window.ONEAT|0 }catch(e){ return 0 } };
const prog=()=>{ try{ return (window.__pracProg && window.__pracProg())||{} }catch(e){ return {} } };

let OV=null;
function closeOv(){ if(OV){ OV.remove(); OV=null; } }

function openOv(){
  const rs=rows(); if(!rs.length) return;
  closeOv();
  const now=at(), P=prog();
  const CH=20;
  let body='';
  for(let s0=0; s0<rs.length; s0+=CH){
    const part=rs.slice(s0, s0+CH);
    body += `<div class="pjsec"><div class="pjhead">${s0+1} – ${s0+part.length}번째</div><div class="pjgrid">`
      + part.map((r,k)=>{
          const i=s0+k, p=P[String(r.id)];
          const cls=[i===now?'now':'', p?.r==='ok'?'ok':'', p?.r==='no'?'no':''].filter(Boolean).join(' ');
          return `<button type="button" class="pjb ${cls}" data-i="${i}" data-y="${r.year}" title="${r.year}년 제${r.session}회 ${r.no}번 · ${i+1}번째">${r.year%100}-${r.session} ${r.no}</button>`;
        }).join('')
      + `</div></div>`;
  }
  const done = rs.filter(r=>P[String(r.id)]).length;

  OV=document.createElement('div');
  OV.className='pjumpov on';
  OV.innerHTML=`<div class="pjbox">
    <div class="pjtop"><b>문항 고르기</b>
      <span class="pjstat">${rs.length}문항 · 체크 ${done} · 지금 ${now+1}번째</span>
      <button type="button" data-close>닫기 (Esc)</button></div>
    <div class="pjfind">
      <input id="pjNum" type="number" inputmode="numeric" min="1" max="${rs.length}" placeholder="몇 번째로 갈까요? (1~${rs.length})">
      <button type="button" id="pjGo">가기</button>
      <span class="pjlegend"><i class="ok"></i>맞음 <i class="no"></i>틀림</span>
    </div>
    <div class="pjbody">${body}</div>
  </div>`;
  document.body.appendChild(OV);

  $('[data-close]',OV).onclick=closeOv;
  OV.addEventListener('click', e=>{ if(e.target===OV) closeOv(); });
  $$('.pjb',OV).forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i; closeOv();
    if(typeof window.showAt==='function') window.showAt(i);
  });
  const go=()=>{
    const n=+$('#pjNum',OV).value;
    if(!n || n<1 || n>rs.length) return;
    closeOv();
    if(typeof window.showAt==='function') window.showAt(n-1);
  };
  $('#pjGo',OV).onclick=go;
  $('#pjNum',OV).addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } });

  $('.pjb.now',OV)?.scrollIntoView({ block:'center' });
}
window.__pracJumpOpen = openOv;   /* 오른쪽 아래 +(도구) 버튼 · 한눈에 안에서도 열 수 있게 */

document.addEventListener('keydown', e=>{
  if(OV){ if(e.key==='Escape'){ e.preventDefault(); closeOv(); } return; }
  if(/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')) return;
  if(document.querySelector('.edw.on, .tbx.on')) return;
  if(window.__gkey?.matches('p-jump', e)){
    e.preventDefault(); openOv();
  }
}, true);

/* ── «문항 고르기» 단추를 새 줄 만들지 않고, 이미 있는 아래쪽 이동줄(#pnav)에
      끼워 넣는다 — ↤ · «10 · ‹이전 · (지금/전체) · 다음› · 10» · ↦ 와 한 줄로.
      예전에는 레일 위에 따로 줄을 얹었는데, 그 자리엔 이미 같은 정보(지금/전체)가
      있어서 두 번 보였고 줄만 하나 더 늘었다. ── */
function ensureBtn(){
  const nav=$('#pnav'); if(!nav || $('#pnavJump',nav)) return;
  const b=document.createElement('button');
  b.type='button'; b.className='zb'; b.id='pnavJump';
  b.title='문항 번호로 바로 가기 (G)';
  b.textContent='🔢 고르기';
  nav.appendChild(b);
  b.onclick=openOv;
}

const boot=setInterval(()=>{
  const nav=$('#pnav'); if(!nav) return;
  ensureBtn();
  clearInterval(boot);
}, 200);
setTimeout(()=>clearInterval(boot), 20000);
})();
