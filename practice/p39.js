/* practice.html 에서 분리 (v341) — 원래 16505번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);

/* ══ ① 여러 줄 수식을 한 줄로 이어 붙인다 ══
   여는 $$ (또는 \[) 를 만나면 닫을 때까지 모아서 한 줄로 넘긴다.
   글 자체는 안 건드린다 — 그릴 때만 이어 붙인다. */
function joinMath(src){
  const lines=String(src==null?'':src).split('\n');
  const out=[]; let buf=null, close='';
  for(const raw of lines){
    const t=raw.trim();
    if(buf===null){
      if(t.startsWith('$$') && !(t.length>4 && t.endsWith('$$'))){ buf=[t]; close='$$'; continue; }
      if(t.startsWith('\\[') && !t.endsWith('\\]')){ buf=[t]; close='\\]'; continue; }
      out.push(raw); continue;
    }
    buf.push(t);
    /* 닫는 $$ 를 안 쓴 글이 뒤를 통째로 삼키지 않게 — 40줄에서 손을 뗀다 */
    if(t.endsWith(close)){ out.push(buf.join(' ')); buf=null; }
    else if(buf.length>40){ out.push(...buf); buf=null; }
  }
  if(buf) out.push(...buf);
  return out.join('\n');
}
['mdRich','mdLite'].forEach(k=>{
  const f=window[k];
  if(typeof f!=='function' || f.__mlmath) return;
  const w=function(src){ return f.call(this, joinMath(src)); };
  w.__mlmath=1;
  try{ window[k]=w }catch(e){globalThis.__q?.(e)}
});

/* ══ ② 글자 크기 · 표 간격 ══ */
const KEY='prac:edview:v1';
const STEPS=[11,12,13,14,15,16,17,18,20];
const DENS={
  s:{ tp:'1px 5px',  tf:'.92em', tlh:'1.25', nm:'좁게' },
  m:{ tp:'4px 8px',  tf:'1em',   tlh:'1.5',  nm:'보통' },
  l:{ tp:'8px 12px', tf:'1.02em',tlh:'1.75', nm:'넓게' }
};
let V=(()=>{ try{ return Object.assign({fs:13,td:'m'},JSON.parse(localStorage.getItem(KEY)||'{}')) }
            catch(e){ return {fs:13,td:'m'} } })();
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(V)) }catch(e){globalThis.__q?.(e)} };

function paint(W){
  if(!W) return;
  const d=DENS[V.td]||DENS.m;
  W.style.setProperty('--edfs',V.fs+'px');
  W.style.setProperty('--edpf',(V.fs+1)+'px');
  W.style.setProperty('--edlh',V.fs>=16?'1.75':'1.7');
  W.style.setProperty('--edtp',d.tp);
  W.style.setProperty('--edtf',d.tf);
  W.style.setProperty('--edtlh',d.tlh);
  const n=W.querySelector('#edFsN'); if(n) n.textContent=V.fs;
  W.querySelectorAll('.edvw button[data-td]').forEach(b=>b.classList.toggle('on',b.dataset.td===V.td));
}

function mount(W){
  if(!W || W.querySelector('.edvw')) return;
  const tools=W.querySelector('.tools'); if(!tools) return;

  const g=document.createElement('span');
  g.className='edvw';
  g.innerHTML=`<button type="button" data-fs="-1" title="글자 작게">가−</button>
    <b id="edFsN">13</b>
    <button type="button" data-fs="1" title="글자 크게">가＋</button>
    <span>표</span>
    <button type="button" data-td="s" title="칸 여백을 줄여 표를 좁게">좁게</button>
    <button type="button" data-td="m" title="기본 간격">보통</button>
    <button type="button" data-td="l" title="칸 여백을 늘려 읽기 편하게">넓게</button>`;
  const hint=tools.querySelector('.hint');
  hint ? tools.insertBefore(g,hint) : tools.appendChild(g);

  g.addEventListener('mousedown',e=>{ if(e.target.closest('button')) e.preventDefault() });
  g.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    e.preventDefault(); e.stopPropagation();
    if(b.dataset.fs){
      const i=STEPS.indexOf(V.fs);
      const j=Math.max(0,Math.min(STEPS.length-1,(i<0?2:i)+(+b.dataset.fs)));
      V.fs=STEPS[j];
    }else if(b.dataset.td) V.td=b.dataset.td;
    save(); paint(W);
  });

  paint(W);
}

/* ── 여러 줄 수식 틀 넣기 ── */
const TPL='\n$$\n\\begin{aligned}\nP &= V I \\cos\\theta \\\\\n  &= 200 \\times 5 \\times 0.8 = 800\\ [\\text{W}]\n\\end{aligned}\n$$\n';
function addAligned(W){
  const bar=W.querySelector('.edbar');
  if(!bar || bar.querySelector('#edAlign')) return;
  const b=document.createElement('button');
  b.type='button'; b.id='edAlign'; b.textContent='≡ 여러 줄 수식';
  b.title='여러 줄로 이어지는 계산을 = 위치를 맞춰 세로로 씁니다 (줄바꿈은 \\\\)';
  const where=bar.querySelector('.where');
  where ? bar.insertBefore(b,where) : bar.appendChild(b);
  b.addEventListener('mousedown',e=>e.preventDefault());
  b.onclick=e=>{
    e.preventDefault(); e.stopPropagation();
    const ta=W.querySelector('#edTa'); if(!ta) return;
    const s=ta.selectionStart, en=ta.selectionEnd;
    ta.value=ta.value.slice(0,s)+TPL+ta.value.slice(en);
    ta.selectionStart=ta.selectionEnd=s+TPL.length;
    ta.focus();
    ta.dispatchEvent(new Event('input',{bubbles:true}));
  };
}

/* ── 찾아 바꾸기 — 잘못 들어간 글자가 여러 군데면 한 번에 고친다 ── */
function addFindReplace(W){
  const bar=W.querySelector('.edbar');
  if(!bar || bar.querySelector('#edFR')) return;
  const b=document.createElement('button');
  b.type='button'; b.id='edFR'; b.textContent='🔍 찾아 바꾸기';
  b.title='이 칸 안에서 같은 글자를 한꺼번에 바꾸거나 지웁니다';
  const where=bar.querySelector('.where');
  where ? bar.insertBefore(b,where) : bar.appendChild(b);
  b.addEventListener('mousedown',e=>e.preventDefault());

  let pop=null;
  function closePop(){ if(pop){ pop.remove(); pop=null; } }
  b.onclick=e=>{
    e.preventDefault(); e.stopPropagation();
    if(pop){ closePop(); return; }
    const ta=W.querySelector('#edTa'); if(!ta) return;
    pop=document.createElement('div');
    pop.className='frpop';
    pop.innerHTML=`
      <div class="frrow">
        <input type="text" class="frfind" placeholder="찾을 말 (예: mathrm)">
        <input type="text" class="frrep" placeholder="바꿀 말 (비워두면 지웁니다)">
      </div>
      <div class="frrow2">
        <span class="frmsg"></span>
        <span class="sp"></span>
        <button type="button" class="frgo">모두 바꾸기</button>
        <button type="button" class="frclose">닫기</button>
      </div>`;
    b.after(pop);
    const fi=pop.querySelector('.frfind'), ri=pop.querySelector('.frrep'), msg=pop.querySelector('.frmsg');
    fi.focus();
    pop.querySelector('.frclose').onclick=closePop;
    const go=()=>{
      const find=fi.value; if(!find){ msg.textContent='찾을 말을 먼저 넣어주세요.'; return; }
      const rep=ri.value;
      const parts=ta.value.split(find);
      const n=parts.length-1;
      if(!n){ msg.textContent='이 칸엔 없습니다.'; return; }
      const s0=ta.selectionStart;
      ta.value=parts.join(rep);
      ta.selectionStart=ta.selectionEnd=Math.min(s0, ta.value.length);
      ta.dispatchEvent(new Event('input',{bubbles:true}));
      msg.textContent=`${n}곳 바꿨습니다.`;
    };
    pop.querySelector('.frgo').onclick=go;
    ri.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); go(); } });
    fi.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); go(); } });
    pop.addEventListener('keydown',ev=>{ if(ev.key==='Escape'){ ev.preventDefault(); closePop(); ta.focus(); } });
  };
}

/* 창은 «처음 고쳐 쓰기를 누를 때» 만들어진다 — 생길 때까지 지켜본다 */
const t=setInterval(()=>{
  const W=$('.edw'); if(!W) return;
  mount(W);                 /* 크기·간격 손잡이 */
  addAligned(W);            /* 단추 줄(v140)이 늦게 붙어도 그때 끼운다 */
  addFindReplace(W);        /* 찾아 바꾸기 단추 */
  if(W.querySelector('.edvw') && W.querySelector('#edAlign')) clearInterval(t);
},400);

window.__pracEdView=()=>V;
})();
