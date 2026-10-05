/* practice.html 에서 분리 (v341) — 원래 20504번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

/* ══════════════════════════════════════════════════════════════
   v249 · AI 사용량 — 얼마나 부르고 있는지 눈에 보이게

   이 화면에서 «저절로» 돈이 나가는 길은 딱 하나다.
     한눈에 보기에서 해설이 없는 문항에 2.5초 머무르면 해설을 만든다.
   나머지(글자 변환 · AI 분류 · 다시 해석 · AI 대화)는 모두 손으로 눌러야 돈다.

   그래도 «얼마나 나갔는지» 가 안 보이면 불안하다. 그래서
     · 부른 횟수를 세어 띠에 적고
     · 저절로 도는 것은 «하루 몇 개» 로 막고
     · 스위치로 아예 끌 수 있게 한다.
   ══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const KEY='prac:aiuse:v1';
const today=()=>new Date().toISOString().slice(0,10);
let U=null;
function use(){
  if(U) return U;
  try{ U=JSON.parse(localStorage.getItem(KEY)||'null') }catch(e){ U=null }
  if(!U||typeof U!=='object') U={ total:0, days:{}, auto:true, cap:30 };
  if(typeof U.auto!=='boolean') U.auto=true;
  if(!U.cap) U.cap=30;
  if(!U.days) U.days={};
  return U;
}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(use())) }catch(e){globalThis.__q?.(e)} }
function bump(kind){
  const u=use(), d=today();
  u.total++; u.days[d]=u.days[d]||{n:0,auto:0,kinds:{}};
  u.days[d].n++;
  u.days[d].kinds[kind]=(u.days[d].kinds[kind]||0)+1;
  if(kind==='해설(자동)') u.days[d].auto++;
  /* 오래된 날은 30일까지만 */
  const ks=Object.keys(u.days).sort();
  while(ks.length>30) delete u.days[ks.shift()];
  save(); paint();
}
const todayN=()=>{ const d=use().days[today()]; return d?d.n:0 };
const todayAuto=()=>{ const d=use().days[today()]; return d?d.auto:0 };

/* ── 부르는 길목 하나를 감싼다 ── */
/* 무슨 일로 불렀는지는 «지금 하는 일» 딱지를 붙여 둔 채로 센다.
   한 번 부르고 지우면 여러 번 도는 일(글자 변환 등)이 «그밖» 으로 새어 나간다. */
let KIND='그밖';
window.__aiKind = k => { KIND = k || '그밖'; };
if(typeof window.askAI==='function' && !window.askAI.__wrapped){
  const raw=window.askAI;
  const w=async function(...a){ bump(KIND); return raw.apply(this,a); };
  w.__wrapped=true;
  window.askAI=w;
}
/* 어느 일에서 부른 것인지 딱지만 붙인다 — 하는 일은 그대로 둔다 */
const tag=(name,label)=>{
  const f=window[name];
  if(typeof f!=='function'||f.__tagged) return;
  const g=function(...a){ KIND=label; return f.apply(this,a); };
  g.__tagged=true; window[name]=g;
};
tag('ezMake','해설');
tag('cvRun','글자 변환');

/* ── 저절로 도는 해설 만들기에 빗장을 건다 ── */
if(typeof window.ezEnqueue==='function' && !window.ezEnqueue.__gated){
  const raw=window.ezEnqueue;
  const g=function(id){
    const u=use();
    if(!u.auto) return;                                  /* 스위치가 꺼져 있음 */
    if(todayAuto()>=u.cap){                              /* 오늘 몫을 다 씀 */
      try{ window.__pracLog && window.__pracLog(`해설 자동 만들기 — 오늘 몫 ${u.cap}개를 다 썼습니다`) }catch(e){globalThis.__q?.(e)}
      return;
    }
    window.__aiKind('해설(자동)');
    return raw.call(this,id);
  };
  g.__gated=true;
  window.ezEnqueue=g;
}

/* ── 띠에 붙는 칩 ── */
const st=document.createElement('style');
st.textContent=`
#aiUseBtn.warn{background:#fef3c7;border-color:#fcd34d;color:#92400e}
.auw{position:fixed;inset:0;z-index:6200;display:none;align-items:center;justify-content:center;
  background:rgba(15,23,42,.6);padding:16px}
.auw.on{display:flex}
.aubox{width:min(560px,100%);background:var(--paper,#fff);border-radius:16px;overflow:hidden;
  box-shadow:0 24px 70px rgba(2,6,23,.45)}
.auh{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid var(--rule,#e6eaf0)}
.auh b{font:700 13.5px/1 var(--font-d,system-ui)} .auh .sp{flex:1}
.aub{padding:13px 14px}
.aub p{font:500 11.5px/1.65 var(--font-d,system-ui);color:var(--muted,#64748b);margin:0 0 9px}
.aub table{width:100%;border-collapse:collapse;font:500 12px/1.5 var(--font-d,system-ui);margin-bottom:11px}
.aub td,.aub th{border:1px solid var(--rule,#e6eaf0);padding:5px 8px}
.aub th{background:var(--surface-2,#f8fafc);text-align:left;font-weight:700;color:var(--ink-2,#475569)}
.aub td.r{text-align:right;font-weight:700}
.aurow{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:6px}
.auw button.b{height:30px;padding:0 12px;border-radius:9px;cursor:pointer;border:1px solid var(--rule,#e2e8f0);
  background:#fff;color:var(--ink,#0f172a);font:700 11.5px/1 var(--font-d,system-ui)}
.auw button.b.on{background:#16a34a;border-color:#16a34a;color:#fff}
.auw button.b.off{background:#64748b;border-color:#64748b;color:#fff}
`;
document.head.appendChild(st);

let W=null;
function open_(){
  if(!W){
    W=document.createElement('div'); W.className='auw';
    W.innerHTML=`<div class="aubox">
      <div class="auh"><b>💰 AI 사용량</b><span class="sp"></span><button class="b" data-x>닫기</button></div>
      <div class="aub" data-body></div>
    </div>`;
    document.body.appendChild(W);
    W.addEventListener('click',e=>{ if(e.target===W) W.classList.remove('on'); });
    W.querySelector('[data-x]').onclick=()=>W.classList.remove('on');
  }
  draw(); W.classList.add('on');
}
function draw(){
  const u=use(), d=u.days[today()]||{n:0,auto:0,kinds:{}};
  const ks=Object.entries(d.kinds||{}).sort((a,b)=>b[1]-a[1]);
  const last7=Object.keys(u.days).sort().slice(-7).reverse();
  W.querySelector('[data-body]').innerHTML=`
    <p>이 화면에서 <b>저절로</b> 돈이 나가는 길은 하나입니다 —
      한눈에 보기에서 <b>해설이 없는 문항에 2.5초 머무르면</b> 해설을 만듭니다.<br>
      글자 변환 · AI 분류 · 다시 해석 · AI 대화는 <b>모두 손으로 눌러야</b> 돕니다.<br>
      아래 숫자는 <b>이 브라우저에서 부른 횟수</b>입니다 (다른 기기 것은 안 셉니다).</p>
    <table>
      <tr><th>오늘 부른 횟수</th><td class="r">${d.n}회</td></tr>
      <tr><th>그중 저절로 만든 해설</th><td class="r">${d.auto} / ${u.cap}개</td></tr>
      <tr><th>여태 모두</th><td class="r">${u.total}회</td></tr>
    </table>
    ${ks.length?`<table><tr><th>오늘 무엇으로</th><th>횟수</th></tr>
      ${ks.map(([k,v])=>`<tr><td>${k}</td><td class="r">${v}</td></tr>`).join('')}</table>`:''}
    ${last7.length>1?`<table><tr><th>요 며칠</th><th>횟수</th></tr>
      ${last7.map(k=>`<tr><td>${k}</td><td class="r">${u.days[k].n}</td></tr>`).join('')}</table>`:''}
    <div class="aurow">
      <button class="b ${u.auto?'on':'off'}" data-auto>${u.auto?'자동 해설 켜짐':'자동 해설 꺼짐'}</button>
      <button class="b" data-cap>하루 한도 ${u.cap}개 바꾸기</button>
      <button class="b" data-reset>숫자 지우기</button>
    </div>`;
  W.querySelector('[data-auto]').onclick=()=>{ const u=use(); u.auto=!u.auto; save(); draw(); paint(); };
  W.querySelector('[data-cap]').onclick=()=>{
    const v=prompt('저절로 만드는 해설을 하루 몇 개까지 둘까요? (0 이면 안 만듭니다)', String(use().cap));
    if(v==null) return;
    const n=Math.max(0,Math.min(500,parseInt(v,10)||0));
    use().cap=n; save(); draw(); paint();
  };
  W.querySelector('[data-reset]').onclick=()=>{
    if(!confirm('세어 둔 숫자를 지웁니다. (요금 자체가 지워지는 것은 아닙니다)')) return;
    U={ total:0, days:{}, auto:use().auto, cap:use().cap }; save(); draw(); paint();
  };
}

function paint(){
  const b=document.querySelector('#aiUseBtn'); if(!b) return;
  const u=use(), n=todayN();
  b.textContent=`💰 AI 오늘 ${n}회`;
  b.classList.toggle('warn', !u.auto || n>=50);
  b.title=`이 브라우저에서 오늘 AI 를 ${n}번 불렀습니다 (여태 모두 ${u.total}번)\n`
        + `저절로 만든 해설 ${todayAuto()}/${u.cap}개 · 자동 ${u.auto?'켜짐':'꺼짐'}\n눌러서 자세히 보기`;
}
function mount(){
  const host=document.querySelector('#tagRow')||document.querySelector('.deck .dcol-find');
  if(!host||document.querySelector('#aiUseBtn')) return;
  const b=document.createElement('button');
  b.type='button'; b.id='aiUseBtn'; b.className='chip';
  b.onclick=open_;
  host.appendChild(b); paint();
}
setInterval(mount,1500); setTimeout(mount,900);
window.__pracAiUse={ open:open_, get:use };
})();

