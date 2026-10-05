/* practice.html 에서 분리 (v341) — 원래 8999번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';

  /* ── 글자 하나짜리 단위 기호 (㎸ · ㎡ …) ── */
  const UNIT = {
    '㎸':'\\mathrm{kV}','㎹':'\\mathrm{MV}','㎷':'\\mathrm{mV}','㎶':'\\mu\\mathrm{V}',
    '㎾':'\\mathrm{kW}','㎿':'\\mathrm{MW}','㎽':'\\mathrm{mW}','㎼':'\\mu\\mathrm{W}',
    '㎄':'\\mathrm{kA}','㎃':'\\mathrm{mA}','㎂':'\\mu\\mathrm{A}','㎁':'\\mathrm{nA}','㎀':'\\mathrm{pA}',
    '㏀':'\\mathrm{k}\\Omega','㏁':'\\mathrm{M}\\Omega','Ω':'\\Omega','Ω':'\\Omega','℧':'\\mho',
    '㎊':'\\mathrm{pF}','㎋':'\\mathrm{nF}','㎌':'\\mu\\mathrm{F}',
    '㎐':'\\mathrm{Hz}','㎑':'\\mathrm{kHz}','㎒':'\\mathrm{MHz}','㎓':'\\mathrm{GHz}','㎔':'\\mathrm{THz}',
    '㎰':'\\mathrm{ps}','㎱':'\\mathrm{ns}','㎲':'\\mu\\mathrm{s}','㎳':'\\mathrm{ms}',
    '㎜':'\\mathrm{mm}','㎝':'\\mathrm{cm}','㎞':'\\mathrm{km}','㎛':'\\mu\\mathrm{m}','㎚':'\\mathrm{nm}',
    '㎟':'\\mathrm{mm^2}','㎠':'\\mathrm{cm^2}','㎡':'\\mathrm{m^2}','㎢':'\\mathrm{km^2}',
    '㎣':'\\mathrm{mm^3}','㎤':'\\mathrm{cm^3}','㎥':'\\mathrm{m^3}','㎦':'\\mathrm{km^3}',
    '㎧':'\\mathrm{m/s}','㎨':'\\mathrm{m/s^2}','㏊':'\\mathrm{ha}',
    '㎏':'\\mathrm{kg}','㎎':'\\mathrm{mg}','㎍':'\\mu\\mathrm{g}','㌧':'\\mathrm{t}',
    '㎖':'\\mathrm{m\\ell}','㎗':'\\mathrm{d\\ell}','㎘':'\\mathrm{k\\ell}','ℓ':'\\ell',
    '㎩':'\\mathrm{Pa}','㎪':'\\mathrm{kPa}','㎫':'\\mathrm{MPa}','㎬':'\\mathrm{GPa}',
    '㏈':'\\mathrm{dB}','㎈':'\\mathrm{cal}','㎉':'\\mathrm{kcal}','㏄':'\\mathrm{cc}','㏅':'\\mathrm{cd}',
    '㏐':'\\mathrm{lm}','㏓':'\\mathrm{lx}','㏛':'\\mathrm{sr}','㏖':'\\mathrm{mol}',
    '㏜':'\\mathrm{Sv}','㏝':'\\mathrm{Wb}','㏗':'\\mathrm{pH}','㎯':'\\mathrm{rad/s^2}',
    '㎔':'\\mathrm{THz}','㎺':'\\mathrm{fs}','㎻':'\\mathrm{ps}','㏊':'\\mathrm{ha}',
    '℃':'{}^\\circ\\mathrm{C}','℉':'{}^\\circ\\mathrm{F}','㎭':'\\mathrm{rad}','㎮':'\\mathrm{rad/s}'
  };

  /* ── 셈·그리스 기호 ── */
  const SYM = {
    '×':'\\times','÷':'\\div','±':'\\pm','∓':'\\mp','∙':'\\cdot','•':'\\cdot','ㆍ':'\\cdot',
    '≤':'\\le','≥':'\\ge','≦':'\\le','≧':'\\ge','≠':'\\ne','≒':'\\approx','≈':'\\approx','≡':'\\equiv',
    '∠':'\\angle','∴':'\\therefore','∵':'\\because','∞':'\\infty','∫':'\\int','∑':'\\sum','∏':'\\prod',
    '∂':'\\partial','∝':'\\propto','∈':'\\in','⊂':'\\subset','∩':'\\cap','∪':'\\cup',
    '⊕':'\\oplus','⊗':'\\otimes','∇':'\\nabla','∮':'\\oint','∆':'\\Delta',
    '△':'\\Delta','▲':'\\Delta','▽':'\\nabla',   /* △결선 — 우리 글에서는 세모로 쓴다 */
    '→':'\\rightarrow','←':'\\leftarrow','⇒':'\\Rightarrow','⇔':'\\Leftrightarrow','↔':'\\leftrightarrow',
    '°':'^\\circ','′':"'",'″':"''",'−':'-','–':'-','＝':'=','∥':'\\parallel','⊥':'\\perp',
    'Ω':'\\Omega','Δ':'\\Delta','Σ':'\\Sigma','Π':'\\Pi','Φ':'\\Phi','Ψ':'\\Psi',
    'Λ':'\\Lambda','Γ':'\\Gamma','Θ':'\\Theta','Ξ':'\\Xi',
    'α':'\\alpha','β':'\\beta','γ':'\\gamma','δ':'\\delta','ε':'\\varepsilon','ζ':'\\zeta',
    'η':'\\eta','θ':'\\theta','ι':'\\iota','κ':'\\kappa','λ':'\\lambda','μ':'\\mu','µ':'\\mu',
    'ν':'\\nu','ξ':'\\xi','ρ':'\\rho','σ':'\\sigma','τ':'\\tau','υ':'\\upsilon',
    'φ':'\\phi','ϕ':'\\phi','χ':'\\chi','ψ':'\\psi','ω':'\\omega','π':'\\pi'
  };

  /* 윗줄이 «한 글자로 합쳐진» 것 — Ā 는 A+윗줄이 아니라 그 자체로 한 글자다.
     이걸 빠뜨리면 부정 표기가 반쪽만 수식이 된다. */
  const MAC = {'Ā':'A','ā':'a','Ē':'E','ē':'e','Ī':'I','ī':'i','Ō':'O','ō':'o',
               'Ū':'U','ū':'u','Ȳ':'Y','ȳ':'y','Ǣ':'AE','ǣ':'ae'};

  const SUP = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9',
               '⁺':'+','⁻':'-','⁼':'=','⁽':'(','⁾':')','ⁿ':'n','ⁱ':'i'};
  const SUB = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
               '₊':'+','₋':'-','₌':'=','₍':'(','₎':')','ₙ':'n','ₐ':'a','ₑ':'e','ₒ':'o','ₓ':'x'};

  const cls = o => '[' + Object.keys(o).join('') + ']';
  const SUPRE  = new RegExp(cls(SUP) + '+', 'g');
  const SUBRE  = new RegExp(cls(SUB) + '+', 'g');
  const UNITRE = new RegExp(cls(UNIT), 'g');
  const SYMRE  = new RegExp(cls(SYM),  'g');
  const MACRE  = new RegExp(cls(MAC),  'g');

  /* 숫자에 바로 붙는 단위 — 긴 것부터 적어야 «kVA» 가 «V» 로 먼저 잘리지 않는다 */
  const UNIT_TXT = 'kVA|MVA|kvar|kVar|Var|var|VA|kV|MV|mV|kW|MW|mW|kWh|Wh|kA|mA'
                 + '|kHz|MHz|GHz|Hz|mH|uH|nF|uF|pF|mF|rpm|mm|cm|km|nm|ms|us|ns|kg|mg|kJ|MJ|Wb|dB'
                 + '|V|A|W|F|H|J|N|C|K|T|s|m|g';

  /* 수식이라고 알아보게 해 주는 «씨앗» 글자 — 이게 있어야 그 언저리를 수식으로 본다.
     가운뎃점(·)은 한글 글월에서 «문제·답안» 처럼 너무 흔하므로 씨앗에서 뺀다. */
  const SEEDS = Object.keys(UNIT).join('')
              + Object.keys(SYM).filter(c => c !== 'ㆍ' && c !== '•').join('')
              + Object.keys(SUP).join('') + Object.keys(SUB).join('')
              + Object.keys(MAC).join('')
              + '√\u0304\u0305\u00AF';
  const SAFE = t => t.replace(/[\]\\^-]/g, m => '\\' + m);

  /* 씨앗은 «글자 하나» 만이 아니다. NOT( … ) 와 «숫자+단위» 도 수식으로 봐야
     한 줄 안에서 어떤 곳은 수식, 어떤 곳은 날글자로 갈리지 않는다. */
  const SEED = new RegExp('[' + SAFE(SEEDS) + ']'
             + '|\\bNOT\\s*\\('
             + '|\\d(?:\\.\\d+)?\\s?(?:' + UNIT_TXT + ')(?![A-Za-z0-9])'
             + '|\\[[A-Za-z][A-Za-z0-9/·\\s]{0,7}\\]');   /* [VA] · [Wb/m] 같은 단위 대괄호 */

  /* 수식 덩어리를 좌우로 늘릴 때 «넘어가도 되는» 글자.
     별표(*)는 마크다운 굵게(**…**) 와 부딪혀 빼 둔다. */
  const CONT = new RegExp('[0-9A-Za-z+\\-=/().,\\[\\]<>|%^_\'~ ' + SAFE(SEEDS) + '·]');

  const MAXRUN = 90;   /* 씨앗에서 이만큼만 늘린다 — 한 문장을 통째로 삼키지 않게 */

  /* ── 덩어리 앞뒤의 군더더기(공백·마침표·짝 안 맞는 괄호)를 밖으로 덜어 낸다 ── */
  function trimRun(t){
    let pre = '', post = '', m;
    if((m = t.match(/^\s+/))){ pre = m[0]; t = t.slice(m[0].length); }
    if((m = t.match(/\s+$/))){ post = m[0]; t = t.slice(0, -m[0].length); }
    for(let g = 0; g < 12; g++){
      let moved = false;
      if((m = t.match(/[.,]+$/))){ post = m[0] + post; t = t.slice(0, -m[0].length); moved = true; }
      const op = (t.match(/[([]/g) || []).length, cl = (t.match(/[)\]]/g) || []).length;
      if(cl > op && /[)\]]$/.test(t)){ post = t.slice(-1) + post; t = t.slice(0, -1); moved = true; }
      else if(op > cl && /^[([]/.test(t)){ pre += t[0]; t = t.slice(1); moved = true; }
      if(!moved) break;
    }
    if((m = t.match(/^[.,\s]+/))){ pre += m[0]; t = t.slice(m[0].length); }
    if((m = t.match(/\s+$/))){ post = m[0] + post; t = t.slice(0, -m[0].length); }
    return { pre, core: t, post };
  }

  /* ── 덩어리 하나를 LaTeX 로 옮긴다 ── */
  function toTex(x){
    let t = x;

    /* NOT( … ) → \overline{ … } · 안쪽부터 벗겨 낸다 */
    for(let g = 0; g < 40; g++){
      const m = t.match(/\bNOT\s*\(([^()]*)\)/i);
      if(!m) break;
      t = t.slice(0, m.index) + '\\overline{' + m[1].trim() + '}' + t.slice(m.index + m[0].length);
    }
    /* 윗줄이 붙은 글자(V̄ · Ā) → \overline{V} · 따로 붙은 것과 합쳐진 것 둘 다 */
    /* ★ v265 — 이어 쓴 윗줄(A̅B̅)은 한 줄로 이어진 뜻 → \overline 하나로 묶는다 */
    t = t.replace(/(?:[A-Za-z0-9]\u0305)+/g, m => '\\overline{' + m.replace(/\u0305/g, '') + '}');
    t = t.replace(/([A-Za-z0-9])[\u0304\u00AF]/g, '\\overline{$1}');
    t = t.replace(MACRE, c => '\\overline{' + MAC[c] + '}');

    t = t.replace(/%/g, '\\%').replace(/&/g, '\\&').replace(/#/g, '\\#');

    /* 위·아래 첨자 글자 → ^{ } · _{ } */
    t = t.replace(SUPRE, m => '^{' + [...m].map(c => SUP[c]).join('') + '}');
    t = t.replace(SUBRE, m => '_{' + [...m].map(c => SUB[c]).join('') + '}');

    /* 근호 */
    t = t.replace(/√\s*\(([^()]*)\)/g, '\\sqrt{$1}');
    t = t.replace(/√\s*([0-9]+(?:\.[0-9]+)?|[A-Za-z][0-9]*)/g, '\\sqrt{$1}');
    t = t.replace(/√/g, '\\sqrt{\\;}');

    t = t.replace(UNITRE, c => UNIT[c] + ' ');

    /* ㎸A · ㎾h 처럼 단위 기호 뒤에 글자가 더 붙은 것 — 한 덩어리 로만체로 합친다.
       (안 합치면 «kV» 는 곧고 «A» 만 기울어져 다른 것처럼 보인다)
       ★ 이 자리에서만 한다 — 아래에서 숫자 뒤 단위를 세운 뒤에 하면
         «380V I» 의 I 까지 단위로 빨려 들어간다. */
    t = t.replace(/\\mathrm\{([^{}]*)\}\s*([A-Za-z]{1,4})(?![A-Za-z])/g, (m, a, b) => '\\mathrm{' + a + b + '}');

    t = t.replace(/[·]/g, ' \\cdot ');
    t = t.replace(/~/g, ' \\sim ');
    t = t.replace(SYMRE,  c => ' ' + SYM[c] + ' ');

    /* 단위 대괄호 [VA] → [\mathrm{VA}] · 이미 수식으로 바뀐 것(\Omega)은 건드리지 않는다 */
    t = t.replace(/\[([A-Za-z][A-Za-z0-9/·\s]{0,7})\]/g, (m, u) => '[\\mathrm{' + u.trim() + '}]');
    /* [Wb/㎡] 처럼 반만 바뀐 대괄호 — 남은 날글자도 곧게 세운다 */
    t = t.replace(/\[([^\[\]]{0,30})\]/g, (m, inner) =>
      /[A-Za-z]/.test(inner)
        ? '[' + inner.replace(/(^|[\s/·])([A-Za-z]{1,4})(?=$|[\s/·\\^])/g,
                              (mm, a, b) => a + '\\mathrm{' + b + '}') + ']'
        : m);

    /* 숫자에 바로 붙은 단위(380V · 60Hz · 22.9kV) 도 로만체로 세운다 */
    t = t.replace(new RegExp('(\\d(?:\\.\\d+)?)\\s*(' + UNIT_TXT + ')(?![A-Za-z0-9])', 'g'),
                  (m, n, u) => n + '\\,\\mathrm{' + u + '}');

    /* 숫자와 단위 사이는 좁은 사이참을 준다 */
    t = t.replace(/(\d)\s*\\mu\\mathrm\{/g, '$1\\,\\mu\\mathrm{')
         .replace(/(\d)\s*\\mathrm\{/g, '$1\\,\\mathrm{')
         .replace(/(\d)\s*\\Omega/g, '$1\\,\\Omega');

    /* cos · sin · log 같은 함수 이름은 곧게 세운다 */
    t = t.replace(/\b(cos|sin|tan|sec|csc|cot|log|ln|exp|max|min|lim)\b/g, '\\$1');

    return t.replace(/\s+/g, ' ').trim();
  }

  /* ── 글월에서 수식 덩어리를 찾아 $…$ 로 감싼다 ── */
  function wrapRuns(s){
    if(!s) return s;
    const out = [];
    let i = 0;
    while(i < s.length){
      const hit = s.slice(i).search(SEED);
      if(hit < 0){ out.push(s.slice(i)); break; }
      const k = i + hit;

      let a = k, b = k + 1;
      while(a > i && CONT.test(s[a - 1]) && (k - a) < MAXRUN) a--;
      while(b < s.length && CONT.test(s[b]) && (b - k) < MAXRUN) b++;

      out.push(s.slice(i, a));
      const { pre, core, post } = trimRun(s.slice(a, b));
      out.push(pre + (core ? '$' + toTex(core) + '$' : '') + post);
      i = b;
    }
    return out.join('');
  }

  /* ── 이미 $…$ 로 쓰여 있는 곳과 `코드` 는 손대지 않는다 ── */
  function sciToTex(md){
    if(!md) return md;
    let s = String(md);

    /* $$ … $$ 가 여러 줄에 걸쳐 있으면 한 줄로 붙인다 —
       mdLite 가 줄마다 <p> 로 끊어 버려서 수식이 두 동강 나기 때문이다. */
    s = s.replace(/\$\$([\s\S]*?)\$\$/g, (m, inner) => '$$' + inner.replace(/\s*\n\s*/g, ' ') + '$$');

    /* ★ 줄머리의 마크다운 표시(- · 3) · ####)는 떼어 두고 나머지만 손댄다.
       안 그러면 «- 1/√3 …» 의 앞 붙임표까지 수식에 빨려 들어가
       목록이 목록으로 안 보이고 뺄셈처럼 그려진다. */
    /* ★ [[box]]·[[/box]]·```코드``` 는 내가 만든 표시라 수식이 아니다 — 그런데
       «[영문]」 을 단위로 보고 \mathrm{} 로 감싸는 줄(위쪽)이 [[box]] 속의
       [box] 도 단위로 착각해 통째로 망가뜨렸다(«$[[\mathrm{box}]]$» 처럼).
       이 표시가 정확히 나온 줄은 아예 손대지 않고 그대로 돌려준다. */
    return s.split('\n').map(line => {
      const bare = line.trim();
      if(bare==='[[box]]' || bare==='[[/box]]' || /^```\s*[\w+-]*\s*$/.test(bare)) return line;
      const head = (line.match(/^(\s*(?:[-*+]\s+|\d+[.)]\s+|#{1,6}\s+|>\s*)?)/) || [''])[0];
      const parts = line.slice(head.length)
        .split(/(\$\$[\s\S]*?\$\$|\$[^\n$]*?\$|`[^`]*`|!\[[^\]\n]*\]\([^)\n]*\))/g);
      for(let i = 0; i < parts.length; i += 2) parts[i] = wrapRuns(parts[i]);
      return head + parts.join('');
    }).join('\n');
  }
  window.__sciToTex = sciToTex;

  /* ── mdLite 위에 한 겹 더 씌운다 — 쉬운 풀이·주석에만 쓰이는 함수다 ──
     문제·답안(mdRich)은 이미 LaTeX 로 변환돼 있으므로 건드리지 않는다. */
  if(typeof window.mdLite === 'function' && !window.mdLite.__sci){
    const prev = window.mdLite;
    const wrapped = function(md){ return prev(sciToTex(md)); };
    wrapped.__sci = 1; wrapped.__tex = prev.__tex;
    window.mdLite = wrapped;
  }

  /* ══ 그리기 — 칸 속이 바뀌면 다시 그린다 ══
     예전 장치는 «한 번 그렸다» 표시를 남겨서, 해설을 새로 쓰거나 한눈에 보기에서
     문항을 넘기면 수식이 날글자 그대로 남아 있었다. 속의 길이로 표를 삼아
     내용이 바뀌면 다시 그리게 한다. */
  const OPT = { delimiters:[
    { left:'$$', right:'$$', display:true }, { left:'$', right:'$', display:false },
    { left:'\\[', right:'\\]', display:true }, { left:'\\(', right:'\\)', display:false }
  ], throwOnError:false, ignoredTags:['script','style','textarea','pre','code'] };

  function texEl(el){
    if(!el || !window.renderMathInElement) return;
    const sig = String(el.innerHTML.length);
    if(el.dataset.texSig === sig) return;
    if(!/[$\\]/.test(el.textContent || '')){ el.dataset.texSig = sig; return; }
    try{ window.renderMathInElement(el, OPT); }catch(e){globalThis.__q?.(e)}
    el.dataset.texSig = String(el.innerHTML.length);
  }
  function texAll(root){
    (root || document).querySelectorAll('.easybox, .ez, .mkb').forEach(texEl);
  }
  window.__ezMathify = texAll;

  const boot = setInterval(() => { if(window.renderMathInElement){ clearInterval(boot); texAll(); } }, 200);
  setTimeout(() => clearInterval(boot), 20000);

  /* ★ 위와 같은 고리다. 수식을 그리면 그 자리가 또 바뀌므로 스스로를 깨운다.
     ① 내가 그리는 동안 온 알림은 버리고
     ② «속까지» 듣지 않고 칸이 갈릴 때만 듣는다. */
  let TMUTE = 0;
  const tquiet = fn => { TMUTE++; try{ fn() }catch(e){globalThis.__q?.(e)} setTimeout(() => { TMUTE = Math.max(0, TMUTE-1); }, 140); };
  ['#list', '#ovl'].forEach(sel => {
    const wait = setInterval(() => {
      const n = document.querySelector(sel);
      if(!n) return;
      clearInterval(wait);
      const targets = sel === '#ovl'
        ? [document.querySelector('#ovLeft'), document.querySelector('#ovRight')].filter(Boolean)
        : [n];
      targets.forEach(t => new MutationObserver(() => {
        if(TMUTE) return;
        setTimeout(() => tquiet(() => texAll(n)), 25);
      }).observe(t, { childList:true }));
      texAll(n);
    }, 250);
    setTimeout(() => clearInterval(wait), 20000);
  });
  setInterval(() => texAll(), 2000);
})();
