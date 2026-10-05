/* practice.html 에서 분리 (v341) — 원래 26033번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||console.log)(m) }catch(e){globalThis.__q?.(e)} };
const client=()=>{ try{ return sb }catch(e){ return null } };
const curSid=()=>{ try{ return CACHE_SID }catch(e){ return null } };
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const NOCOL=m=>/prog|fav|column|schema cache|42703|PGRST204/i.test(String(m||''));
const PK='prac:sync:pend:v1';
let PEND=(()=>{ try{ const o=JSON.parse(localStorage.getItem(PK)||'{}')||{}; return { prog:o.prog||{}, fav:o.fav||{} }; }catch(e){ return { prog:{}, fav:{} } } })();
const psv=()=>{ try{ localStorage.setItem(PK, JSON.stringify(PEND)) }catch(e){globalThis.__q?.(e)} };
const COL={ prog:null, fav:null };
let TOLD=false, FT=0, BUSY=false, PULLING=false, LASTP=0, SYNCED='';
const progAll=()=>{ try{ return (window.__pracProg&&window.__pracProg())||{} }catch(e){ return {} } };
const at=v=>+(v&&v.at)||0;

function mark(kind, id, rec){
  PEND[kind][String(id)]=rec; psv();
  clearTimeout(FT); FT=setTimeout(flush, 800);
}
window.__studyMark=mark;

async function flush(){
  const c=client(); if(!c || BUSY || !navigator.onLine) return;
  BUSY=true;
  try{
    for(const kind of ['prog','fav']){
      if(COL[kind]===false) continue;
      const ent=Object.entries(PEND[kind]); if(!ent.length) continue;
      /* 같은 값이면 한 번에 (.in) — 초기화처럼 여러 줄이 같을 때 */
      const by=new Map();
      ent.forEach(([id,v])=>{ const k=JSON.stringify(v); (by.get(k)||by.set(k,[]).get(k)).push(id); });
      const jobs=[...by.entries()];
      let stop=false;
      for(let i=0;i<jobs.length && !stop;i+=6){
        await Promise.all(jobs.slice(i,i+6).map(async ([k,ids])=>{
          for(let j=0;j<ids.length;j+=300){
            const part=ids.slice(j,j+300);
            try{
              const up=await c.from('practicals').update({ [kind]:JSON.parse(k) }).in('id', part.map(x=>isNaN(+x)?x:+x));
              if(up.error){
                if(NOCOL(up.error.message)){ COL[kind]=false; stop=true;
                  if(!TOLD){ TOLD=true; say('🔄 회독·북마크가 이 기기에만 저장됩니다 — supabase-study.sql 을 한 번 돌리면 기기끼리 맞춥니다'); } }
                return;
              }
              COL[kind]=true;
              part.forEach(id=>{ if(JSON.stringify(PEND[kind][id])===k) delete PEND[kind][id]; });
            }catch(e){ stop=true; }
          }
        }));
      }
    }
  }finally{ BUSY=false; psv(); }
  if(Object.keys(PEND.prog).length+Object.keys(PEND.fav).length && navigator.onLine) setTimeout(flush, 15000);
}

/* 서버 → 이 기기. 나중에 바꾼 쪽이 이긴다 */
async function pull(force){
  const s=curSid(), c=client(); if(!s || !c || PULLING) return;
  if(!force && Date.now()-LASTP<20000 && SYNCED===s) return;
  PULLING=true; LASTP=Date.now();
  try{
    const got=[];
    let colOK=true;
    for(let from=0; from<20000; from+=1000){
      const q=await c.from('practicals').select('id,prog,fav').eq('subject_id', s)
        .or('prog.not.is.null,fav.not.is.null').range(from, from+999);
      if(q.error){ if(NOCOL(q.error.message)){ COL.prog=COL.fav=false; colOK=false; window.__studyPulled=true; } return; }
      got.push(...(q.data||[]));
      if(!q.data || q.data.length<1000) break;
    }
    if(!colOK) return;
    COL.prog=COL.fav=true;
    const P=progAll(), F=window.__favAll ? window.__favAll() : {};
    const seen=new Set();
    let chP=false, chF=false;
    got.forEach(d=>{
      const id=String(d.id); seen.add(id);
      /* 진도 */
      const sp=d.prog, lp=P[id], pp=PEND.prog[id];
      if(sp && typeof sp==='object'){
        if(pp){ if(at(sp)>at(pp)){ delete PEND.prog[id]; window.__pracProgPut(id, sp); chP=true; } }
        else if(!lp || at(sp)>at(lp)){ if((sp.n|0)>0 || lp){ window.__pracProgPut(id, sp); chP=true; } }
        else if(at(lp)>at(sp)) PEND.prog[id]=lp;
      }else if(lp && !pp) PEND.prog[id]=lp;
      /* 북마크 */
      const sf=d.fav, lf=F[id], pf=PEND.fav[id];
      if(sf && typeof sf==='object'){
        if(pf){ if(at(sf)>at(pf)){ delete PEND.fav[id]; F[id]=sf; chF=true; } }
        else if(!lf || at(sf)>at(lf)){ F[id]=sf; chF=true; }
        else if(at(lf)>at(sf)) PEND.fav[id]=lf;
      }else if(lf && !pf) PEND.fav[id]=lf;
    });
    /* 이 과목에서 서버엔 없고 이 기기에만 있는 것 → 올림 (SQL 뒤 처음 한 번 옮기기도 이것) */
    rows().forEach(r=>{
      const id=String(r.id); if(seen.has(id)) return;
      if(P[id] && !PEND.prog[id]) PEND.prog[id]=Object.assign({ at:Date.now() }, P[id]);
      if(F[id] && !PEND.fav[id]) PEND.fav[id]=Object.assign({ at:Date.now() }, F[id]);
    });
    psv();
    if(chP){ try{ window.__pracProgSave() }catch(e){globalThis.__q?.(e)} }
    if(chF){ try{ window.__favSave(F) }catch(e){globalThis.__q?.(e)} }
    if(chP||chF){
      try{ (window.__pracRedraw||window.drawList)?.() }catch(e){globalThis.__q?.(e)}
      try{ window.__pracMinimap && document.querySelector('.mmpop.on') && window.__pracMinimap.open() }catch(e){globalThis.__q?.(e)}
    }
    if(SYNCED!==s && (chP||chF)) say('🔄 다른 기기의 회독·북마크를 맞췄습니다');
    SYNCED=s; window.__studyPulled=true;
    flush();
  }catch(e){globalThis.__q?.(e)}
  finally{ PULLING=false; }
}
window.__studySync=()=>pull(true);

/* 진도 초기화 — 모든 기기에서 지우기 */
window.__studyReset=async ids=>{
  const now=Date.now(), z={ n:0, at:now };
  (ids||[]).forEach(id=>{ PEND.prog[String(id)]=z; });
  psv();
  const c=client();
  if(c && COL.prog!==false){
    try{ const up=await c.from('practicals').update({ prog:z }).not('prog','is',null); if(!up.error){ (ids||[]).forEach(id=>{ delete PEND.prog[String(id)]; }); psv(); } }catch(e){globalThis.__q?.(e)}
  }
  flush();
};

setInterval(()=>{ const s=curSid(); if(s && SYNCED!==s) pull(true); }, 1500);
setInterval(()=>{ if(!document.hidden) pull(true); }, 60000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) pull(false); });
addEventListener('online', ()=>{ flush(); pull(true); });
addEventListener('pagehide', ()=>{ try{ psv() }catch(e){globalThis.__q?.(e)} });
setTimeout(flush, 2500);
})();
