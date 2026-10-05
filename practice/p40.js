/* practice.html 에서 분리 (v341) — 원래 16726번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

/* ══════════ ① 표 칸 안 줄바꿈 ══════════ */

/* 그릴 때 — 글에 적힌 <br> 를 진짜 줄바꿈으로 되살린다.
   (마크다운을 그리는 쪽이 &lt;br&gt; 로 막아 두었으므로 그것만 푼다) */
['mdRich','mdLite'].forEach(k=>{
  const f=window[k];
  if(typeof f!=='function' || f.__cellbr) return;
  const w=function(src){
    return String(f.apply(this,arguments)).replace(/&lt;\s*br\s*\/?\s*&gt;/gi,'<br>');
  };
  w.__cellbr=1; w.__mlmath=f.__mlmath;
  try{ window[k]=w }catch(e){globalThis.__q?.(e)}
});

/* 되돌릴 때 — 오른쪽 화면에서 친 엔터를 <br> 로 적어 둔다.
   ★ 살아 있는 화면은 안 건드린다(커서가 튄다). 똑같이 뜬 사본을 만들어
     그 사본에서만 칸 안의 줄바꿈을 «<br>» 라는 글자로 바꾼 뒤 글로 되돌린다.
   ★ 창이 쓰는 손잡이보다 «나중에» 걸어 두었으므로, 창이 한 줄로 눌러 놓은
     것을 이쪽이 다시 제대로 고쳐 적는다. */
function cellFix(){
  const W=$('.edw'); if(!W || !W.classList.contains('on')) return;
  const prev=$('#edPrev',W), ta=$('#edTa',W);
  if(!prev || !ta) return;
  if(prev.getAttribute('contenteditable')!=='true') return;
  if(typeof window.__htmlToMd!=='function') return;
  /* 칸 안에 줄바꿈거리가 없으면 손대지 않는다 */
  if(!prev.querySelector('td br, th br, td div, td p, th div, th p')) return;

  const c=prev.cloneNode(true);
  $$('td,th',c).forEach(td=>{
    $$('br',td).forEach(b=>b.replaceWith(document.createTextNode('<br>')));
    $$('div,p',td).forEach(d=>{
      const solo = !d.previousSibling && !(d.previousElementSibling);
      const bits=[...d.childNodes];
      if(!solo) d.before(document.createTextNode('<br>'));
      bits.forEach(x=>d.before(x));
      d.remove();
    });
  });
  let md='';
  try{ md=window.__htmlToMd(c) }catch(e){ return }
  if(md && md!==ta.value) ta.value=md;
}

function wire(){
  const W=$('.edw'); if(!W || W.__cellbr) return;
  const prev=$('#edPrev',W), ta=$('#edTa',W);
  if(!prev||!ta) return;
  W.__cellbr=1;
  let t=0;
  prev.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(cellFix,300); });
  prev.addEventListener('blur',()=>setTimeout(cellFix,0));
  const save=$('#edSave',W);
  if(save) save.addEventListener('pointerdown',cellFix,true);   /* 창이 먼저 훑은 뒤 다시 고친다 */
  W.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter') cellFix(); },true);
}
const wt=setInterval(()=>{ if($('.edw')){ wire(); if($('.edw').__cellbr) clearInterval(wt); } },400);

/* ══════════ ② 동시에 돌리기 ══════════
   v144 · 동시 개수를 32까지 · «자동» 으로 스스로 올리고 내리기

   8이 멀쩡하다면 병목은 브라우저가 아니라 중계 서버 쪽이다.
   그 선이 어디인지는 날마다 다르므로 «자동» 을 둔다 —
     · 4~8개로 몸을 풀고
     · 거절(429·과부하) 없이 매끄러우면 4개씩 올리고
     · 거절이 15%를 넘으면 30%씩 줄인다
   올리고 내리는 것은 «지금 돌고 있는 일꾼 수» 만 바꾼다.
   프롬프트·모델·해설 결은 그대로다 — 결과물 질은 안 바뀐다.

   ★ 무한정 올리면 안 되는 이유
     ① 중계(Worker)와 Gemini 쪽 분당 한도가 먼저 막힌다 — 거절만 늘고 총 시간은 그대로다.
     ② 한 문항마다 그림을 내려받고 Supabase 에 한 줄씩 쓴다. 32를 넘기면
        그쪽이 밀리기 시작한다.
     ③ 폰에서는 메모리가 먼저 죽는다. 폰이면 8~12 위로는 권하지 않는다.
   ══════════════════════════════════════ */
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const needCv = r => window.__needCv ? window.__needCv(r) : !!((r.q_url&&!r.q_md)||(r.a_url&&!r.a_md));
const needEz = r => window.__needEz ? window.__needEz(r) : !!(!r.easy_md && (r.q_url||r.q_md));
const FAILS  = ()=>{ try{ return (window.__pracFail&&window.__pracFail())||{} }catch(e){ return {} } };
const FKEY='prac:jobfail:v1';
function failPut(id,why){
  const F=FAILS(); F[String(id)]={ why:String(why||'').slice(0,80), at:Date.now() };
  try{ localStorage.setItem(FKEY,JSON.stringify(F)) }catch(e){globalThis.__q?.(e)}
}
function failDel(id){
  const F=FAILS(); delete F[String(id)];
  try{ localStorage.setItem(FKEY,JSON.stringify(F)) }catch(e){globalThis.__q?.(e)}
}

const OPTS=[4,8,12,16,24,32];
const CKEY='prac:fastn:v1', AKEY='prac:fastauto:v1';
let CONC=(()=>{ const n=parseInt(localStorage.getItem(CKEY)||'8',10); return OPTS.includes(n)?n:8 })();
let AUTO=(()=>{ try{ return localStorage.getItem(AKEY)==='1' }catch(e){ return false } })();
/* ★ v194 — «✨ 꾸미기» 도 같은 «동시» 값을 따르도록 밖으로 내준다.
   설정을 두 벌 만들면 «도구에선 24인데 꾸미기는 왜 8이지?» 가 된다. */
window.__fastConc = () => { try{ return AUTO ? 8 : CONC; }catch(e){ return 8; } };
let RUN=false;

const say=t=>{ try{ cvSay(t) }catch(e){ const el=$('#cvStat'); if(el) el.textContent=t } };
const stopped=()=>{ try{ return !!CVSTOP }catch(e){ return false } };
const naptime=ms=>new Promise(r=>setTimeout(r,ms));
const mmss=s=>{ s=Math.max(0,Math.round(s)); const m=Math.floor(s/60);
  return m?`${m}분 ${String(s%60).padStart(2,'0')}초 남음`:`${s}초 남음` };
const BUSYISH = e => /429|quota|rate|too many|과부하|overload|503|502|너무 많|한도/i.test(String((e&&e.message)||e));

function poolOf(scope){
  /* 문항 목록을 그대로 넘겨 주면 그것만 돌린다 (실패 모아보기에서 골라 보낼 때) */
  if(Array.isArray(scope)) return scope.slice();
  const yr=$('#fYear')?.value||'', ss=$('#fSess')?.value||'';
  let rows=rowsAll();
  if(scope==='sess'){
    if(yr||ss) rows=rows.filter(r=>(!yr||String(r.year)===String(yr))&&(!ss||String(r.session)===String(ss)));
    else{
      const c=(Array.isArray(window.SHOWN)?window.SHOWN:[])[0];
      if(c) rows=rows.filter(r=>String(r.year)===String(c.year)&&String(r.session)===String(c.session));
    }
  }
  const F=FAILS();
  return rows.filter(r=>needCv(r)||needEz(r)||F[String(r.id)]);
}

/* 한 문항을 끝까지 — 글자 변환 다음에 쉬운 풀이.
   거절당하면 조금씩 다르게 쉬었다(같이 몰려 들어가지 않게) 두 번까지 더 해 본다.
   돌려준 값 : null(됨) 또는 { why, busy } */
async function doOne(r){
  /* ★ v193 — 잠가 둔 칸밖에 없으면 «할 일 없음» 으로 곧장 끝낸다.
     예전에는 잠긴 문항도 세 번 다시 돌린 뒤 «돌렸으나 채워지지 않음» 실패로
     적었다 — 잠글수록 실패 목록만 불어났다. 이제는 조용히 넘어간다. */
  if(!needCv(r) && !needEz(r)) return null;
  for(let k=0; k<3; k++){
    try{
      if(needCv(r)) await cvRow(r,false);
      if(needEz(r)) await ezMake(r.id,false,true);
      if(needCv(r)||needEz(r)) throw new Error('돌렸으나 채워지지 않음');
      return null;
    }catch(e){
      const busy=BUSYISH(e);
      if(k<2 && busy){ await naptime(1500*(k+1)*(1+Math.random())); continue; }
      return { why:(e&&e.message)||String(e), busy };
    }
  }
  return { why:'알 수 없음', busy:false };
}

async function fast(scope){
  if(RUN) return alert('이미 돌고 있습니다.');
  let busy=false; try{ busy=CVBUSY||EZBUSY }catch(e){globalThis.__q?.(e)}
  if(busy) return alert('다른 작업이 돌고 있습니다. 그것부터 끝내거나 중지해 주세요.');

  const pool=poolOf(scope);
  if(!pool.length) return alert('할 일이 없습니다 — 이 범위는 이미 다 돼 있습니다.');
  const nCv=pool.filter(needCv).length, nEz=pool.filter(needEz).length;
  const per=32;
  const guess = AUTO ? '자동으로 맞춰 갑니다' : `대략 ${Math.ceil(pool.length*per/CONC/60)}분`;
  const what = Array.isArray(scope) ? '고른 것' : (scope==='sess' ? '이 회차' : '전체');
  if(!confirm(`${what} — ${pool.length}개를 `
    +(AUTO?'«자동» 으로':`«동시에 ${CONC}개» 씩`)+` 돌립니다.\n`
    +`· 글자 변환 ${nCv}개\n· 쉬운 풀이 ${nEz}개\n\n`
    +`프롬프트·모델·결은 지금 설정 그대로입니다 — 결과물 질은 안 바뀝니다.\n`
    +`혼자 돌리면 ${Math.ceil(pool.length*per/60)}분, 지금 설정이면 ${guess}입니다.\n\n계속할까요?`)) return;

  RUN=true;
  try{ CVSTOP=false; CVBUSY=true; EZBUSY=true; }catch(e){globalThis.__q?.(e)}
  const stopb=$('#cvStop'), prog=$('#cvProg'), bar=$('#cvBar');
  if(stopb) stopb.hidden=false; if(prog) prog.hidden=false;
  $$('.fastwrap button').forEach(b=>b.disabled=true);

  const t0=Date.now();
  let idx=0, done=0, ok=0, bad=0, active=0, hot=0;
  let target = AUTO ? Math.min(8, CONC) : CONC;      /* 자동이면 8부터 몸을 푼다 */
  const recent=[];                                   /* 최근 결과 — true 면 거절당한 것 */
  let note='';

  /* 거절이 잦으면 줄이고, 매끄러우면 올린다 */
  function tune(){
    if(!AUTO) return;
    const w=recent.slice(-16);
    if(w.length<8) return;
    const rate=w.filter(Boolean).length/w.length;
    if(rate>0.15){
      const t=Math.max(2,Math.floor(target*0.7));
      if(t!==target){ target=t; note=`↓${target}`; recent.length=0; }
    }else if(rate===0 && w.length>=12 && target<48){
      target=Math.min(48,target+4); note=`↑${target}`; recent.length=0;
    }
  }

  async function worker(){
    active++;
    try{
      while(true){
        if(stopped()) return;
        if(active>target) return;                    /* 줄이기로 했으면 조용히 빠진다 */
        const k=idx++; if(k>=pool.length) return;
        const r=pool[k];
        const bad0=await doOne(r);
        done++;
        recent.push(!!(bad0&&bad0.busy));
        if(bad0){ bad++; if(bad0.busy) hot++; failPut(r.id,bad0.why); }
        else { ok++; failDel(r.id); }
        tune();
        const el=(Date.now()-t0)/1000;
        const eta=done>target ? mmss(el/done*(pool.length-done)) : '';
        say(`동시 ${active}/${target}${AUTO?' (자동'+(note?' '+note:'')+')':''} — ${done}/${pool.length}`
          +` · 됨 ${ok}`+(bad?` · 실패 ${bad}`:'')+(hot?` · 거절 ${hot}`:'')+(eta?`  ${eta}`:''));
        if(bar) bar.style.width=(done/pool.length*100)+'%';
        if(done%12===0){ try{ drawList(); cvCount(); }catch(e){globalThis.__q?.(e)} }
      }
    }finally{ active--; }
  }

  /* 일꾼을 «지금 목표만큼» 채워 둔다. 목표가 오르면 그때 더 뽑는다.
     ★ 32개를 같은 순간에 던지면 첫머리에서만 몰려 거절당한다 — 150ms 씩 벌려 넣는다.
     ★ 뽑기로 정한 일꾼은 아직 시작 전이어도 «pending» 으로 세어 둔다.
       안 그러면 목표가 8인데 20개가 한꺼번에 뽑힌다. */
  const live=new Set();
  let pending=0;
  function spawn(){
    let n=0;
    while(active+pending<target && idx<pool.length && !stopped()){
      pending++;
      const d=n++*150;
      const p=(async()=>{ await naptime(d); pending--; return worker(); })()
                .finally(()=>live.delete(p));
      live.add(p);
    }
  }
  spawn();
  const sup=setInterval(spawn,400);                 /* 목표가 오르면 그때 더 뽑는다 */
  while(!stopped() && (live.size || idx<pool.length)){
    if(live.size) await Promise.race(live); else await naptime(200);
    spawn();
  }
  clearInterval(sup);
  try{ await Promise.all(live) }catch(e){globalThis.__q?.(e)}

  try{ CVBUSY=false; EZBUSY=false; }catch(e){globalThis.__q?.(e)}
  RUN=false;
  if(stopb) stopb.hidden=true; if(prog) prog.hidden=true;
  $$('.fastwrap button').forEach(b=>b.disabled=false);
  const took=Math.round((Date.now()-t0)/1000);
  say((stopped()?'중지했습니다. ':'')+`${ok}개 완료`+(bad?` · ${bad}개 실패`:'')
      +(hot?` (그중 거절 ${hot})`:'')
      +` · ${Math.floor(took/60)}분 ${took%60}초 걸림`
      +(done?` · 한 개당 ${(took/done).toFixed(1)}초`:''));
  try{ drawList(); cvCount(); }catch(e){globalThis.__q?.(e)}
}

/* ── 도구 차림표에 끼운다 («실패·안 된 것 다시» 옆) ── */
const mt=setInterval(()=>{
  const host=document.getElementById('ezRedoAll')?.parentElement;
  if(!host) return;
  clearInterval(mt);
  if(document.getElementById('fastAll')) return;

  const mk=(id,txt,title)=>{ const b=document.createElement('button');
    b.className='chip'; b.type='button'; b.id=id; b.textContent=txt; b.title=title; return b };
  const lab=document.createElement('div');
  lab.className='dmenu-lab'; lab.textContent='동시에 돌리기 (빠르게)';
  const a=mk('fastAll','⚡⚡ 전체 빠르게','안 된 것과 지난번 실패한 것을 동시에 여러 개씩 돌립니다');
  const b=mk('fastSess','⚡⚡ 이 회차 빠르게','지금 고른 회차만 동시에 여러 개씩 돌립니다');

  const w=document.createElement('div');
  w.className='fastwrap';
  w.innerHTML='<span>동시</span>'
    +OPTS.map(n=>`<button type="button" class="chip" data-n="${n}">${n}</button>`).join('')
    +'<button type="button" class="chip" data-auto="1" title="거절이 없으면 스스로 올리고, 거절이 잦으면 스스로 줄입니다">자동</button>';
  const sync=()=>{
    $$('button[data-n]',w).forEach(x=>x.classList.toggle('on',!AUTO && +x.dataset.n===CONC));
    $$('button[data-auto]',w).forEach(x=>x.classList.toggle('on',AUTO));
  };
  w.addEventListener('click',e=>{
    const x=e.target.closest('button'); if(!x) return;
    e.stopPropagation();
    if(x.dataset.auto){ AUTO=!AUTO; try{ localStorage.setItem(AKEY,AUTO?'1':'0') }catch(e2){globalThis.__q?.(e2)} }
    else if(x.dataset.n){ AUTO=false; CONC=+x.dataset.n;
      try{ localStorage.setItem(CKEY,String(CONC)); localStorage.setItem(AKEY,'0') }catch(e2){globalThis.__q?.(e2)} }
    sync();
  });
  sync();

  host.append(lab,a,b,w);
  a.onclick=()=>fast('all');
  b.onclick=()=>fast('sess');
},700);
setTimeout(()=>clearInterval(mt),40000);
addEventListener('beforeunload',e=>{ if(RUN){ e.preventDefault(); e.returnValue=''; } });
window.__pracFast=fast;
})();
