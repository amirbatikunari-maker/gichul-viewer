/* practice.html 에서 분리 (v341) — 원래 17907번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const on=()=>!!document.getElementById('impOne')?.checked;
/* ★ 회차 칸이 비어 있어서 «한 덩어리로» 가 조용히 안 걸리던 자리.
   한 덩어리로 넣을 때는 회차가 무슨 값이든 상관이 없다 — 비었으면 1회로 본다.
   (원래의 manualRound 는 둘 다 있어야만 값을 내준다) */
const man=()=>{
  const y=parseInt($('#impYear')?.value,10);
  let s=parseInt($('#impSess')?.value,10);
  if(!y) return null;
  if(!s){ s=1; const el=$('#impSess'); if(el && !el.value) el.value='1'; }
  return {year:y,session:s};
};

/* ══ ① 훑고 난 결과를 한 덩어리로 다시 매긴다 ══
   scanDoc 안을 건드리지 않는다 — 나온 것을 받아 고쳐 준다.
   순서는 «쪽 → 쪽 안에서 위에서 아래로» 로 세운다. */
const wait=setInterval(()=>{
  if(typeof window.scanDoc!=='function' || window.scanDoc.__one) return;
  clearInterval(wait);
  const orig=window.scanDoc;
  const w=async function(doc,name,MODE){
    let out=await orig.apply(this,arguments);
    if(!Array.isArray(out) || !out.length) return out;
    const useX  = !!document.getElementById('impMerge')?.checked;
    const useAns= !!document.getElementById('impArrow')?.checked;
    if(useX||useAns){
      try{ out=await refine(doc,out,{useX,useAns,MODE}) }
      catch(e){ try{ log('   ⚠ 다듬다가 멈췄습니다 — '+((e&&e.message)||e)) }catch(x){globalThis.__q?.(x)} }
    }
    if(!on()) return out;
    const M=man();
    if(!M){
      try{ log('   ⚠ «한 덩어리로» 를 켰지만 연도·회차 칸이 비어 있어 그대로 둡니다.') }catch(e){globalThis.__q?.(e)}
      return out;
    }
    const ord=out.slice().sort((a,b)=>
      ((a.start?.page||0)-(b.start?.page||0)) || ((a.start?.top||0)-(b.start?.top||0)));
    ord.forEach((it,i)=>{ it.year=M.year; it.session=M.session; it.no=i+1; });
    try{
      log(`   한 덩어리로 — ${M.year}년 제${M.session}회 1~${ord.length}번으로 이어 매겼습니다`
        + ` (PDF 안의 회차는 무시했습니다. 위의 «겹침» 알림도 무시하셔도 됩니다)`);
    }catch(e){globalThis.__q?.(e)}
    return ord;
  };
  w.__one=1;
  try{ window.scanDoc=w }catch(e){globalThis.__q?.(e)}
},300);
setTimeout(()=>clearInterval(wait),30000);

/* ══ ①-2 «1. 2. 3.» 을 문제로 쪼개지 않기 ══
   단답본의 한 문제 안에는 «1. 현장조건에 부합 여부 / 2. 시공의 (①) 여부» 처럼
   번호 붙은 보기 항목이 들어 있다. 머리글 모양이 «1. · 01.» 이라 이것들까지
   문제 머리글로 잡혀, 한 문제가 서너 개로 쪼개진다(552 → 902).

   가르는 잣대는 «번호가 앞으로 안 갔다» 이다.
     45번 다음에 1번 · 2번 · 3번이 «같은 쪽에서» 나오면 그건 새 문제가 아니라
     45번의 보기다. 새 문제라면 번호가 늘어난다.
   장이 바뀌며 번호가 1로 돌아가는 자리는 대개 새 쪽에서 시작하므로 살아남는다.
   혹시 몰라 연달아 12개까지만 붙인다. */
const byDoc=(a,b)=>((a.start?.page||0)-(b.start?.page||0))||((a.start?.top||0)-(b.start?.top||0));

/* ══ ①-2 들여쓰기로 «보기 항목» 을 가려내고, «▶» 를 답안 표시로 쓴다 ══

   실제 PDF(단답 25~01년)를 좌표까지 뜯어보면 이렇게 생겼다.
     x=42.5  «6. 한국전기설비규정에 의거하여 …»   ← 진짜 문제 (왼쪽 마진)
     x=60.6  «1. 고압 가공전선이 …»               ← 그 문제 안의 보기 (들여쓰기)
     x=42.5  «▶ ① 0.8 ② 0.4 ③ 0.6»              ← 답

   그러니 가릴 잣대는 «번호» 가 아니라 «들여쓰기» 다. 552개 중 왼쪽 마진에 붙은 것이
   516개, 들여쓴 것이 36개였다 — 번호로 어림잡아 102개를 붙이던 것보다 훨씬 정확하다.
   그리고 이 책에는 «답안작성» 이라는 말이 없다. 답은 언제나 «▶» 로 시작한다.
   그 줄을 찾아 그 앞을 문제, 뒤를 답으로 자른다.

   그림에서 글자 자리를 다시 읽어야 하므로 쪽마다 한 번 더 훑는다(쪽당 한 번만, 담아 둔다). */
async function pageLines(doc, p, cache){
  if(cache.has(p)) return cache.get(p);
  const page=await doc.getPage(p);
  const vp=page.getViewport({scale:1});
  const tc=await page.getTextContent();
  /* ★ v153 — 한 줄을 이을 때 «x 순서» 로 정렬한다.
     PDF.js 가 돌려주는 차례는 읽는 차례가 아니다. «▶» 처럼 본문과 폰트가 다른
     글자는 줄 한복판이나 끝에 붙어 버려, 줄 맨 앞을 보는 «▶» 판정이 통째로 빗나갔다.
     그 결과 ansAt 이 안 잡혀 문제 그림에 답까지 딸려 들어갔다. */
  const keys=[], map=new Map(), xs=new Map();
  for(const it of tc.items){
    if(!it.str.trim()) continue;
    const pt=vp.convertToViewportPoint(it.transform[4], it.transform[5]);
    const y=pt[1], x=pt[0];
    let k=keys.find(v=>Math.abs(v-y)<4);
    if(k===undefined){ keys.push(y); k=y; }
    (map.get(k) || map.set(k,[]).get(k)).push({x, s:it.str});
    xs.set(k, Math.min(xs.has(k)?xs.get(k):1e9, x));
  }
  const arr=[...map.entries()].map(([y,parts])=>({
                y, x:xs.get(y),
                txt: parts.sort((a,b)=>a.x-b.x).map(p=>p.s).join('').trim()
              }))
              .sort((a,b)=>a.y-b.y);
  cache.set(p,arr);
  return arr;
}
/* v153 — 책마다 화살표 글리프가 다르다. 눈에는 다 같은 «▶» 로 보인다. */
const ARROW=/^\s*[▶►▷▸‣➤➢➣➔➜⇒⟹]/;

function mergeInto(prev,it){
  prev.end = it.end || prev.end;
  prev.lastPage = it.lastPage || prev.lastPage;
  prev.text = (prev.text||'') + '\n' + (it.text||'');
  if(!prev.ansAt && it.ansAt) prev.ansAt = it.ansAt;
}

async function refine(doc, list, opt){
  const ord=list.slice().sort(byDoc);
  const cache=new Map();

  /* ① 문항마다 «그 줄이 얼마나 들여써졌나» 를 잰다 */
  if(opt.useX){
    for(const it of ord){
      it.__x=0;
      try{
        const L=await pageLines(doc, it.start.page, cache);
        const y=(it.start.top||0)+8;
        const hit=L.find(l=>Math.abs(l.y-y)<7) || L.find(l=>l.y>=y-3);
        if(hit) it.__x=hit.x;
      }catch(e){globalThis.__q?.(e)}
    }
    /* ★ 마진은 «구간마다» 따로 잰다.
         한 권을 통째로 넣으면 덩어리마다 판형이 다르다.
           기출     «문제 01»       x≈24
           핵심빈출 «핵심 빈출 2 ►»  x≈40
           단답     «1.»            x≈52
         예전에는 문서 전체에서 마진 하나(=24pt)만 재서 단답·핵심빈출 머리글이
         전부 «들여쓴 보기 항목» 으로 잡혔다. 705개가 앞 문제에 먹혀 1763 → 1058 이 됐다.
         구간이 다르면 자를 따로 대야 한다. */
    const 무리=new Map();
    ord.forEach(i => {
      const k = i.sect || "_";
      if(!무리.has(k)) 무리.set(k, []);
      무리.get(k).push(i);
    });
    const keep=[]; let merged=0; const 자=[];
    for(const [k, grp] of 무리){
      const xs=grp.map(i=>i.__x).filter(v=>v>0).sort((a,b)=>a-b);
      const margin = xs.length>=10 ? xs[Math.floor(xs.length*0.1)] : null;
      let cut=0; const 남길=[];
      for(const it of grp){
        const prev=남길[남길.length-1];
        if(margin!==null && prev && it.__x>0 && it.__x > margin+6){ mergeInto(prev,it); cut++; continue; }
        남길.push(it);
      }
      /* 한 무리에서 절반 가까이 붙으면 잘못 잰 것이다 — 그 무리는 되돌린다 */
      if(cut && cut >= grp.length*0.45){
        try{ log(`   ⚠ «${k}» 는 들여쓰기로 ${cut}개나 걸려 그대로 두었습니다`) }catch(e){globalThis.__q?.(e)}
        keep.push(...grp); continue;
      }
      if(margin!==null) 자.push(`${k} ${margin.toFixed(0)}pt→${cut}개`);
      merged+=cut; keep.push(...남길);
    }
    if(merged){
      try{ log(`   들여쓴 «보기 항목» ${merged}개를 앞 문제에 붙였습니다 (${ord.length} → ${keep.length}문항)`) }catch(e){globalThis.__q?.(e)}
      try{ log(`   구간별 마진: ${자.join(" · ")}`) }catch(e){globalThis.__q?.(e)}
    }
    /* 구간별로 갈라 담았으니 문서 순서로 다시 세운다.
       구간이 책 안에서 섞여 나오는 PDF 라면 이걸 안 하면 문항 차례가 뒤엉킨다. */
    keep.sort(byDoc);
    ord.length=0; ord.push(...keep);
  }

  /* ② «▶» 를 답안 표시로 삼는다 */
  if(opt.useAns && opt.MODE==='qa'){
    let got=0;
    for(const it of ord){
      if(it.ansAt) continue;
      const p0=it.start.page, p1=(it.end&&it.end.page)||it.lastPage||p0;
      let hit=null;
      for(let p=p0; p<=p1 && !hit; p++){
        let L; try{ L=await pageLines(doc,p,cache) }catch(e){ break }
        for(const l of L){
          if(p===p0 && l.y <= (it.start.top||0)+12) continue;
          if(it.end && p===it.end.page && it.end.top!=null && l.y >= it.end.top) break;
          if(ARROW.test(l.txt)){ hit={ page:p, top:Math.max(0,l.y-8) }; break; }
        }
      }
      if(hit){ it.ansAt=hit; got++; }
    }
    if(got){ try{ log(`   «▶» 를 찾아 답안 자리를 ${got}개 잡았습니다`) }catch(e){globalThis.__q?.(e)} }
  }

  ord.forEach(x=>{ delete x.__x });
  return ord;
}

/* ══ ② 올리는 화면에 체크칸 ══ */
const mt=setInterval(()=>{
  const yi=document.getElementById('impYear');
  if(!yi || document.getElementById('impOneBox')) return;
  const box=document.createElement('div');
  box.className='impone'; box.id='impOneBox';
  box.innerHTML=`<label><input type="checkbox" id="impOne">
      PDF 안의 회차를 무시하고 <b>한 덩어리로</b> 넣기</label>
    <div class="h2">주제별로 엮인 정리본(단답·핵심빈출)처럼 <b>같은 회차가 책 곳곳에 흩어져 있는 자료</b>에 쓰세요.
      위에 적은 연도·회차 하나로 모두 몰아넣고 번호를 1번부터 쭉 이어 매깁니다 — 덮어쓸 자리가 없어집니다.
      <br>회차가 제대로 적힌 <b>기출본에는 끄고</b> 쓰세요.</div>
    <label style="margin-top:8px"><input type="checkbox" id="impMerge" checked>
      <b>들여쓴 «1. 2. 3.» 은 보기로 보고 쪼개지 않기</b></label>
    <div class="h2">한 문제 안의 번호 붙은 보기까지 문제로 잘려 개수가 부풀 때 켜세요.
      진짜 문제 번호는 <b>왼쪽 마진에 붙어</b> 있고 보기는 들여써 있습니다 — 그 자리를 재서 가려냅니다.</div>
    <label style="margin-top:8px"><input type="checkbox" id="impArrow" checked>
      <b>«▶» 를 답안 표시로 쓰기</b></label>
    <div class="h2">«답안작성» 이라는 말 대신 <b>▶</b> 로 답이 시작하는 자료(다산 단답본)에 쓰세요.
      그 줄 앞을 문제, 뒤를 답안으로 잘라 <b>답 가림판</b>이 동작합니다.
      <br>단답 정리본처럼 문제와 답이 한 덩어리인 자료는 <b>꺼 두는 편</b>이 낫습니다 —
      문제칸 하나로 통째로 들어가고, 화면도 <b>문제+답 · 쉬운 풀이</b> 두 칸으로 바뀝니다.</div>
    <label style="margin-top:8px"><input type="checkbox" id="impWipe" checked>
      <b>다시 올릴 때 옛 글자·옛 답안 지우기</b></label>
    <div class="h2">같은 자리에 다시 올리면 그림만 새것이 되고 <b>글자 변환 결과(q_md·a_md)는 지난 판이 그대로</b>
      남습니다. 쪼개진 개수가 달라지면 번호가 밀려 <b>문제와 답이 어긋납니다</b>.
      <br>켜 두면 그 칸들을 비우고 올립니다. <b>답안만 따로 올리는 작업</b>을 할 때만 끄세요.</div>`;
  (yi.closest('.grid')||yi.closest('div')?.parentElement||yi.parentElement).after(box);
  const c=document.getElementById('impOne');
  c.addEventListener('change',()=>{
    box.classList.toggle('on',c.checked);
    if(!c.checked) return;
    const se=document.getElementById('impSess');
    if(se && !se.value.trim()) se.value='1';          /* 비어 있으면 1회로 채워 둔다 */
    if(!yi.value.trim()){
      alert('연도 칸을 먼저 채워 주세요.\n\n예) 연도 9001 · 회차 1\n«＋ 새 이름표» 를 누르면 번호가 저절로 들어갑니다.');
      yi.focus();
    }
  });
  clearInterval(mt);
},600);
setTimeout(()=>clearInterval(mt),60000);
})();
