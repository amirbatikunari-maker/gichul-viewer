/* practice.html 에서 분리 (v341) — 원래 9914번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

  /* ══ ① «=60%» 가 붙은 그림 표기도 알아본다 ══
     v96 의 것은 괄호 안에 빈칸이 없어야만 알아본다. 크기를 붙이면 빈칸이 생기므로
     남겨진 것을 여기서 한 번 더 훑는다. */
  const SZRE = /!\[([^\]\n]*)\]\(\s*([^)\s]+)\s*=\s*(\d{1,3})\s*%\s*\)/g;
  const sized = h => String(h == null ? '' : h).replace(SZRE,
    (m, a, u, p) => `<img class="mdimg" src="${u}" alt="${a.replace(/"/g,'')}" `
      + `style="width:${Math.max(5,Math.min(100,+p))}%" loading="lazy">`);

  ['mdLite','mdRich'].forEach(n => {
    const fn = window[n];
    if(typeof fn !== 'function' || fn.__sz) return;
    const w = function(md){ return sized(fn(md)); };
    w.__sz = 1; w.__img = fn.__img; w.__tex = fn.__tex; w.__sci = fn.__sci;
    window[n] = w;
  });

  /* 오려 온 그림([[그림 …]])은 figFill 이 나중에 <img> 를 끼운다.
     figure 에 적어 둔 data-w 를 그 그림에 옮겨 준다. */
  function paintFigW(root){
    $$('figure[data-w] > img', root || document).forEach(im => {
      const p = +im.parentElement.dataset.w;
      if(p > 0 && im.style.width !== p + '%') im.style.width = p + '%';
    });
  }

  /* ══ ② 어느 글의 몇 번째 그림인가 ══ */
  function fieldOf(el){
    if(el.closest('.easybox') || el.closest('.ez')) return 'easy_md';
    if(el.closest('#ovl')){
      if(el.closest('#ovLeft')) return 'q_md';
      const seg = el.closest('.seg');
      return seg && seg.dataset.seg === 'a' ? 'a_md' : 'q_md';
    }
    const q = el.closest('[data-qmd]');
    if(q) return q.getAttribute('data-qmd') === 'a' ? 'a_md' : 'q_md';
    return null;
  }
  function idOf(el){
    const c = el.closest('.pcard');
    if(c) return c.dataset.id;
    if(el.closest('#ovl') && typeof OVID !== 'undefined') return OVID;
    return null;
  }
  const rowOf = id => (typeof ROWS !== 'undefined' ? ROWS : []).find(x => String(x.id) === String(id));

  /* 그림 하나를 가리키는 표 — 붙인 그림은 주소로, 오려 온 그림은 자른 자리로 */
  function keyOf(im){
    const f = im.closest('figure[data-fig]');
    if(f) return { kind:'fig', key:f.dataset.fig || '' };
    return { kind:'img', key:im.getAttribute('src') || '' };
  }

  const nums = s => String(s || '').split(',').map(v => parseFloat(v)).filter(v => !isNaN(v));
  const sameBox = (a, b) => {
    const x = nums(a), y = nums(b);
    return x.length === 4 && y.length === 4 && x.every((v, i) => Math.abs(v - y[i]) < 0.002);
  };

  /* ══ ③ 글에 크기를 적어 넣는다 ══ */
  function writeSize(md, kind, key, pct){
    let s = String(md || '');
    if(kind === 'img'){
      const q = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('!\\[([^\\]\\n]*)\\]\\(\\s*' + q + '(?:\\s*=\\s*\\d{1,3}\\s*%)?\\s*\\)', 'g');
      return s.replace(re, (m, a) => pct && pct < 100 ? `![${a}](${key} =${pct}%)` : `![${a}](${key})`);
    }
    return s.replace(/\[\[\s*그림\s*([0-9.,\s]*?)(?:=\s*(\d{1,3})\s*%)?\s*\]\]/g, (m, c) => {
      if(!sameBox(c, key)) return m;
      const cc = c.trim().replace(/\s+/g, '');
      return pct && pct < 100 ? `[[그림 ${cc} =${pct}%]]` : `[[그림 ${cc}]]`;
    });
  }

  /* 화면에 있는 «같은 그림» 을 모두 같은 크기로 — 목록과 한눈에 보기가 따로 놀지 않게 */
  function applyAll(kind, key, pct){
    const w = pct && pct < 100 ? pct + '%' : '';
    $$('img.mdimg, .qmd figure img').forEach(im => {
      const k = keyOf(im);
      if(k.kind !== kind) return;
      if(kind === 'img' ? k.key !== key : !sameBox(k.key, key)) return;
      im.classList.remove('raw');
      if(w) im.style.width = w; else im.style.removeProperty('width');
      const f = im.closest('figure[data-fig]');
      if(f){ if(w) f.dataset.w = pct; else delete f.dataset.w; }
    });
  }

  /* ══ ④ 크기 막대 ══ */
  let BAR = null, CUR = null;

  function bar(){
    if(BAR) return BAR;
    BAR = document.createElement('div');
    BAR.className = 'imsz';
    BAR.innerHTML = `<span class="t">크기</span>
      <input type="range" min="10" max="100" step="1" value="100">
      <b class="v">100%</b><span class="sep"></span>
      <button type="button" data-p="30" class="pz1">30</button>
      <button type="button" data-p="50">50</button>
      <button type="button" data-p="70">70</button>
      <button type="button" data-p="100">100</button>
      <span class="sep"></span>
      <button type="button" data-raw>⤢ 원본</button>
      <button type="button" data-x>✕</button>`;
    document.body.appendChild(BAR);
    BAR.addEventListener('mousedown', e => e.stopPropagation());

    const rg = BAR.querySelector('input'), vv = BAR.querySelector('.v');
    const live = p => {
      if(!CUR) return;
      vv.textContent = p + '%';
      applyAll(CUR.kind, CUR.key, p);
      place();
    };
    rg.addEventListener('input', () => live(+rg.value));
    rg.addEventListener('change', () => commit(+rg.value));
    $$('button[data-p]', BAR).forEach(b => b.onclick = () => {
      rg.value = b.dataset.p; live(+b.dataset.p); commit(+b.dataset.p);
    });
    BAR.querySelector('[data-raw]').onclick = () => {
      if(!CUR || !CUR.im) return;
      const on = CUR.im.classList.toggle('raw');
      if(on) CUR.im.style.removeProperty('width');
      else live(+rg.value);
      place();
    };
    BAR.querySelector('[data-x]').onclick = () => close();
    return BAR;
  }

  function place(){
    if(!BAR || !CUR || !CUR.im || !CUR.im.isConnected) return close();
    const r = CUR.im.getBoundingClientRect();
    const bw = BAR.offsetWidth || 420, bh = BAR.offsetHeight || 40;
    let top = r.bottom + 8;
    if(top + bh > innerHeight - 6) top = Math.max(6, r.top - bh - 8);
    let left = r.left + r.width / 2 - bw / 2;
    left = Math.max(6, Math.min(innerWidth - bw - 6, left));
    BAR.style.top = Math.round(top) + 'px';
    BAR.style.left = Math.round(left) + 'px';
  }

  function open(im){
    const id = idOf(im), f = fieldOf(im);
    const k = keyOf(im);
    bar();
    $$('.sel').forEach(x => x.classList.remove('sel'));
    im.classList.add('sel');
    const now = (() => {
      const w = im.style.width || (im.closest('figure[data-w]') ? im.closest('figure[data-w]').dataset.w + '%' : '');
      const m = String(w).match(/^(\d{1,3})%$/);
      return m ? +m[1] : 100;
    })();
    CUR = { im, id, field:f, kind:k.kind, key:k.key };
    BAR.querySelector('input').value = now;
    BAR.querySelector('.v').textContent = now + '%';
    BAR.classList.add('on');
    place();
    if(!id || !f) BAR.querySelector('.v').textContent = now + '%';
  }

  function close(){
    try{ flush(); }catch(e){globalThis.__q?.(e)}
    if(BAR) BAR.classList.remove('on');
    $$('.sel').forEach(x => x.classList.remove('sel'));
    CUR = null;
  }

  /* ── 남기기 ──
     밀고 있는 동안에는 안 부르고, 손을 뗀 뒤 한 번만 부른다.
     ★ 기다리는 일감은 «그림 하나마다» 따로 봐야 한다. 시계 하나를 돌려 쓰면
       그림 두 개를 연달아 줄일 때 뒤엣것이 앞엣것을 지워 버려 먼저 것이 안 남는다.
     ★ 저장은 줄을 세운다. 같은 문항의 두 칸을 겹쳐 고치면 나중 것이 앞 것을 덮어쓴다. */
  let PEND = null, SAVET = 0, CHAIN = Promise.resolve();

  function flush(){
    const job = PEND; PEND = null; clearTimeout(SAVET);
    if(!job) return;
    CHAIN = CHAIN.then(async () => {
      const r = rowOf(job.id); if(!r) return;
      try{
        const next = writeSize(r[job.field], job.kind, job.key, job.p);
        if(next === r[job.field]) return;
        const up = await sb.from('practicals').update({ [job.field]: next }).eq('id', r.id);
        if(up.error) throw up.error;
        r[job.field] = next;
      }catch(e){
        try{ log('그림 크기를 남기지 못했습니다 — ' + (e.message || e)); }catch(_){globalThis.__q?.(_)}
      }
    });
    return CHAIN;
  }

  function commit(p){
    if(!CUR) return;
    const { id, field, kind, key } = CUR;
    if(!id || !field) return;                 /* 어느 글인지 모르면 화면에만 남긴다 */
    if(!rowOf(id)) return;
    const sig = [id, field, kind, key].join('|');
    if(PEND && PEND.sig !== sig) flush();     /* 다른 그림으로 넘어가면 먼저 것부터 보낸다 */
    PEND = { sig, id, field, kind, key, p };
    clearTimeout(SAVET);
    SAVET = setTimeout(flush, 260);
  }
  addEventListener('beforeunload', () => { flush(); });

  /* ══ ⑤ 그림을 누르면 막대가 뜬다 ══
     v96 은 «눌러서 원본 크기» 였다. 그 손잡이는 막대 안의 «⤢ 원본» 으로 옮겼다.
     window 의 잡는 단계에 걸어 두면 document 에 걸린 예전 손잡이보다 먼저 온다. */
  addEventListener('click', e => {
    const im = e.target && e.target.closest && e.target.closest('img.mdimg, .qmd figure img');
    if(im){
      e.preventDefault(); e.stopPropagation();
      if(CUR && CUR.im === im) close(); else open(im);
      return;
    }
    if(BAR && BAR.classList.contains('on') && !e.target.closest('.imsz')) close();
  }, true);

  addEventListener('keydown', e => {
    if(e.key === 'Escape' && BAR && BAR.classList.contains('on')){
      e.preventDefault(); e.stopPropagation(); close();
    }
  }, true);
  addEventListener('scroll', () => { if(CUR) place(); }, true);
  addEventListener('resize', () => { if(CUR) place(); });

  /* ══ ⑥ 오려 온 그림에 폭을 입히기 — figFill 은 나중에 끼우므로 지켜본다 ══ */
  paintFigW();
  ['#list', '#ovl'].forEach(sel => {
    const wait = setInterval(() => {
      const n = document.querySelector(sel);
      if(!n) return;
      clearInterval(wait);
      new MutationObserver(() => setTimeout(() => paintFigW(n), 20))
        .observe(n, { childList:true, subtree:true });
      paintFigW(n);
    }, 250);
    setTimeout(() => clearInterval(wait), 20000);
  });
  setInterval(() => paintFigW(), 1200);
})();
