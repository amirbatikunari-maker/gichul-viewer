/* practice.html 에서 분리 (v341) — 원래 8098번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const rows=()=>{try{return Array.isArray(window.SHOWN)?window.SHOWN:[]}catch(e){return[]}};

  /* ═══ ① 칸마다 따로 굴리기 ═══════════════════════════════ */
  let colRaf=0;
  function sizeCols(){
    if(colRaf) return; colRaf=requestAnimationFrame(()=>{ colRaf=0; realSizeCols(); });
  }
  function realSizeCols(){
    const wide=matchMedia('(min-width:900px)').matches && document.body.classList.contains('oneup');
    $$('#list > .pcard.show .pgrid.split3').forEach(g=>{
      const cols=$$(':scope > .pcol',g);
      if(!wide){ g.style.removeProperty('--colh'); cols.forEach(c=>c.classList.remove('scrolls')); return; }
      const top=g.getBoundingClientRect().top;
      const h=Math.max(320, Math.round(innerHeight-top-14));
      g.style.setProperty('--colh',h+'px');
      cols.forEach(c=>c.classList.toggle('scrolls', c.scrollHeight>c.clientHeight+2));
    });
  }
  addEventListener('resize',sizeCols);
  addEventListener('scroll',sizeCols,{passive:true});

  /* ═══ ② 형광펜 · 취소선 · 주석 ═══════════════════════════ */
  const AKEY='prac:ann:v1';
  let ANN=(()=>{try{return JSON.parse(localStorage.getItem(AKEY)||'{}')}catch(e){return{}}})();
  const asave=()=>{try{localStorage.setItem(AKEY,JSON.stringify(ANN))}catch(e){globalThis.__q?.(e)}};
  const list=(qid,area)=>((ANN[qid]||{})[area]||[]);
  function put(qid,area,m){
    ANN[qid]=ANN[qid]||{}; ANN[qid][area]=ANN[qid][area]||[];
    ANN[qid][area].push(m); ANN[qid][area].sort((a,b)=>a.s-b.s); asave();
  }
  function drop(qid,area,pred){
    const a=list(qid,area); if(!a.length) return;
    ANN[qid][area]=a.filter(m=>!pred(m)); asave();
  }
  window.__pracAnn=()=>ANN;

  /* ── 글자만 세는 걸음 (수식·뱃지는 뺀다) ── */
  /* 수식(KaTeX) 은 화면에 보이는 부분(.katex-html) 과, 화면엔 안 보이지만
     스크린 리더용으로 같은 내용을 다시 담은 부분(.katex-mathml) 을 같이 갖고 있다.
     예전엔 이걸 피하려고 수식 전체를 «글자 한 칸» 으로 뭉뚱그려 셌다 — 그래서
     형광펜을 그으면 늘 수식 전체가 통째로 칠해졌다.

     이제 .katex-mathml(안 보이는 사본) 만 걸러내고, 보이는 쪽(.katex-html)은
     그 안의 낱개 조각(숫자 하나·연산자 하나 — KaTeX 가 자체적으로 mord·mbin 같은
     이름을 붙여 둔 것)까지 들여다본다. 자리 수가 겹칠 일이 없으니 드래그한
     부분만 정확히 칠할 수 있다. 분수·근호처럼 화면 배치가 복잡한 수식은
     조각들의 화면 순서와 글 순서가 완전히 같지 않을 수 있어 살짝 어긋나 보일
     수도 있다 — 그래도 «전체가 통째로 칠해지는» 것보단 낫다. */
  const SKIP='.ann-badge,.annlist,script,style,summary,.plabel,.ansbtn,.plab,.katex-mathml';
  const ATOM='.katex .mord,.katex .mbin,.katex .mrel,.katex .mopen,.katex .mclose,'
    +'.katex .mpunct,.katex .minner,.katex .mspace';
  function units(root){
    const out=[];
    (function walk(node){
      for(const ch of node.childNodes){
        if(ch.nodeType===3){
          if(ch.nodeValue&&ch.nodeValue.length) out.push({n:ch,len:ch.nodeValue.length,atom:false});
          continue;
        }
        if(ch.nodeType!==1) continue;
        if(ch.matches(SKIP)) continue;
        if(ch.matches(ATOM)){ out.push({n:ch,len:1,atom:true}); continue; }
        walk(ch);
      }
    })(root);
    return out;
  }
  function textOf(root){
    return units(root).map(u=>u.atom?'\u0001':u.n.nodeValue).join('');
  }
  /* ★ bias — 수식 덩어리 «안» 을 가리킬 때 앞으로 붙일지 뒤로 붙일지.
     예전에는 시작도 끝도 덩어리 «앞» 을 돌려줬다. 그래서 수식만 골라 잡으면
     시작=끝이 되어 길이가 0 이 되고, 띠가 아예 안 떴다(글자만 되던 까닭). */
  function offsetOf(root,container,offset,bias){
    const us=units(root); let off=0;
    for(const u of us){
      if(u.atom){
        if(u.n===container||u.n.contains(container)) return bias==='e' ? off+1 : off;
        off+=1; continue;
      }
      if(u.n===container) return off+Math.min(offset,u.len);
      off+=u.len;
    }
    if(container.nodeType===1){
      const kid=container.childNodes[offset]||null; let o=0;
      for(const u of us){ if(kid&&(u.n===kid||(kid.contains&&kid.contains(u.n)))) return o; o+=u.len; }
      return o;
    }
    return off;
  }
  function wrapRange(root,s,e,make,badge){
    const us=units(root); let off=0; const jobs=[];
    for(const u of us){
      const a=Math.max(s,off), b=Math.min(e,off+u.len);
      if(b>a) jobs.push({u,from:a-off,to:b-off});
      off+=u.len; if(off>=e) break;
    }
    let last=null;
    for(const j of jobs){
      if(j.u.atom){
        const el=j.u.n, par=el.parentNode; if(!par) continue;
        const w=make(); w.classList.add('has-tex');
        par.insertBefore(w,el); w.appendChild(el); last=w; continue;
      }
      let node=j.u.n;
      try{
        if(j.to<node.nodeValue.length) node.splitText(j.to);
        if(j.from>0) node=node.splitText(j.from);
      }catch(x){ continue }
      const w=make(); const par=node.parentNode; if(!par) continue;
      par.insertBefore(w,node); w.appendChild(node); last=w;
    }
    if(badge&&last) last.appendChild(badge());
    return !!last;
  }

  /* ── 한 칸에 표시를 다시 그린다 ── */
  function repaintBox(el){
    const key=el.dataset.ann; if(!key) return;
    const [qid,area]=key.split('|');
    if(el.__orig==null){
      /* 수식을 먼저 그려 놓고 «원본» 으로 담아야 글자 자리가 어긋나지 않는다 */
      try{ window.__pracMathify && window.__pracMathify(el); }catch(x){globalThis.__q?.(x)}
      el.__orig=el.innerHTML;
    }
    else el.innerHTML=el.__orig;      /* 되돌리면 지난 표시·주석목록이 같이 사라진다 */
    const ms=list(qid,area);
    if(!ms.length) return;
    let no=0; const notes=[];
    /* 뒤에서부터 감싸야 앞쪽 글자 자리가 안 밀린다 */
    const ordered=ms.slice().sort((a,b)=>b.s-a.s);
    const numById=new Map();
    ms.forEach(m=>{ if(m.t==='n'){ no++; numById.set(m.id,no); notes.push(m); } });
    ordered.forEach(m=>{
      wrapRange(el,m.s,m.e,()=>{
        const w=document.createElement('mark');
        w.className='ann t-'+m.t+(m.c?' c-'+m.c:'');
        w.dataset.annid=m.id; w.dataset.annkey=key;
        if(m.t==='n'&&m.n) w.title=m.n;
        return w;
      }, m.t==='n' ? ()=>{
        const b=document.createElement('sup'); b.className='ann-badge';
        b.textContent=numById.get(m.id)||'•'; b.dataset.annid=m.id; b.dataset.annkey=key;
        return b;
      } : null);
    });
    if(notes.length){
      const box=document.createElement('div'); box.className='annlist';
      box.innerHTML='<div class="h">주석</div>'+notes.map(m=>
        `<div class="it" data-annid="${m.id}" data-annkey="${key}"><b>${numById.get(m.id)}</b><span>${escapeHtml(m.n||'')}</span></div>`).join('');
      el.appendChild(box);
    }
    paintFind(el);
  }
  /* «본문에서 찾기» 에 친 말을 본문에도 그대로 표시해 준다 (저장하지 않는 임시 표시) */
  function paintFind(el){
    const q=(document.getElementById('fQ')?.value||'').trim();
    if(q.length<2) return;
    const t=textOf(el); if(!t) return;
    const lo=t.toLowerCase(), needle=q.toLowerCase();
    const hits=[]; let i=lo.indexOf(needle);
    while(i>=0 && hits.length<60){ hits.push([i,i+needle.length]); i=lo.indexOf(needle,i+needle.length); }
    hits.reverse().forEach(([a,b])=>wrapRange(el,a,b,()=>{
      const w=document.createElement('mark'); w.className='ann findhit'; return w;
    },null));
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  /* ── 어떤 칸에 표를 붙일 수 있나 ── */
  function ovRow(){
    const t=$('#ovTitle')?.textContent||''; const m=t.match(/(\d{4})년 제(\d+)회 (\d+)번/); if(!m) return null;
    return rows().find(r=>String(r.year)===m[1]&&String(r.session)===m[2]&&String(r.no)===m[3])||null;
  }
  function tag(){
    /* 일반 보기 */
    $$('#list > .pcard').forEach(card=>{
      const id=card.dataset.id; if(!id) return;
      const pick=(sel,area)=>$$(sel,card).forEach(el=>{
        const k=id+'|'+area;
        if(el.dataset.ann!==k){ el.dataset.ann=k; el.__orig=null; }
      });
      pick('.pcol-q .qmd, .pcol-q .otx','q');
      pick('.pcol-ans .qmd, .pcol-ans .otx','a');
      pick('.pcol-ez .easybox','e');
    });
    /* 한눈에 보기 — 켜 두었을 때만 (이 겹이 예전에 되풀이 고리를 만들었다) */
    const ovl=$('#ovl');
    if(OVFLAG('ann')&&ovl&&ovl.classList.contains('on')){
      const r=ovRow();
      if(r){
        const id=String(r.id);
        const pick=(sel,area)=>$$(sel,ovl).forEach(el=>{
          const k=id+'|'+area;
          if(el.dataset.ann!==k){ el.dataset.ann=k; el.__orig=null; }
        });
        pick('#ovLeft .qmd, #ovLeft .otx','q');
        pick('#ovRight [data-seg="a"] .qmd, #ovRight [data-seg="a"] .otx','a');
        pick('#ovRight [data-seg="e"] .ez','e');
      }
    }
  }
  /* ★★ 여기가 «한눈에를 누르면 멎던» 진짜 고리였다 ★★
     ① 한눈에 판이 열리면 #ovLeft · #ovRight 의 childList 를 지켜보다가 repaintAll 을 부른다.
     ② repaintAll 은 표시를 다시 칠하려고 그 칸의 innerHTML 을 통째로 갈아 끼운다.
     ③ 그 갈아 끼움이 다시 ①의 관찰자를 깨운다 → ② → ① → … 끝이 없다.
     예전에는 90ms 짜리 «잠깐 쉬기» 하나로 막아 두었는데, 관찰자가 60ms 뒤에 부르니
     간발의 차이였다. 화면이 조금만 느려지면(문항이 크거나 수식이 많으면) 그대로 뚫린다.
     이제는 시간이 아니라 «내가 만든 변화인가» 로 막는다 — 내가 칠하는 동안 온 알림은 버린다. */
  let BUSY=false, busyT=0, MUTE=0;
  const selfMade = () => MUTE>0;
  function repaintAll(){
    if(BUSY) return;
    BUSY=true; MUTE++;
    try{
      tag();
      $$('[data-ann]').forEach(el=>{ try{ repaintBox(el) }catch(x){globalThis.__q?.(x)} });
    }catch(x){
      try{ console.warn('표시를 다시 칠하지 못했습니다',x) }catch(y){globalThis.__q?.(y)}
    }finally{
      clearTimeout(busyT);
      busyT=setTimeout(()=>{ BUSY=false; MUTE=Math.max(0,MUTE-1); },260);
    }
    try{ sizeCols() }catch(x){globalThis.__q?.(x)}
  }
  window.__annMute = selfMade;
  window.__pracAnnRepaint=repaintAll;

  /* ── 띠 · 쪽지 ── */
  const bar=document.createElement('div'); bar.className='annbar';
  bar.innerHTML=`<button type="button" class="dot y" data-c="y" title="노랑"></button>
    <button type="button" class="dot g" data-c="g" title="초록"></button>
    <button type="button" class="dot p" data-c="p" title="분홍"></button>
    <button type="button" class="dot b" data-c="b" title="파랑"></button>
    <span class="sep"></span>
    <button type="button" data-a="s" title="취소선"><span style="text-decoration:line-through;text-decoration-color:#d64550">취소선</span></button>
    <button type="button" data-a="n" title="주석 달기">💬 주석</button>
    <span class="sep"></span>
    <button type="button" data-a="x" title="이 자리 표시 지우기">지우기</button>`;
  document.body.appendChild(bar);

  const pop=document.createElement('div'); pop.className='annpop';
  document.body.appendChild(pop);
  const hidePop=()=>{ pop.classList.remove('on'); syncOpen(); };
  const hideBar=()=>{ bar.classList.remove('on'); syncOpen(); };
  function syncOpen(){
    document.body.classList.toggle('ann-open',
      bar.classList.contains('on')||pop.classList.contains('on'));
  }

  let SEL=null;   // {el,key,s,e}
  function place(node,rect){
    const w=node.offsetWidth||280, h=node.offsetHeight||40;
    let x=Math.min(Math.max(8,rect.left+rect.width/2-w/2), innerWidth-w-8);
    let y=rect.top-h-8; if(y<8) y=Math.min(innerHeight-h-8, rect.bottom+8);
    node.style.left=x+'px'; node.style.top=y+'px';
  }
  function readSel(){
    const s=getSelection(); if(!s||s.isCollapsed||!s.rangeCount) return null;
    const r=s.getRangeAt(0);
    let el=r.commonAncestorContainer;
    if(el.nodeType===3) el=el.parentElement;
    el=el?.closest?.('[data-ann]');
    if(!el) return null;
    const a=offsetOf(el,r.startContainer,r.startOffset,'s');
    const b=offsetOf(el,r.endContainer,r.endOffset,'e');
    const s0=Math.min(a,b), e0=Math.max(a,b);
    if(e0-s0<1) return null;
    return {el,key:el.dataset.ann,s:s0,e:e0,rect:r.getBoundingClientRect()};
  }
  /* ── 언제 띠를 띄우나 ────────────────────────────────────
     폰(안드로이드 크롬)에서는 «꾹 눌러 고르기» 가 끝나도 touchend 가
     페이지로 오지 않는다 — 손가락이 놓이는 곳이 브라우저가 그린 손잡이라서다.
     그래서 어느 기기에서나 확실히 오는 selectionchange 를 기준으로 삼는다. */
  const touchish=()=>matchMedia('(max-width:820px)').matches||matchMedia('(pointer:coarse)').matches;
  let selT=0, dropT=0;
  function showBar(){
    const v=readSel();
    if(!v){
      hideBar();
      /* 단추를 누르는 순간 고른 것이 풀리기도 한다 — 잠깐은 들고 있는다 */
      clearTimeout(dropT); dropT=setTimeout(()=>{ SEL=null; },1400);
      return;
    }
    clearTimeout(dropT);
    SEL=v; bar.classList.add('on'); syncOpen();
    if(!touchish()) place(bar,v.rect);   /* 폰에서는 아래쪽에 붙박이로 뜬다 */
  }
  function onSelUp(e){
    if(e && (e.target.closest?.('.annbar')||e.target.closest?.('.annpop'))) return;
    clearTimeout(selT); selT=setTimeout(showBar,10);
  }
  document.addEventListener('selectionchange',()=>{
    clearTimeout(selT);
    selT=setTimeout(showBar, touchish()?320:60);
  });
  document.addEventListener('mouseup',onSelUp);
  document.addEventListener('touchend',onSelUp,{passive:true});
  document.addEventListener('keyup',e=>{ if(e.shiftKey||e.key==='Shift') onSelUp(e); });
  document.addEventListener('pointerdown',e=>{
    if(e.target.closest('.annbar')||e.target.closest('.annpop')) return;
    hidePop();
    if(!touchish()) hideBar();          /* 폰에서는 고르는 중에 사라지면 안 된다 */
  });
  addEventListener('scroll',()=>{
    if(touchish()) return;              /* 붙박이라 따라다닐 필요가 없다 */
    hideBar(); hidePop();
  },{passive:true});

  const uid=()=>'a'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36);
  function add(t,c,note){
    if(!SEL) return;
    const [qid,area]=SEL.key.split('|');
    /* 겹치는 같은 종류는 먼저 걷어낸다 — 두 번 칠하면 색만 바뀐다 */
    drop(qid,area,m=>m.t!=='n'&&m.t===t&&!(m.e<=SEL.s||m.s>=SEL.e));
    put(qid,area,{id:uid(),s:SEL.s,e:SEL.e,t,c,n:note||''});
    getSelection()?.removeAllRanges(); hideBar();
    repaintAll();
  }
  /* ── 밖에서 쓰는 손잡이 ──
     ai-explain.js 가 «AI 가 쓴 글» 을 이 주석함에 그대로 넣을 때 쓴다.
     고른 자리(SEL)는 단추를 누르는 순간 이미 풀려 있을 수 있으므로 되돌려 넣을 수 있게 열어 둔다. */
  window.__pracAnnAPI={ getSel:()=>SEL, setSel:v=>{ SEL=v }, addNote:t=>add('n',null,t) };

  bar.addEventListener('click',e=>{
    const d=e.target.closest('[data-c]'); const a=e.target.closest('[data-a]');
    if(d) return add('h',d.dataset.c);
    if(!a) return;
    if(a.dataset.a==='s') return add('s',null);
    if(a.dataset.a==='x'){
      if(!SEL) return;
      const [qid,area]=SEL.key.split('|');
      drop(qid,area,m=>!(m.e<=SEL.s||m.s>=SEL.e));
      getSelection()?.removeAllRanges(); hideBar(); repaintAll(); return;
    }
    if(a.dataset.a==='n'){
      const keep=SEL, rect=SEL.rect;
      pop.innerHTML=`<textarea placeholder="이 부분에 남길 말"></textarea>
        <div class="r"><button type="button" class="go" data-ok>저장</button>
        <button type="button" data-cancel>취소</button></div>`;
      pop.classList.add('on'); syncOpen(); place(pop,rect); hideBar();
      const ta=pop.querySelector('textarea'); ta.focus();
      pop.querySelector('[data-cancel]').onclick=()=>{ hidePop(); getSelection()?.removeAllRanges(); };
      pop.querySelector('[data-ok]').onclick=()=>{
        const v=ta.value.trim(); hidePop();
        if(!v){ getSelection()?.removeAllRanges(); return }
        SEL=keep; add('n',null,v);
      };
      ta.addEventListener('keydown',ev=>{ if((ev.metaKey||ev.ctrlKey)&&ev.key==='Enter') pop.querySelector('[data-ok]').click(); });
    }
  });

  /* 표시를 누르면 무엇을 할지 물어본다 */
  document.addEventListener('click',e=>{
    const t=e.target.closest('mark.ann,.ann-badge,.annlist .it');
    if(!t) return;
    const key=t.dataset.annkey, id=t.dataset.annid;
    if(!key||!id) return;
    e.preventDefault(); e.stopPropagation();
    const [qid,area]=key.split('|');
    const m=list(qid,area).find(x=>x.id===id); if(!m) return;
    const rect=t.getBoundingClientRect();
    pop.innerHTML = (m.t==='n')
      ? `<div class="rd">${escapeHtml(m.n||'')}</div>
         <div class="r"><button type="button" data-edit>고치기</button><button type="button" class="del" data-del>지우기</button></div>`
      : `<div class="rd">${m.t==='s'?'취소선':'형광펜'}</div>
         <div class="r"><button type="button" class="del" data-del>지우기</button></div>`;
    pop.classList.add('on'); syncOpen(); place(pop,rect);
    pop.querySelector('[data-del]').onclick=()=>{ drop(qid,area,x=>x.id===id); hidePop(); repaintAll(); };
    pop.querySelector('[data-edit]')?.addEventListener('click',()=>{
      pop.innerHTML=`<textarea></textarea><div class="r">
        <button type="button" class="go" data-ok>저장</button><button type="button" data-cancel>취소</button></div>`;
      const ta=pop.querySelector('textarea'); ta.value=m.n||''; ta.focus();
      place(pop,rect);
      pop.querySelector('[data-cancel]').onclick=hidePop;
      pop.querySelector('[data-ok]').onclick=()=>{ m.n=ta.value.trim(); asave(); hidePop(); repaintAll(); };
    });
  },true);

  /* ── 다시 그려질 때마다 표시를 되살린다 ── */
  const boot=setInterval(()=>{
    if(!$('#list')) return; clearInterval(boot);
    repaintAll();
    new MutationObserver(()=>{ if(selfMade()) return;
      setTimeout(()=>{ if(!selfMade()) repaintAll() },90); }).observe($('#list'),{childList:true});
    const ovl=$('#ovl');
    if(ovl){
      new MutationObserver(()=>{ if(selfMade()) return; setTimeout(()=>{ if(!selfMade()) repaintAll() },80); })
        .observe(ovl,{attributes:true,attributeFilter:['class']});
      ['#ovLeft','#ovRight'].forEach(s=>{ const el=$(s);
        if(el) new MutationObserver(()=>{ if(selfMade()) return;
          setTimeout(()=>{ if(!selfMade()) repaintAll() },150); }).observe(el,{childList:true}); });
    }
    ['fOne','fText','fSplit','fSize','fAns','fEz'].forEach(id=>
      document.getElementById(id)?.addEventListener('click',()=>setTimeout(repaintAll,120)));
    let ft=0;
    document.getElementById('fQ')?.addEventListener('input',()=>{ clearTimeout(ft); ft=setTimeout(repaintAll,260); });
    setInterval(sizeCols,1200);
  },160);
  setTimeout(()=>clearInterval(boot),20000);
})();
