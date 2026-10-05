/* practice.html 에서 분리 (v341) — 원래 6891번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const keyBase=()=>`pracux:${$('#fSub')?.value||'0'}:${$('#fYear')?.value||'all'}:${$('#fSess')?.value||'all'}`;
  const store={
    get(){try{return JSON.parse(localStorage.getItem(keyBase())||'{}')}catch{return {}}},
    set(v){try{localStorage.setItem(keyBase(),JSON.stringify(v))}catch(__e){globalThis.__q?.(__e)}}
  };
  let state=store.get(); let toastTimer=null;
  function save(){state=store.get();store.set(state);refreshHUD()}
  function toast(t){let el=$('.study-toast');if(!el){el=document.createElement('div');el.className='study-toast';document.body.appendChild(el)}el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1300)}
  function inject(){
    const filters=$('.filters'); if(!filters||$('.studyhud')) return;
    const hud=document.createElement('div'); hud.className='studyhud'; hud.innerHTML=`
      <div class="study-main"><div class="study-kicker">STUDY MODE <span class="study-mark">자동 저장</span></div><div class="study-title" id="studyTitle">실기 기출</div><div class="study-sub" id="studySub">문항을 풀면서 진행 상황이 자동으로 기록됩니다.</div><div class="study-progress"><i id="studyBar"></i></div></div>
      <div class="study-stat"><b id="studyDone">0</b><span>푼 문제</span></div><div class="study-stat"><b id="studyFav">0</b><span>북마크</span></div><div class="study-stat"><b id="studyRemain">0</b><span>남은 문제</span></div>
      <div class="study-actions"><button id="studyContinue">▶ 이어풀기</button><button id="studyReset">초기화</button></div>`;
    filters.parentNode.insertBefore(hud,filters);
    const qbar=document.createElement('div');qbar.className='quickbar';qbar.innerHTML=`<button id="qAll">전체</button><button id="qUnseen">미학습</button><button id="qFav">★ 북마크</button><button id="qRandom">🎲 랜덤 10</button><span class="qsep"></span><button id="qHelp">단축키</button><span class="qhint"><span class="kbd">←</span><span class="kbd">→</span> 이동 · <span class="kbd">Space</span> 답안 · <span class="kbd">F</span> 검색</span>`;
    hud.after(qbar);
    const shell=document.createElement('div'); shell.className='filters-shell';
    const original=[]; while(filters.firstChild) original.push(filters.removeChild(filters.firstChild)); filters.remove();
    shell.innerHTML=`<div class="filter-top"><b>문제 찾기</b><span id="filterSummary">전체 문제</span><button class="filter-reset" id="filterReset">필터 초기화</button></div>`;
    const body=document.createElement('div');body.className='filters';original.forEach(x=>body.appendChild(x)); shell.appendChild(body);
    const inp=$('#fQ',body); if(inp){const clr=document.createElement('button');clr.className='filter-clear';clr.id='filterClear';clr.type='button';clr.textContent='×';inp.after(clr);}
    qbar.after(shell);
    bind();
  }
  function currentRow(){
    try{return Array.isArray(window.SHOWN)&&window.SHOWN[window.ONEAT]||null}catch{return null}
  }
  function markVisited(id){if(!id)return;state=store.get();state.visited=state.visited||{};state.visited[id]=Date.now();store.set(state)}
  /* ★ v287 — 북마크를 «문항 하나에 하나» 로. 예전엔 연도·회차 거르기마다 따로 적혀서
     2024 로 거른 채 찍은 북마크가 «모든 연도» 에선 안 보였다. 이제 기기끼리도 맞춘다(Supabase fav 칸). */
  function fav(id){ id=String(id); const F=window.__favAll(); const on=!(F[id]&&F[id].on); F[id]={on,at:Date.now()};
    window.__favSave(F); try{ window.__studyMark&&window.__studyMark('fav',id,F[id]) }catch(e){globalThis.__q?.(e)}
    refreshCards();refreshHUD();toast(on?'북마크 추가':'북마크 해제') }
  function isFav(id){ const F=window.__favAll(); const v=F[String(id)]; return !!(v&&v.on) }
  function injectCardTools(){
    $$('#list > .pcard').forEach(card=>{
      const id=card.dataset.id;if(!id)return;
      if(state.visited?.[id])card.classList.add('study-visited');
      if(isFav(id))card.classList.add('study-fav');
      const h=$('.phead',card); if(h&&!$('.study-favbtn',h)){
        const b=document.createElement('button');b.type='button';b.className='study-favbtn'+(isFav(id)?' on':'');b.dataset.studyFav=id;b.title='북마크';b.textContent=isFav(id)?'★':'☆';h.appendChild(b)
      }
    });
  }
  function refreshCards(){injectCardTools()}
  function refreshHUD(){
    state=store.get(); const rows=Array.isArray(window.SHOWN)?window.SHOWN:[]; const total=rows.length; const visited=Object.keys(state.visited||{}).filter(id=>rows.some(r=>String(r.id)===String(id))).length; const favs=rows.filter(r=>isFav(r.id)).length;
    const done=$('#studyDone'),fav=$('#studyFav'),rem=$('#studyRemain'),bar=$('#studyBar'),sum=$('#filterSummary'),title=$('#studyTitle'),sub=$('#studySub');
    if(done)done.textContent=visited;if(fav)fav.textContent=favs;if(rem)rem.textContent=Math.max(0,total-visited);if(bar)bar.style.width=(total?Math.round(visited/total*100):0)+'%';
    const subj=$('#fSub')?.selectedOptions?.[0]?.textContent||'실기 기출';if(title)title.textContent=subj;
    const at=window.ONEAT||0; if(sub)sub.textContent=total?`현재 ${Math.min(at+1,total)} / ${total} · ${visited?'진행률 '+Math.round(visited/total*100)+'%':'첫 문제부터 시작'}`:'문제를 불러오면 학습 진행률이 여기에 표시됩니다.';
    if(sum)sum.textContent=total?`${total}문항 · ${visited}문항 학습 완료`: '필터를 선택하세요';
    const q=$('#fQ');$('#filterClear')?.classList.toggle('on',!!q?.value); 
  }
  function bind(){
    $('#filterReset')?.addEventListener('click',()=>{['fYear','fSess'].forEach(id=>{const e=$('#'+id);if(e)e.value=''}) ;const q=$('#fQ');if(q)q.value=''; $('#fRand')?.classList.remove('on'); try{window.RAND=null}catch(__e){globalThis.__q?.(__e)}; if(typeof window.drawList==='function')window.drawList();toast('필터 초기화')});
    $('#filterClear')?.addEventListener('click',()=>{$('#fQ').value='';$('#fQ').dispatchEvent(new Event('input',{bubbles:true}));$('#fQ').focus()});
    $('#qAll')?.addEventListener('click',()=>{$('#filterReset')?.click()});
    $('#qFav')?.addEventListener('click',()=>{const rows=Array.isArray(window.SHOWN)?window.SHOWN:[];const favRows=rows.filter(r=>isFav(r.id)); if(!favRows.length)return toast('북마크한 문제가 없습니다'); const q=$('#fQ'); if(q){q.value='';} document.querySelectorAll('#list>.pcard').forEach(c=>c.hidden=!isFav(c.dataset.id)); toast(`북마크 ${favRows.length}문제 표시`);});
    $('#qUnseen')?.addEventListener('click',()=>{const rows=Array.isArray(window.SHOWN)?window.SHOWN:[];const n=rows.filter(r=>!state.visited?.[r.id]).length;if(!n)return toast('미학습 문제가 없습니다');document.querySelectorAll('#list>.pcard').forEach(c=>c.hidden=!!state.visited?.[c.dataset.id]);toast(`미학습 ${n}문제 표시`)});
    $('#qRandom')?.addEventListener('click',()=>{const e=$('#fRand');if(e){$('#fRandN').value='10';e.click();toast('랜덤 10문제') } });
    $('#qHelp')?.addEventListener('click',()=>alert('단축키\n\n← / →  이전·다음 문제\nSpace  답안 보기/가리기\nF  검색창 포커스\nR  랜덤 문제\nB  현재 문제 북마크\nCtrl + /  AI 에게 묻기 열기·닫기\nEsc  열린 화면 닫기'));
    $('#studyContinue')?.addEventListener('click',()=>{const rows=Array.isArray(window.SHOWN)?window.SHOWN:[];const i=rows.findIndex(r=>!state.visited?.[r.id]);if(i>=0&&typeof window.showAt==='function')window.showAt(i);else toast('모든 문제가 학습되었습니다')});
    $('#studyReset')?.addEventListener('click',()=>{if(!confirm('이 과목의 학습 진행률과 북마크를 초기화할까요?'))return;localStorage.removeItem(keyBase());state={};refreshCards();refreshHUD();toast('학습 기록 초기화')});
    $('#list')?.addEventListener('click',e=>{const b=e.target.closest('[data-study-fav]');if(b){e.preventDefault();e.stopPropagation();fav(b.dataset.studyFav)}});
    document.addEventListener('click',e=>{const c=e.target.closest('#list>.pcard');if(c&&!e.target.closest('button,a,input,select,textarea,details,summary')){markVisited(c.dataset.id);refreshHUD();}});
    const gk=()=>window.__gkey;
    document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(gk()?.matches('p-find',e)){$('#fQ')?.focus();e.preventDefault()}else if(gk()?.matches('p-rand',e)){$('#qRandom')?.click();e.preventDefault()}else if(gk()?.matches('p-fav',e)){const r=currentRow();if(r)fav(r.id);e.preventDefault()}else if(gk()?.matches('p-toggle',e)){const c=$('#list>.pcard.show')||$('#list>.pcard:not([hidden])');const b=c?.querySelector('[data-toggle]');if(b){b.click();e.preventDefault()}}});
    const list=$('#list'); if(list){new MutationObserver(()=>{refreshCards();refreshHUD()}).observe(list,{childList:true,subtree:true});}
    ['fSub','fYear','fSess','fQ'].forEach(id=>$('#'+id)?.addEventListener('change',()=>setTimeout(()=>{state=store.get();refreshCards();refreshHUD()},50)));
    $('#fQ')?.addEventListener('input',()=>refreshHUD());
  }
  const boot=setInterval(()=>{if($('#fSub')&&$('#list')){clearInterval(boot);inject();refreshHUD();injectCardTools()}},120);
  setTimeout(()=>clearInterval(boot),15000);
})();
