/* practice.html 에서 분리 (v341) — 원래 53번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  /* ── ① % ── \% 는 그대로 두고, 맨 % 만 \% 로. 두 번 돌려도 같은 결과다(%% 도 안전) */
  var pct = function(t){ return typeof t === "string" ? t.replace(/\\%|%/g, "\\%") : t; };

  /* ── ② 빗금 분수 ──
     모델이 «100/315» 처럼 빗금으로 써 보내면 화면에도 빗금 그대로 나온다.
     분자·분모가 위아래로 안 서니 식이 눈에 안 들어온다. 빗금을 \dfrac 으로 세운다.
     ★ 함부로 세우면 안 되는 빗금이 있다 — 단위(Wb/m^2) · 변압비(22.9kV/3.3kV) ·
       글월(\text{출력/입력}). 그래서
         · \mathrm{} · \text{} · \mathbf{} · [대괄호] 속은 통째로 빼 두고
         · 빗금 양옆이 «한 덩어리로 끝나는 것» 일 때만 세운다.
       22.9kV/3.3kV 는 왼쪽이 k 에 붙어 있어 한 덩어리가 아니므로 안 건드린다. */
  var OP = "(?:\\\\sqrt\\{[^{}]*\\}"
         + "|\\\\[A-Za-z]+"
         + "|\\d+(?:\\.\\d+)?"
         + "|(?:\\\\%)?[A-Za-z](?:_\\{[^{}]*\\}|_[A-Za-z0-9])?(?:\\^\\{[^{}]*\\}|\\^[A-Za-z0-9])?"
         + "|\\([^()]*\\)"
         + "|\\{[^{}]*\\})";
  var FRAC = new RegExp("(^|[\\s=+\\-(,\\[{])(" + OP + ")\\s*/\\s*(" + OP + ")(?=$|[\\s=+\\-),\\]}\\\\])", "g");
  var SKIP = /\\(?:mathrm|text|mathbf|operatorname|textrm)\{[^{}]*\}|\[[^\[\]]*\]/g;
  var bare = function(x){ return /^\([^()]*\)$/.test(x) ? x.slice(1, -1) : x; };
  function frac(t){
    if(typeof t !== "string" || t.indexOf("/") < 0) return t;
    var keep = [];
    var s = t.replace(SKIP, function(m){ keep.push(m); return "\u0000" + (keep.length - 1) + "\u0000"; });
    s = s.replace(FRAC, function(m, pre, a, b){ return pre + "\\dfrac{" + bare(a) + "}{" + bare(b) + "}"; });
    return s.replace(/\u0000(\d+)\u0000/g, function(_, k){ return keep[+k]; });
  }

  /* ── ③ 떨어져 나간 백슬래시 ──
     모델이 JSON 에 \\frac 을 «\\» 하나로 적어 보내면, JSON.parse 가 \\f 를
     «페이지넘김» 글자로 읽어 버린다. 그래서 \\frac 은 [넘김]rac, \\times 는
     [탭]imes, \\theta 는 [탭]heta 로 도착한다. KaTeX 는 «rac» «imes» 를
     그냥 기울인 글자로 그려서, 식이 터지지도 않고 조용히 뭉개진다.
     ★ 글 칸(검산·흔한 실수)에는 fixMath 가 이미 이 일을 하는데,
       정작 식 칸(sym·plain·num·unit)은 tex() 로만 가서 아무 손질도 없었다.
     제어글자 다음이 «아는 명령의 나머지» 일 때만 백슬래시를 도로 꽂는다.
     그냥 빈칸으로 쓰인 탭은 빈칸으로 둔다. */
  var LET  = { "\t":"t", "\f":"f", "\b":"b", "\v":"v", "\r":"r" };
  var TAIL = { t:["imes","heta","an","ext","frac","au","riangle","o"],
               f:["rac","allingdotseq","orall"],
               b:["eta","egin","ar","mod"],
               v:["arphi","ec","arepsilon","arDelta"],
               r:["ho","ight","angle"] };
  function unctrl(t){
    if(typeof t !== "string" || !/[\t\f\v\b\r]/.test(t)) return t;
    return t.replace(/[\t\f\v\b\r]/g, function(c, off, str){
      var L = LET[c], rest = str.slice(off + 1), list = TAIL[L] || [];
      for(var i = 0; i < list.length; i++) if(rest.indexOf(list[i]) === 0) return "\\" + L;
      return " ";
    });
  }

  /* ── ④ NOT 윗줄(\overline) 손질 ── */
  function bars(t){
    if(typeof t !== "string") return t;
    /* 이어 쓴 윗줄 글자(A̅B̅)는 한 줄로 이어진 뜻 → 한 \overline 으로.
       짧은 윗줄(Ā · A¯)은 글자 하나짜리 */
    if(/[\u0304\u0305\u00AF]/.test(t)){
      t = t.replace(/(?:[A-Za-z0-9]\u0305)+/g, function(m){ return "\\overline{" + m.replace(/\u0305/g, "") + "}"; });
      t = t.replace(/([A-Za-z0-9])[\u0304\u00AF]/g, "\\overline{$1}");
    }
    if(t.indexOf("\\overline") < 0 && t.indexOf("\\bar") < 0) return t;

    /* 짝 맞는 닫는 중괄호 자리 — \{ \} 는 건너뛴다 */
    function shut(s, i){
      for(var d = 0, j = i; j < s.length; j++){
        var c = s[j];
        if(c === "\\"){ j++; continue; }
        if(c === "{") d++;
        else if(c === "}" && --d === 0) return j;
      }
      return -1;
    }
    /* 글자 둘 이상에 씌운 \bar{…} 는 짧은 꺾쇠만 가운데 뜬다 → \overline 으로 */
    t = t.replace(/\\bar(?![A-Za-z])\s*(?=\{)/g, function(m, off, str){
      var a = str.indexOf("{", off), b = shut(str, a);
      if(b < 0) return m;
      var core = str.slice(a + 1, b).replace(/\\(?:text|mathrm|mathit|mathbf)\s*/g, "").replace(/[{}\s]/g, "");
      return core.length > 1 ? "\\overline" : m;
    });

    /* 안쪽부터 훑는다 — 돌려주는 것: 고친 글, 가장 깊은 윗줄 겹수 */
    function walk(s){
      var out = "", i = 0, deep = 0;
      while(i < s.length){
        if(s.substr(i, 9) === "\\overline" && !/[A-Za-z]/.test(s[i + 9] || "")){
          var j = i + 9; while(s[j] === " ") j++;
          var arg, end;
          if(s[j] === "{"){
            var b = shut(s, j);
            if(b < 0){ out += s.slice(i); break; }
            arg = s.slice(j + 1, b); end = b + 1;
          }else if(s[j] === "\\"){
            var mm = s.slice(j).match(/^\\(?:[A-Za-z]+|.)/);
            arg = mm ? mm[0] : "\\"; end = j + arg.length;
          }else{ arg = s[j] || ""; end = j + 1; }
          var r = walk(arg);
          /* ① 겹친 윗줄 — 안쪽 줄 위로 바깥 줄을 조금 더 띄운다(기본 틈이 1~2px 이라 한 줄로 보임) */
          var lift = (r.deep > 0 && !/^\\rule\{0pt\}/.test(r.out))
            ? "\\rule{0pt}{" + (0.70 + 0.33 * r.deep).toFixed(2) + "em}" : "";
          out += "\\overline{" + lift + r.out + "}";
          deep = Math.max(deep, r.deep + 1);
          /* ② 나란히 붙은 윗줄 — 사이를 살짝 벌린다(안 벌리면 한 줄로 이어져 \overline{AB} 로 읽힘) */
          var k = end; while(s[k] === " ") k++;
          if(s.substr(k, 9) === "\\overline" && !/[A-Za-z]/.test(s[k + 9] || "")) out += "\\mkern2.5mu ";
          i = end; continue;
        }
        if(s[i] === "\\" && i + 1 < s.length){ out += s[i] + s[i + 1]; i += 2; continue; }
        out += s[i]; i++;
      }
      return { out: out, deep: deep };
    }
    return walk(t).out;
  }

  var tidy = function(t){ return bars(frac(pct(unctrl(t)))); };
  var done = false;
  function fix(k){
    if(!k || done) return k;
    ["render", "renderToString"].forEach(function(name){
      var f = k[name];
      if(typeof f !== "function" || f.__pct) return;
      var w = function(){
        var a = [].slice.call(arguments);
        a[0] = tidy(a[0]);
        return f.apply(this, a);
      };
      w.__pct = 1;
      try{ k[name] = w; }catch(e){globalThis.__q?.(e)}
    });
    done = !!(k.render && k.render.__pct);
    return k;
  }
  /* ① 아직 안 실렸다면 «실리는 순간» 잡는다 */
  try{
    if(!window.katex){
      var real;
      Object.defineProperty(window, "katex", {
        configurable: true,
        get: function(){ return real; },
        set: function(v){ real = fix(v); }
      });
    }else fix(window.katex);
  }catch(e){globalThis.__q?.(e)}
  /* ② 위가 안 먹는 경우를 대비한 뒷문 — 20초만 살핀다 */
  var t = setInterval(function(){
    if(window.katex){ fix(window.katex); if(done) clearInterval(t); }
  }, 20);
  setTimeout(function(){ clearInterval(t); }, 20000);
})();
