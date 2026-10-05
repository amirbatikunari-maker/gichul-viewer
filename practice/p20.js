/* practice.html 에서 분리 (v341) — 원래 11307번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rowOf = id => (typeof ROWS!=='undefined'?ROWS:[]).find(x=>String(x.id)===String(id));

/* ══ ① «@l,t,w,h» 가 붙은 붙인그림 표기를 알아본다 ══
   v98 의 크기 표기 뒤에 자른 자리를 덧붙인다. 빈칸이 들어가므로
   기본 마크다운 파서는 이 표기를 지나치고, 여기서 우리가 받는다. */
const CROPRE=/!\[([^\]\n]*)\]\(\s*([^)\s]+)\s*(?:=\s*(\d{1,3})\s*%)?\s*@\s*([\d.]+),([\d.]+),([\d.]+),([\d.]+)\s*\)/g;
const cropped = h => String(h==null?'':h).replace(CROPRE,(m,a,u,p,l,t,w,hh)=>
  `<img class="mdimg cropped" src="${u}" alt="${a.replace(/"/g,'')}" `
  + (p?`style="width:${clamp(+p,5,100)}%" `:'')
  + `data-crop="${l},${t},${w},${hh}" loading="lazy">`);

/* ★ 답안에 «0.36 [\\Omega]» 이 빨갛게 뜨던 것 —
   수식 밖에 라텍스 명령이 그대로 남으면 그리는 쪽이 «못 읽겠다» 며 빨갛게 뱉는다.
   글을 고치는 것이 아니라 그리기 직전에 글자로 바꿔 준다. */
const TEXCMD={ '\\Omega':'Ω','\\omega':'ω','\\Delta':'Δ','\\delta':'δ','\\times':'×',
  '\\div':'÷','\\pi':'π','\\theta':'θ','\\phi':'φ','\\alpha':'α','\\beta':'β',
  '\\mu':'μ','\\eta':'η','\\lambda':'λ','\\sim':'~','\\approx':'≈','\\le':'≤','\\ge':'≥',
  '\\cdot':'·','\\pm':'±','\\sqrt':'√','\\%':'%' };
function fixTex(md){
  /* ★ v265 — «$$…$$» 를 «$$» 두 개로 잘못 읽어 가운데 식을 통째로 수식 밖으로 여겼다.
     그래서 \sqrt[3]{…} 가 √[3]{…} 로 바뀌어 세제곱근이 «√[3]» 으로 깨졌다.
     $$…$$ · \[…\] · \(…\) 를 먼저 잡아 통째로 건너뛴다. */
  return String(md==null?'':md).replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$]*\$)|(\\[A-Za-z]+)/g,(m,math,cmd)=>{
    if(math) return math;                     /* 수식 «안» 은 건드리지 않는다 */
    return TEXCMD[cmd]!=null ? TEXCMD[cmd] : cmd;
  });
}
['mdLite','mdRich'].forEach(n=>{
  const fn=window[n];
  if(typeof fn!=='function'||fn.__crop) return;
  const w=function(md){ return cropped(fn(fixTex(md))) };
  w.__crop=1; w.__sz=fn.__sz; w.__img=fn.__img; w.__tex=fn.__tex; w.__sci=fn.__sci;
  window[n]=w;
});

/* ══ ② 붙인그림을 보이는 자리만 남긴다 ══
   테두리를 잘라 내고, 잘려 나간 만큼 자리도 줄인다(음수 여백).
   그림이 다시 그려지거나 폭이 바뀌면 다시 잰다. */
const RO = new ResizeObserver(es=>es.forEach(e=>paintOne(e.target)));
function boxOf(im){
  const v=(im.dataset.crop||'').split(',').map(Number);
  return v.length===4&&v.every(n=>!isNaN(n)) ? {l:v[0],t:v[1],w:v[2],h:v[3]} : null;
}
function paintOne(im){
  const b=boxOf(im);
  /* ★ 그리는 일은 v134 의 한 곳으로 모았다.
     예전에는 여기서 낱줄 margin·width 를 덮어써서 «여백 자르기» 의 셈을
     통째로 날려 버렸다 — 그림이 옆으로 밀려 다 잘려 보이던 까닭이다. */
  if(!b){ im.classList.remove('cropped'); }
  else   { im.classList.add('cropped'); }
  if(window.__cropPaint) return window.__cropPaint(im, b);
  /* v134 가 아직 안 실려 있으면 아무것도 안 한다 — 어설피 그리면 더 어긋난다 */
}
function paintAllCrops(root){
  $$('img[data-crop]',root||document).forEach(im=>{
    if(!im.__cro){ im.__cro=1; RO.observe(im); im.addEventListener('load',()=>paintOne(im)); }
    paintOne(im);
  });
}

/* ══ ③ 글에 자른 자리를 적어 넣는다 ══ */
function writeImgCrop(md,url,box){
  const q=url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp('!\\[([^\\]\\n]*)\\]\\(\\s*'+q+'\\s*(?:=\\s*(\\d{1,3})\\s*%)?\\s*(?:@[\\d.,\\s]+)?\\s*\\)','g');
  return String(md||'').replace(re,(m,a,p)=>{
    const sz=p?` =${p}%`:'';
    const cr=box?` @${[box.l,box.t,box.w,box.h].map(v=>+v.toFixed(4)).join(',')}`:'';
    return `![${a}](${url}${sz}${cr})`;
  });
}
const nums=s=>String(s||'').split(',').map(v=>parseFloat(v)).filter(v=>!isNaN(v));
const sameBox=(a,b)=>{ const x=nums(a),y=nums(b);
  return x.length===4&&y.length===4&&x.every((v,i)=>Math.abs(v-y[i])<0.002) };
/* 오려 온 그림 — 원본 좌표계에서 다시 잡는다 */
function writeFigCrop(md,oldKey,next){
  return String(md||'').replace(/\[\[\s*그림\s*([0-9.,\s]*?)(\s*=\s*\d{1,3}\s*%)?\s*\]\]/g,(m,c,sz)=>{
    if(!sameBox(c,oldKey)) return m;
    return `[[그림 ${next.map(v=>+v.toFixed(3)).join(',')}${sz?sz.replace(/\s+/g,''):''}]]`;
  });
}

/* ══ ④ 어느 글의 그림인가 (v98 과 같은 규칙) ══ */
function fieldOf(el){
  if(el.closest('.easybox')||el.closest('.ez')) return 'easy_md';
  if(el.closest('#ovl')){
    if(el.closest('#ovLeft')) return 'q_md';
    const seg=el.closest('.seg');
    return seg&&seg.dataset.seg==='a' ? 'a_md' : 'q_md';
  }
  const q=el.closest('[data-qmd]');
  if(q) return q.getAttribute('data-qmd')==='a' ? 'a_md' : 'q_md';
  return null;
}
function idOf(el){
  const c=el.closest('.pcard');
  if(c) return c.dataset.id;
  if(el.closest('#ovl')&&typeof OVID!=='undefined') return OVID;
  return null;
}

/* ══ ⑤ 자르기 판 ══ */
let OV=null, BAR=null, CUR=null, BOX={l:.05,t:.05,w:.9,h:.9};
function build(){
  if(OV) return;
  OV=document.createElement('div'); OV.className='cropov';
  OV.innerHTML=`<div class="cropbox"><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div>`;
  BAR=document.createElement('div'); BAR.className='cropbar';
  BAR.innerHTML=`<span class="t">자르기</span>
    <button type="button" class="go" data-ok>✂ 이대로 자르기</button>
    <button type="button" data-reset>원래대로</button>
    <button type="button" data-cancel>취소</button>`;
  document.body.append(OV,BAR);

  BAR.querySelector('[data-cancel]').onclick=stop;
  BAR.querySelector('[data-reset]').onclick=()=>apply(null);
  BAR.querySelector('[data-ok]').onclick=()=>apply(BOX);

  /* 끌어서 옮기고, 모서리를 잡아 늘린다 */
  let drag=null;
  OV.addEventListener('pointerdown',e=>{
    const h=e.target.closest('i[data-h]');
    const inBox=e.target.closest('.cropbox');
    if(!h&&!inBox) return;
    e.preventDefault();
    OV.setPointerCapture?.(e.pointerId);
    drag={ h:h?h.dataset.h:null, x:e.clientX, y:e.clientY, b:{...BOX} };
  });
  OV.addEventListener('pointermove',e=>{
    if(!drag||!CUR) return;
    e.preventDefault();
    const r=CUR.im.getBoundingClientRect();
    const dx=(e.clientX-drag.x)/r.width, dy=(e.clientY-drag.y)/r.height;
    const b={...drag.b};
    const MIN=.05;
    if(!drag.h){
      b.l=clamp(b.l+dx,0,1-b.w); b.t=clamp(b.t+dy,0,1-b.h);
    }else{
      if(drag.h.includes('w')){ const nl=clamp(b.l+dx,0,b.l+b.w-MIN); b.w=b.w+(b.l-nl); b.l=nl; }
      if(drag.h.includes('e')){ b.w=clamp(b.w+dx,MIN,1-b.l); }
      if(drag.h.includes('n')){ const nt=clamp(b.t+dy,0,b.t+b.h-MIN); b.h=b.h+(b.t-nt); b.t=nt; }
      if(drag.h.includes('s')){ b.h=clamp(b.h+dy,MIN,1-b.t); }
    }
    BOX=b; place();
  });
  ['pointerup','pointercancel'].forEach(t=>OV.addEventListener(t,()=>{drag=null}));
}
function place(){
  if(!CUR||!CUR.im.isConnected) return stop();
  const r=CUR.im.getBoundingClientRect();
  OV.style.left=r.left+'px'; OV.style.top=r.top+'px';
  OV.style.width=r.width+'px'; OV.style.height=r.height+'px';
  const bx=OV.querySelector('.cropbox');
  bx.style.left=(BOX.l*r.width)+'px';   bx.style.top=(BOX.t*r.height)+'px';
  bx.style.width=(BOX.w*r.width)+'px';  bx.style.height=(BOX.h*r.height)+'px';
  const bw=BAR.offsetWidth||300, bh=BAR.offsetHeight||46;
  let top=r.bottom+10; if(top+bh>innerHeight-8) top=Math.max(8,r.top-bh-10);
  BAR.style.top=Math.round(top)+'px';
  BAR.style.left=Math.round(clamp(r.left+r.width/2-bw/2,8,innerWidth-bw-8))+'px';
}
function start(im){
  build();
  const f=im.closest('figure[data-fig]');
  CUR={ im, id:idOf(im), field:fieldOf(im),
        kind:f?'fig':'img', key:f?(f.dataset.fig||''):(im.getAttribute('src')||''), fig:f };
  /* 이미 잘라 둔 그림이면 그 자리를 그대로 보여 준다.
     오려 온 그림은 «이미 잘린 것» 이 화면에 있으므로 늘 전체에서 시작한다. */
  const b=boxOf(im);
  BOX = (CUR.kind==='img'&&b) ? {...b} : {l:.05,t:.05,w:.9,h:.9};
  /* ★ 네모를 그리기 전에 «온전한 그림» 을 드러낸다.
     여백 자르기 창이 씌워져 있으면 눈에 보이는 것과 그림의 실제 자리가 어긋나서,
     고른 데와 잘리는 데가 서로 다른 곳이 된다. */
  window.__cropUntrim && window.__cropUntrim(im);
  window.__cropPaint  && window.__cropPaint(im, null);
  window.__cropUntrim && window.__cropUntrim(im);
  OV.classList.add('on'); BAR.classList.add('on');
  place();
  requestAnimationFrame(()=>{ if(CUR) place() });     /* 창을 끄면 크기가 바뀐다 */
  setTimeout(()=>{ if(CUR) place() }, 120);
}
function stop(){
  if(CUR&&CUR.kind==='img') paintOne(CUR.im);
  if(CUR&&CUR.kind==='raw') try{ window.__rawFixPaint&&window.__rawFixPaint() }catch(e){globalThis.__q?.(e)}
  CUR=null;
  OV?.classList.remove('on'); BAR?.classList.remove('on');
}

/* ── 원본 그림(글자로 안 바뀐 것)도 같은 판으로 자른다 ──
   적어 넣을 글이 없으므로 이 기기에 남긴다(v111 이 들고 있는 자루). */
window.__rawCropStart=function(im,key){
  build();
  CUR={ im, id:null, field:null, kind:'raw', key, fig:null };
  let cur=null;
  try{ cur=(window.__rawFix&&window.__rawFix()[key]||{}).c }catch(e){globalThis.__q?.(e)}
  BOX = Array.isArray(cur) ? {l:cur[0],t:cur[1],w:cur[2],h:cur[3]} : {l:.05,t:.05,w:.9,h:.9};
  /* 잘라 둔 것을 잠시 풀어야 «원본 위에» 네모를 그릴 수 있다.
     여백 자르기 창도 같이 끈다 — 안 그러면 보이는 자리와 고르는 자리가 어긋난다. */
  window.__cropUntrim && window.__cropUntrim(im);
  window.__cropPaint  && window.__cropPaint(im, null);
  window.__cropUntrim && window.__cropUntrim(im);
  im.style.removeProperty('clip-path'); im.style.removeProperty('margin');
  OV.classList.add('on'); BAR.classList.add('on');
  place();
  requestAnimationFrame(()=>{ if(CUR) place() });
  setTimeout(()=>{ if(CUR) place() }, 120);
};

async function apply(box){
  if(!CUR) return;
  const { im, id, field, kind, key, fig } = CUR;
  if(kind==='raw'){
    try{
      const bag=window.__rawFix?window.__rawFix():null;
      if(bag){
        if(box) bag[key]=Object.assign({},bag[key],{c:[+box.l.toFixed(4),+box.t.toFixed(4),+box.w.toFixed(4),+box.h.toFixed(4)]});
        else if(bag[key]) delete bag[key].c;
        if(bag[key]&&!bag[key].w&&!bag[key].c) delete bag[key];
        localStorage.setItem('prac:imgfix:v1',JSON.stringify(bag));
      }
      window.__rawFixPaint&&window.__rawFixPaint();
    }catch(e){globalThis.__q?.(e)}
    stop(); return;
  }
  if(kind==='img'){
    if(box){ im.dataset.crop=[box.l,box.t,box.w,box.h].map(v=>+v.toFixed(4)).join(','); }
    else delete im.dataset.crop;
    paintOne(im);
    save(id, field, md => writeImgCrop(md, key, box));
    stop(); return;
  }
  /* 오려 온 그림 — 지금 네모를 원본 좌표로 옮긴다 */
  const o=nums(key);
  if(o.length!==4){ stop(); return }
  const x0=Math.min(o[0],o[2]), y0=Math.min(o[1],o[3]);
  const W=Math.abs(o[2]-o[0]), H=Math.abs(o[3]-o[1]);
  const next = box
    ? [x0+box.l*W, y0+box.t*H, x0+(box.l+box.w)*W, y0+(box.t+box.h)*H]
    : null;
  if(!next){ stop(); return }                     /* 오려 온 그림은 «원래대로» 가 없다 */
  save(id, field, md => writeFigCrop(md, key, next));
  /* 화면에도 바로 — figFill 이 다시 오려 준다 */
  if(fig){
    fig.dataset.fig = next.map(v=>+v.toFixed(3)).join(',');
    delete fig.dataset.done;
    const wait=document.createElement('span'); wait.className='figwait'; wait.textContent='오려 내는 중…';
    im.replaceWith(wait);
    const r=rowOf(id);
    try{ await figFill(fig.parentElement||fig, field==='a_md'?r.a_url:r.q_url); }catch(e){globalThis.__q?.(e)}
  }
  stop();
}

let CHAIN=Promise.resolve();
function save(id, field, fn){
  if(!id||!field) return;
  CHAIN=CHAIN.then(async()=>{
    const r=rowOf(id); if(!r) return;
    const next=fn(r[field]);
    if(next===r[field]) return;
    try{
      const up=await sb.from('practicals').update({ [field]: next }).eq('id', r.id);
      if(up.error) throw up.error;
      r[field]=next;
    }catch(e){ try{ log('자른 자리를 남기지 못했습니다 — '+(e.message||e)) }catch(_){globalThis.__q?.(_)} }
  });
}

/* ══ ⑥ 크기 막대에 «✂ 자르기» 를 끼운다 ══ */
function inject(){
  const bar=$('.imsz'); if(!bar||$('[data-crop-btn]',bar)) return;
  const b=document.createElement('button');
  b.type='button'; b.dataset.cropBtn=''; b.textContent='✂ 자르기';
  b.title='그림에서 볼 자리만 남깁니다';
  bar.insertBefore(b, bar.querySelector('[data-x]'));
  b.addEventListener('click',e=>{
    e.preventDefault(); e.stopPropagation();
    const im=$('.mdimg.sel, .qmd figure img.sel');
    if(!im) return;
    bar.classList.remove('on');
    start(im);
  });
}
/* ★ 예전엔 30초만 지켜보다 그만뒀다 — 그런데 크기 막대(.imsz) 자체가 «그림을
   처음 누를 때» 에야 생긴다. 페이지를 열고 30초 안에 그림을 안 누르면(둘러보다
   나중에 «고치기» 눌러 그림을 고르는 건 아주 흔하다) 그 뒤로는 영영 «자르기»
   단추가 안 끼워졌다. 계속 지켜본다 — 검사 자체가 가벼워서 계속 돌아도 괜찮다. */
setInterval(inject,900); inject();

addEventListener('scroll',()=>{ if(CUR) place() },true);
addEventListener('resize',()=>{ if(CUR) place() });
addEventListener('keydown',e=>{ if(e.key==='Escape'&&CUR){ e.preventDefault(); e.stopPropagation(); stop(); } },true);

paintAllCrops();
['#list','#ovl'].forEach(sel=>{
  const wait=setInterval(()=>{
    const n=document.querySelector(sel); if(!n) return;
    clearInterval(wait);
    new MutationObserver(()=>setTimeout(()=>paintAllCrops(n),30)).observe(n,{childList:true,subtree:true});
    paintAllCrops(n);
  },250);
  setTimeout(()=>clearInterval(wait),20000);
});
setInterval(()=>paintAllCrops(),3000);
})();
