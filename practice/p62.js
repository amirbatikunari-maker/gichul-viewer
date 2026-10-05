/* practice.html 에서 분리 (v341) — 원래 24875번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const B=document.body;
const KOFF='prac:ezx', KOPEN='prac:ezxopen';
try{
  if(localStorage.getItem(KOFF)==='0') B.classList.add('ezx-off');
  localStorage.removeItem(KOPEN);                /* ★ v275 — 펼침은 기억 안 함: 늘 접힌 채로 시작 */
}catch(e){globalThis.__q?.(e)}
let LASTQ='';

const FOLDSEC=/^(검산|흔한 실수|왜 이 답인가|같이 알아 두기)$/;
const SYMSEC=/^(부호)$/;
const BOXSEC=/^(먼저 알아야 할 것|주어진 값|문제를 이렇게 읽음|채점 포인트|쉽게 말하면|최소 답안 — 이만큼은 꼭)$/;
const ITEMSEC=/^(항목)$/;
const MNSEC=/^(두문자)$/;
const STEPSEC=/^(풀이|쓰는 식)$/;

/* 굵은 글씨 한 덩어리뿐인 문단 = 소제목 */
function headOf(el){
  if(!el || el.tagName!=='P') return '';
  const s=el.querySelector(':scope > strong'); if(!s) return '';
  const t=(el.textContent||'').trim();
  return t && t===(s.textContent||'').trim() ? t : '';
}
/* 수식만 있는 문단 */
function isEqP(p){
  if(!p || p.tagName!=='P') return false;
  const d=[...p.querySelectorAll('.katex-display')]; if(!d.length) return false;
  const sq=t=>String(t||'').replace(/\s+/g,'');
  return sq(p.textContent).length === d.reduce((n,x)=>n+sq(x.textContent).length,0);
}
function texOf(p){
  const a=p.querySelector('annotation[encoding="application/x-tex"]');
  return a ? a.textContent : (p.textContent||'');
}
/* 줄 종류 — 단위식 → 대입식 → 말로 쓴 식 → 기호식 */
function kindOf(src){
  const s=String(src||'');
  const U=/\[\s*(?:\\(?:text|mathrm)\{\s*[^{}]{1,12}\}|k?W|kVA|VA|V|A|\\Omega|Ω|Hz|kWh|m\^?\{?2\}?|mm\^?\{?2\}?|%)\s*\]/g;
  if((s.match(U)||[]).length>=2) return '단위';
  const noExp=s.replace(/10\s*\^\s*\{?\s*-?\s*\d+\s*\}?/g,' ').replace(/\\sqrt\s*\{?\s*\d\s*\}?/g,' ')
    .replace(/(^|[^\d.])(100|1000|1|2|3)(?![\d.])/g,'$1 ');      /* ★ v279 — 공식에 원래 있는 상수는 뺀다 */
  if(/\d/.test(noExp)) return '대입';
  if(/[가-힣]/.test(s)) return '말로';
  return '기호';
}
/* 글자는 그대로 두고 앞머리 «왜:» 만 감싼다 */
function wrapLead(li, re, cls){
  if(li.querySelector(':scope > .'+cls)) return;
  const n=li.firstChild; if(!n || n.nodeType!==3) return;
  const m=n.nodeValue.match(re); if(!m) return;
  const rest=n.splitText(m[0].length);
  const sp=document.createElement('span'); sp.className=cls;
  li.insertBefore(sp, rest); sp.appendChild(n);
}
/* 부호 줄 «기호 — 뜻 · 단위 · 이 문제: 값» → 세 칸 (글자 순서는 그대로) */
function splitSym(li){
  if(li.querySelector(':scope > .ezs-s')) return true;
  const kids=[...li.childNodes];
  let di=-1, dpos=-1;
  for(let i=0;i<kids.length;i++){
    if(kids[i].nodeType===3){ const p=kids[i].nodeValue.indexOf(' — '); if(p>=0){ di=i; dpos=p; break; } }
  }
  if(di<0) return false;
  let t=kids[di];
  if(dpos>0){ t=t.splitText(dpos); }
  const after=t.splitText(3);                         /* t = « — » */
  const S=document.createElement('span'); S.className='ezs-s';
  const M=document.createElement('span'); M.className='ezs-m';
  const V=document.createElement('span'); V.className='ezs-v';
  const D=document.createElement('span'); D.className='ezdash';
  li.insertBefore(S, li.firstChild);
  while(S.nextSibling && S.nextSibling!==t) S.appendChild(S.nextSibling);
  li.insertBefore(M, t); D.appendChild(t); M.appendChild(D);
  while(M.nextSibling) M.appendChild(M.nextSibling);
  /* «이 문제:» 부터는 값 칸 */
  const walk=[...M.childNodes];
  for(let i=0;i<walk.length;i++){
    const n=walk[i]; if(n.nodeType!==3) continue;
    const p=n.nodeValue.indexOf('이 문제:'); if(p<0) continue;
    let v=p>0 ? n.splitText(p) : n;
    const rest=v.splitText('이 문제:'.length);
    /* 앞에 남는 « · » 도 숨긴다 (이 문제: 를 숨기면 점만 덩그러니 남아서) */
    if(v!==n){ const mm=n.nodeValue.match(/\s*·\s*$/); if(mm){ const tail=n.splitText(n.nodeValue.length-mm[0].length);
      const hd=document.createElement('span'); hd.className='ezdash'; tail.parentNode.insertBefore(hd, tail); hd.appendChild(tail); } }
    li.appendChild(V);
    const K=document.createElement('span'); K.className='ezvk'; K.appendChild(v); V.appendChild(K);
    let x=rest; while(x){ const nx=x.nextSibling; V.appendChild(x); x=nx; }
    break;
  }
  return true;
}

function tidy(box){
  if(!box || box.closest('.edw,.prev,.mkb')) return;
  const sig=(box.textContent||'').length+':'+box.querySelectorAll('.katex').length;
  if(box.__ezxSig===sig && box.querySelector('.ezh,.eqr,.ezwhy,.ezstep,.ezans,.ezbox')) return;
  box.__ezxSig=sig;
  box.classList.add('ezx');
  let sec='';
  const kids=[...box.children];
  for(let i=0;i<kids.length;i++){
    const el=kids[i];
    const h=headOf(el);
    if(h){
      sec=h; el.classList.add('ezh');
      el.classList.toggle('mnhd', MNSEC.test(h));
      el.classList.toggle('anshd', h==='답');
      try{ window.__mnHead && window.__mnHead(el, h, box); }catch(e){globalThis.__q?.(e)}
      continue;
    }
    /* ★ v276 — 두문자 */
    if(MNSEC.test(sec)){
      if(el.tagName==='P' && el.querySelector(':scope > code') && (el.textContent||'').trim()===(el.querySelector(':scope > code').textContent||'').trim()){
        el.classList.add('mnc'); continue;
      }
      if(el.tagName==='UL'){ el.classList.add('mnm'); $$(':scope > li', el).forEach(li=>splitSym(li)); continue; }
      /* ★ v283 — «(1) 장점» 같은 묶음 이름 줄 */
      if(el.tagName==='P' && !el.querySelector(':scope > code') && /^\s*(?:\(\d{1,2}\)|[①-⑳])/.test(el.textContent||'') && (el.textContent||'').trim().length<=40){
        el.classList.add('mnlab'); el.classList.remove('mnsay'); continue; }
      if(el.tagName==='P' && !el.querySelector(':scope > code')){ el.classList.add('mnsay'); continue; }
    }
    /* 식 줄 */
    if(isEqP(el)){
      el.classList.add('eqr');
      el.dataset.k=kindOf(texOf(el));
      const pv=kids[i-1], nx=kids[i+1];
      el.classList.toggle('eqf', !(pv && isEqP(pv)));
      el.classList.toggle('eql', !(nx && isEqP(nx)));
      continue;
    }
    el.classList.remove('eqr','eqf','eql');
    /* 풀이 단계 머리줄 «1. …» */
    if(el.tagName==='P' && STEPSEC.test(sec) && /^\s*(?:\d{1,2}\s*[.)]|\(\d{1,2}\)|[①-⑳])\s*/.test(el.textContent||'')
       && (el.textContent||'').length<90){ el.classList.add('ezstep'); continue; }
    /* 답 — «> …» 줄. ★ v277 — 단계 밑 소문항 답도 같은 모양. 이어진 줄은 한 상자로 */
    if(el.tagName==='P' && /^\s*>/.test(el.textContent||'')){
      el.classList.add('ezans'); wrapLead(el, /^\s*>\s*/, 'ezgt');
      const isA=x=>x && x.tagName==='P' && /^\s*>/.test(x.textContent||'');
      el.classList.toggle('ansf', !isA(kids[i-1])); el.classList.toggle('ansl', !isA(kids[i+1]));
      continue;
    }
    el.classList.toggle('ezbox', BOXSEC.test(sec) && (el.tagName==='UL' || el.tagName==='P'));
    if(el.tagName==='UL'){
      if(ITEMSEC.test(sec)){
        el.classList.add('ezitems');
        $$(':scope > li', el).forEach(li=>{ if(!/^\s*왜\s*[:：]/.test(li.textContent||'')) splitSym(li); });
      }
      if(SYMSEC.test(sec)){
        const lis=$$(':scope > li', el); let ok=0;
        lis.forEach(li=>{ if(splitSym(li)) ok++; });
        el.classList.toggle('ezsym', ok>0 && ok>=lis.length*0.6);
      }
      $$(':scope > li', el).forEach(li=>{
        const t=(li.textContent||'').trim();
        if(/^왜\s*[:：]/.test(t)){ li.classList.add('ezwhy'); li.classList.remove('ezfc','ezf','tog'); wrapLead(li, /^\s*왜\s*[:：]\s*/, 'ezwk');
          /* ★ v334 — 둘째 줄부터 «왜:» 표 오른쪽 글 시작점에 맞춰 들여쓰기 — 표 뒤 글을 한 덩어리(ezwb)로 */
          const wk=li.querySelector(':scope > .ezwk');
          if(wk && !li.querySelector(':scope > .ezwb')){ const wb=document.createElement('span'); wb.className='ezwb';
            while(wk.nextSibling) wb.appendChild(wk.nextSibling); li.appendChild(wb); } }   /* ★ v333 — «왜» 는 짧아졌으니 접지 않고 다 보임 */
        else if(/^읽기\s*[:：]/.test(t)) li.classList.add('ezread');
        else if(FOLDSEC.test(sec) && t.length>110) li.classList.add('ezfc');
      });
      continue;
    }
    if(el.tagName==='P' && FOLDSEC.test(sec) && (el.textContent||'').length>110) el.classList.add('ezfc');
  }
  try{ keyMarks(box); }catch(e){globalThis.__q?.(e)}
  try{ $$('ul.ezsym .ezs-s', box).forEach(prSpan); }catch(e){globalThis.__q?.(e)}
  measure(box);
}
/* ★ v277 — ==핵심== → 형광펜. «==» 는 지우지 않고 숨긴다(글자 수가 그대로라 형광펜·주석 자리가 안 밀림) */
function keyMarks(box){
  const bad=n=>n.parentElement && n.parentElement.closest('.katex,.ezeq,code,script,style');
  $$('p,li', box).forEach(blk=>{
    const tc=blk.textContent||'';
    if(tc.indexOf('〖')<0 && tc.indexOf('==')<0) return;
    if(blk.querySelector('p,li')) return;                          /* 안쪽 블록이 따로 처리함 */
    const texts=()=>{ const tw=document.createTreeWalker(blk, NodeFilter.SHOW_TEXT, { acceptNode:n=>bad(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT });
      const a=[]; let n; while((n=tw.nextNode())) a.push(n); return a; };
    /* 〖 〗 (새 판) · == == (옛 판) 자리를 순서대로 모아 짝짓는다 —
       초록 낱말 칠하기가 글을 여러 조각으로 나눠 놔도 짝이 맞는다 */
    const occ=[];
    texts().forEach(n=>{
      const re=/〖|〗|==/g; let m;
      while((m=re.exec(n.nodeValue))) occ.push([n, m.index, m[0].length, m[0]]);
    });
    const pairs=[]; let open=null;
    occ.forEach(o=>{
      if(o[3]==='〖'){ open=o; return; }
      if(o[3]==='〗'){ if(open && open[3]==='〖'){ pairs.push([open,o]); open=null; } return; }
      if(open && open[3]==='=='){ pairs.push([open,o]); open=null; } else if(!open) open=o;
    });
    for(let q=pairs.length-1;q>=0;q--){
      const [[sn,si,sl],[en,ei,el]]=pairs[q];
      const hide=t=>{ const sp=document.createElement('span'); sp.className='ezeq'; t.parentNode.insertBefore(sp,t); sp.appendChild(t); return sp; };
      const eMid=en.splitText(ei); eMid.splitText(el); const eSp=hide(eMid);
      const sMid=sn.splitText(si); const sAft=sMid.splitText(sl); hide(sMid);
      let on=false; const mid=[];
      for(const t of texts()){
        if(t===sAft) on=true;
        if(on){ if(eSp.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) break; if(t.nodeValue) mid.push(t); }
      }
      mid.forEach(t=>{ const mk=document.createElement('mark'); mk.className='ezkey'; t.parentNode.insertBefore(mk,t); mk.appendChild(t); });
      /* 사이에 낀 수식(3000V 처럼 수식으로 바뀐 것)도 같이 칠한다 */
      const sEnd=sAft.previousSibling || sAft;
      $$('.katex', blk).forEach(k=>{
        if(k.parentElement && k.parentElement.closest('.katex')) return;
        const af=sEnd.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING;
        const bf=eSp.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_PRECEDING;
        if(af && bf) k.classList.add('ezkeyk');
      });
    }
  });
}
/* 부호 칸의 «브이 에스» 발음을 작은 글씨로 */
function prSpan(cell){
  if(cell.querySelector('.ezpr')) return;
  [...cell.childNodes].forEach(n=>{
    if(n.nodeType!==3) return;
    const i=n.nodeValue.indexOf('«'); if(i<0) return;
    const j=n.nodeValue.indexOf('»', i); if(j<0) return;
    let a=i>0 ? n.splitText(i) : n; const rest=a.splitText(j-i+1);
    const sp=document.createElement('span'); sp.className='ezpr'; cell.insertBefore(sp, rest); sp.appendChild(a);
  });
}
/* 실제로 두 줄을 넘는 것만 접는다 — 짧은 것에 «펼치기» 가 붙지 않게 */
function measure(box){
  $$('.ezfc', box).forEach(el=>{
    if(el.dataset.ezm==='1' || !el.offsetParent) return;
    const cs=getComputedStyle(el);
    const lh=parseFloat(cs.lineHeight) || parseFloat(cs.fontSize)*1.42 || 18;
    const was=el.classList.contains('ezf');
    el.classList.remove('ezf');
    const h=el.scrollHeight;
    const pad=(parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0);
    el.style.setProperty('--ezmh', Math.round(lh*2 + pad + 1)+'px');   /* 딱 두 줄 */
    el.classList.toggle('ezf', h > lh*2.6 + pad + 4);
    if(!was && !el.classList.contains('ezf')) el.classList.remove('tog');
    el.dataset.ezm='1';
  });
}
function boxes(){
  return [...$$('#ovl .seg[data-seg="e"] > .ez'), ...$$('#list .pcard .easybox'), ...$$('#list .pcard .ez:not(:has(.easybox))')];
}
function all(){
  /* 다른 문항으로 넘어가면 다시 접힌 상태로 */
  let q=''; try{ q=(typeof OVID!=='undefined' && OVID!=null) ? String(OVID) : '' }catch(e){globalThis.__q?.(e)}
  if(q!==LASTQ){ LASTQ=q; if(B.classList.contains('ezx-open')) B.classList.remove('ezx-open'); resetTog(); }
  boxes().forEach(b=>{ try{ tidy(b) }catch(e){globalThis.__q?.(e)} }); paintBtns();
}

/* ── 이름줄 단추 ── */
const isEzLab=lab=>String(lab.childNodes[0]?.textContent||'').trim()==='쉬운 풀이';
function paintBtns(){
  const labs=[...$$('#ovl .plab'), ...$$('#list .pcard .plabel')].filter(isEzLab);
  const off=B.classList.contains('ezx-off'), open=B.classList.contains('ezx-open');
  labs.forEach(lab=>{
    try{ kindSel(lab) }catch(e){globalThis.__q?.(e)}
    try{ gapBtns(lab) }catch(e){globalThis.__q?.(e)}
    [['open', open?'⇡ 접기':'⇣ 펼치기', open?'«왜» 설명을 모두 두 줄로 접습니다':'«왜» 설명·검산·흔한 실수를 모두 펼칩니다'],
     ['off',  off?'◫ 정리 보기':'◫ 원래대로', off?'식 상자·접기·부호 표로 정리해서 봅니다':'정리를 끄고 예전 모양 그대로 봅니다']
    ].forEach(([k,txt,tip])=>{
      let b=lab.querySelector(`:scope > .ezxb[data-ezx="${k}"]`);
      if(!b){
        b=document.createElement('button'); b.type='button'; b.className='ezxb'; b.dataset.ezx=k;
        const before=lab.querySelector(':scope > .ezsol, :scope > .ezfix, :scope > .edb');
        before ? lab.insertBefore(b, before) : lab.appendChild(b);
      }
      if(b.textContent!==txt) b.textContent=txt;
      b.title=tip;
      b.classList.toggle('on', k==='open' ? open : off);
    });
  });
}
function resetTog(){ $$('.ezx .ezf.tog').forEach(el=>el.classList.remove('tog')); }
/* ★ v279 — 식 줄 사이 간격 [+] 줄간격 [-] (기기에 기억) */
const GKEY='prac:eqgap', GMIN=0, GMAX=10;
let GAP=2; try{ const g=parseInt(localStorage.getItem(GKEY),10); if(!isNaN(g)) GAP=Math.min(GMAX,Math.max(GMIN,g)); }catch(e){globalThis.__q?.(e)}
const gapApply=()=>{ document.documentElement.style.setProperty('--eqg', (2+GAP*2)+'px'); };
gapApply();
function gapBtns(lab){
  let g=lab.querySelector(':scope > .ezgap');
  if(!g){
    g=document.createElement('span'); g.className='ezgap'; g.title='식(라텍스) 줄 사이 간격';
    g.innerHTML='<button type="button" data-gap="1" aria-label="줄간격 넓게">＋</button><span class="gl">줄간격</span><button type="button" data-gap="-1" aria-label="줄간격 좁게">−</button>';
    ['click','pointerdown','mousedown'].forEach(ev=>g.addEventListener(ev, e=>{
      e.stopPropagation();
      if(ev!=='click') return;
      const b=e.target.closest('[data-gap]'); if(!b) return;
      e.preventDefault();
      GAP=Math.min(GMAX,Math.max(GMIN,GAP+(+b.dataset.gap)));
      try{ localStorage.setItem(GKEY,String(GAP)) }catch(x){globalThis.__q?.(x)}
      gapApply(); paintGap();
      try{ remeasure() }catch(x){globalThis.__q?.(x)}
    }));
    const before=lab.querySelector(':scope > .ezsol, :scope > .ezfix, :scope > .edb');
    before ? lab.insertBefore(g, before) : lab.appendChild(g);
  }
  paintGap();
}
function paintGap(){
  $$('.ezgap').forEach(g=>{
    const up=g.querySelector('[data-gap="1"]'), dn=g.querySelector('[data-gap="-1"]');
    if(up) up.disabled=GAP>=GMAX; if(dn) dn.disabled=GAP<=GMIN;
    const l=g.querySelector('.gl'); if(l) l.title=`지금 ${2+GAP*2}px`;
  });
}
/* ★ v278 — 해설 유형 고르기. 자동(AI 가 판단)이 기본, 틀리게 잡으면 여기서 고르고 다시 뽑는다.
   문항마다 기기에 기억 — 해설 돌리기(여러 문항)도 이 값을 따른다. */
const KINDS=['자동','계산','표·선정','나열','단답','서술','회로·시퀀스'];
const KKEY='prac:ezkind';
const kindAll=()=>{ try{ return JSON.parse(localStorage.getItem(KKEY)||'{}')||{} }catch(e){ return {} } };
window.__ezKindFor=id=>{ const v=kindAll()[String(id)]; return v && v!=='자동' ? v : ''; };
function kindSel(lab){
  let s=lab.querySelector(':scope > select.ezkind');
  const id=(()=>{ const c=lab.closest('.pcard'); if(c&&c.dataset.id) return c.dataset.id; try{ return OVID!=null?String(OVID):'' }catch(e){ return '' } })();
  if(!s){
    s=document.createElement('select'); s.className='ezkind'; s.title='해설 유형 — 다음에 해설을 뽑을 때 이 틀로 씁니다 (자동 = AI 가 판단)';
    s.innerHTML=KINDS.map(k=>`<option value="${k}">${k==='자동'?'유형: 자동':'유형: '+k}</option>`).join('');
    ['click','pointerdown','mousedown'].forEach(ev=>s.addEventListener(ev, e=>e.stopPropagation()));
    s.addEventListener('change', ()=>{
      const o=kindAll(), k=s.dataset.for; if(!k) return;
      if(s.value==='자동') delete o[k]; else o[k]=s.value;
      try{ localStorage.setItem(KKEY, JSON.stringify(o)) }catch(e){globalThis.__q?.(e)}
      s.classList.toggle('set', s.value!=='자동');
      try{ (window.__pxToast||console.log)(s.value==='자동' ? '유형: 자동 — AI 가 판단합니다' : `유형: ${s.value} — «상세 Opus/Sonnet» 으로 다시 뽑으면 이 틀로 씁니다`) }catch(e){globalThis.__q?.(e)}
    });
    const before=lab.querySelector(':scope > .ezsol, :scope > .ezfix, :scope > .edb');
    before ? lab.insertBefore(s, before) : lab.appendChild(s);
  }
  if(s.dataset.for!==id){ s.dataset.for=id; }
  const v=kindAll()[id]||'자동';
  if(s.value!==v) s.value=v;
  s.classList.toggle('set', v!=='자동');
}

document.addEventListener('click', e=>{
  const b=e.target.closest && e.target.closest('.ezxb');
  if(b){
    e.preventDefault(); e.stopPropagation();
    if(b.dataset.ezx==='open'){
      const on=!B.classList.contains('ezx-open'); B.classList.toggle('ezx-open', on); resetTog();
    }else{
      const off=!B.classList.contains('ezx-off'); B.classList.toggle('ezx-off', off);
      try{ localStorage.setItem(KOFF, off?'0':'1') }catch(x){globalThis.__q?.(x)}
      if(!off){ $$('.ezx .ezfc').forEach(el=>{ el.dataset.ezm=''; }); boxes().forEach(x=>{ x.__ezxSig=''; }); all(); }
    }
    paintBtns();
    return;
  }
  if(B.classList.contains('ezx-off')) return;
  const f=e.target.closest && e.target.closest('.ezx .ezf'); if(!f) return;
  if(e.target.closest('a,button,input,textarea,select')) return;
  try{ if(String(getSelection()||'').trim()) return; }catch(x){globalThis.__q?.(x)}   /* 글을 긁는 중이면 형광펜에 양보 */
  f.classList.toggle('tog');
}, true);

/* 화면이 다시 그려지면 다시 정리 — 스스로 바꾼 것에는 서명이 같아 건너뛴다 */
let raf=0;
const soon=()=>{ if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; all(); }); };
['#ovl','#list'].forEach(sel=>{
  const w=setInterval(()=>{
    const n=document.querySelector(sel); if(!n) return; clearInterval(w);
    new MutationObserver(soon).observe(n,{ childList:true, subtree:true });
    soon();
  },300);
  setTimeout(()=>clearInterval(w), 20000);
});
/* 글자 크기(가− 가+)·창 크기가 바뀌면 접힘 여부를 다시 잰다 */
let rz=0;
const remeasure=()=>{ clearTimeout(rz); rz=setTimeout(()=>{ $$('.ezx .ezfc').forEach(el=>{ el.dataset.ezm=''; }); boxes().forEach(measure); },200); };
addEventListener('resize', remeasure);
document.addEventListener('input', e=>{ if(e.target && e.target.id==='pxFs') remeasure(); }, true);
document.addEventListener('click', e=>{ if(e.target.closest && e.target.closest('.ovfs button,[data-fs]')) remeasure(); }, false);
setInterval(all, 1500);
window.__ezxTidy=tidy;
})();
