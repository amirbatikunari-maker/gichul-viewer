/* practice.html 에서 분리 (v341) — 원래 26210번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||console.log)(m) }catch(e){globalThis.__q?.(e)} };
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const client=()=>{ try{ return sb }catch(e){ return null } };
const sid=()=>{ try{ return CACHE_SID }catch(e){ return null } };
const nowOv=()=>{ try{ return OVID!=null?String(OVID):'' }catch(e){ return '' } };
const locked=id=>{ try{ return !!(window.__ezFixed&&window.__ezFixed(id)) }catch(e){ return false } };
const cl=t=>String(t==null?'':t).replace(/\s+/g,' ').trim();
const keyOf=r=>{ const a=cl(r.qtype), b=cl(r.qtype2), c=cl(r.qtype3); return c ? a+'\u0001'+b+'\u0001'+c : ''; };
const H=t=>{ t=String(t||''); let h=0; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))|0; return t.length+':'+h; };

let SNAP=new Map(), SSID=null, SROWS=null, BUSY=false;
function groups(){
  const g=new Map();
  rows().forEach(r=>{ const k=keyOf(r); if(k) (g.get(k)||g.set(k,[]).get(k)).push(r); });
  return g;
}
window.__ezSame=id=>{ const r=rows().find(x=>String(x.id)===String(id)); const k=r&&keyOf(r); return k ? (groups().get(k)||[]) : []; };

async function write(ids, md){
  const c=client(); if(!c || !ids.length) return false;
  const up=await c.from('practicals').update({ easy_md:md }).in('id', ids.map(x=>isNaN(+x)?x:+x));
  if(up.error){ say('해설 연동 저장 실패 — '+up.error.message); return false; }
  const set=new Set(ids.map(String));
  rows().forEach(r=>{ if(set.has(String(r.id))){ r.easy_md=md; SNAP.set(String(r.id), H(md)); } });
  try{ cacheSaveRows() }catch(e){globalThis.__q?.(e)}
  return true;
}
function redraw(ids){
  const set=new Set(ids.map(String));
  try{ if($('#ovl')?.classList.contains('on') && set.has(nowOv()) && typeof window.ovDraw==='function') window.ovDraw(); }catch(e){globalThis.__q?.(e)}
  try{ (window.__pracRedraw||window.drawList)?.() }catch(e){globalThis.__q?.(e)}
}
async function tick(){
  if(BUSY || window.__pracSwap) return;
  const R=rows(), s=sid(); if(!R.length || !s) return;
  /* 과목을 새로 받았으면 지금 모습을 «처음» 으로 적어 둔다 (그때 다른 것은 퍼뜨리지 않음) */
  const fresh = s!==SSID;               /* 과목이 바뀔 때만 «처음». 같은 과목에서 다시 받아 바뀐 해설은 퍼뜨림 */
  BUSY=true;
  try{
    const G=groups();
    const changed=[];
    if(fresh){ SNAP=new Map(); R.forEach(r=>SNAP.set(String(r.id), H(r.easy_md))); SSID=s; SROWS=R; }
    else R.forEach(r=>{ const id=String(r.id), h=H(r.easy_md), o=SNAP.get(id);
      if(o==null){ SNAP.set(id,h); return; }
      if(o!==h){ SNAP.set(id,h); if(String(r.easy_md||'').trim()) changed.push(r); } });
    /* ① 바뀐 해설 → 같은 동일 문제로 */
    for(const r of changed){
      const k=keyOf(r); if(!k) continue;
      const to=(G.get(k)||[]).filter(o=>String(o.id)!==String(r.id) && !locked(o.id) && o.easy_md!==r.easy_md).map(o=>String(o.id));
      if(to.length && await write(to, r.easy_md)){ say(`🔗 동일 문제 ${to.length}문항에도 해설을 맞췄습니다`); redraw(to); }
    }
    /* ② 동일 문제인데 해설이 비어 있는 것 → 있는 쪽으로 (여러 개면 가장 긴 것 · 고정한 것 먼저) */
    for(const [k,list] of G){
      if(list.length<2) continue;
      const empty=list.filter(o=>!String(o.easy_md||'').trim() && !locked(o.id));
      if(!empty.length) continue;
      const donors=list.filter(o=>String(o.easy_md||'').trim());
      if(!donors.length) continue;
      const d=donors.slice().sort((a,b)=>(locked(b.id)-locked(a.id)) || String(b.easy_md).length-String(a.easy_md).length)[0];
      const ids=empty.map(o=>String(o.id));
      if(await write(ids, d.easy_md)) redraw(ids);
    }
  }catch(e){globalThis.__q?.(e)}
  finally{ BUSY=false; }
  chip();
}
/* ④ 쉬운 풀이 이름줄 표시 */
function chip(){
  const labs=[...$$('#ovRight .seg[data-seg="e"] > .plab'), ...$$('#list > .pcard .plabel').filter(l=>/^\s*[▾▸]?\s*쉬운 풀이/.test(l.textContent||''))];
  labs.forEach(lab=>{
    const card=lab.closest('.pcard'); const id=card?String(card.dataset.id):nowOv(); if(!id) return;
    const g=window.__ezSame(id);
    let c=lab.querySelector(':scope > .ezlk');
    if(g.length<2){ c && c.remove(); return; }
    const kinds=new Set(g.map(o=>H(o.easy_md)).filter(h=>h!=='0:0'));
    if(!c){ c=document.createElement('span'); c.className='ezlk'; lab.appendChild(c);
      ['pointerdown','mousedown'].forEach(ev=>c.addEventListener(ev,e=>e.stopPropagation()));
      c.addEventListener('click', async e=>{
        e.preventDefault(); e.stopPropagation();
        if(!c.classList.contains('diff')) return;
        const me=rows().find(x=>String(x.id)===String(c.dataset.id)); if(!me || !String(me.easy_md||'').trim()) return say('이 문항에 해설이 없습니다');
        const to=window.__ezSame(me.id).filter(o=>String(o.id)!==String(me.id) && !locked(o.id)).map(o=>String(o.id));
        if(!confirm(`동일 문제 ${to.length}문항의 해설을 지금 이 해설로 바꿀까요?\n(🔒 고정한 문항은 그대로)`)) return;
        if(await write(to, me.easy_md)){ say(`🔗 동일 문제 ${to.length}문항 해설을 맞췄습니다`); redraw(to); chip(); }
      });
    }
    c.dataset.id=id;
    const diff=kinds.size>1;
    const t=diff ? `해설통일(${g.length})` : `해설연동(${g.length})`;      /* ★ v295 — 짧게 · 자세한 건 올리면 */
    if(c.textContent!==t) c.textContent=t;
    c.classList.toggle('diff', diff);
    c.title = diff ? `동일 문제 ${g.length}개 · 해설 ${kinds.size}가지 — 누르면 지금 보는 해설로 모두 맞춥니다 (🔒 고정 문항 제외)`
                   : '동일 문제(대·중·소문항이 같음) — 해설을 뽑거나 고치면 나머지에도 같이 적힙니다\n'
                     + g.filter(o=>String(o.id)!==id).map(o=>`${o.year%100}-${o.session} ${o.no}`).join(' · ');
  });
}
setInterval(tick, 2000);
setInterval(chip, 1200);
})();
