/* practice.html 에서 분리 (v341) — 원래 8726번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

  /* ══ ① 이미 저장돼 있는 해설의 «NOT( )» 글자 표기를 수식으로 바꿔 준다 ══
     1161개가 예전 규칙(LaTeX 금지)으로 이미 쓰여 있다. 다시 쓰지 않고
     화면에 그릴 때 수식으로 바꿔 끼운다. 새로 쓰는 해설은 처음부터 LaTeX 로 나온다. */
  function logicToTex(md){
    if(!md) return md;
    let s=String(md);
    if(/\\overline|\\dfrac|\\cdot/.test(s)) return s;   /* 이미 수식이면 손대지 않는다 */

    /* 윗줄(매크론)이 붙은 글자 → \overline{} */
    s=s.replace(/(?:[A-Za-z]\u0305)+/g,m=>'\\overline{'+m.replace(/\u0305/g,'')+'}');   /* ★ v265 이어 쓴 윗줄은 한 줄로 */
    s=s.replace(/([A-Za-z])[̄¯]/g,'\\overline{$1}');

    /* NOT( … ) 를 안쪽부터 벗겨 낸다 */
    let g=0;
    while(g++<80){
      const m=s.match(/\bNOT\s*\(([^()]*)\)/i);
      if(!m) break;
      const inner=m[1].replace(/\s*[×*]\s*/g,' \\cdot ').replace(/\s+/g,' ').trim();
      s=s.slice(0,m.index)+'\\overline{'+inner+'}'+s.slice(m.index+m[0].length);
    }
    if(!s.includes('\\overline')) return md;

    /* 수식 조각만 $…$ 로 묶는다 — 중괄호 짝을 세어 가며 한글·문장부호에서 끊는다 */
    const isMath=c=>/[A-Za-z0-9+\-=·×*\/\s(),.\\{}_^]/.test(c);
    const out=[]; let i=0;
    while(i<s.length){
      const k=s.indexOf('\\overline{',i);
      if(k<0){ out.push(s.slice(i)); break; }
      let a=k;
      while(a>0 && isMath(s[a-1])) a--;
      while(a<s.length && /\s/.test(s[a])) a++;
      if(a>k) a=k;
      let b=a, depth=0;
      while(b<s.length){
        const c=s[b];
        if(c==='{'){ depth++; b++; continue; }
        if(c==='}'){ depth--; if(depth<0) break; b++; continue; }
        if(depth>0){ b++; continue; }
        if(!isMath(c)) break;
        b++;
      }
      while(b>k && /\s/.test(s[b-1])) b--;
      out.push(s.slice(i,a));
      let body=s.slice(a,b).replace(/\s*[×*]\s*/g,' \\cdot ').replace(/\s+/g,' ').trim();
      let tailPunc='';
      const pm=body.match(/[.,·:;]+$/); if(pm){ tailPunc=pm[0]; body=body.slice(0,-pm[0].length).trim(); }
      out.push(body ? ('$'+body+'$'+tailPunc) : s.slice(a,b));
      i=b;
    }
    return out.join('');
  }
  /* mdLite 는 «쉬운 풀이·주석» 에만 쓰인다 — 문제·답안(mdRich)은 건드리지 않는다 */
  if(typeof window.mdLite==='function' && !window.mdLite.__tex){
    const raw=window.mdLite;
    const wrapped=function(md){ return raw(logicToTex(md)); };
    wrapped.__tex=1; window.mdLite=wrapped;
  }
  window.__logicToTex=logicToTex;

  /* ══ ② 쉬운 풀이 칸에도 수식을 그린다 (예전에는 문제·답안만 그렸다) ══ */
  function mathify(root){
    if(!root||!window.renderMathInElement) return;
    const list=$$('.easybox, .ez, .mkb', root);
    if(root.matches&&root.matches('.easybox,.ez,.mkb')) list.unshift(root);
    list.forEach(el=>{
      if(el.__mathed) return; el.__mathed=1;
      try{ window.tex ? window.tex(el) : renderMathInElement(el,{delimiters:[
        {left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},
        {left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}
      ],throwOnError:false,ignoredTags:['script','style','textarea','pre','code']}); }catch(e){globalThis.__q?.(e)}
    });
  }
  window.__pracMathify=mathify;

  /* ══ ③ 상단 도구 접기 ══ */
  const FKEY='prac:deckfold';
  function buildFold(){
    const deck=$('.deck'); if(!deck||$('.deckfold')) return false;
    const bar=document.createElement('div'); bar.className='deckfold';
    bar.innerHTML=`<button type="button" id="deckFold">▲ 도구 접기</button>
      <span class="now" id="deckNow"></span>`;
    deck.parentNode.insertBefore(bar,deck);
    const btn=$('#deckFold',bar);
    const paint=()=>{
      const off=document.body.classList.contains('deck-fold');
      btn.textContent=off?'▼ 도구 펴기':'▲ 도구 접기';
      const now=$('#dpFound')?.textContent||'';
      const pct=$('#dpPct')?.textContent||'';
      $('#deckNow',bar).textContent=off?now:'';
    };
    btn.onclick=()=>{
      document.body.classList.toggle('deck-fold');
      try{localStorage.setItem(FKEY,document.body.classList.contains('deck-fold')?'1':'0')}catch(e){globalThis.__q?.(e)}
      paint(); sizeCols();
    };
    try{ if(localStorage.getItem(FKEY)==='1') document.body.classList.add('deck-fold'); }catch(e){globalThis.__q?.(e)}
    paint(); setInterval(paint,2000);
    return true;
  }

  /* ══ ④ 칸 높이 — 화면에 맞춰 한 번 정하고, 굴려도 흔들리지 않게 ══ */
  let cRaf=0;
  function sizeCols(){ if(cRaf)return; cRaf=requestAnimationFrame(()=>{cRaf=0;real()}); }
  function real(){
    const wide=matchMedia('(min-width:900px)').matches && document.body.classList.contains('oneup');
    $$('#list > .pcard.show .pgrid.split3').forEach(g=>{
      const cols=$$(':scope > .pcol',g);
      if(!wide){ g.style.removeProperty('--colh'); cols.forEach(c=>c.classList.remove('scrolls')); return; }
      /* 카드 머리 아래부터 화면 끝까지 — 페이지를 굴려도 값이 바뀌지 않게 위쪽 고정줄 높이로 잰다 */
      const headtop=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--headtop'))||0;
      const head=g.closest('.pcard')?.querySelector('.phead');
      const hh=head?head.offsetHeight:0;
      const h=Math.max(360, Math.round(innerHeight-headtop-hh-34));
      g.style.setProperty('--colh',h+'px');
      cols.forEach(c=>c.classList.toggle('scrolls', c.scrollHeight>c.clientHeight+2));
    });
  }
  addEventListener('resize',sizeCols);

  const boot=setInterval(()=>{
    if(!$('#list')) return;
    if(buildFold()) clearInterval(boot);
    mathify(document); sizeCols();
  },220);
  setTimeout(()=>clearInterval(boot),20000);

  /* ★★ 되풀이 고리 ★★
     감시자가 «#ovl 안이 바뀌었다» 를 듣고 수식을 그리는데, 수식을 그리는 일 자체가
     #ovl 안을 바꾼다(KaTeX 가 태그를 잔뜩 끼워 넣는다). 그래서 그리면 또 깨고,
     깨면 또 그린다 — 한눈에를 열 때 «다시 그리기 20~40번» 이 이것이었다.
     이제 «내가 만든 변화인가» 를 표시해 두고, 그동안 온 알림은 버린다. */
  let MUTE=0;
  const quiet=fn=>{ MUTE++; try{ fn() }catch(e){globalThis.__q?.(e)} setTimeout(()=>{ MUTE=Math.max(0,MUTE-1) },140); };
  const l=$('#list');
  if(l) new MutationObserver(()=>{ if(MUTE) return;
    setTimeout(()=>quiet(()=>{mathify(l);sizeCols()}),20) }).observe(l,{childList:true});
  const ov=$('#ovl');
  if(ov){
    /* 속(subtree)까지 듣던 것을 «칸이 통째로 갈릴 때» 만 듣게 좁힌다 */
    new MutationObserver(()=>{ if(MUTE) return; setTimeout(()=>quiet(()=>mathify(ov)),30) })
      .observe(ov,{attributes:true,attributeFilter:['class']});
    ['#ovLeft','#ovRight'].forEach(sel=>{ const el=$(sel);
      if(el) new MutationObserver(()=>{ if(MUTE) return;
        setTimeout(()=>quiet(()=>mathify(ov)),30) }).observe(el,{childList:true}); });
  }
  setInterval(()=>{ mathify(document); },2500);
})();
