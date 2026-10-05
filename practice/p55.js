/* practice.html 에서 분리 (v341) — 원래 20681번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

/* ══════════════════════════════════════════════════════════════
   v250 · 자리 이어가기 — 거른 묶음마다 «어디까지 봤는지» 를 따로 기억한다

   여태 불편했던 까닭
     · 자리 기억은 «과목 하나» 에만 붙어 있었다. 금만 걸러 보다가 은으로 바꾸면
       그 묶음은 처음부터 시작했다. 되돌아와도 마찬가지였다.
     · 몇 번째를 보고 있는지는 «한 문항씩» 모드의 맨 아래 띠에만 적혀 있었다.
     · 번호를 알아도 거기로 바로 갈 길이 없었다.

   그래서
     ① 거른 조건(과목·연도·회차·찾는 말·금은동·유형·정렬)마다 자리를 따로 적어 둔다
     ② 목록이 다시 그려지면 그 묶음의 «마지막 자리» 로 알아서 돌아간다
     ③ 번호를 쳐서 바로 갈 수 있게 하고, «↩ 이어서» 단추를 위아래 양쪽에 둔다
   ══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const KEY='prac:pos:v2';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const shown=()=>{ try{ return Array.isArray(window.SHOWN)?window.SHOWN:[] }catch(e){ return [] } };
const at=()=>{ try{ return window.ONEAT|0 }catch(e){ return 0 } };

/* ── 지금 어떤 조건으로 걸러 놓았는가 ── */
function sig(){
  const v=id=>{ const el=$(id); return el?String(el.value||''):''; };
  const on=sel=>$$(sel).filter(b=>b.classList.contains('on')).map(b=>b.textContent.trim()).join(',');
  return [ v('#fSub'), v('#fYear'), v('#fSess'), v('#fQ'),
           on('#tagRow button[data-tier]'), on('#tagRow button[data-type]'),
           on('#tagRow button[data-sort]'), v('#tagNcs') ].join('|');
}

let BAG=null;
function bag(){
  if(BAG) return BAG;
  try{ BAG=JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){ BAG={} }
  return BAG;
}
function remember(){
  const rs=shown(); if(!rs.length) return;
  const r=rs[Math.min(at(), rs.length-1)]; if(!r) return;
  const b=bag();
  b[sig()]={ id:String(r.id), at:at(), ts:Date.now() };
  b['*last']={ id:String(r.id), sig:sig(), ts:Date.now() };   /* 조건과 상관없는 «맨 마지막» */
  /* 오래된 것부터 200개까지만 */
  const ks=Object.keys(b).filter(k=>k!=='*last');
  if(ks.length>200){
    ks.sort((x,y)=>(b[x].ts||0)-(b[y].ts||0));
    while(ks.length>200) delete b[ks.shift()];
  }
  try{ localStorage.setItem(KEY,JSON.stringify(b)) }catch(e){globalThis.__q?.(e)}
}

/* ── 자리 이동 ── */
function goIndex(i){
  const rs=shown(); if(!rs.length) return false;
  i=Math.max(0,Math.min(i, rs.length-1));
  try{
    if(typeof window.showAt==='function') window.showAt(i);
  }catch(e){globalThis.__q?.(e)}
  setTimeout(()=>{
    const id=rs[i] && String(rs[i].id);
    const card=id && ($(`#list > .pcard[data-id="${id}"]`)||$(`#list .pcard[data-id="${id}"]`));
    card && card.scrollIntoView({block:'start',behavior:'smooth'});
  },140);
  return true;
}
function goId(id){
  const rs=shown();
  const i=rs.findIndex(r=>String(r.id)===String(id));
  if(i<0) return false;
  return goIndex(i);
}

/* ── 목록이 다시 그려지면 그 묶음의 마지막 자리로 ── */
let LASTSIG=null, BUSY=false;
function restore(){
  if(BUSY) return;
  const rs=shown(); if(!rs.length) return;
  const s=sig();
  if(s===LASTSIG) return;          /* 같은 조건 안에서는 건드리지 않는다 */
  LASTSIG=s;
  /* ★ v253 — 자리표의 «열쇠» 는 거른 조건을 통째로 이어 붙인 긴 글이다.
     정렬 칩 하나, 찾는 말 한 글자만 달라져도 열쇠가 달라져 «기억 못 하는» 것처럼 보였다.
     그 조건으로 적어 둔 자리가 없으면 «맨 마지막에 보던 자리» 로 물러선다. */
  const b0=bag();
  const m=b0[s] || b0['*last']; if(!m) return;
  if(at()>0) return;               /* 이미 어딘가 보고 있으면 그대로 둔다 */
  const i=rs.findIndex(r=>String(r.id)===String(m.id));
  if(i<=0) return;
  BUSY=true;
  goIndex(i);
  try{ window.__pracLog && window.__pracLog(`보던 자리로 돌아왔습니다 — ${i+1}번째`) }catch(e){globalThis.__q?.(e)}
  setTimeout(()=>{ BUSY=false; },600);
}

/* showAt 을 감싸 자리마다 적어 둔다 */
if(typeof window.showAt==='function' && !window.showAt.__pos){
  const raw=window.showAt;
  const w=function(...a){ const r=raw.apply(this,a); setTimeout(remember,0); return r; };
  w.__pos=true; window.showAt=w;
}

/* ── 띠에 붙일 것들 ── */
const st=document.createElement('style');
st.textContent=`
.posjump{display:inline-flex;align-items:center;gap:4px;flex:none;margin-left:4px}
.posjump input{width:74px;height:26px;border-radius:8px;border:1px solid var(--line,#e2e8f0);
  background:var(--surface,#fff);color:var(--ink,#0f172a);text-align:center;
  font:700 11px/1 var(--font-m,ui-monospace,monospace)}
.posjump input::placeholder{color:var(--muted,#94a3b8);font-weight:600}
.posjump button{height:26px;padding:0 9px;border-radius:8px;cursor:pointer;
  border:1px solid var(--line,#e2e8f0);background:var(--surface,#fff);color:var(--ink,#0f172a);
  font:700 11px/1 var(--font-d,system-ui)}
.posjump button:hover{background:var(--surface-2,#f6f8fb)}
@media(max-width:620px){ .posjump input{width:60px;height:23px;font-size:10px}
  .posjump button{height:23px;padding:0 7px;font-size:10px} }
#posGo{display:inline-flex;align-items:center;gap:5px;margin-left:6px}
#posGo input{width:62px;height:30px;border-radius:8px;border:1px solid var(--line,#e2e8f0);
  background:var(--surface,#fff);color:var(--ink,#0f172a);text-align:center;
  font:700 12px/1 var(--font-m,ui-monospace,monospace)}
#posGo button{height:30px;padding:0 10px;border-radius:8px;cursor:pointer;
  border:1px solid var(--line,#e2e8f0);background:var(--surface,#fff);color:var(--ink,#0f172a);
  font:700 11.5px/1 var(--font-d,system-ui)}
#posGo button:hover{background:var(--surface-2,#f6f8fb)}
.posresume{white-space:nowrap}
@media(max-width:620px){ #posGo input{width:52px;height:26px} #posGo button{height:26px;padding:0 8px;font-size:10.5px} }
`;
document.head.appendChild(st);

/* 쳐 넣은 것을 알아듣는다
     · 그냥 숫자      → 지금 묶음의 «몇 번째»  (12 → 12번째)
     · 26-2-8 / 2026 2 8 → 그 회차 그 번호로 바로
     · 순번 밖의 숫자 → 문항 번호로 한 번 더 찾아본다 */
function jump(v){
  const t=String(v||'').trim(); if(!t) return false;
  const rs=shown(); if(!rs.length) return false;
  const nums=(t.match(/\d+/g)||[]).map(Number);
  if(!nums.length) return false;
  if(nums.length>=3){
    let [y,se,no]=nums;
    if(y<100) y = y>=70 ? 1900+y : 2000+y;
    const i=rs.findIndex(r=>+r.year===y && +r.session===se && +r.no===no);
    if(i>=0) return goIndex(i);
  }
  const n=nums[0];
  if(n>=1 && n<=rs.length) return goIndex(n-1);
  const i=rs.findIndex(r=>+r.no===n);
  if(i>=0) return goIndex(i);
  try{ window.AppUI && window.AppUI.toast && window.AppUI.toast(`${n} 은 이 묶음에 없습니다 (1~${rs.length})`,'info'); }catch(e){globalThis.__q?.(e)}
  return false;
}

/* 문항 머리줄에 붙인다 — 맨 아래까지 내려가지 않아도 되게 */
function mountCards(){
  const rs=shown(), now=Math.min(at()+1, rs.length||1);
  $$('#list .pcard .phead').forEach(head=>{
    let box=head.querySelector('.posjump');
    if(!box){
      box=document.createElement('span');
      box.className='posjump';
      box.innerHTML=`<input type="text" inputmode="numeric" aria-label="문항으로 이동">
        <button type="button" data-pgo>이동</button>`;
      head.appendChild(box);
      const inp=box.querySelector('input');
      const go=()=>{ if(jump(inp.value)){ inp.value=''; inp.blur(); } };
      box.querySelector('[data-pgo]').onclick=e=>{ e.stopPropagation(); go(); };
      inp.addEventListener('keydown',e=>{
        e.stopPropagation();                       /* 이 화면의 단축키와 안 부딪히게 */
        if(e.key==='Enter'){ e.preventDefault(); go(); }
      });
      inp.addEventListener('click',e=>e.stopPropagation());
      box.title='몇 번째로 갈지 치고 엔터\n26-2-8 처럼 치면 그 회차 그 번호로 바로 갑니다';
    }
    const inp=box.querySelector('input');
    if(document.activeElement!==inp) inp.placeholder = rs.length ? `${now} / ${rs.length}` : '번호';
  });
}

function mount(){
  mountCards();
  /* ① 맨 아래 띠 — 번호 쳐서 가기 */
  const nav=$('#pnav');
  if(nav && !$('#posGo')){
    const box=document.createElement('span');
    box.id='posGo';
    box.innerHTML=`<input type="number" min="1" placeholder="번호" aria-label="몇 번째로 갈까요">
      <button type="button" data-go>가기</button>
      <button type="button" data-resume class="posresume">↩ 이어서</button>`;
    const label=$('#pnavAt', nav);
    label ? label.after(box) : nav.appendChild(box);
    const inp=$('input',box);
    const go=()=>{ const v=parseInt(inp.value,10); if(v>0){ goIndex(v-1); inp.blur(); } };
    $('[data-go]',box).onclick=go;
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } });
    $('[data-resume]',box).onclick=resume;
  }
  /* ② 고르기 띠 — 어디서든 이어서 */
  const row=$('#tagRow')||$('.deck .dcol-find');
  if(row && !$('#posResume')){
    const b=document.createElement('button');
    b.type='button'; b.id='posResume'; b.className='chip';
    b.textContent='↩ 이어서';
    b.title='이 조건으로 마지막에 보던 자리로 갑니다\n(그 자리가 지금 묶음에 없으면 과목 전체의 마지막 자리로 갑니다)';
    b.onclick=resume;
    row.appendChild(b);
  }
  paint();
}

function resume(){
  const b=bag(), rs=shown();
  if(!rs.length) return;
  const m=b[sig()];
  if(m && goId(m.id)) return;
  const g=b['*last'];
  if(g && goId(g.id)) return;
  try{ window.AppUI && window.AppUI.toast && window.AppUI.toast('돌아갈 자리가 아직 없습니다','info'); }catch(e){globalThis.__q?.(e)}
}

/* «몇 / 몇» 을 고르기 띠에도 적어 준다 — 목록 보기에서도 보이게 */
function paint(){
  const b=$('#posResume'); if(!b) return;
  const rs=shown();
  b.textContent = rs.length ? `↩ 이어서 (${Math.min(at()+1,rs.length)}/${rs.length})` : '↩ 이어서';
  const inp=$('#posGo input'); if(inp) inp.max=String(rs.length||1);
}

setInterval(()=>{ mount(); paint(); restore(); },1200);
setTimeout(mount,800);
addEventListener('pagehide',remember);
document.addEventListener('visibilitychange',()=>{ if(document.hidden) remember(); });
window.__pracPos={ resume, goIndex, goId, remember };
})();

