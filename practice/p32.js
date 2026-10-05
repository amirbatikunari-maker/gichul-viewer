/* practice.html 에서 분리 (v341) — 원래 14698번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const rowOf=id=>rowsAll().find(r=>String(r.id)===String(id));
const nameOf=r=>`${r.year}년 제${r.session}회 ${r.no}번`;

/* ══ ① 묻는 글만 남긴다 ══ */
function norm(r){
  return String(r.q_md||r.q_text||'')
    .replace(/\[\[[^\]]*\]\]/g,' ')            /* 오려 온 그림 자리 */
    .replace(/!\[[^\]]*\]\([^)]*\)/g,' ')      /* 붙인 그림 */
    .replace(/https?:\/\/\S+/g,' ')
    .replace(/[·∙・…\s\u00a0]+/g,'')
    .replace(/[.,;:!?()[\]{}"'`~\-—–_|]/g,'')
    .trim();
}
const shingles=t=>{ const s=new Set(); for(let i=0;i<=t.length-5;i+=1) s.add(t.slice(i,i+5)); return s };
/* 얼마나 겹치나 — 두 가지로 잰다.
     자카드 : 서로 얼마나 같은가 (양쪽 기준)
     포함율 : 짧은 쪽이 긴 쪽 안에 얼마나 들어 있는가
   짧은 문장은 낱말 하나만 달라도 자카드가 뚝 떨어진다.
   그래서 «느슨» 에서는 포함율도 함께 본다(뒤에 단서만 붙은 것 따위를 잡으려고). */
function meas(a,b){
  if(!a.size||!b.size) return {j:0,c:0};
  const [x,y]=a.size<b.size?[a,b]:[b,a];
  let hit=0; x.forEach(v=>{ if(y.has(v)) hit++ });
  return { j:hit/(a.size+b.size-hit), c:hit/Math.max(1,x.size) };
}
/* ★ v268 — «수동» 을 더하고 기본으로 삼는다.
   글이 닮은 것을 저절로 묶으니 엉뚱하게 묶이거나 빠지는 게 많았다.
   이제 한눈에 머리줄의 «🏷 유형» 으로 사람이 묶은 것이 곧 중복 묶기다.
   자동 셋(엄격·보통·느슨)은 남겨 두되, 고르면 «유형 + 자동» 으로 돈다 — 손으로 묶은 것이 늘 먼저. */
/* ★ v292 — «동일 −» 소문항이 같은 것(동일 문제)만 · «유사 −» 중문항이 같은 것(유사 문제)까지 */
const LEVELS={
  same:  { nm:'동일', lb:'동일 − (소문항)', d:'소문항이 같은 문항 = 동일 문제만 하나로 접습니다' },
  manual:{ nm:'유사', lb:'유사 − (대문항)', d:'대문항이 같은 문항 = 유사 문제까지 하나로 접습니다' },
  strict:{ nm:'엄격', lb:'유형 + 엄격', j:0.92, c:0,    r:0,    d:'유형 + 글자까지 거의 같은 것을 저절로' },
  normal:{ nm:'보통', lb:'유형 + 보통', j:0.85, c:0,    r:0,    d:'유형 + 그림·빈칸·부호만 다른 것을 저절로' },
  loose: { nm:'느슨', lb:'유형 + 느슨', j:0.72, c:0.90, r:0.55, d:'유형 + 뒤에 단서가 붙은 정도까지 저절로' }
};
try{ if(!localStorage.getItem('prac:duplv:v268')){
  localStorage.setItem('prac:duplv:v1','manual'); localStorage.setItem('prac:duplv:v268','1'); } }catch(e){globalThis.__q?.(e)}
let LV=(()=>{ try{ return LEVELS[localStorage.getItem('prac:duplv:v1')]?localStorage.getItem('prac:duplv:v1'):'manual' }
              catch(e){ return 'manual' } })();
function same(sa,sb,la,lb){
  const L=LEVELS[LV]||LEVELS.normal, m=meas(sa,sb);
  if(m.j>=L.j) return true;
  if(L.c && m.c>=L.c && Math.min(la,lb)/Math.max(1,la,lb)>=L.r) return true;
  return false;
}
/* 대표 고르기 — 쓸모가 많은 것을 남긴다 */
/* 진짜 기출인가 — 9301(오고초려)·9302(핵심빈출)·94NN(단답)·95NN(소방) 같은
   «가짜 연도» 는 회차가 없는 문제집 자료다. */
const REALY=r=>{ const y=+r.year||0; return (y>0&&y<3000)?1:0 };

function better(a,b){
  /* ★★ v230 — 여기가 «2025년 1회를 봤는데 9번이 사라지던» 자리다.
     대표를 «연도가 큰 것» 으로 골랐는데, 9425(단답 2025) 가 2025 보다 크다.
     그래서 문제집 사본이 언제나 대표가 되고, 진짜 기출 문항은 접혀서
     회차를 펼쳤을 때 그 번호가 통째로 비어 보였다.

     문제집은 기출에서 뽑아 모은 것이므로 «원본» 은 언제나 기출 쪽이다.
     해설이 사본에만 있어도 마찬가지다 — 접힌 목록에서 그 사본을 열면 되고,
     회차가 구멍 나는 쪽이 훨씬 나쁘다. 그래서 이 잣대를 맨 앞에 둔다. */
  const rr=REALY(b)-REALY(a); if(rr) return rr>0?b:a;

  const sc=r=>(r.easy_md?4:0)+(r.a_md||r.a_text?2:0)+(r.q_md?1:0);
  const d=sc(b)-sc(a); if(d) return d>0?b:a;
  const y=(+b.year||0)-(+a.year||0); if(y) return y>0?b:a;
  return ((+b.session||0)-(+a.session||0))>0?b:a;
}

/* ══ ② 묶기 (틈날 때 잘게) ══ */
let GROUPS=new Map();      /* 대표 id → [겹치는 row …] */
let MANNM=new Map();       /* ★ v268 — 손으로 묶은 덩어리의 대표 id → 유형 이름 */
let AUTO=[];               /* ★ v268 — 글이 닮아 저절로 묶인 덩어리. 유형이 바뀌어도 다시 안 센다 */
let REL=new Map();         /* id → [{id, sim} …]  닮음 0.35 이상 */
let HIDE=new Set();        /* 감출 id */
let SIG='', BUSY=false, READY=false;
const idle=fn=>(window.requestIdleCallback?requestIdleCallback(()=>fn(),{timeout:250}):setTimeout(fn,0));

function build(){
  if(BUSY||window.__pracSwap) return;
  const rows=rowsAll(); if(rows.length<2) return;
  const sig=rows.length+'|'+(rows[0]&&rows[0].id);
  if(sig===SIG) return;
  BUSY=true; SIG=sig;

  const buckets=new Map(); const norms=new Map();
  let i=0;
  function pass1(){
    const t0=performance.now();
    while(i<rows.length && performance.now()-t0<12){
      const r=rows[i++]; const t=norm(r);
      if(t.length<14) continue;                 /* 너무 짧은 글은 견줄 수 없다 */
      norms.set(String(r.id),t);
      /* 길이와 첫머리로 칸을 나눠 견줄 상대를 줄인다 — 전부와 견주지 않는다 */
      const key=Math.round(t.length/10)+'|'+t.slice(0,8);
      (buckets.get(key)||buckets.set(key,[]).get(key)).push(r);
      const key2=Math.round(t.length/10)+'|'+t.slice(-8);
      (buckets.get(key2)||buckets.set(key2,[]).get(key2)).push(r);
    }
    if(i<rows.length) return idle(pass1);
    i=0; return idle(LV==='manual' ? done : pass2);
  }
  const seen=new Set(), reps=[];
  const keys=[]; 
  function pass2(){
    if(!keys.length) keys.push(...buckets.keys());
    const t0=performance.now();
    while(i<keys.length && performance.now()-t0<12){
      const list=buckets.get(keys[i++]);
      if(!list||list.length<2) continue;
      const shin=new Map();
      for(const r of list){
        const id=String(r.id);
        if(!shin.has(id)) shin.set(id,shingles(norms.get(id)||''));
      }
      for(const r of list){
        const id=String(r.id);
        if(seen.has(id)) continue;
        /* «별 모양» 으로 묶는다 — 반드시 대표와 직접 견준다(사슬 금지) */
        let rep=r, mates=[];
        for(const o of list){
          const oid=String(o.id);
          if(oid===id||seen.has(oid)) continue;
          if(same(shin.get(id),shin.get(oid),
                  (norms.get(id)||'').length,(norms.get(oid)||'').length)) mates.push(o);
        }
        if(!mates.length) continue;
        seen.add(id); mates.forEach(m=>seen.add(String(m.id)));
        const all=[r,...mates];
        rep=all.reduce(better);
        reps.push({ rep, all });
      }
    }
    if(i<keys.length) return idle(pass2);
    return idle(done);
  }
  /* ── 연관 문제 (0.35 이상 닮은 것) ──
     중복(0.85)은 «같은 문제» 지만, 0.35 쯤이면 «값만 다르거나 뒤 물음만 바뀐»
     한 핏줄의 문제다. 그것들을 이어 두면 하나를 풀고 나머지를 바로 볼 수 있다.
     전부와 견주면 1261×1261 이 되므로, 드문 다섯 글자를 나눠 담아
     «같은 조각을 나눠 가진 것» 만 후보로 올린다. */
  const REL_MIN=0.35, REL_MAX=8;
  let RINV=null, rids=null;
  function relPrep(){
    try{
      const df=new Map(); RINV=new Map(); rids=[...norms.keys()];
      const setOf=new Map();
      rids.forEach(id=>{
        const t=(norms.get(id)||'').slice(0,500);
        const set=[]; for(let k=0;k<=t.length-5;k+=3) set.push(t.slice(k,k+5));
        const uniq=[...new Set(set)];
        setOf.set(id,uniq);
        uniq.forEach(g=>df.set(g,(df.get(g)||0)+1));
      });
      rids.forEach(id=>{
        const uniq=setOf.get(id)||[];
        uniq.filter(g=>df.get(g)<=40)
            .sort((a,b)=>df.get(a)-df.get(b)).slice(0,24)
            .forEach(g=>{ (RINV.get(g)||RINV.set(g,[]).get(g)).push(id) });
      });
      RSET=setOf;
      i=0; return idle(relScan);
    }catch(e){ finish(); }
  }
  let RSET=null;
  function relScan(){
    try{
      const t0=performance.now();
      while(i<rids.length && performance.now()-t0<12){
        const id=rids[i++];
        const mine=RSET.get(id)||[]; if(mine.length<6) continue;
        const share=new Map();
        mine.forEach(g=>{ const L=RINV.get(g); if(!L||L.length>60) return;
          L.forEach(o=>{ if(o!==id) share.set(o,(share.get(o)||0)+1) }); });
        if(!share.size) continue;
        const cand=[...share.entries()].filter(([,n])=>n>=3)
          .sort((a,b)=>b[1]-a[1]).slice(0,60).map(([o])=>o);
        if(!cand.length) continue;
        const A=shingles(norms.get(id)||'');
        const out=[];
        cand.forEach(o=>{
          const m=meas(A,shingles(norms.get(o)||''));
          if(m.j>=REL_MIN) out.push({ id:o, sim:+m.j.toFixed(3) });
        });
        if(out.length){
          out.sort((a,b)=>b.sim-a.sim);
          REL.set(id,out.slice(0,REL_MAX));
        }
      }
      if(i<rids.length) return idle(relScan);
      finish();
    }catch(e){ finish(); }
  }
  function finish(){
    /* 연관까지 이어졌으면 «이력 없는 문항» 이 해를 빌릴 수 있다 — 한 번 더 센다 */
    try{ window.__pracTagReset && window.__pracTagReset() }catch(e){globalThis.__q?.(e)}
    try{ stamp() }catch(e){globalThis.__q?.(e)}
    try{ window.__pracLog&&window.__pracLog(`연관 문제 ${REL.size}문항에 이어 두었습니다 (닮음 0.35 이상)`) }catch(e){globalThis.__q?.(e)}
  }

  function done(){
    AUTO=reps.slice();
    compose();
    BUSY=false; READY=true;
    /* ★ v238b — 묶음이 생겼으니 등급을 다시 센다.
       같은 문제의 출제 이력을 합쳐야 «한쪽은 똥, 한쪽은 은» 이 안 생긴다. */
    try{ window.__pracTagReset && window.__pracTagReset() }catch(e){globalThis.__q?.(e)}
    try{ stamp() }catch(e){globalThis.__q?.(e)}
    if(ON()) { try{ drawList() }catch(e){globalThis.__q?.(e)} }
    try{ window.__pracLog&&window.__pracLog(`겹치는 문항 ${HIDE.size}개를 ${GROUPS.size}덩어리로 묶었습니다`) }catch(e){globalThis.__q?.(e)}
    REL=new Map(); i=0; idle(relPrep);          /* 이어서 연관 문제를 잇는다 */
  }
  idle(pass1);
}
/* ★ v268 — 손으로 묶은 것(유형)과 저절로 묶인 것을 합친다.
   유형이 먼저다 — 한 문항이 둘 다에 걸리면 유형 쪽에만 남긴다. */
function compose(){
  const rows=rowsAll(), byId=new Map(rows.map(r=>[String(r.id),r]));
  const reps=[], inM=new Set();
  let man=null;
  try{ man = LV==='same' ? window.__qtypeGroupsLv(2) : LV==='sim' ? window.__qtypeGroupsLv(1) : (window.__qtypeGroups && window.__qtypeGroups()); }catch(e){globalThis.__q?.(e)}
  (man||new Map()).forEach((ids,name)=>{
    const all=ids.map(id=>byId.get(String(id))).filter(Boolean);
    if(all.length<2) return;
    all.forEach(x=>inM.add(String(x.id)));
    reps.push({ rep:all.reduce(better), all, name });
  });
  if(['strict','normal','loose'].includes(LV)) AUTO.forEach(({all})=>{
    const rest=all.filter(x=>byId.has(String(x.id)) && !inM.has(String(x.id)));
    if(rest.length>=2) reps.push({ rep:rest.reduce(better), all:rest });
  });
  GROUPS=new Map(); HIDE=new Set(); MANNM=new Map();
  reps.forEach(({rep,all,name})=>{
    const uniq=[...new Map(all.map(x=>[String(x.id),x])).values()]
      .sort((a,b)=>(b.year-a.year)||(b.session-a.session)||(a.no-b.no));
    GROUPS.set(String(rep.id),uniq);
    if(name) MANNM.set(String(rep.id),name);
    uniq.forEach(x=>{ if(String(x.id)!==String(rep.id)) HIDE.add(String(x.id)) });
  });
}
/* 유형을 바꿨을 때 — 글자 견주기는 다시 안 돌리고 묶음만 다시 짠다 (네트워크 0) */
window.__pracDupRecompose=()=>{
  if(!READY){ build(); return; }
  const was=ON();
  /* ★ v269 — 한 문항씩 보는 중이면 «지금 문항» 을 id 로 붙잡아 둔다.
     묶음이 바뀌면 목록 길이가 달라져서, 번호(ONEAT)만 두면 옆 문항으로 튀었다. */
  let keep=null; try{ keep=SHOWN[ONEAT] ? String(SHOWN[ONEAT].id) : null }catch(e){globalThis.__q?.(e)}
  compose();
  try{ window.__pracTagReset && window.__pracTagReset() }catch(e){globalThis.__q?.(e)}
  try{ stamp() }catch(e){globalThis.__q?.(e)}
  if(was||ON()){
    try{ drawList() }catch(e){globalThis.__q?.(e)}
    try{
      if(keep && document.body.classList.contains('oneup') && typeof showAt==='function'){
        let i=SHOWN.findIndex(r=>String(r.id)===keep);
        if(i<0){ const rep=repOf(keep); i=rep?SHOWN.findIndex(r=>String(r.id)===rep):-1; }
        if(i>=0 && i!==ONEAT) showAt(i);
      }
    }catch(e){globalThis.__q?.(e)}
  }
};
/* 접힌 문항 → 그 묶음의 대표 id (안 접혔으면 null) */
function repOf(id){
  id=String(id); if(!HIDE.has(id)) return null;
  for(const [rep,g] of GROUPS) if(g.some(x=>String(x.id)===id)) return rep;
  return null;
}
window.__pracRepOf=repOf;
window.__pracDup=()=>({groups:GROUPS,hide:HIDE,ready:READY,man:MANNM,on:ON(),fold:FOLD&&READY&&HIDE.size>0&&!oneSheet()});

/* ══ ③ 목록에서 빼기 ══ */
const KEY='prac:dupfold:v1';
let FOLD=(()=>{ try{ return localStorage.getItem(KEY)!=='0' }catch(e){ return true } })();
/* ★ v230 — 회차를 하나 골라 놓고 볼 때는 접지 않는다.
   «2025년 1회» 를 펼친 사람은 그 회차 19문항을 처음부터 끝까지 보려는 것이다.
   다른 회차와 겹친다는 이유로 9번을 감추면 그 회차가 구멍 난 것처럼 보인다.
   접기는 «전체를 훑을 때 같은 문제를 두 번 풀지 않게» 하는 장치이므로,
   한 회차만 볼 때는 끈다. */
const oneSheet=()=>{
  try{
    const y=(document.querySelector('#fYear')?.value||'').trim();
    const ss=(document.querySelector('#fSess')?.value||'').trim();
    return !!(y && ss);
  }catch(e){ return false }
};
/* ★ v330 — 📅 최신순은 «순서대로 전부» — 동일 −·유사 − 접기를 안 건다 (22-3 16·17·18 이 빠지던 것) */
const seqOn=()=>{ try{ return !!(window.__pracSeqOn&&window.__pracSeqOn()) }catch(e){ return false } };
const ON=()=>FOLD&&READY&&HIDE.size>0&&!oneSheet()&&!seqOn();

function hook(){
  if(typeof drawList!=='function'||drawList.__dup) return false;
  const orig=drawList;
  const w=function(){
    if(!ON()) return orig.apply(this,arguments);
    const all=rowsAll();
    let use;
    try{ use=all.filter(r=>!HIDE.has(String(r.id))); if(!use.length) use=all; }
    catch(e){ use=all }
    try{ window.__pracSwap=true; ROWS=use; return orig.apply(this,arguments); }
    catch(e){ ROWS=all; return orig.apply(this,arguments); }
    finally{ ROWS=all; window.__pracSwap=false; }
  };
  w.__dup=1; w.__tag=orig.__tag; w.__probe=orig.__probe;
  window.drawList=w;
  return true;
}

/* ══ ④ 제목 옆에 «중복 N문항» ══ */
function stamp(){
  $$('#list > .pcard').forEach(card=>{
    const head=card.querySelector('.phead'); if(!head) return;
    const id=String(card.dataset.id||'');
    const g=GROUPS.get(id);
    let b=head.querySelector('.dupb');
    if(!g||g.length<2){ b&&b.remove(); card.querySelector('.dupwrap')?.remove(); return; }
    if(!b){
      b=document.createElement('button');
      b.type='button'; b.className='dupb';
      b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); openList(card,id); });
      const cv=head.querySelector('.cvbadge');
      cv?head.insertBefore(b,cv):head.appendChild(b);
    }
    const mn=MANNM.get(id);
    b.textContent=mn?`🏷 ${mn.length>12?mn.slice(0,12)+'…':mn} ${g.length}`:`중복 ${g.length}문항`;
    b.title=(mn?`유형 «${mn}» — `:'')+g.map(nameOf).join(' · ')+'\n눌러서 어느 회차인지 봅니다';
  });
  stampRel();
}
function stampRel(){
  $$('#list > .pcard').forEach(card=>{
    const head=card.querySelector('.phead'); if(!head) return;
    const id=String(card.dataset.id||'');
    const rel=REL.get(id);
    let b=head.querySelector('.relb');
    if(!rel||!rel.length){ b&&b.remove(); return; }
    if(!b){
      b=document.createElement('button');
      b.type='button'; b.className='relb';
      b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); openRel(card,id); });
      const cv=head.querySelector('.cvbadge');
      cv?head.insertBefore(b,cv):head.appendChild(b);
    }
    b.textContent=`🔗 연관 ${rel.length}`;
    b.title='값이나 뒷물음만 다른 «한 핏줄» 문항입니다 — 눌러서 봅니다';
  });
}
function openRel(card,id){
  let box=card.querySelector('.relwrap');
  if(box){ box.remove(); return; }
  const rel=REL.get(id)||[];
  box=document.createElement('div'); box.className='relwrap';
  box.innerHTML=`<div class="t">연관 문제 ${rel.length} — 닮은 정도 순 · 눌러서 그 문항으로</div>`
    + rel.map(x=>{
        const r=rowOf(x.id); if(!r) return '';
        return `<span class="it" data-go="${r.id}">${nameOf(r)}`
             + `<b>${Math.round(x.sim*100)}%</b></span>`;
      }).join('');
  card.querySelector('.phead').after(box);
  box.addEventListener('click',e=>{
    const it=e.target.closest('[data-go]'); if(!it) return;
    const r=rowOf(it.dataset.go); if(!r) return;
    try{ ovOpen(r.id) }catch(x){globalThis.__q?.(x)}
  });
}
window.__pracRel=id=>REL.get(String(id))||[];
function openList(card,id){
  const g=GROUPS.get(id)||[]; 
  let box=card.querySelector('.dupwrap');
  if(box){ box.remove(); return; }
  box=document.createElement('div'); box.className='dupwrap';
  const mn=MANNM.get(id);
  box.innerHTML=`<div class="t">${mn?`유형 «${String(mn).replace(/[<>&"]/g,'')}» `:'같은 내용으로 묶인 '}${g.length}문항 — 눌러서 그 회차로 갑니다</div>`
    + g.map(r=>`<span class="it" data-go="${r.id}">${nameOf(r)}${String(r.id)===id?' · 대표':''}</span>`).join('');
  card.querySelector('.phead').after(box);
  box.addEventListener('click',e=>{
    const it=e.target.closest('[data-go]'); if(!it) return;
    const r=rowOf(it.dataset.go); if(!r) return;
    try{ ovOpen(r.id) }catch(x){globalThis.__q?.(x)}
  });
}

/* ══ ⑤ 켜고 끄기 ══ */
function mountChip(){
  const row=document.getElementById('tagRow'); if(!row||row.querySelector('[data-dup]')) return;
  const sep=document.createElement('span'); sep.className='sep';
  const b=document.createElement('button');
  b.type='button'; b.dataset.dup=''; 
  b.title='묻는 글이 같은 문항을 한 덩어리로 접습니다 (그림이 조금 달라도)';
  const paint=()=>{
    const off=FOLD&&READY&&HIDE.size>0&&(oneSheet()||seqOn());   /* 켜 뒀지만 지금은 안 접는 중 */
    let man=0; MANNM.forEach((_,rep)=>{ const g=GROUPS.get(rep); if(g) man+=g.length-1; });
    const auto=Math.max(0,HIDE.size-man);
    const cnt=!READY||!HIDE.size ? '' : (auto ? `유형 ${man} · 자동 ${auto}문항 접힘` : `${man}문항 접힘`);
    b.textContent=`⧉ 중복 묶기` + (off?(seqOn()?' · 최신순 땐 끔':' · 회차 볼 땐 끔'):'');           /* ★ v292 — «(유형 N)» 빼고 설명으로 */
    b.dataset.cnt=cnt;
    try{ $$('[data-duplv]',row).forEach(x=>{ const on=FOLD && x.dataset.duplv===LV; x.classList.toggle('on',on); x.setAttribute('aria-pressed',on); }); }catch(e){globalThis.__q?.(e)}
    b.classList.toggle('on',FOLD&&!off);
    b.title = off
      ? '회차를 하나 골라 놓아서 지금은 접지 않습니다 — 그 회차를 통째로 보여 줍니다'
      : '묻는 글이 같은 문항을 한 덩어리로 접습니다 (그림이 조금 달라도)';
    if(b.dataset.cnt) b.title+=' — 지금 '+b.dataset.cnt;
  };
  b.addEventListener('click',()=>{
    FOLD=!FOLD; try{ localStorage.setItem(KEY,FOLD?'1':'0') }catch(e){globalThis.__q?.(e)}
    paint(); try{ drawList() }catch(e){globalThis.__q?.(e)}
  });
  const sel=document.createElement('select');
  sel.title='어느 정도까지 «같다» 고 볼지';
  sel.innerHTML=Object.entries(LEVELS).map(([k,v])=>
    `<option value="${k}"${k===LV?' selected':''} title="${v.d}">${v.lb||v.nm}</option>`).join('');
  sel.title='어디까지 «같은 문제» 로 접을지 — '+(LEVELS[LV]||{}).d;
  sel.addEventListener('change',()=>{ sel.title='어디까지 «같은 문제» 로 접을지 — '+(LEVELS[sel.value]||{}).d; });
  sel.addEventListener('change',()=>{
    LV=sel.value; try{ localStorage.setItem('prac:duplv:v1',LV) }catch(e){globalThis.__q?.(e)}
    SIG=''; READY=false; HIDE=new Set(); GROUPS=new Map(); AUTO=[];   /* 처음부터 다시 센다 */
    paint(); build();
  });
  const clear=row.querySelector('[data-clear]');
  const put=el=>clear?row.insertBefore(el,clear):row.appendChild(el);
  put(sep); put(b);
  /* ★ v292 — 빠른 단추: 동일 − · 유사 − (누른 것을 다시 누르면 대문항 − 로) */
  /* ★ v296 — 동일 − = 대·중·소 모두 같은 것만 접기 · 유사 − = 대문항이 같은 것까지 접기 · 켜진 것을 다시 누르면 접기 끔 */
  [['same','동일 −','대·중·소문항이 모두 같은 동일 문제만 하나로 접기'],['manual','유사 −','대문항이 같은 유사 문제까지 하나로 접기']].forEach(([k,t,tt])=>{
    const q=document.createElement('button'); q.type='button'; q.dataset.duplv=k; q.className='duplv'; q.textContent=t; q.title=tt;
    q.addEventListener('click',e=>{ e.stopPropagation();
      if(LV===k && FOLD){ FOLD=false; try{ localStorage.setItem(KEY,'0') }catch(x){globalThis.__q?.(x)} paint(); try{ drawList() }catch(x){globalThis.__q?.(x)} return; }
      FOLD=true; try{ localStorage.setItem(KEY,'1') }catch(x){globalThis.__q?.(x)}
      sel.value=k; sel.dispatchEvent(new Event('change'));
      try{ drawList() }catch(x){globalThis.__q?.(x)} });
    put(q);
  });
  put(sel);
  paint();
  setInterval(paint,2000);
}

/* 자료가 늦게 들어와도 잡되, 다 붙고 나면 시계를 끈다 */
let hooked=false, chipped=false;
const boot=setInterval(()=>{
  if(!hooked) hooked=hook();
  if(!chipped){ mountChip(); chipped=!!document.querySelector('[data-dup]'); }
  if(rowsAll().length) build();
  if(hooked&&chipped&&READY) clearInterval(boot);
},1200);
const w=setInterval(()=>{ const l=$('#list'); if(!l) return; clearInterval(w);
  new MutationObserver(()=>setTimeout(stamp,60)).observe(l,{childList:true}); },400);
setTimeout(()=>clearInterval(w),20000);
})();
