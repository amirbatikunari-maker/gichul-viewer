/* practice.html 에서 분리 (v341) — 원래 17072번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const SB=()=>{ try{ return sb }catch(e){ return null } };
const key=r=>String(r.source||'(출처 없음)');

/* ══ ① 한 묶음만 보기 — drawList 를 감싼다 ══ */
let ONLY=null;
(function hook(){
  const orig=window.drawList;
  if(typeof orig!=='function' || orig.__src) return;
  const w=function(){
    if(!ONLY) return orig.apply(this,arguments);
    const all=rowsAll();
    let use=all.filter(r=>key(r)===ONLY);
    if(!use.length){ ONLY=null; use=all; }
    try{ window.__pracSwap=true; ROWS=use; return orig.apply(this,arguments); }
    finally{ ROWS=all; window.__pracSwap=false; }
  };
  w.__src=1; w.__tag=orig.__tag; w.__dup=orig.__dup; w.__todo=orig.__todo; w.__probe=orig.__probe;
  window.drawList=w;
})();

/* ══ ② 묶음 만들기 ══ */
function groups(){
  const g=new Map();
  rowsAll().forEach(r=>{
    const k=key(r);
    if(!g.has(k)) g.set(k,[]);
    g.get(k).push(r);
  });
  return [...g.entries()].map(([k,rs])=>{
    const ys=[...new Set(rs.map(r=>+r.year))].sort((a,b)=>a-b);
    const ss=[...new Set(rs.map(r=>+r.session))].sort((a,b)=>a-b);
    return { k, rs, ys, ss };
  }).sort((a,b)=>b.rs.length-a.rs.length);
}
const rng=a=>a.length? (a.length===1? a[0] : `${a[0]}~${a[a.length-1]}`) : '?';

/* ══ ③ 창 ══ */
let W=null, MSG=null;
function say(t,bad){ if(MSG){ MSG.textContent=t||''; MSG.classList.toggle('bad',!!bad); } }

function open_(){
  build();
  W.classList.add('on');
  paint();
}
function build(){
  if(W) return W;
  W=document.createElement('div'); W.className='srcw';
  W.innerHTML=`<div class="srcbox">
    <div class="h"><b>자료 정리 — 올린 파일별</b><span class="sp"></span>
      <button type="button" id="srcOnly" title="지금 걸린 «한 묶음만 보기» 를 풉니다">전체 보기</button>
      <button type="button" id="srcX">닫기</button></div>
    <div class="note">문항마다 «어느 PDF 에서 왔는지» 가 적혀 있습니다. 잘못 들어간 파일을 통째로 옮기거나 지울 수 있습니다.
      기출과 문제집(장을 회차 자리에 넣는 자료)은 <b>과목을 나눠 두는 편</b>이 덜 꼬입니다.</div>
    <div class="list" id="srcList"></div>
    <div class="f" id="srcMsg"></div></div>`;
  document.body.appendChild(W);
  MSG=$('#srcMsg',W);
  $('#srcX',W).onclick=()=>W.classList.remove('on');
  W.addEventListener('click',e=>{ if(e.target===W) W.classList.remove('on'); });
  $('#srcOnly',W).onclick=()=>{ ONLY=null; try{ drawList() }catch(e){globalThis.__q?.(e)} paint(); };
  addEventListener('keydown',e=>{ if(e.key==='Escape'&&W.classList.contains('on')) W.classList.remove('on'); });
  return W;
}

function paint(){
  const L=$('#srcList',W); if(!L) return;
  const gs=groups();
  $('#srcOnly',W).classList.toggle('on',!!ONLY);
  $('#srcOnly',W).textContent = ONLY? '전체 보기 (지금 한 묶음만)' : '전체 보기';
  if(!gs.length){ L.innerHTML='<div class="note">이 과목에 올린 문항이 없습니다.</div>'; return; }
  L.innerHTML=gs.map(g=>{
    const nos=g.rs.map(r=>+r.no).filter(n=>!isNaN(n));
    return `<div class="srcg" data-k="${encodeURIComponent(g.k)}">
      <div class="t"><b>${g.k.replace(/</g,'&lt;')}</b>
        <span>${g.rs.length}문항 · ${rng(g.ys)}년 · 제${rng(g.ss)}회 (회차 ${g.ss.length}종) · 번호 ${Math.min(...nos)}~${Math.max(...nos)}</span></div>
      <div class="a">
        <button type="button" data-a="see">이 묶음만 보기</button>
        <button type="button" data-a="move">연도·회차 바꾸기</button>
        <button type="button" data-a="subj">다른 과목으로</button>
        <button type="button" data-a="renum">번호 다시 매기기</button>
        <button type="button" data-a="del" class="warn">이 묶음 지우기</button>
      </div></div>`;
  }).join('');
  $$('.srcg .a button',L).forEach(b=>{
    b.onclick=()=>act(b.dataset.a, decodeURIComponent(b.closest('.srcg').dataset.k), b);
  });
}

/* ══ ④ 실제 손보기 ══ */
const chunk=(a,n)=>{ const o=[]; for(let i=0;i<a.length;i+=n) o.push(a.slice(i,i+n)); return o };

async function updAll(ids, patch){
  for(const c of chunk(ids,150)){
    const r=await SB().from('practicals').update(patch).in('id',c);
    if(r.error) throw new Error(r.error.message);
  }
}
async function updEach(list){                    /* [{id, patch}] — 번호가 저마다 다를 때 */
  let n=0;
  for(const c of chunk(list,6)){
    await Promise.all(c.map(async x=>{
      const r=await SB().from('practicals').update(x.patch).eq('id',x.id);
      if(r.error) throw new Error(r.error.message);
    }));
    n+=c.length;
    say(`고치는 중… ${n}/${list.length}`);
  }
}

async function act(a, k, btn){
  const rs=rowsAll().filter(r=>key(r)===k);
  if(!rs.length) return;
  const sid=rs[0].subject_id;

  if(a==='see'){
    ONLY=k; W.classList.remove('on');
    try{ drawList() }catch(e){globalThis.__q?.(e)}
    try{ if(document.body.classList.contains('oneup')&&window.showAt) window.showAt(0) }catch(e){globalThis.__q?.(e)}
    return;
  }

  const lock=v=>$$('.srcg .a button',W).forEach(b=>b.disabled=v);

  try{
    if(a==='del'){
      if(!confirm(`«${k}» 에서 올린 ${rs.length}문항을 모두 지웁니다.\n`
        +`글자·해설·필기 표시도 같이 사라집니다. 되돌릴 수 없습니다.\n\n계속할까요?`)) return;
      if(prompt('정말 지우려면 아래에 «지움» 이라고 적어 주세요.')!=='지움') return say('그만두었습니다.');
      lock(true); say('지우는 중…');
      const ids=rs.map(r=>r.id);
      try{ await window.dropFigs?.(rs); }catch(e){globalThis.__q?.(e)}   /* 저장소 그림도 같이 (v235) */
      for(const c of chunk(ids,150)){
        try{ await SB().from('practical_marks').delete().in('practical_id',c) }catch(e){globalThis.__q?.(e)}
        const r=await SB().from('practicals').delete().in('id',c);
        if(r.error) throw new Error(r.error.message);
      }
      say(`${rs.length}문항을 지웠습니다. (스토리지의 그림 파일은 남아 있습니다)`);
    }

    else if(a==='move'){
      const y0=rs[0].year, s0=rs[0].session;
      const y=prompt(`«${k}» ${rs.length}문항의 연도를 적어 주세요.`, String(y0));
      if(y===null) return;
      const s=prompt(`회차를 적어 주세요. (숫자만)`, String(s0));
      if(s===null) return;
      const Y=parseInt(y,10), S=parseInt(s,10);
      if(!Y||!S) return say('연도·회차는 숫자로 적어 주세요.',true);

      const mine=new Set(rs.map(r=>String(r.id)));
      const there=rowsAll().filter(r=>r.subject_id===sid && +r.year===Y && +r.session===S && !mine.has(String(r.id)));
      const taken=new Set(there.map(r=>+r.no));
      const clash=rs.filter(r=>taken.has(+r.no)).length;
      const dupInside=new Set(rs.map(r=>+r.no)).size!==rs.length;

      let renum=false;
      if(clash||dupInside){
        renum=confirm(`옮기려는 자리에 번호가 겹칩니다`
          +(clash?` (기존 ${clash}개와 겹침)`:'')
          +(dupInside?` (이 묶음 안에도 같은 번호가 있습니다 — 회차가 여럿이라 그렇습니다)`:'')
          +`.\n\n«확인» 을 누르면 ${there.length?`기존 ${Math.max(0,...taken)}번 뒤로 이어서`:'1번부터'} 다시 매깁니다.\n`
          +`«취소» 를 누르면 그만둡니다.`);
        if(!renum) return say('그만두었습니다.');
      }
      lock(true);

      if(!renum){
        say('옮기는 중…');
        await updAll(rs.map(r=>r.id), { year:Y, session:S });
        rs.forEach(r=>{ r.year=Y; r.session=S; });
      }else{
        const base=there.length?Math.max(...taken):0;
        const ord=rs.slice().sort((a2,b2)=>
          (a2.year-b2.year)||(a2.session-b2.session)||((a2.page_from||0)-(b2.page_from||0))||(a2.no-b2.no));
        /* 1차 — 겹치지 않는 음수 자리로 피해 둔다 */
        say('번호를 비우는 중…');
        await updEach(ord.map((r,i)=>({ id:r.id, patch:{ year:Y, session:S, no:-(i+1) } })));
        /* 2차 — 제 번호를 준다 */
        say('번호를 매기는 중…');
        await updEach(ord.map((r,i)=>({ id:r.id, patch:{ no:base+i+1 } })));
        ord.forEach((r,i)=>{ r.year=Y; r.session=S; r.no=base+i+1; });
      }
      say(`${rs.length}문항을 ${Y}년 제${S}회로 옮겼습니다.`);
    }

    else if(a==='subj'){
      let all=[]; try{ all=Array.isArray(SUBJECTS)?SUBJECTS:[] }catch(e){ all=[] }
      const subs=all.filter(x=>+x.id!==+sid);
      if(!subs.length) return say('옮길 다른 과목이 없습니다 — 과목을 먼저 하나 만들어 주세요.',true);
      const pick=prompt(`«${k}» ${rs.length}문항을 어느 과목으로 옮길까요?\n\n`
        +subs.map(x=>`${x.id} : ${x.name}`).join('\n')+`\n\n과목 번호를 적어 주세요.`);
      if(pick===null) return;
      const nid=parseInt(pick,10);
      if(!subs.some(x=>+x.id===nid)) return say('그런 과목 번호가 없습니다.',true);
      lock(true); say('옮기는 중…');
      await updAll(rs.map(r=>r.id), { subject_id:nid });
      say(`${rs.length}문항을 옮겼습니다. 위쪽 과목을 바꿔서 확인해 보세요.`);
    }

    else if(a==='renum'){
      if(!confirm(`«${k}» 의 문항 번호를 회차마다 1번부터 쪽 순서대로 다시 매깁니다.\n계속할까요?`)) return;
      lock(true);
      const byRound=new Map();
      rs.forEach(r=>{ const kk=`${r.year}-${r.session}`; (byRound.get(kk)||byRound.set(kk,[]).get(kk)).push(r) });
      const plan1=[], plan2=[];
      let t=0;
      byRound.forEach(list=>{
        list.sort((a2,b2)=>((a2.page_from||0)-(b2.page_from||0))||(a2.no-b2.no));
        list.forEach((r,i)=>{ plan1.push({ id:r.id, patch:{ no:-(++t) } }); plan2.push({ id:r.id, patch:{ no:i+1 } }); r.__newno=i+1; });
      });
      say('번호를 비우는 중…'); await updEach(plan1);
      say('번호를 매기는 중…'); await updEach(plan2);
      rs.forEach(r=>{ if(r.__newno){ r.no=r.__newno; delete r.__newno; } });
      say('번호를 다시 매겼습니다.');
    }
  }catch(e){
    say('멈췄습니다 — '+((e&&e.message)||e)+'  (한 것까지는 남아 있습니다)',true);
  }finally{
    lock(false);
    try{ await loadList({ force:true }) }catch(e){ try{ drawList() }catch(e2){globalThis.__q?.(e2)} }
    paint();
  }
}

/* ══ ⑤ 도구 차림표에 단추 ══ */
const mt=setInterval(()=>{
  const host=document.getElementById('ezRedoAll')?.parentElement;
  if(!host) return;
  clearInterval(mt);
  if(document.getElementById('srcOpen')) return;
  const lab=document.createElement('div');
  lab.className='dmenu-lab'; lab.textContent='정리';
  const b=document.createElement('button');
  b.className='chip'; b.type='button'; b.id='srcOpen'; b.textContent='🗂 자료 정리 (파일별)';
  b.title='올린 PDF 파일 단위로 연도·회차를 고치거나 통째로 지웁니다';
  host.append(lab,b);
  b.onclick=open_;
},700);
setTimeout(()=>clearInterval(mt),40000);

window.__pracSrc=open_;
})();
