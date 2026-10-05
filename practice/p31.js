/* practice.html 에서 분리 (v341) — 원래 14535번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const rowOf=id=>rowsAll().find(r=>String(r.id)===String(id));
const log=t=>{ try{ window.__pracLog&&window.__pracLog(t) }catch(e){globalThis.__q?.(e)} };

/* ══ ① 글자로 변환 안 함 ══ */
const NKEY='prac:nocv:v1';
let NO=(()=>{ try{ return new Set(JSON.parse(localStorage.getItem(NKEY)||'[]').map(String)) }
              catch(e){ return new Set() } })();
const nsave=()=>{ try{ localStorage.setItem(NKEY,JSON.stringify([...NO])) }catch(e){globalThis.__q?.(e)} };
const isNo=id=>NO.has(String(id));
window.__pracNoCv=isNo;
/* ★ v191 — «✨ 이 문제 꾸미기» 가 이 문항 하나만 잠깐 걸림을 풀고 돌릴 수 있게 내준다.
   (사람이 직접 그 문항을 열어 놓고 누른 것이므로 그 한 번은 뜻이 분명하다.
    끝나면 도로 걸어 두므로 «변환 안 함» 목록은 그대로 남는다) */
window.__cvNO=NO;
window.__cvNOAdd=k=>{ NO.add(String(k)); nsave(); };
window.__cvNODel=k=>{ NO.delete(String(k)); nsave(); };
function toggleNo(id){
  const k=String(id);
  NO.has(k)?NO.delete(k):NO.add(k);
  nsave(); stamp();
  log(`${NO.has(k)?'글자 변환에서 뺐습니다':'글자 변환에 다시 넣었습니다'} — ${nameOf(id)}`);
}
function nameOf(id){ const r=rowOf(id); return r?`${r.year}년 제${r.session}회 ${r.no}번`:'#'+id }

/* 한꺼번에 돌릴 때 «정말로» 건너뛴다 — 변환 함수 앞에서 막는다 */
const hook=setInterval(()=>{
  if(typeof window.cvRow!=='function'||window.cvRow.__nocv) return;
  const o=window.cvRow;
  const g=async function(r){
    if(r&&isNo(r.id)){ log(`변환 건너뜀 — ${nameOf(r.id)} (변환 안 함으로 걸어 두셨습니다)`); return false; }
    return o.apply(this,arguments);
  };
  g.__nocv=1; g.__fail=o.__fail; window.cvRow=g; clearInterval(hook);
},400);
setTimeout(()=>clearInterval(hook),25000);

/* 문항 머리에 단추를 박는다 */
function stamp(){
  $$('#list > .pcard').forEach(card=>{
    const head=card.querySelector('.phead'); if(!head) return;
    const id=card.dataset.id;
    let b=head.querySelector('.nocvb');
    if(!b){
      b=document.createElement('button');
      b.type='button'; b.className='nocvb';
      b.title='한꺼번에 변환할 때 이 문항은 건너뜁니다 (그림 그대로 둡니다)';
      b.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); toggleNo(id); });
      const cv=head.querySelector('.cvbadge');
      cv?head.insertBefore(b,cv):head.appendChild(b);
    }
    const on=isNo(id);
    b.textContent=on?'⊘ 변환 안 함':'⊘ 변환';
    b.classList.toggle('on',on);
    card.classList.toggle('nocv',on);
  });
}
const w1=setInterval(()=>{ const l=$('#list'); if(!l) return; clearInterval(w1);
  new MutationObserver(()=>setTimeout(stamp,50)).observe(l,{childList:true}); stamp(); },300);
setTimeout(()=>clearInterval(w1),20000);

/* ══ ② 크기·자른 자리 — 이 기기에도 함께 남긴다 ══
   글(마크다운)에 적는 것이 본디 방식이고, 여기 적는 것은 «못 올라갔을 때» 를 위한 보험이다. */
const LKEY='prac:imgfix:v1';
let LOC=(()=>{ try{ return JSON.parse(localStorage.getItem(LKEY)||'{}') }catch(e){ return {} } })();
const lsave=()=>{ try{ localStorage.setItem(LKEY,JSON.stringify(LOC)) }catch(e){globalThis.__q?.(e)} };
function keyOf(im){
  const f=im.closest('figure[data-fig]');
  return f ? 'fig:'+(f.dataset.fig||'') : 'img:'+(im.getAttribute('src')||'');
}
function remember(im){
  const id=(im.closest('.pcard')?.dataset.id) || (typeof OVID!=='undefined'?OVID:null);
  if(!id) return;
  const k=keyOf(im); if(!k||k==='img:') return;
  const w=(im.style.width||'').trim(), c=im.dataset.crop||'';
  const bag=(LOC[String(id)] ||= {});
  if(!w&&!c) delete bag[k]; else bag[k]={ w, c };
  lsave();
}
function restore(root){
  $$('img.mdimg, figure[data-fig] img', root||document).forEach(im=>{
    const id=(im.closest('.pcard')?.dataset.id) || (typeof OVID!=='undefined'?OVID:null);
    if(!id) return;
    const v=(LOC[String(id)]||{})[keyOf(im)]; if(!v) return;
    if(v.w && !im.style.width) im.style.width=v.w;
    if(v.c && !im.dataset.crop){ im.dataset.crop=v.c; }
  });
}
/* 크기·자르기를 만질 때마다 기억해 둔다 (막대가 닫힐 때 한 번) */
document.addEventListener('click',e=>{
  if(!e.target.closest('.imsz,[data-crop-btn],.cropbar')) return;
  setTimeout(()=>{ $$('img.mdimg, figure[data-fig] img').forEach(remember) },400);
},true);
setInterval(()=>{ try{ restore() }catch(e){globalThis.__q?.(e)} },2500);
setTimeout(()=>{ try{ restore() }catch(e){globalThis.__q?.(e)} },1500);

/* ══ ④ v191 — «⚡ 글자 변환» · «✎ 쉬운 해설» 두 단추를 뺀다 ══

   왜 뺐나 ──
     한 문항을 손보려면 «⚡ 로 그림을 글자로» 누르고, 다 될 때까지 기다렸다가
     다시 «✎ 로 해설을» 눌러야 했다. 두 번 누르는 걸 잊거나 순서를 거꾸로 하면
     옛 글자 위에 새 해설이 얹혀, 회차마다 짜임새가 제각각이 되는 원인이 됐다.
     이제 머리줄의 «✨ 이 문제 꾸미기» 하나가 ⚡ 다음에 ✎ 를 알아서 이어서 돈다.
     (이 자리를 비워 두면 맞음·틀림·북마크 같은 진짜 «표시» 단추들만 남아
      줄이 짧아지고 눈에 잘 들어온다)

   지우지 않고 남겨 둔 것 ── window.cvRow · window.ezMake 는 그대로다.
   목록 쪽 일괄 작업과 «✨ 이 문제 꾸미기» 가 똑같이 그 둘을 부른다. */
function addOvBtns(){
  /* 예전 판에서 이미 붙어 버린 단추가 있으면 걷어낸다 (브라우저에 남은 화면 대비) */
  const box=$('#ovl .ovacts'); if(!box) return;
  $$('[data-ova="cv"],[data-ova="ez"]',box).forEach(b=>b.remove());
}
const w2=setInterval(()=>{ if($('#ovl .ovacts')){ addOvBtns(); clearInterval(w2); } },500);
setTimeout(()=>clearInterval(w2),25000);
})();
