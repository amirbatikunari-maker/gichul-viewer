/* practice.html 에서 분리 (v341) — 원래 10844번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

/* ══ ① 해설 결 설정 ══════════════════════════════════════════ */
const CKEY='prac:ezcfg:v1';
/* 처음값 — 시험장에서 손이 가는 순서(실전) · 중간 식 안 건너뛰기(자세히) ·
   같은 말 되풀이하지 않기. 한 번 바꿔 두면 그 뒤로는 고른 대로 간다. */
const DEF={level:'실전',len:'자세히',extra:'같은 내용을 두 번 쓰지 마라. 앞에서 말한 것은 다시 설명하지 말고 넘어가라.'};
let CFGZ=(()=>{ try{ return Object.assign({},DEF,JSON.parse(localStorage.getItem(CKEY)||'{}')) }catch(e){ return {...DEF} } })();
const csave=()=>{ try{ localStorage.setItem(CKEY,JSON.stringify(CFGZ)) }catch(e){globalThis.__q?.(e)} };
window.__pracEzCfg=()=>CFGZ;

function tail(){
  const lv={ '입문':'전공을 처음 보는 사람 기준으로, 용어부터 풀어 써라.',
             '보통':'기초는 안다고 보고, 막히는 곳만 짚어 풀어 써라.',
             '실전':'시험장에서 손이 가는 순서로 써라. 군말은 빼고 계산 절차 위주로.' }[CFGZ.level]||'';
  const ln={ '짧게':'전체를 열두 줄 안쪽으로 줄여 써라.',
             '보통':'',
             '자세히':'중간 식을 하나도 건너뛰지 말고, 왜 그 식을 쓰는지까지 붙여 써라.' }[CFGZ.len]||'';
  const ex=(CFGZ.extra||'').trim();

  /* ★ 여기가 이번에 바뀐 곳 — «짝 맞추기»
     지금까지는 해설이 «무엇을 묻는 문제인가 / 알아야 할 것 / 푸는 순서» 로만 흘러서,
     물음이 (1)~(13) 처럼 여러 개인 문항에서는 어느 설명이 어느 물음의 것인지
     찾아 헤매야 했다. 물음이 여럿이면 «물음 번호마다 한 덩어리» 로 쓰게 못 박는다.
     각 덩어리 안은 늘 같은 차례다 — 무엇을 묻나 / 쓰는 값 / 쓰는 식 / 넣고 계산 / 답.
     그래야 왼쪽 답안의 (3) 과 오른쪽 해설의 (3) 이 눈으로 바로 이어진다. */
  /* 짜임새 지시는 이제 easyPrompt 본문에 들어 있다 — 여기서는 결만 얹는다.
     예전에는 양쪽에서 서로 다른 짜임새를 시켜, 본문 쪽이 이겨서 늘 옛 모양으로 나왔다. */
  const bits=[lv,ln,ex?('추가 요청: '+ex):''].filter(Boolean);
  return bits.length ? '\n\n[이번에 지킬 것]\n'+bits.map(b=>'- '+b).join('\n') : '';
}
/* 원래 쓰던 물음글 뒤에 결만 붙인다 — 본 글은 건드리지 않는다 */
try{
  if(typeof easyPrompt==='function' && !easyPrompt.__wrapped){
    const base=easyPrompt;
    const wrapped=function(){ return base.apply(this,arguments)+tail() };
    wrapped.__wrapped=true;
    window.easyPrompt=wrapped;
  }
}catch(e){globalThis.__q?.(e)}

/* 설정 판 (도구 탭 · 한눈에 도크 양쪽에서 같은 것을 연다) */
function cfgHTML(){
  const g=(k,arr)=>`<div class="grp" data-k="${k}">`+arr.map(v=>
    `<button type="button" data-v="${v}" class="${CFGZ[k]===v?'on':''}">${v}</button>`).join('')+`</div>`;
  return `<h5>깊이</h5>${g('level',['입문','보통','실전'])}
    <h5>길이</h5>${g('len',['짧게','보통','자세히'])}
    <h5>따로 부탁할 말</h5>
    <textarea data-extra placeholder="예) 단위 환산은 매번 적어 줘 / 표 대신 줄글로">${(CFGZ.extra||'').replace(/</g,'&lt;')}</textarea>`;
}
function wireCfg(root){
  $$('.grp',root).forEach(g=>g.addEventListener('click',e=>{
    const b=e.target.closest('button[data-v]'); if(!b) return;
    CFGZ[g.dataset.k]=b.dataset.v; csave();
    $$('button',g).forEach(x=>x.classList.toggle('on',x===b));
  }));
  const ta=$('[data-extra]',root);
  ta?.addEventListener('input',()=>{ CFGZ.extra=ta.value; csave(); });
}
$('#ezSetup')?.addEventListener('click',()=>{
  const box=document.createElement('div');
  box.className='ovpop on';
  box.style.cssText='left:50%;top:50%;transform:translate(-50%,-50%);z-index:100060;width:min(320px,calc(100vw - 28px))';
  box.innerHTML=`<h5>쉬운 풀이 결</h5>${cfgHTML()}<button type="button" class="go" data-x>다 됐습니다</button>
    <div class="msg">여기서 정한 결은 새로 쓰는 해설과 «다시 해석» 에 모두 붙습니다.</div>`;
  document.body.appendChild(box); wireCfg(box);
  box.querySelector('[data-x]').onclick=()=>box.remove();
});

/* ══ ② 쉬운 풀이 다시 해석 ═══════════════════════════════════ */
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const say=t=>{ try{ cvSay(t) }catch(e){globalThis.__q?.(e)} };

async function redo(scope){
  let busy=false;
  try{ busy = CVBUSY || EZBUSY }catch(e){globalThis.__q?.(e)}
  if(busy) return alert('지금 다른 작업이 돌고 있습니다.');
  /* ★ v267 — 🔒 풀이 잠금이면 «지우기» 전에 멈춘다. 예전엔 먼저 지운 뒤 ezMake 가
     잠금 때문에 돌아가 버려, 서버엔 남은 해설이 화면·캐시에서만 사라졌다. */
  if(window.__locked&&window.__locked('ez')) return alert('쉬운 풀이가 🔒 잠겨 있습니다 — 목록 위 자물쇠에서 «쉬운 풀이» 잠금을 먼저 풀어 주세요.');

  const yr=$('#fYear')?.value||'', ss=$('#fSess')?.value||'';
  let pool=rowsAll().filter(r=>r.q_url||r.q_md);
  let label='이 과목 전 회차';
  if(scope==='sess'){
    if(!ss && !yr){
      /* 회차를 안 고른 채로 눌렀다면 지금 보고 있는 문항의 회차를 쓴다 */
      const cur=rowsAll().find(r=>String(r.id)===String(typeof OVID!=='undefined'?OVID:''))
              || (Array.isArray(window.SHOWN)?window.SHOWN[0]:null);
      if(!cur) return alert('먼저 연도·회차를 고르거나, 문항을 하나 열어 주세요.');
      pool=pool.filter(r=>String(r.year)===String(cur.year)&&String(r.session)===String(cur.session));
      label=`${cur.year}년 제${cur.session}회`;
    }else{
      pool=pool.filter(r=>(!yr||String(r.year)===String(yr))&&(!ss||String(r.session)===String(ss)));
      label=`${yr||'모든 연도'} ${ss?('제'+ss+'회'):''}`.trim();
    }
  }
  const fixN=pool.filter(r=>(window.__ezFixed&&window.__ezFixed(r.id))).length;       /* ★ v267 — 고정 문항은 뺀다 */
  pool=pool.filter(r=>!(window.__ezFixed&&window.__ezFixed(r.id)));
  if(fixN) label+=` (고정 ${fixN}개 빼고)`;
  const done=pool.filter(r=>r.easy_md).length;
  if(!pool.length) return alert(fixN?'남은 문항이 전부 «쉬운해설 고정» 입니다.':'해당하는 문항이 없습니다.');
  if(!confirm(`${label} — ${pool.length}개의 쉬운 풀이를 «지우고» 처음부터 다시 씁니다.\n`
    +`이미 써 둔 해설 ${done}개는 사라집니다.\n`
    +`한 개에 20~40초쯤 걸리므로 대략 ${Math.ceil(pool.length*30/60)}분입니다.\n`
    +`결: ${CFGZ.level} · ${CFGZ.len}${(CFGZ.extra||'').trim()?' · 따로 부탁한 말 있음':''}\n\n계속할까요?`)) return;

  try{ EZBUSY=true; CVSTOP=false; }catch(e){globalThis.__q?.(e)}
  const stop=$('#cvStop'), prog=$('#cvProg'), bar=$('#cvBar');
  if(stop) stop.hidden=false; if(prog) prog.hidden=false;
  ['#cvGap','#ezRun','#ezRedoSess','#ezRedoAll'].forEach(s=>{ const b=$(s); if(b) b.disabled=true });

  let ok=0,bad=0,n=0;
  for(const r of pool){
    let s=false; try{ s=CVSTOP }catch(e){globalThis.__q?.(e)}
    if(s) break;
    n++;
    say(`다시 해석 ${n}/${pool.length} — ${r.year}년 제${r.session}회 ${r.no}번 · 됨 ${ok}`+(bad?` · 실패 ${bad}`:''));
    if(bar) bar.style.width=(n/pool.length*100)+'%';
    if((window.__ezFixed&&window.__ezFixed(r.id))) continue;                     /* ★ v267 — 돌던 중에 고정했어도 지키게 */
    try{
      r.easy_md=null;                       /* 먼저 지운다 — 그래야 새로 쓴다 */
      await ezMake(r.id,true,true);
      r.easy_md?ok++:bad++;
    }catch(e){ bad++; }
    await new Promise(x=>setTimeout(x,400));
  }
  if(stop) stop.hidden=true; if(prog) prog.hidden=true;
  ['#cvGap','#ezRun','#ezRedoSess','#ezRedoAll'].forEach(s=>{ const b=$(s); if(b) b.disabled=false });
  try{ EZBUSY=false }catch(e){globalThis.__q?.(e)}
  say(`다시 해석 ${ok}개 완료`+(bad?` · ${bad}개 실패`:''));
  try{ drawList(); cvCount(); }catch(e){globalThis.__q?.(e)}
}
$('#ezRedoSess')?.addEventListener('click',()=>redo('sess'));
$('#ezRedoAll') ?.addEventListener('click',()=>redo('all'));

/* ══ ③ 한눈에 왼쪽 도크 ══════════════════════════════════════ */
const BKEY='prac:ovbg:v1';
let BG=(()=>{ try{ return localStorage.getItem(BKEY)||'none' }catch(e){ return 'none' } })();
/* ★★ 여기가 «왼쪽 도크를 켜면 통째로 멎던» 자리다 ★★
   바탕을 칠하려고 #ovl 의 class 를 건드렸는데, 하필 그 class 를 지켜보는 감시자가
   다시 이 함수를 부른다 → 칠하고 · 깨고 · 칠하고 … 끝이 없다.
   MutationObserver 는 «마이크로태스크» 라서 이 고리는 화면에 숨 쉴 틈조차 주지 않는다.
   그래서 도로 끄는 것도, 재는 것도 소용이 없었다(잴 틈이 없으니까).
   고침: 바탕은 #ovl 이 아니라 body 에 칠한다 — 지켜보는 곳을 아예 건드리지 않는다. */
function paintBG(){
  const b=document.body; if(!b) return;
  ['grid','rule','cream','mint','slate'].forEach(k=>b.classList.remove('pbg-'+k));
  if(BG!=='none') b.classList.add('pbg-'+BG);
  $$('#ovPop .grp[data-bg] button').forEach(x=>x.classList.toggle('on',x.dataset.v===BG));
}
function setBG(v){ BG=v; try{ localStorage.setItem(BKEY,v) }catch(e){globalThis.__q?.(e)} paintBG(); }

const dock=document.createElement('div'); dock.className='ovdock';
dock.innerHTML=`<button type="button" data-d="music" title="배경 음악">♪</button>
  <button type="button" data-d="bg" title="바탕 — 모눈 · 줄눈 · 배경">▦</button>
  <button type="button" data-d="ez" title="쉬운 풀이 다시 해석">✎</button>`;
const pop=document.createElement('div'); pop.className='ovpop'; pop.id='ovPop';
document.body.append(dock,pop);

const MUSIC=[['jazz','재즈'],['fantasy','판타지'],['off','끄기']];
function openPop(kind){
  if(pop.dataset.k===kind && pop.classList.contains('on')) return closePop();
  pop.dataset.k=kind;
  if(kind==='music'){
    let cur='off'; try{ cur=window.BGM?.mode||'off' }catch(e){globalThis.__q?.(e)}
    pop.innerHTML=`<h5>배경 음악</h5><div class="grp" data-m>`+
      MUSIC.map(([v,n])=>`<button type="button" data-v="${v}" class="${cur===v?'on':''}">${n}</button>`).join('')+
      `</div><div class="msg">소리는 이 기기에서 그 자리에서 만들어 냅니다.</div>`;
    pop.querySelector('[data-m]').addEventListener('click',e=>{
      const b=e.target.closest('button[data-v]'); if(!b) return;
      try{ window.BGM?.set(b.dataset.v) }catch(x){globalThis.__q?.(x)}
      $$('button',pop.querySelector('[data-m]')).forEach(x=>x.classList.toggle('on',x===b));
    });
  }
  if(kind==='bg'){
    const opts=[['none','없음'],['grid','모눈'],['rule','줄눈'],['cream','미색'],['mint','연녹'],['slate','회청']];
    pop.innerHTML=`<h5>바탕</h5><div class="grp" data-bg>`+
      opts.map(([v,n])=>`<button type="button" data-v="${v}" class="${BG===v?'on':''}">${n}</button>`).join('')+
      `</div><div class="msg">한눈에 판에만 깔립니다. 필기·형광펜에는 영향이 없습니다.</div>`;
    pop.querySelector('[data-bg]').addEventListener('click',e=>{
      const b=e.target.closest('button[data-v]'); if(!b) return; setBG(b.dataset.v);
    });
  }
  if(kind==='ez'){
    pop.innerHTML=`<h5>쉬운 풀이 결</h5>${cfgHTML()}
      <button type="button" class="go" data-one>이 문항 다시 해석</button>
      <div class="msg" data-msg>지금 보고 있는 한 문항만 지우고 새로 씁니다.</div>`;
    wireCfg(pop);
    pop.querySelector('[data-one]').onclick=async()=>{
      let id=null; try{ id=OVID }catch(e){globalThis.__q?.(e)}
      if(!id) return alert('먼저 문항을 한눈에 열어 주세요.');
      if(window.__ezFixed&&window.__ezFixed(id)) return alert('이 문항은 «쉬운해설 고정» 입니다.\n쉬운 풀이 칸의 🔒 고정을 먼저 풀어 주세요.');
      if(window.__locked&&window.__locked('ez')) return alert('쉬운 풀이가 🔒 잠겨 있습니다 — 자물쇠를 먼저 풀어 주세요.');
      const btn=pop.querySelector('[data-one]'), msg=pop.querySelector('[data-msg]');
      btn.disabled=true; msg.textContent='다시 쓰는 중입니다… 20~40초쯤 걸립니다.';
      try{
        const r=rowsAll().find(x=>String(x.id)===String(id));
        if(r) r.easy_md=null;
        await ezMake(id,true);
        msg.textContent='새로 썼습니다.';
      }catch(e){ msg.textContent='쓰지 못했습니다 — '+(e.message||e); }
      btn.disabled=false;
    };
  }
  pop.classList.add('on');
  $$('.ovdock>button').forEach(b=>b.classList.toggle('on',b.dataset.d===kind));
}
function closePop(){ pop.classList.remove('on'); pop.dataset.k=''; $$('.ovdock>button').forEach(b=>b.classList.remove('on')); }
dock.addEventListener('click',e=>{
  const b=e.target.closest('[data-d]'); if(!b) return;
  e.stopPropagation(); openPop(b.dataset.d);
});
document.addEventListener('pointerdown',e=>{
  if(e.target.closest('.ovpop')||e.target.closest('.ovdock')) return;
  closePop();
});
addEventListener('keydown',e=>{ if(e.key==='Escape') closePop(); });

/* 한눈에 판이 닫히면 작은 창만 접어 준다 — 보이고 감추는 것은 CSS 가 한다.
   지켜보는 것(MutationObserver)을 아예 쓰지 않으므로 스스로를 깨울 길이 없다. */
let WASOPEN=false;
setInterval(()=>{
  const on=document.body.classList.contains('ovlopen');
  if(on===WASOPEN) return;
  WASOPEN=on;
  if(!on) closePop();
},400);
paintBG();
})();
