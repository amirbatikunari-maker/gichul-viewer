/* practice.html 에서 분리 (v341) — 원래 15416번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const KEY='prac:hl:v1';
let ON=(()=>{ try{ return localStorage.getItem(KEY)!=='0' }catch(e){ return true } })();

/* ── 용어 — 출제기준 낱말표를 그대로 쓴다 (따로 만들지 않는다) ── */
function terms(){
  const out=new Set([
    '수용률','부등률','부하율','역률','%임피던스','임피던스','단락전류','차단용량','정격전압',
    '기준용량','절연저항','접지저항','절연내력','자기유지','인터록','시퀀스','논리식','진리표',
    '전압강하','허용전류','조명률','감광보상률','보수율','광속','조도','축전지','보호계전기',
    '변류기','계기용변압기','피뢰기','차단기','단로기','전력용콘덴서','직렬리액터','수전설비'
  ]);
  try{
    (window.NCS_GIJUN?.silgi?.majors||[]).forEach(M=>(M.keys||[]).forEach(k=>{
      if(k && k.length>=3) out.add(k);
    }));
  }catch(e){globalThis.__q?.(e)}
  return [...out].sort((a,b)=>b.length-a.length);
}
let RE_TERM=null;
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

/* ★ 색이 들쭉날쭉하던 까닭 —
   ① 낱말 «조각» 에만 칠해졌다. «부하역률» 의 «역률» 만 초록이 되니
      같은 말인데 어떤 곳은 통째로, 어떤 곳은 반만 칠해져 보였다.
   ② 단위 목록이 좁아 «배 · 회 · lx · Var» 같은 것이 빠졌다.
   그래서 앞뒤가 한글이면 칠하지 않는다(낱말 경계) — 통째로 아니면 안 칠한다. */
const UNIT='(?:\\[[^\\]]{1,10}\\]|kVA|MVA|kVar|kWh|kV|kA|kW|VA|Var|mm2|mm|cm|km|㎡|℃|Ω|kΩ|MΩ|lx|lm|%|배|회|A|V|W|m|s)';
const RE_NUM  = new RegExp('(\\d[\\d,]*(?:\\.\\d+)?)\\s*('+UNIT+')(?![가-힣A-Za-z0-9])','g');
const RE_ASK  = /(구하시오|구하라|쓰시오|쓰라|설명하시오|기술하시오|작성하시오|산정하시오|선정하시오|계산하시오|나열하시오|답하시오|완성하시오|비교하시오)/g;
const RE_COND = /(?<![가-힣])(단,|다만,|제외한|제외하고|반드시|유의|단서)(?![가-힣])/g;
const RE_WARN = /(자주\s?틀리는|틀리기\s?쉬운|주의할\s?점|하지\s?않는다|안\s?된다)(?![가-힣])/g;
const RE_STEP = /(^|\s)(\(\d{1,2}\)|[①-⑩]|\d{1,2}단계|[가-하]\))/g;

const SKIP='.katex,.katex-display,.ann-badge,.annlist,.aiann-list,.dupwrap,.relwrap,'
         + 'code,pre,script,style,textarea,input,button,select,.imsz,.cropbar,.hlwrap';

function paintNode(tn){
  const raw=tn.nodeValue;
  if(!raw || raw.length<2 || !/[가-힣0-9]/.test(raw)) return false;
  let h=esc(raw), before=h;
  h=h.replace(RE_NUM,(m,a,b)=>`<b class="hl-num">${a}</b><span class="hl-unit">${b}</span>`);
  h=h.replace(RE_ASK,'<span class="hl-ask">$1</span>');
  h=h.replace(RE_COND,'<span class="hl-cond">$1</span>');
  h=h.replace(RE_WARN,'<span class="hl-warn">$1</span>');
  h=h.replace(RE_STEP,'$1<b class="hl-step">$2</b>');
  if(RE_TERM) h=h.replace(RE_TERM,'<span class="hl-term">$1</span>');
  if(h===before) return false;
  const sp=document.createElement('span');
  sp.className='hlwrap'; sp.innerHTML=h;
  /* ★ 글자 수가 하나라도 달라지면 형광펜·주석 자리가 어긋난다 — 다르면 되돌린다 */
  if((sp.textContent||'').length !== raw.length) return false;
  tn.parentNode.replaceChild(sp,tn);
  return true;
}
function paint(root){
  if(!ON) return;
  if(!RE_TERM){
    const t=terms().filter(x=>x.length>=3).slice(0,300).map(escRe);
    /* 낱말 경계 — 한국어는 뒤에 조사가 붙으므로 «뒤가 한글이면 무조건 제외» 하면
       «역률을» 같은 흔한 꼴이 죄다 빠진다. 그래서 이렇게 가른다.
         앞 : 한글이면 안 칠한다        → «부하역률» 의 «역률» 조각을 막는다
         뒤 : 한글이 아니거나 조사면 칠한다 → «역률을»(칠함) / «변압기용량»(안 칠함) */
    const JOSA='은|는|이|가|을|를|의|에|와|과|도|만|로|으|부|까|라|나|든|보|처';
    if(t.length) RE_TERM=new RegExp('(?<![가-힣])('+t.join('|')+')(?=$|[^가-힣]|'+JOSA+')','g');
  }
  const hosts=(root||document).querySelectorAll('.qmd,.ez,.easybox,#ovl .pane');
  hosts.forEach(host=>{
    if(host.dataset.hled==='1') return;
    host.dataset.hled='1';
    const w=document.createTreeWalker(host,NodeFilter.SHOW_TEXT,{
      acceptNode(n){
        if(!n.nodeValue||!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if(n.parentElement&&n.parentElement.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const list=[]; let n;
    while((n=w.nextNode())) list.push(n);
    list.forEach(tn=>{ try{ paintNode(tn) }catch(e){globalThis.__q?.(e)} });
  });
}
function clear(root){
  (root||document).querySelectorAll('.hlwrap').forEach(sp=>{
    const p=sp.parentNode; if(!p) return;
    p.replaceChild(document.createTextNode(sp.textContent||''),sp);
    p.normalize&&p.normalize();
  });
  (root||document).querySelectorAll('[data-hled]').forEach(h=>delete h.dataset.hled);
}
function apply(){
  document.body.classList.toggle('hl-on',ON);
  if(ON) paint(); else clear();
  document.querySelectorAll('[data-hlsw]').forEach(b=>b.classList.toggle('on',ON));
}

/* 고르개 — 읽기 결 줄 옆에 */
const boot=setInterval(()=>{
  const row=document.querySelector('.rdsw');
  if(!row) return;
  if(!row.querySelector('[data-hlsw]')){
    const b=document.createElement('button');
    b.type='button'; b.dataset.hlsw=''; b.textContent='색';
    b.title='값·묻는 말·조건·용어에 색과 굵기를 넣습니다';
    b.addEventListener('click',()=>{
      ON=!ON; try{ localStorage.setItem(KEY,ON?'1':'0') }catch(e){globalThis.__q?.(e)}
      apply();
    });
    row.appendChild(b);
  }
  apply(); clearInterval(boot);
},700);
setTimeout(()=>clearInterval(boot),25000);

const w1=setInterval(()=>{ const l=document.getElementById('list'); if(!l) return; clearInterval(w1);
  new MutationObserver(()=>setTimeout(()=>paint(l),80)).observe(l,{childList:true});
  setTimeout(()=>paint(l),300);
},400);
setTimeout(()=>clearInterval(w1),20000);
setInterval(()=>{ const o=document.getElementById('ovl');
  if(o&&o.classList.contains('on')) paint(o); },1200);
})();
