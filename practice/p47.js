/* practice.html 에서 분리 (v341) — 원래 18505번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll = ()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const rowOf   = id=>rowsAll().find(x=>String(x.id)===String(id));
const SB = ()=>{ try{ return sb }catch(e){ return null } };

/* ══════════════════════════════════════════════
   0) 표를 제대로 그린다 — 칸 안 줄바꿈(<br>) · 열 너비
   ══════════════════════════════════════════════
   mdRich · mdLite 는 들어온 글을 통째로 esc() 한다. 그래서 «<br>» 은
   «&lt;br&gt;» 이라는 글자로 남아 화면에 그대로 찍혔다.
   그 둘을 감싸서, 다 그린 뒤에 되돌려 놓는다.
   열 너비는 표 바로 앞에 숨은 줄 <!--cols:30,20,50--> 로 적어 둔다. */
const COLRE = /^[ \t]*<!--\s*cols:([\d.,\s]*)-->[ \t]*$/i;
/* 병합은 «몇째 줄(0=머리글) · 몇째 칸부터 · 몇 칸을 합칠까» 를 r:c:n 으로 적고,
   한 표에 여러 곳이면 ; 로 이어 적는다. 가로로 잇는 것만 다룬다(세로 합침은 안 함) —
   시험 표에서 실제로 쓰는 건 거의 다 «머리글 한 칸이 아래 몇 칸을 덮는» 가로 합침이다. */
const MERGERE = /^[ \t]*<!--\s*merge:([\d:;]*)-->[ \t]*$/i;
const ROWRE = /^\|.*\|/;
const SEPRE = /^\|[\s:\-|]+\|?$/;

function pullCols(md){
  const src = String(md==null?'':md);
  if(src.indexOf('<!--cols:')<0 && src.indexOf('<!-- cols:')<0 && src.indexOf('<!--merge:')<0)
    return { md:src, map:null, mmap:null };
  const lines = src.split('\n'), out = [], map = {}, mmap = {};
  let ti = 0;
  for(let i=0;i<lines.length;i++){
    const m = lines[i].match(COLRE);
    /* ★ 예전에는 값이 없는(0) 칸을 배열에서 통째로 빼 버렸다 — 그러면 뒤엣 칸들의
       너비가 한 칸씩 앞으로 밀려서 «단면적» 자리에 «허용전류» 의 너비가 입혀지는
       식으로 엉켰다. 자리를 지켜야 하므로, 값이 없으면 0으로 «자리만» 남긴다. */
    if(m){ map[ti] = m[1].split(',').map(v=>{ const n=parseFloat(v); return (!isNaN(n)&&n>0)?n:0; }); continue; }
    const mm = lines[i].match(MERGERE);
    if(mm){
      mmap[ti] = (mm[1]||'').split(';').filter(Boolean).map(seg=>{
        const [r,c,n] = seg.split(':').map(x=>+x);
        return (Number.isFinite(r)&&Number.isFinite(c)&&Number.isFinite(n)&&n>1) ? {r,c,n} : null;
      }).filter(Boolean);
      continue;
    }
    out.push(lines[i]);
    if(ROWRE.test(lines[i].trim()) && SEPRE.test((lines[i+1]||'').trim())) ti++;
  }
  return { md:out.join('\n'), map, mmap };
}
function fixHtml(html, map, mmap){
  let h = String(html==null?'':html);
  if(h.indexOf('&lt;br')>=0) h = h.replace(/&lt;br\s*\/?&gt;/gi,'<br>');
  const hasMap = map && Object.keys(map).length;
  const hasMerge = mmap && Object.keys(mmap).length;
  if(!hasMap && !hasMerge) return h;
  try{
    const d = document.createElement('div'); d.innerHTML = h;
    d.querySelectorAll('table').forEach((t,i)=>{
      const w = map && map[i];
      if(w && w.length){
        const cg = document.createElement('colgroup');
        /* 칸마다 하나씩 <col> 을 세운다 — 값이 0인 칸도 자리만은 반드시 채운다.
           하나라도 빠지면 그 뒤 모든 칸이 한 자리씩 밀려 버린다. */
        w.forEach(v=>{ const c=document.createElement('col'); if(v>0) c.style.width=v+'%'; cg.appendChild(c); });
        t.insertBefore(cg, t.firstChild);
        t.classList.add('fixw');
      }
      const merges = mmap && mmap[i];
      if(merges && merges.length){
        /* 같은 줄에 합침이 여럿이면 오른쪽 것부터 처리한다 — 왼쪽 합침이 아직
           칸을 지우기 전이라야, 다음 합침이 가리키는 «몇째 칸» 자리가 안 어긋난다. */
        merges.slice().sort((a,b)=> a.r-b.r || b.c-a.c).forEach(m=>{
          const tr = t.querySelectorAll('tr')[m.r]; if(!tr) return;
          const cells = [...tr.children];
          const anchor = cells[m.c]; if(!anchor) return;
          anchor.setAttribute('colspan', String(m.n));
          for(let k=1;k<m.n;k++) cells[m.c+k]?.remove();
        });
        t.classList.add('mergedtb');
      }
    });
    return d.innerHTML;
  }catch(e){ return h; }
}
['mdRich','mdLite'].forEach(name=>{
  const fn = window[name];
  if(typeof fn!=='function' || fn.__tbl) return;
  const w = function(md){ const p = pullCols(md); return fixHtml(fn.call(this,p.md), p.map, p.mmap); };
  w.__tbl=1; w.__img=fn.__img; w.__tex=fn.__tex; w.__sci=fn.__sci;
  window[name]=w;
});

/* ══════════════════════════════════════════════
   1) 단답 — 문제+답 통으로 온 문항은 답안칸을 없앤다
   ══════════════════════════════════════════════
   답 그림도 답 글자도 없는 문항이 곧 «통으로 들어온» 문항이다.
   그 자리에 «답안이 붙어 있지 않습니다» 를 띄워 둘 이유가 없다 —
   문제칸 안에 답이 이미 들어 있다. 두 칸으로 보는 게 맞다. */
const OPEN = new Set();                                  /* 손으로 답안칸을 되살린 문항 */
const isSolo = r => !!r && !r.a_url && !r.a_md && !OPEN.has(String(r.id));

function markLabel(lab, txt){
  if(!lab || lab.querySelector('.sololab')) return;
  const t = document.createElement('em');
  t.className = 'sololab'; t.textContent = txt;
  const edb = lab.querySelector('.edb');
  edb ? lab.insertBefore(t, edb) : lab.appendChild(t);
}

function soloList(){
  $$('#list .pcard').forEach(card=>{
    const r = rowOf(card.dataset.id); if(!r) return;
    const grid = card.querySelector('.pgrid'); if(!grid) return;
    const on = isSolo(r);
    grid.classList.toggle('solo', on);
    if(!on) return;
    markLabel(card.querySelector('.pcol-q .plabel'), '＋ 답');
    /* 답안을 따로 붙이고 싶을 때를 위해 되살리는 길은 남긴다 */
    const tools = card.querySelector('.ptools');
    if(tools && !tools.querySelector('[data-solomore]')){
      const b = document.createElement('button');
      b.type='button'; b.className='zb'; b.dataset.solomore = r.id;
      b.textContent = '답안칸 따로 열기';
      b.title = '이 문항만 답안칸을 다시 꺼냅니다 (답을 따로 붙일 때)';
      b.onclick = ()=>{ OPEN.add(String(r.id)); try{ drawList() }catch(e){globalThis.__q?.(e)} };
      tools.appendChild(b);
    }
  });
}

function soloOv(){
  const ov = $('#ovl'); if(!ov) return;
  let r=null; try{ r = rowOf(OVID) }catch(e){globalThis.__q?.(e)}
  const on = isSolo(r);
  ov.classList.toggle('solo', on);
  if(!on) return;
  markLabel($('#ovLeft .plab'), '＋ 답');
}

/* 한눈에서 «답안» 겹을 보고 있는데 그 문항에 답안이 없으면, 열기 전에 겹을 옮겨 둔다 */
function soloSeg(){
  try{
    const r = rowOf(OVID);
    if(isSolo(r) && OVSEG === 'a') OVSEG = 'e';
  }catch(e){globalThis.__q?.(e)}
}

/* ══════════════════════════════════════════════
   2) 여백을 «진짜로» 잘라 내고 줄여서 다시 올린다
   ══════════════════════════════════════════════
   지금까지는 화면에서 창만 좁혀 보여 줬다. 파일은 원본 여백을 그대로 이고 있어서
   폰에서 느리고, 내려받아도 헐렁하고, 다시 열면 또 재야 했다.
   여기서는 캔버스로 새로 그려 그 자리에 올린다. */
async function tight(url, maxW, rotate){
  const blob = await fetch(url, { cache:'reload' }).then(r=>{
    if(!r.ok) throw new Error('그림을 불러오지 못했습니다 ('+r.status+')');
    return r.blob();
  });
  const bmp = await createImageBitmap(blob);
  try{
    /* ① 작게 줄여 «어디에 글자가 있나» 만 훑는다 */
    const AW = 340, AH = Math.max(1, Math.round(AW*bmp.height/bmp.width));
    const ac = document.createElement('canvas'); ac.width=AW; ac.height=AH;
    const ax = ac.getContext('2d',{willReadFrequently:true});
    ax.fillStyle='#fff'; ax.fillRect(0,0,AW,AH);
    ax.drawImage(bmp,0,0,AW,AH);
    const d = ax.getImageData(0,0,AW,AH).data;
    const INK = 208;
    const rowInk = new Array(AH).fill(0), colInk = new Array(AW).fill(0);
    for(let y=0;y<AH;y++) for(let x=0;x<AW;x++){
      const i=(y*AW+x)*4;
      if(Math.min(d[i],d[i+1],d[i+2])<INK){ rowInk[y]++; colInk[x]++; }
    }
    const first=a=>{ for(let i=0;i<a.length;i++) if(a[i]>0) return i; return -1 };
    const last =a=>{ for(let i=a.length-1;i>=0;i--) if(a[i]>0) return i; return -1 };
    const t=first(rowInk), b=last(rowInk), l=first(colInk), r0=last(colInk);
    if(t<0||l<0||b<=t||r0<=l) throw new Error('글자를 찾지 못했습니다 (빈 그림)');

    const PADX=Math.max(2,Math.round(AW*0.010)), PADY=Math.max(2,Math.round(AH*0.008));
    const x0=Math.max(0,l-PADX), x1=Math.min(AW,r0+1+PADX);
    const y0=Math.max(0,t-PADY), y1=Math.min(AH,b+1+PADY);

    /* ② 안쪽의 «글자 한 톨 없는 가로 띠» 를 얇게 눌러 준다 (두 쪽 이어 붙인 문항용) */
    const MINRUN=Math.max(6,Math.round(AH*0.022)), KEEP=Math.max(3,Math.round(AH*0.008));
    const segs=[]; let cut=0, s0=y0;
    for(let y=y0;y<y1;y++){
      if(rowInk[y]>0) continue;
      let e=y; while(e<y1 && rowInk[e]===0) e++;
      if(e-y>MINRUN){ segs.push([s0,y+KEEP]); cut += (e-y)-KEEP; s0=e; }
      y=e-1;
    }
    segs.push([s0,y1]);

    /* ③ 제 해상도로 다시 그린다 — 폭은 maxW 를 넘지 않는다 */
    const sx=bmp.width/AW, sy=bmp.height/AH;
    const srcW=(x1-x0)*sx, outAH=(y1-y0)-cut;
    const OW=Math.max(320, Math.min(srcW, maxW||1400));
    const k=OW/srcW;
    const OH=Math.max(1, Math.round(outAH*sy*k));
    const rot=((rotate||0)%360+360)%360;
    const turn=(rot===90||rot===270);
    const oc=document.createElement('canvas');
    oc.width = Math.round(turn?OH:OW); oc.height = Math.round(turn?OW:OH);
    const ox=oc.getContext('2d');
    ox.fillStyle='#fff'; ox.fillRect(0,0,oc.width,oc.height);
    ox.imageSmoothingQuality='high';
    ox.save();
    if(rot){ ox.translate(oc.width/2, oc.height/2); ox.rotate(rot*Math.PI/180); ox.translate(-OW/2, -OH/2); }
    let dy=0;
    for(const [a,z] of segs){
      if(z<=a) continue;
      const h=Math.round((z-a)*sy*k);
      ox.drawImage(bmp, x0*sx, a*sy, (x1-x0)*sx, (z-a)*sy, 0, dy, Math.round(OW), h);
      dy+=h;
    }
    ox.restore();
    let out = await new Promise(res=>oc.toBlob(res,'image/jpeg',0.84));
    if(!out) throw new Error('그림을 만들지 못했습니다');
    return { blob:out, w:oc.width, h:oc.height, was:blob.size };
  } finally { bmp.close && bmp.close(); }
}

const TOAST = (()=>{
  let el=null;
  return (t,bad)=>{
    if(!el){ el=document.createElement('div'); el.className='tgtwrap'; document.body.appendChild(el); }
    el.textContent=t||''; el.classList.toggle('bad',!!bad); el.classList.toggle('on',!!t);
    clearTimeout(el.__t); if(t) el.__t=setTimeout(()=>el.classList.remove('on'), bad?6000:3200);
  };
})();

const kb = n => (n/1024<900 ? Math.round(n/1024)+'KB' : (n/1048576).toFixed(1)+'MB');

/* 이 문항의 그림을 잘라 그 자리에 다시 올린다 */
async function tightSave(id, btn){
  const r = rowOf(id); if(!r) return;
  const sides = [['q','q_url','문제'],['a','a_url','답안']].filter(s=>r[s[1]]);
  if(!sides.length) return TOAST('자를 그림이 없습니다 — 글자로만 들어온 문항입니다.', true);
  if(!confirm(
      '원본 그림의 흰 여백을 잘라 내고 폭을 1400px 로 줄여 그 자리에 다시 올립니다.\n'
    + '그림 ' + sides.length + '장이 바뀝니다.\n\n'
    + '★ 그림 위에 그려 둔 필기와 «막히는 곳» 표시는 옛 좌표라 자리가 어긋납니다.\n'
    + '   표시를 해 둔 문항이면 그만두세요.\n\n계속할까요?')) return;

  if(btn){ btn.disabled=true; btn.dataset.old=btn.textContent; btn.textContent='자르는 중…'; }
  try{
    const patch = {}; let was=0, now=0;
    for(const [side, key] of sides){
      const v = await tight(r[key], 1400, r.rotate||0);
      const path = `prac/${r.subject_id}/${r.year}_${r.session}_${String(r.no).padStart(2,'0')}`
                 + `_${side}_t${Date.now().toString(36)}.jpg`;
      patch[key] = await put(path, v.blob);
      was += v.was; now += v.blob.size;
      try{ TRIM.delete(r[key]); SQZ.delete(r[key]); }catch(e){globalThis.__q?.(e)}
    }
    if(r.rotate) patch.rotate = 0;                       /* 돌린 것은 그림에 구워 넣었다 */
    const up = await SB().from('practicals').update(patch).eq('id', r.id);
    if(up.error) throw new Error(up.error.message);
    Object.assign(r, patch);
    TOAST(`여백을 잘라 다시 올렸습니다 — ${kb(was)} → ${kb(now)}`);
    try{ drawList() }catch(e){globalThis.__q?.(e)}
    try{ if($('#ovl')?.classList.contains('on')) ovDraw() }catch(e){globalThis.__q?.(e)}
  }catch(e){
    TOAST('자르지 못했습니다 — ' + ((e&&e.message)||e), true);
  }finally{
    if(btn){ btn.disabled=false; btn.textContent=btn.dataset.old||'✂ 여백 잘라 저장'; }
  }
}

/* 잘라 낸 그림을 기기에 내려받는다 (올리지 않는다) */
async function tightDown(id, btn){
  const r = rowOf(id); if(!r) return;
  const sides = [['q','q_url','문제'],['a','a_url','답안']].filter(s=>r[s[1]]);
  if(!sides.length) return TOAST('내려받을 그림이 없습니다.', true);
  if(btn){ btn.disabled=true; btn.dataset.old=btn.textContent; btn.textContent='만드는 중…'; }
  try{
    for(const [, key, nm] of sides){
      const v = await tight(r[key], 1600, r.rotate||0);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(v.blob);
      a.download = `${r.year}-${r.session}_${String(r.no).padStart(2,'0')}_${nm}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href), 20000);
    }
    TOAST('내려받았습니다.');
  }catch(e){
    TOAST('내려받지 못했습니다 — ' + ((e&&e.message)||e), true);
  }finally{
    if(btn){ btn.disabled=false; btn.textContent=btn.dataset.old||'⤓ 저장'; }
  }
}

/* 목록 카드에 단추를 끼운다 */
function tightBtns(){
  $$('#list .pcard').forEach(card=>{
    const tools = card.querySelector('.ptools'); if(!tools) return;
    if(tools.querySelector('[data-tight]')) return;
    const r = rowOf(card.dataset.id); if(!r || (!r.q_url && !r.a_url)) return;
    const b = document.createElement('button');
    b.type='button'; b.className='zb tgtbtn'; b.dataset.tight = r.id;
    b.textContent = '✂ 여백 잘라 저장';
    b.title = '흰 여백을 잘라 내고 폭을 줄여 그 자리에 다시 올립니다';
    b.onclick = ()=>tightSave(r.id, b);
    const d = document.createElement('button');
    d.type='button'; d.className='zb tgtbtn'; d.dataset.tightdown = r.id;
    d.textContent = '⤓ 저장';
    d.title = '잘라 낸 그림을 기기에 내려받습니다';
    d.onclick = ()=>tightDown(r.id, d);
    const rot = tools.querySelector('[data-rot]');
    rot ? rot.after(d) : tools.appendChild(d);
    d.before(b);
  });
}

/* 한눈에 머리줄에도 같은 단추를 둔다 */
function tightOvBtns(){
  const oh = $('#ovl .oh'); if(!oh) return;
  let r=null; try{ r=rowOf(OVID) }catch(e){globalThis.__q?.(e)}
  const has = !!(r && (r.q_url || r.a_url));
  let b = $('#ovTight'), d = $('#ovTightDown');
  if(!b){
    b = document.createElement('button');
    b.type='button'; b.className='zb tgt'; b.id='ovTight'; b.textContent='✂ 여백 잘라 저장';
    b.title='흰 여백을 잘라 내고 줄여서 그 자리에 다시 올립니다';
    b.onclick = ()=>{ try{ tightSave(OVID, b) }catch(e){globalThis.__q?.(e)} };
    ($('#ovText')||oh.firstElementChild).after(b);
  }
  if(!d){
    d = document.createElement('button');
    d.type='button'; d.className='zb tgt'; d.id='ovTightDown'; d.textContent='⤓ 저장';
    d.title='잘라 낸 그림을 기기에 내려받습니다';
    d.onclick = ()=>{ try{ tightDown(OVID, d) }catch(e){globalThis.__q?.(e)} };
    b.after(d);
  }
  b.style.display = d.style.display = has ? '' : 'none';
}

/* ══════════════════════════════════════════════
   3) 표를 눈으로 고친다 — «✎ 고치기» 안에서
   ══════════════════════════════════════════════ */
const splitRow = line => {
  const s = line.trim().replace(/^\|/,'').replace(/\|$/,'');
  const out=[]; let cur='';
  for(let i=0;i<s.length;i++){
    if(s[i]==='\\' && s[i+1]==='|'){ cur+='|'; i++; continue; }
    if(s[i]==='|'){ out.push(cur); cur=''; continue; }
    cur+=s[i];
  }
  out.push(cur);
  return out.map(c=>c.trim().replace(/<br\s*\/?>/gi,'\n'));
};
/* 칸 안의 «|» 는 그리는 쪽이 «\|» 를 못 알아본다 — 보기가 같은 온각 글자로 바꾼다 */
const joinRow = cells => '| ' + cells
  .map(c=>String(c==null?'':c).replace(/\|/g,'｜').replace(/\r?\n/g,'<br>').trim())
  .join(' | ') + ' |';
const sepOf = al => '|' + al.map(a=>
  a==='c'?':---:' : a==='r'?'---:' : a==='l'?':---' : '---').join('|') + '|';

/* 글 안의 표를 모두 찾는다 — 줄 번호 기준 */
function findTables(text){
  const L = String(text||'').split('\n'), out=[];
  for(let i=0;i<L.length;i++){
    if(!ROWRE.test(L[i].trim()) || !SEPRE.test((L[i+1]||'').trim())) continue;
    const head = splitRow(L[i]);
    const al = splitRow(L[i+1]).map(s=>{
      const a=s.trim(); const lft=a.startsWith(':'), rgt=a.endsWith(':');
      return lft&&rgt?'c':rgt?'r':lft?'l':'';
    });
    const rows=[head]; let j=i+2;
    while(j<L.length && ROWRE.test(L[j].trim())){ rows.push(splitRow(L[j])); j++; }
    /* 바로 앞 줄들의 숨은 표시(너비·병합)까지 이 표의 것으로 삼는다.
       쓸 때 순서는 늘 «cols 줄 → merge 줄 → 표» 이므로, 거꾸로 이 순서로 걷는다. */
    let from=i, widths=null, merges=null, back=i-1;
    const mm=(L[back]||'').match(MERGERE);
    if(mm){
      merges=(mm[1]||'').split(';').filter(Boolean).map(seg=>{
        const [r,c,n]=seg.split(':').map(x=>+x);
        return (Number.isFinite(r)&&Number.isFinite(c)&&Number.isFinite(n)&&n>1)?{r,c,n}:null;
      }).filter(Boolean);
      from=back; back--;
    }
    const pm=(L[back]||'').match(COLRE);
    if(pm){ from=back; widths=pm[1].split(',').map(v=>parseFloat(v)).filter(v=>!isNaN(v)&&v>0); }
    out.push({ from, to:j, rows, al, widths, merges });
    i=j-1;
  }
  return out;
}
const lineAt = (text, pos) => String(text||'').slice(0,pos).split('\n').length-1;

function tableEditor(){
  const W = $('.edw'); if(!W) return null;
  const box = $('.box', W); if(!box) return null;
  let P = $('.tbx', box);
  if(P) return P;

  P = document.createElement('div');
  P.className = 'tbx';
  P.innerHTML = `
    <div class="th"><b>표 고치기</b>
      <small>칸 안에서 <b>Enter</b> 로 줄을 바꿉니다 · 열 <b>경계선을 끌면</b> 너비가 바뀝니다 · 칸에 <b>마우스를 올리면</b> 오른쪽 칸과 합치는 단추가 뜹니다</small>
      <span class="sp"></span>
      <button type="button" data-t="addr">＋ 행</button>
      <button type="button" data-t="addc">＋ 열</button>
    </div>
    <div class="tscroll"><div class="host"></div></div>
    <div class="tf"><span class="msg"></span><span class="sp"></span>
      <button type="button" data-t="cancel">취소</button>
      <button type="button" class="go" data-t="ok">표 적용</button></div>`;
  box.appendChild(P);

  let ST = null;      /* { rows, al, widths, from, to, fresh } */
  const host = $('.host', P), msg = $('.msg', P);

  const fit = ta => { ta.style.height='auto'; ta.style.height=Math.max(34, ta.scrollHeight+2)+'px'; };

  /* ── 열 너비 손잡이 — 노션처럼 좌우로 끌면 그 열만 넓어지고 줄어든다 ──
     <col> 은 paint() 에서 다시 세우므로, 여기는 이미 있는 <col> 의 style.width 와
     화면에 뜬 입력칸(.wnum) 값만 살아 있는 동안 계속 고쳐 쓴다(다시 그리지 않는다).
     손을 떼야 ST.widths 가 굳고, 그제서야 손잡이 자리도 새로 잰다. */
  function colEls(){ return $$('table > colgroup > col', host); }
  /* 값을 안 넣은 칸은 «자동» 이 아니라 남은 폭을 고르게 나눠 가진다.
     한두 칸만 정해 놨을 때 나머지 한 칸이 폭을 다 먹어 버리는(=옆 칸이 안 보이게
     밀려나는) 일을 막는다. paint() 의 미리 보기와 build() 의 저장 값이 같은 값을
     쓰도록 여기 한 곳에 모아 둔다. */
  function effectiveWidths(raw){
    const setSum = raw.reduce((a,b)=>a+(b>0?b:0),0);
    const unsetN = raw.filter(x=>!(x>0)).length;
    if(!unsetN) return raw.map(x=>x>0?Math.round(x*10)/10:0);
    const share = Math.max(4, Math.round(Math.max(0,100-setSum)/unsetN*10)/10);
    return raw.map(x=>x>0?Math.round(x*10)/10:share);
  }
  function tableWidthPx(){ const t=$('table',host); return t ? t.getBoundingClientRect().width : 0; }
  function positionHandles(){
    const table = $('table',host); if(!table) return;
    const hb = host.getBoundingClientRect(), tb = table.getBoundingClientRect();
    const th = table.offsetHeight;
    const cols = colEls();
    let x = tb.left - hb.left + (cols[0] ? cols[0].getBoundingClientRect().width : 56);
    $$('.colrs',host).forEach(h=>{
      const c = +h.dataset.rs;
      const col = cols[c+1];               /* +1 은 맨 앞 «행 손잡이» 칸을 건너뛴다 */
      if(col) x += col.getBoundingClientRect().width;
      h.style.left = Math.round(x)+'px';
      h.style.height = Math.round(th)+'px';
    });
  }
  function buildHandles(cols){
    $$('.colrs',host).forEach(h=>h.remove());
    for(let c=0;c<cols;c++){
      const h = document.createElement('div');
      h.className='colrs'; h.dataset.rs=String(c); h.title='끌어서 열 너비 조절';
      host.appendChild(h);
      let dragging=false, startX=0, startPct=0, tW=0, cw=null;
      const onMove = ev=>{
        if(!dragging) return;
        const dx = ev.clientX - startX;
        const pct = Math.max(4, Math.min(96, startPct + (dx/tW*100)));
        const round = Math.round(pct*10)/10;
        if(!ST.widths) ST.widths = ST.rows[0].map(()=>0);
        ST.widths[c] = round;
        if(cw) cw.style.width = round+'%';
        const inp = host.querySelector(`[data-w="${c}"]`);
        if(inp) inp.value = round;
        positionHandles();
      };
      const onUp = ev=>{
        if(!dragging) return;
        dragging=false; h.classList.remove('drag');
        try{ h.releasePointerCapture(ev.pointerId); }catch(e){globalThis.__q?.(e)}
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerup', onUp);
        if(!ST.widths.some(x=>x>0)){
          ST.widths=null;
        }else{
          /* 아직 안 정한 칸들 <col> 을 다시 잰다 — 하나만 끌었다고 다른 칸이
             예전 몫(=너무 넓거나 좁게 남은 자리)에 그대로 머물지 않게 한다. */
          const eff = effectiveWidths(ST.widths.slice(0,cols));
          colEls().forEach((col,idx)=>{
            const ci = idx-1; if(ci<0||ci>=cols) return;      /* 앞뒤 고정 칸은 건너뛴다 */
            if(!(ST.widths[ci]>0)) col.style.width = eff[ci]+'%';
          });
          positionHandles();
        }
        say(ST.widths ? '열 너비를 정했습니다. 비운 칸은 남은 폭을 나눠 씁니다.' : '열 너비를 자동으로 되돌렸습니다.');
      };
      h.addEventListener('pointerdown', ev=>{
        ev.preventDefault(); ev.stopPropagation();
        dragging=true; h.classList.add('drag');
        startX = ev.clientX; tW = tableWidthPx() || 1;
        const cells = colEls();
        cw = cells[c+1] || null;
        startPct = (ST.widths && ST.widths[c]) ? ST.widths[c]
          : (cw ? cw.getBoundingClientRect().width/tW*100 : 100/cols);
        try{ h.setPointerCapture(ev.pointerId); }catch(e){globalThis.__q?.(e)}
        addEventListener('pointermove', onMove);
        addEventListener('pointerup', onUp);
      });
    }
    positionHandles();
  }
  addEventListener('resize', ()=>{ if(P.classList.contains('on')) positionHandles(); });

  function paint(){
    const cols = Math.max(1, ...ST.rows.map(r=>r.length));
    ST.rows.forEach(r=>{ while(r.length<cols) r.push(''); r.length=cols; });
    while(ST.al.length<cols) ST.al.push('');
    ST.al.length = cols;
    if(ST.widths){ while(ST.widths.length<cols) ST.widths.push(0); ST.widths.length=cols; }

    const t = document.createElement('table');
    /* 열 너비대로 <col> 을 세운다 — 끌기·입력 칸 둘 다 이 colgroup 을 고쳐 쓴다.
       하나라도 정한 칸이 있으면, 안 정한 칸들도 남은 폭을 고르게 나눠 받는다
       (한 칸만 먹어 버려 다른 칸이 화면 밖으로 밀려나는 것을 막는다). */
    const hasWidths = ST.widths && ST.widths.some(x=>x>0);
    const eff = hasWidths ? effectiveWidths(ST.widths.slice(0,cols)) : null;
    const cg = document.createElement('colgroup');
    const rhCol = document.createElement('col'); rhCol.style.width = '56px'; cg.appendChild(rhCol);
    for(let c=0;c<cols;c++){
      const col = document.createElement('col');
      const w = eff ? eff[c] : 0;
      if(w) col.style.width = w + '%';
      cg.appendChild(col);
    }
    const trCol = document.createElement('col'); trCol.style.width = '26px'; cg.appendChild(trCol);
    t.appendChild(cg);
    /* 열 손잡이 줄 */
    const hr = document.createElement('tr');
    hr.appendChild(document.createElement('td'));
    for(let c=0;c<cols;c++){
      const td=document.createElement('td');
      td.className='cwrap';
      const w = ST.widths ? (ST.widths[c]||'') : '';
      td.innerHTML = `<div class="chead">
          <button type="button" class="mini" data-ci="${c}" title="왼쪽에 열 넣기">＋</button>
          <button type="button" class="mini" data-al="${c}" title="줄 맞춤 (왼쪽·가운데·오른쪽)">${
            ST.al[c]==='c'?'≡':ST.al[c]==='r'?'⇥':ST.al[c]==='l'?'⇤':'–'}</button>
          <input class="wnum" type="number" min="0" max="100" placeholder="%" data-w="${c}" value="${w||''}">
          <button type="button" class="mini del" data-cd="${c}" title="이 열 지우기">✕</button>
        </div>`;
      hr.appendChild(td);
    }
    const last=document.createElement('td');
    last.innerHTML = `<button type="button" class="mini" data-ci="${cols}" title="오른쪽 끝에 열 넣기">＋</button>`;
    hr.appendChild(last);
    t.appendChild(hr);

    /* 병합 — (행,열) 자리가 «시작 칸(anchor)» 인지, 다른 병합에 «덮인» 칸인지 알려준다.
       가로로만 잇는다(세로 병합은 없음) — 시험 표에서 실제로 쓰는 건 거의 다 이거다. */
    function mergeAt(ri, ci){
      for(const m of (ST.merges||[])){
        if(m.r===ri && ci>=m.c && ci<m.c+m.n) return { anchor: ci===m.c, span: m.n, m };
      }
      return null;
    }
    ST.rows.forEach((row,ri)=>{
      const tr=document.createElement('tr');
      const rh=document.createElement('td');
      rh.className='rhead';
      rh.innerHTML = `<button type="button" class="mini" data-ri="${ri}" title="위에 행 넣기">＋</button>
        <button type="button" class="mini del" data-rd="${ri}" title="이 행 지우기">✕</button>`;
      tr.appendChild(rh);
      row.forEach((cell,ci)=>{
        const info = mergeAt(ri, ci);
        if(info && !info.anchor) return;   /* 덮인 칸은 만들지 않는다 — colspan 이 대신 채운다 */
        const td=document.createElement('td'); td.className='cwrap';
        if(info && info.span>1) td.colSpan = info.span;
        const ta=document.createElement('textarea');
        ta.className='cell'; ta.value=cell; ta.rows=1;
        ta.dataset.r=ri; ta.dataset.c=ci;
        ta.placeholder = ri===0 ? '머리글' : '';
        ta.addEventListener('input', ()=>{ ST.rows[ri][ci]=ta.value; fit(ta); });
        td.appendChild(ta);
        /* 합치기·나누기 — 합쳐진 칸엔 «나누기» 만, 안 합쳐진 칸엔(맨 오른쪽 열 빼고) «합치기» 만 보인다 */
        if(info && info.span>1){
          const sp=document.createElement('button'); sp.type='button'; sp.className='mtool msplit';
          sp.title='합친 칸을 나눕니다'; sp.textContent='✂'; sp.dataset.msplit=`${ri}:${ci}`;
          td.appendChild(sp);
        }else if(!info && ci<cols-1 && !mergeAt(ri,ci+1)){
          const mg=document.createElement('button'); mg.type='button'; mg.className='mtool mmerge';
          mg.title='오른쪽 칸과 합칩니다'; mg.textContent='⇥合'; mg.dataset.mmerge=`${ri}:${ci}`;
          td.appendChild(mg);
        }
        tr.appendChild(td);
      });
      tr.appendChild(document.createElement('td'));
      t.appendChild(tr);
    });

    const fr=document.createElement('tr');
    const fh=document.createElement('td');
    fh.className='rhead';
    fh.innerHTML=`<button type="button" class="mini" data-ri="${ST.rows.length}" title="맨 아래에 행 넣기">＋</button>`;
    fr.appendChild(fh); t.appendChild(fr);

    host.innerHTML=''; host.appendChild(t);
    $$('.cell',host).forEach(fit);
    buildHandles(cols);

    $$('[data-ci]',host).forEach(b=>b.onclick=()=>{
      const c=+b.dataset.ci;
      ST.rows.forEach(r=>r.splice(c,0,''));
      ST.al.splice(c,0,'');
      if(ST.widths) ST.widths.splice(c,0,0);
      /* 넣은 자리가 병합 «안쪽» 이면 그 병합이 한 칸 넓어지고, 병합보다 뒤면 자리만 밀린다 */
      (ST.merges||[]).forEach(m=>{
        if(c>m.c && c<m.c+m.n) m.n+=1;
        else if(c<=m.c) m.c+=1;
      });
      paint();
    });
    $$('[data-cd]',host).forEach(b=>b.onclick=()=>{
      const c=+b.dataset.cd;
      if(ST.rows[0].length<=1) return say('열이 하나뿐입니다.');
      ST.rows.forEach(r=>r.splice(c,1)); ST.al.splice(c,1);
      if(ST.widths) ST.widths.splice(c,1);
      /* 지운 자리가 병합 안쪽이면 한 칸 좁아지고(1칸으로 줄면 병합을 없앤다), 병합보다 앞이면 자리를 당긴다 */
      if(ST.merges){
        ST.merges = ST.merges.map(m=>{
          if(c>=m.c && c<m.c+m.n){ m.n-=1; return m.n>1?m:null; }
          if(c<m.c){ m.c-=1; return m; }
          return m;
        }).filter(Boolean);
      }
      paint();
    });
    $$('[data-al]',host).forEach(b=>b.onclick=()=>{
      const c=+b.dataset.al, o=['','l','c','r'];
      ST.al[c]=o[(o.indexOf(ST.al[c]||'')+1)%4];
      paint();
    });
    $$('[data-w]',host).forEach(inp=>inp.onchange=()=>{
      const c=+inp.dataset.w, v=parseFloat(inp.value);
      if(!ST.widths) ST.widths = ST.rows[0].map(()=>0);
      ST.widths[c] = (!isNaN(v)&&v>0) ? Math.min(100,v) : 0;
      if(!ST.widths.some(x=>x>0)){
        ST.widths=null;
        colEls().forEach((col,idx)=>{ if(idx>0&&idx<=cols) col.style.width=''; });
      }else{
        const eff = effectiveWidths(ST.widths.slice(0,cols));
        colEls().forEach((col,idx)=>{
          const ci = idx-1; if(ci<0||ci>=cols) return;
          col.style.width = eff[ci]+'%';
        });
      }
      positionHandles();
      say(ST.widths ? '열 너비를 정했습니다. 비운 칸은 남은 폭을 나눠 씁니다.' : '열 너비를 자동으로 되돌렸습니다.');
    });
    $$('[data-ri]',host).forEach(b=>b.onclick=()=>{
      const i=+b.dataset.ri;
      ST.rows.splice(i,0,ST.rows[0].map(()=>''));
      (ST.merges||[]).forEach(m=>{ if(m.r>=i) m.r+=1; });
      paint();
    });
    $$('[data-rd]',host).forEach(b=>b.onclick=()=>{
      const i=+b.dataset.rd;
      if(ST.rows.length<=2) return say('머리글과 줄 하나는 남아 있어야 합니다.');
      ST.rows.splice(i,1);
      if(ST.merges){
        ST.merges = ST.merges.filter(m=>m.r!==i).map(m=>{ if(m.r>i) m.r-=1; return m; });
      }
      paint();
    });
    $$('[data-mmerge]',host).forEach(b=>b.onclick=()=>{
      const [r,c] = b.dataset.mmerge.split(':').map(Number);
      if(!ST.merges) ST.merges=[];
      /* 이미 병합 시작 칸이면 한 칸 더 늘리고, 아니면 새로 하나 만든다.
         바로 오른쪽이 다른 병합의 시작이면 그 폭까지 통째로 흡수한다. */
      let m = ST.merges.find(x=>x.r===r && x.c===c);
      if(m){ m.n = Math.min(cols-c, m.n+1); }
      else{
        const j = ST.merges.findIndex(x=>x.r===r && x.c===c+1);
        if(j>=0){ const absorbed=ST.merges.splice(j,1)[0]; ST.merges.push({r,c,n:2+(absorbed.n-1)}); }
        else ST.merges.push({r,c,n:2});
      }
      say('칸을 합쳤습니다. 도로 나누려면 합친 칸의 ✂ 를 누르세요.');
      paint();
    });
    $$('[data-msplit]',host).forEach(b=>b.onclick=()=>{
      const [r,c] = b.dataset.msplit.split(':').map(Number);
      if(ST.merges) ST.merges = ST.merges.filter(x=>!(x.r===r && x.c===c));
      say('칸을 나눴습니다.');
      paint();
    });
  }
  const say = t => { msg.textContent = t||''; };

  function build(){
    const cols = ST.rows[0].length;
    const out=[];
    if(ST.widths && ST.widths.some(x=>x>0)){
      const w = effectiveWidths(ST.widths.slice(0,cols));
      out.push(`<!--cols:${w.join(',')}-->`);
    }
    if(ST.merges && ST.merges.length){
      out.push(`<!--merge:${ST.merges.map(m=>`${m.r}:${m.c}:${m.n}`).join(';')}-->`);
    }
    out.push(joinRow(ST.rows[0]));
    out.push(sepOf(ST.al.slice(0,cols)));
    ST.rows.slice(1).forEach(r=>out.push(joinRow(r)));
    return out.join('\n');
  }

  $('[data-t="addr"]',P).onclick = ()=>{ ST.rows.push(ST.rows[0].map(()=>'')); paint(); };
  $('[data-t="addc"]',P).onclick = ()=>{
    ST.rows.forEach(r=>r.push('')); ST.al.push('');
    if(ST.widths) ST.widths.push(0);
    paint();
  };
  $('[data-t="cancel"]',P).onclick = ()=>P.classList.remove('on');
  $('[data-t="ok"]',P).onclick = ()=>{
    const ta = W.__ta || $('#edTa', W); if(!ta) return;
    const L = ta.value.split('\n');
    const body = build().split('\n');
    L.splice(ST.from, ST.to-ST.from, ...body);
    ta.value = L.join('\n');
    /* 새로 만든 표라면 커서를 표 아래로 옮겨 둔다 */
    const pos = L.slice(0, ST.from+body.length).join('\n').length;
    ta.selectionStart = ta.selectionEnd = pos;
    P.classList.remove('on');
    ta.focus();
    try{ W.__paint && W.__paint() }catch(e){globalThis.__q?.(e)}
    /* ★ «표 적용» 은 이 칸의 초안(textarea)에 표를 끼워 넣을 뿐, 서버에는
       아직 안 올라갔다 — 창 맨 아래 «저장» 을 눌러야 진짜로 남는다.
       여기서 놓치기 쉬우므로 저장 단추를 잠깐 빛나게 해서 눈에 띄게 한다. */
    const edMsg = document.getElementById('edMsg');
    if(edMsg){ edMsg.textContent = '표를 넣었습니다 — 이 창의 «저장» 을 눌러야 실제로 반영됩니다.'; edMsg.classList.remove('bad'); }
    const saveBtn = document.getElementById('edSave');
    if(saveBtn){ saveBtn.classList.add('needsave'); setTimeout(()=>saveBtn.classList.remove('needsave'), 3000); }
  };

  P.__open = () => {
    const ta = W.__ta || $('#edTa', W); if(!ta) return;
    const all = findTables(ta.value);
    const ln = lineAt(ta.value, ta.selectionStart);
    let t = all.find(x=>ln>=x.from && ln<x.to);
    if(!t && all.length===1) t = all[0];
    if(!t && all.length>1){
      const pick = prompt(`표가 ${all.length}개 있습니다. 몇 번째 표를 고칠까요? (1~${all.length})`, '1');
      if(pick===null) return;
      t = all[Math.min(all.length, Math.max(1, parseInt(pick,10)||1))-1];
    }
    if(!t){
      /* 표가 없으면 커서 자리에 2×3 짜리 새 표를 만든다 */
      const at = lineAt(ta.value, ta.selectionStart) + (ta.value.trim()?1:0);
      ST = { rows:[['','',''],['','','']], al:['','',''], widths:null, merges:[], from:at, to:at };
    }else{
      ST = { rows:t.rows.map(r=>r.slice()), al:t.al.slice(),
             widths:t.widths?t.widths.slice():null, merges:(t.merges||[]).map(m=>({...m})),
             from:t.from, to:t.to };
    }
    say(all.length ? '' : '표가 없어 새 표를 하나 만들었습니다.');
    paint();
    P.classList.add('on');
    setTimeout(()=>{ const c=$('.cell',host); c&&c.focus(); }, 30);
  };
  return P;
}

/* 고치기 창의 연장 줄에 «⊞ 표» 를 끼운다 */
function tableBtn(){
  const W = $('.edw'); if(!W) return;
  const tools = $('.tools', W); if(!tools || $('#edTbl', W)) return;
  const b = document.createElement('button');
  b.type='button'; b.id='edTbl'; b.textContent='⊞ 표 고치기';
  b.title='커서가 놓인 표를 눈으로 고칩니다 — 행·열 넣고 빼기, 열 너비, 칸 안 줄바꿈';
  b.onclick = ()=>{ const P=tableEditor(); P && P.__open(); };
  const pic = $('#edPic', W);
  pic ? pic.after(b) : tools.insertBefore(b, tools.firstChild);
  /* 안내 한 줄도 실제와 맞춰 준다 */
  const hint = $('.hint', tools);
  if(hint && hint.innerHTML.indexOf('표는') < 0)
    hint.innerHTML += ' · 표는 <b>⊞ 표 고치기</b> · 칸 안 줄바꿈은 <b>&lt;br&gt;</b>';
}

/* ══════════════════════════════════════════════
   4) 원래 있던 그리개에 얹는다
   ══════════════════════════════════════════════ */
function afterList(){
  try{ soloList() }catch(e){globalThis.__q?.(e)}
  try{ tightBtns() }catch(e){globalThis.__q?.(e)}
}
function afterOv(){
  try{ soloOv() }catch(e){globalThis.__q?.(e)}
  try{ tightOvBtns() }catch(e){globalThis.__q?.(e)}
}

const hook = setInterval(()=>{
  if(typeof window.drawList!=='function' || typeof window.ovDraw!=='function') return;
  if(window.drawList.__v153 && window.ovDraw.__v153) return;

  if(!window.drawList.__v153){
    const o = window.drawList;
    const w = function(){ const v=o.apply(this,arguments); setTimeout(afterList,0); return v; };
    w.__v153=1; w.__tag=o.__tag; w.__guard=o.__guard; w.__probe=o.__probe;
    window.drawList=w;
  }
  if(!window.ovDraw.__v153){
    const o = window.ovDraw;
    const w = function(){ soloSeg(); const v=o.apply(this,arguments); setTimeout(afterOv,0); return v; };
    w.__v153=1; w.__safe=o.__safe;
    window.ovDraw=w;
  }
  clearInterval(hook);
  afterList();
}, 250);
setTimeout(()=>clearInterval(hook), 30000);

/* 고치기 창은 처음 열릴 때 만들어진다 — 나타나면 단추를 끼운다 */
const mo = new MutationObserver(()=>{ try{ tableBtn() }catch(e){globalThis.__q?.(e)} });
mo.observe(document.body, { childList:true });
setTimeout(()=>{ try{ tableBtn() }catch(e){globalThis.__q?.(e)} }, 1500);
document.addEventListener('click', ()=>setTimeout(()=>{ try{ tableBtn() }catch(e){globalThis.__q?.(e)} }, 60), true);

try{ window.__v153 = { tight, tightSave, tightDown, findTables, isSolo }; }catch(e){globalThis.__q?.(e)}
})();
