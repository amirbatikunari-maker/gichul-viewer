/* practice.html 에서 분리 (v341) — 원래 7263번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const rows=()=>{try{return Array.isArray(window.SHOWN)?window.SHOWN:[]}catch(e){return[]}};
  const oneup=()=>document.body.classList.contains('oneup');
  const START=Date.now();

  /* 위에 붙어 있는 띠(이동줄·현재위치줄) 높이만큼 문항 레일을 내려 붙인다 */
  function syncStick(){
    let h=0;
    ['.nav3','.app-context'].forEach(s=>{
      const el=document.querySelector(s); if(!el)return;
      if(getComputedStyle(el).position==='sticky' && el.offsetParent!==null) h+=el.offsetHeight;
    });
    document.documentElement.style.setProperty('--railtop',h+'px');
  }
  addEventListener('resize',syncStick); addEventListener('load',syncStick);

  /* ── 진도 기록 ──────────────────────────────────────────────
     «봤다» 로는 오르지 않는다. ✓(맞음) 또는 ✕(틀림) 을 눌러야 한 문항이 센다.
     n 은 그 문항을 몇 번 풀었는지다. 값이 작아 저장 부담은 없다. */
  const PKEY='prac:prog:v1';
  let PROG=(()=>{try{return JSON.parse(localStorage.getItem(PKEY)||'{}')}catch(e){return{}}})();
  const psave=()=>{try{localStorage.setItem(PKEY,JSON.stringify(PROG))}catch(e){globalThis.__q?.(e)}};
  /* ★ v288 — «같은 문제» 끼리 확실히 연동.
     같은 문제 = 소문항 이름이 같음 · 글이 90% 이상 같음 · 책이 적은 출제 연도 목록이 같음 (__pracSame)
     맞음·틀림·회독 −/+ 를 누르면 그 묶음 «모두» 에 같은 기록을 적는다.
     (묶음 안 기록이 전에 서로 달랐으면 먼저 가장 큰 값으로 합친 뒤 적는다)
     그래서 레일·카드·뱃지·답안·미니맵·랜덤 거르기가 전부 같은 숫자를 본다. */
  const sameOf=id=>{ try{ const g=window.__pracSame?window.__pracSame(id):null; if(g&&g.length) return g.map(String); }catch(e){globalThis.__q?.(e)} return [String(id)]; };
  const norm=p=>{ p=Object.assign({n:0},p||{}); if(p.ok==null) p.ok=p.r==='ok'?1:0; if(p.no==null) p.no=p.r==='no'?1:0; return p; };
  function merged(ids){
    let m=null;
    ids.forEach(k=>{ const p=PROG[k]; if(!p) return; const q=norm(p);
      if(!m){ m=Object.assign({},q); return; }
      m.n=Math.max(m.n|0,q.n|0); m.ok=Math.max(m.ok|0,q.ok|0); m.no=Math.max(m.no|0,q.no|0);
      if((+q.at||0)>(+m.at||0)){ m.at=q.at; m.r=q.r; } });
    m=norm(m||{n:0,r:null});
    m.n=Math.max(m.n|0,(m.ok|0)+(m.no|0));      /* 맞힘+틀림이 회독보다 많을 수는 없다 */
    return m;
  }
  function writeAll(ids,p){
    p.okb=1;                                   /* ★ v306 — 새로 적는 기록은 «맞음→회독» 옮김 대상이 아님 */
    const alive=(p.n|0)>0;
    ids.forEach(k=>{ if(alive) PROG[k]=Object.assign({},p); else delete PROG[k]; });
    psave(); paint(); ids.forEach(smark);
  }
  function bump(id,r){
    if(!id)return; id=String(id);
    const ids=sameOf(id), p=merged(ids);
    p.n=(p.n|0)+1; p.r=r; p.at=Date.now();
    if(r==='ok') p.ok++; else if(r==='no') p.no++;
    writeAll(ids,p);
  }
  function clearOne(id){ id=String(id); writeAll(sameOf(id),{n:0,at:Date.now()}); }
  /* ★ v287 — 바뀐 문항을 서버로 (없어진 것은 n:0 으로 알려 다른 기기에서도 지운다) */
  function smark(id){ try{ window.__studyMark && window.__studyMark('prog', String(id), PROG[String(id)] || { n:0, at:Date.now() }) }catch(e){globalThis.__q?.(e)} }
  window.__pracProgPut=(id,v)=>{ id=String(id); if(v && (v.n|0)>0) PROG[id]=v; else delete PROG[id]; };
  window.__pracProgSave=()=>{ psave(); try{ paint() }catch(e){globalThis.__q?.(e)} };
  window.__pracProg=()=>PROG;
  /* ★ v284 — 맞힌 횟수 (예전 기록: 마지막이 맞음이면 1) */
  window.__pracOkN=id=>{ const p=PROG[String(id)]; if(!p) return 0; return p.ok!=null?(p.ok|0):(p.r==='ok'?1:0); };
  /* ★ v285 — 체크(푼) 횟수 = 회독. 손으로 −/+ (답안 «고치기» 옆 · 미니맵).
     + 는 «한 번 더 풂» 만 올린다 (맞음·틀림은 안 건드림). − 로 줄이면 맞힘·틀림 수도 넘지 않게 줄인다. */
  window.__pracChkN=id=>{ const p=PROG[String(id)]; return p?(p.n|0):0; };
  window.__pracChkAdj=(id,d)=>{ id=String(id); const ids=sameOf(id), p=merged(ids);
    p.n=Math.max(0,(p.n|0)+d); p.at=Date.now();
    while((p.ok|0)+(p.no|0)>p.n){ if(p.no>0) p.no--; else p.ok--; }
    if(p.r==='ok'&&!p.ok) p.r=p.no?'no':null; if(p.r==='no'&&!p.no) p.r=p.ok?'ok':null;
    writeAll(ids,p); return p.n|0; };
  /* 한 문항 맞힌 횟수를 손으로 고침 (미니맵 −/+) */
  window.__pracOkAdj=(id,d)=>{ id=String(id); const ids=sameOf(id), p=merged(ids);
    p.ok=Math.max(0,(p.ok|0)+d); p.at=Date.now(); if(d>0){ p.n=Math.max((p.n|0)+1,p.ok+(p.no|0)); p.r='ok'; }
    if(!p.ok && p.r==='ok') p.r=p.no?'no':null;
    writeAll(ids,p); return p.ok|0; };
  window.__pracSameOf=sameOf;
  window.__pracBump=(id,r)=>bump(id,r);          /* ★ v304 — 카드가 목록에 없어도 기록 (한눈에 ✓/✕) */
  /* ★ v304 — «맞음» 표시된 문항 회독 +1 (한 번만). 같은 문제 묶음은 한 번 · 기록에 okb 를 남겨 다른 기기에서 또 올리지 않음 */
  const OKB_CUT=Date.UTC(2026,8,26,15,30);     /* 2026-09-27 00:30 (한국) */
  function okBumpTargets(){
    const seen=new Set(), out=[];
    Object.keys(PROG).forEach(id=>{
      if(seen.has(id)) return;
      const ids=sameOf(id); ids.forEach(k=>seen.add(k));
      const p=merged(ids);
      if(p.r==='ok' && !ids.some(k=>PROG[k]&&PROG[k].okb) && (+p.at||0) < OKB_CUT) out.push(ids);
    });
    return out;
  }
  window.__pracOkBumpCount=()=>okBumpTargets().length;
  /* ★ v306 — «맞음» 단추를 «회독» 단추로 바꾸면서, 예전에 맞음으로 표시된 기록은 과목을 열 때 저절로 회독 +1
     OKB_CUT(v306 배포 시각) 이전 기록만 — 옛 판 앱이 켜진 기기에서 나중에 생긴 기록이 또 +1 되지 않게 */
  window.__pracOkBump=()=>{
    const T=okBumpTargets();
    T.forEach(ids=>{ const p=merged(ids); p.n=(p.n|0)+1; p.okb=1; p.at=Date.now(); ids.forEach(k=>{ PROG[k]=Object.assign({},p); }); });
    psave(); paint(); T.forEach(ids=>ids.forEach(smark));
    return T.reduce((n,ids)=>n+ids.filter(k=>PROG[k]).length,0);      /* 문항 수 (같은 문제 묶음은 묶음째) */
  };
  const T0=Date.now();
  setInterval(()=>{ try{
    if(!rows().length) return;
    /* 다른 기기에서 이미 옮긴 것을 또 올리지 않게 — 서버 기록을 한 번 받아 합친 뒤에만 (서버를 못 쓰면 20초 뒤) */
    if(!window.__studyPulled && Date.now()-T0<20000) return;
    const c=okBumpTargets().length; if(!c) return;
    const n=window.__pracOkBump();
    if(n) (window.__pxToast||console.log)(`예전 «맞음» ${n}문항을 회독 +1 로 옮겼습니다`);
  }catch(e){globalThis.__q?.(e)} }, 4000);

  /* ── 3칸 도구 만들기 ── */
  let attic;
  function park(el){ if(el&&attic&&el.parentNode!==attic) attic.appendChild(el); }
  function menu(label,title,items){
    const w=document.createElement('div'); w.className='dmenu';
    const t=document.createElement('button'); t.type='button'; t.className='chip dm-t'; t.textContent=label;
    if(title)t.title=title;
    const pop=document.createElement('div'); pop.className='dmenu-pop';
    items.forEach(x=>{
      if(typeof x==='string'){const l=document.createElement('div');l.className='dmenu-lab';l.textContent=x;pop.appendChild(l);return}
      if(Array.isArray(x)){const r=document.createElement('div');r.className='dmenu-row';x.forEach(e=>e&&r.appendChild(e));pop.appendChild(r);return}
      if(x) pop.appendChild(x);
    });
    t.onclick=e=>{e.stopPropagation();$$('.dmenu.open').forEach(m=>m!==w&&m.classList.remove('open'));w.classList.toggle('open')};
    w.append(t,pop); return w;
  }
  document.addEventListener('click',e=>{ if(!e.target.closest?.('.dmenu')) $$('.dmenu.open').forEach(m=>m.classList.remove('open')); });

  function build(){
    if($('.deck')) return true;
    const hud=$('.studyhud'), shell=$('.filters-shell'), qbar=$('.quickbar'), sbar=$('.sessionbar'), cv=$('.cvbar');
    if(!hud||!cv) return false;
    if((!shell||!sbar) && Date.now()-START<5000) return false;   /* 세션 띠가 늦게 붙는다 — 잠깐 기다린다 */

    attic=document.createElement('div'); attic.id='deckAttic'; document.body.appendChild(attic);

    const deck=document.createElement('div'); deck.className='deck';

    /* ① 진행 ------------------------------------------------- */
    const c1=document.createElement('section'); c1.className='dcol dcol-progress';
    c1.innerHTML=`
      <div class="dhead"><b>진행</b><small id="dpSubj"></small><span class="sp"></span>
        <button type="button" class="chip" id="deckToggle" hidden>도구 ▾</button></div>
      <div class="dp-top"><span class="dp-pct" id="dpPct">0%</span><span class="dp-of" id="dpOf">0 / 0 문항</span></div>
      <div class="dp-bar"><i class="ok" id="dpBarOk" style="width:0"></i><i class="no" id="dpBarNo" style="width:0"></i></div>
      <div class="dp-nums">
        <div><b id="dpOk">0</b><span>맞음</span></div>
        <div><b id="dpNo">0</b><span>틀림</span></div>
        <div><b id="dpLeft">0</b><span>남음</span></div>
        <div><b id="dpN">0</b><span>푼 횟수</span></div>
      </div>
      <div class="dp-act">
        <button type="button" class="go" id="dpResume">▶ 이어풀기</button>
        <button type="button" id="dpWrong">오답만</button>
        <button type="button" class="mini" id="dpMore" title="더보기">⋯</button>
      </div>
      <div class="dp-note">문항 카드의 <b>맞음 / 틀림</b> 을 눌러야 진도가 오릅니다.</div>`;

    /* ② 문제 찾기 -------------------------------------------- */
    const c2=document.createElement('section'); c2.className='dcol dcol-find';
    c2.innerHTML=`<div class="dhead"><b>문제 찾기</b><small id="dpFound"></small><span class="sp"></span></div>
      <div class="drow" id="dFind1"></div><div class="drow" id="dFind2"></div>`;

    /* ③ 보기 ------------------------------------------------- */
    const c3=document.createElement('section'); c3.className='dcol dcol-view';
    c3.innerHTML=`<div class="dhead"><b>보기 · 모드</b><span class="sp"></span><small id="cvSlot"></small></div>
      <div class="drow" id="dView1"></div><div class="drow" id="dView2"></div>`;

    deck.append(c1,c2,c3);
    (hud.parentNode||$('.wrap')).insertBefore(deck,hud);

    const f1=$('#dFind1',deck), f2=$('#dFind2',deck), v1=$('#dView1',deck), v2=$('#dView2',deck);
    const put=(host,el)=>{ if(el) host.appendChild(el); };

    /* 찾기 칸 채우기 */
    put(f1,$('#fSub'));
    put(f1,menu('⚙','과목 관리',['과목 관리',[ $('#subAdd'), $('#subRen'), $('#subDel') ]]));
    put(f1,$('#fYear')); put(f1,$('#fSess'));
    put(f2,$('#fQ')); put(f2,$('#filterClear'));
    put(f2,$('#fRand')); put(f2,$('#fRandN'));
    put(f2,$('#qUnseen')); put(f2,$('#qFav')); put(f2,$('#filterReset'));

    /* 보기 칸 채우기 */
    put(v1,$('#fOne')); put(v1,$('#fText')); put(v1,$('#fSplit')); put(v1,$('#fSize'));
    put(v1,$('#fAns')); put(v1,$('#fEz'));
    put(v2,$('#sessionStart')); put(v2,$('#reviewWrong')); put(v2,$('#reviewMarked'));
    put(v2,menu('🛠 도구','글자 변환 · 자동 해설 · 다시 해석',
      ['한꺼번에 처리 (아직 안 된 것만)',$('#cvGap'),$('#ezRun'),$('#cvStop'),
       '그림 → 글자 다시 변환 (이미 바꾼 것까지)',$('#cvAllSess'),$('#cvAll'),
       '쉬운 풀이 다시 해석 (기존 것을 지우고 새로)',$('#ezRedoSess'),$('#ezRedoAll'),$('#ezSetup')]));
    put(v2,$('.bgm'));
    put(v2,menu('⋯','그 밖에',['그 밖에',$('#qHelp'),$('#logoutBtn')]));
    /* 변환 진행 상황은 «보기» 칸 머리에 붙여 둔다 */
    const slot=$('#cvSlot',deck); if(slot){ if($('#cvStat'))slot.appendChild($('#cvStat')); if($('#cvProg'))c3.appendChild($('#cvProg')); }

    /* «미학습» 은 이제 «아직 체크 안 한 문항» 을 뜻한다 — 예전 «본 것» 기준을 갈아 끼운다 */
    const un=$('#qUnseen');
    if(un){
      const c=un.cloneNode(true); c.textContent='미체크'; c.title='아직 맞음/틀림을 누르지 않은 문항';
      un.replaceWith(c);
      c.addEventListener('click',()=>{
        const rs=rows(); const left=rs.filter(r=>!PROG[String(r.id)]);
        if(!left.length) return alert('이 조건의 문항을 모두 체크했습니다.');
        if(oneup()){ const i=rs.findIndex(r=>!PROG[String(r.id)]); if(i>=0&&window.showAt)window.showAt(i); }
        else $$('#list>.pcard').forEach(x=>x.hidden=!!PROG[String(x.dataset.id)]);
      });
    }

    /* 안 쓰는 것들은 치운다 (다른 코드가 찾을 수 있으니 지우지는 않는다) */
    ['#qAll','#qRandom','#studyReset','#studyContinue','#sessionClear'].forEach(s=>park($(s)));
    park($('.qhint')); park($('.session-title')); park($('.session-meta'));

    /* 더보기 · 이어풀기 · 오답만 */
    $('#dpMore',deck).onclick=e=>{
      e.stopPropagation();
      if(!confirm('실기 진도(맞음/틀림·푼 횟수)를 모두 지울까요?\n다른 기기(PC·노트북·태블릿)에서도 같이 지워집니다.')) return;
      const ids=Object.keys(PROG);
      PROG={}; psave(); $('#sessionClear')?.click(); paint();
      try{ window.__studyReset && window.__studyReset(ids) }catch(e){globalThis.__q?.(e)}
    };
    $('#dpMore',deck).title='진도 초기화';
    $('#dpResume',deck).onclick=()=>{
      const rs=rows(); const i=rs.findIndex(r=>!PROG[String(r.id)]);
      if(i<0) return alert('이 조건의 문항을 모두 체크했습니다.');
      if(typeof window.showAt==='function') window.showAt(i);
      document.querySelector('#list > .pcard.show')?.scrollIntoView({block:'start',behavior:'smooth'});
    };
    $('#dpWrong',deck).onclick=()=>{
      const rs=rows().filter(r=>PROG[String(r.id)]?.r==='no');
      if(!rs.length) return alert('틀림으로 체크한 문항이 없습니다.');
      if(oneup()){ const i=rows().findIndex(r=>String(r.id)===String(rs[0].id)); if(i>=0&&window.showAt)window.showAt(i); }
      else $$('#list>.pcard').forEach(c=>c.hidden=!rs.some(r=>String(r.id)===String(c.dataset.id)));
    };

    /* 폰: 도구 접기 */
    const tg=$('#deckToggle',deck);
    const syncToggle=()=>{ const small=matchMedia('(max-width:820px)').matches; tg.hidden=!small; if(!small)deck.classList.remove('open') };
    tg.onclick=()=>{ deck.classList.toggle('open'); tg.textContent=deck.classList.contains('open')?'도구 ▴':'도구 ▾' };
    syncToggle(); addEventListener('resize',syncToggle);

    buildRail(); syncStick(); setTimeout(syncStick,400);
    return true;
  }

  /* ── 문항 레일 : 좌우 반투명 단추 · 손끌기 ── */
  function buildRail(){
    const rail=$('#prail'); if(!rail||rail.parentNode.classList.contains('railwrap')) return;
    const wrap=document.createElement('div'); wrap.className='railwrap';
    rail.parentNode.insertBefore(wrap,rail); wrap.appendChild(rail);
    const L=document.createElement('button'); L.type='button'; L.className='railar l'; L.textContent='‹'; L.setAttribute('aria-label','문항 목록 왼쪽으로');
    const R=document.createElement('button'); R.type='button'; R.className='railar r'; R.textContent='›'; R.setAttribute('aria-label','문항 목록 오른쪽으로');
    wrap.append(L,R);
    const step=()=>Math.max(140,Math.round(rail.clientWidth*0.75));
    L.onclick=()=>rail.scrollBy({left:-step(),behavior:'smooth'});
    R.onclick=()=>rail.scrollBy({left:step(),behavior:'smooth'});
    const sync=()=>{
      const max=rail.scrollWidth-rail.clientWidth-2;
      L.classList.toggle('off',rail.scrollLeft<=2);
      R.classList.toggle('off',rail.scrollLeft>=max);
    };
    rail.addEventListener('scroll',sync,{passive:true});
    addEventListener('resize',sync);
    new MutationObserver(()=>{markRail();setTimeout(sync,60)}).observe(rail,{childList:true});
    setTimeout(sync,120);

    /* 손으로 끌어서 넘기기 — 끌었을 때는 클릭으로 치지 않는다 */
    let down=false,sx=0,sl=0,moved=0;
    rail.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse')return;            /* 손가락은 브라우저가 알아서 굴린다 */
      if(e.target.closest('.railar'))return;
      down=true;moved=0;sx=e.clientX;sl=rail.scrollLeft;
    });
    rail.addEventListener('pointermove',e=>{
      if(!down||e.pointerType!=='mouse')return; const d=e.clientX-sx; if(Math.abs(d)>4){moved=Math.abs(d);rail.classList.add('drag');rail.scrollLeft=sl-d;}
    });
    const up=()=>{down=false;setTimeout(()=>rail.classList.remove('drag'),0);sync()};
    rail.addEventListener('pointerup',up); rail.addEventListener('pointercancel',up);
    rail.addEventListener('pointerleave',()=>{if(down)up()});
  }
  function markRail(){
    const rs=rows();
    $$('#prail .pb').forEach(b=>{
      const i=+b.dataset.go; const r=rs[i]; if(!r)return;
      const p=PROG[String(r.id)];
      b.classList.toggle('done',!!p);
      b.classList.toggle('wrong',p?.r==='no');
      b.classList.toggle('rok',p?.r==='ok');
      /* ★ v288 — 회독 2번 이상이면 번호 위에 숫자 (미니맵과 같은 모양) */
      const n=p?(p.n|0):0; let sp=b.querySelector(':scope > .rdn');
      if(n>=2){ if(!sp){ sp=document.createElement('sup'); sp.className='rdn'; b.appendChild(sp); } if(sp.textContent!==String(n)) sp.textContent=String(n); }
      else if(sp) sp.remove();
    });
  }

  /* ── «한눈에» 화면 안의 레일 ── */
  function buildOvRail(){
    const ovl=$('#ovl'); if(!ovl||$('#ovrail')) return;
    const bar=document.createElement('div'); bar.className='ovrail'; bar.id='ovrail';
    bar.innerHTML=`<button type="button" class="railar l" id="ovrL">‹</button>
      <div class="ovr-s" id="ovrS"></div>
      <button type="button" class="railar r" id="ovrR">›</button>`;
    const oh=ovl.querySelector('.oh'); oh.after(bar);
    const s=$('#ovrS',bar);
    const st=()=>Math.max(140,Math.round(s.clientWidth*0.75));
    $('#ovrL',bar).onclick=()=>s.scrollBy({left:-st(),behavior:'smooth'});
    $('#ovrR',bar).onclick=()=>s.scrollBy({left:st(),behavior:'smooth'});
    /* 제목이 바뀌면(= 다른 문항으로 옮겨 가면) 레일을 다시 그린다 */
    new MutationObserver(()=>drawOvRail()).observe($('#ovSub'),{childList:true,characterData:true,subtree:true});
    new MutationObserver(()=>{ if(ovl.classList.contains('on')) drawOvRail(); })
      .observe(ovl,{attributes:true,attributeFilter:['class']});
  }
  /* ★ v253 — 레일이 «자꾸 가운데로 돌아오던» 것을 끝낸다.
       여태: 제목(#ovSub)이 바뀔 때마다 레일을 통째로 다시 그리고 지금 칸을
       한가운데로 끌어다 놓았다. 해설이 붙거나 글자 크기를 건드리기만 해도
       제목이 바뀌므로, 옆 회차를 보려고 밀어 놓은 자리가 매번 날아갔다.
       심하면 누르려던 단추가 그 순간 새로 그려져 «눌리지도» 않았다.
     이제:
       ① 내용이 그대로면 다시 그리지 않는다 (단추가 손 밑에서 사라지지 않음)
       ② 가운데로 끌어다 놓는 것은 «처음 열 때» 와 «문항이 바뀐 때» 뿐
       ③ 사람이 한 번이라도 손으로 밀면, 그 판이 닫힐 때까지 안 건드린다 */
  let OVR_SIG='', OVR_NOW=-1, OVR_MOVED=false;
  function ovrHook(s){
    if(s.__hooked) return; s.__hooked=1;
    const mark=()=>{ OVR_MOVED=true; };
    ['wheel','pointerdown','touchstart','keydown'].forEach(ev=>
      s.addEventListener(ev,mark,{passive:true}));
    /* 손끌기 — 마우스로 잡아 밀 수 있게 */
    let down=false,sx=0,sl=0;
    s.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse'||e.target.closest('.railar'))return;
      down=true;sx=e.clientX;sl=s.scrollLeft;
    });
    s.addEventListener('pointermove',e=>{
      if(!down||e.pointerType!=='mouse')return;
      const d=e.clientX-sx; if(Math.abs(d)>4){ s.classList.add('drag'); s.scrollLeft=sl-d; }
    });
    const up=()=>{ down=false; setTimeout(()=>s.classList.remove('drag'),0); };
    s.addEventListener('pointerup',up); s.addEventListener('pointercancel',up);
    s.addEventListener('pointerleave',()=>{ if(down) up(); });
  }
  /* 판이 열릴 때마다 «손으로 민 적 없음» 으로 되돌린다 */
  window.__ovrRailReset=()=>{ OVR_MOVED=false; OVR_NOW=-1; };
  function drawOvRail(){
    const s=$('#ovrS'); if(!s) return;
    ovrHook(s);
    let rs=rows(); if(!rs.length){ s.innerHTML=''; return; }
    const at=(()=>{ try{ return Math.max(0,window.ONEAT|0) }catch(e){ return 0 } })();
    const m=String($('#ovTitle')?.textContent||'').match(/(\d{4})년 제(\d+)회 (\d+)번/);
    let now=at, VIRT=null;
    if(m){ const k=rs.findIndex(r=>String(r.year)===m[1]&&String(r.session)===m[2]&&String(r.no)===m[3]); if(k>=0)now=k;
      /* ★ v330 — 목록에 없는 문항(동일 −·유사 − 로 접힘 · 미니맵에서 연 것)을 보는 중이면
         엉뚱한 칸(앞에 보던 것)을 까맣게 칠하던 것 → 그 문항을 제자리(같은 회차 번호 순)에 점선 칸으로 끼워 «지금» 으로 */
      else{ try{
        const all=Array.isArray(ROWS)?ROWS:[];
        const cur=all.find(r=>String(r.id)===String(OVID))
               || all.find(r=>String(r.year)===m[1]&&String(r.session)===m[2]&&String(r.no)===m[3]);
        if(cur){
          const Y=+cur.year, S=+cur.session, N=+cur.no;
          let pos=-1;
          rs.forEach((r,i)=>{ if(+r.year===Y && +r.session===S && (+r.no)<N) pos=i+1; });
          if(pos<0){ const j=rs.findIndex(r=>+r.year===Y && +r.session===S); if(j>=0) pos=j; }
          if(pos<0){ const rid=window.__pracRepOf&&window.__pracRepOf(cur.id); const j=rid?rs.findIndex(r=>String(r.id)===String(rid)):-1; if(j>=0) pos=j+1; }
          if(pos<0) pos=Math.min(rs.length, at+1);
          rs=rs.slice(0,pos).concat([cur],rs.slice(pos)); now=pos; VIRT=String(cur.id);
        }
      }catch(e){globalThis.__q?.(e)} } }
    const W=45, a=Math.max(0,now-W), b=Math.min(rs.length,now+W+1);
    const html=rs.slice(a,b).map((r,k)=>{
      const i=a+k, p=PROG[String(r.id)];
      const vf=VIRT===String(r.id);
      return `<button class="pb ${i===now?'now':''} ${vf?'fold':''} ${p?'done':''} ${p?.r==='ok'?'rok':p?.r==='no'?'wrong':''}" type="button" data-ovgo="${i}" data-y="${r.year}"${vf?` title="지금 목록에 없는 문항 — ${String((window.__pracWhyOut&&window.__pracWhyOut(r.id))||'거르기에 걸림').replace(/"/g,'&quot;')}"`:''}>${r.year%100}-${r.session} ${r.no}${p&&(p.n|0)>=2?`<sup class="rdn">${p.n|0}</sup>`:''}</button>`
        + (window.__grpTail ? window.__grpTail(r) : '');
    }).join('');
    /* ① 내용이 그대로면 손대지 않는다 */
    if(html!==OVR_SIG){
      OVR_SIG=html;
      s.innerHTML=html;
      s.querySelectorAll('[data-ovgo]').forEach(b=>b.onclick=()=>{
        const i=+b.dataset.ovgo, r=rs[i]; if(!r)return;
        const si=(Array.isArray(SHOWN)?SHOWN:[]).findIndex(x=>String(x.id)===String(r.id));   /* ★ v330 — 끼운 칸이 있으면 번호가 밀리므로 id 로 */
        if(si>=0 && document.body.classList.contains('oneup') && typeof window.showAt==='function') window.showAt(si);
        if(typeof window.ovOpen==='function') window.ovOpen(r.id);
      });
    }
    /* ②③ 문항이 바뀐 때만, 그것도 사람이 안 밀었을 때만 가운데로 */
    const moved = now!==OVR_NOW;
    OVR_NOW=now;
    if(moved && !OVR_MOVED){
      const nowBtn=s.querySelector('.pb.now');
      if(nowBtn){
        const prevSB=s.style.scrollBehavior;
        s.style.scrollBehavior='auto';
        nowBtn.scrollIntoView({block:'nearest',inline:'center'});
        s.style.scrollBehavior=prevSB||'';
      }
    }
  }

  /* ── 카드의 체크 단추를 «맞음/틀림» 으로 다듬고 푼 횟수를 붙인다 ── */
  function dressCards(){
    $$('#list > .pcard').forEach(card=>{
      const id=String(card.dataset.id||''); if(!id) return;
      const a=card.querySelector('.result-actions'); if(!a) return;
      const ok=a.querySelector('[data-result="ok"]'), no=a.querySelector('[data-result="no"]');
      if(ok&&/^(✓|✓ 맞음)$/.test(ok.textContent.trim())) ok.textContent='＋ 회독';
      if(no&&no.textContent.trim()==='✕') no.textContent='✕ 틀림';
      let n=a.querySelector('.done-n');
      if(!n){ n=document.createElement('span'); n.className='done-n'; a.insertBefore(n,a.firstChild); }
      /* 체크 단추를 눌렀는데 «한눈에» 가 같이 열리던 것을 막는다 */
      if(!a.__stop){ a.addEventListener('click',e=>e.stopPropagation()); a.__stop=1; }
      const h=card.querySelector('.phead[data-ov]');
      if(h && !h.__guard){
        const orig=h.onclick;
        h.onclick=e=>{ if(e.target.closest('button,a,input,select,label,details,summary'))return; orig&&orig.call(h,e); };
        h.__guard=1;
      }
      const p=PROG[id];
      n.textContent=p?`${p.n|0}회독 · ✓${norm(p).ok|0}`:'';
      n.title=p?'맞음·틀림을 누를 때마다 회독 +1 — 같은 문제끼리 함께 셉니다':'';
      card.dataset.result=p?.r||'';
      card.classList.toggle('result-ok',p?.r==='ok');
      card.classList.toggle('result-no',p?.r==='no');
    });
  }

  /* ── 숫자 다시 계산 ── */
  let painting=false;
  function paint(){
    if(painting)return; painting=true; requestAnimationFrame(()=>{ painting=false; realPaint(); });
  }
  function realPaint(){
    if(!$('.deck')) return;
    const rs=rows(), total=rs.length;
    let ok=0,no=0,n=0;
    rs.forEach(r=>{ const p=PROG[String(r.id)]; if(!p)return; n+=p.n|0; if(p.r==='no')no++; else if(p.r==='ok')ok++; });
    const done=ok+no, pct=total?Math.round(done/total*100):0;
    const set=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v};
    set('dpPct',pct+'%'); set('dpOf',`${done} / ${total} 문항`);
    set('dpOk',ok); set('dpNo',no); set('dpLeft',Math.max(0,total-done)); set('dpN',n);
    const bo=document.getElementById('dpBarOk'), bn=document.getElementById('dpBarNo');
    if(bo)bo.style.width=(total?ok/total*100:0)+'%';
    if(bn)bn.style.width=(total?no/total*100:0)+'%';
    const subj=$('#fSub')?.selectedOptions?.[0]?.textContent||'';
    set('dpSubj',subj);
    const at=(()=>{try{return (window.ONEAT|0)+1}catch(e){return 1}})();
    set('dpFound',total?`${total}문항 · 지금 ${Math.min(at,total)}번째`:'조건에 맞는 문항이 없습니다');
    dressCards(); markRail();
    if($('#ovl')?.classList.contains('on')) drawOvRail();
  }

  /* ── 체크를 가로챈다 (v6 의 기록과 나란히 쌓는다) ── */
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-result]'); if(!b) return;
    const card=b.closest('.pcard'); if(!card) return;
    bump(card.dataset.id,b.dataset.result);
  },true);
  /* 1 · 2 단축키도 같이 센다 */
  document.addEventListener('keydown',e=>{
    if(/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return;
    if(e.key!=='1'&&e.key!=='2')return;
    if(!window.__gkey?.matches(e.key==='1'?'p-ok':'p-no',e)) return;
    const rs=rows(); let r=null;
    try{ r=rs[window.ONEAT|0]||null }catch(x){globalThis.__q?.(x)}
    if(!r) r=(()=>{const c=$('#list>.pcard.show'); return c?rs.find(x=>String(x.id)===String(c.dataset.id)):null})();
    if(r) bump(r.id,e.key==='1'?'ok':'no');
  });

  /* ── 시동 ── */
  const boot=setInterval(()=>{ if(build()){ clearInterval(boot); buildOvRail(); paint();
    const list=$('#list');
    if(list) new MutationObserver(()=>paint()).observe(list,{childList:true});
    ['fSub','fYear','fSess','fQ','fOne','fRand'].forEach(id=>{
      const el=document.getElementById(id); if(!el)return;
      el.addEventListener('change',()=>setTimeout(paint,80));
      el.addEventListener('click',()=>setTimeout(paint,80));
    });
    addEventListener('keydown',()=>setTimeout(paint,60));
  } },160);
  setTimeout(()=>clearInterval(boot),20000);
})();
