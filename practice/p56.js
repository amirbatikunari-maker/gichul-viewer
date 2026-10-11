/* practice.html 에서 분리 (v341) — 원래 20989번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const CF=window.APP_CONFIG||{};
const WK=(CF.CLAUDE_WORKER_URL||CF.WORKER_URL||'https://gichul-ai.amirbatikunari.workers.dev').replace(/\/$/,'');
const APPKEY=CF.CLAUDE_APP_KEY||'';
const BUCKET='qfig';
const IS_W=/[?&]w=1\b/.test(location.search);   /* ★ v353 — 필기 화면 (practice.html?w=1) */
const MODEL={ opus:'claude-opus-5', sonnet:'claude-sonnet-5' };
const NAME ={ opus:'Opus', sonnet:'Sonnet' };

function db(){ try{ return sb }catch(e){ return null } }
function allRows(){
  try{ if(Array.isArray(ROWS)&&ROWS.length) return ROWS }catch(e){globalThis.__q?.(e)}
  try{ return Array.isArray(window.SHOWN)?window.SHOWN:[] }catch(e){ return [] }
}
const rowById=id=>allRows().find(r=>String(r.id)===String(id))||null;
function toast(m){
  try{ if(window.AppUI&&window.AppUI.toast) return window.AppUI.toast(m,'info') }catch(e){globalThis.__q?.(e)}
  try{ window.__pracLog&&window.__pracLog(m) }catch(e){globalThis.__q?.(e)}
}
function repaint(id){
  try{ if(typeof ovDraw==='function'&&$('#ovl')?.classList.contains('on')) ovDraw() }catch(e){globalThis.__q?.(e)}
  try{ (window.__pracRedraw||window.drawList)?.() }catch(e){globalThis.__q?.(e)}
  try{ typeof drawRail==='function'&&drawRail() }catch(e){globalThis.__q?.(e)}
}

/* ══ ① 해설 JSON → 마크다운 (검수·배치와 같은 틀) ══ */
function solToMd(sol){
  const L = [];
  /* ★ v256 — 목록 칸을 «['가','나']» 처럼 통째로 한 덩어리로 적어 보내는 일이 있다.
     그대로 찍으면 대괄호·따옴표가 화면에 그대로 나온다. 풀어서 줄로 나눈다. */
  /* ★ v257 — 칸을 못 채우고 «<item>…</item>» 같은 표를 통째로 적어 보내는 일이 있다.
     그대로 찍으면 태그가 화면에 그대로 나온다. 태그를 걷어내고 줄로 나눈다. */
  const XML = /<\/?(item|step|symbol|sym|mean|unit|val|say|math|calc|plain|read|why|eq|steps|symbols|given|background|also|tags|tag|check|trap|memo|answer|gist|write_solution|why_answer|easy|min_ans|must|terms|formula_why|pairs|derive|gates|truth|logic)\s*\/?>/gi;
  const unxml = t => String(t == null ? "" : t)
    .replace(/<\/?item\s*\/?>/gi, "\n")
    .replace(XML, " ")
    .replace(/<[^<>\n]{1,30}>/g, " ")
    .replace(/[ \t]{2,}/g, " ").trim();
  const arr = v => {
    if(Array.isArray(v)) return v.flatMap(x => (x && typeof x === "object") ? [x] : arr(x));
    let t = String(v == null ? "" : v).trim();
    if(!t) return [];
    if(/<\w+[^>]*>/.test(t))
      return unxml(t).split("\n").map(x => x.replace(/^[-·•\s]+/, "").trim()).filter(Boolean);
    /* ★ v280 — 칸을 «JSON 글자» 로 적어 보내는 일이 있다 (steps 가 '[{"say":…},{…}]' 인 글자).
       수식의 백슬래시(\\dfrac)·줄바꿈 때문에 JSON.parse 가 깨지면, 예전에는 쉼표로 쪼개다가
       단계가 통째로 날아갔다 (소문항 둘 중 하나만 남음). 손봐서 다시 읽는다. */
    const loose = x => {
      const fixBs = y => y.replace(/\\\\|\\(?:(?=[A-Za-z]{2,})(?!u[0-9a-fA-F]{4})|(?!["\\/bfnrtu]))/g, m => m.length === 2 ? m : "\\\\");   /* \times·\dfrac 처럼 수식 명령 앞 백슬래시를 살림 */
      for(const y of [x, fixBs(x), fixBs(x).replace(/\r?\n/g, " "), fixBs(x).replace(/\r?\n/g, " ").replace(/,\s*([\]}])/g, "$1")]){
        try{ return JSON.parse(y); }catch(e){globalThis.__q?.(e)}
      }
      return undefined;
    };
    if(/^\{[\s\S]*\}$/.test(t)){                     /* {…} 하나, 또는 {…},{…} 여럿 */
      const j = loose(t); if(j && typeof j === "object") return Array.isArray(j) ? j : [j];
      const k = loose("[" + t + "]"); if(Array.isArray(k)) return k;
    }
    if(/^\[[\s\S]*\]$/.test(t)){
      const j = loose(t); if(Array.isArray(j)) return j;
      try{ const j2 = JSON.parse(t.replace(/'/g, '"')); if(Array.isArray(j2)) return j2; }catch(e){globalThis.__q?.(e)}
      /* 객체가 들어 있던 글자면 쉼표로 쪼개지 않는다 — 쪼개면 조각난 글자가 화면에 그대로 나온다 */
      if(/^\[\s*\{/.test(t)){
        const objs = [];
        t.slice(1, -1).split(/\}\s*,\s*\{/).forEach((p, i, a) => {
          const q = (i ? "{" : "") + p + (i < a.length - 1 ? "}" : "");
          const o = loose(q); if(o && typeof o === "object") objs.push(o);
        });
        if(objs.length) return objs;
      }
      return t.slice(1, -1).split(/['"]\s*,\s*['"]/)
        .map(x => x.replace(/^['"]|['"]$/g, "").trim()).filter(Boolean);
    }
    return [t];
  };
  /* 수식 손질
     · 천 단위 쉼표(6,600)는 KaTeX 에서 뒤가 휑하게 벌어진다 → {,} 로 붙인다
     · \quad · \; · \hspace 같은 빈칸 명령이 들어오면 사이가 벌어진다 → 걷어낸다
     · 한글이 섞인 식은 수식으로 그리면 깨진다 → 글줄로 내보낸다 */
  const HAN = /[가-힣]/;
  const tex = t => {
    let x = String(t == null ? "" : t).trim();
    if(!x) return null;
    x = x.replace(/^\$+|\$+$/g, "").trim();
    x = x.replace(/(\d),(?=\d{3})/g, "$1{,}");
    x = x.replace(/\\(?:qquad|quad|hspace\{[^}]*\}|[;:!])/g, " ");
    x = x.replace(/\\ /g, " ").replace(/[ \t]{2,}/g, " ").trim();
    return x || null;
  };
  /* 맨 글자로 들어온 한글은 \text{} 로 감싼다 — 안 감싸면 수식이 깨진다 */
  const wrapHan = x => {
    if(!HAN.test(x)) return x;
    const keep = [];
    let y = x.replace(/\\(?:text|mathrm|mathbf)\{[^{}]*\}/g, m => {
      keep.push(m); return "\u0000" + (keep.length - 1) + "\u0000";
    });
    y = y.replace(/[가-힣][가-힣0-9 ·()]*[가-힣]|[가-힣]/g, m => `\\text{${m.trim()}}`);
    return y.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
  };
  /* ★ v258 — 같은 식을 여러 꼴로 이어 쓸 때 «=» 를 세로로 맞춰 그린다 */
  const eqBlock = list => {
    const rows = (Array.isArray(list) ? list : [list]).map(tex).filter(Boolean).map(wrapHan);
    if(!rows.length) return;
    if(rows.length === 1) return void L.push(`$$${rows[0]}$$`, "");
    const body = rows.map(r => {
      if(/^=/.test(r)) return `&= ${r.replace(/^=\s*/, "")}`;
      /* 줄마다 «첫 등호» 를 맞춤자리로 삼는다 — 기호식과 한글식의 = 가 세로로 선다.
         \xrightarrow{X=0} 안의 등호는 중괄호 안이므로 건너뛴다. */
      let d = 0, k = -1;
      for(let i = 0; i < r.length; i++){
        const c = r[i];
        if(c === "{") d++;
        else if(c === "}") d--;
        else if(c === "=" && d === 0 && r[i-1] !== "<" && r[i-1] !== ">" && r[i+1] !== "="){ k = i; break; }
      }
      return k > 0 ? `${r.slice(0, k).trim()} &= ${r.slice(k + 1).trim()}` : `& ${r}`;
    }).join(" \\\\ ");
    L.push(`$$\\begin{aligned} ${body} \\end{aligned}$$`, "");
  };
  const eqLine = t => eqBlock(t);
  const inlineTex = t => {
    const x = String(t || "").trim();
    if(!x) return "";
    return /[\\^_{]/.test(x) ? `$${tex(x)}$` : x;
  };

  /* ★ v263 — 글 칸(검산·흔한 실수·왜)에 수식을 넣으면 백슬래시가 떨어져 나간 채로 와서
     «dfrac155 times ...» 처럼 글자가 흩어진다. 떨어진 백슬래시를 되살리고,
     그래도 못 살릴 만큼 깨진 것은 수식 표시를 벗겨 글로 읽히게 둔다. */
  const CMD = /(dfrac|tfrac|frac|sqrt|times|div|cdot|approx|fallingdotseq|leqq|geqq|leq|geq|neq|Omega|omega|theta|alpha|beta|rho|mu|Delta|sum|mathrm|text|left|right|tan|cos|sin|log|ln|xrightarrow|quad|pi)/g;
  const fixMath = t => String(t == null ? "" : t).replace(/\$([^$\n]{1,400})\$/g, (m, body) => {
    /* ① \t · \f 는 JSON 에서 «탭 · 페이지넘김» 으로 읽혀 버린다.
       그래서 \times 가 [탭]imes, \fallingdotseq 가 [넘김]allingdotseq 로 도착한다.
       그 자리에 백슬래시를 도로 꽂아 준다. */
    const BACK = { "\t":"\\t", "\f":"\\f", "\b":"\\b", "\v":"\\v", "\r":"\\r" };
    let b = body.replace(/[\t\f\v\b\r]/g, c => BACK[c] || "\\");
    /* ② 백슬래시가 떨어져 나간 명령말 앞에 도로 붙인다.
       \times\dfrac 처럼 붙어 있던 것이 \timesdfrac 로 와도 갈라 준다.
       이미 백슬래시가 앞에 있는 것은 건드리지 않는다. */
    b = b.replace(CMD, (w, _g, off, str) => (off > 0 && str[off - 1] === "\\") ? w : "\\" + w);
    return "$" + b + "$";
  });
  /* ★ v330 — 글 칸에 «C바» 처럼 읽는 말로 온 식 → $\overline{C}$ · 맨 글자로 쓴 논리식(S = ABC + D) → $…$ 로 감쌈 */
  const oTxt = o => {
    if(o == null) return "";
    if(typeof o !== "object") return String(o);
    if(Array.isArray(o)) return o.map(oTxt).filter(Boolean).join(" · ");
    const pk = ks => { for(const k of ks){ const v = o[k]; if(v != null && typeof v !== "object" && String(v).trim()) return String(v).trim(); } return ""; };
    const hd = pk(["name","term","word","label","item","key","k","title","sym","what","concept","q","h"]);
    const va = pk(["value","val","v","num","amount"]);
    const un = pk(["unit"]);
    const de = pk(["desc","mean","meaning","text","say","note","why","easy","detail","explain","content","body","info","def","a"]);
    let s = hd;
    if(va) s += (s ? " = " : "") + va + (un && !va.includes(un) ? " " + un : "");
    if(de) s += (s ? " — " : "") + de;
    return s || Object.values(o).filter(x => x != null && typeof x !== "object" && String(x).trim()).join(" · ");
  };
  const LGW = /^(AND|OR|NOT|NAND|NOR|XOR|EX|MC|MCF|MCR|THR|PB|PL|RL|GL|YL|WL|OCR|OVR|UVR|OCGR|SGR|DGR|CT|PT|ZCT|GPT|KEC|TR|ELB|MCCB|ACB|VCB|LA|SA|UPS|LED|DC|AC|PF|VA|KVA|KW|HP|OFF|IDC|HIV|PVC)$/;
  const mathify = t => String(t == null ? "" : t).split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/).map((seg, si) => {
    if(si % 2) return seg;
    const K = [], P = m => { K.push(m); return "\u0001" + (K.length - 1) + "\u0002"; };
    let x = seg;
    /* (A+B)바 · (A+B) 바 */
    x = x.replace(/\(([A-Z][A-Z0-9+·' ]*)\)\s?바(?!탕|람|닥|깥|꾸|꿔|뀌|뀐|이패스|로 (?:옆|뒤|앞|아래|위))/g, (m, e) => P("\\overline{" + e.replace(/·/g, "\\cdot ").trim() + "}"));
    /* C바 (붙여 씀) · C 바( / C 바, / C 바 끝 (띄어 씀은 뒤가 조사·괄호·문장부호일 때만) */
    x = x.replace(/(?<![a-z0-9_\\])([A-Z])바(?!탕|람|닥|깥|꾸|꿔|뀌|뀐|이패스)/g, (m, v) => P("\\overline{" + v + "}"));
    x = x.replace(/(^|[^A-Za-z0-9_\\])([A-Z]) 바(?=$|[\s(),.·:;]|[와과는를가의도만](?![가-힣]))/g, (m, a, v) => a + P("\\overline{" + v + "}"));
    /* 맨 글자 논리식: 글자(·부정)끼리 + = · 로 이은 것 */
    const T = "(?:\\(?(?:[A-Z]|\\u0001\\d+\\u0002)+'?\\)?)+";
    const RE = new RegExp("(^|[^A-Za-z0-9_.=/^×÷√\\\\\\u0002])(" + T + "(?:\\s*[+=]\\s*" + T + "|·" + T + ")+)(?![A-Za-z0-9_=/^×÷√\\u0001])", "g");
    x = x.replace(RE, (m, a, e) => {
      const bare = e.replace(/\u0001\d+\u0002/g, " ");
      const words = bare.match(/[A-Z]{2,}/g) || [];
      if(words.some(w => LGW.test(w))) return m;
      if(!/[+=·]/.test(e)) return m;
      return a + P(e.replace(/\u0001(\d+)\u0002/g, (_, i) => K[+i]).replace(/·/g, " \\cdot ").replace(/\s+/g, " ").trim());
    });
    /* 남은 부정 하나짜리 — 한 덩어리로 붙은 것끼리 합쳐 $…$ 하나로 */
    x = x.replace(/(?:\u0001\d+\u0002|(?<=\u0002)[A-Z]|[A-Z](?=\u0001))+/g, m => "$" + m.replace(/\u0001(\d+)\u0002/g, (_, i) => K[+i]) + "$");
    return x.replace(/\u0001(\d+)\u0002/g, (_, i) => "$" + K[+i] + "$").replace(/\$\$(?=\S)/g, "$ $");
  }).join("");
  const line = t => fixMath(mathify(unxml(oTxt(t)))).replace(/\n{2,}/g, "\n").trim();
  /* ★ v343 — 답 칸이 «$» 없이 맨 TeX 로 오는 일이 있다 ("L=2 \times 10^{-3}\,[\mathrm{H/km}]").
     그대로 두면 백슬래시 명령이 글자로 찍혀 «답» 상자만 깨져 보였다.
     $ 가 하나도 없고 TeX 표시(\명령 · ^{ · _{)가 있으면 통째로 수식으로 감싼다 (한글은 \text{}). */
  const BARE_TEX = /\\[A-Za-z]+|[\^_]\{/;
  const bareWrap = x => {
    if(!x || x.includes("$") || !BARE_TEX.test(x)) return x;
    const m = x.match(/^(\(\s*\d{1,2}\s*\)\s*)([\s\S]*)$/);          /* 앞의 «(1)» 은 글자로 남김 */
    const [pre, body] = m ? [m[1], m[2]] : ["", x];
    return pre + fixMath("$" + wrapHan(tex(body) || "") + "$");
  };
  const ansLine = t => {
    const s0 = unxml(oTxt(t)).replace(/\n+/g, " ").trim();
    if(!s0 || s0.includes("$") || !BARE_TEX.test(s0)) return line(t);
    return bareWrap(s0);
  };

  /* ★ v353 — 필기(객관식) 틀: 문제 개요 → (회로면) 전체 시퀀스 → 기호 → 풀이 → 보기별 판단 → 정답 → 관련 개념 */
  const MCQ = sol.exam === "필기";
  if(sol.gist) MCQ ? L.push("**문제 개요**", "", line(sol.gist), "") : L.push(`**${line(sol.gist)}**`, "");
  /* ★ v309 — 비전공자용 «쉽게 말하면» */
  if(arr(sol.easy).length){
    L.push("**쉽게 말하면**", "");
    arr(sol.easy).forEach(e => L.push(`- ${line(e)}`));
    L.push("");
  }

  if(arr(sol.sequence).length){
    L.push("**전체 시퀀스 (이 회로가 도는 순서)**", "");
    arr(sol.sequence).forEach((t, k) => L.push(`${k+1}. ${line(t)}`));
    L.push("");
  }
  if(arr(sol.background).length){
    L.push("**먼저 알아야 할 것**", "");
    arr(sol.background).forEach(b => L.push(`- ${line(b)}`));   /* ★ v330 — 객체로 오면 [object Object] 로 나오던 것 */
    L.push("");
  }
  if(arr(sol.read).length){
    L.push("**문제를 이렇게 읽음**", "");
    arr(sol.read).forEach(b => L.push(`- ${line(b)}`));
    L.push("");
  }
  if(arr(sol.given).length){
    L.push("**주어진 값**", "");
    arr(sol.given).forEach(g => L.push(`- ${line(g)}`));
    L.push("");
  }
  /* ★ v356 — 기호 칸이 비었거나(→ «$$» 가 찍혀 아래 글이 통째로 수식으로 먹히던 것)
     «방재계획» 같은 낱말을 기호 칸에 넣어 온 것(→ 기호 표가 세로로 깨지던 것)을 가른다.
     진짜 기호만 «기호» 표로, 낱말은 «용어» 목록으로 */
  const SYMS = arr(sol.symbols).filter(x => typeof x === "string" ? String(x).trim() : String(x && x.sym || "").trim());
  const isWord = x => typeof x === "object" && (HAN.test(String(x.sym || "")) || String(x.sym || "").length > 14);
  const WORDS = MCQ ? SYMS.filter(isWord) : [];
  const REAL  = MCQ ? SYMS.filter(x => !isWord(x)) : SYMS;
  if(WORDS.length){
    L.push("**용어**", "");
    WORDS.forEach(x => L.push(`- **${String(x.sym).replace(/\$/g, "").trim()}** — ${line(x.mean || "")}${x.val ? ` · 이 문제: ${line(x.val)}` : ""}`));
    L.push("");
  }
  if(REAL.length){
    L.push(MCQ ? "**기호**" : "**부호**", "");
    REAL.forEach(x => {
      if(typeof x === "string") return void L.push(`- ${line(x)}`);
      const u = x.unit ? ` · 단위 ${inlineTex(x.unit)}` : "";
      const v = x.val  ? ` · 이 문제: ${inlineTex(x.val)}` : "";
      const sy = HAN.test(String(x.sym||"")) ? String(x.sym||"") : `$${tex(x.sym)||""}$`;
      /* ★ v277 — 읽는 발음 «브이 에스» 를 기호 옆에 */
      const pr = x.say ? ` «${String(x.say).replace(/[«»\n]/g, "").trim()}»` : "";
      L.push(`- ${sy}${pr} — ${line(x.mean || "")}${u}${v}`);
    });
    L.push("");
  }
  /* 옛 워커(v232)는 «쓰는 식» 을 따로 보낸다. 새 워커는 안 보낸다 — 풀이 안에서 세운다 */
  if(arr(sol.formula).length){
    L.push("**쓰는 식**", "");
    arr(sol.formula).forEach(f => {
      if(typeof f === "string") return void eqLine(f);
      eqLine(f.tex);
      if(f.read) L.push(`- 읽기: ${f.read}`, "");
      if(f.why)  L.push(`- 왜: ${f.why}`, "");
    });
  }
  /* ★ v329 — 논리식 변환·게이트 표를 맨 바깥 logic 칸에서 받음 — 그 소문항 풀이 바로 밑에 붙임 (번호가 없으면 풀이 끝에) */
  const lgCl = t => line(t).replace(/\n+/g, " ").replace(/\|/g, "∣").trim() || " ";
  const lgUp = x => x.replace(/(^|[^\\a-zA-Z{])(NAND|NOR|XOR|NOT|AND|OR)(?![a-zA-Z])/g, "$1\\mathrm{$2}");
  const lgMath = t => { const x = tex(String(t || "")); return x ? "$" + lgUp(x).replace(/\|/g, "\\vert ") + "$" : " "; };
  const lgTables = g => {
    const DV = arr(g.derive).filter(d => d && typeof d === "object" && String(d.eq || "").trim());
    if(DV.length){
      L.push("| | 식 | 이 줄에서 한 것 |", "|---|---|---|");
      DV.forEach((d, k) => L.push(`| ${"①②③④⑤⑥⑦⑧⑨⑩⑪⑫"[k] || (k + 1)} | ${lgMath(d.eq)} | ${lgCl(d.law || "")} |`));
      L.push("");
    }
    const GT = arr(g.gates).filter(x => x && typeof x === "object" && String(x.type || x.g || "").trim());
    if(GT.length){
      L.push("| 게이트 | 종류 | 입력 | 출력 | 하는 일 |", "|---|---|---|---|---|");
      GT.forEach(x => L.push(`| **${lgCl(x.g || "")}** | ${lgCl(x.type || "")} | ${/[\\^_{]/.test(String(x.in || "")) ? lgMath(x.in) : lgCl(x.in || "")} | ${/[\\^_{]/.test(String(x.out || "")) ? lgMath(x.out) : lgCl(x.out || "")} | ${lgCl(x.role || "")} |`));
      L.push("");
    }
  };
  const LGX = arr(sol.logic).filter(g => g && typeof g === "object" && (arr(g.derive).length || arr(g.gates).length))
    .map(g => ({ g, n: (String(g.q || "").match(/\(\s*(\d{1,2})\s*\)/) || [])[1] || "", used: false }));
  if(arr(sol.steps).length){
    L.push("**풀이**", "");
    arr(sol.steps).forEach((s, i) => {
      if(typeof s === "string") return void L.push(`${i+1}. ${s}`, "");
      /* 소문항 번호로 시작하면 «1. (1)» 처럼 번호가 겹치지 않게 둔다 */
      const sy0 = line(s.say);
      L.push(/^\s*(\(\d+\)|[①-⑳]|\d+\s*[).])/.test(sy0) ? `${sy0}` : `${i+1}. ${sy0}`, "");
      /* ★ v277 — 소문항 답은 그 단계 바로 밑에 먼저 (단답·서술은 «답 → 왜» 순서) */
      if(s.ans) L.push(`> ${ansLine(s.ans).replace(/\n+/g, " ")}`, "");
      /* ★ v327 — 식 바꾸는 과정 «한 줄에 법칙 하나» (논리식 드모르간 등) — 표: 번호 · 식 · 이 줄에서 한 것 */
      const tcl = t => line(t).replace(/\n+/g, " ").replace(/\|/g, "∣").trim() || " ";
      /* ★ v328 — 식 안의 게이트 이름(NAND·NOR…)은 변수처럼 기울지 않게 똑바른 글씨로 */
      const gateUp = x => x.replace(/(^|[^\\a-zA-Z{])(NAND|NOR|XOR|NOT|AND|OR)(?![a-zA-Z])/g, "$1\\mathrm{$2}");
      const tmath = t => { const x = tex(String(t || "")); return x ? "$" + gateUp(x).replace(/\|/g, "\\vert ") + "$" : " "; };
      const DV = arr(s.derive).filter(d => d && typeof d === "object" && String(d.eq || "").trim());
      if(DV.length){
        L.push("| | 식 | 이 줄에서 한 것 |", "|---|---|---|");
        DV.forEach((d, k) => L.push(`| ${"①②③④⑤⑥⑦⑧⑨⑩⑪⑫"[k] || (k + 1)} | ${tmath(d.eq)} | ${tcl(d.law || "")} |`));
        L.push("");
      }
      /* 새 판 — 등호로 이은 한 줄(여럿이면 줄마다) */
      /* ★ v260 — 한 단계는 다섯 줄. 순서를 화면에서 못 박는다.
         ①부호식 ②해설식 ③숫자대입식 ④읽기식 ⑤왜 */
      const eqs = Array.isArray(s.eq) ? s.eq : (s.eq ? [s.eq] : []);
      if(s.sym || s.plain || s.num || s.unit){
        if(s.sym)   eqBlock(s.sym);
        if(s.plain) eqBlock(s.plain);
        if(s.num)   eqBlock(s.num);
        if(s.unit)  eqBlock(s.unit);   /* 단위만 넣어 결과 단위를 맞춰 보는 식 */
      }
      else if(eqs.length) eqs.forEach(e => eqBlock(e));
      else eqBlock([s.math, s.calc].filter(Boolean));   /* 옛 판 대비 */
      /* ★ v327 — 게이트 연결표: 이 표만 보고 답안 그림을 따라 그릴 수 있게 */
      const GT = arr(s.gates).filter(g => g && typeof g === "object" && String(g.type || g.g || "").trim());
      if(GT.length){
        L.push("| 게이트 | 종류 | 입력 | 출력 | 하는 일 |", "|---|---|---|---|---|");
        GT.forEach(g => L.push(`| **${tcl(g.g || "")}** | ${tcl(g.type || "")} | ${/[\\^_{]/.test(String(g.in || "")) ? tmath(g.in) : tcl(g.in || "")} | ${/[\\^_{]/.test(String(g.out || "")) ? tmath(g.out) : tcl(g.out || "")} | ${tcl(g.role || "")} |`));
        L.push("");
      }
      if(s.read) L.push(`- 읽기: “${line(s.read).replace(/^["“]|["”]$/g, "")}”`, "");
      if(s.why)  L.push(`- 왜: ${line(s.why).replace(/\n+/g, "\n  ")}`, "");   /* ★ v333 — 다음 줄은 들여 써서 같은 «왜» 상자 안으로 */
      L.push("");
      /* ★ v329 — 이 소문항 번호의 논리식 표 (그 번호가 처음 나온 단계 밑에 한 번) */
      const sn = (String(s.say || "").match(/^\s*\(\s*(\d{1,2})\s*\)/) || [])[1];
      if(sn) LGX.filter(x => !x.used && x.n === sn).forEach(x => { x.used = true; if(x.g.q) L.push(`▸ ${lgCl(x.g.q)}`, ""); lgTables(x.g); });
    });
  }
  const LGR = LGX.filter(x => !x.used);
  if(LGR.length){
    L.push("**식 바꾸기 · 게이트 연결**", "");
    LGR.forEach(x => { x.used = true; if(x.g.q) L.push(`▸ ${lgCl(x.g.q)}`, ""); lgTables(x.g); });
  }
  /* 답에 이미 단위가 붙어 온 경우 또 붙이지 않는다 (70[mm^2]mm^2 처럼 되던 것) */
  const ansT = line(sol.answer).trim();   /* 소문항별로 나눈 뒤 조각마다 bareWrap (통째로 감싸면 (1)(2) 나누기가 깨짐) */
  const unitT = String(sol.unit || "").trim();
  /* ★ v277 — «(2)» 앞에서 줄을 나눈다 (띄어쓰기가 없어도) */
  const ansLines = ansT.split(/\n+|(?=\(\d{1,2}\))/).map(x => bareWrap(x.trim())).filter(Boolean);
  const many = ansLines.length > 1;                 /* 소문항이 여럿인 답 */
  /* ★ v316 — «1[m]» + 단위 «\\mathrm{m}» 처럼 모양만 달라도 같은 단위면 또 안 붙임 (1[m]m 로 나오던 것) */
  const uN = t => String(t || "").replace(/\\(?:mathrm|text|rm|mathit)\s*\{([^{}]*)\}/g, "$1").replace(/\\[,;:! ]|\\quad/g, "").replace(/[\s$\[\]{}()\\]/g, "").toLowerCase();
  const dup = unitT && (/[,，·]/.test(unitT) || ansT.includes(unitT) || ansT.includes(unitT.replace(/[\[\]]/g, ""))
                        || (uN(unitT) && uN(ansT).endsWith(uN(unitT))));
  const stepAns = arr(sol.steps).some(s => s && typeof s === "object" && String(s.ans || "").trim());
  /* ★ v309 — 단답·서술·나열형 «최소 답안» : 이만큼만 써도 만점 + 필수 핵심어 형광펜 */
  const MINA = arr(sol.min_ans).filter(x => x && typeof x === "object" && String(x.text || "").trim());
  if(MINA.length){
    L.push("**최소 답안 — 이만큼은 꼭**", "");
    MINA.forEach(x => {
      const must = arr(x.must).map(w => String(w || "").replace(/==/g, "").trim()).filter(Boolean);
      let t = line(x.text).replace(/\n+/g, " ");
      /* 필수어가 형광펜 없이 왔으면 첫 자리에 칠해 준다 */
      must.forEach(w => {
        if(t.includes("==" + w + "==")) return;
        const i = t.indexOf(w); if(i < 0) return;
        const pre = t.slice(0, i); if(((pre.match(/==/g) || []).length) % 2) return;
        t = pre + "==" + w + "==" + t.slice(i + w.length);
      });
      const q = String(x.q || "").trim();
      L.push(`> ${q && !t.startsWith(q) ? q + " " : ""}${t}`, "");
      if(must.length) L.push(`- 필수: ${must.map(w => "★ ==" + w + "==").join(" · ")}`, "");
    });
  }
  /* ★ v276 — 나열형 «항목» · 서술형 «채점 포인트» */
  if(arr(sol.items).length){
    L.push("**항목**", "");
    arr(sol.items).forEach(it => {
      if(typeof it === "string") return void L.push(`- ${line(it)}`);
      const w = line(it.word || it.name || it.item || "");
      const m = line(it.mean || it.desc || "");
      L.push(`- **${w}**${m ? " — " + m : ""}`);
      if(it.why) L.push(`- 왜: ${line(it.why).replace(/\n+/g, "\n  ")}`);
    });
    L.push("");
  }
  if(arr(sol.keys).length){
    L.push("**채점 포인트**", "");
    arr(sol.keys).forEach(k => L.push(`- ${line(k)}`));
    L.push("");
  }
  /* ★ v353 — 보기별 판단 ①~④ (필기) */
  const OPT = arr(sol.opts).filter(o => o && typeof o === "object");
  if(OPT.length){
    L.push("**보기별 판단**", "");
    OPT.sort((a, b) => (+a.n || 0) - (+b.n || 0)).forEach(o => {
      const n = "①②③④⑤"[(+o.n || 1) - 1] || o.n;
      L.push(`- ${n} ${o.ok ? "⭕" : "❌"} ${line(o.why || "")}`);
    });
    L.push("");
  }
  /* ★ v277 — 소문항 답을 단계마다 적었으면 맨 아래 «답» 몰아 쓰기는 뺀다 */
  if(!stepAns && ansT){
    L.push("**답**", "");
    if(many) ansLines.forEach(x => L.push(`> ${x}`, ""));
    else L.push(`> ${bareWrap(ansT)}${unitT && !dup ? " " + unitT : ""}`, "");
  }
  if(sol.why_answer) L.push("**왜 이 답인가**", "", line(sol.why_answer), "");
  if(sol.check)      L.push("**검산**", "", line(sol.check), "");
  if(arr(sol.concept).length){
    L.push("**관련 개념 정리**", "");
    arr(sol.concept).forEach(c => L.push(`- ${line(c)}`));
    L.push("");
  }
  /* ★ v327 — 진리표 검산 (입력 조합 전부 · 원래 식과 바꾼 회로 출력 나란히) */
  const TR = sol.truth && typeof sol.truth === "object" ? sol.truth : null;
  if(TR && arr(TR.cols).length && arr(TR.rows).length){
    const cc = arr(TR.cols).map(c => String(c == null ? "" : c).replace(/[|\n]/g, " ").trim() || " ");
    L.push("**진리표 검산**", "", "| " + cc.join(" | ") + " |", "|" + cc.map(() => "---").join("|") + "|");
    arr(TR.rows).forEach(r => { const v = Array.isArray(r) ? r : arr(r); L.push("| " + cc.map((_, k) => String(v[k] == null ? "" : v[k]).replace(/[|\n]/g, " ").trim() || " ").join(" | ") + " |"); });
    L.push("");
  }
  if(sol.memo)       L.push("**외우기**", "", line(sol.memo), "");
  /* ★ v276 — 두문자 : 첫 줄 `글자` · 줄마다 «글자 — 항목» (화면에서 고쳐 쓸 수 있음) */
  /* ★ v283 — 소문항마다 두문자 묶음 (mnemos 배열). 예전 mnemo 하나도 그대로 받음.
     묶음이 둘 이상이면 «(1) 장점» 같은 이름 줄을 앞에 붙인다 */
  const MNS = (Array.isArray(sol.mnemos) && sol.mnemos.length) ? sol.mnemos
            : (Array.isArray(sol.mnemo) ? sol.mnemo : (sol.mnemo && typeof sol.mnemo === "object" ? [sol.mnemo] : []));
  const MNG = MNS.filter(M => M && typeof M === "object" && (M.code || arr(M.map).length));
  if(MNG.length){
    L.push("**두문자**", "");
    MNG.forEach((MN, gi) => {
      let lb = String(MN.label || MN.q || "").replace(/[\n`*]/g, " ").replace(/\s+/g, " ").trim();
      if(MNG.length > 1 || lb){
        if(!lb) lb = `(${gi + 1})`;
        else if(!/^\(\d{1,2}\)/.test(lb)) lb = `(${gi + 1}) ${lb.replace(/^\d{1,2}[.)]\s*/, "")}`;
        L.push(lb, "");
      }
      const code = String(MN.code || arr(MN.map).map(m => (m && (m.h || m.head)) || "").join("")).replace(/[`\n]/g, "").trim();
      if(code) L.push("`" + code + "`", "");
      arr(MN.map).forEach(m => {
        if(typeof m === "string") return void L.push(`- ${line(m)}`);
        L.push(`- ${String(m.h || m.head || "").replace(/[—\n]/g, "").trim()} — ${line(m.word || m.w || "")}`);
      });
      L.push("");
      if(MN.say) L.push(line(MN.say), "");
    });
  }
  if(sol.trap)       L.push("**흔한 실수**", "", line(sol.trap), "");
  if(arr(sol.also).length){
    L.push("**같이 알아 두기**", "");
    arr(sol.also).forEach(x => L.push(`- ${line(x)}`));
    L.push("");
  }
  /* ★ v310 — 비전공자용 표 세 가지 (맨 아래) : 용어 풀이 · 공식이 왜 · 헷갈리는 짝 */
  const cel = t => line(t).replace(/\n+/g, " ").replace(/\|/g, "∣").trim() || " ";
  const TMS = arr(sol.terms).filter(x => x && typeof x === "object" && String(x.word || "").trim());
  if(TMS.length){
    const hasLike = TMS.some(x => String(x.like || "").trim());
    L.push("**용어 풀이**", "", hasLike ? "| 용어 | 쉬운 뜻 | 비유·예 |" : "| 용어 | 쉬운 뜻 |", hasLike ? "|---|---|---|" : "|---|---|");
    TMS.forEach(x => L.push(`| **${cel(x.word)}** | ${cel(x.easy)} |` + (hasLike ? ` ${cel(x.like)} |` : "")));
    L.push("");
  }
  const FWS = arr(sol.formula_why).filter(x => x && typeof x === "object" && String(x.why || "").trim());
  if(FWS.length){
    L.push("**공식이 왜 이렇게 생겼나**", "", "| 식의 부분 | 왜 붙나 |", "|---|---|");
    FWS.forEach(x => {
      const p0 = String(x.part || "").trim();
      const p = !p0 ? " " : HAN.test(p0) && !/[\\^_{]/.test(p0) ? cel(p0) : `$${(tex(p0) || "").replace(/\|/g, "\\vert ")}$`;
      L.push(`| ${p} | ${cel(x.why)} |`);
    });
    L.push("");
  }
  const PRS = arr(sol.pairs).filter(x => x && typeof x === "object" && String(x.a || "").trim() && arr(x.rows).length);
  if(PRS.length){
    L.push("**헷갈리는 짝**", "");
    PRS.forEach(P => {
      L.push(`| 구분 | ${cel(P.a)} | ${cel(P.b)} |`, "|---|---|---|");
      arr(P.rows).forEach(r => { if(r && typeof r === "object") L.push(`| ${cel(r.k)} | ${cel(r.a)} | ${cel(r.b)} |`); });
      L.push("");
    });
  }
  const TG = [sol.kind ? String(sol.kind).replace(/형$/, "") + "형" : null, ...arr(sol.tags)].filter(Boolean);
  if(TG.length) L.push("", `\`${TG.join("` `")}\``);
  /* ★ v277 — 형광펜 표시 ==핵심== → 〖핵심〗. «==» 는 글자→수식 바꾸기가 수식 기호로 삼켜 버려서 */
  return L.map(x => /^\s*\$\$/.test(x) ? x : x.replace(/==([^=\n]{1,120}?)==/g, "〖$1〗"))
          .join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

try{ window.__pxSolToMd=solToMd; }catch(e){globalThis.__q?.(e)}
/* ══ 한 문항 해설 뽑기 ══ */
let OLD_SAID=false;
const TIMEOUT=600000;   /* ★ v297 — 원칙 미달이면 워커가 두 번까지 더 받는다 → 10분 */
async function askSol(r, which){
  const ac=new AbortController();
  const t=setTimeout(()=>ac.abort(), TIMEOUT);
  let res;
  try{
    res=await fetch(WK+'/explain',{
      method:'POST', signal:ac.signal,
      headers:Object.assign({'Content-Type':'application/json'}, APPKEY?{'x-app-key':APPKEY}:{}),
      body:JSON.stringify({
        q_url:r.q_url, q_text:r.q_text||r.q_md, a_url:r.a_url, a_text:r.a_text||r.a_md,
        year:r.year, session:r.session, no:r.no, points:r.points,
        depth:'full', effort:'high', model:MODEL[which]||MODEL.opus,
        kind:(window.__ezKindFor && window.__ezKindFor(r.id)) || undefined,
        /* ★ v353 — 필기 화면이면 객관식 틀(write_mcq)로 · 답안지 정답 표기를 같이 */
        exam: IS_W ? '필기' : undefined,
        ans_label: IS_W ? ((String(r.a_text||r.a_md||'').match(/정답\s*([①②③④][①②③④,\s]*|전항정답|정답없음)/)||[])[1]||'').trim() || undefined : undefined
      })
    });
  }catch(e){
    if(e.name==='AbortError') throw new Error('10분을 넘겨 끊었습니다 — 워커가 답을 안 줍니다');
    throw new Error('워커에 닿지 못했습니다 — '+(e.message||e));
  }finally{ clearTimeout(t); }
  const raw=await res.text();
  let d={}; try{ d=JSON.parse(raw) }catch(e){globalThis.__q?.(e)}
  if(!res.ok) throw new Error(`HTTP ${res.status} — ${d.error||d.detail||raw.slice(0,160)}`);
  /* ★ v255 — 새 워커는 depth 를 되돌려 준다. 없으면 워커가 옛 판이다 */
  if(!d.depth && !OLD_SAID){
    OLD_SAID=true;
    toast('⚠ 워커가 옛 판입니다 — gichul-ai 워커에 새 index.js 를 배포해야 부호식·해설식·숫자대입식이 나옵니다');
  }
  const md=solToMd(d.sol||{});
  if(!md||md.length<20) throw new Error('해설이 비어서 왔습니다');
  /* ★ v281 — 잘렸거나 소문항이 빠졌을 수 있으면 알려 준다 */
  try{
    const n=Math.max(Number(d.sol&&d.sol.sub_count)||0, 0);
    const got=new Set((md.match(/^\s*\((\d{1,2})\)/gm)||[]).map(x=>x.replace(/\D/g,''))).size;
    if(d.stop==='max_tokens') toast('⚠ 해설이 길이 한도에서 잘렸을 수 있습니다 — 한 번 더 뽑아 보세요');
    else if(n>1 && got<n) toast(`⚠ 소문항 ${n}개 중 ${got}개만 풀이가 왔습니다 — 한 번 더 뽑아 보세요`);
  }catch(e){globalThis.__q?.(e)}
  /* ★ v297 — 원칙 검사 결과 (워커가 옛 판이면 여기서 같은 검사) */
  const problems=Array.isArray(d.problems) ? d.problems : solProbs(d.sol||{});
  /* ★ v299 — 미달인 채 저장되면 해설 맨 위에 표시를 남김 (다시 뽑아 통과하면 사라짐) */
  const md2 = problems.length
    ? ['**⚠ 원칙 미달 — 다시 뽑기 권장**', '', ...problems.slice(0,8).map(x=>'- '+String(x).replace(/\n/g,' ')), '', md].join('\n')
    : md;
  /* ★ v301 — Opus 가 끝내 틀을 못 지켜 Sonnet 으로 대신 뽑았으면 알림 */
  if(d.fallback) toast(`⚠ ${d.asked||'Opus'} 가 틀을 못 지켜 ${d.model} 로 대신 뽑았습니다`);
  /* ★ v303 — 보충 권장(먼저 알아야 할 것·검산 등)은 묻지 않고 알림만 */
  else if(Array.isArray(d.notes) && d.notes.length && !(Array.isArray(d.problems)&&d.problems.length))
    setTimeout(()=>toast(`ℹ 보충하면 좋은 곳 ${d.notes.length} — ${String(d.notes[0]).split(' — ')[0]}`), 1800);
  const diag=Array.isArray(d.diag)?d.diag.map(x=>`${x.tag}: steps ${x.steps}${x.logic?' · '+x.logic:''} · 멈춤 ${x.stop||'-'}`):[];
  return { md:md2, model:d.model||null, depth:d.depth||null, problems, diag, bill:d.bill||null };
}
/* 유형마다 반드시 있어야 할 칸 — 워커 probs() 와 같은 규칙 */
function solProbs(s){
  const P=[], A=k=>Array.isArray(s[k])?s[k]:[], kind=String(s.kind||''), calc=kind==='계산'||kind==='표·선정';
  const steps=A('steps').filter(x=>x&&typeof x==='object');
  if(!steps.length) P.push('풀이 단계가 없음');
  if(!String(s.answer||'').trim()) P.push('답이 없음');
  if(calc){
    if(A('given').length<2) P.push('주어진 값이 모자람');
    if(!A('symbols').length) P.push('부호 목록이 없음');
    if(!steps.some(x=>['sym','plain','num','unit'].every(k=>String(x[k]||'').trim()))) P.push('식 네 줄(부호식·해설식·대입식·단위식)을 갖춘 단계가 없음');
  }
  /* ★ v300 — «임시» 같은 자리표시 */
  const PH=/^\s*(임시|미정|작성\s*예정|추후|tbd|todo|placeholder|\.{2,}|…+)\s*[.。]?\s*$/i;
  if(['gist','answer','check','trap'].some(k=>PH.test(String(s[k]||''))&&String(s[k]||'').trim()) || steps.some(x=>['say','ans','why'].some(k=>String(x[k]||'').trim()&&PH.test(String(x[k]))))) P.push('«임시» 같은 자리표시로 채운 칸이 있음');
  /* ★ v299 */
  if(A('symbols').some(x=>!x||typeof x!=='object'||!String(x.sym||'').trim()||!String(x.mean||'').trim())) P.push('부호가 글자로 왔거나 뜻이 없음');
  if(kind==='회로·시퀀스'){
    const n=Math.max(2,(String(s.answer||'').match(/\(\s*\d{1,2}\s*\)/g)||[]).length);
    if(steps.length<n) P.push(`회로 풀이 단계가 ${steps.length}개뿐 (소문항·가지마다 필요)`);

    /* ★ v303 — 모든 단계가 아니라, 답을 적은 단계가 하나는 있으면 됨 (설명 단계는 ans 가 비는 게 정상) */
    if(steps.length && !steps.some(x=>String(x.ans||'').trim())) P.push('답(ans)을 적은 단계가 없음');
  }
  return P;
}

/* ★ v328 — 해설 한 문항에 «몇 자 · 얼마» (워커가 다시 받기·채우기까지 합쳐 계산해 보냄)
   이 기기에 모델별 평균·오늘 합계를 적어 두고 «✎ 해설 돌리기» 예상 금액에도 씀 */
/* ★ v355 — 필기(짧은 객관식 틀)와 실기(긴 틀·다시 받기)는 문항당 요금이 크게 달라 기록을 따로 둔다
   (여태 필기 화면에서도 실기 평균으로 어림해서 Sonnet 이 Opus 보다 비싸게 나왔음) */
const BILLK=IS_W?'prac:bill:w:v1':'prac:bill:v1';
const billAll=()=>{ try{ return JSON.parse(localStorage.getItem(BILLK)||'{}')||{} }catch(e){ return {} } };
const kfmt=n=>n>=1000?(n/1000).toFixed(1)+'k':String(n|0);
function billNote(bill, which){
  if(!bill || !(bill.calls>0)) return;
  const B=billAll(), day=new Date().toLocaleDateString('sv-SE');
  const w=/opus/i.test(which)?'opus':'sonnet';
  const m=B[w]||{ n:0, krw:0 }; m.n++; m.krw+=bill.krw|0; B[w]=m;
  if(B.day!==day){ B.day=day; B.today=0; B.todayN=0; }
  B.today=(B.today|0)+(bill.krw|0); B.todayN=(B.todayN|0)+1;
  try{ localStorage.setItem(BILLK, JSON.stringify(B)) }catch(e){globalThis.__q?.(e)}
}
function billTxt(bill, withToday){
  if(!bill || !(bill.calls>0)) return '';
  const B=billAll(), day=new Date().toLocaleDateString('sv-SE');
  const today = withToday && B.day===day && B.today ? ` · 오늘 ${(B.today|0).toLocaleString()}원` : '';
  return `약 ${(bill.krw|0).toLocaleString()}원 ($${(+bill.usd||0).toFixed(3)} · 호출 ${bill.calls}번 · 입력 ${kfmt(bill.in_tokens)}/출력 ${kfmt(bill.out_tokens)} 토큰)${today}`;
}
window.__pxBillAvg=w=>{ const m=billAll()[/opus/i.test(w)?'opus':'sonnet']; return m && m.n>=3 ? Math.round(m.krw/m.n) : 0; };
window.__pxBillTxt=billTxt; window.__pxBillNote=billNote;

/* ★ v358 — 상세 Opus/Sonnet 은 문항마다 따로 돈다: 누르고 다음 문항으로 넘어가 또 누르면 «동시에» 진행.
   같은 문항을 두 번 돌리지만 않게 막고, 한꺼번에는 SOLMAX 개까지. 단추 모양은 RUN 을 보고 1초마다 다시 칠한다
   (한눈에 단추는 문항을 옮겨도 같은 단추라, 단추에 «뽑는 중» 을 묶어 두면 다음 문항에서 못 누르던 것) */
const SOLMAX=6;
const RUN=new Map();                        /* id → { which, t0 } */
window.__pxSolRun=()=>RUN;
function paintRun(){
  document.querySelectorAll('[data-pxsol2]').forEach(b=>{
    const [id]=String(b.dataset.pxsol2).split('|'), w=String(b.dataset.pxsol2).split('|')[1];
    const j=RUN.get(String(id));
    if(b.dataset.lbl0==null) b.dataset.lbl0=b.innerHTML;
    if(j){
      const t=`${NAME[j.which]} 뽑는 중… ${Math.round((Date.now()-j.t0)/1000)}초`;
      if(j.which===w){ if(b.textContent!==t) b.textContent=t; }
      else if(b.innerHTML!==b.dataset.lbl0) b.innerHTML=b.dataset.lbl0;
      b.disabled=true; b.classList.add('run');
    }else{
      if(b.innerHTML!==b.dataset.lbl0) b.innerHTML=b.dataset.lbl0;
      b.disabled=false; b.classList.remove('run');
    }
  });
  let n=document.getElementById('pxRunN');
  if(RUN.size){
    if(!n){ n=document.createElement('div'); n.id='pxRunN';
      n.style.cssText='position:fixed;right:14px;bottom:14px;z-index:99990;background:#1e3a8a;color:#fff;border-radius:999px;padding:6px 12px;font:800 12px/1 var(--font-d,system-ui);box-shadow:0 4px 14px #0003;pointer-events:none';
      document.body.appendChild(n); }
    const t=`✎ 해설 ${RUN.size}개 동시 진행 중 — `+[...RUN].map(([k,j])=>{ const r=rowById(k); return (r?r.no+'번':'?')+' '+NAME[j.which]; }).join(' · ');
    if(n.textContent!==t) n.textContent=t;
  }else if(n) n.remove();
}
setInterval(paintRun, 1000);
async function makeSol(id, which, btn){
  const r=rowById(id); if(!r) return;
  id=String(id);
  if(RUN.has(id)) return void toast(`${r.no}번은 이미 해설을 뽑는 중입니다`);
  if(RUN.size>=SOLMAX) return void toast(`한꺼번에는 ${SOLMAX}개까지 — 하나 끝나면 다시 눌러 주세요`);
  if(!r.a_url && !r.a_text && !r.a_md)
    return void toast('답이 없는 문항입니다 — 근거가 없어 해설을 못 만듭니다');
  const sbx=db(); if(!sbx) return void toast('Supabase 를 쓸 수 없습니다');
  /* ★ v325 — 고정 문항도 «상세 Opus/Sonnet» 단추(직접 누름)로는 다시 쓸 수 있음. 고정은 그대로 유지 →
     «✎ 해설 돌리기»(여러 문항) · 자동 생성 · 다시 해석 · 꾸미기에서는 계속 빠짐 */
  if(window.__ezFixed && window.__ezFixed(r.id)){
    if(!confirm(`${r.no}번은 🔒 쉬운해설 고정 문항입니다.\n\n이 단추(${NAME[which]})로만 다시 씁니다 — 고정은 그대로 유지되어\n«✎ 해설 돌리기»·자동 생성에서는 계속 빠집니다.\n\n다시 쓸까요?`)) return;
  }else if(r.easy_md && !confirm(`${r.no}번 해설이 이미 있습니다.\n${NAME[which]} 로 다시 쓸까요?`)) return;

  if(RUN.has(id)) return;                    /* 확인 창 뜬 사이에 또 누른 것 */
  RUN.set(id, { which, t0:Date.now() }); paintRun();
  if(RUN.size>1) toast(`${r.no}번 ${NAME[which]} 시작 — 지금 ${RUN.size}개 동시 진행`);
  /* 카드 안에도 «쓰는 중» 을 남긴다 — 어디를 봐도 돌고 있는 것이 보이게 */
  const box=document.querySelector(`.pcard[data-id="${id}"] .easybox`);
  if(box){ box.classList.remove('empty'); box.innerHTML='<span class="wait">상세 해설을 쓰는 중입니다… 30~90초쯤 걸립니다.</span>'; }

  let spent=null;
  try{
    const got=await askSol(r, which);
    spent=got.bill; billNote(spent, which);
    /* ★ v297 — 원칙 미달이면 있던 해설을 말없이 덮지 않는다 */
    if(got.problems && got.problems.length){
      const list=got.problems.slice(0,6).map(x=>'· '+x).join('\n')
        + (got.diag&&got.diag.length?'\n\n[진단 — 받은 모양]\n'+got.diag.slice(-4).join('\n'):'');
      if(r.easy_md && !confirm(`${NAME[which]} 해설이 원칙에 못 미칩니다 (두 번 더 받아도):\n${list}\n\n지금 있는 해설을 이걸로 바꿀까요? (취소 = 그대로 둠)`))
        throw new Error('원칙 미달 — 있던 해설을 그대로 둠 · '+got.problems[0]);
      toast(`⚠ 원칙 미달 ${got.problems.length}곳 — ${got.problems[0]} (다시 뽑기 권장)`);
    }
    const patch={ easy_md:got.md, st_sol:'raw', sol_by:got.model, sol_ver:(r.sol_ver||0)+1 };
    let up=await sbx.from('practicals').update(patch).eq('id', r.id);
    if(up.error && /st_sol|sol_ver|sol_by|column|schema cache/i.test(up.error.message))
      up=await sbx.from('practicals').update({ easy_md:got.md }).eq('id', r.id);
    if(up.error) throw new Error('저장 실패 — '+up.error.message);
    Object.assign(r, patch);
    toast(`${r.no}번 해설 완료 — ${NAME[which]} · ${got.md.length.toLocaleString()}자${spent?' · '+billTxt(spent, true):''}`);
    repaint(id);
  }catch(e){
    const why=String(e.message||e);
    toast(`해설 실패 — ${why}${spent?' · 쓴 돈 '+billTxt(spent, true):''}`);
    /* ★ v297 — 있던 해설이 있으면 «쓰는 중» 자리를 원래 해설로 되돌림 */
    if(r.easy_md){ try{ repaint(id) }catch(x){globalThis.__q?.(x)} }
    else if(box) box.innerHTML=`<span class="wait">해설을 쓰지 못했습니다 — ${why}</span>`;
  }finally{
    RUN.delete(id); paintRun();
  }
}

/* ★ v266 — 여러 문항 돌리기용. 묻지 않고, 잠그지 않고, 한 문항만 뽑아 저장한다.
   성공하면 글 길이를, 실패하면 이유를 담은 Error 를 던진다. */
async function solOne(id, which){
  const r=rowById(id); if(!r) throw new Error('문항을 못 찾음');
  if(window.__ezFixed && window.__ezFixed(r.id)) throw new Error('쉬운해설 고정');   /* ★ v267 */
  if(!r.a_url && !r.a_text && !r.a_md) throw new Error('답 없음');
  const sbx=db(); if(!sbx) throw new Error('Supabase 없음');
  const box=document.querySelector(`.pcard[data-id="${id}"] .easybox`);
  if(box){ box.classList.remove('empty'); box.innerHTML='<span class="wait">상세 해설을 쓰는 중…</span>'; }
  const got=await askSol(r, which);
  billNote(got.bill, which);
  const fail=m=>{ const e=new Error(m); e.bill=got.bill; return e; };      /* ★ v328 — 실패해도 쓴 돈은 알려 줌 */
  /* ★ v297 — 여럿 돌릴 때: 원칙 미달이면 있던 해설은 그대로 두고 «실패» 로 셈 (다시 돌리면 됨) */
  if(got.problems && got.problems.length && r.easy_md){ repaint(id); throw fail('원칙 미달 · 있던 해설 유지 — '+got.problems[0]); }
  const patch={ easy_md:got.md, st_sol:'raw', sol_by:got.model, sol_ver:(r.sol_ver||0)+1 };
  let up=await sbx.from('practicals').update(patch).eq('id', r.id);
  if(up.error && /st_sol|sol_ver|sol_by|column|schema cache/i.test(up.error.message))
    up=await sbx.from('practicals').update({ easy_md:got.md }).eq('id', r.id);
  if(up.error) throw fail('저장 실패 — '+up.error.message);
  Object.assign(r, patch);
  repaint(id);
  if(got.problems && got.problems.length) throw fail('원칙 미달(저장은 함) — '+got.problems[0]);
  return { len:got.md.length, bill:got.bill||null };
}

/* ══ ② 그림 잘라 넣기 ══ */
let OVX=null, LINES=[], IMG=null, SRC='q', BASE=null;

function loadImg(url){
  return fetch(url,{mode:'cors'})
    .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.blob() })
    .then(b=>new Promise((ok,no)=>{
      const im=new Image();
      im.onload=()=>ok(im);
      im.onerror=()=>no(new Error('그림을 읽지 못했습니다'));
      im.src=URL.createObjectURL(b);
    }));
}
function crop(img, y0, y1){
  const W=img.naturalWidth, H=img.naturalHeight;
  const a=Math.round(H*y0), b=Math.round(H*y1);
  const maxW=1600, sc=Math.min(1, maxW/W);
  const cv=document.createElement('canvas');
  cv.width=Math.max(1,Math.round(W*sc)); cv.height=Math.max(1,Math.round((b-a)*sc));
  cv.getContext('2d').drawImage(img, 0, a, W, b-a, 0, 0, cv.width, cv.height);
  return new Promise((res,rej)=>cv.toBlob(bl=>bl?res(bl):rej(new Error('그림을 만들지 못했습니다')),'image/jpeg',0.85));
}
async function put(path, blob){
  const sbx=db();
  const up=await sbx.storage.from(BUCKET).upload(path, blob, { contentType:'image/jpeg', upsert:true });
  if(up.error) throw up.error;
  return sbx.storage.from(BUCKET).getPublicUrl(path).data.publicUrl + '?t=' + Date.now();
}
const pathOf=(r,k)=>`prac/${r.subject_id}/${r.year}_${r.session}_${String(r.no).padStart(2,'0')}_${k}.jpg`;

/* 같은 회차 문항들 — 칸마다 «몇 번» 인지 고르게 */
function sameSheet(r){
  return allRows().filter(x=>String(x.subject_id)===String(r.subject_id)
      && +x.year===+r.year && +x.session===+r.session)
    .sort((a,b)=>a.no-b.no);
}

function segs(){
  const rs=[...LINES].sort((a,b)=>a-b);
  const edge=[0, ...rs, 1];
  const out=[];
  for(let i=0;i<edge.length-1;i++) if(edge[i+1]-edge[i] > 0.01) out.push([edge[i], edge[i+1]]);
  return out;
}

function drawLines(){
  const stage=$('#pxStage', OVX); if(!stage) return;
  $$('.pxline', stage).forEach(n=>n.remove());
  LINES.forEach((y,i)=>{
    const el=document.createElement('div');
    el.className='pxline'; el.style.top=(y*100)+'%';
    el.innerHTML='<i>×</i>';
    el.querySelector('i').onclick=e=>{ e.stopPropagation(); LINES.splice(i,1); drawLines(); drawSegs(); };
    let down=false;
    el.addEventListener('pointerdown',e=>{ if(e.target.tagName==='I')return; down=true; el.setPointerCapture(e.pointerId); e.preventDefault(); });
    el.addEventListener('pointermove',e=>{
      if(!down) return;
      const box=stage.getBoundingClientRect();
      const y2=Math.min(0.999,Math.max(0.001,(e.clientY-box.top)/box.height));
      LINES[i]=y2; el.style.top=(y2*100)+'%';
    });
    const up=()=>{ if(!down)return; down=false; LINES.sort((a,b)=>a-b); drawLines(); drawSegs(); };
    el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
    stage.appendChild(el);
  });
}

function drawSegs(){
  const wrap=$('#pxSegs', OVX); if(!wrap||!IMG) return;
  const H=IMG.naturalHeight;
  const list=segs();
  const opts=sameSheet(BASE).map(x=>
    `<option value="${x.id}"${String(x.id)===String(BASE.id)?' selected':''}>${x.no}번</option>`).join('');
  wrap.innerHTML=list.map(([a,b],i)=>{
    /* 첫 칸은 문제, 둘째 칸은 답이 가장 흔한 모양임 */
    const useDef = i<2 ? 'y' : 'n';
    const slotDef = i===1 ? 'a' : 'q';
    return `<div class="pxseg" data-i="${i}" data-a="${a}" data-b="${b}">
      <span class="n">칸 ${i+1} · 세로 ${Math.round(H*a)}~${Math.round(H*b)}px</span>
      <select data-use>
        <option value="n"${useDef==='n'?' selected':''}>— 안 씀 —</option>
        <option value="y"${useDef==='y'?' selected':''}>넣기</option>
      </select>
      <select data-row>${opts}</select>
      <select data-slot>
        <option value="q"${slotDef==='q'?' selected':''}>문제</option>
        <option value="qc">문제 — 이어붙이기 (이미 있는 문제 그림 아래에)</option>
        <option value="a"${slotDef==='a'?' selected':''}>답</option>
        <option value="ac">답 — 이어붙이기 (이미 있는 답 그림 아래에)</option>
      </select>
      <span class="pxjoin" hidden></span>
      <div class="pxatt" data-att="${i}">
        <div class="pxatt-bar">
          <span class="pxnote">빠진 부분 붙이기</span>
          <button type="button" class="pxb" data-attpaste="${i}" title="복사해 둔 그림을 붙입니다 (이 칸을 고른 뒤 Ctrl+V 도 됨)">📋 붙여넣기</button>
          <label class="pxb pxfile" title="그림 파일을 골라 붙입니다">📁 파일<input type="file" accept="image/*" data-attfile="${i}" hidden></label>
        </div>
        <div class="pxatt-body"></div>
      </div>
    </div>`;
  }).join('') || '<p class="pxnote">그림 위를 눌러 절단선을 그으세요.</p>';
  $$('.pxatt', wrap).forEach(el=>attDraw(+el.dataset.att));
  paintJoin();
}
/* ★ v360 — 같은 문항·같은 칸(문제/답)으로 고른 칸이 여럿이면 «덮어쓰기» 가 아니라 «위에서 아래로 이어붙임»
   (예전엔 칸1·칸2·칸3 을 모두 «7번 문제» 로 넣으면 마지막 칸만 남았다)
   «이어붙이기» 를 고르면 저장소에 이미 있는 그림 아래에 붙인다 */
function joinPlan(){
  const G=new Map();
  $$('.pxseg',OVX).forEach(el=>{
    if($('[data-use]',el).value!=='y') return;
    const sl=$('[data-slot]',el).value, slot=sl[0], cont=sl.length>1;
    const k=$('[data-row]',el).value+'|'+slot;
    if(!G.has(k)) G.set(k,{ id:$('[data-row]',el).value, slot, cont:false, segs:[] });
    const g=G.get(k); if(!g.segs.length && cont) g.cont=true;
    g.segs.push(el);
  });
  return G;
}
function paintJoin(){
  if(!OVX) return;
  $$('.pxjoin',OVX).forEach(x=>{ x.hidden=true; x.textContent=''; });
  joinPlan().forEach(g=>{
    g.segs.forEach((el,j)=>{
      const tag=$('.pxjoin',el), r=rowById(g.id), nm=`${r?r.no+'번':''} ${g.slot==='q'?'문제':'답'}`;
      if(j===0 && !g.cont && g.segs.length===1) return;
      tag.hidden=false;
      tag.textContent = j===0
        ? (g.cont ? `↳ 이미 있는 ${nm} 그림 아래에 이어붙임` : `① ${nm} 맨 위 — 아래 칸 ${g.segs.length-1}개가 이어붙음`)
        : `↳ 위 칸(칸 ${+g.segs[j-1].dataset.i+1}) 아래로 이어붙여 ${nm} 한 장으로`;
    });
  });
}

/* ══ ★ v359 — 칸에 «빠진 부분» 그림 붙이기 ══════════════════════════════
   잘못 잘려서 (1)(2) 같은 줄이 빠진 칸에, 복사한 그림(Ctrl+V)·그림 파일을 위/아래로 이어 붙인다.
   · 붙인 그림은 먼저 여백을 저절로 잘라 내고(자르기 테두리 — 네 변을 끌어 고칠 수 있음)
   · 칸 그림의 «글자가 있는 폭» 에 맞춰 키우고·줄여서 같은 왼쪽 자리에 놓는다 (크기 −/＋ 로 더 조절)
   · 아래 미리보기가 실제로 저장될 모양이다 */
const ATT=new Map();                  /* 칸 번호 → { img, pos:'top'|'bottom', box:{x0,y0,x1,y1}(0~1), sc:1 } */
let ATTCUR=0;                         /* Ctrl+V 가 들어갈 칸 */
function inkBox(src, sx, sy, sw, sh){
  /* 흰 바탕에서 글자·선이 있는 테두리 (0~1, src 기준) */
  const k=Math.min(1, 500/Math.max(sw,sh));
  const w=Math.max(1,Math.round(sw*k)), h=Math.max(1,Math.round(sh*k));
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const g=cv.getContext('2d',{willReadFrequently:true}); g.fillStyle='#fff'; g.fillRect(0,0,w,h);
  g.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
  const d=g.getImageData(0,0,w,h).data;
  const dark=(x,y)=>{ const p=(y*w+x)*4; return (d[p]*0.3+d[p+1]*0.59+d[p+2]*0.11) < 190; };
  const rowN=y=>{ let n=0; for(let x=0;x<w;x++) if(dark(x,y)) n++; return n; };
  const colN=x=>{ let n=0; for(let y=0;y<h;y++) if(dark(x,y)) n++; return n; };
  const minR=Math.max(1, Math.round(w*0.004)), minC=Math.max(1, Math.round(h*0.004));
  let y0=0; while(y0<h && rowN(y0)<minR) y0++;
  let y1=h-1; while(y1>y0 && rowN(y1)<minR) y1--;
  let x0=0; while(x0<w && colN(x0)<minC) x0++;
  let x1=w-1; while(x1>x0 && colN(x1)<minC) x1--;
  if(y0>=h || x0>=w) return { x0:0, y0:0, x1:1, y1:1 };
  const pad=3;
  return { x0:Math.max(0,(x0-pad)/w), y0:Math.max(0,(y0-pad)/h), x1:Math.min(1,(x1+1+pad)/w), y1:Math.min(1,(y1+1+pad)/h) };
}
function imgFromBlob(b){
  return new Promise((ok,no)=>{ const im=new Image(); im.onload=()=>ok(im); im.onerror=()=>no(new Error('그림을 읽지 못했습니다')); im.src=URL.createObjectURL(b); });
}
async function attSet(i, blob){
  if(!blob || !/^image\//.test(blob.type||'image/')) return void toast('그림이 아닙니다');
  const img=await imgFromBlob(blob);
  ATT.set(i, { img, pos:(ATT.get(i)||{}).pos||'top', box:inkBox(img,0,0,img.naturalWidth,img.naturalHeight), sc:1 });
  const sel=$(`.pxseg[data-i="${i}"] [data-use]`, OVX); if(sel) sel.value='y';
  attDraw(i);
  toast('그림을 붙였습니다 — 자르기 테두리·크기를 맞춘 뒤 «잘라서 넣기»');
}
function segBox(i){
  const el=$(`.pxseg[data-i="${i}"]`, OVX); if(!el||!IMG) return null;
  return { a:+el.dataset.a, b:+el.dataset.b };
}
/* 칸 + 붙인 그림 → canvas (저장·미리보기 같은 함수) */
function compose(i, maxW){
  const sg=segBox(i); if(!sg) return null;
  const W=IMG.naturalWidth, H=IMG.naturalHeight;
  const sy=Math.round(H*sg.a), sh=Math.max(1,Math.round(H*(sg.b-sg.a)));
  const sc=Math.min(1, (maxW||1600)/W);
  const bw=Math.max(1,Math.round(W*sc)), bh=Math.max(1,Math.round(sh*sc));
  const t=ATT.get(i);
  if(!t){
    const cv=document.createElement('canvas'); cv.width=bw; cv.height=bh;
    cv.getContext('2d').drawImage(IMG, 0, sy, W, sh, 0, 0, bw, bh); return cv;
  }
  /* 칸 그림에서 글자가 있는 폭 → 붙인 그림을 그 폭·그 왼쪽에 */
  const ib=inkBox(IMG, 0, sy, W, sh);
  const iw=t.img.naturalWidth, ih=t.img.naturalHeight;
  const cx=t.box.x0*iw, cy=t.box.y0*ih, cw=Math.max(1,(t.box.x1-t.box.x0)*iw), ch=Math.max(1,(t.box.y1-t.box.y0)*ih);
  let tw=Math.max(8, (ib.x1-ib.x0)*bw*t.sc);
  tw=Math.min(tw, bw);
  const th=Math.max(1, Math.round(ch*tw/cw));
  let tx=Math.round(ib.x0*bw); if(tx+tw>bw) tx=Math.max(0, bw-tw);
  const gap=Math.round(10*sc+2);
  const cv=document.createElement('canvas'); cv.width=bw; cv.height=bh+th+gap;
  const g=cv.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,cv.width,cv.height);
  if(t.pos==='top'){
    g.drawImage(t.img, cx, cy, cw, ch, tx, gap/2, tw, th);
    g.drawImage(IMG, 0, sy, W, sh, 0, th+gap, bw, bh);
  }else{
    g.drawImage(IMG, 0, sy, W, sh, 0, 0, bw, bh);
    g.drawImage(t.img, cx, cy, cw, ch, tx, bh+gap/2, tw, th);
  }
  return cv;
}
function attDraw(i){
  const host=$(`.pxatt[data-att="${i}"] .pxatt-body`, OVX); if(!host) return;
  const t=ATT.get(i);
  if(!t){ host.innerHTML=''; return; }
  host.innerHTML=`
    <div class="pxatt-row">
      <select data-attpos="${i}"><option value="top"${t.pos==='top'?' selected':''}>칸 위에 붙이기</option><option value="bottom"${t.pos==='bottom'?' selected':''}>칸 아래에 붙이기</option></select>
      <span class="pxatt-sc"><button type="button" data-attsc="${i}|-1" data-hold>−</button><b>${Math.round(t.sc*100)}%</b><button type="button" data-attsc="${i}|1" data-hold>＋</button></span>
      <button type="button" class="pxb" data-attauto="${i}" title="여백을 다시 저절로 잘라냅니다">✂ 여백 자동</button>
      <button type="button" class="pxb" data-attfull="${i}" title="자르기를 없애고 붙인 그림 전체">전체</button>
      <button type="button" class="pxb" data-attdel="${i}">붙인 그림 빼기</button>
    </div>
    <div class="pxatt-cols">
      <div><span class="pxnote">붙인 그림 — 파란 테두리 안만 씀 (네 변을 끌어 자르기)</span>
        <div class="pxcrop"><img src="${t.img.src}" alt="붙인 그림">
          <div class="pxcbox" style="left:${t.box.x0*100}%;top:${t.box.y0*100}%;width:${(t.box.x1-t.box.x0)*100}%;height:${(t.box.y1-t.box.y0)*100}%">
            <i data-e="t"></i><i data-e="b"></i><i data-e="l"></i><i data-e="r"></i></div></div></div>
      <div><span class="pxnote">저장될 모양 (미리보기)</span><div class="pxprev"></div></div>
    </div>`;
  attPrev(i);
  const crop=$('.pxcrop', host), bx=$('.pxcbox', host);
  $$('i[data-e]', bx).forEach(h=>{
    let on=false;
    h.addEventListener('pointerdown', e=>{ on=true; h.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); });
    h.addEventListener('pointermove', e=>{
      if(!on) return;
      const r=crop.getBoundingClientRect(), B=t.box, k=h.dataset.e;
      const fx=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)), fy=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height));
      if(k==='t') B.y0=Math.min(fy, B.y1-0.02); if(k==='b') B.y1=Math.max(fy, B.y0+0.02);
      if(k==='l') B.x0=Math.min(fx, B.x1-0.02); if(k==='r') B.x1=Math.max(fx, B.x0+0.02);
      Object.assign(bx.style,{ left:B.x0*100+'%', top:B.y0*100+'%', width:(B.x1-B.x0)*100+'%', height:(B.y1-B.y0)*100+'%' });
    });
    const up=()=>{ if(!on) return; on=false; attPrev(i); };
    h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  });
}
function attPrev(i){
  const p=$(`.pxatt[data-att="${i}"] .pxprev`, OVX); if(!p) return;
  const cv=compose(i, 800); if(!cv) return;
  p.innerHTML=''; cv.style.cssText='width:100%;height:auto;display:block'; p.appendChild(cv);
}
async function attPaste(i){
  ATTCUR=i;
  try{
    if(navigator.clipboard && navigator.clipboard.read){
      const items=await navigator.clipboard.read();
      for(const it of items){ const ty=it.types.find(x=>/^image\//.test(x)); if(ty) return void attSet(i, await it.getType(ty)); }
      return void toast('클립보드에 그림이 없습니다 — 그림을 복사한 뒤 다시 누르세요');
    }
  }catch(e){ globalThis.__q?.(e); }
  toast(`칸 ${i+1} 을 골랐습니다 — 이제 Ctrl+V 로 붙이세요`);
}
document.addEventListener('paste', e=>{
  if(!OVX || !OVX.classList.contains('on')) return;
  const f=[...(e.clipboardData?.items||[])].find(x=>/^image\//.test(x.type));
  if(!f) return;
  e.preventDefault();
  const i=$(`.pxseg[data-i="${ATTCUR}"]`, OVX) ? ATTCUR : 0;
  attSet(i, f.getAsFile());
}, true);
document.addEventListener('click', e=>{
  if(!OVX || !OVX.contains(e.target)) return;
  const seg=e.target.closest('.pxseg'); if(seg) { ATTCUR=+seg.dataset.i; $$('.pxseg',OVX).forEach(x=>x.classList.toggle('cur', x===seg)); }
  const q=(k)=>e.target.closest(`[${k}]`);
  let b;
  if((b=q('data-attpaste'))) return void attPaste(+b.dataset.attpaste);
  if((b=q('data-attsc'))){ const [i,d]=b.dataset.attsc.split('|').map(Number); const t=ATT.get(i); if(!t) return;
    t.sc=Math.min(2, Math.max(0.3, Math.round((t.sc+d*0.05)*100)/100)); b.parentNode.querySelector('b').textContent=Math.round(t.sc*100)+'%'; return void attPrev(i); }
  if((b=q('data-attauto'))){ const i=+b.dataset.attauto, t=ATT.get(i); if(!t) return; t.box=inkBox(t.img,0,0,t.img.naturalWidth,t.img.naturalHeight); return void attDraw(i); }
  if((b=q('data-attfull'))){ const i=+b.dataset.attfull, t=ATT.get(i); if(!t) return; t.box={x0:0,y0:0,x1:1,y1:1}; return void attDraw(i); }
  if((b=q('data-attdel'))){ const i=+b.dataset.attdel; ATT.delete(i); return void attDraw(i); }
});
document.addEventListener('change', e=>{
  if(!OVX || !OVX.contains(e.target)) return;
  const fi=e.target.closest('[data-attfile]');
  if(fi){ const f=fi.files&&fi.files[0]; if(f) attSet(+fi.dataset.attfile, f); fi.value=''; return; }
  if(e.target.closest('.pxseg select')) paintJoin();
  const ps=e.target.closest('[data-attpos]');
  if(ps){ const t=ATT.get(+ps.dataset.attpos); if(t){ t.pos=ps.value; attPrev(+ps.dataset.attpos); } }
});
(function(){ const st=document.createElement('style'); st.textContent=`
.pxatt{flex-basis:100%;margin-top:4px;border-top:1px dashed var(--line,#e2e8f0);padding-top:6px}
.pxatt-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.pxatt .pxfile{cursor:pointer;display:inline-flex;align-items:center}
.pxatt-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0}
.pxatt-sc{display:inline-flex;align-items:center;border:1px solid var(--line,#e2e8f0);border-radius:8px;height:30px;overflow:hidden;background:#fff}
.pxatt-sc button{width:28px;height:100%;border:0;background:none;cursor:pointer;color:#0f172a;font:800 14px/1 system-ui;user-select:none;touch-action:manipulation}
.pxatt-sc b{min-width:44px;text-align:center;font:800 11px/1 var(--font-d,system-ui)}
.pxatt-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:620px){ .pxatt-cols{grid-template-columns:1fr} }
.pxcrop{position:relative;border:1px solid var(--line,#e2e8f0);background:#fff;user-select:none;touch-action:none;margin-top:4px}
.pxcrop img{width:100%;display:block;pointer-events:none}
.pxcbox{position:absolute;outline:2px solid #2563eb;box-shadow:0 0 0 9999px rgba(15,23,42,.35)}
.pxcrop{overflow:hidden}
.pxcbox i{position:absolute;background:#2563eb;border-radius:3px}
.pxcbox i[data-e="t"],.pxcbox i[data-e="b"]{left:50%;width:34px;height:8px;margin-left:-17px;cursor:ns-resize}
.pxcbox i[data-e="t"]{top:-5px} .pxcbox i[data-e="b"]{bottom:-5px}
.pxcbox i[data-e="l"],.pxcbox i[data-e="r"]{top:50%;height:34px;width:8px;margin-top:-17px;cursor:ew-resize}
.pxcbox i[data-e="l"]{left:-5px} .pxcbox i[data-e="r"]{right:-5px}
.pxprev{border:1px solid var(--line,#e2e8f0);background:#fff;margin-top:4px;max-height:420px;overflow:auto}
.pxseg.cur{outline:2px solid #93c5fd}
.pxjoin{flex-basis:100%;font:800 11px/1.3 var(--font-d,system-ui);color:#6b2fb3;background:#f6f1fd;border:1px solid #d8c4f2;border-radius:6px;padding:5px 8px}
`; document.head.appendChild(st); })();

async function openCut(id, src){
  const r=rowById(id); if(!r) return void toast('문항을 찾지 못했습니다');
  const sbx=db(); if(!sbx) return void toast('Supabase 를 쓸 수 없습니다');
  BASE=r; SRC=src||(r.q_url?'q':'a'); LINES=[]; IMG=null; ATT.clear(); ATTCUR=0;

  if(!OVX){
    OVX=document.createElement('div');
    OVX.className='pxov';
    OVX.innerHTML=`<div class="pxbox">
      <div class="pxhead">
        <b>그림 잘라 넣기</b>
        <button type="button" class="pxb" id="pxAdd">＋ 절단선</button>
        <button type="button" class="pxb" id="pxClr">선 지우기</button>
        <button type="button" class="pxb" id="pxClose">닫기</button>
      </div>
      <div class="pxbody">
        <div class="pxpick">
          <span class="pxnote">자를 그림</span>
          <select id="pxSrc"><option value="q">문제 그림</option><option value="a">답 그림</option></select>
          <span class="pxnote" id="pxHint"></span>
        </div>
        <div class="pxstage" id="pxStage"><img id="pxImg" alt="자를 그림"></div>
        <div id="pxSegs"></div>
        <div class="pxwarn">칸마다 «몇 번 문항의 어느 칸» 인지 고르고 «잘라서 넣기» 를 누르면,
          진짜로 잘려서 그 자리에 저장됨. 원본 그림은 저장소에서 덮어써짐 — 되돌릴 수 없음.</div>
      </div>
      <div class="pxfoot">
        <button type="button" class="pxb go" id="pxSave">✂ 잘라서 넣기</button>
        <span class="pxnote" id="pxMsg"></span>
      </div>
    </div>`;
    document.body.appendChild(OVX);
    OVX.addEventListener('click',e=>{ if(e.target===OVX) close(); });
    $('#pxClose',OVX).onclick=close;
    $('#pxClr',OVX).onclick=()=>{ LINES=[]; ATT.clear(); drawLines(); drawSegs(); };
    $('#pxAdd',OVX).onclick=()=>{ LINES.push(0.5); LINES.sort((a,b)=>a-b); drawLines(); drawSegs(); };
    $('#pxSrc',OVX).onchange=()=>{ SRC=$('#pxSrc',OVX).value; LINES=[]; ATT.clear(); load(); };
    $('#pxStage',OVX).addEventListener('click',e=>{
      if(e.target.classList.contains('pxline')||e.target.tagName==='I') return;
      const box=e.currentTarget.getBoundingClientRect();
      const y=Math.min(0.999,Math.max(0.001,(e.clientY-box.top)/box.height));
      LINES.push(y); LINES.sort((a,b)=>a-b); drawLines(); drawSegs();
    });
    $('#pxSave',OVX).onclick=save;
    document.addEventListener('keydown',e=>{
      if(OVX&&OVX.classList.contains('on')&&e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); close(); }
    },true);
  }
  $('#pxSrc',OVX).value=SRC;
  OVX.classList.add('on');
  await load();
}
function close(){ if(OVX) OVX.classList.remove('on'); }

async function load(){
  const url = SRC==='a' ? BASE.a_url : BASE.q_url;
  const msg=$('#pxMsg',OVX), hint=$('#pxHint',OVX);
  $('#pxSegs',OVX).innerHTML=''; $$('.pxline',$('#pxStage',OVX)).forEach(n=>n.remove());
  hint.textContent=`${BASE.year}년 제${BASE.session}회 ${BASE.no}번`;
  if(!url){ msg.textContent='그 칸에는 그림이 없습니다.'; $('#pxImg',OVX).removeAttribute('src'); IMG=null; return; }
  msg.textContent='그림을 받는 중…';
  try{
    IMG=await loadImg(url);
    $('#pxImg',OVX).src=IMG.src;
    msg.textContent=`${IMG.naturalWidth}×${IMG.naturalHeight}px — 그림 위를 눌러 절단선을 그으세요`;
    drawSegs();
  }catch(e){
    IMG=null; msg.textContent='그림을 읽지 못했습니다 — '+(e.message||e);
  }
}

async function save(){
  if(!IMG) return void ($('#pxMsg',OVX).textContent='자를 그림이 없습니다.');
  const sbx=db();
  const rows=$$('.pxseg',OVX).filter(el=>$('[data-use]',el).value==='y');
  if(!rows.length) return void ($('#pxMsg',OVX).textContent='넣을 칸을 하나도 안 골랐습니다.');
  const btn=$('#pxSave',OVX); btn.disabled=true;
  const msg=$('#pxMsg',OVX);
  let done=0;
  try{
    const segCv=el=>{
      const ci=+el.dataset.i, a=+el.dataset.a, b=+el.dataset.b;
      if(ATT.has(ci)) return compose(ci,1600);
      const W=IMG.naturalWidth, H=IMG.naturalHeight, sc=Math.min(1,1600/W);
      const sy=Math.round(H*a), sh=Math.max(1,Math.round(H*(b-a)));
      const cv=document.createElement('canvas'); cv.width=Math.max(1,Math.round(W*sc)); cv.height=Math.max(1,Math.round(sh*sc));
      cv.getContext('2d').drawImage(IMG,0,sy,W,sh,0,0,cv.width,cv.height); return cv;
    };
    for(const g of joinPlan().values()){
      const tgt=rowById(g.id); if(!tgt) continue;
      const slot=g.slot, nm=`${tgt.no}번 ${slot==='q'?'문제':'답'}`;
      msg.textContent=`${nm} — ${g.segs.length>1||g.cont?'이어붙이는':'자르는'} 중…`;
      const parts=g.segs.map(segCv);
      if(g.cont){
        const old=slot==='q'?tgt.q_url:tgt.a_url;
        if(old){ try{ const im=await loadImg(old); const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight; c.getContext('2d').drawImage(im,0,0); parts.unshift(c); }
                 catch(e){ throw new Error(`${nm} — 이미 있는 그림을 못 읽어 이어붙이지 못함 (${e.message||e})`); } }
      }
      const W=Math.max(...parts.map(c=>c.width)), gap=parts.length>1?6:0;
      const hs=parts.map(c=>Math.round(c.height*W/c.width));
      const out=document.createElement('canvas'); out.width=W; out.height=hs.reduce((x,y)=>x+y,0)+gap*(parts.length-1);
      const gx=out.getContext('2d'); gx.fillStyle='#fff'; gx.fillRect(0,0,out.width,out.height);
      let y=0; parts.forEach((c,k)=>{ gx.drawImage(c,0,y,W,hs[k]); y+=hs[k]+gap; });
      const blob=await new Promise((ok,no)=>out.toBlob(bl=>bl?ok(bl):no(new Error('그림을 만들지 못했습니다')),'image/jpeg',0.88));
      const url=await put(pathOf(tgt, slot), blob);
      const patch={ [slot==='q'?'q_url':'a_url']: url, ['st_'+slot]:'draft' };
      let up=await sbx.from('practicals').update(patch).eq('id', tgt.id);
      if(up.error && /st_q|st_a|column|schema cache/i.test(up.error.message))
        up=await sbx.from('practicals').update({ [slot==='q'?'q_url':'a_url']: url }).eq('id', tgt.id);
      if(up.error) throw new Error(up.error.message);
      Object.assign(tgt, patch);
      done+=g.segs.length;
    }
    msg.textContent=`${done}칸 넣었습니다.`;
    toast(`그림 ${done}칸을 잘라 넣었습니다`);
    repaint(BASE.id);
    setTimeout(close, 700);
  }catch(e){
    msg.textContent='실패 — '+(e.message||e);
  }finally{ btn.disabled=false; }
}

/* ══ 단추 붙이기 ══ */
function ovNowId(){
  try{ if(typeof OVID!=='undefined'&&OVID) return String(OVID) }catch(e){globalThis.__q?.(e)}
  const m=String($('#ovTitle')?.textContent||'').match(/(\d{4})년 제(\d+)회 (\d+)번/);
  if(m){ const r=allRows().find(x=>String(x.year)===m[1]&&String(x.session)===m[2]&&String(x.no)===m[3]); if(r) return String(r.id); }
  return '';
}
/* ★ v263 — 해설 글자 크기 (5~15pt). --ezfs 하나로 해설칸 전체가 따라온다 */
const FSKEY='prac:ezfs';
function applyFs(pt){
  const v=Math.min(15, Math.max(5, +pt || 9));
  document.documentElement.style.setProperty('--ezfs', v+'pt');
  try{ localStorage.setItem(FSKEY, String(v)); }catch(e){globalThis.__q?.(e)}
  const n=$('#pxFsN'); if(n) n.textContent='가 '+v+'pt';
  $$('[data-ezfs]').forEach(b=>b.disabled=(+b.dataset.ezfs<0 ? v<=5 : v>=15));
  const r=$('#pxFs'); if(r && +r.value!==v) r.value=String(v);
}
function curFs(){ try{ return +(localStorage.getItem(FSKEY) || 9) }catch(e){ return 9 } }
applyFs(curFs());
document.addEventListener('input', e=>{
  if(e.target && e.target.id==='pxFs') applyFs(e.target.value);
}, true);

/* 해설만 보기 — 켜고 끄기. 고른 것은 이 기기에 적어 둔다 */
const EZKEY='prac:ezonly';
function paintEzOnly(){
  const on=document.body.classList.contains('ezonly');
  $$('[data-pxezonly]').forEach(b=>{
    b.classList.toggle('on', on);
    b.textContent = on ? '📖 전체 보기' : '📖 해설만';
  });
}
function ezOnly(force){
  const on = (force === undefined)
    ? !document.body.classList.contains('ezonly') : !!force;
  document.body.classList.toggle('ezonly', on);
  try{ localStorage.setItem(EZKEY, on ? '1' : '0'); }catch(e){globalThis.__q?.(e)}
  paintEzOnly();
}
/* ★ v358 — «해설만» 단추를 없앴으니, 켜진 채 저장돼 있던 것도 끈다 (갇히지 않게) */
try{ localStorage.setItem(EZKEY,'0'); document.body.classList.remove('ezonly'); }catch(e){globalThis.__q?.(e)}

/* ★ v358 — 해설 글자 −/＋ (머리줄) · 0.5pt 씩 */
document.addEventListener('click', e=>{
  const b=e.target.closest && e.target.closest('[data-ezfs]'); if(!b) return;
  e.preventDefault(); e.stopPropagation();
  applyFs(Math.round((curFs()+(+b.dataset.ezfs)*0.5)*2)/2);
  try{ window.__ezxRemeasure && window.__ezxRemeasure() }catch(x){globalThis.__q?.(x)}
}, true);
/* ★ v358 — [data-hold] 단추는 꾹 누르면 계속 눌린다 (0.4초 뒤부터 0.09초마다) */
(function(){
  let t1=0, t2=0, rep=false, auto=false;
  const stop=()=>{ clearTimeout(t1); clearInterval(t2); t1=t2=0; };
  document.addEventListener('pointerdown', e=>{
    const b=e.target.closest && e.target.closest('[data-hold]'); if(!b || e.button>0) return;
    stop(); rep=false;
    t1=setTimeout(()=>{ rep=true; t2=setInterval(()=>{ if(b.disabled || !b.isConnected) return stop(); auto=true; b.click(); auto=false; }, 90); }, 400);
  }, true);
  ['pointerup','pointercancel'].forEach(ev=>addEventListener(ev, stop, true));
  addEventListener('blur', e=>{ if(e.target===window) stop(); });
  /* 꾹 눌러 계속 돈 뒤 손을 뗄 때 나오는 클릭 한 번은 버린다 (한 칸 더 가지 않게) */
  addEventListener('click', e=>{ if(rep && !auto && e.target.closest && e.target.closest('[data-hold]')){ rep=false; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  document.addEventListener('contextmenu', e=>{ if(e.target.closest && e.target.closest('[data-hold]')) e.preventDefault(); }, true);
})();

function mount(){
  /* ① 한눈에 판 머리줄 */
  const oh=$('#ovl .oh');
  if(oh && !$('#pxOvBtns')){
    const box=document.createElement('span');
    box.className='pxbtns'; box.id='pxOvBtns';
    box.innerHTML=`<button type="button" class="pxb" data-pxsol="opus" title="비전공자용 상세 해설 — Opus 로 (문항당 약 80원)">✎ 상세해설 <b>Opus</b></button>
      <button type="button" class="pxb" data-pxsol="sonnet" title="비전공자용 상세 해설 — Sonnet 으로 (문항당 약 30원)">✎ 상세해설 <b>Sonnet</b></button>
      <button type="button" class="pxb" data-pxcut title="가로 절단선을 긋고 칸마다 문제·답으로 나눠 넣습니다">✂ 잘라 넣기</button>
`;   /* ★ v358 — «해설만» 단추 · 글자 끌기막대 없앰 (글자는 머리줄 −/＋) */
    const after=$('#ovReformat',oh)||oh.lastElementChild;
    after ? after.after(box) : oh.appendChild(box);
  }
  /* ② 카드마다 — 이미 있는 «해설 만들기» 옆에 */
  $$('#list .pcard [data-easy]').forEach(b=>{
    if(b.nextElementSibling && b.nextElementSibling.classList?.contains('pxez')) return;
    const id=b.dataset.easy;
    const s=document.createElement('span');
    s.className='pxez';
    s.innerHTML=`<button type="button" class="pxb" data-pxsol2="${id}|opus" title="비전공자용 상세 해설 — Opus">✎ 상세 Opus</button>
      <button type="button" class="pxb" data-pxsol2="${id}|sonnet" title="비전공자용 상세 해설 — Sonnet">✎ 상세 Sonnet</button>
      <button type="button" class="pxb" data-pxcut2="${id}" title="그림을 잘라 문제·답 칸에 나눠 넣습니다">✂ 잘라 넣기</button>`;
    b.after(s);
  });
}

document.addEventListener('click', e=>{
  const a=e.target.closest('[data-pxsol]');
  if(a){ e.preventDefault(); e.stopPropagation();
    const id=ovNowId(); if(!id) return void toast('어느 문항인지 알 수 없습니다');
    return void makeSol(id, a.dataset.pxsol, a); }
  const b=e.target.closest('[data-pxsol2]');
  if(b){ e.preventDefault(); e.stopPropagation();
    const [id,which]=b.dataset.pxsol2.split('|');
    return void makeSol(id, which, b); }
  const c=e.target.closest('[data-pxcut]');
  if(c){ e.preventDefault(); e.stopPropagation();
    const id=ovNowId(); if(!id) return void toast('어느 문항인지 알 수 없습니다');
    return void openCut(id); }
  const d=e.target.closest('[data-pxcut2]');
  if(d){ e.preventDefault(); e.stopPropagation();
    return void openCut(d.dataset.pxcut2); }
  const z=e.target.closest('[data-pxezonly]');
  if(z){ e.preventDefault(); e.stopPropagation(); return void ezOnly(); }
}, true);

setInterval(() => { mount(); paintEzOnly(); applyFs(curFs()); }, 1200); setTimeout(mount, 900);
window.__pxSol=makeSol; window.__pxCut=openCut;
window.__pxSolOne=solOne; window.__pxRows=allRows; window.__pxNowId=ovNowId; window.__pxToast=toast;
})();

/* ★ v343 — 이미 저장돼 있는 해설에도 적용: «> 맨 TeX» 답 줄(달러 없이 \times · ^{ … 가 그대로 온 것)을
   그리기 직전에 $…$ 로 감싼다. 새로 만드는 해설은 solToMd 의 ansLine 이 처음부터 감싸서 저장함.
   (예: «> L=2 \times 10^{-3}\,[\mathrm{H/km}]» 가 답 상자에서 글자 그대로 찍히던 것) */
(function(){
  const BT = /\\[A-Za-z]+|[\^_]\{/;
  const han = x => x.replace(/\\(?:text|mathrm|mathbf)\{[^{}]*\}|([가-힣][가-힣0-9 ·]*[가-힣]|[가-힣])/g,
                             (m, h) => h ? `\\text{${h.trim()}}` : m);
  const fix = md => String(md == null ? "" : md)
    /* ★ v356 — 이미 저장된 해설의 «- $$ «…» — …» 줄 (빈 기호 칸이 남긴 것) → 아래가 통째로 수식으로 먹히지 않게 */
    .replace(/^([ \t]*-[ \t]*)\$\$(?=[ \t]+«)/gm, "$1")
    .replace(/^([ \t]*>[ \t]*)(\(\s*\d{1,2}\s*\)[ \t]*)?([^\n]*)$/gm, (m, a, b, c) => {
    if(!c || c.includes("$") || !BT.test(c)) return m;
    return a + (b || "") + "$" + han(c.trim()) + "$";
  });
  window.__bareAnsFix = fix;
  if(typeof window.mdLite === "function" && !window.mdLite.__bare){
    const raw = window.mdLite;
    const w = function(md){ return raw.call(this, fix(md)); };
    Object.assign(w, raw);          /* 앞 손질들(__tex · __sci) 표시를 그대로 이어 받음 — 두 번 감싸지 않게 */
    w.__bare = 1; window.mdLite = w;
  }
})();
