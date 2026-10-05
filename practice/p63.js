/* practice.html 에서 분리 (v341) — 원래 25317번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||console.log)(m) }catch(e){globalThis.__q?.(e)} };
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const rowOf=id=>rows().find(r=>String(r.id)===String(id))||null;
const client=()=>{ try{ return sb }catch(e){ return null } };
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const QUIZ=new Set();                                      /* 🧠 외우기 켠 문항 (이 창 안에서만) */

function qidOf(el){
  const c=el && el.closest && el.closest('.pcard'); if(c && c.dataset.id) return String(c.dataset.id);
  try{ return OVID!=null ? String(OVID) : '' }catch(e){ return '' }
}
/* ★ v283 — 두문자 소제목 아래, 다음 소제목 전까지의 목록 전부 */
function mnLists(head){
  const out=[]; let el=head && head.nextElementSibling;
  while(el){
    if(el.tagName==='P' && el.querySelector(':scope > strong') && (el.textContent||'').trim()===(el.querySelector(':scope > strong').textContent||'').trim()) break;
    if(el.tagName==='UL') out.push(el);
    el=el.nextElementSibling;
  }
  return out;
}
function btn(head, kind){
  const host=head.querySelector(':scope > strong') || head;   /* strong 안에 넣어야 소제목 막대 모양이 안 깨진다 */
  let b=host.querySelector(`:scope > .mnb[data-mn="${kind}"]`);
  if(!b){ b=document.createElement('button'); b.type='button'; b.className='mnb'; b.dataset.mn=kind; host.appendChild(b); }
  return b;
}
/* ezx 가 소제목을 만날 때마다 부른다 — 단추는 글자 없이(CSS 로만) 붙여 형광펜 자리를 안 민다 */
window.__mnHead=function(head, h, box){
  const id=qidOf(box);
  if(h==='두문자'){
    const q=btn(head,'quiz'); btn(head,'edit');
    q.classList.toggle('on', QUIZ.has(id));
    const uls=mnLists(head);
    uls.forEach(ul=>ul.classList.toggle('quiz', QUIZ.has(id)));   /* ★ v283 — 묶음 여럿 */
    /* ★ v283 — 문제는 소문항 여럿(장점 4 · 단점 2)인데 두문자 묶음이 모자라면 알림 단추 */
    let sp=[]; try{ sp=window.__mnSubparts?window.__mnSubparts(rowOf(id)):[] }catch(e){globalThis.__q?.(e)}
    const miss=sp.length>=2 && uls.length<sp.length;
    let w=head.querySelector('.mnb[data-mn="fix"]');
    if(miss){ w=btn(head,'fix'); w.dataset.t=`⚠ 소문항 ${sp.length}개 중 ${uls.length}개만 — 채우기`; }
    else if(w) w.remove();
    return;
  }
  if(h==='답'){
    const has=[...box.querySelectorAll('p > strong')].some(s=>(s.textContent||'').trim()==='두문자');
    const b=head.querySelector('.mnb[data-mn="new"]');
    /* ★ v278 — «＋ 두문자 만들기» 는 답이 «여러 개를 늘어놓는» 꼴일 때만.
       계산·선정 문제의 (1)(2) 소문항 답에는 안 붙인다. */
    let spn=0; try{ spn=window.__mnSubparts?window.__mnSubparts(rowOf(id)).length:0 }catch(e){globalThis.__q?.(e)}
    if(has || (!listy(box) && spn<2)){ b && b.remove(); return; }
    btn(head,'new');
  }
};

/* 나열형 답인가 — 유형 꼬리표 «나열형» · «항목» 칸 · 답이 짧은 낱말 3개 이상 늘어놓은 꼴 */
function listy(box){
  const tags=[...box.querySelectorAll('code')].map(c=>(c.textContent||'').trim());
  if(tags.includes('나열형')) return true;
  if(tags.some(t=>/^(계산|표·선정|서술|회로·시퀀스|단답)형$/.test(t))) return false;
  if([...box.querySelectorAll('p > strong')].some(s=>(s.textContent||'').trim()==='항목')) return true;
  const ans=[...box.querySelectorAll('p.ezans')].map(p=>(p.textContent||'').replace(/^\s*>\s*/,'')).join(' , ');
  if(!ans) return false;
  const parts=ans.split(/\s*(?:,|，|、|·|\/|;|[①-⑳])\s*/).map(x=>x.trim()).filter(Boolean);
  if(parts.length<3) return false;
  const numy=parts.filter(x=>/\d/.test(x) || /[→=]/.test(x)).length;     /* 숫자·계산 결과가 섞이면 나열이 아님 */
  const longy=parts.filter(x=>x.length>24).length;
  return numy===0 && longy<=1;
}
/* ══ 해설 글에서 «두문자» 칸 찾기·짓기 ══
   ★ v283 — 소문항마다 묶음 여럿.  «(1) 장점» 이름 줄 → `글자` → «글 — 항목» 줄들 → (외우는 문장)
   예전 한 묶음짜리 글도 그대로 읽는다 (이름 줄 없는 한 묶음). */
const HEAD=l=>/^\s*\*\*[^*]+\*\*\s*$/.test(l);
const TAGLINE=l=>/^\s*`[^`]+`(\s+`[^`]+`)+\s*$/.test(l);
const LAB=t=>/^(?:\(\d{1,2}\)|[①-⑳])/.test(t) && !/^[-*]\s/.test(t) && t.length<=40;
const firstCh=w=>{ const m=String(w||'').replace(/^[\s\d.)(①-⑳\-]+/,'').replace(/^[^가-힣A-Za-z0-9]+/,'').match(/[가-힣A-Za-z0-9]/); return m?m[0]:''; };
function parse(md){
  const L=String(md||'').split('\n');
  const i=L.findIndex(x=>/^\s*\*\*\s*두문자\s*\*\*\s*$/.test(x));
  if(i<0) return { L, i:-1, j:-1, groups:[] };
  const groups=[]; let g=null;
  const ng=label=>{ g={ label:label||'', code:'', map:[], say:'' }; groups.push(g); return g; };
  const nextItem=k=>{ for(let n=k+1;n<L.length;n++){ const t=L[n].trim(); if(!t) continue; return /^[-*]\s+/.test(t); } return false; };
  let j=i+1;
  for(; j<L.length; j++){
    const x=L[j]; if(HEAD(x) || TAGLINE(x)) break;
    const t=x.trim(); if(!t) continue;
    const c=t.match(/^`([^`]+)`$/);
    if(c){
      /* 두문자 글자 줄은 바로 밑에 항목 줄이 온다 — 아니면 꼬리표 한 개짜리 줄 */
      if(!nextItem(j) && (g && (g.code || g.map.length))) break;
      if(!g || g.code || g.map.length) ng(g&&!g.code&&!g.map.length?g.label:'');
      g.code=c[1].trim(); continue;
    }
    if(LAB(t)){ if(g && !g.code && !g.map.length && !g.say) g.label=t; else ng(t); continue; }
    const m=t.match(/^[-*]\s+(.+?)\s+—\s+(.*)$/);
    if(m){ if(!g) ng(); g.map.push({ h:m[1].trim(), word:m[2].trim() }); continue; }
    if(/^[-*]\s+/.test(t)){ if(!g) ng(); const w=t.replace(/^[-*]\s+/,''); g.map.push({ h:firstCh(w), word:w }); continue; }
    if(!g) ng(); g.say=(g.say?g.say+' ':'')+t;
  }
  /* 빈 묶음 치우기 · 첫 줄 이름이 동떨어져 생긴 빈 묶음 합치기 */
  return { L, i, j, groups:groups.filter(x=>x.code||x.map.length||x.say) };
}
function build(groups){
  const G=groups.filter(g=>g.map.some(m=>m.word));
  if(!G.length) return [];
  const out=['**두문자**',''];
  G.forEach((g,k)=>{
    let lb=String(g.label||'').replace(/[\n`*]/g,' ').replace(/\s+/g,' ').trim();
    if(G.length>1 || lb){
      if(!lb) lb=`(${k+1})`;
      else if(!/^(?:\(\d{1,2}\)|[①-⑳])/.test(lb)) lb=`(${k+1}) ${lb}`;
      out.push(lb,'');
    }
    const map=g.map.filter(m=>m.word).map(m=>({ h:(String(m.h||'').replace(/[\s—`]/g,'')||firstCh(m.word)), word:m.word }));
    out.push('`'+map.map(m=>m.h).join('')+'`','');
    map.forEach(m=>out.push(`- ${m.h} — ${String(m.word).replace(/\n/g,' ').trim()}`));
    out.push('');
    if(g.say) out.push(String(g.say).replace(/\n/g,' ').trim(),'');
  });
  return out;
}
const plainT=t=>String(t||'').replace(/!\[[^\]]*\]\([^)]*\)|\[\[[^\]]*\]\]/g,' ').replace(/\$[^$]*\$/g,' ').replace(/[*_`#>]/g,' ');
/* 문제에서 «(1) 장점(4가지) (2) 단점(2가지)» 꼴을 읽는다 — N가지가 붙은 소문항만 */
function subparts(r){
  const q=plainT((r&&(r.q_md||r.q_text))||'').replace(/\s+/g,' ');
  const re=/(?:\((\d{1,2})\)|([①-⑳]))\s*([가-힣A-Za-z0-9·\s]{1,24}?)\s*[(（\[]?\s*(\d{1,2})\s*가지/g;
  const out=[]; let m;
  while((m=re.exec(q))){
    const n=m[1]?+m[1]:('①②③④⑤⑥⑦⑧⑨⑩'.indexOf(m[2])+1);
    const name=m[3].replace(/\s+/g,' ').replace(/(을|를|은|는|의)$/,'').trim();
    if(!out.some(x=>x.n===n)) out.push({ n, name, need:+m[4] });
  }
  return out.length>=2 ? out.sort((a,b)=>a.n-b.n) : [];
}
/* 답안 글에서 소문항 k 의 항목들 — «(k) … ① … ② …» */
function ansItems(r, sp){
  const a=plainT((r&&(r.a_md||r.a_text))||'');
  if(!a.trim()) return {};
  const pos=sp.map(p=>{ const re=new RegExp('\\(\\s*'+p.n+'\\s*\\)'); const m=a.match(re); return m?{ p, at:m.index, len:m[0].length }:null; }).filter(Boolean)
    .sort((x,y)=>x.at-y.at);
  const res={};
  pos.forEach((x,k)=>{
    let seg=a.slice(x.at+x.len, k+1<pos.length?pos[k+1].at:a.length);
    if(x.p.name) seg=seg.replace(new RegExp('^\\s*'+x.p.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),'');
    let parts=seg.split(/[①-⑳]/).slice(1);
    if(parts.length<2) parts=seg.split(/\n|\s-\s|·|,|;/);
    parts=parts.map(t=>t.replace(/\s+/g,' ').replace(/^[\s:·\-]+|[\s.。]+$/g,'').replace(/\((?:그\s*외|기타)\)$/,'').trim())
      .filter(t=>t.length>=2 && t.length<=40);
    if(parts.length) res[x.p.n]=parts.slice(0,12);
  });
  return res;
}
/* «항목» 칸 이름들 — v283 워커는 앞에 (1)(2) 를 붙여 준다 */
function itemWords(md){
  const L=String(md||'').split('\n'), words=[];
  const it=L.findIndex(x=>/^\s*\*\*\s*항목\s*\*\*\s*$/.test(x));
  if(it>=0) for(let k=it+1;k<L.length && !HEAD(L[k]);k++){
    const m=L[k].trim().match(/^[-*]\s+\*\*(.+?)\*\*/); if(m) words.push(m[1].trim());
  }
  return words;
}
/* 새로 만들 때 미리 채우기 */
function guess(r){
  const md=r.easy_md, sp=subparts(r);
  const words=itemWords(md);
  if(sp.length){
    const A=ansItems(r, sp);
    return sp.map(p=>{
      let ws=words.filter(w=>new RegExp('^\\(\\s*'+p.n+'\\s*\\)').test(w)).map(w=>w.replace(/^\(\s*\d+\s*\)\s*/,''));
      if(!ws.length) ws=A[p.n]||[];
      if(!ws.length) ws=Array(p.need).fill('');
      return { label:`(${p.n}) ${p.name}`, need:p.need, code:'', map:ws.map(w=>({ h:firstCh(w), word:w })), say:'' };
    });
  }
  let ws=words;
  if(!ws.length){
    const L=String(md||'').split('\n');
    const a=L.findIndex(x=>/^\s*\*\*\s*답\s*\*\*\s*$/.test(x));
    if(a>=0){
      const txt=[]; for(let k=a+1;k<L.length && !HEAD(L[k]);k++){ const t=L[k].trim(); if(t) txt.push(t.replace(/^>\s*/,'')); }
      ws=txt.join(' , ').replace(/\$[^$]*\$/g,' ')
        .split(/\s*(?:,|，|、|·|\/|;|\(\d{1,2}\)|[①-⑳]|\b\d{1,2}[.)])\s*/).map(x=>x.trim()).filter(x=>x.length>=1 && x.length<=30);
    }
  }
  return [{ label:'', code:'', map:ws.slice(0,12).map(w=>({ h:firstCh(w), word:w })), say:'' }];
}
/* 있는 두문자가 한 묶음인데 문제는 소문항 여럿 → 소문항대로 나눔. 있던 항목은 가지 수가 맞는 소문항으로 */
function splitBy(r, groups){
  const sp=subparts(r);
  if(sp.length<2 || groups.length>=sp.length) return null;
  const fresh=guess(r);
  const used=new Set();
  groups.forEach(g=>{
    let k=fresh.findIndex((f,x)=>!used.has(x) && g.label && f.label.startsWith(g.label.slice(0,3)));
    if(k<0) k=fresh.findIndex((f,x)=>!used.has(x) && f.need===g.map.length);
    if(k<0) k=fresh.findIndex((f,x)=>!used.has(x));
    if(k<0) return;
    used.add(k);
    fresh[k]={ ...fresh[k], map:g.map.slice(), say:g.say||'' };
  });
  return fresh;
}

/* ══ 고치는 창 ══ */
let POP=null, CUR=null;
function pop(){
  if(POP) return POP;
  POP=document.createElement('div'); POP.className='mnpop'; POP.setAttribute('role','dialog'); POP.setAttribute('aria-label','두문자');
  document.body.appendChild(POP);
  POP.addEventListener('click', e=>{
    if(e.target===POP || e.target.closest('[data-x]')) return close();
    if(e.target.closest('[data-ok]')) return save(false);
    if(e.target.closest('[data-del]')){ if(confirm('이 문항의 두문자 칸을 통째로 지울까요?')) save(true); return; }
    const t=e.target.closest('[data-act]'); if(!t) return;
    collect();
    const g=+t.dataset.g, k=+t.dataset.k, a=t.dataset.act;
    if(a==='addrow'){ CUR.groups[g].map.push({ h:'', word:'' }); paint(); focusRow(g, CUR.groups[g].map.length-1); }
    if(a==='delrow'){ CUR.groups[g].map.splice(k,1); paint(); }
    if(a==='up' && k>0){ const m=CUR.groups[g].map; [m[k-1],m[k]]=[m[k],m[k-1]]; paint(); }
    if(a==='addgrp'){ const n=CUR.groups.length+1; CUR.groups.push({ label:`(${n}) `, map:[{h:'',word:''},{h:'',word:''}], say:'' }); paint(); POP.querySelector(`[data-lab="${n-1}"]`)?.focus(); }
    if(a==='delgrp'){ if(CUR.groups.length<=1) return; if(CUR.groups[g].map.some(m=>m.word) && !confirm('이 묶음을 지울까요?')) return; CUR.groups.splice(g,1); paint(); }
    if(a==='split'){ const s=splitBy(rowOf(CUR.id), CUR.groups); if(s){ CUR.groups=s; CUR.note='문제의 소문항대로 나눴습니다 — 비어 있는 칸을 채우고 저장'; paint(); } }
    if(a==='fromans'){ const r=rowOf(CUR.id), sp=subparts(r), A=ansItems(r, sp); const p=sp[g]; const ws=p&&A[p.n];
      if(ws&&ws.length){ CUR.groups[g].map=ws.map(w=>({ h:firstCh(w), word:w })); paint(); } else { CUR.note='답안 글에서 이 소문항 항목을 못 찾았습니다 (답안이 그림뿐일 수 있음)'; paint(); } }
  });
  POP.addEventListener('keydown', e=>{
    e.stopPropagation();
    if(e.key==='Escape'){ e.preventDefault(); close(); return; }
    if(e.key!=='Enter' || e.isComposing || e.target.tagName!=='INPUT') return;
    e.preventDefault();
    const w=e.target.dataset.w;
    if(w!=null && !(e.ctrlKey||e.metaKey)){
      /* 항목 칸에서 Enter — 다음 줄로, 마지막 줄이면 한 줄 더 */
      const [g,k]=w.split(':').map(Number);
      collect();
      if(k===CUR.groups[g].map.length-1 && CUR.groups[g].map[k].word){ CUR.groups[g].map.push({ h:'', word:'' }); paint(); }
      focusRow(g, k+1);
      return;
    }
    save(false);
  });
  POP.addEventListener('input', e=>{
    const w=e.target.dataset.w; if(w==null) return;
    /* 앞 글자 칸을 손대지 않았으면 항목 첫 글자를 따라간다 */
    const h=POP.querySelector(`[data-h="${w}"]`); if(h && !h.dataset.own){ h.value=firstCh(e.target.value); }
    codePrev(+w.split(':')[0]);
  });
  POP.addEventListener('input', e=>{ if(e.target.dataset.h!=null){ e.target.dataset.own=e.target.value?'1':''; codePrev(+e.target.dataset.h.split(':')[0]); } });
  return POP;
}
function focusRow(g,k){ setTimeout(()=>POP.querySelector(`[data-w="${g}:${k}"]`)?.focus(),10); }
function collect(){
  if(!CUR) return;
  CUR.groups.forEach((g,gi)=>{
    const lb=POP.querySelector(`[data-lab="${gi}"]`); if(lb) g.label=lb.value;
    const sy=POP.querySelector(`[data-say="${gi}"]`); if(sy) g.say=sy.value;
    g.map=g.map.map((m,k)=>({
      h:(POP.querySelector(`[data-h="${gi}:${k}"]`)?.value ?? m.h)||'',
      own:POP.querySelector(`[data-h="${gi}:${k}"]`)?.dataset.own || m.own || '',
      word:POP.querySelector(`[data-w="${gi}:${k}"]`)?.value ?? m.word }));
  });
}
function codePrev(gi){
  const el=POP.querySelector(`[data-code="${gi}"]`); if(!el) return;
  const hs=[...POP.querySelectorAll(`[data-h^="${gi}:"]`)].map(i=>i.value.trim()||'·');
  el.textContent=hs.join('')||'—';
  const g=CUR.groups[gi], n=[...POP.querySelectorAll(`[data-w^="${gi}:"]`)].filter(i=>i.value.trim()).length;
  const nd=POP.querySelector(`[data-need="${gi}"]`);
  if(nd && g.need){ nd.textContent=`${n} / ${g.need}가지`; nd.className='need'+(n===g.need?' ok':n>g.need?' over':' short'); }
}
function paint(){
  const r=rowOf(CUR.id), sp=subparts(r);
  sp.forEach((p,k)=>{ const g=CUR.groups[k]; if(g && !g.need && g.label && g.label.startsWith(`(${p.n})`)) g.need=p.need; });
  const splitAsk = sp.length>=2 && CUR.groups.length<sp.length;
  const G=CUR.groups.map((g,gi)=>`<div class="grp">
      <div class="gh"><input class="lab" data-lab="${gi}" value="${esc(g.label||'')}" placeholder="${CUR.groups.length>1?`(${gi+1}) 소문항 이름 (예: 장점)`:'소문항 이름 (한 묶음이면 비워도 됨)'}" autocomplete="off">
        ${g.need?`<span class="need" data-need="${gi}"></span>`:''}
        ${CUR.groups.length>1?`<button type="button" class="ic" data-act="delgrp" data-g="${gi}" title="이 묶음 지우기">🗑</button>`:''}</div>
      <div class="code"><span data-code="${gi}"></span>${sp[gi]?`<button type="button" class="lk" data-act="fromans" data-g="${gi}" title="답안 글에서 이 소문항 항목을 다시 불러옴">답안에서 불러오기</button>`:''}</div>
      <div class="rows">${g.map.map((m,k)=>`<div class="row">
          <input class="h" data-h="${gi}:${k}" value="${esc(m.h||'')}" maxlength="3" ${m.own?'data-own="1"':''} title="외울 글자 — 비우면 항목 첫 글자" autocomplete="off">
          <input data-w="${gi}:${k}" value="${esc(m.word||'')}" placeholder="항목 ${k+1}" autocomplete="off">
          <button type="button" class="ic" data-act="up" data-g="${gi}" data-k="${k}" title="위로"${k?'':' disabled'}>↑</button>
          <button type="button" class="ic del" data-act="delrow" data-g="${gi}" data-k="${k}" title="이 항목 빼기">✕</button></div>`).join('')}</div>
      <button type="button" class="add" data-act="addrow" data-g="${gi}">＋ 항목 추가</button>
      <input class="say" data-say="${gi}" value="${esc(g.say||'')}" placeholder="외우는 문장 (없어도 됨)" autocomplete="off">
    </div>`).join('');
  const r0=rowOf(CUR.id);
  pop().innerHTML=`<div class="card">
    <div class="hd"><b>🧠 두문자</b><span style="color:#64748b;font-size:11px">${esc(`${r0.year}-${r0.session} ${r0.no}번`)}</span><button type="button" class="x" data-x aria-label="닫기">✕</button></div>
    ${splitAsk?`<div class="warn">문제는 소문항 ${sp.length}개 (${sp.map(p=>`${esc(p.name)} ${p.need}가지`).join(' · ')}) — 두문자는 ${CUR.groups.length}묶음뿐
      <button type="button" data-act="split">소문항대로 나누기</button></div>`:''}
    ${CUR.note?`<div class="note">${esc(CUR.note)}</div>`:''}
    <div class="grps">${G}</div>
    <button type="button" class="addg" data-act="addgrp">＋ 소문항 묶음 추가</button>
    <div class="msg" id="mnMsg"></div>
    <div class="ft">${CUR.had?'<button type="button" class="del" data-del>두문자 지우기</button>':''}
      <button type="button" data-x>취소</button><button type="button" class="ok" data-ok>저장</button></div>
  </div>`;
  CUR.note='';
  CUR.groups.forEach((_,gi)=>codePrev(gi));
}
function open(id){
  const r=rowOf(id); if(!r) return say('문항을 찾지 못했습니다');
  const P=parse(r.easy_md);
  let groups = P.groups.length ? P.groups.map(g=>({ label:g.label, map:g.map.map(m=>({ ...m, own:(m.h && m.h!==firstCh(m.word))?'1':'' })), say:g.say })) : guess(r);
  let note='';
  /* ★ v283 — 한 묶음만 있고 문제는 소문항 여럿이면 바로 나눠서 보여 줌 */
  if(P.groups.length){ const s=splitBy(r, groups); if(s){ groups=s; note='문제의 소문항대로 나눠 두었습니다 — 비어 있는 칸을 채우고 저장'; } }
  if(!groups.length) groups=[{ label:'', map:[{h:'',word:''}], say:'' }];
  CUR={ id:String(id), had:P.i>=0, groups, note };
  paint();
  POP.classList.add('on');
  setTimeout(()=>POP.querySelector('[data-w]')?.focus(),30);
}
function close(){ POP && POP.classList.remove('on'); CUR=null; }
async function save(remove){
  if(!CUR) return;
  const r=rowOf(CUR.id); if(!r) return close();
  collect();
  const msg=$('#mnMsg',POP);
  const groups=CUR.groups.map(g=>({ ...g, map:g.map.filter(m=>String(m.word||'').trim()).map(m=>({ h:String(m.h||'').trim(), word:String(m.word).trim() })) }))
    .filter(g=>g.map.length);
  if(!remove && !groups.length){ msg.textContent='항목을 하나 이상 쓰세요'; return; }
  const P=parse(r.easy_md), L=P.L.slice();
  const block = remove ? [] : build(groups);
  if(P.i>=0) L.splice(P.i, P.j-P.i, ...block);
  else if(!remove){
    /* 답 칸 바로 다음 소제목 앞에 — 없으면 꼬리표 줄 앞, 그것도 없으면 맨 끝 */
    const a=L.findIndex(x=>/^\s*\*\*\s*답\s*\*\*\s*$/.test(x));
    let at=-1;
    if(a>=0) for(let k=a+1;k<L.length;k++){ if(HEAD(L[k])||TAGLINE(L[k])){ at=k; break; } }
    if(at<0){ const t=L.findIndex(TAGLINE); at=t>=0?t:L.length; }
    L.splice(at, 0, ...block);
  }
  const md=L.join('\n').replace(/\n{3,}/g,'\n\n').trim();
  const c=client();
  if(!c){ msg.textContent='Supabase 에 닿지 못했습니다'; return; }
  const okb=$('[data-ok]',POP); if(okb) okb.disabled=true;
  try{
    const up=await c.from('practicals').update({ easy_md:md }).eq('id', r.id);
    if(up.error) throw new Error(up.error.message);
    r.easy_md=md;
    try{ cacheSaveRows() }catch(e){globalThis.__q?.(e)}
    close();
    const codes=groups.map(g=>g.map.map(m=>m.h||firstCh(m.word)).join('')).join(' · ');
    say(remove ? '두문자를 지웠습니다' : `🧠 두문자 «${codes}» 저장했습니다`);
    try{ if(typeof ovDraw==='function' && $('#ovl')?.classList.contains('on')) ovDraw(); }catch(e){globalThis.__q?.(e)}
    try{ (window.__pracRedraw||window.drawList)?.() }catch(e){globalThis.__q?.(e)}
  }catch(e){
    msg.textContent='저장 실패 — '+(e.message||e);
    if(okb) okb.disabled=false;
  }
}
window.__mnSubparts=subparts;

document.addEventListener('click', e=>{
  const b=e.target.closest && e.target.closest('.mnb');
  if(b){
    e.preventDefault(); e.stopPropagation();
    const id=qidOf(b); if(!id) return;
    if(b.dataset.mn==='quiz'){
      QUIZ.has(id) ? QUIZ.delete(id) : QUIZ.add(id);
      const on=QUIZ.has(id); b.classList.toggle('on', on);
      mnLists(b.closest('p')).forEach(ul=>{ ul.classList.toggle('quiz', on); $$(':scope > li.show', ul).forEach(li=>li.classList.remove('show')); });
      return;
    }
    return open(id);
  }
  const li=e.target.closest && e.target.closest('ul.mnm.quiz > li');
  if(li){ e.preventDefault(); e.stopPropagation(); li.classList.toggle('show'); }
}, true);
window.__mnOpen=open;
})();
