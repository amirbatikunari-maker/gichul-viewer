/* practice.html 에서 분리 (v341) — 원래 16158번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);

/* ══ ① 창 안의 키는 바깥으로 안 내보낸다 ══
   window 의 «잡는 단계» 에 건다. 다만 이 블록은 맨 나중에 실려서
   먼저 걸린 창 자신의 손잡이(Esc · Ctrl+Enter)보다 «뒤» 에 온다.
   그러니 그 둘은 여기서 막지 않아도 이미 지나간 뒤다 — 그래도 명시해 둔다. */
addEventListener('keydown', e=>{
  const w=$('.edw');
  if(!w || !w.classList.contains('on')) return;
  if(!e.target || !e.target.closest || !e.target.closest('.edw')) return;
  if(e.key==='Escape' || e.key==='Tab' || e.ctrlKey || e.metaKey) return;
  e.stopPropagation();          /* 기본 동작(글자 입력)은 그대로 둔다 */
}, true);

/* ══ ② 편집 단추 ══ */
const BTN=[
  ['b','굵게','<b class="b">B</b>'],
  ['i','기울임','<span class="i">I</span>'],
  ['code','코드','&lt;/&gt;'],
  ['|'],
  ['h','소제목','H'],
  ['ul','목록','• 목록'],
  ['ol','번호','1. 번호'],
  ['|'],
  ['alignL','왼쪽 정렬','⇤'],
  ['alignC','가운데 정렬','⇔'],
  ['alignR','오른쪽 정렬','⇥'],
  ['box','박스로 감싸기','▭ 박스'],
  ['codeblk','코드 블록','▤ 코드블록'],
  ['|'],
  ['table','표 넣기','▦ 표'],
  ['math','수식','$ 수식'],
  ['|'],
  ['undo','되돌리기','↶'],
  ['redo','다시','↷']
];

function build(W){
  if(W.querySelector('.edbar')) return;
  const bar=document.createElement('div');
  bar.className='edbar';
  bar.innerHTML=BTN.map(x=> x[0]==='|'
    ? '<span class="sep"></span>'
    : `<button type="button" data-k="${x[0]}" title="${x[1]}">${x[2]}</button>`).join('')
    + '<span class="where" id="edWhere">왼쪽 글</span>';
  const tools=W.querySelector('.tools');
  const orig=W.querySelector('.edorig');
  (orig||tools) ? (orig||tools).after(bar) : W.querySelector('.body')?.before(bar);

  const ta=$('#edTa',W), prev=$('#edPrev',W), where=$('#edWhere',bar);
  let side='ta';
  ta && ta.addEventListener('focus',()=>{ side='ta'; where.textContent='왼쪽 글'; });
  prev && prev.addEventListener('focus',()=>{ side='prev'; where.textContent='오른쪽 화면'; });

  /* 왼쪽(글) — 고른 자리를 마크다운으로 감싼다 */
  const MD={
    b:['**','**','굵게'], i:['*','*','기울임'], code:['`','`','코드'],
    math:['$','$','x']
  };
  function wrap(k){
    const s=ta.selectionStart, e=ta.selectionEnd;
    const sel=ta.value.slice(s,e);
    if(MD[k]){
      const [a,z,ph]=MD[k];
      const body=sel||ph;
      ta.value=ta.value.slice(0,s)+a+body+z+ta.value.slice(e);
      ta.selectionStart=s+a.length; ta.selectionEnd=s+a.length+body.length;
    }else if(k==='alignL'||k==='alignC'||k==='alignR'){
      /* 커서가 있는 줄 맨 앞의 ::c:: ::r:: 표시를 떼어 내고, 왼쪽이 아니면 새로 붙인다.
         (왼쪽은 기본값이라 표시가 따로 필요 없다 — mdRich 가 표시 없는 줄은 왼쪽으로 그린다) */
      const a=ta.value.lastIndexOf('\n',s-1)+1;
      let b=ta.value.indexOf('\n',s); if(b<0) b=ta.value.length;
      const line=ta.value.slice(a,b);
      const stripped=line.replace(/^::[clr]::\s*/,'');
      const pre=k==='alignC'?'::c:: ':k==='alignR'?'::r:: ':'';
      const next=pre+stripped;
      ta.value=ta.value.slice(0,a)+next+ta.value.slice(b);
      ta.selectionStart=ta.selectionEnd=a+next.length;
    }else if(k==='box'){
      /* 고른 글을 [[box]] … [[/box]] 로 감싼다 — 테두리 있는 박스로 그려진다 */
      const body=sel||'여기에 박스 안 내용을 적으세요';
      const wrapped=`[[box]]\n${body}\n[[/box]]`;
      ta.value=ta.value.slice(0,s)+wrapped+ta.value.slice(e);
      const innerStart=s+8;
      ta.selectionStart=innerStart; ta.selectionEnd=innerStart+body.length;
    }else if(k==='codeblk'){
      /* 고른 글을 ``` … ``` 로 감싼다 — 어두운 코드 상자로 그려진다 */
      const body=sel||'여기에 코드 블록 내용을 적으세요';
      const wrapped=`\`\`\`\n${body}\n\`\`\``;
      ta.value=ta.value.slice(0,s)+wrapped+ta.value.slice(e);
      const innerStart=s+4;
      ta.selectionStart=innerStart; ta.selectionEnd=innerStart+body.length;
    }else{
      const line0=ta.value.lastIndexOf('\n',s-1)+1;
      const pre=k==='h'?'#### ':k==='ul'?'- ':k==='ol'?'1. ':'';
      if(k==='table'){
        const t='\n| 구분 | 값 |\n|---|---|\n|  |  |\n|  |  |\n';
        ta.value=ta.value.slice(0,s)+t+ta.value.slice(e);
        ta.selectionStart=ta.selectionEnd=s+t.length;
      }else if(pre){
        ta.value=ta.value.slice(0,line0)+pre+ta.value.slice(line0);
        ta.selectionStart=ta.selectionEnd=s+pre.length;
      }
    }
    ta.focus();
    ta.dispatchEvent(new Event('input',{bubbles:true}));
  }

  /* 오른쪽(화면) — 그 자리에서 바로 먹인다 */
  const CMD={ b:'bold', i:'italic', ul:'insertUnorderedList', ol:'insertOrderedList',
              undo:'undo', redo:'redo', alignL:'justifyLeft', alignC:'justifyCenter', alignR:'justifyRight' };
  function live(k){
    prev.focus();
    try{
      if(CMD[k]) return document.execCommand(CMD[k],false,null);
      if(k==='h') return document.execCommand('formatBlock',false,'h4');
      if(k==='code') return document.execCommand('insertHTML',false,
        '<code>'+(getSelection().toString()||'코드')+'</code>');
      if(k==='math') return document.execCommand('insertText',false,'$x$');
      if(k==='table') return document.execCommand('insertHTML',false,
        '<table><thead><tr><th>구분</th><th>값</th></tr></thead>'
        +'<tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr>'
        +'<tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br></p>');
    }catch(x){globalThis.__q?.(x)}
    prev.dispatchEvent(new Event('input',{bubbles:true}));
  }

  bar.addEventListener('mousedown',e=>{ if(e.target.closest('button')) e.preventDefault(); });
  bar.addEventListener('click',e=>{
    const b=e.target.closest('button[data-k]'); if(!b) return;
    e.preventDefault(); e.stopPropagation();
    const k=b.dataset.k;
    if(side==='prev' && prev && prev.getAttribute('contenteditable')==='true') live(k);
    else if(ta) wrap(k);
  });
}

/* ★ 예전에는 60초 뒤에 시계를 껐다. 창(.edw)은 «처음 고쳐 쓰기를 누를 때» 만들어지므로,
   1분이 지난 뒤에 열면 이 단추 줄이 아예 안 붙었다. 붙고 나서 끈다. */
const t=setInterval(()=>{ const W=$('.edw'); if(W){ build(W); clearInterval(t); } },400);
})();
