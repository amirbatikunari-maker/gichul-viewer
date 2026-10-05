/* practice.html 에서 분리 (v341) — 원래 18168번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const rowsAll=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const SB=()=>{ try{ return sb }catch(e){ return null } };
const YKEY='prac:ylabel:v1';
const labels=()=>{ try{ return JSON.parse(localStorage.getItem(YKEY)||'{}') }catch(e){ return {} } };
const putLabel=(y,n)=>{ const L=labels(); L[String(y)]=n; try{ localStorage.setItem(YKEY,JSON.stringify(L)) }catch(e){globalThis.__q?.(e)} };
const chunk=(a,n)=>{ const o=[]; for(let i=0;i<a.length;i+=n) o.push(a.slice(i,i+n)); return o };

function say(t,bad){
  const m=document.getElementById('srcMsg');
  if(m){ m.textContent=t||''; m.classList.toggle('bad',!!bad); }
}

async function updEach(list){
  let n=0;
  for(const c of chunk(list,6)){
    await Promise.all(c.map(async x=>{
      const r=await SB().from('practicals').update(x.patch).eq('id',x.id);
      if(r.error) throw new Error(r.error.message);
    }));
    n+=c.length; say(`옮기는 중… ${n}/${list.length}`);
  }
}

/* 안 쓰는 이름표 번호를 하나 준다 */
function freeYear(){
  const used=new Set([...Object.keys(labels()), ...rowsAll().map(r=>String(r.year))]);
  let y=9001; while(used.has(String(y))) y++;
  return y;
}

async function moveToLabel(k){
  const rs=rowsAll().filter(r=>String(r.source||'(출처 없음)')===k);
  if(!rs.length) return;

  const L=labels();
  const list=Object.keys(L).sort((a,b)=>+a-+b);
  const pick=prompt(
    `«${k}»\n${rs.length}문항을 어느 이름표로 옮길까요?\n\n`
    +(list.length? list.map(y=>`${y} : ${L[y]}`).join('\n')+'\n\n' : '(아직 만든 이름표가 없습니다)\n\n')
    +`· 위 번호 중 하나를 적으면 그리로 옮깁니다\n`
    +`· 새로 만들려면 «이름» 을 그대로 적으세요 (번호는 ${freeYear()} 로 자동)`,
    list[0]||'');
  if(pick===null) return;
  const t=pick.trim();
  if(!t) return;

  let Y;
  if(/^\d{3,5}$/.test(t)){
    Y=+t;
    if(!L[String(Y)] && !confirm(`${Y} 번에는 이름표가 없습니다. 그래도 옮길까요?`)) return;
  }else{
    Y=freeYear(); putLabel(Y,t);
  }
  const nm=labels()[String(Y)]||String(Y);

  const spread=[...new Set(rs.map(r=>`${r.year}-${r.session}`))].length;
  if(!confirm(`«${k}» ${rs.length}문항을\n\n   ${nm} (${Y}) · 제1회 1~${rs.length}번\n\n`
    +`으로 옮깁니다. 지금은 ${spread}개 회차에 흩어져 있습니다.\n`
    +`번호는 원래 쪽 순서대로 다시 매깁니다. 계속할까요?`)) return;

  /* 옮길 자리에 다른 문항이 있으면 그 뒤로 이어 붙인다 */
  const mine=new Set(rs.map(r=>String(r.id)));
  const there=rowsAll().filter(r=>+r.year===Y && +r.session===1 && !mine.has(String(r.id)));
  const base=there.length?Math.max(...there.map(r=>+r.no||0)):0;

  const ord=rs.slice().sort((a,b)=>
    ((a.year||0)-(b.year||0))||((a.session||0)-(b.session||0))
    ||((a.page_from||0)-(b.page_from||0))||((a.no||0)-(b.no||0)));

  $$('.srcg .a button').forEach(b=>b.disabled=true);
  try{
    say('번호를 비우는 중…');
    await updEach(ord.map((r,i)=>({ id:r.id, patch:{ year:Y, session:1, no:-(i+1) } })));
    say('번호를 매기는 중…');
    await updEach(ord.map((r,i)=>({ id:r.id, patch:{ no:base+i+1 } })));
    ord.forEach((r,i)=>{ r.year=Y; r.session=1; r.no=base+i+1; });
    say(`${rs.length}문항을 «${nm}» 으로 옮겼습니다.`);
  }catch(e){
    say('멈췄습니다 — '+((e&&e.message)||e)+' (한 것까지는 남아 있습니다)',true);
  }finally{
    $$('.srcg .a button').forEach(b=>b.disabled=false);
    try{ await loadList({ force:true }) }catch(e){ try{ drawList() }catch(e2){globalThis.__q?.(e2)} }
    try{ window.__pracSrc && document.querySelector('.srcw.on') && paintAgain() }catch(e){globalThis.__q?.(e)}
  }
}
function paintAgain(){
  /* 정리함이 스스로 다시 그리게 — 닫았다 열면 된다 */
  const w=document.querySelector('.srcw');
  if(w && w.classList.contains('on')){ w.classList.remove('on'); setTimeout(()=>window.__pracSrc&&window.__pracSrc(),60); }
}

/* ── 정리함이 그려질 때마다 단추를 끼운다 ── */
function inject(){
  const host=document.getElementById('srcList'); if(!host) return;
  $$('.srcg',host).forEach(g=>{
    const bar=g.querySelector('.a'); if(!bar || bar.querySelector('button.mv')) return;
    const k=decodeURIComponent(g.dataset.k||'');
    const b=document.createElement('button');
    b.type='button'; b.className='mv'; b.textContent='🏷 이름표로 옮기기';
    b.title='이 파일에서 온 문항 전부를 이름표 연도로 옮기고 번호를 1번부터 다시 매깁니다';
    b.onclick=()=>moveToLabel(k);
    bar.insertBefore(b, bar.firstChild);

    /* 문제집으로 보이는 묶음에는 눈에 띄게 알려 준다 */
    const rs=rowsAll().filter(r=>String(r.source||'(출처 없음)')===k);
    const rounds=new Set(rs.map(r=>`${r.year}-${r.session}`)).size;
    const real=rs.filter(r=>+r.year>=1990 && +r.year<=2100).length;
    if(rounds>=5 && real===rs.length && !g.querySelector('.hintbook')){
      const h=document.createElement('div');
      h.className='hintbook';
      h.textContent=`⚠ ${rounds}개 회차에 흩어져 있습니다 — 주제별로 엮인 자료라면 이름표로 옮기세요.`;
      bar.before(h);
    }
  });
}
const mo=new MutationObserver(()=>inject());
const t=setInterval(()=>{
  const host=document.getElementById('srcList');
  if(!host) return;
  clearInterval(t);
  mo.observe(host,{childList:true});
  inject();
},600);
setTimeout(()=>clearInterval(t),120000);

window.__pracMoveLabel=moveToLabel;
})();
