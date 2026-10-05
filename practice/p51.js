/* practice.html 에서 분리 (v341) — 원래 19781번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  "use strict";
  var KEY='prac:cols:v1';
  var MINR=0.16;                    /* 한 칸이 가질 수 있는 가장 좁은 몫 */
  var SAVED={};
  try{ SAVED=JSON.parse(localStorage.getItem(KEY)||'{}')||{} }catch(e){ SAVED={} }
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(SAVED)) }catch(e){globalThis.__q?.(e)} }

  function wide(){ try{ return matchMedia('(min-width:900px)').matches }catch(e){ return innerWidth>=900 } }
  function keyOf(el,n){ return (el.closest('#ovl') ? 'ov' : 'pg')+':'+n }
  function nums(s){
    return String(s||'').trim().split(/\s+/).map(parseFloat).filter(function(v){ return v===v });
  }

  /* 이 판이 «원래» 몇 칸인지 — 우리 값을 잠깐 걷고 브라우저에게 되묻는다 */
  function readCols(el){
    var had=el.style.getPropertyValue('grid-template-columns');
    if(had) el.style.removeProperty('grid-template-columns');
    var cs=getComputedStyle(el);
    var px=nums(cs.gridTemplateColumns), gap=parseFloat(cs.columnGap)||0;
    if(had) el.style.setProperty('grid-template-columns',had,'important');
    return {n:px.length,px:px,gap:gap};
  }
  /* 지금 실제로 쓰이는 칸 폭 */
  function liveCols(el){
    var cs=getComputedStyle(el);
    return {px:nums(cs.gridTemplateColumns),gap:parseFloat(cs.columnGap)||0};
  }

  function setRatio(el,r){
    el.style.setProperty('grid-template-columns',
      r.map(function(v){ return 'minmax(0,'+v.toFixed(4)+'fr)' }).join(' '),'important');
  }

  /* 칸을 채우는 알맹이들 — display:contents 껍데기(.pane.right)는 뚫고 들어간다 */
  function items(el,out){
    out=out||[];
    for(var i=0;i<el.children.length;i++){
      var c=el.children[i], d='';
      if(c.classList&&c.classList.contains('rzh')) continue;
      try{ d=getComputedStyle(c).display }catch(e){globalThis.__q?.(e)}
      if(d==='none') continue;
      if(d==='contents'){ items(c,out); continue }
      out.push(c);
    }
    return out;
  }

  function baseFs(){
    var v=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--qfs'));
    return (v===v&&v>0)?v:12.5;
  }
  function clearFs(el){
    var it=items(el);
    for(var i=0;i<it.length;i++) it[i].style.removeProperty('--qfs');
  }
  /* 글자도 칸 폭을 따라가게 — «원래 폭 대비 지금 폭» 으로 잰다.
     손대지 않은 판은 배율이 정확히 1 이라 여태 보던 그대로다.
     알맹이는 제 가운데가 어느 칸 위에 있는지로 짝지어서(칸을 걸쳐 놓인
     세 칸→두 칸 접힘까지) 그 칸의 배율을 받는다. */
  function fitText(el,cur,gap,nat){
    if(cur.length<2||!nat||nat.length!==cur.length){ clearFs(el); return }
    var s=[],i;
    for(i=0;i<cur.length;i++){
      var k=(nat[i]>0&&cur[i]>0)?Math.pow(cur[i]/nat[i],0.55):1;
      if(k<0.84) k=0.84;
      if(k>1.30) k=1.30;
      s.push(k);
    }
    var flat=true;
    for(i=0;i<s.length;i++) if(Math.abs(s[i]-1)>0.012) flat=false;
    if(flat){ clearFs(el); return }

    var edge=[], run=parseFloat(getComputedStyle(el).paddingLeft)||0;
    for(i=0;i<cur.length;i++){ edge.push([run,run+cur[i]]); run+=cur[i]+gap }
    var box=el.getBoundingClientRect(), b=baseFs(), it=items(el);
    for(i=0;i<it.length;i++){
      var r=it[i].getBoundingClientRect();
      if(!(r.width>0)){ it[i].style.removeProperty('--qfs'); continue }
      var c=r.left-box.left+r.width/2, hit=-1;
      for(var j=0;j<edge.length;j++) if(c>=edge[j][0]-gap&&c<=edge[j][1]+gap){ hit=j; break }
      if(hit<0) hit=Math.min(i,s.length-1);
      it[i].style.setProperty('--qfs',(b*s[hit]).toFixed(2)+'px');
    }
  }

  function strip(el){
    el.style.removeProperty('grid-template-columns');
    clearFs(el);
    el.__rznat=null;
    var hs=el.querySelectorAll(':scope > .rzh');
    for(var j=0;j<hs.length;j++) hs[j].remove();
    el.classList.remove('rzon');
    el.__rzn=0;
  }

  function place(el,n){
    var L=liveCols(el);
    if(L.px.length!==n) return;
    var hs=el.querySelectorAll(':scope > .rzh');
    var x=parseFloat(getComputedStyle(el).paddingLeft)||0;
    for(var i=0;i<n-1;i++){
      x+=L.px[i]+L.gap;
      if(hs[i]) hs[i].style.left=(x-L.gap/2)+'px';
    }
    fitText(el,L.px,L.gap,el.__rznat);
  }

  function mount(el){
    if(!wide()){ if(el.__rzn) strip(el); return }
    var C=readCols(el), n=C.n;
    if(n<2){ if(el.__rzn) strip(el); return }
    el.__rznat=C.px;                /* 손대지 않았을 때의 칸 폭 — 글자 배율의 기준 */

    if(el.__rzn!==n){
      var old=el.querySelectorAll(':scope > .rzh');
      for(var j=0;j<old.length;j++) old[j].remove();
      for(var i=0;i<n-1;i++){
        var h=document.createElement('div');
        h.className='rzh'; h.setAttribute('data-rz',i);
        h.title='끌면 칸 폭이 바뀝니다 · 두 번 누르면 처음 폭으로';
        h.appendChild(document.createElement('i'));
        el.appendChild(h);
      }
      el.__rzn=n;
      if(getComputedStyle(el).position==='static') el.classList.add('rzon');
    }

    var r=SAVED[keyOf(el,n)];
    if(r&&r.length===n) setRatio(el,r);
    else el.style.removeProperty('grid-template-columns');
    place(el,n);
  }

  /* ── 끌기 ────────────────────────────────────────── */
  var D=null, lastT=0, lastH=null;
  addEventListener('pointerdown',function(e){
    var h=e.target&&e.target.closest?e.target.closest('.rzh'):null; if(!h) return;
    var el=h.parentElement; if(!el) return;
    var n=el.__rzn|0; if(n<2) return;
    e.preventDefault(); e.stopPropagation();

    /* 두 번 빠르게 = 처음 폭으로 */
    var now=Date.now();
    if(h===lastH && now-lastT<380){
      lastH=null; lastT=0;
      delete SAVED[keyOf(el,n)];
      save(); el.style.removeProperty('grid-template-columns'); scan();
      return;
    }
    lastH=h; lastT=now;

    var L=liveCols(el); if(L.px.length!==n) return;
    var tot=0; for(var i=0;i<L.px.length;i++) tot+=L.px[i];
    D={el:el,n:n,i:+h.getAttribute('data-rz'),x:e.clientX,w:L.px.slice(),tot:tot,h:h,r:null};
    h.classList.add('on');
    document.body.classList.add('rzdrag');
    try{ h.setPointerCapture(e.pointerId) }catch(x){globalThis.__q?.(x)}
  },true);

  addEventListener('pointermove',function(e){
    if(!D) return;
    e.preventDefault();
    var i=D.i, d=e.clientX-D.x, lo=D.tot*MINR;
    var pair=D.w[i]+D.w[i+1], a=D.w[i]+d, b=pair-a;
    if(a<lo){ a=lo; b=pair-lo }
    if(b<lo){ b=lo; a=pair-lo }
    var w=D.w.slice(); w[i]=a; w[i+1]=b;
    var r=[]; for(var k=0;k<w.length;k++) r.push(w[k]/D.tot*D.n);
    setRatio(D.el,r); D.r=r;
    place(D.el,D.n);
  },{passive:false});

  function stop(){
    if(!D) return;
    var d=D; D=null;
    d.h.classList.remove('on');
    document.body.classList.remove('rzdrag');
    if(d.r){
      SAVED[keyOf(d.el,d.n)]=d.r.map(function(v){ return +v.toFixed(4) });
      save();
      scan();                       /* 같은 종류의 다른 판들도 함께 맞춘다 */
    }
  }
  addEventListener('pointerup',stop,true);
  addEventListener('pointercancel',stop,true);

  /* ── 훑기 ────────────────────────────────────────── */
  var raf=0;
  function scan(){
    if(D||raf) return;
    raf=requestAnimationFrame(function(){
      raf=0;
      if(D) return;
      try{
        var ov=document.querySelector('#ovl');
        if(ov&&ov.classList.contains('on')){
          var ob=ov.querySelector('.ob'); if(ob) mount(ob);
        }
        var gs=document.querySelectorAll('.pgrid.split, .pgrid.split3');
        for(var i=0;i<gs.length;i++) mount(gs[i]);
      }catch(e){globalThis.__q?.(e)}
    });
  }

  addEventListener('resize',scan);
  addEventListener('orientationchange',scan);

  /* 한 번만 알려 준다 — 이런 손잡이가 생겼다는 것을 모르면 못 쓴다 */
  function hint(){
    try{ if(localStorage.getItem('prac:cols:hint')) return }catch(e){ return }
    if(!wide()||!document.querySelector('.rzh')) return;
    try{ localStorage.setItem('prac:cols:hint','1') }catch(e){globalThis.__q?.(e)}
    var d=document.createElement('div');
    d.className='rzhint';
    d.textContent='칸과 칸 사이를 잡고 끌면 폭이 바뀝니다 — 그림·글자도 같이 커지고 작아집니다. 두 번 누르면 처음 폭으로.';
    document.body.appendChild(d);
    requestAnimationFrame(function(){ d.classList.add('on') });
    setTimeout(function(){ d.classList.remove('on'); setTimeout(function(){ d.remove() },400) },7000);
  }
  setTimeout(hint,3000);

  function watch(){
    var MO=window.MutationObserver; if(!MO) return;
    var list=document.querySelector('#list');
    if(list) new MO(scan).observe(list,{childList:true});
    var ov=document.querySelector('#ovl');
    if(ov){
      new MO(scan).observe(ov,{attributes:true,attributeFilter:['class']});
      var lf=ov.querySelector('#ovLeft'), rt=ov.querySelector('#ovRight');
      if(lf) new MO(scan).observe(lf,{childList:true});
      if(rt) new MO(scan).observe(rt,{childList:true});
    }
    /* 글자 크기(--qfs) 나 한 문제씩 보기(oneup) 가 바뀌면 배율도 다시 잡는다 */
    new MO(scan).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
    new MO(scan).observe(document.body,{attributes:true,attributeFilter:['class']});
    scan();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',watch);
  else watch();
  setTimeout(scan,700); setTimeout(scan,2000);
})();
