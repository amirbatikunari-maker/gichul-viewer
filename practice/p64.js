/* practice.html 에서 분리 (v341) — 원래 25784번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const nowOv=()=>{ try{ return OVID!=null?String(OVID):'' }catch(e){ return '' } };
const prog=()=>{ try{ return (window.__pracProg&&window.__pracProg())||JSON.parse(localStorage.getItem('prac:prog:v1')||'{}')||{} }catch(e){ return {} } };
const qt=id=>{ try{ return window.__qtypeOf?window.__qtypeOf(id):'' }catch(e){ return '' } };
const okN=id=>{ try{ if(window.__pracOkN) return window.__pracOkN(id) }catch(e){globalThis.__q?.(e)} const p=prog()[String(id)]; return p?(p.ok!=null?(p.ok|0):(p.r==='ok'?1:0)):0; };
const FK='prac:mmfilter';
let FIL='all'; try{ FIL=localStorage.getItem(FK)||'all' }catch(e){globalThis.__q?.(e)}
function exName(y,s){
  if(+y>0 && +y<3000) return `${String(y).slice(2)}-${s}`;
  let h=''; try{ h=((window.__pracYLabel&&window.__pracYLabel())||{})[String(y)]||(window.__pracYAuto?window.__pracYAuto(y):'') }catch(e){globalThis.__q?.(e)}
  return `${h||('자료'+y)}${s>1?'-'+s:''}`;
}
let EL=null, ANC=null, SIG='', MMID='';
/* ★ v288 — 한눈에든 일반 보기든 «지금 문항» */
const curId=()=>{
  if($('#ovl')?.classList.contains('on')) return nowOv();
  if(MMID) return MMID;
  try{ const r=window.SHOWN && window.SHOWN[window.ONEAT|0]; if(r) return String(r.id); }catch(e){globalThis.__q?.(e)}
  return nowOv();
};
function goTo(id){
  const ovOn=!!$('#ovl')?.classList.contains('on');
  try{
    if(ovOn){ window.ovOpen && window.ovOpen(id); try{ const w=window.__pracWhyOut&&window.__pracWhyOut(id); if(w) (window.__pxToast||console.log)('이 문항은 지금 목록에 없음 — '+w); }catch(x){globalThis.__q?.(x)} return; }
    const sh=window.SHOWN||[], i=sh.findIndex(x=>String(x.id)===String(id));
    if(i>=0 && document.body.classList.contains('oneup') && typeof window.showAt==='function'){ window.showAt(i); MMID=String(id); return; }
    const c=document.querySelector(`#list > .pcard[data-id="${CSS.escape(String(id))}"]`);
    if(c && !c.hidden){ c.scrollIntoView({ block:'start', behavior:'smooth' }); MMID=String(id); return; }
    window.ovOpen && window.ovOpen(id);                 /* 목록에 없으면(거르기·접힘) 한눈에로 */
    try{ const w=window.__pracWhyOut&&window.__pracWhyOut(id); if(w) (window.__pxToast||console.log)('이 문항은 지금 목록에 없음 — '+w); }catch(x){globalThis.__q?.(x)}
  }catch(e){globalThis.__q?.(e)}
}
function pop(){
  if(EL) return EL;
  EL=document.createElement('div'); EL.className='mmpop'; EL.setAttribute('role','dialog'); EL.setAttribute('aria-label','맞음 미니맵');
  document.body.appendChild(EL);
  EL.addEventListener('click', e=>{
    if(e.target.closest('[data-cl]')) return close();
    const f=e.target.closest('[data-f]');
    if(f){ FIL=f.dataset.f; try{ localStorage.setItem(FK,FIL) }catch(x){globalThis.__q?.(x)} SIG=''; return paint(); }
    const aj=e.target.closest('[data-adj]');
    if(aj){ const id=curId(); if(id && window.__pracOkAdj){ window.__pracOkAdj(id, +aj.dataset.adj); SIG=''; paint(); } return; }
    if(e.target.closest('[data-okb]')){
      const c=window.__pracOkBumpCount?window.__pracOkBumpCount():0; if(!c) return;
      if(!confirm(`«맞음» 표시된 ${c}문항(같은 문제는 한 묶음으로)의 회독을 1씩 올립니다.\n한 번만 되며, 다른 기기에서도 또 올라가지 않습니다.\n\n계속할까요?`)) return;
      const n=window.__pracOkBump(); SIG=''; paint(); try{ (window.__pxToast||console.log)(`회독 +1 — ${n}묶음`) }catch(x){globalThis.__q?.(x)} return;
    }
    /* ★ v324 — 맞음·회독 기록 있는 문항 한꺼번에 해설 고정 */
    if(e.target.closest('[data-fxall]')){
      if(!window.__ezFixMany) return;
      const P=prog(), done=r=>{ const p=P[String(r.id)]; return !!p && ((p.n|0)>0 || (p.ok|0)>0 || p.r==='ok'); };
      const isF=id=>{ try{ return !!window.__ezFixed(id) }catch(x){ return false } };
      const todo=rows().filter(done).map(r=>String(r.id)).filter(id=>!isF(id));
      if(!todo.length){ try{ (window.__pxToast||console.log)('🔒 푼 문항은 이미 모두 고정돼 있습니다') }catch(x){globalThis.__q?.(x)} return; }
      if(!confirm(`맞음·회독 기록이 있는 문항 중 아직 고정 안 된 ${todo.length}문항의 쉬운해설을 고정합니다.\n고정하면 AI 가 새로 만들거나 다시 쓰지 않습니다 (미니맵에서 오른쪽 클릭으로 하나씩 풀 수 있음).\n\n계속할까요?`)) return;
      const bt=e.target.closest('[data-fxall]'); bt.disabled=true; bt.textContent='고정하는 중…';
      (async()=>{ let n=0; try{ n=await window.__ezFixMany(todo, true); }catch(x){globalThis.__q?.(x)}
        SIG=''; paint(); try{ window.__ezFixPaint && window.__ezFixPaint(); }catch(x){globalThis.__q?.(x)}
        try{ (window.__pxToast||console.log)(`🔒 ${n}문항 쉬운해설 고정`) }catch(x){globalThis.__q?.(x)} })();
      return;
    }
    const cj=e.target.closest('[data-cadj]');
    if(cj){ const id=curId(); if(id && window.__pracChkAdj){ window.__pracChkAdj(id, +cj.dataset.cadj); SIG=''; paint(); } return; }
    const c=e.target.closest('[data-id]');
    if(c){ goTo(c.dataset.id); setTimeout(()=>{ SIG=''; paint(); },120); }
  });
  /* ★ v323 — 칸 오른쪽 클릭(폰은 길게 누르기) = 그 문항 쉬운해설 고정 / 풀기 */
  EL.addEventListener('contextmenu', async e=>{
    const c=e.target.closest('[data-id]'); if(!c) return;
    e.preventDefault(); e.stopPropagation();
    if(!window.__ezFixToggle){ try{ (window.__pxToast||console.log)('해설 고정 기능을 불러오는 중입니다 — 잠시 뒤 다시') }catch(x){globalThis.__q?.(x)} return; }
    c.classList.add('busy');
    try{ await window.__ezFixToggle(c.dataset.id); }catch(x){globalThis.__q?.(x)}
    SIG=''; paint();
    try{ window.__ezFixPaint && window.__ezFixPaint(); }catch(x){globalThis.__q?.(x)}
  });
  EL.addEventListener('keydown', e=>{ e.stopPropagation(); if(e.key==='Escape') close(); });
  return EL;
}
function paint(){
  if(!EL || !EL.classList.contains('on')) return;
  const R=rows(), P=prog(), me=curId();
  const TH=(window.__pracUnN&&window.__pracUnN())||1, CK=(window.__pracCkN&&window.__pracCkN())||1;
  const isFix=id=>{ try{ return !!(window.__ezFixed && window.__ezFixed(id)); }catch(e){ return false; } };
  const fixSig=(()=>{ try{ return (window.__ezFixList?window.__ezFixList():[]).sort().join(','); }catch(e){ return ''; } })();
  const SHI=(()=>{ try{ return window.__pracShownIds?window.__pracShownIds():null }catch(e){ return null } })();
  const shSig=SHI?SHI.size+':'+[...SHI].slice(0,5).join(','):'';
  const sig=R.length+'|'+JSON.stringify(P)+'|'+me+'|'+FIL+'|'+TH+'|'+CK+'|'+((window.__pracKinScope&&window.__pracKinScope())||'')+'|'+fixSig+'|'+shSig;
  if(sig===SIG) return; SIG=sig;
  /* 같은 대문항 유형에서 맞힌 것이 있나 */
  /* ★ v288 — 연두 빗금 = 같은 문제 안에서 푼 기록이 있음 */
  const kinOf=id=>{ try{ return window.__pracKin?window.__pracKin(id):[String(id)] }catch(e){ return [String(id)] } };
  const kinN=id=>Math.max(0,...kinOf(id).filter(k=>k!==String(id)).map(k=>(P[k]&&(P[k].n|0))||0));
  const ex=new Map();
  R.forEach(r=>{ const k=r.year+'|'+r.session; (ex.get(k)||ex.set(k,[]).get(k)).push(r); });
  const keys=[...ex.keys()].sort((a,b)=>{ const [ay,as]=a.split('|').map(Number), [by,bs]=b.split('|').map(Number);
    const ar=ay>0&&ay<3000, br=by>0&&by<3000; return (br-ar)||(by-ay)||(bs-as); });
  let O=0,X=0,U=0,FX=0;
  const meRow=R.find(r=>String(r.id)===me)||null;
  const html=keys.map(k=>{
    const list=ex.get(k).sort((a,b)=>(+a.no)-(+b.no));
    let o=0,x=0;
    const cells=list.map(r=>{
      const p=P[String(r.id)], st=p?(p.r==='ok'?'ok':p.r==='no'?'no':'chk'):'';
      if(st==='ok'){ o++; O++; } else if(st==='no'){ x++; X++; } else if(!st) U++;
      const kn=kinN(r.id), kin=!st && kn>0;
      const dim= FIL==='no' ? st!=='no' : FIL==='un' ? !!st : false;
      const on_=okN(r.id), cn_=p?(p.n|0):0, dim2=(FIL==='left' && on_>=TH) || (FIL==='ckleft' && cn_>=CK);
      const fx=isFix(r.id); if(fx) FX++;
      /* ★ v331 — 지금 목록(윗줄)에 없는 칸 = 점선 · 올려 보면 이유 */
      const outW=(SHI && SHI.size && !SHI.has(String(r.id)) && window.__pracWhyOut) ? (window.__pracWhyOut(r.id, SHI)||'') : '';
      const cls=['c', st, kin?'kin':'', String(r.id)===me?'me':'', (dim||dim2)?'dim':'', fx?'fix':'', outW?'out':''].filter(Boolean).join(' ');
      const tip=`${exName(r.year,r.session)} ${r.no}번 — ${st==='ok'?'맞음':st==='no'?'틀림':st==='chk'?'푼 기록만':kin?`아직 (같은 문제를 ${kn}번 풂)`:'아직'}${p&&p.n?` · ${p.n}회독 (맞힘 ${on_} · 틀림 ${p.no!=null?p.no:(p.r==='no'?1:0)})`:''}${p&&p.at?` · ${new Date(p.at).toLocaleDateString('ko-KR')}`:''}${qt(r.id)?`\n유형: ${qt(r.id)}`:''}${outW?'\n⛔ 지금 목록에 없음 — '+outW:''}${fx?'\n🔒 쉬운해설 고정 — 오른쪽 클릭으로 풀기':'\n오른쪽 클릭 = 쉬운해설 고정'}`;
      return `<button type="button" class="${cls}" data-id="${esc(r.id)}" title="${esc(tip)}">${esc(r.no)}${cn_>=2?`<sup>${cn_}</sup>`:''}${fx?'<i class="lk" aria-label="해설 고정">🔒</i>':''}</button>`;
    }).join('');
    const y=k.split('|');
    const now=list.some(r=>String(r.id)===me);
    return `<div class="ex${now?' now':''}"><span class="nm" title="${esc(exName(y[0],y[1]))}">${esc(exName(y[0],y[1]))}</span><div class="cells">${cells}</div>
      <span class="rt">✓${o} ✕${x} /${list.length}</span></div>`;
  }).join('');
  /* ★ v324 — 다시 그려도 보던 자리 유지 (아래쪽에서 오른쪽 클릭 고정하면 맨 위로 튀던 것) */
  const bd0=EL.querySelector('.bd'), keepY=bd0?bd0.scrollTop:0;
  EL.innerHTML=`<div class="hd"><b>🗺 맞음 미니맵</b><span class="sum">${R.length}문항 <i class="o">✓ ${O}</i><i class="x">✕ ${X}</i><i class="u">아직 ${U}</i><i class="f" title="쉬운해설 고정 · 칸을 오른쪽 클릭하면 고정/풀기">🔒 ${FX}</i></span>
      <button type="button" class="cl" data-cl aria-label="닫기">✕</button></div>
    <div class="tb">${[['all','전체'],['no','틀림만'],['un','아직만'],['ckleft',`체크 ${CK}번↑ 흐리게`],['left',`맞힘 ${TH}번↑ 흐리게`]].map(([k,n])=>`<button type="button" data-f="${k}" class="${FIL===k?'on':''}">${n}</button>`).join('')}
      <button type="button" class="fxall" data-fxall title="맞음 기록이 있거나 1번이라도 회독한 문항의 쉬운해설을 모두 고정합니다 (이미 고정된 것은 그대로)">🔒 푼 것 모두 고정</button>
      <span class="lg"><span style="--c:#22a060">맞음</span><span style="--c:#e5484d">틀림</span><span style="--c:#8fb0ee">푼 기록만</span><span style="--c:#fff;">아직</span><span style="--c:#bfe8cf">같은 문제 풂</span><span class="lgf">🔒 해설 고정 (오른쪽 클릭)</span><span class="lgo" title="점선 칸에 마우스를 올리면 왜 빠졌는지 나옴">┅ 목록에 없음</span></span></div>
    <div class="bd">${html||'<div class="emp">문항이 없습니다</div>'}</div>
    ${meRow?`<div class="ft"><span>지금 <b>${esc(exName(meRow.year,meRow.session))} ${esc(meRow.no)}번</b></span>
      <span>회독</span><span class="stp"><button type="button" data-cadj="-1" aria-label="줄이기">−</button><b>${(P[String(meRow.id)]||{}).n|0}</b><button type="button" data-cadj="1" aria-label="늘리기">＋</button></span>
      <span>맞힘</span><span class="stp"><button type="button" data-adj="-1" aria-label="줄이기">−</button><b>${okN(meRow.id)}</b><button type="button" data-adj="1" aria-label="늘리기">＋</button></span>
      <small>칸 숫자 = 회독 · 기준 N 은 랜덤 줄에서</small></div>`:''}`;
  /* 지금 문항 줄이 보이게 (처음 열 때만) · 그 뒤로는 보던 자리 그대로 */
  const cur=EL.querySelector('.c.me');
  if(cur && !paint.__scrolled){ paint.__scrolled=true; cur.scrollIntoView({ block:'center' }); }
  else if(bd0){ const bd=EL.querySelector('.bd'); if(bd) bd.scrollTop=keepY; }
}
function place(){
  if(!EL || !ANC) return;
  const a=ANC.getBoundingClientRect(), w=EL.offsetWidth||680;
  EL.style.left=Math.min(Math.max(8,a.left), innerWidth-w-8)+'px';
  EL.style.top=Math.max(8, Math.min(a.bottom+6, innerHeight-320))+'px';
}
function openMM(anchor){
  ANC=anchor; pop().classList.add('on'); SIG=''; paint.__scrolled=false; paint(); place();
  $$('.mmb').forEach(b=>b.classList.add('open'));
}
function close(){ EL && EL.classList.remove('on'); $$('.mmb').forEach(b=>b.classList.remove('open')); }
const labName=lab=>String(lab.textContent||'').replace(/🗺.*|✎.*|[−＋].*$/,'').replace(/[▾▸\s]+/g,' ').trim();
function mount(){
  /* ★ v288 — 한눈에 왼쪽 칸 + 일반 보기 카드의 «문제» 칸 이름줄 */
  [...$$('#ovLeft .plab'), ...$$('#list > .pcard .plabel').filter(l=>/^문제/.test(labName(l)))].forEach(lab=>{
    if(lab.querySelector('.mmb')) return;
    const b=document.createElement('button');
    b.type='button'; b.className='mmb'; b.textContent='🗺 미니맵';
    b.title='회차·번호별로 맞음·틀림을 색으로 봅니다';
    b.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation();
      const card=b.closest('.pcard'); MMID=card?String(card.dataset.id):'';
      EL&&EL.classList.contains('on') ? close() : openMM(b); });
    const ed=lab.querySelector('.edb');
    ed ? lab.insertBefore(b, ed) : lab.appendChild(b);
  });
}
(function watch(){
  const L=$('#ovLeft'), LS=$('#list'); if(!L || !LS) return void setTimeout(watch,500);
  const mo=new MutationObserver(()=>{ try{ mount(); mountAns() }catch(e){globalThis.__q?.(e)} });
  mo.observe(L,{ childList:true, subtree:true }); mo.observe(LS,{ childList:true, subtree:true });
  mount();
})();
setInterval(()=>{ try{ mount(); if(EL&&EL.classList.contains('on')){
  /* 한눈에에서 연 것은 한눈에가 닫히면 같이 닫음 · 일반 보기에서 연 것은 그대로 */
  if(!MMID && !$('#ovl')?.classList.contains('on')) close(); else paint(); } }catch(e){globalThis.__q?.(e)} }, 1000);
document.addEventListener('pointerdown', e=>{ if(EL && EL.classList.contains('on') && !EL.contains(e.target) && !e.target.closest('.mmb')) close(); }, true);
addEventListener('resize', place);
window.__pracMinimap={ open:()=>{ const b=$('#ovl .mmb'); b&&openMM(b); }, close };

/* ★ v285 — 답안 «✎ 고치기» 옆 회독 −/+  (지금 문항을 몇 번 풀었나 = 체크 횟수) */
/* ★ v288 — 한눈에 답안 칸 + 일반 보기 카드의 답안 칸 이름줄, 모두 같은 것 */
function rdkId(w){ const c=w.closest('.pcard'); return c ? String(c.dataset.id) : nowOv(); }
function mountAns(){
  const labs=[...$$('#ovRight .seg[data-seg="a"] > .plab'), ...$$('#list > .pcard .plabel').filter(l=>/^답안/.test(labName(l)))];
  labs.forEach(lab=>{
    let w=lab.querySelector('.rdk');
    if(!w){
      w=document.createElement('span'); w.className='rdk';
      w.innerHTML='<i class="lk" hidden></i><button type="button" data-rd="-1" aria-label="회독 줄이기">−</button><b></b><button type="button" data-rd="1" aria-label="회독 늘리기">＋</button>';
      w.addEventListener('click', e=>{
        const b=e.target.closest('[data-rd]'); if(!b) return;
        e.preventDefault(); e.stopPropagation();
        const id=rdkId(w); if(!id || !window.__pracChkAdj) return;
        window.__pracChkAdj(id, +b.dataset.rd); paintAns(); SIG=''; paint();
      });
      ['pointerdown','mousedown'].forEach(ev=>w.addEventListener(ev,e=>e.stopPropagation()));
      const ed=lab.querySelector('.edb'); ed ? lab.insertBefore(w, ed) : lab.appendChild(w);
    }
  });
  paintAns();
}
function fullNm(r){ return r ? `${exName(r.year,r.session)} ${r.no}번` : ''; }
function paintAns(){
  const P=prog();
  $$('.rdk').forEach(w=>{
    const id=rdkId(w); if(!id) return;
    const p=P[id], n=p?(p.n|0):0, o=okN(id);
    const t=n?`${n}회독 · ✓${o}`:'0회독';
    const b=w.querySelector('b'); if(b.textContent!==t) b.textContent=t;
    w.classList.toggle('has', n>0);
    /* 같은 문제로 묶인 문항 수 — 누르면 다 같이 기록된다 */
    let g=[]; try{ g=(window.__pracSame?window.__pracSame(id):[]).filter(x=>String(x)!==String(id)); }catch(e){globalThis.__q?.(e)}
    const lk=w.querySelector('.lk');
    if(lk){ lk.hidden=!g.length; const lt=g.length?`🔗${g.length}`:''; if(lk.textContent!==lt) lk.textContent=lt;
      const R=rows(); lk.title=g.length?`같은 문제 ${g.length}개와 함께 기록됩니다:\n`+g.map(x=>fullNm(R.find(r=>String(r.id)===String(x)))).filter(Boolean).join('\n'):''; }
    w.title=`이 문항 ${n}번 풂 (맞힘 ${o}) — ＋ 한 번 더 풂 · − 잘못 센 것 빼기\n맞음·틀림 단추를 누르면 저절로 +1${g.length?`\n같은 문제 ${g.length}개도 똑같이 바뀝니다`:''}`;
  });
}
(function watchR(){
  const R=$('#ovRight'); if(!R) return void setTimeout(watchR,500);
  new MutationObserver(()=>{ try{ mountAns() }catch(e){globalThis.__q?.(e)} }).observe(R,{ childList:true, subtree:true });
  mountAns();
})();
setInterval(()=>{ try{ mount(); mountAns(); } catch(e){globalThis.__q?.(e)} }, 900);
/* ★ v288 — 일반 보기 머리 «✓ 맞음» 에도 한눈에와 같은 뱃지 */
setInterval(()=>{ try{
  $$('#list > .pcard .pxhd.r [data-hd="ok"]').forEach(b=>{
    const id=String(b.closest('.pcard')?.dataset.id||''); if(!id) return;
    const p=prog()[id], n=p?(p.n|0):0, t=n?`${n}회·✓${okN(id)}`:'';
    if(t) { if(b.dataset.cnt!==t) b.dataset.cnt=t; } else if(b.dataset.cnt) delete b.dataset.cnt;
  });
}catch(e){globalThis.__q?.(e)} }, 900);
})();

/* ★ v344 — 문항 줄(레일)도 미니맵과 같은 표시로 «연동»
   한눈에 위쪽 줄(#ovrS)과 일반 보기 줄(#prail)의 칸마다:
     맞음(진초록) · 틀림(빨강) · 푼 기록만(파랑) · 같은 문제 풂(연두 빗금) · 🔒 해설 고정(금테)
   미니맵과 같은 기록(prog · 같은 문제 묶음 · 고정 목록)을 그대로 읽는다.
   칸 글자(«21-1 17»)와 data-y 로 문항을 찾으므로, 줄을 그리는 쪽 코드는 손대지 않음. */
(function(){
  'use strict';
  const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
  const prog=()=>{ try{ return (window.__pracProg&&window.__pracProg())||JSON.parse(localStorage.getItem('prac:prog:v1')||'{}')||{} }catch(e){ return {} } };
  const isFix=id=>{ try{ return !!(window.__ezFixed&&window.__ezFixed(id)); }catch(e){ return false; } };
  const kinOf=id=>{ try{ return window.__pracKin?window.__pracKin(id):[String(id)] }catch(e){ return [String(id)] } };

  let IDX=new Map(), IDXN=-1, IDXF='';
  const key=(y,s,n)=>y+'|'+s+'|'+n;
  function index(){
    const R=rows(); const f=R.length?String(R[0].id)+'|'+String(R[R.length-1].id):'';
    if(R.length!==IDXN || f!==IDXF){
      IDX=new Map(); R.forEach(r=>IDX.set(key(+r.year,+r.session,String(r.no).trim()),r)); IDXN=R.length; IDXF=f;
    }
    return IDX;
  }
  function rowOf(b){
    const y=+b.dataset.y; if(!y) return null;
    const n0=b.firstChild; const t=String(n0&&n0.nodeType===3?n0.nodeValue:b.textContent).trim();
    const m=t.match(/^\S+?-(\d+)\s+(\S+)/); if(!m) return null;
    return index().get(key(y,+m[1],m[2]))||null;
  }

  const st=document.createElement('style');
  st.textContent=`
#ovrS .pb.mm-ok:not(.now),#prail .pb.mm-ok:not(.now){background:#22a060!important;border-color:#1b8a52!important;color:#fff!important}
#ovrS .pb.mm-no:not(.now),#prail .pb.mm-no:not(.now){background:#e5484d!important;border-color:#c93a3f!important;color:#fff!important}
#ovrS .pb.mm-chk:not(.now),#prail .pb.mm-chk:not(.now){background:#8fb0ee!important;border-color:#5f89d8!important;color:#0b2a6b!important}
#ovrS .pb.mm-kin:not(.now),#prail .pb.mm-kin:not(.now){background:repeating-linear-gradient(135deg,#d5f0df 0 4px,#eef9f2 4px 8px)!important;border-color:#9fd6b5!important;color:#18794e!important}
#ovrS .pb.mm-fix,#prail .pb.mm-fix{border:2px solid #d4a017!important;box-shadow:0 0 0 1px #fff6dc}
#ovrS .pb.now.mm-ok,#prail .pb.now.mm-ok{box-shadow:inset 0 -4px 0 #22a060}
#ovrS .pb.now.mm-no,#prail .pb.now.mm-no{box-shadow:inset 0 -4px 0 #e5484d}
#ovrS .pb.now.mm-chk,#prail .pb.now.mm-chk{box-shadow:inset 0 -4px 0 #8fb0ee}
#ovrS .pb.now.mm-kin,#prail .pb.now.mm-kin{box-shadow:inset 0 -4px 0 #9fd6b5}
#ovrS .pb .mlk,#prail .pb .mlk{position:absolute;left:-5px;bottom:-5px;font-size:10px;line-height:1;font-style:normal;pointer-events:none;
  filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff)}
#ovrS .pb,#prail .pb{position:relative}`;
  document.head.appendChild(st);

  function deco(){
    const bs=document.querySelectorAll('#ovrS .pb[data-ovgo], #prail .pb[data-go]');
    if(!bs.length) return;
    const P=prog();
    bs.forEach(b=>{
      const r=rowOf(b); if(!r) return;
      const id=String(r.id), p=P[id];
      const s=p?(p.r==='ok'?'ok':p.r==='no'?'no':'chk'):'';
      const kin=!s && kinOf(id).some(k=>String(k)!==id && P[k] && (P[k].n|0)>0);
      const fx=isFix(id);
      b.classList.toggle('mm-ok',s==='ok'); b.classList.toggle('mm-no',s==='no'); b.classList.toggle('mm-chk',s==='chk');
      b.classList.toggle('mm-kin',kin); b.classList.toggle('mm-fix',fx);
      let lk=b.querySelector(':scope > .mlk');
      if(fx && !lk){ lk=document.createElement('i'); lk.className='mlk'; lk.textContent='🔒'; b.appendChild(lk); }
      else if(!fx && lk) lk.remove();
    });
  }
  window.__railDeco=deco;
  let T=0; const soon=()=>{ clearTimeout(T); T=setTimeout(deco,40); };
  /* 줄이 새로 그려질 때 (칸이 바뀔 때만 — 우리가 붙인 클래스로는 다시 안 돎) */
  const hook=sel=>{ const el=document.querySelector(sel); if(!el||el.__mmdeco) return !!el; el.__mmdeco=1;
    new MutationObserver(ms=>{ if(ms.some(m=>m.type==='childList' && [...m.addedNodes].some(n=>n.nodeType===1 && n.classList && n.classList.contains('pb')))) soon(); })
      .observe(el,{childList:true}); soon(); return true; };
  const boot=setInterval(()=>{ const a=hook('#prail'), b=hook('#ovrS'); if(a&&b) clearInterval(boot); },400);
  setTimeout(()=>clearInterval(boot),30000);
  /* 맞음·틀림·회독·고정은 줄을 다시 안 그리고 바뀔 수 있음 → 가볍게 자주 맞춤 (칸 90개 남짓) */
  setInterval(()=>{ if(!document.hidden) deco(); },1200);
  document.addEventListener('click',()=>setTimeout(deco,250),true);
})();
