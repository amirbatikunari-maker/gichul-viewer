/* practice.html 에서 분리 (v341) — 원래 15655번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const rowOf = id => (typeof ROWS!=='undefined'?ROWS:[]).find(x=>String(x.id)===String(id));
let CUR=null, ARMED=false, PICK=null;

function strip(){
  const W=$('.edw'); if(!W) return null;
  let el=W.querySelector('.edorig');
  if(el) return el;
  el=document.createElement('div');
  el.className='edorig';
  el.innerHTML=`<span class="t">원본 그림</span>
    <div class="thumb none" title="눌러서 Ctrl+V 로 붙이기">없음</div>
    <button type="button" data-pick>🖼 바꾸기</button>
    <button type="button" data-paste title="누른 뒤 Ctrl+V — 클립보드 그림으로 갈아 끼웁니다">📋 붙여넣기</button>
    <button type="button" data-rot>↻ 돌리기</button>
    <button type="button" data-del class="warn">✕ 지우기</button>
    <span class="msg"></span>`;
  const tools=W.querySelector('.tools');
  tools ? tools.after(el) : W.querySelector('.box')?.prepend(el);
  wire(el);
  return el;
}

const urlKey = () => CUR && CUR.key==='a_md' ? 'a_url' : 'q_url';
const say = (el,t) => { const m=el.querySelector('.msg'); if(m) m.textContent=t||''; };

function sync(){
  const el=strip(); if(!el) return;
  /* 쉬운 풀이에는 원본 그림이라는 것이 없다 */
  if(!CUR || CUR.key==='easy_md'){ el.style.display='none'; return; }
  el.style.display='';
  const r=rowOf(CUR.id); if(!r) return;
  const u=r[urlKey()];
  const th=el.querySelector('.thumb');
  if(u){ th.classList.remove('none'); th.textContent=''; th.style.backgroundImage=`url("${u}")`; }
  else { th.classList.add('none'); th.textContent='없음'; th.style.backgroundImage=''; }
  el.querySelector('[data-rot]').textContent='↻ 돌리기'+(r.rotate?` ${r.rotate}°`:'');
  el.querySelector('[data-del]').disabled=!u;
  arm(el,false);
  say(el, u ? '잘못 오려 온 그림이면 여기서 갈아 끼우세요.'
            : '원본 그림이 없습니다 — 캡처해 두고 «붙여넣기» 를 누른 뒤 Ctrl+V.');
}
function arm(el,v){
  ARMED=!!v;
  el.querySelector('.thumb').classList.toggle('armed',ARMED);
  el.querySelector('[data-paste]').classList.toggle('on',ARMED);
  if(ARMED) say(el,'이제 Ctrl+V 를 누르세요 — 클립보드의 그림이 원본 자리에 들어갑니다.');
}

/* ── 갈아 끼우기 ── */
async function replace(file){
  const el=strip(); if(!el||!CUR) return;
  const r=rowOf(CUR.id); if(!r) return;
  if(!/^image\//.test(file.type)) return say(el,'그림 파일만 됩니다.');
  say(el,'올리는 중…');
  try{
    const bmp=await createImageBitmap(file);
    const k=Math.min(1,1600/bmp.width);
    const cv=document.createElement('canvas');
    cv.width=Math.max(1,Math.round(bmp.width*k)); cv.height=Math.max(1,Math.round(bmp.height*k));
    const g=cv.getContext('2d');
    g.fillStyle='#fff'; g.fillRect(0,0,cv.width,cv.height);
    g.drawImage(bmp,0,0,cv.width,cv.height);
    bmp.close&&bmp.close();
    const blob=await new Promise(res=>cv.toBlob(res,'image/jpeg',0.9));
    const side=urlKey()==='a_url'?'a':'q';
    const path=`prac/${r.subject_id}/${r.year}_${r.session}_${String(r.no).padStart(2,'0')}_${side}_fix_${Date.now()}.jpg`;
    const url=await put(path,blob);
    await save({ [urlKey()]: url });
    r[urlKey()]=url;
    sync(); say(el,'원본을 갈아 끼웠습니다.');
    redraw();
  }catch(e){ say(el,'올리지 못했습니다 — '+(e&&e.message?e.message:e)); }
}
async function save(patch){
  const r=rowOf(CUR.id); if(!r) return;
  const up=await sb.from('practicals').update(patch).eq('id', r.id);
  if(up.error) throw up.error;
}
function redraw(){
  try{ drawList(); }catch(e){globalThis.__q?.(e)}
  try{ if($('#ovl') && $('#ovl').classList.contains('on')) ovDraw(); }catch(e){globalThis.__q?.(e)}
}

function wire(el){
  el.querySelector('.thumb').onclick=()=>arm(el,!ARMED);
  el.querySelector('[data-paste]').onclick=()=>arm(el,!ARMED);
  el.querySelector('[data-pick]').onclick=()=>{
    if(!PICK){
      PICK=document.createElement('input');
      PICK.type='file'; PICK.accept='image/*'; PICK.style.display='none';
      document.body.appendChild(PICK);
    }
    PICK.value='';
    PICK.onchange=e=>{ const f=e.target.files[0]; if(f) replace(f); };
    PICK.click();
  };
  el.querySelector('[data-rot]').onclick=async ()=>{
    const r=rowOf(CUR&&CUR.id); if(!r) return;
    const next=((r.rotate||0)+90)%360;
    try{ await save({ rotate: next }); r.rotate=next; sync(); redraw(); }
    catch(e){ say(el,'돌리지 못했습니다 — '+(e.message||e)); }
  };
  el.querySelector('[data-del]').onclick=async ()=>{
    const r=rowOf(CUR&&CUR.id); if(!r) return;
    if(!confirm('이 문항의 원본 그림을 떼어 냅니다. (올린 파일은 남습니다)')) return;
    try{ await save({ [urlKey()]: null }); r[urlKey()]=null; sync(); redraw(); say(el,'원본을 떼어 냈습니다.'); }
    catch(e){ say(el,'떼어 내지 못했습니다 — '+(e.message||e)); }
  };
  /* 붙여넣기 대기 중일 때만 원본 자리로 간다 —
     안 그러면 글 사이에 그림을 끼우려던 Ctrl+V 까지 가로채 버린다.
     ★ window 의 «잡는 단계» 에 건다. 글 사이에 끼우는 손잡이가 창(.edw)에
       먼저 걸려 있어서, 같은 곳에 걸면 그쪽이 먼저 집어 가 버린다.
       window 는 어떤 요소보다 앞이라 여기서 먼저 받는다. */
  addEventListener('paste', e=>{
    if(!ARMED) return;
    if(!e.target || !e.target.closest || !e.target.closest('.edw')) return;
    const it=[...(e.clipboardData&&e.clipboardData.items||[])].find(x=>x.type&&x.type.startsWith('image/'));
    if(!it) return;
    e.preventDefault(); e.stopPropagation();
    const f=it.getAsFile(); if(f) replace(f);
  }, true);
  el.addEventListener('dragover', e=>{ e.preventDefault(); e.stopPropagation(); });
  el.addEventListener('drop', e=>{
    e.preventDefault(); e.stopPropagation();
    const f=[...(e.dataTransfer&&e.dataTransfer.files||[])][0]; if(f) replace(f);
  });
}

/* 고치기 창이 열릴 때마다 그 칸의 원본을 물어 온다 */
const t=setInterval(()=>{
  if(typeof window.__edOpen!=='function' || window.__edOpen.__orig) return;
  clearInterval(t);
  const prev=window.__edOpen;
  const w=function(id,name,f){
    const out=prev.apply(this,arguments);
    CUR={ id, key:(f&&f.key)||'' };
    setTimeout(sync,0);
    return out;
  };
  w.__orig=1;
  window.__edOpen=w;
},300);
setTimeout(()=>clearInterval(t),30000);
})();
