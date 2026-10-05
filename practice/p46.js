/* practice.html 에서 분리 (v341) — 원래 18321번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const MARK='\uE000';                       /* 개인용 영역 글자 — 어디에도 안 쓰인다 */
const SKIP=/^(?:\||#{1,6}\s|[-*]\s|\d+[.)]\s|\$\$|>|```)/;

function keepIndent(src){
  return String(src==null?'':src).split('\n').map(line=>{
    const m=line.match(/^([ \t\u3000]+)/);
    const body=m?line.slice(m[1].length):line;
    if(SKIP.test(body)) return line;                 /* 표·제목·목록·수식은 그대로 */
    let out=line;
    if(m){
      let n=0;
      for(const ch of m[1]) n += ch==='\t' ? 4 : ch==='\u3000' ? 2 : 1;
      out=MARK.repeat(n)+body;
    }
    /* 줄 가운데 — 수식이 없는 줄만 (수식 안에 넣으면 KaTeX 가 깨진다) */
    if(out.indexOf('$')<0){
      out=out.replace(/(\S)( {2,})/g,(x,a,b)=>a+MARK.repeat(b.length));
    }
    return out;
  }).join('\n');
}

['mdRich','mdLite'].forEach(k=>{
  const f=window[k];
  if(typeof f!=='function' || f.__indent) return;
  const w=function(src){
    const out=f.call(this, keepIndent(src));
    return String(out).split(MARK).join('&nbsp;');
  };
  w.__indent=1; ['__mlmath','__cellbr'].forEach(t=>{ w[t]=f[t] });
  try{ window[k]=w }catch(e){globalThis.__q?.(e)}
});

/* ── 글 칸에서 Tab 은 두 칸 ── */
const t=setInterval(()=>{
  const ta=document.querySelector('.edw #edTa');
  if(!ta || ta.__tab) return;
  ta.__tab=1; clearInterval(t);
  ta.addEventListener('keydown',e=>{
    if(e.key!=='Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault(); e.stopPropagation();
    const s=ta.selectionStart, en=ta.selectionEnd;
    if(!e.shiftKey){
      ta.value=ta.value.slice(0,s)+'  '+ta.value.slice(en);
      ta.selectionStart=ta.selectionEnd=s+2;
    }else{
      /* Shift+Tab — 줄 앞 두 칸을 뺀다 */
      const l0=ta.value.lastIndexOf('\n',s-1)+1;
      if(ta.value.slice(l0,l0+2)==='  '){
        ta.value=ta.value.slice(0,l0)+ta.value.slice(l0+2);
        ta.selectionStart=ta.selectionEnd=Math.max(l0,s-2);
      }
    }
    ta.dispatchEvent(new Event('input',{bubbles:true}));
  },true);
},400);
setTimeout(()=>clearInterval(t),120000);
})();
