/* practice.html 에서 분리 (v341) — 원래 7006번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const key='prac:v6:'+location.pathname;
  const get=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return{}}};
  const set=s=>{try{localStorage.setItem(key,JSON.stringify(s))}catch(__e){globalThis.__q?.(__e)}};
  const toast=t=>{const f=window.__studyToast||((m)=>{}); try{f(t)}catch(__e){globalThis.__q?.(__e)}};
  let S=get(), exam=false;

  function rows(){try{return Array.isArray(window.SHOWN)?window.SHOWN:[]}catch{return[]}}
  function current(){const rs=rows(); try{return rs[window.ONEAT]||null}catch{return null}}
  function mark(id,val){if(!id)return;S.results=S.results||{};S.results[id]=val;S.updated=Date.now();set(S)}
  /* ★ v288 — 맞음·틀림은 진도 기록(같은 문제 연동 · 기기 동기화) 하나만 본다. 예전 세션 기록(S.results)은 안 읽음 */
  const RES=id=>{ try{ const p=(window.__pracProg&&window.__pracProg())[String(id)]; return p&&p.r||'' }catch(e){ return '' } };
  function rebuild(){
    const rs=rows(), done=rs.filter(r=>RES(r.id)).length, ok=rs.filter(r=>RES(r.id)==='ok').length, no=rs.filter(r=>RES(r.id)==='no').length;
    const chip=$('#sessMeta'); if(chip) chip.textContent=`세션 ${done}/${rs.length} · 정답 ${ok} · 오답 ${no}`;
    $$('.pcard').forEach(c=>{const id=c.dataset.id, v=RES(id); c.dataset.result=v||''; c.classList.toggle('result-ok',v==='ok'); c.classList.toggle('result-no',v==='no')});
  }
  function inject(){
    if($('.sessionbar')||!$('.filters')) return;
    const bar=document.createElement('div');bar.className='sessionbar';
    bar.innerHTML=`<span class="session-title">학습 세션</span>
      <button id="sessionStart">시험 10</button><button id="reviewWrong">오답만</button><button id="reviewMarked">북마크+오답</button>
      <button id="sessionClear">세션 초기화</button><span class="session-meta" id="sessMeta">세션 0/0 · 정답 0 · 오답 0</span>`;
    $('.filters').parentNode.insertBefore(bar,$('.filters'));
    bar.addEventListener('click',e=>{
      const id=e.target.id;
      if(id==='sessionStart') openExam();
      if(id==='reviewWrong') review('no');
      if(id==='reviewMarked') review('favno');
      if(id==='sessionClear'){S.results={};set(S);rebuild();toast('이번 세션 기록을 초기화했습니다')}
    });
    const modal=document.createElement('div');
    modal.innerHTML=`<div class="examveil" id="examVeil"></div><div class="exammodal" id="examModal">
      <h3>시험 모드</h3><p>답안·해설을 숨기고 문제만 풀게 합니다. 문제마다 직접 정답/오답을 기록할 수 있습니다.</p>
      <div class="examgrid"><button data-n="10" class="primary">10문제</button><button data-n="20">20문제</button><button data-n="30">30문제</button></div>
      <button class="exam-close" id="examClose">취소</button>
    </div>`;
    document.body.appendChild(modal);
    $('#examVeil').onclick=closeExam;$('#examClose').onclick=closeExam;
    $('#examModal').addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return; startExam(+b.dataset.n);});
  }
  function openExam(){ $('#examVeil').style.display='block';$('#examModal').style.display='block' }
  function closeExam(){ $('#examVeil').style.display='none';$('#examModal').style.display='none' }
  function startExam(n){
    closeExam(); exam=true; document.body.classList.add('exam-mode');
    const rs=rows().slice().sort(()=>Math.random()-.5).slice(0,n);
    // Keep the canonical list visible; hide non-selected cards in all-list mode.
    $$('#list>.pcard').forEach(c=>c.hidden=!rs.some(r=>String(r.id)===String(c.dataset.id)));
    const first=rs[0], all=rows(); const idx=all.findIndex(r=>String(r.id)===String(first?.id));
    if(idx>=0 && typeof window.showAt==='function' && document.body.classList.contains('oneup')) window.showAt(idx);
    toast(`${rs.length}문제 시험 시작`);
  }
  function review(mode){
    const rs=rows().filter(r=>{
      if(mode==='no') return RES(r.id)==='no';
      return RES(r.id)==='no' && window.__isFav?.(r.id);
    });
    if(!rs.length){toast('복습할 문제가 없습니다');return}
    $$('#list>.pcard').forEach(c=>c.hidden=!rs.some(r=>String(r.id)===String(c.dataset.id)));
    toast(`${rs.length}문제 복습`);
  }
  function addResultButtons(){
    $$('.pcard').forEach(card=>{
      if($('.result-actions',card))return;
      const p=card.querySelector('.phead'); if(!p)return;
      const a=document.createElement('span');a.className='result-actions';
      a.style.cssText='display:flex;gap:4px;margin-left:auto';
      a.innerHTML=`<button type="button" data-result="ok" style="border:1px solid var(--line);border-radius:7px;background:var(--surface-2);padding:5px 7px;font:700 10px/1 var(--font-d);cursor:pointer">✓</button>
                   <button type="button" data-result="no" style="border:1px solid var(--line);border-radius:7px;background:var(--surface-2);padding:5px 7px;font:700 10px/1 var(--font-d);cursor:pointer">✕</button>`;
      p.appendChild(a);
      a.addEventListener('click',e=>{const b=e.target.closest('[data-result]');if(!b)return; mark(card.dataset.id,b.dataset.result); rebuild(); toast(b.dataset.result==='ok'?'정답 기록':'오답 기록')});
    });
  }
  function escClose(){
    if($('#examModal')?.style.display==='block'){closeExam();return true}
    if(document.activeElement?.tagName==='INPUT'){document.activeElement.blur();return true}
    if(exam){exam=false;document.body.classList.remove('exam-mode');$$('#list>.pcard').forEach(c=>c.hidden=false);toast('시험 모드 종료');return true}
    return false;
  }
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && escClose()){e.preventDefault();return}
    if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(e.key==='1' && current() && window.__gkey?.matches('p-ok',e)){mark(current().id,'ok');rebuild();toast('정답 기록')}
    if(e.key==='2' && current() && window.__gkey?.matches('p-no',e)){mark(current().id,'no');rebuild();toast('오답 기록')}
  });
  // Existing favorite state is stored by the prior UX layer. Expose it safely.
  window.__isFav=(id)=>{ try{ const v=window.__favAll()[String(id)]; return !!(v&&v.on) }catch{ return false } };
  const boot=setInterval(()=>{if($('#list')&&$('.filters')){clearInterval(boot);inject();addResultButtons();rebuild();
    new MutationObserver(()=>{addResultButtons();rebuild()}).observe($('#list'),{childList:true,subtree:true});
  }},180);
  setTimeout(()=>clearInterval(boot),15000);
})();
