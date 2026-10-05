/* practice.html 에서 분리 (v341) — 원래 9445번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

  /* ══ ① ![](주소) 를 그림으로 그린다 ══
     mdLite · mdRich 는 그림 표기를 모른다. 두 함수가 내놓은 HTML 을 한 번 더 훑어
     그림으로 바꿔 끼운다. esc() 를 이미 지난 뒤라 표기는 글자 그대로 남아 있다. */
  const IMGRE = /!\[([^\]\n]*)\]\(([^)\s]+)\)/g;
  const imgHtml = h => String(h == null ? '' : h).replace(IMGRE,
    (m, a, u) => `<img class="mdimg" src="${u}" alt="${a.replace(/"/g,'')}" loading="lazy">`);

  ['mdLite','mdRich'].forEach(name => {
    const fn = window[name];
    if(typeof fn !== 'function' || fn.__img) return;
    const w = function(md){ return imgHtml(fn(md)); };
    w.__img = 1; w.__tex = fn.__tex; w.__sci = fn.__sci;
    window[name] = w;
  });

  /* 그림을 누르면 원본 크기로 폈다가 되돌린다 */
  document.addEventListener('click', e => {
    const im = e.target.closest && e.target.closest('img.mdimg');
    if(im){ e.preventDefault(); e.stopPropagation(); im.classList.toggle('zoom'); }
  }, true);

  /* ══ ② 어떤 칸을 고치는가 ══ */
  const FIELD = {
    '문제'      : { key:'q_md',    md:'mdRich' },
    '답안'      : { key:'a_md',    md:'mdRich' },
    '쉬운 풀이' : { key:'easy_md', md:'mdLite' }
  };
  const rowOf = id => (typeof ROWS !== 'undefined' ? ROWS : []).find(x => String(x.id) === String(id));

  /* ══ ③ 칸 이름 옆에 «✎ 고치기» 를 끼운다 ══ */
  function addBtns(root){
    $$('.plabel, .ovl .plab', root || document).forEach(lab => {
      if(lab.querySelector('.edb')) return;
      const name = (lab.childNodes[0]?.textContent || lab.textContent || '').trim();
      const f = FIELD[name]; if(!f) return;

      /* 어느 문항인가 — 목록은 카드에서, 한눈에 보기는 지금 열린 문항에서 */
      const card = lab.closest('.pcard');
      const inOv = !!lab.closest('#ovl');
      if(!card && !inOv) return;

      const b = document.createElement('button');
      b.type = 'button'; b.className = 'edb'; b.textContent = '✎ 고치기';
      b.title = name + ' 을 직접 고쳐 씁니다 (그림은 Ctrl+V)';
      b.onclick = ev => {
        ev.preventDefault(); ev.stopPropagation();
        const id = card ? card.dataset.id : (typeof OVID !== 'undefined' ? OVID : null);
        /* 밖에서 감쌀 수 있게 반드시 window 를 거쳐 부른다 —
           안에서 직접 부르면 v137 의 «원본 그림» 줄이 열린 것을 못 알아챈다. */
        if(id) (window.__edOpen || open)(id, name, f);
      };
      lab.appendChild(b);
    });
  }

  /* ══ ④ 고쳐 쓰는 창 ══ */
  let W = null, CUR = null;

  function build(){
    if(W) return W;
    W = document.createElement('div');
    W.className = 'edw';
    W.innerHTML = `
      <div class="box">
        <div class="eh"><b id="edTitle">고쳐 쓰기</b><small id="edSub"></small><span class="sp"></span>
          <button type="button" id="edClose">닫기 (Esc)</button></div>
        <div class="tools">
          <button type="button" id="edPic">🖼 그림 넣기</button>
          <button type="button" id="edRaw" style="display:none">가 원문 글자 가져오기</button>
          <button type="button" id="edPrevT">미리 보기 끄기</button>
          <span class="hint">그림은 <b>Ctrl+V</b> 로 바로 붙이거나 창 안으로 끌어다 놓으세요 ·
            수식은 <b>$…$</b> · 저장은 <b>Ctrl+Enter</b></span>
        </div>
        <div class="body"><textarea id="edTa" spellcheck="false"></textarea>
          <div class="prev" id="edPrev"></div></div>
        <div class="ef"><span class="msg" id="edMsg"></span>
          <button type="button" id="edCancel">취소</button>
          <button type="button" class="go" id="edSave">저장</button></div>
      </div>`;
    document.body.appendChild(W);

    const ta = $('#edTa', W), prev = $('#edPrev', W), msg = $('#edMsg', W);
    const say = (t, bad) => { msg.textContent = t || ''; msg.classList.toggle('bad', !!bad); };

    /* 미리 보기 — 저장하기 전에 수식·그림이 제대로 그려지는지 눈으로 본다 */
    let PREV = true;
    const paint = () => {
      if(!PREV || !CUR) return;
      const md = window[CUR.f.md] || window.mdLite;
      prev.innerHTML = md(ta.value);
      /* 칸마다 결이 다르다 — 지난 번 것이 남아 있으면 글씨가 뒤섞인다 */
      prev.classList.remove('ez', 'qmd');
      prev.classList.add(CUR.f.key === 'easy_md' ? 'ez' : 'qmd');
      try{ window.renderMathInElement && window.renderMathInElement(prev, { delimiters:[
        { left:'$$', right:'$$', display:true }, { left:'$', right:'$', display:false },
        { left:'\\[', right:'\\]', display:true }, { left:'\\(', right:'\\)', display:false }
      ], throwOnError:false, ignoredTags:['script','style','textarea','pre','code'] }); }catch(e){globalThis.__q?.(e)}
    };
    let pt = 0;
    ta.addEventListener('input', () => { clearTimeout(pt); pt = setTimeout(paint, 260); });
    $('#edPrevT', W).onclick = () => {
      PREV = !PREV;
      prev.classList.toggle('off', !PREV);
      $('#edPrevT', W).textContent = PREV ? '미리 보기 끄기' : '미리 보기 켜기';
      paint();
    };

    /* ── 글 사이에 끼워 넣기 ── */
    function put_at(text){
      const s = ta.selectionStart, e = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
      ta.selectionStart = ta.selectionEnd = s + text.length;
      ta.focus(); paint();
    }

    /* ── 그림 올리기 ──
       캡처 원본을 그대로 올리면 몇 MB 씩 쌓인다. 답안 붙이기와 똑같이 폭 1400px 로 줄인다. */
    async function upload(file){
      if(!/^image\//.test(file.type)) return say('그림 파일만 붙일 수 있습니다.', true);
      if(typeof put !== 'function') return say('올리는 장치를 찾지 못했습니다.', true);
      const r = CUR && rowOf(CUR.id);
      const mark = `![올리는 중…](…)`;
      put_at(mark);
      say('그림을 올리는 중…');
      try{
        const bmp = await createImageBitmap(file);
        const k = Math.min(1, 1400 / bmp.width);
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(bmp.width * k));
        cv.height = Math.max(1, Math.round(bmp.height * k));
        const g = cv.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
        g.drawImage(bmp, 0, 0, cv.width, cv.height);
        bmp.close && bmp.close();
        const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.88));
        const path = `prac/${r ? r.subject_id : 'md'}/md_${CUR ? CUR.id : 'x'}_${Date.now()}.jpg`;
        const url = await put(path, blob);
        ta.value = ta.value.replace(mark, `![](${url})`);
        say('그림을 넣었습니다.');
        paint();
      }catch(e){
        ta.value = ta.value.replace(mark, '');
        say('그림을 올리지 못했습니다 — ' + (e && e.message ? e.message : e), true);
        paint();
      }
    }

    /* ── 아직 글자로 안 옮긴 문항 ──
       PDF 에서 뽑아 둔 날글(q_text · a_text)이라도 들고 오면 처음부터 치지 않아도 된다. */
    $('#edRaw', W).onclick = () => {
      if(!CUR) return;
      const r = rowOf(CUR.id);
      const raw = r && r[CUR.f.key === 'a_md' ? 'a_text' : 'q_text'];
      if(!raw) return say('가져올 날글이 없습니다.', true);
      if(ta.value.trim() && !confirm('지금 쓴 것 뒤에 날글을 붙입니다. 계속할까요?')) return;
      put_at((ta.value.trim() ? '\n\n' : '') + String(raw).trim());
      say('날글을 붙였습니다. 표·수식은 손으로 다듬어 주세요.');
    };

    let PICK = null;
    $('#edPic', W).onclick = () => {
      if(!PICK){
        PICK = document.createElement('input');
        PICK.type = 'file'; PICK.accept = 'image/*'; PICK.multiple = true;
        PICK.style.display = 'none';
        document.body.appendChild(PICK);
      }
      PICK.value = '';
      PICK.onchange = async e => { for(const f of [...e.target.files]) await upload(f); };
      PICK.click();
    };

    /* Ctrl+V — 창이 열려 있는 동안에는 여기서 가로챈다.
       (예전 «답안 그림 붙이기» 는 글상자 안에서는 비켜서므로 서로 부딪히지 않는다) */
    W.addEventListener('paste', async e => {
      const items = [...(e.clipboardData && e.clipboardData.items || [])]
        .filter(x => x.type && x.type.startsWith('image/'));
      if(!items.length) return;
      e.preventDefault(); e.stopPropagation();
      for(const it of items){ const f = it.getAsFile(); if(f) await upload(f); }
    }, true);

    /* 끌어다 놓기 */
    W.addEventListener('dragover', e => { e.preventDefault(); W.classList.add('drop'); });
    W.addEventListener('dragleave', e => { if(e.target === W) W.classList.remove('drop'); });
    W.addEventListener('drop', async e => {
      e.preventDefault(); W.classList.remove('drop');
      for(const f of [...(e.dataTransfer && e.dataTransfer.files || [])]) await upload(f);
    });

    /* ── 저장 ── */
    async function save(){
      if(!CUR) return;
      const r = rowOf(CUR.id);
      if(!r) return say('문항을 찾지 못했습니다.', true);
      const val = ta.value.trim();
      const btn = $('#edSave', W);
      btn.disabled = true; say('저장하는 중…');
      try{
        const up = await sb.from('practicals').update({ [CUR.f.key]: val || null }).eq('id', r.id);
        if(up.error) throw up.error;
        r[CUR.f.key] = val || null;

        /* ★ 손으로 고친 칸은 표시해 둔다.
           «그림으로 보기» 에서는 글자를 안 보여 주는 규칙이라, 표시가 없으면
           고쳐 넣어 놓고도 화면이 그대로여서 «안 들어갔다» 고 여기게 된다.
           옛 회차처럼 아직 글자로 변환 안 한 문항에서 특히 그렇다. */
        if(CUR.f.key === 'q_md' || CUR.f.key === 'a_md'){
          try{ window.__handMdSet && window.__handMdSet(r.id, CUR.f.key === 'a_md' ? 'a' : 'q', !!val); }catch(e){globalThis.__q?.(e)}
        }
        if((CUR.f.key === 'q_md' || CUR.f.key === 'a_md') && val
           && typeof TEXTMODE !== 'undefined' && !TEXTMODE){
          TEXTMODE = true;
          try{ paintText(); }catch(e){globalThis.__q?.(e)}
        }
        close();
        try{ drawList(); }catch(e){globalThis.__q?.(e)}
        try{ if($('#ovl') && $('#ovl').classList.contains('on')) ovDraw(); }catch(e){globalThis.__q?.(e)}
      }catch(e){
        say('저장하지 못했습니다 — ' + (e && e.message ? e.message : e), true);
      }finally{ btn.disabled = false; }
    }
    $('#edSave', W).onclick = save;
    $('#edCancel', W).onclick = () => close(true);
    $('#edClose', W).onclick = () => close(true);
    W.addEventListener('mousedown', e => { if(e.target === W) close(true); });

    ta.addEventListener('keydown', e => {
      if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){ e.preventDefault(); save(); }
      if(e.key === 'Tab'){ e.preventDefault(); put_at('  '); }
    });

    W.__paint = paint; W.__ta = ta; W.__say = say;
    return W;
  }

  function open(id, name, f){
    const r = rowOf(id);
    if(!r) return;
    build();
    CUR = { id, name, f };
    $('#edTitle', W).textContent = name + ' 고쳐 쓰기';
    $('#edSub', W).textContent = `${r.year}년 제${r.session}회 ${r.no}번`;
    W.__say('');
    W.__ta.value = r[f.key] || '';
    const raw = f.key === 'easy_md' ? '' : (r[f.key === 'a_md' ? 'a_text' : 'q_text'] || '');
    $('#edRaw', W).style.display = raw ? '' : 'none';
    W.classList.add('on');
    document.body.style.overflow = 'hidden';
    W.__paint();
    setTimeout(() => W.__ta.focus(), 30);
  }

  function close(ask){
    if(!W || !W.classList.contains('on')) return;
    if(ask && CUR){
      const r = rowOf(CUR.id);
      const was = (r && r[CUR.f.key]) || '';
      if(W.__ta.value.trim() !== was.trim() && !confirm('고친 것을 버리고 닫습니다. 계속할까요?')) return;
    }
    W.classList.remove('on');
    document.body.style.overflow = '';
    CUR = null;
  }
  addEventListener('keydown', e => {
    if(e.key === 'Escape' && W && W.classList.contains('on')){
      e.preventDefault(); e.stopPropagation(); close(true);
    }
  }, true);

  window.__edOpen = open;

  /* ══ ⑤ 화면이 다시 그려질 때마다 단추를 다시 끼운다 ══ */
  addBtns();
  ['#list', '#ovl'].forEach(sel => {
    const wait = setInterval(() => {
      const n = document.querySelector(sel);
      if(!n) return;
      clearInterval(wait);
      new MutationObserver(() => setTimeout(() => addBtns(n), 20))
        .observe(n, { childList:true, subtree:true });
      addBtns(n);
    }, 250);
    setTimeout(() => clearInterval(wait), 20000);
  });
  setInterval(() => addBtns(), 1500);
})();
