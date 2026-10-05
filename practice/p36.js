/* practice.html 에서 분리 (v341) — 원래 15833번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

/* ══ 화면(HTML) → 마크다운 ══ */
const esc0 = t => String(t==null?'':t);

/* 수식 덩어리에서 원래 TeX 를 꺼낸다 */
function texOf(el){
  const a=el.querySelector('annotation[encoding="application/x-tex"]');
  if(a) return a.textContent.trim();
  return (el.textContent||'').trim();          /* 못 찾으면 보이는 글자라도 */
}
function inline(node){
  let out='';
  node.childNodes.forEach(n=>{
    if(n.nodeType===3){ out+=n.nodeValue.replace(/\u00a0/g,' '); return; }
    if(n.nodeType!==1) return;
    const t=n.tagName;
    if(n.classList && n.classList.contains('katex-display')){
      out+='$$'+texOf(n)+'$$'; return;
    }
    if(n.classList && n.classList.contains('katex')){ out+='$'+texOf(n)+'$'; return; }
    if(t==='IMG'){
      const u=n.getAttribute('src')||'';
      const m=(n.style.width||'').match(/^(\d{1,3})%$/);
      const c=n.dataset.crop?' @'+n.dataset.crop:'';
      out+=`![${n.getAttribute('alt')||''}](${u}${m?' ='+m[1]+'%':''}${c})`;
      return;
    }
    if(t==='BR'){ out+='\n'; return; }
    if(t==='STRONG'||t==='B'){ out+='**'+inline(n)+'**'; return; }
    if(t==='CODE'){ out+='`'+inline(n)+'`'; return; }
    if(t==='EM'||t==='I'){ out+='*'+inline(n)+'*'; return; }
    out+=inline(n);
  });
  return out;
}
const cell = n => inline(n).replace(/\|/g,'\\|').replace(/\s*\n\s*/g,' ').trim();
/* 오른쪽 화면에서 준 줄 맞춤(가운데·오른쪽 정렬)을 ::c:: ::r:: 표시로 되돌린다.
   왼쪽(기본)은 표시가 필요 없다. */
const alignPre = n => {
  const a = (n.style && n.style.textAlign) || n.getAttribute?.('align') || '';
  return a==='center' ? '::c:: ' : a==='right' ? '::r:: ' : '';
};

function toMd(root){
  const out=[];
  const push = t => out.push(t);
  [...root.childNodes].forEach(n=>{
    if(n.nodeType===3){ const t=n.nodeValue.trim(); if(t){ push(t); push(''); } return; }
    if(n.nodeType!==1) return;
    const tag=n.tagName;

    if(tag==='FIGURE'){
      const box=n.dataset.fig||'';
      const w=n.dataset.w?` =${n.dataset.w}%`:'';
      const cap=n.querySelector('figcaption');
      push(`[[그림 ${box}${w}]]${cap?' '+cell(cap):''}`); push(''); return;
    }
    if(tag==='H1'||tag==='H2'||tag==='H3'||tag==='H4'||tag==='H5'||tag==='H6'){
      push(alignPre(n)+'#### '+inline(n).trim()); push(''); return;
    }
    if(tag==='UL'){ $$(':scope > li',n).forEach(li=>push('- '+inline(li).trim())); push(''); return; }
    if(tag==='OL'){ $$(':scope > li',n).forEach((li,k)=>push(`${k+1}. `+inline(li).trim())); push(''); return; }
    if(tag==='TABLE'||(tag==='DIV'&&n.classList.contains('tblwrap'))){
      const tb=tag==='TABLE'?n:n.querySelector('table'); if(!tb) return;
      const rows=$$('tr',tb);
      if(!rows.length) return;
      const head=$$('th,td',rows[0]).map(cell);
      push('| '+head.join(' | ')+' |');
      push('|'+head.map(()=>'---').join('|')+'|');
      rows.slice(1).forEach(tr=>{
        const c=$$('td,th',tr).map(cell);
        if(c.length) push('| '+c.join(' | ')+' |');
      });
      push(''); return;
    }
    if(tag==='DIV'&&n.classList.contains('katex-display')){ push('$$'+texOf(n)+'$$'); push(''); return; }
    if(tag==='DIV'&&n.classList.contains('qbox')){
      push('[[box]]');
      $$(':scope > p',n).forEach(p=>{ const x=inline(p).trim(); if(x) push(x); });
      push('[[/box]]'); push(''); return;
    }
    if(tag==='DIV'&&n.classList.contains('codeblk')){
      const head=n.querySelector(':scope > .codeblk-head');
      const lang=head ? (head.textContent||'').trim() : '';
      const code=n.querySelector('code');
      const raw=code ? (code.textContent||'') : '';
      push('```'+lang);
      raw.split('\n').forEach(x=>push(x));
      push('```'); push(''); return;
    }
    if(tag==='HR'){ push('---'); push(''); return; }
    /* 그 밖(<p> 따위)은 한 문단 — 오른쪽 화면에서 ⇔·⇥ 로 가운데·오른쪽 맞춤 했으면
       (실행취소·다시 도구가 style="text-align:…" 를 심어 둔다) 앞에 ::c:: ::r:: 을 되살린다 */
    const t=inline(n).replace(/\s+$/,'');
    if(t.trim()){ const pre=alignPre(n); t.split('\n').forEach((x,k)=>push(k===0?pre+x:x)); push(''); }
    else if(tag==='P'){
      /* 빈 문단 — 엔터를 한 번 더 쳐서 일부러 더 띄운 것으로 본다.
         (예전엔 이걸 그냥 통째로 버렸다 — 그래서 오른쪽에서 더 띄워도 저장하면 없어졌다) */
      push('');
    }
  });
  /* 빈 줄이 넷 이상 겹치는 것만 막는다 — 둘까지는(일부러 더 띄운 것일 수 있으니) 남겨 둔다 */
  return out.join('\n').replace(/\n{4,}/g,'\n\n\n').trim();
}
window.__htmlToMd = toMd;

/* ══ 고치기 창에 붙이기 ══ */
function setup(){
  const W=$('.edw'); if(!W || W.__wysi) return;
  const prev=$('#edPrev',W), ta=$('#edTa',W);
  if(!prev||!ta) return;
  W.__wysi=1;

  const tools=W.querySelector('.tools');
  if(tools && !tools.querySelector('.wysi')){
    const s=document.createElement('span');
    s.className='wysi';
    s.textContent='오른쪽 칸에 바로 써도 됩니다 — 왼쪽 글이 따라 바뀝니다';
    tools.appendChild(s);
  }

  /* 수식은 통째로만 지워지게 — 안쪽을 건드리면 형체가 깨진다 */
  function lock(){
    /* 속성으로 직접 단다 — 프로퍼티(contentEditable)는 붙지 않는 곳이 있다 */
    $$('.katex',prev).forEach(k=>{ k.setAttribute('contenteditable','false'); });
    $$('img',prev).forEach(i=>{ i.setAttribute('contenteditable','false'); });
  }

  let mine=false, t0=0;
  function pull(){                      /* 오른쪽 → 왼쪽 */
    if(prev.getAttribute('contenteditable')!=='true') return;
    const md=toMd(prev);
    if(md===ta.value) return;
    mine=true;
    ta.value=md;
    setTimeout(()=>{ mine=false; },0);
  }
  prev.addEventListener('input',()=>{ clearTimeout(t0); t0=setTimeout(pull,220); });
  prev.addEventListener('blur',pull);

  /* 왼쪽에서 고치면 오른쪽을 다시 그린다 — 그 뒤에 다시 잠근다.
     (오른쪽에서 쓰는 동안에는 다시 안 그린다. 그리면 커서가 튄다.) */
  const mo=new MutationObserver(()=>{ if(prev.getAttribute('contenteditable')!=='true') return; lock(); });
  mo.observe(prev,{childList:true,subtree:true});

  /* 창이 열릴 때마다 켠다 */
  const on=()=>{
    prev.setAttribute('contenteditable','true');
    prev.setAttribute('spellcheck','false');
    setTimeout(lock,60);
  };
  on();
  W.__wysiOn=on;

  /* 저장 직전에 오른쪽에서 고친 것을 반드시 왼쪽으로 옮긴다 —
     220ms 를 기다리는 사이에 저장을 누르면 마지막 한 글자가 빠진다 */
  const btn=$('#edSave',W);
  if(btn) btn.addEventListener('pointerdown',pull,true);
  W.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter') pull();
  },true);
}

const t=setInterval(()=>{ if($('.edw')){ setup(); } },400);
setTimeout(()=>clearInterval(t),60000);

/* 창을 열 때마다 다시 켠다 */
const h=setInterval(()=>{
  if(typeof window.__edOpen!=='function' || window.__edOpen.__wysi) return;
  clearInterval(h);
  const prev=window.__edOpen;
  const w=function(){
    const out=prev.apply(this,arguments);
    setTimeout(()=>{ setup(); const W=$('.edw'); W&&W.__wysiOn&&W.__wysiOn(); },30);
    return out;
  };
  w.__wysi=1; w.__orig=prev.__orig;
  window.__edOpen=w;
},300);
setTimeout(()=>clearInterval(h),30000);
})();
