/* practice.html 에서 분리 (v341) — 원래 6531번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

/* ══════════════════════════════════════════════════════════════
   배경 음악 — 브라우저가 «그 자리에서 연주한다»

   음원 파일을 싣지 않는다. 녹음물은 전부 누군가의 저작물이고,
   남의 곡을 얹어 두면 그것부터 문제가 된다.
   그래서 화음 진행과 멜로디만 적어 두고 WebAudio 로 직접 소리를 만든다.
   화성 진행·음계는 공용 문법이라 누구의 것도 아니다.

     모드 1 «재즈»    — 포트폴리오 읽기전용에 깔린 것과 같은 엔진.
                        워킹 베이스 + 스윙 라이드 + ii-V-I 컴핑.
     모드 2 «판타지»  — 90년대 말 한국 온라인 RPG 마을 BGM 결.
                        3/4 왈츠 · 90BPM · D장조,
                        플루트/클라리넷 리드 + 하프 아르페지오 + 피아노 +
                        따뜻한 스트링 패드 + 첼레스타 장식음 + 아주 여린 타악.
                        일부러 얇고 건조하게 — 옛 사운드폰트 질감을 노렸다.

   · 저절로 켜지지 않는다. 눌러야 시작한다(브라우저도 그렇게만 허용한다).
   · 고른 모드는 이 기기에 기억해 두고, 다음에 들어오면 첫 조작 때 이어 튼다.
   ══════════════════════════════════════════════════════════════ */
(function(){
  const KEY  = "bgm-mode";                       /* "off" | "jazz" | "fantasy" */
  const NAME = { jazz:"가사 없는 재즈", fantasy:"판타지 마을" };
  const A = { ctx:null, master:null, wet:null, noise:null,
              mode:"off", timer:null, t:0, bar:0 };

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const $1 = s => document.querySelector(s);

  /* ── 소리 만드는 재료 ─────────────────────────────────── */
  function init(){
    if(A.ctx) return;
    const C = new (window.AudioContext || window.webkitAudioContext)();
    A.ctx = C;

    const m = C.createGain(); m.gain.value = 0.0001; m.connect(C.destination);
    A.master = m;

    /* 잔향 흉내 — 짧은 되울림 한 줄. 컨볼루션까지 갈 필요는 없다.
       고리 안에 DelayNode 가 있어야 WebAudio 가 순환 연결을 허락한다. */
    const d  = C.createDelay(0.6); d.delayTime.value = 0.15;
    const fb = C.createGain();     fb.gain.value = 0.32;
    const lp = C.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600;
    const wet = C.createGain();    wet.gain.value = 1;
    wet.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(m);
    A.wet = wet;

    /* 심벌·탬버린에 쓸 잡음 한 덩어리 */
    const n = C.createBuffer(1, C.sampleRate * 2, C.sampleRate);
    const dd = n.getChannelData(0);
    for(let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
    A.noise = n;
  }

  /* 한 음. send 를 주면 그만큼 잔향으로도 보낸다. vib 를 주면 떨림을 얹는다(플루트) */
  function tone(t, midi, dur, vol, type, cut, atk, send, vib){
    const C = A.ctx;
    const o = C.createOscillator(); o.type = type; o.frequency.value = hz(midi);
    const f = C.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cut;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + (atk || 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g);
    g.connect(A.master);
    if(send){
      const s = C.createGain(); s.gain.value = send;
      g.connect(s); s.connect(A.wet);
    }
    let lfo = null, lg = null;
    if(vib){
      lfo = C.createOscillator(); lfo.frequency.value = 5.2;
      lg = C.createGain(); lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(vib, t + Math.min(0.35, dur * 0.6));
      lfo.connect(lg).connect(o.frequency);
      lfo.start(t); lfo.stop(t + dur + 0.03);
    }
    o.start(t); o.stop(t + dur + 0.03);
  }

  function noise(t, dur, freq, q, vol, send){
    const C = A.ctx;
    const src = C.createBufferSource(); src.buffer = A.noise; src.loop = true;
    const bp = C.createBiquadFilter(); bp.type = "bandpass";
    bp.frequency.value = freq; bp.Q.value = q;
    const g = C.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g);
    g.connect(A.master);
    if(send){ const s = C.createGain(); s.gain.value = send; g.connect(s); s.connect(A.wet); }
    src.start(t); src.stop(t + dur + 0.03);
  }

  /* ══════════════════════════════════════════════
     모드 1 — 가사 없는 재즈
     ══════════════════════════════════════════════ */
  const QUAL = {
    m7: { chord:[0,3,7,10], voice:[3,10,14] },
    d7: { chord:[0,4,7,10], voice:[4,10,14] },
    M7: { chord:[0,4,7,11], voice:[4,11,14] },
    h7: { chord:[0,3,6,10], voice:[3,10,13] }
  };
  const TUNE = [
    [[62,"m7"]], [[67,"d7"]], [[60,"M7"]], [[60,"M7"]],
    [[64,"h7"]], [[69,"d7"]], [[62,"m7"]], [[62,"m7"]],
    [[67,"m7"]], [[60,"d7"]], [[65,"M7"]], [[65,"M7"]],
    [[62,"h7"]], [[67,"d7"]], [[60,"m7"]], [[62,"m7"],[67,"d7"]]
  ];
  const JBPM = 132, SWING = 0.64;

  function jazzBar(t0){
    const beat = 60 / JBPM;
    const bar  = TUNE[A.bar % TUNE.length];
    const next = TUNE[(A.bar + 1) % TUNE.length][0];
    const pick = b => bar.length === 1 ? bar[0] : (b < 2 ? bar[0] : bar[1]);

    for(let b = 0; b < 4; b++){
      const t = t0 + b * beat;
      const [root, q] = pick(b);
      const ch = QUAL[q];

      noise(t, 0.9, 7200, 0.7, b % 2 === 0 ? 0.055 : 0.04, 0.2);
      if(b === 1 || b === 3) noise(t + beat * SWING, 0.5, 7600, 0.7, 0.032, 0.2);
      if(b === 1 || b === 3) noise(t, 0.12, 4200, 1.4, 0.07);

      let n;
      if(b === 0) n = root - 24;
      else if(b === 3){
        const tgt = next[0] - 24;
        n = tgt + (Math.random() < 0.5 ? 1 : -1);
      } else n = root - 24 + ch.chord[1 + Math.floor(Math.random() * 3)];
      while(n < 33) n += 12; while(n > 52) n -= 12;
      tone(t, n, beat * 0.92, 0.16, "triangle", 520);

      const hit = (b === 0 && Math.random() < 0.55) || (b === 1 && Math.random() < 0.5)
               || (b === 2 && Math.random() < 0.35) || (b === 3 && Math.random() < 0.45);
      if(hit){
        const off = Math.random() < 0.5 ? 0 : beat * SWING;
        ch.voice.map(iv => {
          let m = root + iv;
          while(m < 60) m += 12; while(m > 78) m -= 12;
          return m;
        }).forEach((m, i) => tone(t + off + i * 0.006, m, 1.05, 0.045, "triangle", 2400, 0.012, 0.25));
      }
    }
    A.bar++;
    return t0 + beat * 4;
  }

  /* ══════════════════════════════════════════════
     모드 2 — 판타지 마을 (3/4 · 90BPM · D장조)

     화음 진행 16마디. 밝게 시작해 6·7마디에서 살짝 그늘이 지고 돌아온다.
     r = 화음을 쌓을 기준음, q = 반음 간격, b = 베이스 음.
     ══════════════════════════════════════════════ */
  const FBPM = 90;
  const PROG = [
    { r:62, q:[0,4,7],    b:38 },  /* D    */
    { r:69, q:[0,4,7],    b:37 },  /* A/C# */
    { r:59, q:[0,3,7],    b:35 },  /* Bm   */
    { r:66, q:[0,3,7],    b:42 },  /* F#m  */
    { r:67, q:[0,4,7],    b:43 },  /* G    */
    { r:62, q:[0,4,7],    b:38 },  /* D    */
    { r:64, q:[0,3,7,10], b:40 },  /* Em7  */
    { r:69, q:[0,4,7,10], b:45 },  /* A7   */
    { r:62, q:[0,4,7],    b:38 },  /* D    */
    { r:69, q:[0,4,7],    b:37 },  /* A/C# */
    { r:59, q:[0,3,7],    b:35 },  /* Bm   */
    { r:67, q:[0,4,7],    b:43 },  /* G    */
    { r:64, q:[0,3,7,10], b:40 },  /* Em7  */
    { r:69, q:[0,4,7,10], b:45 },  /* A7   */
    { r:62, q:[0,4,7],    b:38 },  /* D    */
    { r:69, q:[0,4,7,10], b:45 }   /* A7 — 다시 처음으로 */
  ];
  /* 멜로디 — [박, 음, 길이(박)]. 웅장하게 가지 않는다.
     «작은 마을을 걷다가 처음 보는 숲으로 들어가는» 정도의 걸음걸이. */
  const MEL = [
    [[0,78,1],[1,76,1],[2,74,1]],
    [[0,73,2],[2,74,1]],
    [[0,76,1],[1,78,1],[2,79,1]],
    [[0,78,3]],
    [[0,79,1],[1,81,1],[2,83,1]],
    [[0,81,2],[2,78,1]],
    [[0,76,1],[1,78,1],[2,79,1]],
    [[0,78,2],[2,73,1]],
    [[0,74,1],[1,78,1],[2,81,1]],
    [[0,83,2],[2,81,1]],
    [[0,78,1],[1,79,1],[2,78,1]],
    [[0,76,3]],
    [[0,76,1],[1,79,1],[2,78,1]],
    [[0,73,1],[1,74,1],[2,76,1]],
    [[0,74,3]],
    [[0,69,1],[1,73,1],[2,74,1]]
  ];

  /* 화음을 원하는 높이대로 쌓는다 */
  const voiceUp = (r, q, lo, hi) => q.map(iv => {
    let m = r + iv;
    while(m < lo) m += 12; while(m > hi) m -= 12;
    return m;
  });

  function fantasyBar(t0){
    const beat = 60 / FBPM;
    const i  = A.bar % PROG.length;
    const ch = PROG[i];
    const bar = t0;
    const chord = voiceUp(ch.r, ch.q, 60, 74);

    /* ── 따뜻한 스트링 패드 — 마디를 통째로 받친다. 아주 여리게 ── */
    chord.forEach((m, k) => tone(bar, m - 12, beat * 3.15, 0.020,
      "sawtooth", 1300, 0.55, 0.5));

    /* ── 왈츠 반주 — 쿵 짝 짝 ── */
    tone(bar, ch.b, beat * 0.95, 0.085, "triangle", 420, 0.02, 0.15);          /* 베이스 */
    for(const b of [1, 2])
      chord.forEach((m, k) => tone(bar + b * beat + k * 0.005, m, beat * 0.7,
        0.030, "triangle", 2200, 0.01, 0.3));                                   /* 피아노 */

    /* ── 하프 아르페지오 — 8분음표로 여섯 번, 마디마다 오르내림을 바꾼다 ── */
    const up = (A.bar % 2 === 0);
    const harp = chord.concat([chord[0] + 12]);
    for(let e = 0; e < 6; e++){
      const k = up ? e % harp.length : (harp.length - 1 - (e % harp.length));
      tone(bar + e * beat / 2, harp[k] + 12, 0.55, 0.028, "triangle", 3600, 0.006, 0.45);
    }

    /* ── 리드 — 8마디마다 플루트 ↔ 클라리넷 ── */
    const flute = (Math.floor(A.bar / 8) % 2) === 0;
    for(const [b, m, d] of MEL[i]){
      tone(bar + b * beat, m, d * beat * 0.94, flute ? 0.075 : 0.062,
           flute ? "sine" : "square", flute ? 2600 : 1500,
           flute ? 0.09 : 0.05, 0.4, flute ? 2.6 : 1.2);
    }

    /* ── 첼레스타 · 오르골 장식음 — 네 마디에 한 번, 아주 짧게 ── */
    if(i % 4 === 3){
      const c = chord[0] + 24;
      tone(bar + beat * 2, c, 0.9, 0.030, "sine", 6000, 0.004, 0.6);
      tone(bar + beat * 2.5, c + 4, 0.8, 0.024, "sine", 6000, 0.004, 0.6);
    }

    /* ── 아주 여린 타악 — 있는 줄도 모를 만큼만 ── */
    (function kick(){
      const C = A.ctx, o = C.createOscillator(), g = C.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(105, bar);
      o.frequency.exponentialRampToValueAtTime(45, bar + 0.11);
      g.gain.setValueAtTime(0.0001, bar);
      g.gain.exponentialRampToValueAtTime(0.055, bar + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, bar + 0.20);
      o.connect(g).connect(A.master);
      o.start(bar); o.stop(bar + 0.24);
    })();
    noise(bar + beat,     0.09, 6800, 1.1, 0.020, 0.3);      /* 탬버린 */
    noise(bar + beat * 2, 0.09, 6800, 1.1, 0.016, 0.3);
    if(i % 8 === 0) noise(bar, 1.1, 9000, 0.6, 0.016, 0.4);  /* 아주 약한 심벌 */

    A.bar++;
    return bar + beat * 3;
  }

  /* ── 앞질러 예약해 두는 시계 ── */
  function loop(){
    const C = A.ctx;
    const step = A.mode === "jazz" ? jazzBar : fantasyBar;
    let guard = 0;
    while(A.t < C.currentTime + 0.8 && guard++ < 8)
      A.t = step(Math.max(A.t, C.currentTime + 0.05));
  }

  /* ── 켜고 끄기 ─────────────────────────────────── */
  function stop(fade){
    if(!A.ctx) return;
    const C = A.ctx;
    clearInterval(A.timer); A.timer = null;
    A.mode = "off";
    A.master.gain.cancelScheduledValues(C.currentTime);
    A.master.gain.setValueAtTime(Math.max(0.0001, A.master.gain.value), C.currentTime);
    A.master.gain.exponentialRampToValueAtTime(0.0001, C.currentTime + (fade === 0 ? 0.05 : 0.8));
  }

  function play(mode){
    init();
    const C = A.ctx;
    C.resume?.();
    clearInterval(A.timer);
    A.mode = mode; A.bar = 0; A.t = C.currentTime + 0.15;
    const vol = mode === "jazz" ? 0.14 : 0.17;
    A.master.gain.cancelScheduledValues(C.currentTime);
    A.master.gain.setValueAtTime(0.0001, C.currentTime);
    A.master.gain.exponentialRampToValueAtTime(vol, C.currentTime + 1.8);  /* 살며시 올라온다 */
    loop();
    A.timer = setInterval(loop, 200);
  }

  function set(mode, remember){
    if(mode === "off") stop(); else play(mode);
    if(remember !== false){ try{ localStorage.setItem(KEY, mode); }catch(e){globalThis.__q?.(e)} }
    paint();
  }

  /* ── 단추 · 작은 차림표 ────────────────────────── */
  function paint(){
    const btn = $1("#bgmBtn"), txt = $1("#bgmTxt");
    if(!btn) return;
    const on = A.mode !== "off";
    btn.classList.toggle("on", on);
    if(txt) txt.textContent = on ? NAME[A.mode] : "음악";
    btn.title = on ? `${NAME[A.mode]} 재생 중 — 눌러서 바꾸거나 끄기` : "배경 음악 켜기";
    document.querySelectorAll("#bgmPop [data-m]").forEach(b =>
      b.classList.toggle("on", b.dataset.m === A.mode));
  }

  function wire(){
    const btn = $1("#bgmBtn"), pop = $1("#bgmPop");
    if(!btn || !pop) return;
    const wrap = btn.closest(".bgm") || btn.parentElement;
    btn.addEventListener("click", e => {
      e.stopPropagation();
      wrap.classList.toggle("open");
    });
    pop.addEventListener("click", e => {
      const b = e.target.closest("[data-m]"); if(!b) return;
      e.stopPropagation();
      wrap.classList.remove("open");
      set(b.dataset.m);
    });
    document.addEventListener("click", e => {
      if(!e.target.closest?.(".bgm")) wrap.classList.remove("open");
    });
    addEventListener("keydown", e => { if(e.key === "Escape") wrap.classList.remove("open"); });
    paint();

    /* 지난번에 켜 두었다면 이어서 튼다.
       다만 브라우저는 «사람이 무언가 건드리기 전» 에는 소리를 못 내게 막는다.
       그래서 첫 클릭·터치·스크롤을 기다렸다가 그때 시작한다. */
    let saved = "off";
    try{ saved = localStorage.getItem(KEY) || "off"; }catch(e){globalThis.__q?.(e)}
    if(saved === "jazz" || saved === "fantasy"){
      const evs = ["pointerdown","keydown","wheel","touchstart"];
      const kick = () => { if(A.mode === "off") set(saved, false); off(); };
      const off  = () => evs.forEach(v => removeEventListener(v, kick));
      evs.forEach(v => addEventListener(v, kick, { passive:true }));
    }
  }

  if(document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", wire);
  else wire();

  window.BGM = { set, stop, get mode(){ return A.mode; } };
})();
