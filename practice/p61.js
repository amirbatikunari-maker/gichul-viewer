/* practice.html 에서 분리 (v341) — 원래 24404번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const getRand=()=>{ try{ return RAND }catch(e){ return null } };
const setRand=v=>{ try{ RAND=v }catch(e){globalThis.__q?.(e)} };
const tag=id=>{ try{ return window.__pracTag?window.__pracTag(id):null }catch(e){ return null } };
const dup=()=>{ try{ return window.__pracDup?window.__pracDup():null }catch(e){ return null } };
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||console.log)(m) }catch(e){globalThis.__q?.(e)} };

const MODES={
  hot:{ nm:'빈출 랜덤', sh:'빈출', tip:'금·은·동에서 — 출제확률이 높을수록 더 자주 뽑힙니다 · 같은 문제·같은 유형은 하나만', tiers:['g','s','b'], dedupe:true, weight:true },
  g:  { nm:'금 랜덤',   sh:'금',   tip:'금 등급에서 무작위 · 같은 문제·같은 유형은 하나만', tiers:['g'], dedupe:true },
  s:  { nm:'은 랜덤',   sh:'은',   tip:'은 등급에서 무작위 · 같은 문제·같은 유형은 하나만', tiers:['s'], dedupe:true },
  all:{ nm:'전체 랜덤', sh:'전체', tip:'지금 조건에 맞는 전체에서 무작위 (중복 묶기로 접혀 있는 것만 뺌)', tiers:null, dedupe:false },
  /* ★ v312 — 섞지 않고 최신 회차(26년)부터 차례로. 개수 제한 없이 전부 · 오른쪽 겹치기(회차外·체크·맞힘 −)는 그대로 걸림 */
  seq:{ nm:'전체 최신순', sh:'📅 최신순', tip:'지금 조건에 맞는 전체를 최신 회차(26년)부터 차례로 — 개수 제한 없음 · 체크·맞힘 − 를 켜면 걸린 문항은 빠짐', tiers:null, dedupe:false, recent:true }
};
/* ★ v277 — 겹치기(여러 개 같이 켬). 위 랜덤 네 가지 어느 것에나 얹힌다
   예) 빈출 랜덤 + 오고·단답 빼기 + 체크한 것 빼기 + 확률 높은 순 → 확률 높은 것부터 풀고 맞힌 것은 소거 */
const MODS={
  nx: { nm:'회차外 −', tip:'진짜 기출 회차가 아닌 문제집 자료를 뺍니다 — 오고초려 · 핵심빈출 · 단답 · 소방 등' },
  ck: { nm:'체크 −', tip:'회독용 — 맞음·틀림 상관없이 N번 푼 문항을 뺍니다. 남은 게 없으면 N회독 끝 (− + 로 N)' },
  un: { nm:'맞힘 −', tip:'숙달용 — N번 이상 맞힌 문항을 뺍니다. 틀린 것·안 푼 것은 남음 (− + 로 N)' },
  ord:{ nm:'확률순',   tip:'무작위 대신 출제확률이 높은 것부터 차례로 (같은 확률끼리는 섞음)' }
};
const MKEY='prac:randmod';
let MOD={}; try{ MOD=JSON.parse(localStorage.getItem(MKEY)||'{}')||{} }catch(e){ MOD={} }
const saveMod=()=>{ try{ localStorage.setItem(MKEY, JSON.stringify(MOD)) }catch(e){globalThis.__q?.(e)} };
/* ★ v284 — «맞힌 것 빼기» 기준 N (1~20). N번 이상 맞힌 문항을 뺀다 = N회독째 */
const unN=()=>Math.min(20,Math.max(1,+MOD.unN||1));
const ckN=()=>Math.min(20,Math.max(1,+MOD.ckN||1));
const chkN=id=>{ try{ if(window.__pracChkN) return window.__pracChkN(id); }catch(e){globalThis.__q?.(e)} const p=progMap()[String(id)]; return p?(p.n|0):0; };
window.__pracCkN=ckN;

/* ★ v286 — 회독을 «어디까지 같이 셀지»
   same : 진짜 같은 문제 — 소문항 이름이 같음 · 글이 90% 이상 같음 · 책이 적은 출제 연도 목록이 같음
   mid  : + 중문항이 같음      big : + 대문항이 같음 (비슷한 유형까지)      row : 문항 하나만
   같이 센다 = 묶음 안에서 가장 많이 푼 횟수를 그 묶음 모두의 횟수로 본다(기록은 안 바꿈).
   빈출·금·은 «같은 유형은 하나만» 은 예전처럼 대문항으로 — 그래서 소문항이 다른 비슷한 문제는
   다음 뽑기에 또 나온다(따로 연습해야 하니까). */
const SCOPES={ same:'같은 문제만', mid:'중문항까지', big:'대문항까지', row:'문항 하나만' };
const scope=()=>'same';   /* ★ v288 — 범위 고르기 뺌: 기록 자체를 같은 문제끼리 함께 적으므로 하나로 고정 */
let KIN=null, KSIG='', KT=0, KSC='';
function kinMap(){
  const R=rowsAll(), sc=scope();
  if(KIN && KT && Date.now()-KT<1500 && KSC===sc) return KIN;          /* 미니맵이 칸마다 부른다 — 잠깐은 그대로 */
  let path=()=>['','',''];
  try{ if(window.__qtypePath) path=window.__qtypePath; }catch(e){globalThis.__q?.(e)}
  const sig=sc+'|'+R.length+'|'+R.map(r=>(r.qtype||'')+(r.qtype2||'')+(r.qtype3||'')).join('').length+'|'+((window.__pracRel&&window.__pracRel(R[0]&&R[0].id)||[]).length);
  if(KIN && KSIG===sig){ KT=Date.now(); KSC=sc; return KIN; }
  const par=new Map(); R.forEach(r=>par.set(String(r.id),String(r.id)));
  const find=x=>{ while(par.get(x)!==x){ par.set(x,par.get(par.get(x))); x=par.get(x); } return x; };
  const uni=(a,b)=>{ if(!par.has(a)||!par.has(b)) return; a=find(a); b=find(b); if(a!==b) par.set(b,a); };
  if(sc!=='row'){
    const by=new Map(), link=(k,id)=>{ if(!k) return; const f=by.get(k); f?uni(f,id):by.set(k,id); };
    R.forEach(r=>{
      const id=String(r.id), p=path(id)||['','',''];
      link(p[2]&&'s:'+p[2], id);                                          /* 소문항 */
      if(sc==='mid'||sc==='big') link(p[1]&&'m:'+p[1], id);              /* 중문항 */
      if(sc==='big') link(p[0]&&'b:'+p[0], id);                          /* 대문항 */
      const a=String(r.asked||'').replace(/\s+/g,''); if(a.length>=4) link('a:'+a, id);   /* 책이 같은 문제라 적음 */
      try{ (window.__pracRel?window.__pracRel(id):[]).forEach(x=>{ if(x && x.sim>=0.9) uni(id,String(x.id)); }); }catch(e){globalThis.__q?.(e)}
    });
  }
  const g=new Map(); R.forEach(r=>{ const k=find(String(r.id)); (g.get(k)||g.set(k,[]).get(k)).push(String(r.id)); });
  KIN=new Map(); g.forEach(list=>list.forEach(id=>KIN.set(id,list)));
  KSIG=sig; KT=Date.now(); KSC=sc; return KIN;
}
const kinOf=id=>(kinMap().get(String(id))||[String(id)]);
const chkK=id=>Math.max(...kinOf(id).map(chkN));
const okK =id=>Math.max(...kinOf(id).map(okN));
window.__pracKin=kinOf;
window.__pracSame=kinOf;
window.__pracKinScope=()=>SCOPES[scope()];
const okN=id=>{ try{ if(window.__pracOkN) return window.__pracOkN(id); }catch(e){globalThis.__q?.(e)}
  const p=progMap()[String(id)]; return p?(p.ok!=null?(p.ok|0):(p.r==='ok'?1:0)):0; };
window.__pracUnN=unN;
/* 맞음·틀림 기록 — 진도 칸이 저장하는 곳(prac:prog:v1)을 그대로 읽는다 */
const progMap=()=>{ try{ return JSON.parse(localStorage.getItem('prac:prog:v1')||'{}')||{} }catch(e){ return {} } };
/* 오고초려 = 9301년 · 단답 = 94NN년 (가짜 연도 규칙). 이름표를 손으로 바꿔 둔 것도 이름으로 한 번 더 본다. */
function ylab(y){
  let h='';
  try{ h=((window.__pracYLabel&&window.__pracYLabel())||{})[String(y)]||'' }catch(e){globalThis.__q?.(e)}
  if(!h){ try{ h=window.__pracYAuto?window.__pracYAuto(y):'' }catch(e){globalThis.__q?.(e)} }
  return String(h||'');
}
/* ★ v289 — «회차外 −» : 진짜 기출 회차(연도 1~2999)가 아닌 것은 전부 뺀다.
   가짜 연도 = 문제집 자료 — 9301 오고초려 · 9302 핵심빈출 · 94NN 단답 · 95NN 소방 … 새로 생겨도 같이 빠짐 */
function isExcl(r){
  if(!r) return true;
  const y=+r.year;
  return !(y>0 && y<3000);
}
let MODE=null, LAST='all';
window.__pracSeqOn=()=>MODE==='seq'&&!!getRand();
/* ★ v331 — «이 문항이 왜 지금 목록에 없나» — 미니맵 점선 칸 · 레일 끼운 칸 · 미니맵에서 열 때 알림 */
const nmOf=r=>r?`${(+r.year>0&&+r.year<3000)?String(r.year).slice(2):r.year}-${r.session} ${r.no}`:'?';
const shownIds=()=>{ let S=null; try{ S=(typeof SHOWN!=='undefined'?SHOWN:window.SHOWN) }catch(e){ S=window.SHOWN } return new Set((S||[]).map(x=>String(x.id))); };
window.__pracShownIds=shownIds;
window.__pracWhyOut=(id, SH)=>{
  id=String(id);
  const all=rowsAll(), byId=new Map(all.map(x=>[String(x.id),x])), r=byId.get(id); if(!r) return '';
  if((SH||shownIds()).has(id)) return '';
  const y=$('#fYear')?.value||'', s=$('#fSess')?.value||'', q=($('#fQ')?.value||'').trim();
  if(y && String(r.year)!==y) return '위 연도 거르기('+y+'년)에 안 맞음';
  if(s && String(r.session)!==s) return '위 회차 거르기(제'+s+'회)에 안 맞음';
  if(q && !((r.q_text||'').includes(q)||(r.a_text||'').includes(q))) return '찾는 말 «'+q+'» 이 없음';
  try{ if(window.__pracRowPass && !window.__pracRowPass(r)){ const t=tag(id); const TS=((window.__pracTiers&&window.__pracTiers())||[]).map(k=>({g:'금',s:'은',b:'동',r:'똥'})[k]).join('·');
    return `등급 거르기(${TS||'켜 둔 것'})에 안 맞음 — 이 문항은 ${t?({g:'금',s:'은',b:'동',r:'똥'})[t.tier]||t.tier:'?'}`; } }catch(e){globalThis.__q?.(e)}
  const kinTxt=f=>{ const ks=kinOf(id).filter(k=>k!==id).map(k=>[k,f(k)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,3);
    return ks.length?` (같은 문제 ${ks.map(([k,n])=>nmOf(byId.get(k))+' '+n+'번').join(' · ')})`:''; };
  const d=dup(), R0=getRand();
  if(R0){
    const M=MODES[MODE]||{};
    if(MOD.nx && isExcl(r)) return '«회차外 −» 가 켜져 있음 (문제집 자료)';
    if(MOD.ck && chkK(id)>=ckN()) return `«체크 − ${ckN()}» — ${ckN()}번 이상 푼 문항은 뺌 · 이 문항 ${chkN(id)}번`+kinTxt(chkN);
    if(MOD.un && okK(id)>=unN()) return `«맞힘 − ${unN()}» — ${unN()}번 이상 맞힌 문항은 뺌 · 이 문항 ${okN(id)}번`+kinTxt(okN);
    if(M.tiers){ const t=tag(id); if(!t || !M.tiers.includes(t.tier)) return `«${M.nm}» 은 ${M.tiers.map(k=>({g:'금',s:'은',b:'동'})[k]).join('·')} 등급만 뽑음`; }
    if(!M.recent && d && d.fold && d.hide && d.hide.has(id)){ const rp=window.__pracRepOf&&window.__pracRepOf(id); return `중복 묶기(동일 −·유사 −)로 접힘 — 대표 ${nmOf(byId.get(String(rp)))}`; }
    if(M.dedupe) return '같은 문제·같은 유형은 하나만 뽑아서 다른 쪽이 걸림';
    if(!M.recent) return `랜덤 ${R0.length}개 뽑기에 안 걸림 (다시 누르면 새로 뽑음)`;
    return '최신순 목록 밖 (다시 누르면 새로 만듦)';
  }
  if(d && d.on && d.hide && d.hide.has(id)){ const rp=window.__pracRepOf&&window.__pracRepOf(id); return `중복 묶기(동일 −·유사 −)로 접힘 — 대표 ${nmOf(byId.get(String(rp)))} 칸의 ▾ 에 있음`; }
  return '다른 거르기(안 된 것만 · 출처 · 실패 모음 등)가 켜져 있음';
};

/* 위 거르기를 그대로 겹친다 — 목록이 쓰는 조건과 같아야 뽑은 수만큼 나온다 */
function basePool(all){
  const y=$('#fYear')?.value||'', s=$('#fSess')?.value||'', q=($('#fQ')?.value||'').trim();
  let pool=rowsAll();
  if(y) pool=pool.filter(r=>String(r.year)===y);
  if(s) pool=pool.filter(r=>String(r.session)===s);
  if(q) pool=pool.filter(r=>(r.q_text||'').includes(q)||(r.a_text||'').includes(q));
  try{ if(window.__pracRowPass) pool=pool.filter(window.__pracRowPass); }catch(e){globalThis.__q?.(e)}
  const d=dup(); if(!all && d && (d.fold!=null?d.fold:d.on) && d.hide) pool=pool.filter(r=>!d.hide.has(String(r.id)));   /* ★ v330 — 최신순은 접힌 것도 전부 */
  return pool;
}
const shuffle=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
/* 같은 덩어리(유형·중복)는 하나만 — 섞은 뒤 먼저 나온 것을 남기므로 매번 다른 회차가 걸린다 */
function dedupe(pool){
  const d=dup(), key=new Map();
  if(d && d.groups) d.groups.forEach((list,rep)=>(list||[]).forEach(r=>key.set(String(r.id),'g'+rep)));
  const seen=new Set(), out=[];
  shuffle(pool).forEach(r=>{ const k=key.get(String(r.id))||('r'+r.id); if(seen.has(k)) return; seen.add(k); out.push(r); });
  return out;
}
function draw(mode){
  const M=MODES[mode]; if(!M) return;
  let pool=basePool(!!M.recent);
  if(M.tiers){
    if(pool.length && !tag(pool[0].id)) return say('등급을 세는 중입니다 — 잠시 뒤 다시 눌러 주세요');
    pool=pool.filter(r=>{ const t=tag(r.id); return t && M.tiers.includes(t.tier); });
  }
  if(MOD.nx) pool=pool.filter(r=>!isExcl(r));
  if(MOD.ck){ const N=ckN(); pool=pool.filter(r=>chkK(r.id)<N); }        /* ★ v286 — 같은 문제끼리 같이 셈 */
  if(MOD.un){ const N=unN(); pool=pool.filter(r=>okK(r.id)<N); }
  /* ★ v312 — 최신순: 진짜 회차(연도 1~2999)를 연도↓ 회차↓ 번호↑ 로, 문제집 자료(가짜 연도)는 맨 뒤 */
  const newest=(a,b)=>(isExcl(a)-isExcl(b)) || ((+b.year||0)-(+a.year||0)) || ((+b.session||0)-(+a.session||0)) || ((+a.no||0)-(+b.no||0));
  pool = M.recent ? pool.slice().sort(newest) : M.dedupe ? dedupe(pool) : shuffle(pool);
  if(!pool.length){
    const tierOn=!!document.querySelector('#tagRow button[data-tier].on');
    return alert(`지금 조건에 맞는 ${M.sh} 문항이 없습니다.`+(tierOn&&M.tiers?'\n위 «등급» 거르기가 켜져 있으면 풀어 보세요.':'')
      +(MOD.ck?`\n«체크 − (${ckN()})» — 이 조건에서 ${ckN()}회독 끝. + 로 올리면 다음 회독.`:'')
      +(MOD.un?`\n«맞힘 − (${unN()})» — 다 맞혔으면 + 로 올리세요.`:''));
  }
  const want=$('#fRandN')?.value||'20';
  const n=(want==='all'||M.recent)?pool.length:Math.min(pool.length, +want||20);
  let pick;
  if(M.recent) pick=pool;
  else if(MOD.ord){
    /* 확률 높은 순 — 섞어 둔 뒤 안정 정렬이라 같은 확률끼리는 매번 순서가 바뀐다 */
    const pv=r=>{ const t=tag(r.id); return t && isFinite(t.p) ? +t.p : -1; };
    pick=pool.slice().sort((a,b)=>pv(b)-pv(a)).slice(0,n);
  }else if(M.weight){
    /* 가중 무작위(Efraimidis–Spirakis) — 확률 40% 짜리는 5% 짜리보다 8배 잘 걸린다 */
    pick=pool.map(r=>[Math.pow(Math.random(), 1/Math.max(1,(tag(r.id)||{}).p||1)), r])
             .sort((a,b)=>b[0]-a[0]).slice(0,n).map(x=>x[1]);
  }else pick=pool.slice(0,n);

  setRand(pick.map(r=>r.id)); MODE=mode; LAST=mode;
  try{ HIDE_ALL=true }catch(e){globalThis.__q?.(e)}                        /* 풀어 보는 용도라 답안을 가린 채로 */
  const fa=$('#fAns'); if(fa){ fa.classList.add('on'); fa.textContent='답안 모두 가리기'; }
  paint(); try{ paintRand() }catch(e){globalThis.__q?.(e)}
  try{ drawList() }catch(e){globalThis.__q?.(e)}
  try{ if(document.body.classList.contains('oneup') && typeof window.showAt==='function') window.showAt(0) }catch(e){globalThis.__q?.(e)}
  const on=Object.keys(MODS).filter(k=>MOD[k]).map(k=>MODS[k].nm);
  const TSN=((window.__pracTiers&&window.__pracTiers())||[]).map(t=>({g:'금',s:'은',b:'동',r:'똥'})[t]).join('·');
  say(`${M.recent?'📅':'🎲'} ${M.nm}${TSN?' ['+TSN+']':''}${on.filter(x=>!(M.recent&&x==='확률순')).length?' + '+on.filter(x=>!(M.recent&&x==='확률순')).join(' + '):''} ${pick.length}문항${M.dedupe?' · 중복 제외':''}${M.recent&&pick.length?` · ${pick[0].year}년 ${pick[0].session}회부터`:''}`);
}
function clear(){
  setRand(null); MODE=null;
  paint(); try{ paintRand() }catch(e){globalThis.__q?.(e)}
  try{ drawList() }catch(e){globalThis.__q?.(e)}
}
function paint(){
  if(!getRand()) MODE=null;
  $$('#dRand [data-rand]').forEach(b=>{
    const on=b.dataset.rand===MODE;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on?'true':'false');
    b.title=MODES[b.dataset.rand].tip + (on?' — 다시 누르면 새로 뽑습니다':'');
  });
  $$('#dRand [data-rmod]').forEach(b=>{
    const on=!!MOD[b.dataset.rmod];
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on?'true':'false');
    if(b.dataset.rmod==='un') b.title=`맞힘 −  : ${unN()}번 이상 맞힌 문항을 뺍니다 (숙달) — 옆 − + 로 N`;
    if(b.dataset.rmod==='ck') b.title=`체크 −  : ${ckN()}번 이상 푼 문항을 뺍니다 (회독) — 옆 − + 로 N`;
  });
  [['un',unN],['ck',ckN]].forEach(([k,f])=>{ const nv=$('#'+k+'Nv'); if(nv){ const t=String(f()); if(nv.textContent!==t) nv.textContent=t; nv.parentElement.classList.toggle('on', !!MOD[k]); } });
  const TS=(window.__pracTiers&&window.__pracTiers())||[];
  $$('#dRand [data-rtier]').forEach(b=>{ const k=b.dataset.rtier, on=k==='all'?!TS.length:TS.includes(k);
    if(b.classList.contains('on')!==on) b.classList.toggle('on', on); b.setAttribute('aria-pressed', on?'true':'false'); });
  const x=$('#randClear'), R=getRand();
  if(x){ x.hidden=!R; const t=R?`✕ 해제 (${R.length})`:'✕ 해제'; if(x.textContent!==t) x.textContent=t; }
}
function mount(){
  const f2=$('#dFind2'); if(!f2 || $('#dRand')) return false;
  const row=document.createElement('div'); row.className='drow'; row.id='dRand';
  row.innerHTML=`<span class="tl">랜덤</span><span class="rseg" role="group" aria-label="랜덤 뽑기">`
    + Object.entries(MODES).map(([k,m])=>`<button type="button" class="chip rbtn" data-rand="${k}" title="${m.nm} — ${m.tip}">${m.sh}</button>`).join('')
    + `</span>`
    /* ★ v322 — 등급 겹쳐 고르기 (위 «등급» 줄과 같은 설정) — 전체 랜덤 · 최신순에 바로 걸림 */
    + `<span class="rseg rtier" role="group" aria-label="등급"><span class="rtl" title="위 «등급» 줄과 같은 설정 · 여러 개 함께 고를 수 있음">등급</span>`
    + [['all','전체'],['g','금'],['s','은'],['b','동'],['r','똥']].map(([k,n])=>`<button type="button" class="chip rtb t-${k}" data-rtier="${k}" title="${k==='all'?'등급 거르기 없음':n+' 등급 — 여러 개 함께 켤 수 있음'}">${n}</button>`).join('')
    + `</span>`
    + `<span class="rseg rmods" role="group" aria-label="겹치기"><span class="rtl" title="겹치기 — 여러 개 같이 켤 수 있음">＋</span>`
    + Object.entries(MODS).map(([k,m])=>`<button type="button" class="chip rmod" data-rmod="${k}" title="${m.tip}">${m.nm}</button>`
        + (k==='un'||k==='ck'?`<span class="rstep" data-for="${k}" title="N 조절"><button type="button" data-stp="${k}" data-d="-1" aria-label="줄이기">−</button><b id="${k}Nv">1</b><button type="button" data-stp="${k}" data-d="1" aria-label="늘리기">＋</button></span>`:'')).join('')
    + `</span>`;
  f2.after(row);
  const n=$('#fRandN'); if(n) row.appendChild(n);
  const x=document.createElement('button');
  x.type='button'; x.className='chip rx'; x.id='randClear'; x.hidden=true; x.title='랜덤을 풀고 원래 목록으로';
  x.textContent='✕ 해제'; row.appendChild(x);
  const note=document.createElement('span'); note.className='rnote';
  note.textContent='랜덤 하나(또는 📅 최신순) + 겹치기 여러 개 · 빈출·금·은은 같은 문제·같은 유형을 하나만 · 최신순은 섞지 않고 26년부터 전부 · 겹치기를 바꾸면 바로 다시 뽑음';
  row.title=note.textContent;               /* ★ v289 — 설명 줄은 숨기고 올리면 보이게 */
  row.appendChild(note);
  row.addEventListener('click', e=>{
    const tb=e.target.closest('[data-rtier]');
    if(tb){ if(!window.__pracTierSet) return say('등급을 세는 중입니다 — 잠시 뒤 다시 눌러 주세요');
      const k=tb.dataset.rtier, cur=(window.__pracTiers&&window.__pracTiers())||[];
      const nx = k==='all' ? [] : (cur.includes(k) ? cur.filter(x=>x!==k) : cur.concat(k));
      window.__pracTierSet(nx); paint(); return; }
    const b=e.target.closest('[data-rand]'); if(b) return draw(b.dataset.rand);
    const st=e.target.closest('[data-stp]');
    if(st){ const k=st.dataset.stp, cur=k==='ck'?ckN():unN();
      MOD[k+'N']=Math.min(20,Math.max(1,cur+(+st.dataset.d))); saveMod(); paint(); if(getRand() && MODE && MOD[k]) draw(MODE); return; }
    const mb=e.target.closest('[data-rmod]');
    if(mb){ const k=mb.dataset.rmod; MOD[k]=!MOD[k]; saveMod(); paint(); if(getRand() && MODE) draw(MODE); return; }
    if(e.target.closest('#randClear')) clear();
  });

  /* 예전 🎲 단추로 들어오던 길(거르기를 바꾸면 «그 조건으로 다시 뽑기» 등)을 새 방식으로 잇는다 */
  const old=$('#fRand');
  if(old) old.onclick=()=>{ if(getRand()) return clear(); draw(LAST); };
  if(n) n.onchange=()=>{ if(getRand() && MODE) draw(MODE); };
  /* «필터 초기화» 가 랜덤을 못 풀던 것(엉뚱한 변수를 비우고 있었다) */
  $('#filterReset')?.addEventListener('click', ()=>{ if(getRand()) clear(); });
  paint();
  return true;
}
const t=setInterval(()=>{ if(mount()) clearInterval(t); }, 400);
setTimeout(()=>clearInterval(t), 30000);
setInterval(paint, 1000);
window.__pracRandom={ draw, clear, modes:MODES };

/* 폰 — 예전엔 진행 칸의 «도구 ▾» 로 찾기·보기를 접어 두고 시작했다.
   진행 칸이 빠졌으니, 폰에서 한 번도 고른 적이 없으면 «▲ 도구 접기» 를 접힌 채로 시작한다
   (안 그러면 문제까지 도구 800px 을 밀고 내려가야 한다). */
try{
  if(matchMedia('(max-width:820px)').matches && localStorage.getItem('prac:deckfold')===null)
    document.body.classList.add('deck-fold');
}catch(e){globalThis.__q?.(e)}
})();
