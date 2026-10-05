/* practice.html 에서 분리 (v341) — 원래 22634번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||console.log)(m) }catch(e){globalThis.__q?.(e)} };
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const rowOf=id=>rows().find(r=>String(r.id)===String(id))||null;
const client=()=>{ try{ return sb }catch(e){ return null } };
const curSid=()=>{ try{ return CACHE_SID }catch(e){ return null } };
const nowOv=()=>{ try{ return OVID!=null?String(OVID):'' }catch(e){ return '' } };
const keepCache=()=>{ try{ cacheSaveRows() }catch(e){globalThis.__q?.(e)} };
/* ez_lock 칸이 없을 때 Supabase 가 돌려주는 말들 */
const NOCOL=m=>/ez_lock|column|schema cache|42703|PGRST204/i.test(String(m||''));

/* ══ ① 쉬운해설 고정 ══ */
const LK='prac:ezfix:v1';
const readLocal=()=>{ try{ return (JSON.parse(localStorage.getItem(LK)||'[]')||[]).map(String) }catch(e){ return [] } };
const writeLocal=a=>{ try{ a.length?localStorage.setItem(LK,JSON.stringify(a)):localStorage.removeItem(LK) }catch(e){globalThis.__q?.(e)} };

let COL=null;                    /* null 아직 모름 · true 서버에 ez_lock 칸 있음 · false 없음(이 기기에만) */
let FIX=new Set(readLocal());
let SYNCED=null, BUSY=false, TOLD=false;

/* 다른 조각들(ezMake · 해설 돌리기 · 꾸미기 …)이 묻는 곳은 여기 하나 */
window.__ezFixed = id => FIX.has(String(id));

async function sync(force){
  const s=curSid(), c=client();
  if(!s || !c || BUSY) return;
  if(!force && SYNCED===s) return;
  BUSY=true;
  try{
    /* SQL 을 돌리기 전에 이 기기에 적어 둔 고정이 있으면 서버로 올린다 */
    const local=readLocal();
    if(COL!==false && local.length){
      const up=await c.from('practicals').update({ ez_lock:true }).in('id', local);
      if(!up.error){ COL=true; writeLocal([]); say(`🔒 이 기기에만 적어 두었던 고정 ${local.length}개를 서버로 옮겼습니다`); }
      else if(NOCOL(up.error.message)) COL=false;
    }
    if(COL===false){ FIX=new Set(readLocal()); SYNCED=s; paint(); return; }

    const q=await c.from('practicals').select('id').eq('subject_id', s).eq('ez_lock', true);
    if(q.error){
      if(NOCOL(q.error.message)){ COL=false; FIX=new Set(readLocal()); SYNCED=s; paint(); }
      return;                                     /* 그 밖의 실패(오프라인 등)는 다음에 다시 */
    }
    COL=true;
    const srv=new Set((q.data||[]).map(d=>String(d.id)));
    const mine=new Set(rows().map(r=>String(r.id)));
    [...FIX].forEach(id=>{ if(mine.has(id) && !srv.has(id)) FIX.delete(id); });   /* 이 과목만 서버 값으로 */
    srv.forEach(id=>FIX.add(id));
    let ch=false;
    rows().forEach(r=>{ const v=srv.has(String(r.id)); if(!!r.ez_lock!==v){ r.ez_lock=v; ch=true; } });
    if(ch) keepCache();
    SYNCED=s; paint();
  }catch(e){globalThis.__q?.(e)}
  finally{ BUSY=false; }
}

async function toggle(id, btn){
  id=String(id||''); if(!id) return;
  const on=!FIX.has(id), r=rowOf(id);
  on ? FIX.add(id) : FIX.delete(id);
  paint();
  const c=client();
  if(COL!==false && c){
    if(btn) btn.disabled=true;
    let err=null;
    try{ const up=await c.from('practicals').update({ ez_lock:on }).eq('id', id); err=up.error||null; }
    catch(e){ err=e; }
    if(btn) btn.disabled=false;
    if(!err){
      COL=true;
      if(r){ r.ez_lock=on; keepCache(); }
      return tell(r, on, '');
    }
    if(!NOCOL(err.message||err)){                  /* 칸은 있는데 못 적었다 — 되돌린다 */
      on ? FIX.delete(id) : FIX.add(id); paint();
      return say('고정을 저장하지 못했습니다 — '+(err.message||err));
    }
    COL=false;
  }
  const L=new Set(readLocal()); on ? L.add(id) : L.delete(id); writeLocal([...L]);
  tell(r, on, TOLD ? '' : ' · 이 기기에만 저장했습니다 (supabase-ezlock.sql 을 돌리면 PC·폰이 같이 봅니다)');
  TOLD=true;
}
function tell(r, on, tail){
  const nm=r?`${r.year}-${r.session} ${r.no}번`:'이 문항';
  say(on ? `🔒 ${nm} 쉬운해설 고정 — AI 가 새로 만들거나 다시 쓰지 않습니다${tail}`
         : `🔓 ${nm} 고정을 풀었습니다${tail}`);
  try{ window.__pracLog && window.__pracLog(`${nm} 쉬운해설 ${on?'고정':'고정 풂'}`) }catch(e){globalThis.__q?.(e)}
}

/* 쉬운 풀이 칸 이름 옆에 단추 — 화면이 다시 그려지면 사라지므로 지켜보다 다시 붙인다 */
const isEzLab=lab=>String(lab.childNodes[0]?.textContent||'').trim()==='쉬운 풀이';
function btnFor(lab, id){
  id=String(id);
  let b=lab.querySelector(':scope > .ezfix');
  if(!b){ b=document.createElement('button'); b.type='button'; b.className='ezfix'; lab.appendChild(b); }
  const on=FIX.has(id), txt=on?'🔒 고정됨':'🔓 고정';
  if(b.dataset.id===id && b.textContent===txt) return;
  b.dataset.id=id;
  b.classList.toggle('on', on);
  b.textContent=txt;
  b.setAttribute('aria-pressed', on?'true':'false');
  b.title = on
    ? '쉬운해설 고정 중 — AI 가 새로 만들거나 다시 쓰지 않습니다. 누르면 풉니다'
    : '이 문항의 쉬운 풀이를 고정합니다 — 자동 생성·✎ 해설 돌리기·다시 해석·꾸미기에서 모두 빠집니다 (✎ 고치기 · 상세 Opus/Sonnet 단추는 됩니다)';
}
/* ★ v271 — 한눈에 쉬운 풀이 칸 이름줄에 «✎ 상세 Opus / Sonnet» (고정 바로 왼쪽) */
function solFor(lab, id){
  id=String(id);
  ['opus','sonnet'].forEach(w=>{
    let b=lab.querySelector(`:scope > .ezsol[data-w="${w}"]`);
    if(!b){
      b=document.createElement('button'); b.type='button'; b.className='ezsol'; b.dataset.w=w;
      b.innerHTML = w==='opus' ? '✎ 상세 <b>Opus</b>' : '✎ 상세 <b>Sonnet</b>';
      b.title = w==='opus' ? '비전공자용 상세 해설 — Opus (문항당 약 80원)' : '비전공자용 상세 해설 — Sonnet (문항당 약 30원)';
      const fx=lab.querySelector(':scope > .ezfix');
      fx ? fx.before(b) : lab.appendChild(b);
    }
    if(b.disabled) return;                          /* 뽑는 중엔 건드리지 않는다 */
    const v=id+'|'+w;
    if(b.dataset.pxsol2!==v) b.dataset.pxsol2=v;
  });
}
function paint(){
  const oid=nowOv();
  if(oid) $$('#ovl .plab').forEach(lab=>{ if(isEzLab(lab)){ btnFor(lab, oid); solFor(lab, oid); } });
  $$('#list .pcard .plabel').forEach(lab=>{
    if(!isEzLab(lab)) return;
    const card=lab.closest('.pcard'); if(card && card.dataset.id) btnFor(lab, card.dataset.id);
  });
}
window.__ezFixPaint=paint;
window.__ezFixSync=()=>sync(true);
/* ★ v323 — 미니맵에서 오른쪽 클릭으로 고정/풀기 */
window.__ezFixToggle=id=>toggle(id);
window.__ezFixList=()=>[...FIX];
/* ★ v324 — 여러 문항을 한 번에 고정 (서버에는 200개씩 묶어서) · 돌려줌: 실제로 새로 고정한 수 */
window.__ezFixMany=async(ids, on=true)=>{
  const list=[...new Set((ids||[]).map(String))].filter(id=>on ? !FIX.has(id) : FIX.has(id));
  if(!list.length) return 0;
  list.forEach(id=>on ? FIX.add(id) : FIX.delete(id)); paint();
  const c=client(); let local=COL===false || !c;
  if(!local){
    for(let i=0;i<list.length;i+=200){
      const part=list.slice(i,i+200);
      let err=null;
      try{ const up=await c.from('practicals').update({ ez_lock:on }).in('id', part.map(x=>isNaN(+x)?x:+x)); err=up.error||null; }catch(e){ err=e; }
      if(err){
        if(NOCOL(err.message||err)){ COL=false; local=true; break; }
        list.slice(i).forEach(id=>on ? FIX.delete(id) : FIX.add(id)); paint();     /* 못 적은 것은 되돌림 */
        say('고정을 일부 저장하지 못했습니다 — '+(err.message||err)); return i;
      }
      COL=true;
      part.forEach(id=>{ const r=rowOf(id); if(r) r.ez_lock=on; });
    }
    if(!local){ keepCache(); try{ window.__pracLog && window.__pracLog(`쉬운해설 ${list.length}문항 한꺼번에 ${on?'고정':'고정 풂'}`) }catch(e){globalThis.__q?.(e)} return list.length; }
  }
  const L=new Set(readLocal()); list.forEach(id=>on ? L.add(id) : L.delete(id)); writeLocal([...L]);
  if(!TOLD){ TOLD=true; say('이 기기에만 저장했습니다 (supabase-ezlock.sql 을 돌리면 PC·폰이 같이 봅니다)'); }
  return list.length;
};

document.addEventListener('click', e=>{
  const b=e.target.closest && e.target.closest('.ezfix'); if(!b) return;
  e.preventDefault(); e.stopPropagation();
  if(!b.disabled) toggle(b.dataset.id, b);
}, true);

/* ══ ② 이지뷰 ══ */
const EVK='prac:easyview';
const B=()=>document.body;
function paintEv(){
  const on=B().classList.contains('easyview');
  $$('[data-pxeasyview]').forEach(b=>{ b.classList.toggle('on', on); b.setAttribute('aria-pressed', on?'true':'false'); });
}
function setEv(on){
  B().classList.toggle('easyview', !!on);
  try{ localStorage.setItem(EVK, on?'1':'0') }catch(e){globalThis.__q?.(e)}
  if(on && B().classList.contains('ezonly')){          /* «해설만» 과는 둘 중 하나 */
    B().classList.remove('ezonly');
    try{ localStorage.setItem('prac:ezonly','0') }catch(e){globalThis.__q?.(e)}
    $$('[data-pxezonly]').forEach(b=>{ b.classList.remove('on'); b.textContent='📖 해설만'; });
  }
  paintEv();
}
try{ if(localStorage.getItem(EVK)==='1' && !B().classList.contains('ezonly')) B().classList.add('easyview') }catch(e){globalThis.__q?.(e)}

function mountEv(){
  const box=$('#pxOvBtns'); if(!box || box.querySelector('[data-pxeasyview]')) return;
  const b=document.createElement('button');
  b.type='button'; b.className='pxb'; b.dataset.pxeasyview='1';
  b.textContent='◧ 이지뷰';
  b.title='문제·답안은 왼쪽에 위아래로, 쉬운 풀이는 오른쪽에 길게 — 두 칸으로 봅니다. 다시 누르면 되돌아옵니다 (요금 안 붙음)';
  const ez=box.querySelector('[data-pxezonly]');
  ez ? ez.before(b) : box.prepend(b);
  paintEv();
}
document.addEventListener('click', e=>{
  const v=e.target.closest && e.target.closest('[data-pxeasyview]');
  if(v){ e.preventDefault(); e.stopPropagation(); return void setEv(!B().classList.contains('easyview')); }
  /* «해설만» 을 켜면 이지뷰는 끈다 — 그쪽 처리가 끝난 뒤에 본다 */
  if(e.target.closest && e.target.closest('[data-pxezonly]'))
    setTimeout(()=>{ if(B().classList.contains('ezonly') && B().classList.contains('easyview')) setEv(false); }, 0);
}, true);

/* ══ 지켜보기 ══ */
let raf=0;
const soon=()=>{ if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; try{ paint(); mountEv(); }catch(e){globalThis.__q?.(e)} }); };
['#list','#ovl'].forEach(sel=>{
  const w=setInterval(()=>{
    const n=$(sel); if(!n) return; clearInterval(w);
    new MutationObserver(soon).observe(n, { childList:true, subtree:true });
    soon();
  }, 300);
  setTimeout(()=>clearInterval(w), 20000);
});
setInterval(()=>{
  const s=curSid();
  if(s && SYNCED!==s){
    /* 서버에 묻기 전에, 받아 둔 줄에 ez_lock 이 있으면 먼저 믿는다 */
    if(COL!==false) rows().forEach(r=>{ if(r.ez_lock) FIX.add(String(r.id)); });
    sync();
  }
  paint(); mountEv(); paintEv();
}, 1500);
/* 다른 기기에서 고정을 바꿨을 수 있다 — 이 탭으로 돌아오면 다시 맞춘다.
   ★ v268 — 탭을 오갈 때마다 묻지 않게 1분에 한 번까지만 */
let LASTV=0;
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden || Date.now()-LASTV<60000) return;
  LASTV=Date.now(); sync(true);
});
setTimeout(()=>{ paint(); mountEv(); paintEv(); }, 900);
})();
