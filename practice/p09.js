/* practice.html 에서 분리 (v341) — 원래 8551번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const oneup=()=>document.body.classList.contains('oneup');
  const rows=()=>{try{return Array.isArray(window.SHOWN)?window.SHOWN:[]}catch(e){return[]}};

  /* ── 카드 머리가 붙을 자리 = 이동줄 + 문항줄 높이 ── */
  function syncHeadTop(){
    const cs=getComputedStyle(document.documentElement);
    const rail=parseFloat(cs.getPropertyValue('--railtop'))||0;
    const rw=$('.railwrap');
    const h=rw && getComputedStyle(rw).display!=='none' ? rw.offsetHeight : 0;
    document.documentElement.style.setProperty('--headtop',(rail+h)+'px');
    /* 폰 아래쪽 이동줄 높이 — 형광펜 띠가 그 위에 앉게 */
    const mn=$('.app-mobile-nav');
    const mh=(mn && getComputedStyle(mn).display!=='none' && !document.body.classList.contains('ovlopen'))
      ? mn.offsetHeight : 0;
    document.documentElement.style.setProperty('--mobnav',mh+'px');
  }
  addEventListener('resize',syncHeadTop);

  /* ── 체크하면 다음 문항으로 ── */
  const AKEY='prac:autonext';
  let AUTO=(()=>{try{return localStorage.getItem(AKEY)==='1'}catch(e){return false}})();
  function makeChips(){
    const v2=$('#dView2'); if(!v2||$('#autoNext')) return false;
    const b=document.createElement('button');
    b.type='button'; b.id='autoNext'; b.className='chip'+(AUTO?' on':'');
    b.textContent='체크→다음';
    b.title='맞음/틀림을 누르면 저절로 다음 문항으로 넘어갑니다';
    b.onclick=()=>{ AUTO=!AUTO; try{localStorage.setItem(AKEY,AUTO?'1':'0')}catch(e){globalThis.__q?.(e)}
      b.classList.toggle('on',AUTO); };
    v2.insertBefore(b, v2.firstChild);

    /* 표시함(형광펜·주석) 필터 — «찾기» 칸에 */
    const f2=$('#dFind2');
    if(f2 && !$('#annOnly')){
      const a=document.createElement('button');
      a.type='button'; a.id='annOnly'; a.className='chip';
      a.textContent='🖍 표시함';
      a.title='형광펜·취소선·주석을 남긴 문항만';
      a.onclick=()=>{
        const ANN=(typeof window.__pracAnn==='function')?window.__pracAnn():{};
        const has=id=>{const o=ANN[String(id)]; return !!o&&Object.keys(o).some(k=>(o[k]||[]).length)};
        const rs=rows().filter(r=>has(r.id));
        if(!rs.length) return alert('아직 표시를 남긴 문항이 없습니다.');
        if(oneup()){ const i=rows().findIndex(r=>has(r.id)); if(i>=0&&window.showAt) window.showAt(i); }
        else $$('#list>.pcard').forEach(c=>c.hidden=!has(c.dataset.id));
      };
      f2.appendChild(a);
    }
    return true;
  }

  /* 체크 뒤 자동 넘김 — 체크 단추는 «한눈에» 가 같이 열리지 않게 전파를 끊어 두었으므로
     문서 맨 바깥(가로채기 단계)에서 듣는다. 넘기는 것은 기록이 끝난 뒤로 미룬다. */
  document.addEventListener('click',e=>{
    if(!AUTO) return;
    const b=e.target.closest?.('[data-result]'); if(!b) return;
    if(!oneup()) return;
    setTimeout(()=>{
      const at=(()=>{try{return window.ONEAT|0}catch(x){return 0}})();
      if(at+1<rows().length && typeof window.showAt==='function'){
        window.showAt(at+1);
        document.querySelector('#list > .pcard.show')?.scrollIntoView({block:'start',behavior:'smooth'});
      }
    },170);
  },true);

  /* ── 문항마다 걸린 시간 ── */
  const TKEY='prac:time:v1';
  let TIME=(()=>{try{return JSON.parse(localStorage.getItem(TKEY)||'{}')}catch(e){return{}}})();
  let curId=null, t0=0;
  const mmss=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  /* v206 — 자리를 비워도 초가 계속 쌓여 «1447분» 같은 값이 나왔다.
     탭이 뒤로 가 있거나 90초 동안 아무 것도 안 만지면 세는 것을 멈추고,
     다시 만지면 이어서 센다. 쌓인 값은 멈출 때 바로 저장한다. */
  const IDLE_MS = 90000;
  let lastAct = Date.now();
  ['pointerdown','keydown','wheel','touchstart','scroll'].forEach(ev =>
    addEventListener(ev, () => { lastAct = Date.now(); }, { passive:true, capture:true }));
  /* ★ v235 — 숨을 때 그 자리에서 정산한다.
     반복 점검이 숨은 동안 쉬게 바뀌었으므로, 여기서 안 끊으면
     자리를 비운 시간까지 그 문항에 얹혀 «1447분» 같은 값이 다시 나온다. */
  document.addEventListener('visibilitychange', () => {
    if(document.hidden && curId && t0){
      TIME[curId] = (TIME[curId] || 0) + Math.round((Date.now() - t0) / 1000);
      try{ localStorage.setItem(TKEY, JSON.stringify(TIME)); }catch(e){globalThis.__q?.(e)}
      t0 = 0;
    }
    lastAct = Date.now();
  });

  function tickTimer(){
    const card=$('#list > .pcard.show')||$('#list > .pcard:not([hidden])');
    const id=card?.dataset.id||null;
    if(id!==curId){
      if(curId&&t0){ TIME[curId]=(TIME[curId]||0)+Math.round((Date.now()-t0)/1000);
        try{localStorage.setItem(TKEY,JSON.stringify(TIME))}catch(e){globalThis.__q?.(e)} }
      curId=id; t0=id?Date.now():0;
    }
    const away = document.hidden || (Date.now() - lastAct > IDLE_MS);
    if(away && t0){
      TIME[curId]=(TIME[curId]||0)+Math.round((Date.now()-t0)/1000);
      try{localStorage.setItem(TKEY,JSON.stringify(TIME))}catch(e){globalThis.__q?.(e)}
      t0=0;
    }else if(!away && id && !t0){ t0=Date.now(); }
    if(!card) return;
    let el=card.querySelector('.qtimer');
    const head=card.querySelector('.phead');
    if(!el&&head){ el=document.createElement('span'); el.className='qtimer';
      const acts=head.querySelector('.result-actions');
      head.insertBefore(el, acts||null); }
    if(el){ const live=(TIME[id]||0)+(t0?Math.round((Date.now()-t0)/1000):0);
      el.textContent='⏱ '+mmss(live); el.classList.toggle('run',!!t0);
      el.title='이 문항에 쓴 시간 (이 기기에 저장)'; }
  }
  addEventListener('beforeunload',()=>{
    if(curId&&t0){ TIME[curId]=(TIME[curId]||0)+Math.round((Date.now()-t0)/1000);
      try{localStorage.setItem(TKEY,JSON.stringify(TIME))}catch(e){globalThis.__q?.(e)} }
  });
  window.__pracTime=()=>TIME;

  const boot=setInterval(()=>{
    if(!$('#list')) return;
    syncHeadTop(); makeChips();
    if($('#autoNext')) clearInterval(boot);
  },200);
  setTimeout(()=>clearInterval(boot),20000);
  setInterval(()=>{ syncHeadTop(); tickTimer(); },1000);
  setTimeout(()=>{ syncHeadTop(); tickTimer(); },1400);
})();
