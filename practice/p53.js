/* practice.html 에서 분리 (v341) — 원래 20110번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */


/* ══════════════════════════════════════════════════════════════
   v244 · 잘라 나누기 — 검수 화면 가지 않고 여기서 바로

   원본 한 장에 문제와 답이 같이 찍혀 있거나, 위아래에 쓸데없는 여백·머리글이
   붙어 있는 일이 잦다. 여태 그걸 고치려면 «검수» 화면까지 가야 했다.
   문항 카드와 «한눈에» 에서 바로 하도록 옮겨 왔다.

   하는 일
     · 그림 위를 누르면 그 자리에 가로 절단선이 생긴다. 끌어서 옮기고 ×로 지운다.
     · 선으로 나뉜 칸마다 «문제 / 답 / 버림» 을 고른다.
     · 저장하면 문제로 고른 칸을 위에서 아래로 이어 붙여 문제 그림으로,
       답으로 고른 칸을 이어 붙여 답 그림으로 올린다. 버림은 그냥 사라진다.

   ★ 카드의 «✂ 자르기» 와 다르다 — 그것은 보여 주는 틀만 바꾸고 파일은 그대로다.
     이것은 저장소의 그림 파일 자체를 새로 만든다.
   ══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const $ = (s,r=document)=>r.querySelector(s);
/* 이 화면의 문항 목록은 앞 script 의 ROWS 에 들어 있다 (classic script 끼리 전역을 나눠 쓴다) */
const allRows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

/* ── 모양 ── */
const css = document.createElement('style');
css.textContent = `
.cutw{position:fixed;inset:0;z-index:6000;display:none;background:rgba(15,23,42,.62);
  backdrop-filter:blur(2px);align-items:center;justify-content:center;padding:16px}
.cutw.on{display:flex}
.cutbox{width:min(1060px,100%);max-height:94vh;display:flex;flex-direction:column;
  background:var(--paper,#fff);border-radius:16px;overflow:hidden;
  box-shadow:0 24px 70px rgba(2,6,23,.45)}
.cuth{display:flex;align-items:center;gap:8px;padding:11px 14px;
  border-bottom:1px solid var(--rule,#e6eaf0);flex-wrap:wrap}
.cuth b{font:700 13.5px/1 var(--font-d,system-ui);color:var(--ink,#0f172a)}
.cuth .sp{flex:1}
.cutb{padding:12px 14px;overflow:auto;flex:1}
.cutstage{position:relative;display:inline-block;max-width:100%;
  border:1px solid var(--rule,#e6eaf0);border-radius:10px;overflow:hidden;background:#fff}
.cutstage canvas{display:block;max-width:100%;height:auto;cursor:crosshair}
.cutline{position:absolute;left:0;right:0;height:0;border-top:2px dashed #1d4ed8;
  cursor:ns-resize;z-index:5}
.cutline::after{content:'';position:absolute;left:0;right:0;top:-7px;height:14px}
.cutline i{position:absolute;right:4px;top:-11px;width:20px;height:20px;border-radius:50%;
  background:#1d4ed8;color:#fff;font:700 12px/20px var(--font-d,system-ui);
  text-align:center;font-style:normal;cursor:pointer}
.cutlab{position:absolute;left:6px;padding:1px 7px;border-radius:999px;
  font:700 10.5px/17px var(--font-d,system-ui);z-index:4;pointer-events:none}
.cutlab.q{background:#dbeafe;color:#1e40af}
.cutlab.a{background:#dcfce7;color:#15803d}
.cutlab.x{background:#f1f5f9;color:#64748b}
.cutband{position:absolute;left:0;right:0;z-index:2;pointer-events:none}
.cutband.q{background:rgba(29,78,216,.08)}
.cutband.a{background:rgba(21,128,61,.08)}
.cutband.x{background:rgba(100,116,139,.16)}
.cutsegs{display:grid;gap:6px;margin-top:11px}
.cutseg{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;
  border:1px solid var(--rule,#e6eaf0);background:var(--surface-2,#f8fafc)}
.cutseg span.n{font:700 11px/1 var(--font-d,system-ui);color:var(--ink-2,#64748b);min-width:52px}
.cutseg .px{font:500 10.5px/1 var(--font-d,system-ui);color:var(--muted,#94a3b8);flex:1}
.cutseg button{height:26px;padding:0 11px;border-radius:8px;cursor:pointer;
  border:1px solid var(--rule,#e2e8f0);background:#fff;color:var(--ink,#0f172a);
  font:700 11px/1 var(--font-d,system-ui)}
.cutseg button.on[data-v="q"]{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
.cutseg button.on[data-v="a"]{background:#15803d;border-color:#15803d;color:#fff}
.cutseg button.on[data-v="x"]{background:#64748b;border-color:#64748b;color:#fff}
.cutf{display:flex;align-items:center;gap:8px;padding:11px 14px;
  border-top:1px solid var(--rule,#e6eaf0);flex-wrap:wrap}
.cutf .msg{flex:1;font:500 11.5px/1.5 var(--font-d,system-ui);color:var(--muted,#64748b)}
.cutw button.b{height:31px;padding:0 12px;border-radius:9px;cursor:pointer;
  border:1px solid var(--rule,#e2e8f0);background:#fff;color:var(--ink,#0f172a);
  font:700 11.5px/1 var(--font-d,system-ui)}
.cutw button.b:hover{background:var(--surface-2,#f6f8fb)}
.cutw button.b.go{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
.cutw button.b:disabled{opacity:.45;cursor:default}
.cutnote{font:500 11px/1.55 var(--font-d,system-ui);color:var(--muted,#64748b);margin:0 0 9px}
`;
document.head.appendChild(css);

/* ── 창 ── */
let W=null, CV=null, STAGE=null, SEGBOX=null, MSG=null;
let IMG=null, LINES=[], ROW=null, FROM='q', SLOT=[];   /* SLOT[i] = 'q'|'a'|'x' */

function build(){
  if(W) return W;
  W=document.createElement('div'); W.className='cutw';
  W.innerHTML=`<div class="cutbox">
    <div class="cuth">
      <b data-nm>잘라 나누기</b><span class="sp"></span>
      <button type="button" class="b" data-ai>AI로 경계 찾기</button>
      <button type="button" class="b" data-clr>선 지우기</button>
      <button type="button" class="b" data-x>닫기</button>
    </div>
    <div class="cutb">
      <p class="cutnote">그림 위를 <b>누르면</b> 그 자리에 절단선이 생깁니다. 선을 <b>끌어서</b> 옮기고,
        오른쪽 <b>×</b>로 지웁니다. 나뉜 칸마다 <b>문제 · 답 · 버림</b>을 고르세요.<br>
        저장하면 문제로 고른 칸끼리, 답으로 고른 칸끼리 위에서 아래로 이어 붙여 올립니다.
        <b>버림</b>은 사라집니다 — 여백·머리글을 이걸로 떼어 냅니다.</p>
      <div class="cutstage" data-stage><canvas></canvas></div>
      <div class="cutsegs" data-segs></div>
    </div>
    <div class="cutf">
      <span class="msg" data-msg></span>
      <button type="button" class="b" data-x2>취소</button>
      <button type="button" class="b go" data-save>잘라서 저장</button>
    </div>
  </div>`;
  document.body.appendChild(W);
  CV=$('canvas',W); STAGE=$('[data-stage]',W); SEGBOX=$('[data-segs]',W); MSG=$('[data-msg]',W);

  W.addEventListener('click',e=>{ if(e.target===W) close(); });
  $('[data-x]',W).onclick=close; $('[data-x2]',W).onclick=close;
  $('[data-clr]',W).onclick=()=>{ LINES=[]; paint(); };
  $('[data-ai]',W).onclick=askAI;
  $('[data-save]',W).onclick=save;

  /* 그림을 누르면 그 자리에 선 */
  CV.addEventListener('pointerdown',e=>{
    const b=CV.getBoundingClientRect();
    const y=Math.round((e.clientY-b.top)/b.height*CV.height);
    if(y<8||y>CV.height-8) return;
    LINES.push(y); paint();
  });
  addEventListener('keydown',e=>{ if(W.classList.contains('on')&&e.key==='Escape') close(); });
  return W;
}

const say=(t)=>{ if(MSG) MSG.textContent=t||''; };
function close(){ W&&W.classList.remove('on'); IMG=null; LINES=[]; ROW=null; }

/* ── 칸 나누기 ── */
function segs(){
  if(!IMG) return [];
  const ys=[0,...LINES.slice().sort((a,b)=>a-b),CV.height];
  const out=[];
  for(let i=0;i<ys.length-1;i++) if(ys[i+1]-ys[i]>10) out.push([ys[i],ys[i+1]]);
  return out;
}

function paint(){
  if(!IMG) return;
  const g=CV.getContext('2d');
  g.fillStyle='#fff'; g.fillRect(0,0,CV.width,CV.height);
  g.drawImage(IMG,0,0,CV.width,CV.height);

  $$('.cutline,.cutlab,.cutband',STAGE).forEach(x=>x.remove());
  const list=segs();
  /* 칸 배정이 모자라면 채운다 — 처음 열면 위=문제, 아래=답 */
  while(SLOT.length<list.length) SLOT.push(SLOT.length?'a':'q');
  SLOT.length=list.length;

  const pct=v=>v/CV.height*100;
  list.forEach(([a,b],i)=>{
    const v=SLOT[i]||'x';
    const band=document.createElement('div');
    band.className='cutband '+v;
    band.style.cssText=`top:${pct(a)}%;height:${pct(b-a)}%`;
    STAGE.appendChild(band);
    const lab=document.createElement('div');
    lab.className='cutlab '+v;
    lab.textContent=`칸 ${i+1} · ${v==='q'?'문제':v==='a'?'답':'버림'}`;
    lab.style.top=`calc(${pct(a)}% + 5px)`;
    STAGE.appendChild(lab);
  });

  LINES.slice().sort((a,b)=>a-b).forEach(y=>{
    const el=document.createElement('div');
    el.className='cutline'; el.style.top=pct(y)+'%';
    el.innerHTML='<i>×</i>';
    el.querySelector('i').onclick=ev=>{ ev.stopPropagation();
      LINES=LINES.filter(v=>v!==y); paint(); };
    el.addEventListener('pointerdown',ev=>{
      ev.preventDefault(); ev.stopPropagation();
      const box=CV.getBoundingClientRect(); const from=y;
      const mv=e2=>{
        const ny=Math.round(Math.min(Math.max((e2.clientY-box.top)/box.height,0),1)*CV.height);
        LINES=LINES.map(v=>v===y?ny:v); y=ny; el.style.top=pct(ny)+'%';
      };
      const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up);
        if(y!==from) paint(); };
      addEventListener('pointermove',mv); addEventListener('pointerup',up,{once:true});
    });
    STAGE.appendChild(el);
  });
  drawSegs();
}

function drawSegs(){
  const list=segs();
  SEGBOX.innerHTML=list.map(([a,b],i)=>`
    <div class="cutseg" data-i="${i}">
      <span class="n">칸 ${i+1}</span>
      <span class="px">세로 ${a}~${b}px · ${b-a}px</span>
      <button type="button" data-v="q" class="${SLOT[i]==='q'?'on':''}">문제</button>
      <button type="button" data-v="a" class="${SLOT[i]==='a'?'on':''}">답</button>
      <button type="button" data-v="x" class="${SLOT[i]==='x'?'on':''}">버림</button>
    </div>`).join('') || `<p class="cutnote">선을 그으면 칸이 생깁니다.</p>`;
  $$('.cutseg button',SEGBOX).forEach(b=>b.onclick=()=>{
    const i=+b.closest('.cutseg').dataset.i;
    SLOT[i]=b.dataset.v; paint();
  });
}

/* ── 열기 ── */
async function open_(id, which){
  build();
  ROW = allRows().find(r=>String(r.id)===String(id));
  if(!ROW) return;
  FROM = which==='a' ? 'a' : 'q';
  const src = FROM==='a' ? ROW.a_url : ROW.q_url;
  if(!src){ alert('이 칸에는 아직 그림이 없습니다.'); return; }

  W.classList.add('on');
  $('[data-nm]',W).textContent =
    `잘라 나누기 — ${ROW.year}년 제${ROW.session}회 ${ROW.no}번 · ${FROM==='a'?'답':'문제'} 그림`;
  LINES=[]; SLOT=[]; IMG=null; say('그림을 불러오는 중…');
  SEGBOX.innerHTML='';

  try{
    /* 주소를 그대로 img.src 에 넣으면 캔버스가 «오염» 돼 잘라내지 못한다.
       파일로 받아서 넣으면 그 문제가 없다. */
    const res=await fetch(src,{mode:'cors'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const blob=await res.blob();
    const im=await new Promise((ok,no)=>{
      const x=new Image();
      x.onload=()=>ok(x); x.onerror=()=>no(new Error('그림을 읽지 못했습니다'));
      x.src=URL.createObjectURL(blob);
    });
    IMG=im;
    const w=Math.min(1200,im.naturalWidth||im.width);
    CV.width=w; CV.height=Math.round((im.naturalHeight||im.height)*w/(im.naturalWidth||im.width));
    paint();
    say(FROM==='a'
      ? '답 그림입니다 — 위쪽에 문제가 섞여 있으면 그 경계에 선을 그으세요.'
      : '문제 그림입니다 — 답이 시작되는 자리에 선을 그으세요.');
  }catch(e){
    say('불러오지 못했습니다 — '+(e.message||e));
  }
}

/* ── AI 로 경계 찾기 — 워커의 /split-hint 를 그대로 쓴다 ── */
async function askAI(){
  if(!IMG||!ROW) return say('그림을 먼저 불러오세요.');
  const CFG=window.APP_CONFIG||{};
  const base=(CFG.CLAUDE_WORKER_URL||CFG.AI_WORKER_URL||'').replace(/\/+$/,'');
  if(!base) return say('config.js 에 워커 주소가 없습니다.');
  const url = FROM==='a' ? ROW.a_url : ROW.q_url;
  const b=$('[data-ai]',W); const old=b.textContent;
  b.disabled=true; b.textContent='보는 중…';
  try{
    const r=await fetch(base+'/split-hint',{
      method:'POST',
      headers:Object.assign({'Content-Type':'application/json'},
        (CFG.CLAUDE_APP_KEY||CFG.AI_APP_KEY)?{'x-app-key':(CFG.CLAUDE_APP_KEY||CFG.AI_APP_KEY)}:{}),
      body:JSON.stringify({ url, slot:FROM })
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(d.error||('HTTP '+r.status));
    if(!d.ok){
      say(d.found ? '경계를 찾긴 했는데 미덥지 않아 긋지 않았습니다 — 직접 그어 주세요.'
                  : '이 그림에는 답이 같이 있지 않은 것 같습니다.');
      return;
    }
    LINES=[Math.round(CV.height*d.y)]; SLOT=['q','a']; paint();
    say('선을 그었습니다 — '+(d.why||'확인하고 필요하면 끌어서 옮기세요.'));
  }catch(e){ say('실패 — '+(e.message||e)); }
  finally{ b.disabled=false; b.textContent=old; }
}

/* ── 저장 ── */
function build1(list, want){
  const parts=list.filter((_,i)=>SLOT[i]===want);
  if(!parts.length) return null;
  const h=parts.reduce((t,[a,b])=>t+(b-a),0);
  const out=document.createElement('canvas');
  out.width=CV.width; out.height=h;
  const g=out.getContext('2d');
  g.fillStyle='#fff'; g.fillRect(0,0,out.width,out.height);
  let y=0;
  parts.forEach(([a,b])=>{ g.drawImage(CV,0,a,CV.width,b-a,0,y,CV.width,b-a); y+=b-a; });
  return out;
}

async function save(){
  if(!IMG||!ROW) return say('그림을 먼저 불러오세요.');
  const list=segs();
  if(!list.length) return say('선을 먼저 그어 주세요.');
  if(SLOT.every(v=>v==='x')) return say('모두 «버림» 입니다 — 남길 칸을 골라 주세요.');

  const b=$('[data-save]',W); const old=b.textContent;
  b.disabled=true; b.textContent='자르는 중…';
  try{
    const jobs=[];
    for(const want of ['q','a']){
      const cv=build1(list,want);
      if(!cv) continue;
      const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',0.82));
      jobs.push({ want, blob });
    }
    if(!jobs.length) throw new Error('남길 칸이 없습니다');

    /* ★ 경로는 이 앱이 원래 쓰던 규칙 그대로여야 «덮어쓰기» 가 된다.
       prac/과목/연도_회차_번호(두 자리)_q.jpg — 다르게 적으면 새 파일이 하나 더 쌓인다. */
    const base=`prac/${ROW.subject_id}/${ROW.year}_${ROW.session}_${String(ROW.no).padStart(2,'0')}`;
    const before={ q:ROW.q_url, a:ROW.a_url };
    const patch={};
    for(const j of jobs){
      b.textContent='올리는 중…';
      const url=await put(`${base}_${j.want}.jpg`, j.blob);
      patch[j.want==='q'?'q_url':'a_url']=url;
    }
    const up=await sb.from('practicals').update(patch).eq('id',ROW.id);
    if(up.error) throw up.error;
    Object.assign(ROW,patch);

    /* 캐시에 남은 «예전» 그림을 지운다.
       ★ 새 주소를 지우면 아무 소용이 없다 — 담긴 적이 없는 주소다. 옛 주소를 지워야 한다. */
    try{
      const c=await caches.open('img-v1');
      await Promise.all(Object.values(before).filter(Boolean).map(u=>c.delete(u)));
    }catch(e){globalThis.__q?.(e)}
    /* 옛 파일 이름이 새것과 다르면(손으로 붙인 답 그림 등) 저장소에 그대로 남는다 — 같이 치운다 */
    try{
      const now=Object.values(patch).map(u=>String(u).split('?')[0]);
      const old=Object.values(before).filter(Boolean)
        .map(u=>String(u).split('?')[0]).filter(u=>!now.includes(u));
      if(old.length && window.dropFigs)
        await window.dropFigs(old.map(u=>({ q_url:u })));
    }catch(e){globalThis.__q?.(e)}
    try{ cacheSaveRows(); }catch(e){globalThis.__q?.(e)}

    say('저장했습니다.');
    close();
    try{ drawList(); }catch(e){globalThis.__q?.(e)}
    /* «한눈에» 를 켜 둔 채로 잘랐으면 그 판도 다시 그린다 — 안 그리면 옛 그림이 남는다 */
    try{ if(document.querySelector('#ovl.on')) ovDraw(); }catch(e){globalThis.__q?.(e)}
    try{ window.__pracLog && window.__pracLog(`${ROW.year}년 ${ROW.session}회 ${ROW.no}번 — 그림을 잘라 나눴습니다`); }catch(e){globalThis.__q?.(e)}
  }catch(e){
    say('저장하지 못했습니다 — '+(e.message||e));
  }finally{ b.disabled=false; b.textContent=old; }
}

window.__pracCut = open_;

/* ── 단추 붙이기 ──
   카드의 도구줄과 «한눈에» 머리줄 양쪽에 넣는다. 목록은 수시로 다시 그려지므로
   지켜보다가 없으면 다시 붙인다. */
function addBtns(){
  $$('#list .pcard .ptools').forEach(bar=>{
    const ov=bar.querySelector('[data-ov]'); if(!ov) return;
    if(bar.querySelector('[data-cutsplit]')) return;
    const id=ov.dataset.ov;
    const b=document.createElement('button');
    b.type='button'; b.className='zb'; b.dataset.cutsplit=id;
    b.textContent='✂ 잘라 나누기';
    b.title='그림 하나에 문제와 답이 같이 있거나 여백이 붙어 있을 때 — 선을 그어 나누고 저장합니다\n(«✂ 자르기» 는 보여 주는 틀만 바꾸고, 이것은 그림 파일을 새로 만듭니다)';
    b.onclick=()=>pick(id);
    ov.after(b);
  });
  /* 한눈에 머리줄 */
  const oh=document.querySelector('#ovl .oh');
  if(oh && !oh.querySelector('[data-cutsplit]')){
    const b=document.createElement('button');
    b.type='button'; b.className='zb'; b.dataset.cutsplit='ov';
    b.textContent='✂';                      /* ★ v267 — 머리줄은 가위만. 뜻은 title 로 */
    b.setAttribute('aria-label','잘라 나누기');
    b.title='잘라 나누기 — 보고 있는 문항의 그림을 선으로 나눠 문제·답으로 다시 저장합니다';
    b.onclick=()=>{ let id=null; try{ id=OVID }catch(e){globalThis.__q?.(e)} if(id) pick(id); };
    const anchor=oh.querySelector('#ovText');
    anchor ? anchor.after(b) : oh.appendChild(b);
  }
}

/* 문제·답 둘 다 있으면 어느 쪽을 자를지 먼저 묻는다 */
function pick(id){
  const r=allRows().find(x=>String(x.id)===String(id)); if(!r) return;
  if(r.q_url&&r.a_url){
    const a=confirm('어느 그림을 나눌까요?\n\n[확인] 문제 그림\n[취소] 답 그림');
    open_(id, a?'q':'a');
  }else open_(id, r.q_url?'q':'a');
}

/* 목록은 수시로 다시 그려지므로 틈틈이 다시 붙인다.
   (탭이 숨으면 쉬도록 위에서 걸어 둔 장치가 여기에도 걸린다) */
setInterval(addBtns,1200);
addEventListener('load',addBtns);
setTimeout(addBtns,600); setTimeout(addBtns,2500);
})();

