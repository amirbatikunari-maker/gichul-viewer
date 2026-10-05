/* practice.html 에서 분리 (v341) — 원래 14020번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const rowOf=id=>rowsAll().find(r=>String(r.id)===String(id));
const say=t=>{ try{ cvSay(t) }catch(e){globalThis.__q?.(e)} };

/* ══ ① 실패 기록 ══ */
const FKEY='prac:fails:v1';
let F=(()=>{ try{ return Object.assign({cv:[],ez:[]},JSON.parse(localStorage.getItem(FKEY)||'{}')) }
            catch(e){ return {cv:[],ez:[]} } })();
const fsave=()=>{ try{ localStorage.setItem(FKEY,JSON.stringify(F)) }catch(e){globalThis.__q?.(e)} };
function noteFail(kind,id,failed){
  const a=F[kind], k=String(id), i=a.indexOf(k);
  if(failed){ if(i<0) a.push(k); }
  else if(i>=0) a.splice(i,1);
  fsave();
}
/* 이미 잘 된 문항은 실패 목록에서 지워 준다(밖에서 따로 돌렸을 수도 있다) */
function prune(){
  const cv=F.cv.filter(id=>{ const r=rowOf(id); if(!r) return false;
    return window.__needCv ? window.__needCv(r) : ((r.q_url&&!r.q_md)||(r.a_url&&!r.a_md)) });
  const ez=F.ez.filter(id=>{ const r=rowOf(id); if(!r) return false;
    return window.__needEz ? window.__needEz(r) : !r.easy_md });
  if(cv.length!==F.cv.length||ez.length!==F.ez.length){ F.cv=cv; F.ez=ez; fsave(); }
}

/* 원래 함수를 감싸 «됐나 안 됐나» 만 적어 둔다 — 하는 일은 그대로다 */
const hook=setInterval(()=>{
  let done=0;
  if(typeof window.cvRow==='function'&&!window.cvRow.__fail){
    const o=window.cvRow;
    const g=async function(r){
      const nm=`${r.year}년 제${r.session}회 ${r.no}번`;
      try{
        const out=await o.apply(this,arguments);
        /* ★ v193 — 잠가 둬서 안 한 것은 «실패» 가 아니다 (그렇게 적으면
           실패 목록이 잠근 문항으로 가득 차고, 재시도가 헛돈다) */
        const bad=!!(window.__needCv ? window.__needCv(r)
                    : ((r.q_url&&!r.q_md)||(r.a_url&&!r.a_md)));
        noteFail('cv',r.id,bad);
        addLog(`변환 ${bad?'✕':'✓'} ${nm}`+(bad?' — 못 바꿨습니다':''), bad?'bad':'ok');
        return out;
      }catch(e){
        noteFail('cv',r.id,true);
        addLog(`변환 ✕ ${nm} — ${(e&&e.message)||e}`,'bad');
        throw e;
      }
    };
    g.__fail=1; window.cvRow=g; done++;
  }
  if(typeof window.ezMake==='function'&&!window.ezMake.__fail){
    const o=window.ezMake;
    const g=async function(id){
      const r0=rowOf(id);
      const nm=r0?`${r0.year}년 제${r0.session}회 ${r0.no}번`:`#${id}`;
      try{
        const out=await o.apply(this,arguments);
        const r=rowOf(id), bad=!(r&&r.easy_md);
        noteFail('ez',id,bad);
        addLog(`해설 ${bad?'✕':'✓'} ${nm}`+(bad?' — 못 썼습니다':''), bad?'bad':'ok');
        return out;
      }catch(e){
        noteFail('ez',id,true);
        addLog(`해설 ✕ ${nm} — ${(e&&e.message)||e}`,'bad');
        throw e;
      }
    };
    g.__fail=1; window.ezMake=g; done++;
  }
  if(done>=2) clearInterval(hook);
},400);
setTimeout(()=>clearInterval(hook),20000);

/* ══ ② 진행률 ══ */
function counts(){
  const rows=rowsAll();
  const skip=window.__pracNoCv||(()=>false);
  const cvAll=rows.filter(r=>(r.q_url||r.a_url)&&!skip(r.id));
  const cvOk=cvAll.filter(r=>(!r.q_url||r.q_md)&&(!r.a_url||r.a_md));
  const ezAll=rows.filter(r=>r.q_url||r.q_md);
  const ezOk=ezAll.filter(r=>r.easy_md);
  return {
    cv:{ all:cvAll.length, ok:cvOk.length, fail:F.cv.length },
    ez:{ all:ezAll.length, ok:ezOk.length, fail:F.ez.length }
  };
}
let panel=null;
function build(){
  if(panel) return panel;
  const host=$('.deck .dcol-view')||$('.cvbar')?.parentElement; if(!host) return null;
  panel=document.createElement('div'); panel.className='cvpanel';
  panel.innerHTML=`
    <div class="ln"><b>글자 변환</b><div class="bar" data-b="cv"></div><span class="nums" data-n="cv"></span></div>
    <div class="ln"><b>쉬운 풀이</b><div class="bar" data-b="ez"></div><span class="nums" data-n="ez"></span></div>
    <div class="run" data-run hidden>
      <span class="dot"></span>
      <span class="txt" data-runtxt>돌고 있습니다…</span>
      <button type="button" data-stop>■ 중지</button>
    </div>
    <div class="acts">
      <button type="button" data-r="cv" class="warn">↻ 실패만 다시 변환</button>
      <button type="button" data-r="ez" class="warn">↻ 실패만 다시 해석</button>
      <button type="button" data-clear>실패 기록 지우기</button>
      <button type="button" data-logtoggle>▾ 실시간 기록</button>
    </div>`;
  host.appendChild(panel);
  panel.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.hasAttribute('data-clear')){ F={cv:[],ez:[]}; fsave(); paint(); return; }
    if(b.hasAttribute('data-stop')){ stopAll(); return; }
    if(b.hasAttribute('data-logtoggle')){ toggleLog(); return; }
    if(b.dataset.r) retry(b.dataset.r);
  });
  return panel;
}
function paint(){
  if(!build()) return;
  /* «금 248 · 은 276 …» 셈줄은 고르기 띠의 «초기화» 바로 옆이 제자리다 */
  const note=document.getElementById('tagNote'), row=document.getElementById('tagRow');
  /* ★ v290 — 등급 줄을 한 줄로 묶은 뒤로는 셈줄이 줄 «안» 에 있으면 가로로 밀려 잘린다 → 줄 바로 아래로 */
  if(note&&row&&note.previousElementSibling!==row){ note.classList.remove('inline'); row.after(note); }
  prune();
  const c=counts();
  ['cv','ez'].forEach(k=>{
    const v=c[k], bar=panel.querySelector(`[data-b="${k}"]`), num=panel.querySelector(`[data-n="${k}"]`);
    const pOk=v.all?Math.round(v.ok/v.all*100):0;
    const pNo=v.all?Math.min(100-pOk,Math.round(v.fail/v.all*100)):0;
    bar.innerHTML=`<i class="ok" style="width:${pOk}%"></i><i class="no" style="width:${pNo}%"></i>`;
    num.innerHTML=`<i>성공 ${v.ok}</i>/${v.all} (${pOk}%) · 남음 ${v.all-v.ok}`
      + (v.fail?` · <em>실패 ${v.fail}</em>`:'');
  });
  const on=k=>{ const b=panel.querySelector(`[data-r="${k}"]`); if(b) b.disabled=!F[k].length; };
  on('cv'); on('ez');
}
/* ══ 이번 실행 — 성공 · 실패 · 중지 ══
   돌기 시작할 때의 셈을 찍어 두고, 지금 셈과 견줘 «이번에 몇 개나 됐나» 를 보여 준다.
   그래서 변환이든 해설이든 AI 분류든, 어느 것을 돌려도 같은 자리에 나온다. */
let SNAP=null, LASTLINE='';
function running(){ const p=$('#cvProg'); return !!p && !p.hidden }
function stopAll(){
  try{ CVSTOP=true }catch(e){globalThis.__q?.(e)}
  const b=$('#cvStop'); if(b&&!b.hidden) b.click();
  addLog('중지를 눌렀습니다 — 여기까지는 저장됩니다.');
}
function runTick(){
  if(!panel) return;
  const box=panel.querySelector('[data-run]');
  const on=running() || !!document.querySelector('.jobbar.on');
  /* 돌기 시작하면 아래 기록창을 저절로 편다 — 흘러가는 것을 봐야 하니까 */
  if(on && !runTick._was){ toggleLog(true); }
  runTick._was=on;
  box.hidden=!on && !SNAP;
  if(on&&!SNAP){ const c=counts(); SNAP={ cv:c.cv.ok, ez:c.ez.ok, at:Date.now() }; }
  if(!on&&SNAP&&Date.now()-SNAP.at>1500&&!running()){
    /* 끝났으면 마지막 셈만 남기고 접는다 */
    setTimeout(()=>{ if(!running()){ SNAP=null; if(panel) panel.querySelector('[data-run]').hidden=true; } },8000);
  }
  if(!SNAP) return;
  const c=counts();
  const okCv=c.cv.ok-SNAP.cv, okEz=c.ez.ok-SNAP.ez;
  const min=Math.round((Date.now()-SNAP.at)/60000);
  panel.querySelector('[data-runtxt]').innerHTML =
    (on?'돌고 있습니다':'끝났습니다') + ' · '
    + `<b class="ok">성공 +${Math.max(0,okCv+okEz)}</b>`
    + (F.cv.length+F.ez.length ? ` · <b class="no">실패 ${F.cv.length+F.ez.length}</b>` : '')
    + (min?` · ${min}분째`:'');
  panel.querySelector('[data-stop]').disabled=!on;
}
/* ══ 실시간 기록 — 화면 아래에 붙박이로 ══
   돌아가는 동안 «지금 몇 번째 문항을 하고 있나» 가 흘러가야 한다.
   그래서 기록창을 도구 판에서 떼어 화면 아래에 붙이고,
   문항 하나가 끝날 때마다 그 자리에서 한 줄씩 쌓는다. */
let LOGBOX=null;
function logBox(){
  if(LOGBOX) return LOGBOX;
  LOGBOX=document.createElement('div');
  LOGBOX.className='joblog';
  LOGBOX.innerHTML=`<div class="h">
      <b>실시간 기록</b><span class="n" data-n>0</span><span class="sp"></span>
      <button type="button" data-clr title="비우기">비우기</button>
      <button type="button" data-min title="접기/펴기">▾</button>
    </div><div class="b" data-lines></div>`;
  document.body.appendChild(LOGBOX);
  LOGBOX.querySelector('[data-clr]').onclick=()=>{
    LOGBOX.querySelector('[data-lines]').innerHTML=''; LOGBOX.querySelector('[data-n]').textContent='0'; };
  LOGBOX.querySelector('[data-min]').onclick=()=>toggleLog();
  LOGBOX.querySelector('.h').onclick=e=>{ if(!e.target.closest('button')) toggleLog(); };
  return LOGBOX;
}
function toggleLog(force){
  const b=logBox();
  const on = force==null ? !b.classList.contains('open') : !!force;
  b.classList.toggle('open',on);
  b.querySelector('[data-min]').textContent = on?'▴':'▾';
  const t=panel&&panel.querySelector('[data-logtoggle]');
  if(t) t.textContent=(on?'▴':'▾')+' 실시간 기록';
  if(on){
    /* 손으로 펼쳤으면 — 활동이 없어도 숨기지 않는다 */
    clearTimeout(logBox._hideT);
    b.classList.add('show');
  }else{
    /* 손으로 접었으면 — 볼 일이 끝난 것이니 곧 통째로 숨긴다 */
    clearTimeout(logBox._hideT);
    logBox._hideT=setTimeout(()=>b.classList.remove('show'), 1200);
  }
}
function addLog(t,kind){
  t=String(t||'').trim(); if(!t||t===LASTLINE) return;
  LASTLINE=t;
  const b=logBox(), el=b.querySelector('[data-lines]');
  const now=new Date();
  const hh=String(now.getHours()).padStart(2,'0'), mm=String(now.getMinutes()).padStart(2,'0'),
        ss=String(now.getSeconds()).padStart(2,'0');
  const line=document.createElement('div');
  line.className='li '+(kind||(/실패|못|오류|끊/.test(t)?'bad':(/완료|됨|성공|✓/.test(t)?'ok':'')));
  line.textContent=`${hh}:${mm}:${ss}  ${t}`;
  el.appendChild(line);                                  /* 새 줄이 아래로 흘러간다 */
  while(el.children.length>300) el.firstChild.remove();
  el.scrollTop=el.scrollHeight;
  b.querySelector('[data-n]').textContent=el.children.length;
  b.classList.add('live'); clearTimeout(addLog._t);
  addLog._t=setTimeout(()=>b.classList.remove('live'),1200);
  /* 새 줄이 생겼으니 보여 준다 — 펼쳐 두지 않았다면, 조용해지고 몇 초 뒤 다시 숨는다 */
  b.classList.add('show');
  clearTimeout(logBox._hideT);
  if(!b.classList.contains('open')){
    logBox._hideT=setTimeout(()=>b.classList.remove('show'), 8000);
  }
}
window.__pracLog=addLog;

/* 어느 띠에서 흘러나오든 그대로 받아 적는다 (#cvStat · 위쪽 작업띠) */
['#cvStat','.jobbar [data-msg]'].forEach(sel=>{
  const w=setInterval(()=>{
    const st=document.querySelector(sel); if(!st) return; clearInterval(w);
    let last=st.textContent;
    new MutationObserver(()=>{ const t=st.textContent; if(t!==last){ last=t; addLog(t); } })
      .observe(st,{childList:true,characterData:true,subtree:true});
  },500);
  setTimeout(()=>clearInterval(w),30000);
});

setInterval(()=>{ paint(); runTick(); },1200);
setTimeout(()=>{ paint(); runTick(); },1200);

/* ══ ③ 실패한 것만 다시 ══ */
async function retry(kind){
  let busy=false; try{ busy=CVBUSY||EZBUSY }catch(e){globalThis.__q?.(e)}
  if(busy) return alert('지금 다른 작업이 돌고 있습니다.');
  prune();
  const ids=F[kind].slice();
  if(!ids.length) return alert('다시 할 실패 기록이 없습니다.');
  const what=kind==='cv'?'글자 변환':'쉬운 풀이';
  if(kind!=='cv' && window.__locked&&window.__locked('ez')) return alert('쉬운 풀이가 🔒 잠겨 있습니다 — 자물쇠를 먼저 풀어 주세요.');   /* ★ v267 */
  if(!confirm(`지난번에 실패한 ${ids.length}개만 골라 ${what}을 다시 시도합니다.\n`
    +`대략 ${Math.ceil(ids.length*(kind==='cv'?25:30)/60)}분입니다. 계속할까요?`)) return;

  try{ if(kind==='cv') CVBUSY=true; else EZBUSY=true; CVSTOP=false; }catch(e){globalThis.__q?.(e)}
  const stop=$('#cvStop'), prog=$('#cvProg'), bar=$('#cvBar');
  if(stop) stop.hidden=false; if(prog) prog.hidden=false;
  let ok=0,bad=0,n=0;
  for(const id of ids){
    let s=false; try{ s=CVSTOP }catch(e){globalThis.__q?.(e)}
    if(s) break;
    const r=rowOf(id); if(!r){ noteFail(kind,id,false); continue; }
    n++;
    say(`실패 재시도 ${n}/${ids.length} — ${r.year}년 제${r.session}회 ${r.no}번 · 됨 ${ok}`+(bad?` · 실패 ${bad}`:''));
    if(bar) bar.style.width=(n/ids.length*100)+'%';
    try{
      if(kind==='cv'){ await window.cvRow(r,true);
        (window.__needCv ? window.__needCv(r) : ((r.q_url&&!r.q_md)||(r.a_url&&!r.a_md)))?bad++:ok++; }
      else if((window.__ezFixed&&window.__ezFixed(r.id))){ noteFail(kind,id,false); continue; }   /* ★ v267 — 고정은 실패 목록에서도 뺀다 */
      else{ r.easy_md=null; await window.ezMake(r.id,true,true); r.easy_md?ok++:bad++; }
    }catch(e){ bad++; }
    paint();
    await new Promise(x=>setTimeout(x,400));
  }
  if(stop) stop.hidden=true; if(prog) prog.hidden=true;
  try{ if(kind==='cv') CVBUSY=false; else EZBUSY=false; }catch(e){globalThis.__q?.(e)}
  say(`실패 재시도 — ${ok}개 됨` + (bad?` · ${bad}개는 또 실패`:'') + (ok?' (목록에서 뺐습니다)':''));
  try{ drawList(); cvCount(); }catch(e){globalThis.__q?.(e)}
  paint();
}
window.__pracRetry=retry;
})();
