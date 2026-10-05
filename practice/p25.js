/* practice.html 에서 분리 (v341) — 원래 13197번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const RAW='.pz .pz-stage img, .ovl .tw img, .ovl .imgbox img';

/* ── 이 기기에 남긴다 (적어 넣을 글이 없는 그림이므로) ── */
const KEY='prac:imgfix:v1';
let FIX=(()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){ return {} } })();
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(FIX)) }catch(e){globalThis.__q?.(e)} };

/* ── 어느 문항의 어느 쪽 그림인가 ── */
function keyOf(im){
  const st=im.closest('.pz-stage');
  if(st&&st.dataset.qid) return st.dataset.qid+':'+(st.dataset.mkhost||'q');
  if(im.closest('#ovl')){
    let id=null; try{ id=OVID }catch(e){globalThis.__q?.(e)}
    if(!id) return null;
    if(im.closest('#ovLeft')) return id+':q';
    const seg=im.closest('.seg');
    return id+':'+(seg&&seg.dataset.seg==='a'?'a':'q');
  }
  return null;
}

/* ── 그리기 ── */
const RO=new ResizeObserver(es=>es.forEach(e=>paint(e.target)));
/* ★ v191 — «📌 그림 고정» 이 켜져 있으면 낱장 크기(%)를 입히지 않는다.
   여태 고정이 안 먹은 진짜 까닭이 여기였다. 고정은 «글자로 바꾼» 그림(.mdimg)만
   덮고 있었고, 아직 «원본 그림» 인 문항은 이 paint() 가 매번 저장해 둔 %를
   인라인으로 다시 발라 버려서 아무 일도 안 일어난 것처럼 보였다.
   저장값(FIX) 자체는 그대로 두므로 고정을 끄면 곧바로 원래 크기로 돌아온다. */
const GFIX=()=>{ try{ return localStorage.getItem('prac:imgfix')==='1' }catch(e){ return false } };
function paint(im){
  const k=keyOf(im); const f=k?FIX[k]:null;
  const host=im.closest('.pz-stage,.tw,.imgbox');
  if(!f){
    if(window.__cropPaint) window.__cropPaint(im, null);
    im.style.removeProperty('clip-path'); im.style.removeProperty('margin');
    if(!im.dataset.rawW) im.style.removeProperty('width');
    im.classList.remove('rawfixed'); host?.classList.remove('rawfixed');
    return;
  }
  if(f.w&&f.w<100&&!GFIX()){ im.style.width=f.w+'%'; im.style.maxWidth='100%'; }
  else im.style.removeProperty('width');
  if(Array.isArray(f.c)){
    const [l,t,w,h]=f.c;
    /* ★ v134 한 곳에서 그린다 — 자리(너비·여백)를 안 건드려야
       «여백 자르기» 창과 안 싸운다 */
    if(window.__cropPaint) window.__cropPaint(im, {l,t,w,h});
    im.classList.add('rawfixed'); host?.classList.add('rawfixed');
  }else{
    im.style.removeProperty('clip-path'); im.style.removeProperty('margin');
    im.classList.remove('rawfixed'); host?.classList.remove('rawfixed');
  }
}
function paintAll(root){
  $$(RAW,root||document).forEach(im=>{
    if(!im.__rawf){ im.__rawf=1; RO.observe(im); im.addEventListener('load',()=>paint(im)); }
    paint(im);
  });
}
/* 고정 단추를 눌렀을 때 그 자리에서 바로 다시 그리게 밖으로 내준다 */
window.__rawPaintAll=paintAll;

/* ── 도구줄 ── */
/* ★ v192 — 고정 중에는 크기·자르기 손잡이가 값을 못 바꾸게 막는다.
   여태 «고정» 은 보여 줄 때만 무시하는 것이었고, 손잡이는 그대로 살아 있었다.
   그래서 실수로 슬라이더를 건드리면 저장값이 조용히 바뀌어 있다가, 고정을 푸는
   순간 «기준이 또 달라져» 있었다. 이제 잠근 동안에는 값 자체가 얼어붙는다. */
const FROZEN = () => GFIX();
let BAR=null, CUR=null;
function bar(){
  if(BAR) return BAR;
  BAR=document.createElement('div'); BAR.className='rawfix';
  BAR.innerHTML=`<span class="t">크기</span>
    <input type="range" min="15" max="100" step="1" value="100">
    <b class="v">100%</b><span class="sep"></span>
    <button type="button" data-p="50">50</button>
    <button type="button" data-p="70">70</button>
    <button type="button" data-p="100">100</button>
    <span class="sep"></span>
    <button type="button" data-crop>✂ 자르기</button>
    <button type="button" data-zoom>⤢ 확대</button>
    <button type="button" data-reset>원래대로</button>
    <button type="button" data-x>✕</button>
    <span class="note">이 그림은 아직 «글자» 로 안 바뀐 원본이라, 손질한 값은 이 기기에만 남습니다.
      어느 기기에서나 같게 하려면 «⚡ 변환» 으로 글자로 바꾼 뒤 손질하세요.</span>`;
  document.body.appendChild(BAR);
  BAR.addEventListener('pointerdown',e=>e.stopPropagation());

  const rg=BAR.querySelector('input'), vv=BAR.querySelector('.v');
  const froze=()=>{
    if(!FROZEN()) return false;
    try{ window.__pracLog && window.__pracLog('📌 그림이 고정돼 있어 크기를 바꾸지 않았습니다 — 고정을 먼저 푸세요.') }catch(e){globalThis.__q?.(e)}
    alert('📌 그림 고정이 켜져 있습니다.\n\n고정 중에는 크기·자르기를 바꿀 수 없습니다 —\n기준이 도중에 바뀌지 않게 일부러 막아 둔 것입니다.\n바꾸려면 «📌 고정됨» 을 눌러 먼저 푸세요.');
    return true;
  };
  const put=p=>{
    if(!CUR) return;
    if(froze()){ rg.value = (FIX[CUR.k]&&FIX[CUR.k].w) || 100; return; }
    vv.textContent=p+'%';
    const k=CUR.k; FIX[k]=Object.assign({},FIX[k],{w:p});
    if(p>=100) delete FIX[k].w;
    if(!FIX[k].w&&!FIX[k].c) delete FIX[k];
    save(); paint(CUR.im); place();
  };
  rg.addEventListener('input',()=>put(+rg.value));
  $$('button[data-p]',BAR).forEach(b=>b.onclick=()=>{ rg.value=b.dataset.p; put(+b.dataset.p) });
  BAR.querySelector('[data-x]').onclick=close;
  BAR.querySelector('[data-reset]').onclick=()=>{
    if(!CUR||froze()) return; delete FIX[CUR.k]; save(); paint(CUR.im); rg.value=100; vv.textContent='100%'; place();
  };
  BAR.querySelector('[data-zoom]').onclick=()=>{
    if(!CUR) return;
    CUR.im.classList.toggle('zoom');
    CUR.im.closest('.tw')?.classList.toggle('on');
    place();
  };
  BAR.querySelector('[data-crop]').onclick=()=>{ if(CUR) crop(CUR.im, CUR.k); };
  return BAR;
}
function place(){
  if(!BAR||!CUR||!CUR.im.isConnected) return close();
  const r=CUR.im.getBoundingClientRect();
  const w=BAR.offsetWidth||360, h=BAR.offsetHeight||44;
  let top=r.bottom+8; if(top+h>innerHeight-6) top=Math.max(6,r.top-h-8);
  BAR.style.top=Math.round(top)+'px';
  BAR.style.left=Math.round(clamp(r.left+r.width/2-w/2,6,innerWidth-w-6))+'px';
}
function open(im){
  const k=keyOf(im); if(!k) return;
  bar();
  CUR={im,k};
  const f=FIX[k]||{};
  BAR.querySelector('input').value=f.w||100;
  BAR.querySelector('.v').textContent=(f.w||100)+'%';
  BAR.classList.add('on'); place();
}
function close(){ BAR?.classList.remove('on'); CUR=null; }

/* ── 자르기 — v102 의 판을 그대로 빌려 쓴다 ── */
function crop(im,k){
  close();
  if(window.__rawCropStart) return window.__rawCropStart(im,k);
  alert('자르기 판을 아직 불러오지 못했습니다. 잠시 뒤 다시 눌러 주세요.');
}

/* ── 그림을 누르면 도구줄 ── */
addEventListener('click',e=>{
  const im=e.target&&e.target.closest&&e.target.closest(RAW);
  if(im){
    if(!keyOf(im)) return;
    e.preventDefault(); e.stopPropagation();
    if(CUR&&CUR.im===im) close(); else open(im);
    return;
  }
  if(BAR&&BAR.classList.contains('on')&&!e.target.closest('.rawfix')&&!e.target.closest('.cropov,.cropbar')) close();
},true);
addEventListener('keydown',e=>{ if(e.key==='Escape'&&CUR){ e.preventDefault(); close(); } },true);
addEventListener('scroll',()=>{ if(CUR) place() },true);
addEventListener('resize',()=>{ if(CUR) place() });

/* ★ 이것도 같은 고리다 — 그림에 손대면 그 자리가 바뀌고, 바뀌면 또 손댄다.
   내가 손대는 동안 온 알림은 버리고, «칸이 통째로 갈릴 때» 만 듣는다. */
let PMUTE=0;
const pquiet=fn=>{ PMUTE++; try{ fn() }catch(e){globalThis.__q?.(e)} setTimeout(()=>{ PMUTE=Math.max(0,PMUTE-1) },160); };
paintAll();
['#list','#ovl'].forEach(sel=>{
  const wait=setInterval(()=>{
    const n=document.querySelector(sel); if(!n) return; clearInterval(wait);
    const targets = sel==='#ovl'
      ? [document.querySelector('#ovLeft'),document.querySelector('#ovRight')].filter(Boolean)
      : [n];
    targets.forEach(t=>new MutationObserver(()=>{ if(PMUTE) return;
      setTimeout(()=>pquiet(()=>paintAll(n)),40) }).observe(t,{childList:true}));
    paintAll(n);
  },250);
  setTimeout(()=>clearInterval(wait),20000);
});
setInterval(()=>paintAll(),3000);
window.__rawFix=()=>FIX;
window.__rawFixPaint=paintAll;
})();
