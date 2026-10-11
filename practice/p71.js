/* ═══════════════════════════════════════════════════════════════
   v361~v363 · 이름줄 단추 정리 — 한눈에 · 일반 보기(카드) 둘 다 같은 자리
     문제 줄   : [− 75% ＋][🏷 유형] ───── [이지뷰|원래대로][✂ 잘라 넣기][🗺 미니맵][📐 공식]
     답안 줄   : [✕ 틀림][− n회독 ＋] …
     쉬운 풀이 : [해설 AUTO][✎ 해설 돌리기][− 가 9pt ＋][− √100% ＋][＋ 줄간격 −] …
   맨 위(한눈에 머리줄 · 카드 머리)의 «＋ 회독 · ✕ 틀림» 은 숨긴다 — 회독은 답안 줄 ＋, 틀림은 답안 줄 단추.
   한눈에 칸·카드는 문항을 넘길 때마다 새로 그려지므로 그때마다 제자리로 다시 붙인다.
   ★ v363
     · 누르고 있는 동안에는 단추를 옮기지 않는다 (옮기면 «클릭» 이 사라짐)
     · 그래도 클릭이 안 오면 손을 뗀 자리의 단추를 대신 눌러 준다
     · ◧ 이지뷰 단추는 없앰 · ✂ 잘라 넣기 모양 다듬음
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const q_=e=>{ try{ globalThis.__q?.(e) }catch(x){} };
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const st=document.createElement('style');
st.textContent=`
#ovl .oh #pxOvBtns,#ovl .oh [data-ova="ok"],#ovl .oh [data-ova="no"],#ovl .oh > #ovFs,#ovl .oh > #ovTs{display:none!important}
#list .pcard .pxhd.r [data-hd="ok"],#list .pcard .pxhd.r [data-hd="no"]{display:none!important}
.ev71{display:none!important}
.mv71{order:6;margin-left:6px;height:20px!important;min-height:0!important;padding:0 8px!important;flex:0 0 auto!important;
  border:1px solid var(--line,#e2e8f0);border-radius:6px;background:var(--surface,#fff);color:var(--ink,#0f172a);cursor:pointer;
  font:700 9.5px/1 var(--font-d,system-ui)!important;letter-spacing:0!important;text-transform:none;white-space:nowrap;display:inline-flex;align-items:center;gap:3px}
.mv71:hover{border-color:var(--accent,#2563eb);color:var(--accent,#2563eb)}
.mv71.no71{border-color:#f3b4b4;color:#b42318;background:#fff5f5}
.mv71.run71{background:#1e3a8a;border-color:#1e3a8a;color:#fff}
/* ✂ 잘라 넣기 — ◧ 이지뷰 처럼 */
.mv71.cut71{height:22px!important;padding:0 10px 0 4px!important;border:1px solid #c9d3e6;border-radius:7px;background:#fff;color:#172033;
  font:800 10.5px/1 var(--font-d,system-ui)!important;gap:5px;box-shadow:0 1px 0 rgba(15,23,42,.05)}
.mv71.cut71 i{font-style:normal;display:inline-grid;place-items:center;width:15px;height:15px;border-radius:4px;background:#172033;color:#fff;font-size:9px}
.mv71.cut71:hover{border-color:#172033;color:#172033;background:#f5f7fb}
.mv71.qt71.has{background:#f6f1fd;border-color:#c9b3ea;color:#6b2fb3}
/* 크기 −/＋ (한눈에는 진짜 #ovFs/#ovTs, 카드는 같은 모양 복사본) */
.plab #ovFs,.plab #ovTs,.sz71{order:6;margin-left:6px;height:20px;display:inline-flex;align-items:center;gap:0;flex:0 0 auto!important;
  border:1px solid var(--line,#e2e8f0);border-radius:6px;background:var(--surface,#fff);overflow:hidden;letter-spacing:0}
.plab #ovFs button,.plab #ovTs button,.sz71 button{height:100%;width:20px;flex:0 0 20px!important;border:0!important;border-radius:0!important;background:none!important;
  color:var(--ink,#0f172a)!important;cursor:pointer;padding:0!important;min-width:0!important;font:800 11px/1 var(--font-d,system-ui)!important;user-select:none;touch-action:manipulation}
.plab #ovFs button:disabled,.plab #ovTs button:disabled,.sz71 button:disabled{opacity:.3}
.plab #ovFs .sv,.plab #ovTs .sv,.sz71 b{min-width:0;padding:0 5px;font:700 9.5px/1 var(--font-d,system-ui);color:var(--muted,#64748b);
  border-left:1px solid var(--line,#e2e8f0);border-right:1px solid var(--line,#e2e8f0);height:100%;display:inline-flex;align-items:center;white-space:nowrap}
.plab #qtBtn{order:6;margin-left:6px;height:20px!important;min-height:0!important;padding:0 8px!important;font-size:9.5px!important;letter-spacing:0!important;flex:0 0 auto!important}
/* 줄 바꿈 — 단추가 많아도 줄어들어 사라지지 않게 */
#ovLeft > .plab,#ovRight .seg > .plab,#list .pcard .plabel{flex-wrap:wrap!important;row-gap:3px;height:auto!important;min-height:22px}
/* 문제 줄: 유형은 확대 −/＋ 바로 오른쪽 · 이지뷰|원래대로 · 잘라 넣기는 미니맵 왼쪽 */
#ovLeft > .plab > #qtBtn,.plabel > .qt71{order:0!important;margin-left:4px}
#ovLeft > .plab > .ezxb[data-ezx="off"],.plabel > .ezxb[data-ezx="off"]{order:9!important;margin-left:auto!important}
#ovLeft > .plab > .cut71,.plabel > .cut71{order:9!important;margin-left:5px!important}
#ovLeft > .plab > .mmb,.plabel > .cut71 + .mmb{margin-left:5px!important}
/* 답안 줄: 틀림은 회독 바로 왼쪽 */
#ovRight .seg[data-seg="a"] > .plab > .no71,.plabel > .no71{order:9!important;margin-left:auto!important}
.no71 + .rdk{margin-left:5px!important}
/* 쉬운 풀이 줄 */
#ovRight .seg[data-seg="e"] > .plab > #pxRunBtn,#ovRight .seg[data-seg="e"] > .plab > #ovFs,#ovRight .seg[data-seg="e"] > .plab > #ovTs{order:6!important}
#ovl .seg[data-seg="e"] > .plab > .plabt{display:inline!important}
`;
document.head.appendChild(st);

/* el 을 L 안 ref 의 앞/뒤에 — 이미 그 자리면 건드리지 않음 */
function place(el, L, ref, where){
  if(!el || !L) return;
  if(ref && ref.parentNode===L){
    if(where==='after'){ if(ref.nextSibling===el) return; ref.after(el); }
    else { if(el.nextSibling===ref) return; ref.before(el); }
  }else if(el.parentNode!==L) L.appendChild(el);
}
/* 이름줄 안 단추를 눌러도 이름줄(접기·펴기)까지 올라가지 않게 */
const stopUp=el=>{ if(el && !el.__s71){ el.__s71=1; el.addEventListener('click', e=>e.stopPropagation()); } return el; };
function mk(L, cls, html, attrs){
  let b=L.querySelector(':scope > .'+cls.split(' ')[0]);
  if(!b){ b=document.createElement('button'); b.type='button'; b.className='mv71 '+cls; b.innerHTML=html;
    Object.entries(attrs||{}).forEach(([k,v])=>b.setAttribute(k,v)); stopUp(b); }
  return b;
}
function sw(L){
  let b=L.querySelector(':scope > .ezxb[data-ezx="off"]');
  if(!b){ b=document.createElement('button'); b.type='button'; b.className='ezxb ezsw'; b.dataset.ezx='off'; }
  return b;
}
/* 한눈에 칸을 새로 그리면 옮겨 둔 진짜 단추도 같이 지워진다 → 붙잡아 두었다가 다시 단다 */
const REF={};
function keep(id){
  const live=[...document.querySelectorAll('#'+id)];
  if(!REF[id] && live.length) REF[id]=live[0];
  const r=REF[id];
  live.forEach(x=>{ if(x!==r) x.remove(); });
  return r||null;
}
const nameOf=l=>String((l.childNodes[0]&&l.childNodes[0].textContent)||'').trim();

/* ══ 한눈에 ══ */
function arrangeOv(){
  if(!$('#ovl')?.classList.contains('on')) return;
  const Q=$('#ovLeft > .plab');
  if(Q){
    Q.querySelector(':scope > .ev71')?.remove();
    const mm=Q.querySelector(':scope > .mmb');
    const s=sw(Q), cut=mk(Q,'cut71','<i>✂</i>잘라 넣기',{'data-pxcut':'',title:'가로 절단선을 긋고 칸마다 문제·답으로 나눠 넣습니다'});
    place(cut, Q, mm, 'before'); place(s, Q, cut, 'before');
    const gz=Q.querySelector(':scope > .gvz'), qt=stopUp(keep('qtBtn'));
    if(qt) place(qt, Q, gz, 'after');
  }
  const A=$('#ovRight .seg[data-seg="a"] > .plab');
  if(A){
    const no=mk(A,'no71','✕ 틀림',{title:'틀림으로 기록하고 다음 문항','data-no71':'ov'});
    place(no, A, A.querySelector(':scope > .rdk'), 'before');
  }
  const E=$('#ovRight .seg[data-seg="e"] > .plab');
  if(E){
    const au=E.querySelector(':scope > .ezauto'), gp=E.querySelector(':scope > .ezgap');
    stopUp(au);
    const run=stopUp(keep('pxRunBtn')); if(run){ run.classList.add('mv71','run71'); place(run, E, au, 'after'); }
    const fs=stopUp(keep('ovFs')), ts=stopUp(keep('ovTs'));
    if(gp){ place(ts, E, gp, 'before'); place(fs, E, ts, 'before'); }
    else if(run){ place(fs, E, run, 'after'); place(ts, E, fs, 'after'); }
  }
}

/* ══ 일반 보기(카드) ══ */
function qtPaint(b, id){
  let p=['','',''], n=0;
  try{ p=window.__qtypePath ? window.__qtypePath(id) : p; const t=window.__qtypeOf?window.__qtypeOf(id):''; n=t?((window.__qtypeGroups&&window.__qtypeGroups().get(t))||[]).length:0; }catch(e){q_(e)}
  const any=p.filter(Boolean);
  const h=any.length ? `🏷 ${esc(any.join(' › '))}${n>1?` <small>${n}</small>`:''}` : '🏷 유형';
  if(b.__h!==h){ b.__h=h; b.innerHTML=h; }
  b.classList.toggle('has', any.length>0);
}
function arrangeCards(){
  const fsT=$('#pxFsN')?.textContent||'', tsT=$('#ovTsN')?.textContent||'';
  $$('#list > .pcard').forEach(card=>{
    const id=card.dataset.id; if(!id) return;
    card.querySelectorAll('.plabel').forEach(L=>{
      const nm=nameOf(L);
      if(nm==='문제'){
        const mm=L.querySelector(':scope > .mmb');
        const s=sw(L), cut=mk(L,'cut71','<i>✂</i>잘라 넣기',{'data-pxcut2':id,title:'가로 절단선을 긋고 칸마다 문제·답으로 나눠 넣습니다'});
        if(cut.getAttribute('data-pxcut2')!==id) cut.setAttribute('data-pxcut2',id);
        place(cut, L, mm, 'before'); place(s, L, cut, 'before');
        const qt=mk(L,'qt71','🏷 유형',{'data-qt71':id,title:'이 문제의 유형(대·중·소문항)'});
        if(qt.dataset.qt71!==id) qt.dataset.qt71=id;
        qtPaint(qt, id);
        const first=[...L.children].find(x=>x!==qt);
        if(L.firstElementChild!==qt) place(qt, L, first, 'before');
      }else if(/^답안/.test(nm)){
        const no=mk(L,'no71','✕ 틀림',{title:'틀림으로 기록하고 다음 문항','data-no71':id});
        place(no, L, L.querySelector(':scope > .rdk'), 'before');
      }else if(nm==='쉬운 풀이'){
        const au=L.querySelector(':scope > .ezauto'), gp=L.querySelector(':scope > .ezgap');
        stopUp(au);
        const run=mk(L,'run71','✎ 해설 돌리기',{'data-run71':'1',title:'여러 문항 해설을 한꺼번에 돌립니다'});
        if(au) place(run, L, au, 'after');
        let f=L.querySelector(':scope > .sz71.f'), t=L.querySelector(':scope > .sz71.t');
        if(!f){ f=document.createElement('span'); f.className='sz71 f'; f.title='해설 글자 크기 (5~15pt) — 꾹 누르면 계속';
          f.innerHTML='<button type="button" data-ezfs="-1" data-hold aria-label="글자 작게">−</button><b></b><button type="button" data-ezfs="1" data-hold aria-label="글자 크게">＋</button>'; stopUp(f); }
        if(!t){ t=document.createElement('span'); t.className='sz71 t'; t.title='수식(라텍스) 크기 — 꾹 누르면 계속';
          t.innerHTML='<button type="button" data-ts71="-1" data-hold aria-label="수식 작게">−</button><b></b><button type="button" data-ts71="1" data-hold aria-label="수식 크게">＋</button>'; stopUp(t); }
        const fb=f.querySelector('b'), tb=t.querySelector('b');
        if(fb.textContent!==fsT) fb.textContent=fsT; if(tb.textContent!==tsT) tb.textContent=tsT;
        if(gp){ place(t, L, gp, 'before'); place(f, L, t, 'before'); }
        else { place(f, L, run, 'after'); place(t, L, f, 'after'); }
      }
    });
  });
}

/* 카드용 대신 누르기 */
document.addEventListener('click', e=>{
  const t=e.target.closest && e.target.closest('[data-ts71],[data-run71],[data-no71],[data-qt71]'); if(!t) return;
  e.preventDefault(); e.stopPropagation();
  if(t.dataset.ts71){ $(`#ovTs [data-ts="${t.dataset.ts71}"]`)?.click(); return; }
  if(t.dataset.run71){ $('#pxRunBtn')?.click(); return; }
  if(t.dataset.no71){
    if(t.dataset.no71==='ov'){ $('#ovl .oh [data-ova="no"]')?.click(); return; }
    const card=t.closest('.pcard');
    const b=card && (card.querySelector('.pxhd.r [data-hd="no"]') || card.querySelector('button[data-result="no"]'));
    b ? b.click() : (window.__pracBump && window.__pracBump(t.dataset.no71,'no'));
    /* 한눈에 «틀림» 처럼 다음 문항으로 (체크→다음 이 켜져 있어 이미 넘어갔으면 그대로) */
    const was=t.dataset.no71;
    setTimeout(()=>{ try{
      if(!document.body.classList.contains('oneup')) return;
      const R=Array.isArray(window.SHOWN)?window.SHOWN:[], at=window.ONEAT|0;
      if(R[at] && String(R[at].id)===String(was) && at+1<R.length && window.showAt){
        window.showAt(at+1); document.querySelector('#list > .pcard.show')?.scrollIntoView({block:'start',behavior:'smooth'}); }
    }catch(x){q_(x)} }, 320);
    return;
  }
  if(t.dataset.qt71){
    if(window.__qtIsOpen && window.__qtIsOpen(t.dataset.qt71)) return void window.__qtClose();
    window.__qtOpen && window.__qtOpen(t.dataset.qt71, t);
  }
}, true);

/* ── 누르고 있는 동안은 옮기지 않는다 · 클릭이 사라지면 대신 눌러 준다 ── */
let PRESS=null, CLICKED=false;
const SEL71='.plab button, .plab .ezxb, .plabel button, .plabel .ezxb, #ovFs button, #ovTs button';
document.addEventListener('pointerdown', e=>{
  const b=e.target.closest && e.target.closest(SEL71);
  PRESS = b ? { b, t:Date.now() } : { b:null, t:Date.now() };
  CLICKED=false;
}, true);
document.addEventListener('click', ()=>{ CLICKED=true; }, true);
const release=e=>{
  const p=PRESS; PRESS=null; if(!p || !p.b) return;
  if(e.type!=='pointerup' || Date.now()-p.t>700 || p.b.hasAttribute('data-hold')) return;
  const x=e.clientX, y=e.clientY;
  setTimeout(()=>{
    if(CLICKED || !p.b.isConnected) return;
    const at=document.elementFromPoint(x,y);
    if(at && (at===p.b || p.b.contains(at))) p.b.click();   /* 진짜 클릭이 안 왔을 때만 */
  }, 120);
  soon();
};
document.addEventListener('pointerup', release, true);
document.addEventListener('pointercancel', release, true);

function arrange(){
  if(PRESS && Date.now()-PRESS.t<3000) return;
  try{ arrangeOv() }catch(e){q_(e)}
  try{ arrangeCards() }catch(e){q_(e)}
  try{ window.__ezxPaintSw && window.__ezxPaintSw() }catch(e){q_(e)}
}
let raf=0;
function soon(){ if(raf) return; raf=requestAnimationFrame(()=>{ raf=0; arrange(); }); }
['#ovl','#list'].forEach(sel=>{
  (function watch(){
    const o=$(sel); if(!o) return void setTimeout(watch,400);
    new MutationObserver(soon).observe(o,{ childList:true, subtree:true });
    soon();
  })();
});
setInterval(soon, 700);
})();

/* ═══════════════════════════════════════════════════════════════
   v363 · 한눈에 맨 윗줄(닫기 왼쪽)에 거르기·랜덤 — 목록 위 «찾기·랜덤» 칸과 «연동»
     [연도 ▾(고른 게 없으면 전체)] [회차 ▾] [빈출+확률순] (금)(은)(동)(똥) [📅 최신순] [회독 −] [틀림만]
   · 빈출·금은동똥·최신순·회독 − 는 목록 쪽 진짜 단추를 대신 누른다 → 켜짐 표시도 그쪽을 그대로 따라감
   · 연도·회차는 여러 개 고를 수 있다: 하나씩이면 원래 연도·회차 칸을 바꾸고, 여럿이면 «이것만» 목록으로
   · 틀림만 = 틀림 기록이 있는 문항만 (연도·회차와 겹쳐 걸림)
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const q_=e=>{ try{ globalThis.__q?.(e) }catch(x){} };
const rowsAll=()=>{ try{ return window.__pracSwap ? [] : (Array.isArray(ROWS)?ROWS:[]) }catch(e){ return [] } };
const say=m=>{ try{ (window.__pxToast||console.log)(m) }catch(e){} };

const st=document.createElement('style');
st.textContent=`
#ovf71{display:inline-flex;align-items:center;gap:4px;margin-left:auto;margin-right:8px;flex-wrap:nowrap;min-width:0}
#ovf71 .g{display:inline-flex;align-items:center;gap:2px;padding:0 4px 0 0}
#ovf71 .g + .g{border-left:1px solid var(--line,#e2e8f0);padding-left:6px}
#ovf71 button.c{height:26px;padding:0 9px;border:1px solid var(--line,#e2e8f0);border-radius:8px;background:var(--surface,#fff);color:var(--ink,#0f172a);
  font:700 11px/1 var(--font-d,system-ui);cursor:pointer;white-space:nowrap}
#ovf71 button.c:hover{border-color:var(--accent,#2563eb)}
#ovf71 button.c.on{background:#172033;border-color:#172033;color:#fff}
#ovf71 button.t{min-width:28px;padding:0 7px}
#ovf71 button.t-g{background:#fff8e1;border-color:#f0cf6b;color:#8a6100} #ovf71 button.t-g.on{background:#d4a017;border-color:#d4a017;color:#fff}
#ovf71 button.t-s{background:#f4f6f9;border-color:#cdd5e0;color:#475569} #ovf71 button.t-s.on{background:#8592a6;border-color:#8592a6;color:#fff}
#ovf71 button.t-b{background:#fbf1ea;border-color:#e3b896;color:#8a4b1d} #ovf71 button.t-b.on{background:#b06a35;border-color:#b06a35;color:#fff}
#ovf71 button.t-r{background:#f3efe9;border-color:#cbbba5;color:#5b4a35} #ovf71 button.t-r.on{background:#6b5640;border-color:#6b5640;color:#fff}
#ovf71 button.sel{padding:0 8px 0 9px} #ovf71 button.sel.on{background:#eef3ff;border-color:#93acec;color:#1e3a8a}
#ovf71 .n71{font:800 9px/1 var(--font-d,system-ui);margin-left:3px;opacity:.8}
.ovf71pop{position:fixed;z-index:2147483100;display:none;min-width:150px;max-height:70vh;overflow:auto;background:#fff;border:1px solid #cdd5e0;border-radius:10px;
  box-shadow:0 10px 30px rgba(15,23,42,.18);padding:6px}
.ovf71pop.on{display:block}
.ovf71pop .gr{display:grid;grid-template-columns:repeat(4,auto);gap:3px;user-select:none;-webkit-user-select:none;touch-action:none}
.ovf71pop .gr.s{grid-template-columns:repeat(3,auto)}
.ovf71pop label{display:flex;align-items:center;gap:4px;padding:3px 7px 3px 5px;border:1px solid #e3e8f0;border-radius:6px;cursor:pointer;
  font:700 11.5px/1.15 var(--font-d,system-ui);color:#172033;white-space:nowrap;background:#fff}
.ovf71pop label input{margin:0;width:12px;height:12px;pointer-events:none}
.ovf71pop label:hover{background:#f3f6fb}
.ovf71pop label.ck{background:#eef3ff;border-color:#93acec;color:#1e3a8a}
.ovf71pop .tip{font:600 10px/1.3 var(--font-d,system-ui);color:#64748b;padding:2px 2px 5px}
.ovf71pop .ft{display:flex;gap:6px;border-top:1px solid #eef1f6;margin-top:4px;padding-top:6px}
.ovf71pop .ft button{flex:1;height:26px;border:1px solid #cdd5e0;border-radius:7px;background:#fff;color:#172033;font:700 11px/1 var(--font-d,system-ui);cursor:pointer}
.ovf71pop .ft button.go{background:#172033;border-color:#172033;color:#fff}
`;
document.head.appendChild(st);

/* ── 연도·회차 여러 개 · 틀림만 ── */
const SEL={ y:new Set(), s:new Set() };
let WRONG=false, MINE=false;          /* MINE = «이것만» 목록을 지금 이 칸이 걸었나 */
/* ★ v364 — 연도는 2026~2008 만 (그 앞 옛 자료는 목록에서 뺌) */
const optsOf=k=>{ const el=$(k==='y'?'#fYear':'#fSess'); const v=el?[...el.options].map(o=>o.value).filter(Boolean):[];
  return k==='y' ? v.filter(x=>+x>=2008 && +x<=2026).sort((a,b)=>b-a) : v; };
const wrongIds=()=>{ const P=(window.__pracProg&&window.__pracProg())||{}; return new Set(Object.keys(P).filter(k=>{ const p=P[k]; return p && ((p.no|0)>0 || p.r==='no'); })); };
function apply(){
  const fy=$('#fYear'), fs=$('#fSess'); if(!fy||!fs) return;
  const ys=[...SEL.y], ss=[...SEL.s];
  const multi = ys.length>1 || ss.length>1;
  const wantY = (!multi && ys.length===1) ? ys[0] : '', wantS = (!multi && ss.length===1) ? ss[0] : '';
  let ch=false;
  if(fy.value!==wantY){ fy.value=wantY; ch=true; }
  if(fs.value!==wantS && [...fs.options].some(o=>o.value===wantS)){ fs.value=wantS; ch=true; }
  if(ch) fy.dispatchEvent(new Event('change'));
  if(multi || WRONG){
    const W=WRONG?wrongIds():null;
    const ids=rowsAll().filter(r=>(!ys.length||ys.includes(String(r.year))) && (!ss.length||ss.includes(String(r.session))) && (!W||W.has(String(r.id)))).map(r=>String(r.id));
    if(!ids.length){ say(WRONG?'틀림 기록이 있는 문항이 없습니다':'고른 연도·회차에 문항이 없습니다'); if(WRONG){ WRONG=false; } paint(); if(MINE){ MINE=false; window.__pracOnly&&window.__pracOnly(null); } return; }
    MINE=true; window.__pracOnly && window.__pracOnly(ids);
  }else if(MINE){ MINE=false; window.__pracOnly && window.__pracOnly(null); }
  fixOv(250);
  paint();
}
/* 한눈에서 보던 문항이 새 목록에 없으면 새 목록의 첫 문항으로 */
function fixOv(ms){
  setTimeout(()=>{ try{
    const R=Array.isArray(window.SHOWN)?window.SHOWN:[]; if(!R.length) return;
    const ov=(()=>{ try{ return OVID!=null?String(OVID):'' }catch(e){ return '' } })();
    if($('#ovl')?.classList.contains('on') && !R.some(r=>String(r.id)===ov) && window.ovOpen) window.ovOpen(R[0].id);
  }catch(e){q_(e)} }, ms);
}
/* 다른 데서 연도·회차 칸을 바꿨으면 이쪽 고른 것도 맞춘다 */
function pull(){
  if(MINE) return;
  const fy=$('#fYear')?.value||'', fs=$('#fSess')?.value||'';
  SEL.y=new Set(fy?[fy]:[]); SEL.s=new Set(fs?[fs]:[]);
}

/* ── 고르기 창 ── */
let POP=null, PK='';
function pop(){
  if(POP) return POP;
  POP=document.createElement('div'); POP.className='ovf71pop';
  document.body.appendChild(POP);
  POP.addEventListener('click', e=>{
    e.stopPropagation();
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.a==='all'){ SEL[PK].clear(); close(); apply(); }
    if(b.dataset.a==='ok'){ SEL[PK]=new Set($$('input:checked',POP).map(i=>i.value)); close(); apply(); }
  });
  POP.addEventListener('keydown', e=>e.stopPropagation());
  /* ★ v364 — 누르고 끌면 드르륵 체크 (처음 누른 칸의 반대 상태로 쭉) */
  let DR=null;
  const setL=(l,on)=>{ const i=l.querySelector('input'); if(i.checked!==on){ i.checked=on; l.classList.toggle('ck',on); } };
  POP.addEventListener('pointerdown', e=>{
    const l=e.target.closest('.gr label'); if(!l) return;
    e.preventDefault();
    const all=[...POP.querySelectorAll('.gr label')];
    DR={ on:!l.querySelector('input').checked, all, a:all.indexOf(l), was:all.map(x=>x.querySelector('input').checked) }; setL(l, DR.on);
    try{ POP.setPointerCapture(e.pointerId) }catch(x){}
  });
  POP.addEventListener('pointermove', e=>{
    if(!DR) return;
    const l=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('.ovf71pop .gr label'); if(!l) return;
    /* 처음 칸 ~ 지금 칸 사이를 «순서대로» 전부 (26→19 로 끌면 26·25·…·19) — 범위 밖은 원래대로 */
    const b=DR.all.indexOf(l), lo=Math.min(DR.a,b), hi=Math.max(DR.a,b);
    DR.all.forEach((x,i)=>setL(x, (i>=lo&&i<=hi) ? DR.on : DR.was[i]));
  });
  const end=()=>{ DR=null; };
  POP.addEventListener('pointerup', end); POP.addEventListener('pointercancel', end);
  POP.addEventListener('click', e=>{ if(e.target.closest('.gr label')) e.preventDefault(); }, true);   /* 라벨 기본 토글 막음 (위에서 직접) */
  document.addEventListener('pointerdown', e=>{ if(POP.classList.contains('on') && !POP.contains(e.target) && !e.target.closest('#ovf71 .sel')) close(); }, true);
  return POP;
}
function open(k, anchor){
  const P=pop(); if(P.classList.contains('on') && PK===k) return close();
  PK=k; pull();
  const vs=optsOf(k);
  P.innerHTML=`<div class="tip">누르고 끌면 쭉 체크 · 다시 누르고 끌면 쭉 해제</div><div class="gr ${k}">`
    + vs.map(v=>`<label class="${SEL[k].has(v)?'ck':''}"><input type="checkbox" value="${v}"${SEL[k].has(v)?' checked':''}>${k==='y'?String(v).slice(2)+'년':v+'회'}</label>`).join('')
    + `</div><div class="ft"><button type="button" data-a="all">전체</button><button type="button" class="go" data-a="ok">적용</button></div>`;
  P.classList.add('on');
  const r=anchor.getBoundingClientRect();
  P.style.left=Math.max(8, Math.min(r.left, innerWidth-P.offsetWidth-8))+'px';
  P.style.top=(r.bottom+6)+'px';
}
function close(){ POP && POP.classList.remove('on'); }

/* ── 단추줄 ── */
const R_=s=>$('#dRand '+s);
const isOn=el=>!!el && (el.classList.contains('on') || el.getAttribute('aria-pressed')==='true');
function mount(){
  const oh=$('#ovl .oh'), cl=$('#ovClose'); if(!oh||!cl) return;
  let w=$('#ovf71');
  if(!w){
    w=document.createElement('span'); w.id='ovf71';
    w.innerHTML=`
      <span class="g">
        <button type="button" class="c sel" data-f="y" title="연도 — 여러 개 고를 수 있음 · 안 고르면 전체">연도 ▾</button>
        <button type="button" class="c sel" data-f="s" title="회차 — 여러 개 고를 수 있음 · 안 고르면 전체">회차 ▾</button>
      </span>
      <span class="g">
        <button type="button" class="c" data-f="hot" title="빈출 랜덤 + 확률 높은 순 — 다시 누르면 끔">🔥 빈출+확률순</button>
        <button type="button" class="c" data-f="seq" title="최신 회차부터 차례로 — 다시 누르면 끔">📅 최신순</button>
        <button type="button" class="c t t-g" data-f="tier" data-k="g" title="금 등급 (여러 개 함께)">금</button>
        <button type="button" class="c t t-s" data-f="tier" data-k="s" title="은 등급">은</button>
        <button type="button" class="c t t-b" data-f="tier" data-k="b" title="동 등급">동</button>
        <button type="button" class="c t t-r" data-f="tier" data-k="r" title="똥 등급">똥</button>
      </span>
      <span class="g">
        <button type="button" class="c" data-f="ck" title="N번 푼(회독한) 문항 빼기">회독 −<span class="n71"></span></button>
        <button type="button" class="c" data-f="wrong" title="틀림 기록이 있는 문항만">✕ 틀림만</button>
      </span>`;
    w.addEventListener('click', e=>{
      const b=e.target.closest('button[data-f]'); if(!b) return;
      e.preventDefault(); e.stopPropagation();
      try{ act(b); }catch(x){q_(x)}
      if(b.dataset.f!=='y' && b.dataset.f!=='s') fixOv(500);
      setTimeout(paint, 60); setTimeout(paint, 400);
    });
    w.addEventListener('keydown', e=>e.stopPropagation());
  }
  if(w.nextSibling!==cl) cl.before(w);
  paint();
}
function act(b){
  const f=b.dataset.f;
  if(f==='y'||f==='s') return open(f, b);
  if(f==='tier'){ const t=R_(`[data-rtier="${b.dataset.k}"]`); t ? t.click() : say('등급 단추를 찾지 못했습니다'); return; }
  if(f==='hot'){
    const hot=R_('[data-rand="hot"]'), ord=R_('[data-rmod="ord"]');
    if(!hot) return say('랜덤 단추를 찾지 못했습니다');
    if(isOn(hot) && isOn(ord)){ $('#randClear')?.click(); ord.click(); return; }   /* 둘 다 켜져 있으면 끔 */
    if(ord && !isOn(ord)) ord.click();
    if(!isOn(hot)) hot.click();
    return;
  }
  if(f==='seq'){ const s=R_('[data-rand="seq"]'); if(!s) return; if(isOn(s)) $('#randClear')?.click(); else s.click(); return; }
  if(f==='ck'){ R_('[data-rmod="ck"]')?.click(); return; }
  if(f==='wrong'){ WRONG=!WRONG; pull(); apply(); return; }
}
function paint(){
  const w=$('#ovf71'); if(!w) return;
  if(!MINE) pull();
  const tog=(sel,on)=>{ const b=w.querySelector(sel); if(b && b.classList.contains('on')!==!!on) b.classList.toggle('on',!!on); };
  const lab=(k,nm,unit)=>{ const b=w.querySelector(`[data-f="${k}"]`); const v=[...SEL[k]].sort();
    const t=v.length?(v.length===1?(k==='y'?v[0]+'년':'제'+v[0]+'회'):`${nm} ${v.length}개`)+' ▾':nm+' ▾'; if(b.textContent!==t) b.textContent=t; tog(`[data-f="${k}"]`, v.length>0); };
  lab('y','연도'); lab('s','회차');
  tog('[data-f="hot"]', isOn(R_('[data-rand="hot"]')) && isOn(R_('[data-rmod="ord"]')));
  ['g','s','b','r'].forEach(k=>tog(`[data-f="tier"][data-k="${k}"]`, isOn(R_(`[data-rtier="${k}"]`))));
  tog('[data-f="seq"]', isOn(R_('[data-rand="seq"]')));
  tog('[data-f="ck"]', isOn(R_('[data-rmod="ck"]')));
  const n=w.querySelector('[data-f="ck"] .n71'), nt=window.__pracCkN?String(window.__pracCkN()):''; if(n && n.textContent!==nt) n.textContent=nt;
  tog('[data-f="wrong"]', WRONG);
}
setInterval(()=>{ try{ mount() }catch(e){q_(e)} }, 800);
})();
