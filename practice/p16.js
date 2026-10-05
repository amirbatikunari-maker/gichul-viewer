/* practice.html 에서 분리 (v341) — 원래 10237번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
  const B  = document.body;
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  const COLORS   = ['#BE2B26','#1D4ED8','#137A4B','#10233D'];
  /* 형광펜은 «펜 색을 옅게» 가 아니라 아예 다른 팔레트다.
     예전에는 무슨 색을 골라도 노랑(#FDE047)으로만 그어져서
     설정한 색과 나오는 색이 달랐다. */
  const HICOLORS = ['#FDE047','#86EFAC','#93C5FD','#F9A8D4'];
  const WIDTHS   = [2.0, 3.4, 6.0];
  const ALPHAS   = [['연',.20],['보통',.36],['진',.58]];
  const get = (k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } };
  const set = (k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){globalThis.__q?.(e)} };

  let ON      = false;
  let TOOL    = 'pen';                                  /* pen | hi | er */
  let COLOR   = get('pen:color', COLORS[0]);
  let HICOLOR = get('pen:hicolor', HICOLORS[0]);
  let ALPHA   = +get('pen:alpha', .36);          /* 형광펜 농도 */
  let WIDTH   = +get('pen:width', WIDTHS[1]);
  let PENONLY = get('pen:only','1') !== '0';
  let PRESS   = get('pen:press','1') !== '0';    /* 필압 쓰기 */

  /* ══ ① 남기기 ══
     예전 그림 필기는 ink 자루의 q · a 를 쓴다. 칸 필기는 Lq · La · Le 로 따로 둔다.
     한 자루를 나눠 쓰면 둘 중 하나가 다른 하나를 지운다. */
  const BAG = {};                                        /* `${qid}:${zone}` → [획, …] */
  const lkey = (id,z)=>`pinkl:${id}:${z}`;
  const skey = z => 'L' + z;
  const rowOf = id => (typeof ROWS !== 'undefined' ? ROWS : []).find(r => String(r.id) === String(id));

  function load(id, z){
    const k = `${id}:${z}`;
    if(BAG[k]) return BAG[k];
    let v = [];
    try{ v = JSON.parse(localStorage.getItem(lkey(id,z)) || '[]'); }catch(e){globalThis.__q?.(e)}
    if(!Array.isArray(v)) v = [];
    const srv = rowOf(id) && rowOf(id).ink && rowOf(id).ink[skey(z)];
    if(Array.isArray(srv) && srv.length > v.length) v = srv;
    return (BAG[k] = v);
  }
  let LAST = null;                                       /* 마지막으로 그은 칸 — 되돌리기가 여기부터 무른다 */
  const QUEUE = new Map();
  function store(id, z){
    const v = BAG[`${id}:${z}`] || [];
    set(lkey(id,z), JSON.stringify(v));
    clearTimeout(QUEUE.get(id + z));
    QUEUE.set(id + z, setTimeout(async () => {
      const r = rowOf(id); if(!r) return;
      const bag = { ...(r.ink || {}), [skey(z)]: v };
      r.ink = bag;
      try{ await sb.from('practicals').update({ ink: bag }).eq('id', id); }catch(e){globalThis.__q?.(e)}
    }, 1400));
  }

  /* ══ ② 어디에 씌우나 ══
     이름표(문제 · 답안 …) 줄은 덮지 않는다. 덮으면 접기도 «고치기» 도 안 눌린다. */
  const ZONES = [
    { sel:'.pcard .pcol-q',            z:'q' },
    { sel:'.pcard .pcol-ans',          z:'a' },
    { sel:'.pcard .pcol-ez',           z:'e' },
    { sel:'#ovl #ovLeft',              z:'q' },
    { sel:'#ovl .seg[data-seg="a"]',   z:'a' },
    { sel:'#ovl .seg[data-seg="e"]',   z:'e' }
  ];
  const idOf = host => {
    const c = host.closest('.pcard');
    if(c) return c.dataset.id;
    if(host.closest('#ovl') && typeof OVID !== 'undefined') return OVID;
    return null;
  };

  function mount(){
    ZONES.forEach(({sel,z}) => $$(sel).forEach(host => {
      try{
        if(host.__ink) { fit(host); return; }
        host.__ink = 1; host.__zone = z;
        host.classList.add('inkhost');
        const cv = document.createElement('canvas');
        cv.className = 'inkl';
        host.appendChild(cv);
        host.__cv = cv;
        bind(host, cv);
        new ResizeObserver(() => requestAnimationFrame(() => fit(host))).observe(host);
        fit(host);
      }catch(e){globalThis.__q?.(e)}
    }));
  }

  /* 이름표 아래부터 칸 끝까지가 필기판이다 */
  function fit(host){
    const cv = host.__cv; if(!cv) return;
    const lab = host.querySelector(':scope > .plabel, :scope > .plab');
    const top = lab ? lab.offsetTop + lab.offsetHeight + 2 : 0;
    cv.style.top = top + 'px';
    const w = host.clientWidth, h = Math.max(0, host.clientHeight - top);
    if(!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const nw = Math.round(w * dpr), nh = Math.round(h * dpr);
    if(cv.width !== nw || cv.height !== nh){
      cv.width = nw; cv.height = nh;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
    }
    draw(host);
  }

  /* ══ ③ 그리기 ══
     점을 x/W · y/W 로 적는다(둘 다 «폭» 으로 나눈다). 높이로 나누면 글이 늘어날 때
     써 둔 글씨가 세로로 찌그러진다. 폭으로만 나누면 비율이 안 깨진다. */
  function seg(ctx, S, i, W){
    const a = S.pts[i-1], b = S.pts[i];
    ctx.beginPath();
    ctx.lineWidth = Math.max(.6, ((a[2] + b[2]) / 2) * W);
    ctx.moveTo(a[0]*W, a[1]*W);
    ctx.lineTo(b[0]*W, b[1]*W);
    ctx.stroke();
  }
  function one(ctx, S, W, from){
    ctx.save();
    ctx.globalAlpha = S.a == null ? 1 : S.a;
    ctx.strokeStyle = S.c;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if(S.pts.length === 1){
      const p = S.pts[0];
      ctx.beginPath();
      ctx.arc(p[0]*W, p[1]*W, Math.max(.4, p[2]*W/2), 0, 6.284);
      ctx.fillStyle = S.c; ctx.fill();
    }
    for(let i = Math.max(1, from || 1); i < S.pts.length; i++) seg(ctx, S, i, W);
    ctx.restore();
  }
  function draw(host){
    const cv = host.__cv, id = idOf(host); if(!cv || !id) return;
    if(!cv.width || !cv.height) return;   /* 안 보이는(0크기) 칸은 그릴 것도 없다 — 건너뛴다 */
    try{
      const ctx = cv.getContext('2d');
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,cv.width,cv.height);
      const W = cv.width;
      load(id, host.__zone).forEach(S => {
        if(!S || !Array.isArray(S.pts) || !S.pts.length) return;   /* 잘못 저장된 줄은 조용히 건너뛴다 */
        try{ one(ctx, S, W); }catch(e){globalThis.__q?.(e)}
      });
    }catch(e){globalThis.__q?.(e)}
  }
  /* ★ 예전엔 «화면에 있는 모든 필기판»을 숨은 것까지 다 다시 그렸다 — 목록 뒤에
     깔린, 지금 안 보이는 카드까지 포함해서. 그 중 하나라도 필기 기록이 이상하게
     저장돼 있으면(«필기 도구» 켤 때마다) 오류가 카드 수만큼 줄줄이 떴다.
     지금 실제로 화면에 «보이는» 칸만 다시 그리면 그럴 일이 없다. */
  function redrawAll(){
    $$('.inkhost').forEach(host => {
      if(host.offsetParent === null) return;   /* display:none 등으로 안 보이면 건너뛴다 */
      draw(host);
    });
  }

  /* ══ ④ 펜 받기 ══ */
  let HOVERT = 0;
  function penSeen(){
    B.classList.add('inkpenhover');
    clearTimeout(HOVERT);
    HOVERT = setTimeout(() => B.classList.remove('inkpenhover'), 1400);
  }
  /* 손바닥 걸러내기 — 펜을 한 번이라도 본 뒤로는 «펜만» 인 동안 살갗을 안 받는다.
     대신 canvas 의 touch-action 을 열어 두어 손가락은 그대로 화면을 굴린다. */
  function allow(e){
    if(e.pointerType === 'pen'){ penSeen(); return true; }
    if(e.pointerType === 'mouse') return true;
    return !PENONLY;
  }
  /* S펜 뒤쪽 지우개·옆 단추 — 브라우저·기기마다 다르게 온다.
     크롬은 지우개를 buttons&32 로, 삼성인터넷·일부 펌웨어는 옆 단추를 buttons&2 로 준다.
     button 값(2·5)으로만 오는 경우도 있어 셋 다 받는다. */
  const eraserTip = e => e.pointerType === 'pen' &&
    (((e.buttons & 32) === 32) || ((e.buttons & 2) === 2) || e.button === 5 || e.button === 2);

  /* ★ 삼킨 점 받기 — 반드시 빈 배열을 대비해야 한다.
     getCoalescedEvents() 는 «믿을 수 있는» 이벤트가 아니거나 브라우저 사정에 따라
     빈 배열을 준다. 그대로 forEach 를 돌리면 점이 하나도 안 쌓여 «펜을 그어도
     아무것도 안 그려지는» 꼴이 된다. 예전 필기가 안 되던 것도 여기였다. */
  function coalesced(e){
    let a = null;
    try{ a = e.getCoalescedEvents ? e.getCoalescedEvents() : null; }catch(x){globalThis.__q?.(x)}
    return (a && a.length) ? a : [e];
  }

  function bind(host, cv){
    let cur = null, drawn = 0, PID = null;
    const ctx = cv.getContext('2d');

    const at = e => {
      const b = cv.getBoundingClientRect();
      const W = b.width || 1;
      return [ (e.clientX - b.left) / W, (e.clientY - b.top) / W ];
    };
    /* 필압 → 굵기. 폭으로 나눠 적어야 화면이 커져도 굵기 비율이 그대로다. */
    /* 필압 → 굵기.
       ★ 예전에는 pressure 가 0 이거나 늘 같은 값(0.5·1)으로만 들어오는 기기에서
         굵기가 통째로 고정됐다 — «필압이 안 먹는다» 가 이것이다.
         이제 두 갈래로 본다: 세기가 실제로 흔들리면 그것을 쓰고,
         고정값만 오면 «긋는 빠르기» 로 굵기를 흔든다(빠를수록 가늘게). */
    let PREV = null;                                   /* [x, y, t] */
    const wOf = (e, b) => {
      const base = (TOOL === 'hi' ? WIDTH * 5 : WIDTH) / (b || 1);
      if(e.pointerType === 'mouse' || !PRESS) return base;
      const pr = e.pressure;
      if(typeof pr === 'number' && pr > 0 && pr < 1)
        return base * clamp(.35 + pr * 1.75, .35, 2.1);
      /* 세기를 못 받는 기기 — 빠르기로 대신한다 */
      const p = at(e), now = performance.now();
      let f = 1;
      if(PREV){
        const d  = Math.hypot(p[0]-PREV[0], p[1]-PREV[1]);
        const dt = Math.max(8, now - PREV[2]);
        f = clamp(1.25 - (d / dt) * 26, .55, 1.25);
      }
      PREV = [p[0], p[1], now];
      return base * f;
    };
    function erase(p){
      const id = idOf(host); if(!id) return;
      const list = load(id, host.__zone);
      const R = .028;
      const keep = list.filter(S => !S.pts.some(q => Math.hypot(q[0]-p[0], q[1]-p[1]) < R));
      if(keep.length !== list.length){
        BAG[`${id}:${host.__zone}`] = keep; store(id, host.__zone); draw(host);
      }
    }

    cv.addEventListener('pointerenter', e => { if(e.pointerType === 'pen') penSeen(); });
    cv.addEventListener('pointerover',  e => { if(e.pointerType === 'pen') penSeen(); });

    /* 지금 화면에 닿아 있는 손가락·펜을 센다. 둘 이상이면 «확대하려는 것» 이다. */
    const DOWN = new Set();
    function undoStroke(id){
      if(!cur) return;
      const bag = load(id, host.__zone);
      const k = bag.lastIndexOf(cur);
      if(k >= 0) bag.splice(k, 1);
      cur = null;
      try{ draw(host) }catch(x){globalThis.__q?.(x)}
    }
    ['pointerup','pointercancel','pointerleave'].forEach(t =>
      cv.addEventListener(t, e => DOWN.delete(e.pointerId), { passive:true }));

    cv.addEventListener('pointerdown', e => {
      if(!ON) return;
      DOWN.add(e.pointerId);
      if(DOWN.size > 1){
        /* ★ 두 손가락 — 확대하려는 것이다. 방금 긋기 시작한 획을 지우고 손을 뗀다.
           그러지 않으면 확대할 때마다 짧은 금이 남는다. */
        try{ if(PID != null) cv.releasePointerCapture(PID) }catch(x){globalThis.__q?.(x)}
        const id0 = idOf(host); if(id0) undoStroke(id0);
        PID = null;
        return;
      }
      if(!allow(e)) return;
      const id = idOf(host); if(!id) return;
      e.preventDefault(); e.stopPropagation();
      try{ cv.setPointerCapture(e.pointerId); }catch(x){globalThis.__q?.(x)}
      PID = e.pointerId;
      if(TOOL === 'er' || eraserTip(e)){ cur = null; return erase(at(e)); }
      const b = cv.getBoundingClientRect().width;
      PREV = null;
      cur = TOOL === 'hi'
        ? { c:HICOLOR, a:ALPHA, pts:[[...at(e), wOf(e,b)]] }
        : { c:COLOR,   a:1,     pts:[[...at(e), wOf(e,b)]] };
      load(id, host.__zone).push(cur);
      drawn = 1;
      one(ctx, cur, cv.width);
    });

    cv.addEventListener('pointermove', e => {
      if(!ON || PID !== e.pointerId) return;
      if(DOWN.size > 1) return;                     /* 확대하는 중에는 긋지 않는다 */
      if(!allow(e)) return;
      e.preventDefault(); e.stopPropagation();
      const evs = coalesced(e);
      if(TOOL === 'er' || eraserTip(e)){ evs.forEach(ev => erase(at(ev))); return; }
      if(!cur) return;
      const b = cv.getBoundingClientRect().width;
      /* ★ 삼킨 점까지 모두 받되, 새로 들어온 마디만 덧그린다.
         획 전체를 다시 그리면 점이 쌓일수록 느려져 S펜을 못 따라간다. */
      evs.forEach(ev => cur.pts.push([...at(ev), wOf(ev,b)]));
      one(ctx, cur, cv.width, drawn);
      drawn = cur.pts.length;
    });

    const end = () => {
      if(PID == null) return;
      PID = null;
      if(cur){
        const id = idOf(host);
        if(id){ store(id, host.__zone); LAST = { id, z:host.__zone }; }
        cur = null;
      }
      draw(host);
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(t => cv.addEventListener(t, end));
  }

  /* ══ ⑤ 도구줄 ══ */
  let BARE = null;
  function bar(){
    if(BARE) return BARE;
    BARE = document.createElement('div');
    BARE.className = 'pbar mini';
    BARE.innerHTML =
      `<button class="fab" type="button" title="필기 (S펜)">✍</button>
       <button type="button" data-off title="필기 끄기">✍ 켬</button>
       <span class="tip" data-tip title="지금 그어지는 모양"><i></i></span><span class="sep"></span>
       <button type="button" data-t="pen" title="펜">✏ 펜</button>
       <button type="button" data-t="hi"  title="형광펜">🖍 형광</button>
       <button type="button" data-t="er"  title="지우개">🧽 지우개</button><span class="sep"></span>
       <span class="swrow" data-row="pen">${COLORS.map(c => `<button type="button" class="sw" data-c="${c}" style="background:${c}"></button>`).join('')}</span>
       <span class="swrow" data-row="hi">${HICOLORS.map(c => `<button type="button" class="sw" data-hc="${c}" style="background:${c}"></button>`).join('')}</span>
       <span class="sep"></span><span class="wl">굵기</span>
       ${WIDTHS.map((w,i) => `<button type="button" data-w="${w}">${['│','┃','█'][i]}</button>`).join('')}
       <span class="swrow" data-row="hi"><span class="wl">농도</span>
       ${ALPHAS.map(([n,a]) => `<button type="button" data-a="${a}">${n}</button>`).join('')}</span>
       <span class="sep"></span>
       <button type="button" data-undo title="되돌리기">↶</button>
       <button type="button" data-clear title="이 문항 필기 전부 지우기">비우기</button>
       <span class="sep"></span>
       <button type="button" data-press title="필압 — 누르는 세기(또는 긋는 빠르기)에 따라 굵기가 달라집니다">필압</button>
       <button type="button" data-only title="펜으로만 쓰기 — 손바닥·손가락은 안 그려집니다">✋ 펜만</button>`;
    document.body.appendChild(BARE);

    BARE.querySelector('.fab').onclick = () => toggle(true);
    BARE.addEventListener('click', e => {
      const b = e.target.closest('button'); if(!b || b.classList.contains('fab')) return;
      if(b.hasAttribute('data-off'))  return toggle(false);
      if(b.dataset.c){ COLOR = b.dataset.c; TOOL = 'pen'; set('pen:color', COLOR); return paint(); }
      if(b.dataset.hc){ HICOLOR = b.dataset.hc; TOOL = 'hi'; set('pen:hicolor', HICOLOR); return paint(); }
      if(b.dataset.a){ ALPHA = +b.dataset.a; TOOL = 'hi'; set('pen:alpha', b.dataset.a); return paint(); }
      if(b.dataset.w){ WIDTH = +b.dataset.w; set('pen:width', b.dataset.w); return paint(); }
      if(b.dataset.t){ TOOL = b.dataset.t; return paint(); }
      if(b.hasAttribute('data-press')){
        PRESS = !PRESS; set('pen:press', PRESS ? '1' : '0'); return paint();
      }
      if(b.hasAttribute('data-only')){
        PENONLY = !PENONLY; set('pen:only', PENONLY ? '1' : '0');
        B.classList.toggle('inkfinger', !PENONLY);
        return paint();
      }
      if(b.hasAttribute('data-undo')) return undo();
      if(b.hasAttribute('data-clear')) return clearOne();
    });
    return BARE;
  }
  function paint(){
    const t = bar();
    t.classList.toggle('is-hi', TOOL === 'hi');
    t.classList.toggle('is-er', TOOL === 'er');
    $$('[data-c]',  t).forEach(b => b.classList.toggle('on', b.dataset.c === COLOR));
    $$('[data-hc]', t).forEach(b => b.classList.toggle('on', b.dataset.hc === HICOLOR));
    $$('[data-a]',  t).forEach(b => b.classList.toggle('on', +b.dataset.a === ALPHA));
    $$('[data-w]',  t).forEach(b => b.classList.toggle('on', +b.dataset.w === WIDTH));
    $$('[data-t]',  t).forEach(b => b.classList.toggle('on', b.dataset.t === TOOL));
    t.querySelector('[data-only]').classList.toggle('on', PENONLY);
    t.querySelector('[data-press]').classList.toggle('on', PRESS);
    t.querySelector('[data-off]').classList.toggle('on', ON);
    /* 지금 무엇이 그어지는지 눈으로 — 색 · 굵기 · 농도를 그대로 보여 준다 */
    const tip = t.querySelector('[data-tip] i');
    if(tip){
      const hi = TOOL === 'hi';
      tip.style.background  = TOOL === 'er' ? 'transparent' : (hi ? HICOLOR : COLOR);
      tip.style.opacity     = TOOL === 'er' ? 1 : (hi ? ALPHA + .25 : 1);
      tip.style.width = tip.style.height = Math.round(clamp((hi ? WIDTH*3.2 : WIDTH*2.2), 6, 22)) + 'px';
      tip.style.border = TOOL === 'er' ? '2px dashed #94a3b8' : '0';
      tip.style.borderRadius = hi ? '3px' : '50%';
    }
    hoverPaint();
  }
  function toggle(v){
    ON = v == null ? !ON : v;
    B.classList.toggle('inkon', ON);
    B.classList.toggle('inkfinger', ON && !PENONLY);
    bar().classList.toggle('mini', !ON);
    if(ON){ mount(); redrawAll(); }
    paint();
  }

  /* 되돌리기·비우기는 «지금 보고 있는 문항» 을 다룬다 */
  function curId(){
    if($('#ovl') && $('#ovl').classList.contains('on') && typeof OVID !== 'undefined') return OVID;
    const hosts = $$('.pcard .inkhost');
    for(const h of hosts){
      const r = h.getBoundingClientRect();
      if(r.top < innerHeight * .6 && r.bottom > 0) return idOf(h);
    }
    return hosts.length ? idOf(hosts[0]) : null;
  }
  function undo(){
    const id = curId(); if(!id) return;
    /* 가장 나중에 그은 칸부터 무른다. 칸이 셋이라 «어디서» 를 골라야 하는데,
       그냥 순서대로 뒤지면 문제 칸에 그은 뒤에도 쉬운 풀이 칸이 먼저 물러진다. */
    const order = (LAST && String(LAST.id) === String(id))
      ? [LAST.z, ...['q','a','e'].filter(z => z !== LAST.z)]
      : ['a','q','e'];
    for(const z of order){
      const L = load(id, z);
      if(L.length){ L.pop(); store(id, z); redrawAll(); return; }
    }
  }
  function clearOne(){
    const id = curId(); if(!id) return;
    if(!confirm('이 문항에 쓴 필기를 전부 지웁니다.')) return;
    ['q','a','e'].forEach(z => { BAG[`${id}:${z}`] = []; store(id, z); });
    redrawAll();
  }

  /* ══ ⑤-2 S펜을 가까이 대면 «여기에 그어집니다» 를 보여 준다 ══
     예전에는 펜을 띄워도 아무 표시가 없어서, 어디에 닿을지 손으로 재야 했다.
     펜이 화면 위를 떠다니는 동안(buttons 0) 점을 따라다니게 한다. */
  let HDOT = null;
  function hoverDot(){
    if(HDOT) return HDOT;
    HDOT = document.createElement('div');
    HDOT.className = 'penhover';
    document.body.appendChild(HDOT);
    return HDOT;
  }
  function hoverPaint(){
    const d = HDOT; if(!d) return;
    const hi = TOOL === 'hi';
    const px = clamp((hi ? WIDTH * 4.5 : WIDTH * 3), 10, 40);
    d.style.width = d.style.height = px + 'px';
    d.style.borderRadius = hi ? '4px' : '50%';
    d.style.background = TOOL === 'er' ? 'transparent' : (hi ? HICOLOR : COLOR);
    d.style.opacity = TOOL === 'er' ? 1 : (hi ? .45 : .55);
    d.style.border = TOOL === 'er' ? '2px dashed #64748b' : '1px solid rgba(255,255,255,.85)';
  }
  let HOFF = 0;
  function hoverAt(e){
    if(!ON || e.pointerType !== 'pen') return;
    penSeen();
    const d = hoverDot();
    hoverPaint();
    const px = parseFloat(d.style.width) || 14;
    d.style.left = (e.clientX - px/2) + 'px';
    d.style.top  = (e.clientY - px/2) + 'px';
    d.classList.add('on');
    d.classList.toggle('er', TOOL === 'er' || eraserTip(e));
    clearTimeout(HOFF);
    HOFF = setTimeout(() => d.classList.remove('on'), 700);
  }
  ['pointermove','pointerrawupdate','pointerover'].forEach(t => {
    try{ document.addEventListener(t, hoverAt, { passive:true, capture:true }); }catch(x){globalThis.__q?.(x)}
  });
  document.addEventListener('pointerdown', e => { if(e.pointerType === 'pen') hoverAt(e); }, true);
  document.addEventListener('pointerleave', () => HDOT?.classList.remove('on'), true);

  /* ══ ⑥ 화면이 바뀌면 다시 씌우고 다시 그린다 ══ */
  bar(); paint();
  B.classList.toggle('inkfinger', !PENONLY);
  let t0 = 0;
  const refresh = () => { clearTimeout(t0); t0 = setTimeout(() => { if(ON){ mount(); redrawAll(); } }, 60); };
  ['#list','#ovl'].forEach(sel => {
    const wait = setInterval(() => {
      const n = document.querySelector(sel);
      if(!n) return;
      clearInterval(wait);
      new MutationObserver(refresh).observe(n, { childList:true, subtree:true });
    }, 250);
    setTimeout(() => clearInterval(wait), 20000);
  });
  addEventListener('resize', refresh);
  window.__pen = { toggle, redrawAll, mount };
})();
