/* practice.html 에서 분리 (v341) — 원래 14340번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };

/* ══ ① 실패 자루 ══ 어떤 문항이 왜 안 됐는지 적어 둔다 */
const FKEY='prac:jobfail:v1';
let FAIL=(()=>{ try{ return JSON.parse(localStorage.getItem(FKEY)||'{}') }catch(e){ return {} } })();
const fsave=()=>{ try{ localStorage.setItem(FKEY,JSON.stringify(FAIL)) }catch(e){globalThis.__q?.(e)} };
const failAdd=(id,why)=>{ FAIL[String(id)]={ why:String(why||'').slice(0,80), at:Date.now() }; fsave(); };
const failDel=id=>{ delete FAIL[String(id)]; fsave(); };
window.__pracFail=()=>FAIL;

/* ══ ② 진행 띠 ══ */
let BAR=null;
function bar(){
  if(BAR) return BAR;
  BAR=document.createElement('div'); BAR.className='jobbar';
  BAR.innerHTML=`<div class="r"><b data-nm>작업</b><span class="msg" data-msg></span>
    <span class="eta" data-eta></span><button type="button" data-stop>중지</button></div>
    <div class="track"><i data-fill></i></div>`;
  document.body.appendChild(BAR);
  BAR.querySelector('[data-stop]').onclick=()=>{
    JOB.stop=true;
    try{ CVSTOP=true }catch(e){globalThis.__q?.(e)}
    try{ $('#cvStop')?.click() }catch(e){globalThis.__q?.(e)}
    BAR.querySelector('[data-msg]').textContent='중지하는 중… (지금 문항까지는 마칩니다)';
  };
  return BAR;
}
function show(nm,msg,pct,eta,bad){
  const b=bar(); b.classList.add('on'); b.classList.toggle('bad',!!bad);
  b.querySelector('[data-nm]').textContent=nm;
  b.querySelector('[data-msg]').textContent=msg;
  b.querySelector('[data-eta]').textContent=eta||'';
  b.querySelector('[data-fill]').style.width=Math.max(0,Math.min(100,pct||0))+'%';
}
function hide(){ BAR&&BAR.classList.remove('on'); }
const mmss=s=>{ s=Math.max(0,Math.round(s)); const m=Math.floor(s/60);
  return m ? `${m}분 ${String(s%60).padStart(2,'0')}초 남음` : `${s}초 남음` };

/* 예전 단추(⚡변환 · ✎자동 해설)가 돌 때도 같은 띠에 비춰 준다 — 폴링만 한다 */
let JOB={running:false,stop:false};
setInterval(()=>{
  if(JOB.running) return;
  const stop=$('#cvStop');
  if(!stop||stop.hidden){ if(BAR&&BAR.classList.contains('on')&&!JOB.running) hide(); return; }
  const txt=($('#cvStat')?.textContent||'').trim();
  const w=parseFloat(($('#cvBar')?.style.width||'0'))||0;
  show('진행 중', txt||'…', w, '', false);
},400);

/* ══ ③ 한 번에 — 글자 변환 + 쉬운 풀이 ══ */
/* ★ v193 — 자물쇠를 아는 한 벌짜리 판단을 쓴다 */
const needCv = r => window.__needCv ? window.__needCv(r) : !!((r.q_url&&!r.q_md)||(r.a_url&&!r.a_md));
const needEz = r => window.__needEz ? window.__needEz(r) : !!(!r.easy_md && (r.q_url||r.q_md));

function pick(scope){
  const yr=$('#fYear')?.value||'', ss=$('#fSess')?.value||'';
  let rows=rowsAll();
  if(scope==='sess'){
    if(yr||ss) rows=rows.filter(r=>(!yr||String(r.year)===String(yr))&&(!ss||String(r.session)===String(ss)));
    else{
      const c=(Array.isArray(window.SHOWN)?window.SHOWN:[])[0];
      if(c) rows=rows.filter(r=>String(r.year)===String(c.year)&&String(r.session)===String(c.session));
    }
  }
  if(scope==='fail') return rows.filter(r=>FAIL[String(r.id)]||needCv(r)||needEz(r));
  return rows.filter(r=>needCv(r)||needEz(r));
}

async function runBoth(scope){
  if(JOB.running) return alert('이미 돌고 있습니다.');
  let busy=false; try{ busy=CVBUSY||EZBUSY }catch(e){globalThis.__q?.(e)}
  if(busy) return alert('다른 작업이 돌고 있습니다. 그것부터 끝내거나 중지해 주세요.');

  const pool=pick(scope);
  if(!pool.length) return alert('할 일이 없습니다 — 이 범위는 이미 다 돼 있습니다.');
  const nCv=pool.filter(needCv).length, nEz=pool.filter(needEz).length;
  const nFail=pool.filter(r=>FAIL[String(r.id)]).length;
  const label = scope==='sess' ? '이 회차' : (scope==='fail' ? '안 된 것 + 실패한 것' : '전체');
  if(!confirm(`${label} — 문항 ${pool.length}개를 한 번에 처리합니다.\n`
    + `· 글자 변환 ${nCv}개\n· 쉬운 풀이 ${nEz}개`
    + (nFail?`\n· 지난번 실패 ${nFail}개 (다시 시도)`:'')
    + `\n\n해설 결은 «실전 · 자세하게» 로 씁니다.\n`
    + `한 문항에 30~60초쯤 걸리므로 대략 ${Math.ceil(pool.length*45/60)}분입니다.\n`
    + `«중지» 를 눌러도 거기까지는 저장됩니다. 계속할까요?`)) return;

  /* 해설 결을 실전 · 자세하게 로 맞춘다 */
  try{ const c=window.__pracEzCfg&&window.__pracEzCfg();
    if(c){ c.level='실전'; c.len='자세히';
      try{ localStorage.setItem('prac:ezcfg:v1',JSON.stringify(c)) }catch(e){globalThis.__q?.(e)} } }catch(e){globalThis.__q?.(e)}

  JOB={running:true,stop:false};
  try{ CVSTOP=false; CVBUSY=true; EZBUSY=true; }catch(e){globalThis.__q?.(e)}
  const t0=Date.now();
  let ok=0,bad=0,n=0;

  for(const r of pool){
    if(JOB.stop) break;
    let s=false; try{ s=CVSTOP }catch(e){globalThis.__q?.(e)}
    if(s) break;
    n++;
    const el=Date.now()-t0;
    const eta=n>1 ? mmss((el/(n-1))*(pool.length-n+1)/1000) : '';
    show(scope==='fail'?'실패·안 된 것 다시':'한 번에 (변환+해설)',
      `${n}/${pool.length} — ${r.year}년 제${r.session}회 ${r.no}번 · 됨 ${ok}`+(bad?` · 실패 ${bad}`:''),
      (n-1)/pool.length*100, eta, bad>0);

    let hurt=null;
    try{ if(needCv(r)) await cvRow(r,false); }
    catch(e){ hurt='글자 변환 — '+((e&&e.message)||e); }
    if(!hurt){
      try{ if(needEz(r)) await ezMake(r.id,false,true); }
      catch(e){ hurt='쉬운 풀이 — '+((e&&e.message)||e); }
    }
    /* 예외가 안 나도 «여전히 안 돼 있으면» 실패로 본다 (조용히 실패하는 길이 있다) */
    if(!hurt && (needCv(r)||needEz(r))) hurt='돌렸으나 채워지지 않음';

    if(hurt){ bad++; failAdd(r.id,hurt); }
    else { ok++; failDel(r.id); }

    await new Promise(x=>setTimeout(x,300));
  }

  try{ CVBUSY=false; EZBUSY=false; }catch(e){globalThis.__q?.(e)}
  JOB.running=false;
  const took=mmss((Date.now()-t0)/1000).replace('남음','걸림');
  show('끝', `${ok}개 완료`+(bad?` · ${bad}개 실패 (실패 목록에 남겼습니다)`:'')+` · ${took}`,
       100, '', bad>0);
  setTimeout(hide,6000);
  try{ drawList(); cvCount(); }catch(e){globalThis.__q?.(e)}
  paintBtns();
}

/* ══ ④ 도구 차림표에 단추 ══ */
function paintBtns(){
  const b=document.getElementById('jobFail');
  if(!b) return;
  const n=Object.keys(FAIL).length;
  b.textContent = n ? `↻ 실패·안 된 것 다시 (실패 ${n})` : '↻ 실패·안 된 것 다시';
}
const mt=setInterval(()=>{
  const host=document.getElementById('ezRedoAll')?.parentElement;
  if(!host) return;
  clearInterval(mt);
  if(document.getElementById('jobBothSess')) return;
  const mk=(id,txt,title)=>{ const x=document.createElement('button');
    x.className='chip'; x.type='button'; x.id=id; x.textContent=txt; x.title=title; return x };
  const a=mk('jobBothSess','⚡✎ 이 회차 한 번에','글자 변환과 쉬운 풀이를 한 문항에서 이어서 끝냅니다 (실전·자세하게)');
  const c=mk('jobBothAll','⚡✎ 전체 한 번에','이 과목 전체 — 안 된 것만 골라 변환과 해설을 함께 처리합니다');
  const d=mk('jobFail','↻ 실패·안 된 것 다시','지난번 실패한 문항과 아직 안 된 문항을 함께 다시 돌립니다');
  const e=mk('jobFailClear','실패 목록 비우기','실패 기록만 지웁니다 (문항은 그대로)');
  host.append(a,c,d,e);
  a.onclick=()=>runBoth('sess');
  c.onclick=()=>runBoth('all');
  d.onclick=()=>runBoth('fail');
  e.onclick=()=>{ if(!confirm('실패 기록을 지웁니다.')) return; FAIL={}; fsave(); paintBtns(); };
  paintBtns();
},700);
setTimeout(()=>clearInterval(mt),30000);

addEventListener('beforeunload',e=>{ if(JOB.running){ e.preventDefault(); e.returnValue=''; } });
})();
