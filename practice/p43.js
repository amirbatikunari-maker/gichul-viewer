/* practice.html 에서 분리 (v341) — 원래 17639번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };

const KEY='prac:ylabel:v1';
let L=(()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){ return {} } })();
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(L)) }catch(e){globalThis.__q?.(e)} };
/* ★ v233 — 가짜 연도에 «자동으로» 한글 이름을 붙인다.
   여태는 사람이 이름표 창에서 하나하나 적어 넣어야 이름이 보였다.
   그런데 규칙은 이미 정해져 있다(9301 오고초려 · 94NN 단답 · 95NN 소방).
   손으로 적을 이유가 없어서 규칙을 코드에 넣는다.
   이름표 창에서 적은 것이 있으면 그것이 언제나 이긴다. */
const AUTO=y=>{
  y=+y;
  if(!(y>3000)) return '';                                  /* 진짜 연도는 그대로 */
  if(y===9301) return '오고초려';
  if(y===9302) return '핵심빈출';
  if(y>=9400&&y<9500) return `단답 20${String(y).slice(2)}`;
  if(y>=9500&&y<9600) return `소방 20${String(y).slice(2)}`;
  if(y>=9000&&y<9300) return `회차미상 ${y-9000}`;
  return '';
};
const nameOf=y=>L[String(y)] || AUTO(y);
/* ★ v230 — 레일 단추는 자리가 좁다. 이름을 자르지 않고 «짧은 판» 을 따로 둔다.
   («단답 2025» 를 네 글자로 자르면 «단답 2» 가 되어 뜻이 사라진다) */
const SHORT=y=>{
  const hand=L[String(y)];                        /* 사람이 적은 것이 언제나 이긴다 */
  if(hand) return hand.length>5?hand.slice(0,5):hand;
  y=+y;
  if(!(y>3000)) return '';
  if(y===9301) return '오고초려';
  if(y===9302) return '핵심빈출';
  if(y>=9400&&y<9500) return `단답${String(y).slice(2)}`;
  if(y>=9500&&y<9600) return `소방${String(y).slice(2)}`;
  if(y>=9000&&y<9300) return `미상${y-9000}`;
  return '';
};
/* ★ v234 — «회» 가 안 어울리는 자료가 있다.
   오고초려·핵심빈출은 시험 회차가 아니라 20문항씩 끊어 놓은 «묶음» 이다.
   단답·소방은 진짜 회차라 «회» 가 맞다. 자료마다 단위를 갈라 준다. */
const UNIT=y=>{ y=+y; return (y===9301||y===9302) ? '묶음' : '회'; };
const sessLabel=(y,s)=>{ const u=UNIT(y); return u==='회' ? `제${s}회` : `${s}묶음`; };
window.__pracSessLabel=sessLabel;
window.__pracYLabel=()=>L;
window.__pracYAuto=AUTO;

/* ══ ① 보이는 곳에서 바꿔 끼운다 ══
   표에 든 값(9001)은 그대로 두고 글자만 갈아 끼운다. */
function relabel(){

  /* 연도 거르개 */
  /* ★★ 여기가 «연도를 고르면 문제가 하나도 안 나오던» 자리다.
     연도 칸은 <option>9001</option> 처럼 value 없이 만들어진다. value 를 안 적으면
     브라우저가 «보이는 글자» 를 값으로 쓴다. 그래서 글자만 «단답 (9001)» 로 바꿔 놓으면
     값까지 «단답 (9001)» 이 되어, 9001 과 견주는 거르개가 한 개도 못 찾았다.
     글자를 바꾸기 «전에» 값을 숫자로 못 박아 둔다. */
  $$('#fYear option').forEach(o=>{
    const y=(o.getAttribute('value')!==null ? o.value : o.textContent.trim()).match(/\d{3,5}/)?.[0]
          || o.value;
    if(!y) return;
    if(o.getAttribute('value')===null || o.value!==y) o.setAttribute('value',y);
    const n=nameOf(y);
    const want = n ? `${n} (${y})` : y;
    if(o.textContent!==want) o.textContent=want;
  });

  /* 문항 카드 머리 · 위치줄 · 레일 */
  const swap=el=>{
    const t=el.textContent;
    if(!/\d{4}년\s*제\d+회/.test(t)) return;
    const out=t.replace(/(\d{4})년\s*제(\d+)회/g,(m,y,s)=>{
      const n=nameOf(y); return n ? `${n} · ${sessLabel(y,s)}` : m;
    });
    if(out!==t) el.textContent=out;
  };
  $$('#list .pmeta').forEach(swap);
  $$('#ovl .pmeta, .ovhead .pmeta').forEach(swap);
  const at=$('#pnavAt'); if(at) swap(at);
  const ot=$('#ovTitle'); if(ot) swap(ot);

  /* 회차 거르개 — 고른 연도에 맞는 단위로 */
  const yv=$('#fYear')?.value||'';
  if(yv){
    $$('#fSess option').forEach(o=>{
      const v=o.getAttribute('value'); if(!v) return;
      const want=sessLabel(yv,v);
      if(o.textContent!==want) o.textContent=want;
    });
  }else{
    $$('#fSess option').forEach(o=>{
      const v=o.getAttribute('value'); if(!v) return;
      if(o.textContent!==`제${v}회`) o.textContent=`제${v}회`;
    });
  }

  /* 레일 단추 — «25-3 8» 처럼 두 자리로 줄여 놓았다.

     ★★ v230 — 여기가 «2025년 1회인데 레일에 단답 2 1-9 라고 뜨던» 자리다.
     예전에는 화면 글자 «25-1 9» 에서 앞 두 자리(25)만 떼어 내
     연도를 거꾸로 찾아냈다. 그런데 두 자리로 줄이면 짝이 겹친다.

         2025 % 100 = 25        9425(단답 2025) % 100 = 25
         2023 % 100 = 23        9523(소방 2023) % 100 = 23
         2001 % 100 =  1        9301(오고초려)  % 100 =  1

     먼저 걸리는 쪽이 이기는데, 문항이 연도 내림차순이라 «가짜 연도» 가
     언제나 앞에 선다. 그래서 진짜 기출 레일에 문제집 이름이 덮어씌워졌다.
     게다가 이름을 네 글자로 자르는 바람에 «단답 2025» 가 «단답 2» 가 됐다.

     이제 되짚지 않는다. 레일을 만들 때 단추에 진짜 연도를 달아 두고(data-y)
     그것만 읽는다. 진짜 기출이면 이름이 없으므로 손대지 않는다.        */
  $$('#prail .pb, .ovrail .pb, .pjb').forEach(b=>{
    const y=b.dataset.y; if(!y) return;
    const t=b.textContent.trim();
    const m=t.match(/^(\S+)-(\d+)\s+(\d+)$/); if(!m) return;
    const n=SHORT(y); if(!n) return;              /* 진짜 연도는 이름이 없다 */
    const want=`${n}-${m[2]} ${m[3]}`;
    if(t!==want) b.textContent=want;
  });
}
/* 목록을 다시 그릴 때마다 한 번 더 훑는다 */
(function hook(){
  const orig=window.drawList;
  if(typeof orig!=='function' || orig.__yl) return;
  const w=function(){
    const out=orig.apply(this,arguments);
    setTimeout(relabel,0);
    return out;
  };
  w.__yl=1; ['__tag','__dup','__todo','__src','__fb','__probe'].forEach(k=>{ w[k]=orig[k] });
  window.drawList=w;
})();
setInterval(relabel,1200);           /* 레일·거르개는 다른 곳에서도 다시 그린다 */

/* ══ ② 이름표 창 ══ */
let W=null;
function open_(){
  if(!W){
    W=document.createElement('div'); W.className='ylw';
    W.innerHTML=`<div class="ylbox">
      <div class="h"><b>자료 이름표</b><span class="sp"></span>
        <button type="button" data-x="close">닫기</button></div>
      <div class="note">연도 칸은 숫자만 받습니다. 문제집·정리본은 <b>9001 · 9002</b> 같은 없는 연도를 넣어
        서로 안 겹치게 해 두고, 여기서 그 숫자에 이름을 붙이면 화면에는 이름으로 보입니다.
        표에 든 값은 그대로라 언제든 이름만 바꾸거나 지울 수 있습니다.</div>
      <div class="yllist" id="ylList"></div>
      <div class="ylf">빈칸으로 두면 이름표가 떨어지고 다시 숫자로 보입니다.</div></div>`;
    document.body.appendChild(W);
    W.addEventListener('click',e=>{
      if(e.target===W || e.target.closest('button[data-x="close"]')) W.classList.remove('on');
    });
    addEventListener('keydown',e=>{ if(e.key==='Escape'&&W.classList.contains('on')) W.classList.remove('on') });
  }
  paint(); W.classList.add('on');
}
function paint(){
  const box=$('#ylList',W); if(!box) return;
  const cnt=new Map();
  rowsAll().forEach(r=>cnt.set(String(r.year),(cnt.get(String(r.year))||0)+1));
  const ys=[...new Set([...cnt.keys(), ...Object.keys(L)])].sort((a,b)=>+b-+a);
  if(!ys.length){ box.innerHTML='<div class="note">아직 올린 문항이 없습니다.</div>'; return; }
  box.innerHTML=ys.map(y=>`<div class="ylr" data-y="${y}">
      <span class="y">${y}</span>
      <span class="n">${cnt.get(y)||0}문항</span>
      <input type="text" maxlength="14" value="${(L[y]||'').replace(/"/g,'&quot;')}"
        placeholder="${+y>2100?(AUTO(y)||'예: 단답 콜렉터'):'(진짜 연도 — 비워 두세요)'}">
    </div>`).join('');
  $$('.ylr input',box).forEach(inp=>{
    const y=inp.closest('.ylr').dataset.y;
    inp.addEventListener('change',()=>{
      const v=inp.value.trim();
      if(v) L[y]=v; else delete L[y];
      save(); relabel();
      try{ drawList() }catch(e){globalThis.__q?.(e)}
    });
  });
}

/* ══ ③ 올리는 화면에도 — 이름표를 고르면 연도 칸이 저절로 채워진다 ══ */
function mountImp(){
  const yi=document.getElementById('impYear');
  if(!yi || document.getElementById('impYl')) return;
  const wrap=document.createElement('div');
  wrap.className='impyl'; wrap.id='impYl';
  wrap.innerHTML='<b>이름표</b>';
  const mk=(txt,fn)=>{ const b=document.createElement('button'); b.type='button';
    b.textContent=txt; b.onclick=fn; return b };
  /* 이름표를 고르면 회차 칸도 같이 채워 둔다 — 비어 있으면 «한 덩어리로» 가 안 걸린다 */
  const fillSess=()=>{ const se=document.getElementById('impSess');
    if(se && !se.value.trim()) se.value='1'; };
  /* 이미 붙여 둔 이름표는 그대로 고를 수 있게 */
  const rebuild=()=>{
    $$('button',wrap).forEach(b=>b.remove());
    Object.keys(L).sort((a,b)=>+a-+b).forEach(y=>{
      wrap.appendChild(mk(`${L[y]} (${y})`,()=>{ yi.value=y; fillSess(); yi.dispatchEvent(new Event('input',{bubbles:true})); }));
    });
    wrap.appendChild(mk('＋ 새 이름표',()=>{
      const n=prompt('이 자료를 뭐라고 부를까요? (예: 단답 콜렉터)');
      if(n===null||!n.trim()) return;
      /* 9001 부터 안 쓰는 번호를 하나 준다 */
      let y=9001; const used=new Set([...Object.keys(L), ...rowsAll().map(r=>String(r.year))]);
      while(used.has(String(y))) y++;
      L[String(y)]=n.trim(); save();
      yi.value=String(y); fillSess(); yi.dispatchEvent(new Event('input',{bubbles:true}));
      rebuild(); relabel();
    }));
    wrap.appendChild(mk('이름표 관리',open_));
  };
  rebuild();
  yi.closest('div')?.appendChild(wrap);
}

/* ══ ④ 도구 차림표에 단추 ══ */
function mount(){
  const host=document.getElementById('ezRedoAll')?.parentElement;
  if(host && !document.getElementById('ylOpen')){
    const b=document.createElement('button');
    b.className='chip'; b.type='button'; b.id='ylOpen'; b.textContent='🏷 자료 이름표';
    b.title='9001 같은 숫자 연도에 «단답» 같은 이름을 붙입니다';
    b.onclick=open_;
    host.append(b);
  }
  mountImp();
  return !!document.getElementById('ylOpen');
}
const mt=setInterval(mount,700);
setTimeout(()=>clearInterval(mt),60000);
mount();
setTimeout(relabel,600);

window.__pracYl=open_;
})();
