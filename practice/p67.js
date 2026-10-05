/* practice.html 에서 분리 (v341) — 원래 26388번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const client=()=>{ try{ return sb }catch(e){ return null } };
const curSid=()=>{ try{ return CACHE_SID }catch(e){ return null } };
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const rowOf=id=>rows().find(r=>String(r.id)===String(id));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||console.log)(m) }catch(e){globalThis.__q?.(e)} };
const NOCOL=m=>/\bqa\b|column|schema cache|42703|PGRST204/i.test(String(m||''));
const short=r=>r?`${String(r.year).length===4&&+r.year<3000?String(r.year).slice(2):r.year}-${r.session} ${r.no}`:'';

/* ── 저장소 ── 이 기기(LS) + 서버(qa 칸). 문항마다 { items:[{id,q,a,at}], at } */
const LK='prac:qa:v1', PK='prac:qa:pend';
let COL=null;                                    /* null=모름 · true=있음 · false=없음 */
const lsGet=k=>{ try{ return JSON.parse(localStorage.getItem(k)||'{}')||{} }catch(e){ return {} } };
const lsPut=(k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)) }catch(e){globalThis.__q?.(e)} };
let L=lsGet(LK), PEND=lsGet(PK);
const norm=v=>{ if(!v) return null; if(typeof v==='string'){ try{ v=JSON.parse(v) }catch(e){ return null } }
  if(Array.isArray(v)) v={ items:v, at:0 }; return v && Array.isArray(v.items) ? v : null; };
/* ★ v315 — 두 기기 것을 «합친다» (예전: 나중 것이 통째로 이김 → 다른 기기에서 막 쌓은 것이 사라질 수 있었음)
   · 항목은 id 로 합침 · 같은 id 면 나중에 고친 쪽(ed) · 지운 id 는 del 에 남겨 되살아나지 않게 */
const ver=x=>+(x&&(x.ed||x.at))||0;
function merge(a,b){
  a=norm(a)||{ items:[], del:[], at:0 }; b=norm(b)||{ items:[], del:[], at:0 };
  const del=[...new Set([...(a.del||[]), ...(b.del||[])])].slice(-300), dd=new Set(del), by=new Map();
  [...a.items, ...b.items].forEach(x=>{ if(!x || !x.id || dd.has(x.id)) return; const o=by.get(x.id); if(!o || ver(x)>ver(o)) by.set(x.id, x); });
  return { items:[...by.values()].sort((p,q)=>(+p.at||0)-(+q.at||0)), del, at:Math.max(+a.at||0, +b.at||0) };
}
function get(id){
  const a=L[String(id)], r=rowOf(id), b=norm(r&&r.qa);
  return (a||b) ? merge(a,b) : { items:[], del:[], at:0 };
}
async function put(id, v){
  id=String(id); v.at=Date.now(); if(!v.del) v.del=(get(id).del||[]); L[id]=v; lsPut(LK,L);
  const r=rowOf(id); if(r) r.qa=v;
  PEND[id]=1; lsPut(PK,PEND);
  paintAll();
  await flush();
}
let SAID=false;
const noCol=()=>{ COL=false; if(!SAID){ SAID=true; say('📌 이 기기에만 저장했습니다 — Supabase 에서 supabase-qa.sql 을 한 번 돌리면 기기끼리 맞춰집니다'); } };
async function flush(){
  const c=client(); if(COL===false){ noCol(); return; }
  if(!c || !navigator.onLine) return;
  for(const id of Object.keys(PEND)){
    let v=L[id]; if(!v){ delete PEND[id]; continue; }
    /* 올리기 전에 서버 것을 한 번 받아 합친다 — 다른 기기가 그새 쌓은 것을 덮지 않게 */
    const g=await c.from('practicals').select('qa').eq('id', id).maybeSingle();
    if(g.error && NOCOL(g.error.message)){ noCol(); return; }
    if(!g.error && g.data && g.data.qa){ v=merge(g.data.qa, v); v.at=Date.now(); L[id]=v; lsPut(LK,L); const r=rowOf(id); if(r) r.qa=v; paintAll(); }
    const q=await c.from('practicals').update({ qa:v }).eq('id', id);
    if(q.error){
      if(NOCOL(q.error.message)) noCol();
      return;
    }
    COL=true; delete PEND[id]; lsPut(PK,PEND);
  }
}
/* 서버 → 이 기기 (두 쪽 것을 합침) */
/* ★ v315 — 한 번만 받던 것 → 과목이 바뀌면 · 1분마다 · 창으로 돌아올 때(다른 기기에서 쌓고 넘어온 경우) 다시 받음 */
let PULLED='', PT=0;
async function pull(force){
  const c=client(), s=curSid(); if(!c || !s) return;
  if(!force && PULLED===String(s) && Date.now()-PT<60000) return;
  PULLED=String(s); PT=Date.now();
  try{
    const q=await c.from('practicals').select('id,qa').eq('subject_id', s).not('qa','is',null).limit(5000);
    if(q.error){ if(NOCOL(q.error.message)) COL=false; return; }
    COL=true;
    (q.data||[]).forEach(d=>{
      const id=String(d.id), sv=norm(d.qa); if(!sv) return;
      const mv=merge(L[id], sv); L[id]=mv;
      const r=rowOf(id); if(r) r.qa=mv;
    });
    lsPut(LK,L); lsPut(PK,PEND); paintAll(); flush();
  }catch(e){globalThis.__q?.(e)}
}

/* ── 지금 문항 ── */
function target(){
  try{ if($('#ovl')?.classList.contains('on') && OVID!=null) return String(OVID); }catch(e){globalThis.__q?.(e)}
  try{ if(document.body.classList.contains('oneup')){ const r=window.SHOWN&&window.SHOWN[window.ONEAT|0]; if(r) return String(r.id); } }catch(e){globalThis.__q?.(e)}
  const cards=$$('.pcard[data-id]');
  for(const c of cards){ const b=c.getBoundingClientRect(); if(b.bottom>80 && b.top<innerHeight*.6) return c.dataset.id; }
  return cards.length?cards[0].dataset.id:null;
}
window.__pracQaTarget=()=>{ const id=target(), r=rowOf(id); return id&&r?{ id, label:(+r.year<3000?`${r.year}년 ${r.session}회 ${r.no}번`:short(r)) }:null; };
window.__pracQaAdd=async(list)=>{
  const id=target(); if(!id || !rowOf(id)) throw new Error('지금 보고 있는 문항을 못 찾았습니다');
  const v=get(id), items=(v.items||[]).slice();
  (Array.isArray(list)?list:[list]).forEach(x=>{
    const q=String(x&&x.q||'').trim(), a=String(x&&x.a||'').trim(); if(!q && !a) return;
    items.push({ id:'qa'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), q, a, at:Date.now() });
  });
  OPEN.add(id); const nw=items[items.length-1]; if(nw) OPENED.add(nw.id);
  await put(id, { items, del:v.del });
  return short(rowOf(id));
};

/* ── 그리기 ── */
const OPEN=new Set(), OPENED=new Set();          /* OPENED — 사람이 펼쳐 둔 항목 (다시 그려도 유지) */                            /* 방금 저장한 문항 — 마지막 것을 펼쳐 보임 */
let EDIT='';                                     /* 고치는 중인 항목 id */
function mdHtml(t){
  try{ if(window.AIChat && typeof window.AIChat.md==='function') return window.AIChat.md(t); }catch(e){globalThis.__q?.(e)}
  try{ if(typeof window.mdLite==='function') return window.mdLite(t); }catch(e){globalThis.__q?.(e)}
  return esc(t).replace(/\n/g,'<br>');
}
function tex(el){
  try{ if(window.AIChat && typeof window.AIChat.tex==='function') return window.AIChat.tex(el); }catch(e){globalThis.__q?.(e)}
  try{ window.renderMathInElement && window.renderMathInElement(el,{ delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError:false }); }catch(e){globalThis.__q?.(e)}
}
const firstLine=t=>String(t||'').replace(/[#*`>$]/g,'').replace(/\s+/g,' ').trim().slice(0,120);
const when=ms=>{ const d=new Date(ms||0), p=n=>String(n).padStart(2,'0'); return `${String(d.getFullYear()).slice(2)}.${p(d.getMonth()+1)}.${p(d.getDate())}`; };
function edForm(x, isNew){
  return `<div class="qx-ed" data-qi="${esc(x.id)}">
      <label><span class="qx-k q">Q</span>질문</label><textarea data-qe="q" placeholder="질문 (없어도 됨)">${esc(x.q||'')}</textarea>
      <label><span class="qx-k a">A</span>답 — 마크다운 그대로 (표·수식 $…$ 유지)</label><textarea data-qe="a" style="min-height:150px" placeholder="답·메모">${esc(x.a||'')}</textarea>
      <div class="qx-eb"><small>Ctrl+Enter 저장 · Esc 취소</small><button type="button" data-qacancel>취소</button><button type="button" class="ok" data-qasave="${esc(x.id)}"${isNew?' data-new="1"':''}>${isNew?'추가':'저장'}</button></div></div>`;
}
function html(id){
  const v=get(id), it=v.items||[];
  if(!it.length && EDIT!=='new:'+id) return '';
  /* ★ v332 — 머리줄: Q&A 개수 · 모두 펼치기/접기 · ＋ 직접 추가 */
  const allOpen=it.length && it.every(x=>OPENED.has(x.id));
  const head=`<div class="qx-hd"><span class="qx-tl">💬 Q&amp;A</span><span class="qx-n">${it.length}</span><span class="sp"></span>
      ${it.length?`<button type="button" class="qx-hb" data-qaall="${allOpen?'0':'1'}">${allOpen?'모두 접기':'모두 펼치기'}</button>`:''}
      <button type="button" class="qx-hb add" data-qaadd title="질문·답을 직접 적어 넣기">＋ 추가</button></div>`;
  const items=it.map((x,i)=>{
      if(EDIT===x.id) return edForm(x,false);
      const open=OPENED.has(x.id);
      const longQ=x.q && (String(x.q).length>120 || /\n/.test(x.q));
      return `<details class="qx-it" data-qi="${esc(x.id)}"${open?' open':''}>
        <summary class="qx-sm"><span class="qx-car">▶</span><span class="qx-no">Q${i+1}</span><span class="qx-q">${esc(firstLine(x.q)||'(질문 없이 답만)')}</span><span class="qx-dt">${when(x.ed||x.at)}</span>
          <span class="qx-act"><button type="button" data-qaedit="${esc(x.id)}" title="고치기">✎</button><button type="button" class="del" data-qadel="${esc(x.id)}" title="지우기">🗑</button></span></summary>
        <div class="qx-body">${longQ?`<div class="qx-row"><span class="qx-k q">Q</span><div class="qx-md">${mdHtml(x.q)}</div></div>`:''}${x.a?`<div class="qx-row"><span class="qx-k a">A</span><div class="qx-md">${mdHtml(x.a)}</div></div>`:'<div class="qx-empty">답이 비어 있음 — ✎ 로 적기</div>'}</div>
      </details>`; }).join('');
  const add = EDIT==='new:'+id ? edForm({ id:'new' }, true) : '';
  return head+`<div class="qx-list">${items}${add}</div>`;
}
function slotFor(host, id){
  let box=host.nextElementSibling;
  if(!(box && box.classList.contains('qastack'))){ box=document.createElement('div'); box.className='qastack'; host.after(box); }
  const v=get(id), sig=id+'|'+(v.at||0)+'|'+(v.items||[]).map(x=>x.id+ver(x)).join(',')+'|'+EDIT;
  if(box.__sig===sig) return;
  box.__sig=sig; box.dataset.for=id;
  const h=html(id);
  box.hidden=!h;
  box.innerHTML=h;
  if(h) tex(box);
}
function paintAll(){
  /* 일반 보기 — 카드의 쉬운 풀이 상자 밑 */
  $$('.pcard[data-id] .pcol-ez .easybox, .pcard[data-id] .ez .easybox').forEach(b=>{
    const id=b.closest('.pcard').dataset.id; slotFor(b, id); });
  /* 한눈에 — 쉬운 풀이 칸 밑 */
  try{ const e=$('#ovRight [data-seg="e"] .ez'); if(e && OVID!=null) slotFor(e, String(OVID)); }catch(e){globalThis.__q?.(e)}
}
const repaint=st=>{ st.__sig=''; paintAll(); };
async function saveEd(st, btn){
  const id=st.dataset.for, box=btn.closest('.qx-ed'); if(!id || !box) return;
  const q=box.querySelector('[data-qe="q"]').value.trim(), a=box.querySelector('[data-qe="a"]').value.trim();
  const v=get(id); EDIT='';
  if(btn.dataset.new){
    if(!q && !a){ repaint(st); return; }
    const nid='qa'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    OPENED.add(nid);
    await put(id, { items:[...(v.items||[]), { id:nid, q, a, at:Date.now() }], del:v.del });
    say('💬 Q&A 를 추가했습니다'); return;
  }
  await put(id, { items:(v.items||[]).map(x=>x.id===btn.dataset.qasave?Object.assign({},x,{ q, a, ed:Date.now() }):x), del:v.del });
  say('💬 고쳤습니다');
}
document.addEventListener('click', async e=>{
  const st=e.target.closest('.qastack'); if(!st) return;
  const id=st.dataset.for; if(!id) return;
  const t=e.target;
  /* 줄(summary) 안의 단추는 펼치기·접기를 건드리지 않게 */
  const inSum=t.closest('.qx-sm') && t.closest('button');
  if(inSum) { e.preventDefault(); e.stopPropagation(); }
  const ed=t.closest('[data-qaedit]'); if(ed){ EDIT=ed.dataset.qaedit; repaint(st); st.querySelector('.qx-ed textarea[data-qe="a"]')?.focus(); return; }
  const dl=t.closest('[data-qadel]'); if(dl){
    const v=get(id), x=(v.items||[]).find(y=>y.id===dl.dataset.qadel);
    if(!confirm(`이 Q&A 를 지울까요?\n\nQ. ${firstLine(x&&x.q).slice(0,60)||'(질문 없음)'}`)) return;
    OPENED.delete(dl.dataset.qadel);
    await put(id, { items:(v.items||[]).filter(y=>y.id!==dl.dataset.qadel), del:[...(v.del||[]), dl.dataset.qadel] }); say('🗑 지웠습니다'); return; }
  if(t.closest('[data-qaadd]')){ EDIT='new:'+id; repaint(st); st.querySelector('.qx-ed textarea[data-qe="q"]')?.focus(); return; }
  const al=t.closest('[data-qaall]'); if(al){ const on=al.dataset.qaall==='1'; (get(id).items||[]).forEach(x=>on?OPENED.add(x.id):OPENED.delete(x.id)); repaint(st); return; }
  if(t.closest('[data-qacancel]')){ EDIT=''; return repaint(st); }
  const sv=t.closest('[data-qasave]'); if(sv) return saveEd(st, sv);
});
document.addEventListener('keydown', e=>{
  const ta=e.target.closest && e.target.closest('.qastack .qx-ed textarea'); if(!ta) return;
  const st=ta.closest('.qastack');
  if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); EDIT=''; repaint(st); }
  else if(e.key==='Enter' && (e.ctrlKey||e.metaKey)){ e.preventDefault(); e.stopPropagation(); const b=st.querySelector('.qx-ed [data-qasave]'); b && saveEd(st, b); }
}, true);
document.addEventListener('toggle', e=>{ const d=e.target; if(!(d && d.classList && d.classList.contains('qx-it'))) return;
  const k=d.dataset.qi; if(d.open) OPENED.add(k); else OPENED.delete(k);
  /* 머리줄 «모두 펼치기/접기» 글자만 맞춤 (통째로 다시 그리면 펼침 움직임이 끊김) */
  const st=d.closest('.qastack'), hb=st&&st.querySelector('[data-qaall]');
  if(hb){ const all=[...st.querySelectorAll('.qx-it')].every(x=>x.open); hb.dataset.qaall=all?'0':'1'; hb.textContent=all?'모두 접기':'모두 펼치기'; } }, true);
/* 화면이 다시 그려지면 따라 붙인다 */
let T=0;
new MutationObserver(ms=>{
  if(ms.every(m=>m.target.closest && m.target.closest('.qastack'))) return;
  clearTimeout(T); T=setTimeout(()=>{ paintAll(); pull(); }, 120);
}).observe(document.body, { childList:true, subtree:true });
setInterval(()=>{ pull(); flush(); }, 60000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) pull(true); });
addEventListener('focus', ()=>pull());
window.__pracQaPull=()=>pull(true);
addEventListener('online', flush);
setTimeout(()=>{ paintAll(); pull(); }, 1500);
})();
