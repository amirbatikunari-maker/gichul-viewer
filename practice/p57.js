/* practice.html 에서 분리 (v341) — 원래 21962번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

/* ══════════════════════════════════════════════════════════════
   v265 · 해설 줄 나눔 — 문장이 끝나면, 또 너무 길어지면 알아서 줄을 바꾼다

   여태 «쉬운 풀이» 의 글 칸(왜 · 검산 · 외우기 · 흔한 실수)은 아무리 길어도
   한 덩어리로 흘렀다. 화면 너비에 맞춰 저절로 접힐 뿐이라, 문장이 어디서
   끝나는지 눈으로 잡히지 않았다.
   이 조각은 «그려내기 직전» 에만 줄을 나눈다 — 저장된 글(easy_md)은 손대지
   않으므로, 고치기 창에는 원래 글이 그대로 뜬다. 어떤 모형(sonnet · opus)이
   써 준 해설이든, 이미 저장해 둔 옛 해설이든 똑같이 나뉜다.

   나누는 자리
     ① 문장이 끝난 자리 — 마침표 · 물음표 · 느낌표 뒤.
        숫자 사이의 점(2.7 · KEC 241.17)은 문장 끝이 아니므로 건드리지 않는다.
     ② 한 문장이 MAX 글자를 넘으면 — 쉼표 · 가운뎃점 자리에서 한 번 더.
   손대지 않는 줄
     소제목(**…**) · 머리글(#) · 표(|) · 수식만 있는 줄($$) · 코드칸 · 상자표시 ·
     짧은 줄(MIN 미만) · 이미 <br> 가 들어 있는 줄.
   ══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var MIN = 34;    /* 이보다 짧은 줄은 그냥 둔다 */
var MAX = 58;    /* 한 조각이 이보다 길면 쉼표 자리에서 한 번 더 나눈다 */

var BR  = '\u0001';   /* 줄 나눔 자리표 — esc() 를 그냥 지나간다 */
var K0  = '\u0002';   /* 수식·코드 보관 자리표 */

/* 줄 앞머리(- · 1. · > )는 떼어 두고 뒷글만 나눈다 */
var HEAD = /^(\s*(?:[-*]\s+|\d+\.\s+|>\s+|\(\d+\)\s*|[①-⑳]\s*)?)([\s\S]*)$/;

function skip(t){
  var x = t.trim();
  if(!x) return true;
  if(x.length < MIN) return true;
  if(x.indexOf('<br') >= 0) return true;
  if(/^(#{1,6}\s|[-*_]{3,}$|\||<!--|\[\[|```|\$\$)/.test(x)) return true;
  if(/^\*\*[^*]*\*\*$/.test(x)) return true;          /* 소제목 줄 */
  return false;
}

/* 한 줄을 조각으로 나눈다 */
function chop(body){
  var keep = [];
  var s = String(body).replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]*\$|`[^`]*`/g, function(m){
    return K0 + (keep.push(m) - 1) + K0;
  });

  /* ① 문장 끝 — 앞 글자가 숫자면(2.7 · 241.17) 문장 끝이 아니다 */
  s = s.replace(/([^\s0-9])([.!?…])(\s+)(?=\S)/g, function(_, a, p){ return a + p + BR; });

  /* ② 너무 긴 조각은 쉼표 자리에서 한 번 더 */
  s = s.split(BR).map(function(seg){
    seg = seg.trim();
    if(seg.length <= MAX) return seg;
    var bits = seg.replace(/([,;·])\s+/g, function(_, c){ return c + BR; }).split(BR);
    var lines = [], cur = '';
    bits.forEach(function(b){
      b = b.trim(); if(!b) return;
      if(!cur){ cur = b; return; }
      if((cur + ' ' + b).length > MAX){ lines.push(cur); cur = b; }
      else cur += ' ' + b;
    });
    if(cur) lines.push(cur);
    return lines.join(BR);
  }).join(BR);

  return s.replace(new RegExp(K0 + '(\\d+)' + K0, 'g'), function(_, i){ return keep[+i]; });
}

function prep(md){
  var src = String(md == null ? '' : md);
  if(!src) return src;
  var lines = src.split('\n'), fence = false, box = false, out = [];
  for(var i = 0; i < lines.length; i++){
    var l = lines[i], x = l.trim();
    if(/^```/.test(x)){ fence = !fence; out.push(l); continue; }
    if(/^\[\[\s*\/?\s*(?:box|박스)\s*\]\]$/i.test(x)){ box = /^\[\[\s*(?:box|박스)/i.test(x); out.push(l); continue; }
    if(fence || box || skip(l)){ out.push(l); continue; }
    var m = l.match(HEAD);
    var head = m ? m[1] : '', body = m ? m[2] : l;
    if(body.trim().length < MIN){ out.push(l); continue; }
    out.push(head + chop(body));
  }
  return out.join('\n');
}

/* 그려낸 HTML 에서 자리표를 진짜 줄 나눔으로 바꾼다 */
function paint(html){
  var h = String(html == null ? '' : html);
  return h.indexOf(BR) < 0 ? h : h.split(BR).join('<br class="sbr">');
}

['mdLite', 'md'].forEach(function(name){
  var fn = window[name];
  if(typeof fn !== 'function' || fn.__sbr) return;
  var w = function(t){ return paint(fn.call(this, prep(t))); };
  w.__sbr = 1; w.__tbl = fn.__tbl; w.__img = fn.__img; w.__tex = fn.__tex; w.__sci = fn.__sci;
  window[name] = w;
});

/* 손으로 끄고 켤 수 있게 열어 둔다 — sbrOff() · sbrOn() · sbrSet(최소, 최대) */
window.sbrSet = function(min, max){ if(min > 0) MIN = min; if(max > 0) MAX = max; };
window.sbrOff = function(){ MIN = 1e9; };
window.sbrOn  = function(){ MIN = 34; };
})();
