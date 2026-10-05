/* practice.html 에서 분리 (v341) — 원래 22194번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||alert)(m) }catch(e){globalThis.__q?.(e)} };
const COST0={ sonnet:30, opus:80 };
/* ★ v328 — 예상 금액: 이 기기에서 실제로 쓴 평균(3번 이상 뽑은 뒤)이 있으면 그걸로 */
const COST=new Proxy(COST0, { get:(t,k)=>{ try{ const a=window.__pxBillAvg&&window.__pxBillAvg(String(k)); if(a) return a; }catch(e){globalThis.__q?.(e)} return t[k]; } });
const NM={ sonnet:'Sonnet', opus:'Opus' };
const K='prac:pxrun:v1';
let OPT=(()=>{ try{ return Object.assign({ m:'sonnet', sc:'one', re:false, c:2 }, JSON.parse(localStorage.getItem(K)||'{}')) }catch(e){ return { m:'sonnet', sc:'one', re:false, c:2 } } })();
const keep=()=>{ try{ localStorage.setItem(K, JSON.stringify(OPT)) }catch(e){globalThis.__q?.(e)} };

const shown=()=>{ try{ return Array.isArray(window.SHOWN)?window.SHOWN:[] }catch(e){ return [] } };
const all=()=>{ try{ return (window.__pxRows&&window.__pxRows())||shown() }catch(e){ return shown() } };
const nowId=()=>{ try{ return (window.__pxNowId&&window.__pxNowId())||'' }catch(e){ return '' } };
const nowRow=()=>{ const id=nowId(); return id?all().find(r=>String(r.id)===id)||null:null };
const sameSess=r=>x=>String(x.year)===String(r.year)&&String(x.session)===String(r.session)
  &&(!r.subject_id||String(x.subject_id)===String(r.subject_id));
const sessRows=()=>{ const r=nowRow(); if(!r) return [];
  return all().filter(sameSess(r)).sort((a,b)=>(+a.no||0)-(+b.no||0)); };
/* ★ v267 — 🔒 쉬운해설 고정 문항 */
const fx=r=>{ try{ return !!(r && window.__ezFixed && window.__ezFixed(r.id||r)) }catch(e){ return false } };

/* ══ ① «⋯» · ② 둘째 줄 · 이동줄 ══ */
function mount(){
  const oh=$('#ovl .oh'); if(!oh) return;
  const close=$('#ovClose',oh), ot=$('.ot',oh);
  if(close && !$('#pxRunBtn',oh)){
    const run=document.createElement('button'); run.type='button'; run.className='pxrunbtn'; run.id='pxRunBtn';
    run.textContent='✎ 해설 돌리기';
    close.after(run);
    run.onclick=()=>openRun();
  }
  if(ot && !$('#pxPick',oh)){
    const k=document.createElement('span'); k.className='pxsel'; k.id='pxPick';
    k.innerHTML=`<select id="pxSelY" title="년도"></select><select id="pxSelS" title="회차"></select><select id="pxSelN" title="번호"></select>`;
    ot.before(k);   /* 제목칸 «밖» 에 — 제목칸이 줄어들어도 잘리지 않게 */
    k.addEventListener('keydown',e=>e.stopPropagation());   /* ← → 가 문항 넘기기로 새지 않게 */
    k.addEventListener('change',e=>{
      const w={pxSelY:'y',pxSelS:'s',pxSelN:'n'}[e.target.id];
      const hit=pickTarget($('#pxSelY').value,$('#pxSelS').value,$('#pxSelN').value,w);
      if(hit) goRow(hit);
    });
  }
}

const TLV={g:'금',s:'은',b:'동',r:'똥'};
/* 문제집 자료는 «가짜 연도»(9419 · 9523 · 9301 …)로 들어 있다 — 이름표로 바꿔 보여 준다 */
const isReal=y=>+y>0&&+y<3000;
function ylab(y){
  if(isReal(y)) return y+'년';
  let h=''; try{ h=(window.__pracYLabel&&window.__pracYLabel()||{})[String(y)]||'' }catch(e){globalThis.__q?.(e)}
  let a=''; try{ a=window.__pracYAuto?window.__pracYAuto(y):'' }catch(e){globalThis.__q?.(e)}
  return h||a||('자료 '+y);
}
function slab(y,se){ try{ if(window.__pracSessLabel) return window.__pracSessLabel(y,se) }catch(e){globalThis.__q?.(e)} return '제'+se+'회'; }
/* 진짜 연도 먼저(최신순), 문제집은 뒤로 */
const ysort=(a,b)=>(isReal(a)?0:1)-(isReal(b)?0:1) || (isReal(a) ? b-a : a-b);
function infoHtml(id){
  let t=null; try{ t=id&&window.__pracTag?window.__pracTag(id):null }catch(e){globalThis.__q?.(e)}
  if(!t) return '';
  return `<span class="fqb ${t.tier} tier" title="등급 — 확률 25/15/8% 또는 누적 5/3/2번 중 하나만 넘으면 금/은/동, 한 번뿐이면 똥">${TLV[t.tier]||'—'}</span>`
   +`<span class="fqb ${t.tier==='g'?'hot':''}" title="다음 1년 안에 이 유형이 나올 확률">${t.p}%</span>`
   +`<span class="fqb yr" title="같은 유형 — 최근 5년 ${t.n5}회 · 통틀어 ${t.nAll}회">누적 ${t.nAll}회</span>`;
}
const selOpts=(r)=>{
  const rs=all();
  const ys=[...new Set(rs.map(x=>String(x.year)))].sort(ysort);
  const ss=[...new Set(rs.filter(x=>String(x.year)===String(r.year)).map(x=>String(x.session)))].sort((a,b)=>a-b);
  const ns=rs.filter(sameSess(r)).map(x=>String(x.no)).sort((a,b)=>a-b);
  const opt=(list,cur,f)=>list.map(v=>`<option value="${v}"${v===String(cur)?' selected':''}>${f(v)}</option>`).join('');
  return { y:opt(ys,r.year,ylab), s:opt(ss,r.session,v=>slab(r.year,v)), n:opt(ns,r.no,v=>v+'번'), sig:[r.id,ys,ss,ns].join('|') };
};
/* 고른 값 → 갈 문항 */
function pickTarget(y,se,n,which){
  const rs=all();
  const bySess=(yy,ss)=>rs.filter(r=>String(r.year)===yy&&String(r.session)===ss).sort((a,b)=>(+a.no||0)-(+b.no||0));
  if(which==='y'){
    const ss=[...new Set(rs.filter(r=>String(r.year)===y).map(r=>String(r.session)))].sort((a,b)=>a-b);
    return ss.length?bySess(y,ss[0])[0]:null;
  }
  if(which==='s') return bySess(y,se)[0];
  return bySess(y,se).find(r=>String(r.no)===n);
}
/* 일반 보기에서 옮겨 가기 — 목록에 없으면 위쪽 년도·회차 거르기를 그 문항에 맞춘 뒤 간다 */
function syncFilter(r){
  if(shown().some(x=>String(x.id)===String(r.id))) return;
  const fy=$('#fYear'), fs=$('#fSess'); let ch=false;
  if(fy && fy.value && fy.value!==String(r.year)){ fy.value=String(r.year); ch=true; }
  if(fs && fs.value && fs.value!==String(r.session)){
    fs.value=[...fs.options].some(o=>o.value===String(r.session))?String(r.session):''; ch=true;
  }
  if(ch) (fy||fs).dispatchEvent(new Event('change'));
}
function goList(r){
  syncFilter(r);
  const i=shown().findIndex(x=>String(x.id)===String(r.id));
  if(i>=0 && typeof window.showAt==='function') return void window.showAt(i);
  try{ window.ovOpen && window.ovOpen(r.id) }catch(e){globalThis.__q?.(e)}   /* 검색·랜덤에 걸려 목록에 못 넣으면 한눈에로 */
}
function cardHead(){
  if(!document.body.classList.contains('oneup')) return;
  const rs=shown();
  $$('#list > .pcard').forEach(card=>{
    const head=card.querySelector(':scope > .phead'); if(!head) return;
    const id=String(card.dataset.id||''); const r=all().find(x=>String(x.id)===id); if(!r) return;
    let L=head.querySelector(':scope > .pxhd.l'), R=head.querySelector(':scope > .pxhd.r');
    if(!L){
      L=document.createElement('div'); L.className='pxhd l';
      L.innerHTML=`<span class="pxsel"><select data-k="y" title="년도"></select><select data-k="s" title="회차"></select><select data-k="n" title="번호"></select></span>
        <span class="meta"></span><span class="pxinfo"></span>`;
      R=document.createElement('div'); R.className='pxhd r';
      R.innerHTML=`<button type="button" data-hd="ov">⛶ 한눈에</button><button type="button" class="ok" data-hd="ok" title="회독 +1 (풀었음)">＋ 회독</button><button type="button" class="no" data-hd="no">✕ 틀림</button>`;
      head.appendChild(L); head.appendChild(R);
      /* 머리 전체가 «한눈에 열기» 라, 여기서 누른 것이 새어 나가지 않게 막는다 */
      [L,R].forEach(x=>['click','pointerdown','mousedown','keydown'].forEach(ev=>x.addEventListener(ev,e=>e.stopPropagation())));
      L.addEventListener('change',e=>{
        const g=k=>L.querySelector(`[data-k="${k}"]`).value;
        const hit=pickTarget(g('y'),g('s'),g('n'),e.target.dataset.k);
        if(hit) goList(hit);
      });
      R.addEventListener('click',e=>{
        const b=e.target.closest('[data-hd]'); if(!b) return;
        if(b.dataset.hd==='ov'){ try{ window.ovOpen(id) }catch(x){globalThis.__q?.(x)} return; }
        card.querySelector(`[data-result="${b.dataset.hd==='no'?'no':'ok'}"]`)?.click();   /* ★ v304 — 틀림도 */
        setTimeout(()=>paintCard(card),80);
      });
    }
    const i=rs.findIndex(x=>String(x.id)===id);
    const meta=[r.points?r.points+'점':'', r.asked?'출제 '+r.asked:'', i>=0?`${i+1}/${rs.length}`:''].filter(Boolean).join(' · ');
    const m=L.querySelector('.meta'); if(m.textContent!==meta) m.textContent=meta;
    const sels=[...L.querySelectorAll('select')];
    if(!sels.includes(document.activeElement)){
      const o=selOpts(r);
      if(L.dataset.sig!==o.sig){ L.dataset.sig=o.sig;
        sels[0].innerHTML=o.y; sels[1].innerHTML=o.s; sels[2].innerHTML=o.n; }
    }
    const inf=infoHtml(id), box=L.querySelector('.pxinfo');
    if(box.dataset.h!==inf){ box.dataset.h=inf; box.innerHTML=inf; }
    paintCard(card);
  });
}
function paintCard(card){
  const b=card.querySelector('.pxhd.r [data-hd="ok"]'); if(!b) return;
  b.classList.toggle('on', card.dataset.result==='ok' || !!card.querySelector('[data-result="ok"].on'));
  card.querySelector('.pxhd.r [data-hd="no"]')?.classList.toggle('on', card.dataset.result==='no');
}
/* 목록이 새로 그려지면 바로 붙인다(깜빡임 없게) — #list 바로 아래만 본다 */
(function watch(){
  const l=$('#list'); if(!l) return void setTimeout(watch,500);
  new MutationObserver(()=>{ try{ cardHead() }catch(e){globalThis.__q?.(e)} }).observe(l,{childList:true});
})();

let INFOSIG='';
function paintInfo(){
  const ot=$('#ovl .oh .ot'); if(!ot) return;
  let box=$('#pxInfo',ot);
  if(!box){ box=document.createElement('span'); box.className='pxinfo'; box.id='pxInfo'; ot.appendChild(box); }
  const id=nowId(); let t=null;
  try{ t=id&&window.__pracTag?window.__pracTag(id):null }catch(e){globalThis.__q?.(e)}
  const sig=t?`${id}|${t.p}|${t.tier}|${t.nAll}|${t.n5}`:id+'|-';
  if(sig===INFOSIG) return; INFOSIG=sig;
  if(!t){ box.innerHTML=''; return; }
  box.innerHTML=infoHtml(id);
}
let PICKSIG='';
function paintAt(){
  if(!$('#ovl')?.classList.contains('on')) return;
  paintInfo();
  const Y=$('#pxSelY'), S=$('#pxSelS'), N=$('#pxSelN'); if(!Y) return;
  if([Y,S,N].includes(document.activeElement)) return;   /* 펼쳐 놓은 동안엔 안 건드림 */
  const r=nowRow(); if(!r) return;
  const o=selOpts(r);
  if(o.sig===PICKSIG) return; PICKSIG=o.sig;
  Y.innerHTML=o.y; S.innerHTML=o.s; N.innerHTML=o.n;
}
function goRow(r){
  syncFilter(r);                               /* 아래 레일·목록이 새 회차를 따라오게 */
  const rs=shown(), i=rs.findIndex(x=>String(x.id)===String(r.id));
  try{ if(i>=0 && document.body.classList.contains('oneup') && typeof window.showAt==='function') window.showAt(i) }catch(e){globalThis.__q?.(e)}
  try{ if(typeof window.ovOpen==='function') window.ovOpen(r.id) }catch(e){globalThis.__q?.(e)}
}
/* ══ ③ 해설 돌리기 ══ */
let PAN=null, RUN=null, PICK=new Set(), STATE={};
function panel(){
  if(PAN) return PAN;
  PAN=document.createElement('div'); PAN.className='pxrun'; PAN.id='pxRun';
  PAN.innerHTML=`
    <div class="hd"><b>✎ 해설 돌리기</b><button class="x" type="button" data-x>✕</button></div>
    <div class="row"><span class="lb">모델</span><span class="seg" data-g="m">
      <button type="button" data-v="sonnet">Sonnet<small>~30원</small></button>
      <button type="button" data-v="opus">Opus<small>~80원</small></button></span></div>
    <div class="row"><span class="lb">범위</span><span class="seg" data-g="sc">
      <button type="button" data-v="one">이 문제</button>
      <button type="button" data-v="sess">이 회차</button>
      <button type="button" data-v="pick">고른 번호</button>
      <button type="button" data-v="list">목록 전체</button></span></div>
    <div class="row" style="justify-content:space-between"><span class="lb" id="pxSessNm" style="width:auto">번호</span>
      <span class="mini"><button type="button" data-p="empty">해설 없는 것</button>
      <button type="button" data-p="all">전체</button><button type="button" data-p="none">비우기</button></span></div>
    <div class="nos" id="pxNos"></div>
    <div class="row"><label class="ck"><input type="checkbox" id="pxRe"> 이미 해설 있는 것도 다시 쓰기</label></div>
    <div class="row"><span class="lb">동시</span><span class="seg" data-g="c">
      <button type="button" data-v="1">1</button><button type="button" data-v="2">2</button>
      <button type="button" data-v="3">3</button></span></div>
    <div class="foot"><span class="sum" id="pxSum">—</span><button type="button" class="again" id="pxAgain">↻ 실패만 다시</button><button type="button" class="go" id="pxGo">▶ 시작</button></div>
    <div class="bar" id="pxBar"><i></i></div>
    <div class="log" id="pxLog"></div>`;
  document.body.appendChild(PAN);
  PAN.addEventListener('click',e=>{
    if(e.target.closest('[data-x]')) return void PAN.classList.remove('on');
    const sb=e.target.closest('.seg[data-g] button');
    if(sb){ if(RUN) return; const g=sb.parentElement.dataset.g;
      OPT[g] = g==='c' ? +sb.dataset.v : sb.dataset.v; keep(); return void paint(); }
    const p=e.target.closest('[data-p]');
    if(p){ if(RUN) return; const rs=sessRows();
      if(p.dataset.p==='none') PICK.clear();
      else rs.forEach(r=>{ if(!fx(r) && (p.dataset.p==='all' || !r.easy_md)) PICK.add(String(r.id)); });
      OPT.sc='pick'; keep(); return void paint(); }
    const n=e.target.closest('.no[data-id]');
    if(n){ if(RUN) return; const id=n.dataset.id;
      if(fx(id) && !PICK.has(id)) return void say('🔒 쉬운해설 고정 문항입니다 — 쉬운 풀이 칸에서 고정을 풀어야 고를 수 있습니다');
      PICK.has(id)?PICK.delete(id):PICK.add(id); OPT.sc='pick'; keep(); return void paint(); }
    if(e.target.closest('#pxGo')) return void (RUN ? stop() : start());
    if(e.target.closest('#pxAgain')) return void again();
  });
  $('#pxRe',PAN).onchange=e=>{ OPT.re=e.target.checked; keep(); paint(); };
  PAN.addEventListener('keydown',e=>e.stopPropagation());
  return PAN;
}
function openRun(){
  const p=panel();
  if(p.classList.contains('on') && !RUN) return void p.classList.remove('on');
  /* 회차가 바뀌었으면 고른 번호를 비운다 */
  const r=nowRow(); const sig=r?`${r.subject_id}|${r.year}|${r.session}`:'';
  if(p.dataset.sig!==sig){ p.dataset.sig=sig; if(!RUN){ PICK.clear(); STATE={}; } }
  p.classList.add('on'); paint();
}

/* 돌릴 문항 — 범위대로 고르고, 필요하면 해설 있는 것은 뺀다 */
function scopeRows(){
  let rs=[];
  if(OPT.sc==='one'){ const r=nowRow(); rs=r?[r]:[]; }
  else if(OPT.sc==='sess') rs=sessRows();
  else if(OPT.sc==='pick'){ const m=new Map(all().map(r=>[String(r.id),r])); rs=[...PICK].map(id=>m.get(id)).filter(Boolean); }
  else rs=shown().slice();
  return rs;
}
function targets(){
  const noAns=r=>!r.a_url && !r.a_text && !r.a_md;
  return scopeRows().filter(r=>!noAns(r) && !fx(r) && (OPT.re || OPT.sc==='one' || OPT.sc==='pick' || !r.easy_md));
}

function paint(){
  if(!PAN) return;
  $$('.seg[data-g] button',PAN).forEach(b=>{
    const g=b.parentElement.dataset.g;
    b.classList.toggle('on', String(OPT[g])===b.dataset.v);
    b.disabled=!!RUN;
  });
  $('#pxRe',PAN).checked=!!OPT.re;
  const r=nowRow(), rs=sessRows();
  $('#pxSessNm',PAN).textContent = r ? `${r.year}년 ${r.session}회` : '번호';
  const nowS=r?String(r.id):'';
  const html=rs.map(x=>{
    const id=String(x.id), st=STATE[id]||'';
    return `<button type="button" class="no${x.easy_md?' has':''}${fx(x)?' fix':''}${PICK.has(id)?' sel':''}${st?' '+st:''}${id===nowS?' now':''}"
      data-id="${id}" title="${x.no}번${x.easy_md?' · 해설 있음':''}${fx(x)?' · 🔒 고정 (안 돌림)':''}${st==='bad'?' · 실패':''}">${x.no}</button>`;
  }).join('');
  const box=$('#pxNos',PAN); if(box.innerHTML!==html) box.innerHTML=html;
  const ts=RUN?RUN.list:targets();
  const skip = (OPT.sc==='sess'||OPT.sc==='list') && !OPT.re
    ? (OPT.sc==='sess'?rs:shown()).filter(x=>x.easy_md && !fx(x)).length : 0;
  const fixN = RUN ? 0 : scopeRows().filter(fx).length;
  const fixT = fixN ? ` · 🔒 고정 ${fixN}개 건너뜀` : '';
  const go=$('#pxGo',PAN);
  if(RUN){
    $('#pxSum',PAN).innerHTML=`<b>${RUN.done}/${RUN.list.length}</b> · 성공 ${RUN.ok} · 실패 ${RUN.bad} · 쓴 돈 약 ${(RUN.krw|0).toLocaleString()}원`;
    go.textContent='■ 중지'; go.classList.add('stop'); go.disabled=RUN.halt;
  }else{
    $('#pxSum',PAN).innerHTML = ts.length
      ? `<b>${ts.length}문항</b> · ${NM[OPT.m]} · 약 ${(ts.length*COST[OPT.m]).toLocaleString()}원${skip?` · 해설 있는 ${skip}개 건너뜀`:''}${fixT}`
      : (OPT.sc==='one' && fixN ? '이 문제는 🔒 쉬운해설 고정입니다'
        : OPT.sc==='pick' ? '번호를 눌러 고르세요' : '돌릴 문항이 없습니다'+fixT);
    go.textContent='▶ 시작'; go.classList.remove('stop'); go.disabled=!ts.length;
  }
  const bad=Object.values(STATE).filter(v=>v==='bad').length;
  const ag=$('#pxAgain',PAN); if(ag){ ag.classList.toggle('on', !RUN && bad>0); ag.textContent=`↻ 실패한 ${bad}개 다시`; }
  const btn=$('#pxRunBtn');
  if(btn){ btn.classList.toggle('busy',!!RUN);
    btn.textContent = RUN ? `✎ 해설 ${RUN.done}/${RUN.list.length}` : '✎ 해설 돌리기'; }
}
function log(m){ const l=$('#pxLog'); if(!l) return; l.textContent=(m+'\n'+l.textContent).slice(0,2000); }

/* 서버가 붐빌 때(529 overloaded · 502/503) 는 잠깐 쉬었다 다시 — 이런 실패는 요금이 안 붙는다 */
const BUSY=m=>/\b529\b|overload|\b50[234]\b|rate.?limit|\b429\b/i.test(m) && !/3분을 넘겨/.test(m);
const nice=m=>BUSY(m) ? 'Anthropic 서버 혼잡(529)' : String(m).replace(/\{[\s\S]*$/,'').slice(0,90);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function again(){
  if(RUN) return;
  const m=new Map(all().map(r=>[String(r.id),r]));
  const ids=Object.keys(STATE).filter(id=>STATE[id]==='bad');
  if(!ids.length) return;
  /* ★ v325 — 실패한 뒤에 고정한 문항은 «다시» 에서도 뺀다 */
  const rs=ids.map(id=>m.get(id)).filter(Boolean), keep=rs.filter(r=>!fx(r));
  if(rs.length>keep.length){ rs.filter(fx).forEach(r=>{ STATE[String(r.id)]=''; }); say(`🔒 고정 ${rs.length-keep.length}문항은 빼고 다시 돌립니다`); }
  if(!keep.length) return void paint();
  start(keep);
}
async function start(given){
  if(RUN) return;
  if(typeof window.__pxSolOne!=='function') return say('해설 모듈이 아직 안 실렸습니다 — 잠시 뒤 다시');
  /* ★ v325 — 어떤 길로 들어와도 고정 문항은 «해설 돌리기» 에서 돌리지 않음 (이미 해설 있는 것도 다시 쓰기 · 이 문제 · 고른 번호 모두) */
  const list=(Array.isArray(given)?given:targets()).filter(r=>!fx(r)); if(!list.length) return;
  const cost=(list.length*COST[OPT.m]).toLocaleString();
  if(list.length>1 && !confirm(`${list.length}문항을 ${NM[OPT.m]} 로 해설합니다 (약 ${cost}원).\n시작할까요?`)) return;
  if(list.length===1 && list[0].easy_md && !confirm(`${list[0].no}번 해설이 이미 있습니다. ${NM[OPT.m]} 로 다시 쓸까요?`)) return;
  RUN={ list, done:0, ok:0, bad:0, halt:false, which:OPT.m, krw:0 };
  list.forEach(r=>{ STATE[String(r.id)]=''; });
  $('#pxLog').textContent=''; $('#pxBar').style.display='block'; $('#pxBar i').style.width='0';
  paint();
  let next=0;
  const worker=async()=>{
    while(!RUN.halt && next<RUN.list.length){
      const r=RUN.list[next++], id=String(r.id);
      STATE[id]='run'; paint();
      const nm=`${r.year}-${r.session} ${r.no}번`;
      let done=false, last='';
      for(let k=0; k<4 && !done && !RUN.halt; k++){
        /* 누가 혼잡을 만났으면 다 같이 쉰다 — 셋이 동시에 두드리면 더 막힌다 */
        while(RUN.cool>Date.now() && !RUN.halt){ STATE[id]='wait'; paint(); await sleep(1000); }
        if(RUN.halt) break;
        STATE[id]='run'; paint();
        try{
          const res=await window.__pxSolOne(id, RUN.which);
          const len=typeof res==='number'?res:(res&&res.len)||0, bl=res&&res.bill;
          if(bl) RUN.krw+=bl.krw|0;
          STATE[id]='ok'; RUN.ok++; done=true;
          log(`✓ ${nm} — ${len.toLocaleString()}자${bl?` · 약 ${(bl.krw|0).toLocaleString()}원 (호출 ${bl.calls}번)`:''}${k?` · ${k}번 다시 해서 성공`:''}`);
        }catch(e){
          last=String(e.message||e);
          if(e && e.bill){ RUN.krw+=e.bill.krw|0; last+=` · 쓴 돈 약 ${(e.bill.krw|0).toLocaleString()}원`; }
          if(!BUSY(last) || k===3) break;
          const w=[20,45,90][k]*1000 + Math.random()*5000;
          RUN.cool=Math.max(RUN.cool||0, Date.now()+w);
          log(`… ${nm} — 서버 혼잡, ${Math.round(w/1000)}초 쉬고 다시 (${k+1}/3)`);
        }
      }
      if(!done){
        STATE[id]='bad'; RUN.bad++;
        log(`✕ ${nm} — ${RUN.halt&&!last?'중지':nice(last)}${BUSY(last)?' · 3번 다시 해도 안 됨':''}`);
      }
      RUN.done++;
      $('#pxBar i').style.width=Math.round(RUN.done/RUN.list.length*100)+'%';
      paint();
    }
  };
  await Promise.all(Array.from({ length:Math.max(1,Math.min(3,OPT.c|0||1,list.length)) }, worker));
  const R=RUN; RUN=null; paint();
  say(`해설 ${R.halt?'중지':'끝'} — 성공 ${R.ok} · 실패 ${R.bad}${R.halt?` · 남음 ${R.list.length-R.done}`:''} · 쓴 돈 약 ${(R.krw|0).toLocaleString()}원`);
  log(`■ 합계 — ${R.done}문항 · 약 ${(R.krw|0).toLocaleString()}원`);
}
function stop(){ if(!RUN) return; RUN.halt=true; log('■ 중지 — 돌고 있는 것만 마저 끝냅니다'); paint(); }

/* 탭을 닫으려 하면 한 번 붙잡는다 */
addEventListener('beforeunload',e=>{ if(RUN){ e.preventDefault(); e.returnValue=''; } });

setInterval(()=>{ mount(); paintAt(); try{ cardHead() }catch(e){globalThis.__q?.(e)} if(PAN&&PAN.classList.contains('on')) paint(); }, 800);
setTimeout(mount, 600);
})();
