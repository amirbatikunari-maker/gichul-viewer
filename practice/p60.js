/* practice.html 에서 분리 (v341) — 원래 23152번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||console.log)(m) }catch(e){globalThis.__q?.(e)} };
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const shown=()=>{ try{ return Array.isArray(window.SHOWN)?window.SHOWN:[] }catch(e){ return [] } };
const rowOf=id=>rows().find(r=>String(r.id)===String(id))||null;
const client=()=>{ try{ return sb }catch(e){ return null } };
const curSid=()=>{ try{ return CACHE_SID }catch(e){ return null } };
const nowOv=()=>{ try{ return OVID!=null?String(OVID):'' }catch(e){ return '' } };
const keepCache=()=>{ try{ cacheSaveRows() }catch(e){globalThis.__q?.(e)} };
const dup=()=>{ try{ return window.__pracDup ? window.__pracDup() : null }catch(e){ return null } };
const NOCOL=m=>/qtype|column|schema cache|42703|PGRST204/i.test(String(m||''));
const clean=t=>String(t==null?'':t).replace(/\s+/g,' ').trim().slice(0,40);
const isReal=y=>+y>0&&+y<3000;
const short=r=>`${r.year%100}-${r.session} ${r.no}`;                       /* 레일과 같은 꼴 */
const full=r=>{
  if(isReal(r.year)) return `${r.year}년 ${r.session}회 ${r.no}번`;
  let h=''; try{ h=(window.__pracYLabel&&window.__pracYLabel()||{})[String(r.year)]||'' }catch(e){globalThis.__q?.(e)}
  return `${h||('자료 '+r.year)} ${r.session}회 ${r.no}번`;
};

/* ══ ① 유형 자료 — 줄(row) 의 qtype 이 곧 원본 ══ */
/* ★ v273 — 대문항(qtype) · 중문항(qtype2) · 소문항(qtype3) 세 단계.
   중복 묶기·출제 이력·랜덤 «같은 유형은 하나만» 은 예전처럼 «대문항» 만 본다. */
const FLD=['qtype','qtype2','qtype3'], LVN=['대문항','중문항','소문항'];
const LKS=['prac:qtype:v1','prac:qtype2:v1','prac:qtype3:v1'];   /* SQL 전 · 이 기기에만 { id: 이름('' = 뺌) } */
const LVKEY='prac:qtlv';
let LV=0; try{ LV=Math.min(2,Math.max(0,+localStorage.getItem(LVKEY)||0)) }catch(e){globalThis.__q?.(e)}
const readLocal=(lv=0)=>{ try{ return JSON.parse(localStorage.getItem(LKS[lv])||'{}')||{} }catch(e){ return {} } };
const writeLocal=(lv,o)=>{ try{ Object.keys(o).length?localStorage.setItem(LKS[lv],JSON.stringify(o)):localStorage.removeItem(LKS[lv]) }catch(e){globalThis.__q?.(e)} };
const COLS=[null,null,null];
let SYNCED=null, LOCALSID=null, BUSY=false, TOLD=false, LASTV=0;

const tv=(r,lv=LV)=>r?clean(r[FLD[lv]]):'';
const tOf=id=>tv(rowOf(id),0);
window.__qtypeOf=tOf;
window.__qtypePath=id=>{ const r=rowOf(id); return [0,1,2].map(l=>tv(r,l)); };
function groupsOf(lv=LV){
  const m=new Map();
  rows().forEach(r=>{ const t=tv(r,lv); if(t) (m.get(t)||m.set(t,[]).get(t)).push(String(r.id)); });
  return m;
}
window.__qtypeGroups=()=>groupsOf(0);
window.__qtypeGroupsLv=lv=>groupsOf(Math.min(2,Math.max(0,+lv||0)));
function typeList(lv=LV){
  return [...groupsOf(lv).entries()].map(([name,ids])=>({ name, n:ids.length, ids }))
    .sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'ko'));
}

let RC=0;
function changed(){
  paintBtn();
  if(POP.on) render();
  clearTimeout(RC);
  RC=setTimeout(()=>{
    try{ window.__pracDupRecompose && window.__pracDupRecompose() }catch(e){globalThis.__q?.(e)}
    paintBtn(); decorate();
  },80);
}
function applyLocal(only){
  let ch=false;
  [0,1,2].forEach(lv=>{
    if(only!=null && only!==lv) return;
    const L=readLocal(lv), f=FLD[lv];
    Object.keys(L).forEach(id=>{
      const r=rowOf(id); if(!r) return;
      const v=clean(L[id])||null;
      if((clean(r[f])||null)!==v){ r[f]=v; ch=true; }
    });
  });
  if(ch) keepCache();
  return ch;
}
async function sync(force){
  const s=curSid(), c=client();
  if(!s || !c || BUSY) return;
  if(!force && SYNCED===s) return;
  BUSY=true;
  let done=0, any=false;
  try{
    for(const lv of [0,1,2]){
      const f=FLD[lv];
      try{
        /* SQL 전에 이 기기에 적어 둔 것 → 서버로 (이름마다 한 번) */
        const L=readLocal(lv), ids=Object.keys(L);
        if(COLS[lv]!==false && ids.length){
          const by=new Map();
          ids.forEach(id=>{ const t=clean(L[id]); (by.get(t)||by.set(t,[]).get(t)).push(id); });
          let ok=true;
          for(const [t,g] of by){
            const up=await c.from('practicals').update({ [f]:t||null }).in('id', g);
            if(up.error){ ok=false; if(NOCOL(up.error.message)) COLS[lv]=false; break; }
          }
          if(ok){ COLS[lv]=true; writeLocal(lv,{}); say(`🏷 이 기기에만 적어 두었던 ${LVN[lv]} ${ids.length}개를 서버로 옮겼습니다`); }
        }
        if(COLS[lv]===false){ if(applyLocal(lv)) any=true; done++; continue; }

        const q=await c.from('practicals').select('id,'+f).eq('subject_id', s).not(f,'is',null);
        if(q.error){
          if(NOCOL(q.error.message)){ COLS[lv]=false; if(applyLocal(lv)) any=true; done++; }
          continue;                                   /* 오프라인 등 — 다음에 다시 */
        }
        COLS[lv]=true;
        const srv=new Map((q.data||[]).map(d=>[String(d.id), clean(d[f])||null]));
        rows().forEach(r=>{
          const v=srv.get(String(r.id))||null;
          if((clean(r[f])||null)!==v){ r[f]=v; any=true; }
        });
        done++;
      }catch(e){globalThis.__q?.(e)}
    }
    if(any){ keepCache(); changed(); }
    if(done===3) SYNCED=s;
  }catch(e){globalThis.__q?.(e)}
  finally{ BUSY=false; }
}
/* 여러 문항을 한 번에 — 요청은 한 번(.in) */
async function setType0(ids, name, lv){
  lv=(lv==null)?LV:Math.min(2,Math.max(0,+lv||0));
  const f=FLD[lv];
  ids=[...new Set((ids||[]).map(String))].filter(id=>rowOf(id));
  if(!ids.length) return false;
  const t=clean(name)||null;
  const prev=ids.map(id=>[id, rowOf(id)[f]==null?null:rowOf(id)[f]]);
  ids.forEach(id=>{ rowOf(id)[f]=t; });
  changed();
  const c=client();
  if(COLS[lv]!==false && c){
    let err=null;
    try{ const up=await c.from('practicals').update({ [f]:t }).in('id', ids); err=up.error||null; }
    catch(e){ err=e; }
    if(!err){ COLS[lv]=true; keepCache(); return true; }
    if(!NOCOL(err.message||err)){
      prev.forEach(([id,v])=>{ const r=rowOf(id); if(r) r[f]=v; });
      changed();
      say(`${LVN[lv]}을 저장하지 못했습니다 — `+(err.message||err));
      return false;
    }
    COLS[lv]=false;
  }
  const L=readLocal(lv); ids.forEach(id=>{ L[id]=t||''; }); writeLocal(lv,L); keepCache();
  if(!TOLD){ TOLD=true; say('🏷 이 기기에만 저장했습니다 — supabase-qtype.sql 을 돌리면 PC·폰이 같이 봅니다'); }
  return true;
}
/* ★ v294 — 나무 규칙: 중·소문항이 있으면 윗단계도 반드시 있다
   · 중·소문항을 넣는데 윗단계가 빈 문항 → 그 이름이 이미 쓰인 곳의 윗단계(가장 많이 쓰인 것)로 채움
     그런 곳이 없으면 같이 넣는 다른 문항 · 쪽지로 보고 있는 문항의 윗단계 → 그래도 없으면 이름을 물음
   · 윗단계가 이미 있는 문항은 그대로 둠 (옮기는 것은 분류판·쪽지에서 사람이 하는 일)
   · 어떤 단계를 비우면 그 아래 단계도 비움 (대문항을 빼면 중·소도, 중문항을 빼면 소도) */
function parentOf(name, lv, skip){
  const cnt=new Map();
  rows().forEach(r=>{ if(skip.has(String(r.id)) || tv(r,lv)!==name) return;
    const up=[0,1].slice(0,lv).map(l=>tv(r,l)); if(up.some(x=>!x)) return;
    const k=up.join('\u0001'); cnt.set(k,(cnt.get(k)||0)+1); });
  const best=[...cnt.entries()].sort((a,b)=>b[1]-a[1])[0];
  return best ? best[0].split('\u0001') : null;
}
async function setType(ids, name, lv){
  lv=(lv==null)?LV:Math.min(2,Math.max(0,+lv||0));
  ids=[...new Set((ids||[]).map(String))].filter(id=>rowOf(id));
  if(!ids.length) return false;
  const t=clean(name)||null;
  if(t && lv>0){
    const miss=ids.filter(id=>[0,1].slice(0,lv).some(l=>!tv(rowOf(id),l)));
    if(miss.length){
      const skip=new Set(ids);
      let up=parentOf(t, lv, skip);
      if(!up){ const d=ids.map(rowOf).find(r=>[0,1].slice(0,lv).every(l=>tv(r,l))); if(d) up=[0,1].slice(0,lv).map(l=>tv(d,l)); }
      if(!up && POP.id && !skip.has(String(POP.id))){ const d=rowOf(POP.id); if(d && [0,1].slice(0,lv).every(l=>tv(d,l))) up=[0,1].slice(0,lv).map(l=>tv(d,l)); }
      if(!up){
        up=[];
        for(let l=0;l<lv;l++){
          const have=ids.map(rowOf).map(r=>tv(r,l)).find(Boolean);
          const v=have || clean(prompt(`${LVN[lv]} «${t}» 의 ${LVN[l]} 이름 — ${LVN[lv]}이 있으면 ${LVN[l]}도 있어야 합니다`, l===0?((suggest(rowOf(ids[0])).find(x=>x.ex)||{}).name||''):t));
          if(!v){ say(`${LVN[l]}이 없어 ${LVN[lv]}을 넣지 않았습니다`); return false; }
          up.push(v);
        }
      }
      for(let l=0;l<lv;l++){
        const need=miss.filter(id=>!tv(rowOf(id),l));
        if(need.length && !(await setType0(need, up[l], l))) return false;
      }
    }
  }
  if(!(await setType0(ids, t, lv))) return false;
  if(!t) for(let l=lv+1;l<=2;l++){
    const sub=ids.filter(id=>tv(rowOf(id),l));
    if(sub.length) await setType0(sub, null, l);
  }
  return true;
}
/* 과목을 열 때 한 번 — 윗단계가 빠진 문항을 이름이 같은 곳의 윗단계로 메움 (모호한 것은 그대로, 분류판에 알림) */
let FIXSID=null;
async function repairTree(){
  const s=curSid(); if(!s || FIXSID===s || BUSY || !rows().length) return;
  if(SYNCED!==s) return;                                   /* 서버 값을 받은 뒤에 */
  FIXSID=s;
  const plan=new Map();                                    /* 'lv|이름' → ids */
  rows().forEach(r=>{
    for(let lv=2;lv>=1;lv--){
      const t=tv(r,lv); if(!t) continue;
      for(let l=0;l<lv;l++){ if(tv(r,l)) continue;
        const up=parentOf(t, lv, new Set([String(r.id)])); if(!up) continue;
        const k=l+'\u0001'+up[l]; (plan.get(k)||plan.set(k,[]).get(k)).push(String(r.id)); }
      break;
    }
  });
  let n=0;
  for(const [k,ids] of plan){ const [l,nm]=k.split('\u0001'); const u=ids.filter(id=>!tv(rowOf(id),+l)); if(u.length && await setType0(u, nm, +l)) n+=u.length; }
  if(n) say(`🏷 윗단계가 빠져 있던 ${n}칸을 같은 이름이 쓰인 곳에 맞춰 채웠습니다`);
}
setInterval(()=>{ repairTree().catch(()=>{}); }, 3000);
window.__qtypeOrphans=()=>rows().filter(r=>(tv(r,1)&&!tv(r,0)) || (tv(r,2)&&(!tv(r,1)||!tv(r,0))));
window.__qtypeSet=setType;
window.__qtypeSync=()=>sync(true);

/* ══ 추천 — 이 기기에서만 센다 ══ */
function nearOf(r, cur){
  let rel=[]; try{ rel=(window.__pracRel&&window.__pracRel(r.id))||[] }catch(e){globalThis.__q?.(e)}
  return rel.map(x=>({ o:rowOf(x.id), sim:x.sim }))
    .filter(x=>x.o && String(x.o.id)!==String(r.id) && (!cur || tv(x.o)!==cur))
    .slice(0,5);
}
function suggest(r){
  const cur=tv(r), out=[], seen=new Set();
  const have=new Set(typeList().map(t=>t.name));
  const add=(name,why)=>{
    name=clean(name); if(!name || name===cur || seen.has(name) || name.length<2) return;
    seen.add(name); out.push({ name, why, ex:have.has(name) });
  };
  /* ① 닮은 문항이 이미 가진 유형 — 가장 믿을 만하다 */
  let rel=[]; try{ rel=(window.__pracRel&&window.__pracRel(r.id))||[] }catch(e){globalThis.__q?.(e)}
  rel.forEach(x=>{ const o=rowOf(x.id), t=o&&tv(o); if(t) add(t, `${short(o)}번과 ${Math.round(x.sim*100)}% 닮음`); });
  /* ② 문제 글에 유형 이름의 낱말이 거의 다 들어 있는 유형 */
  const text=String(r.q_md||r.q_text||'').replace(/\s+/g,'');
  if(text) typeList().forEach(T=>{
    const ws=T.name.split(/\s+/).filter(w=>w.length>=2);
    const hit=ws.filter(w=>text.includes(w));
    if(ws.length && hit.length>=Math.max(1,Math.ceil(ws.length*0.6))) add(T.name, `문제 글에 «${hit.join('·')}»`);
  });
  /* ③ 새 이름 후보 — «무엇을 묻는가» 를 글에서 뽑은 것이 제일 쓸 만하다 */
  let tg=null; try{ tg=window.__pracTag&&window.__pracTag(r.id) }catch(e){globalThis.__q?.(e)}
  const ncs=tg&&tg.ncs, ask=askedOf(r);
  if(ask) add(ask+(tg&&tg.type==='계산'?' 계산':''), '문제가 묻는 것');
  else if(tg&&tg.key&&String(tg.key).length>=3) add(tg.key, '이 문제 주제어');
  if(ncs&&ncs.sub) add(String(ncs.sub).replace(/\s*하기$/,''), '출제기준 세부항목');
  if(ncs&&ncs.short) add(ncs.short, '출제기준 주요항목');
  return out.slice(0,7);
}

/* 문제가 묻는 대상 — «… 사용탭은 얼마» «… 용량을 구하시오» 의 앞말을 끝에서부터 세 낱말까지.
   토씨·이음말(…는 · …면 · …때)로 끝나는 말에서 멈춘다. */
function askedOf(r){
  const t=String(r.q_md||r.q_text||'')
    .replace(/!\[[^\]]*\]\([^)]*\)|\[\[[^\]]*\]\]/g,' ').replace(/\$[^$]*\$/g,' ')
    .replace(/\[[^\]]*\]/g,' ').replace(/[()「」『』"'“”]/g,' ').replace(/\s+/g,' ');
  const re=/((?:[가-힣A-Za-z0-9·]+\s+){0,4}[가-힣A-Za-z0-9·]+?)\s*(?:은|는|을|를|이|가)\s*(?:약\s*)?(?:얼마|몇|구하|계산|산정|산출|선정|결정|쓰시오|쓰라|무엇)/g;
  let m, last='';
  while((m=re.exec(t))) last=m[1];
  if(!last) return '';
  const STOP=/(는|면|해서|하고|하며|하여|하기|되어|인데|이고|이며|때|을|를|에|에서|으로|필요한|위한|대한|따른|같은)$|^(이|그|저|위|아래|다음|각|해당|이때|단)$/;
  const ws=last.replace(/의(?=\s|$)/g,'').split(/\s+/).filter(Boolean), out=[];
  for(let i=ws.length-1;i>=0 && out.length<3;i--){
    const w=ws[i];
    if(/^\d+$/.test(w) || (out.length && STOP.test(w))) break;
    out.unshift(w);
  }
  const p=out.join(' ').trim();
  return p.length>=2 && p.length<=24 ? p : '';
}

/* ── AI 추천 — 누를 때만 · 글만 · 싼 모델 · 기기에 남겨 다시 안 부름 ── */
const AIK='prac:qtai:v1';
const aiAll=()=>{ try{ return JSON.parse(localStorage.getItem(AIK)||'{}')||{} }catch(e){ return {} } };
const aiK=id=>String(id)+(LV?':'+LV:'');               /* 대문항은 예전 자리 그대로 */
const aiGet=id=>{ const v=aiAll()[aiK(id)]; return Array.isArray(v)?v:null; };
const aiPut=(id,v)=>{ try{ const o=aiAll(); o[aiK(id)]=v; const ks=Object.keys(o);
  if(ks.length>500) ks.slice(0,ks.length-500).forEach(k=>delete o[k]); localStorage.setItem(AIK,JSON.stringify(o)) }catch(e){globalThis.__q?.(e)} };
let AIBUSY=false;
const plain=t=>String(t||'').replace(/!\[[^\]]*\]\([^)]*\)|\[\[[^\]]*\]\]/g,' ').replace(/\s+/g,' ').trim();
async function aiSuggest(r){
  if(AIBUSY) return;
  const q=plain(r.q_md||r.q_text).slice(0,700);
  if(q.length<10){ POP.msg='글자로 옮긴 문제만 AI 추천을 받을 수 있습니다 (그림만 있는 문항)'; return render(); }
  if(typeof window.askAI!=='function'){ POP.msg='AI 모듈이 아직 안 실렸습니다'; return render(); }
  const a=plain(r.a_md||r.a_text).slice(0,250);
  const have=typeList().map(t=>t.name).slice(0,120);
  const up=[0,1].filter(l=>l<LV).map(l=>tv(r,l)?`${LVN[l]} «${tv(r,l)}»`:'').filter(Boolean).join(' · ');
  const lvGuide=['가장 큰 갈래(단원·주제) 이름이다.','대문항 아래 한 단계 좁힌 갈래 이름이다.','가장 좁은 갈래 — 사실상 같은 문제끼리 묶는 이름이다.'][LV];
  const prompt=`전기기사 실기 기출 문항에 «${LVN[LV]}» 유형 이름을 붙인다. ${lvGuide}
유형은 같은 개념·같은 계산을 묻는 문항끼리 묶는 이름이다. 회차가 달라도 같은 문제면 같은 이름이어야 한다.${up?`
이 문항의 윗단계: ${up} — 이것보다 좁은 이름을 붙인다.`:''}
- 한국어 명사구 6~18자 (예: 주상변압기 탭 조정 / 역률 개선 콘덴서 용량 / 축전지 용량 산정)
- 아래 «있는 유형» 가운데 맞는 것이 있으면 그 이름을 글자 그대로 맨 앞에 쓴다
- 잘 맞는 순서로 3개까지
출력: ["이름1","이름2","이름3"]

[있는 유형]
${have.length?have.join(' / '):'(아직 없음)'}

[문제]
${q}

[답안]
${a||'(없음)'}`;
  AIBUSY=true; POP.msg='AI 추천을 받는 중…'; render();
  try{ window.__aiKind && window.__aiKind('유형 추천') }catch(e){globalThis.__q?.(e)}
  let txt='', err='';
  for(const model of ['claude-haiku-4-5-20251001','claude-sonnet-5']){
    try{ txt=await window.askAI(prompt, null, 300, { model, json:true }); if(String(txt||'').trim()) break; }
    catch(e){ err=String(e.message||e); }
  }
  try{ window.__aiKind && window.__aiKind('그밖') }catch(e){globalThis.__q?.(e)}
  AIBUSY=false;
  let list=[];
  const raw=String(txt||'').replace(/^```(?:json)?\s*|\s*```$/g,'').trim();
  try{ const j=JSON.parse(raw); list=Array.isArray(j)?j:(j.types||j.names||j.유형||[]); }
  catch(e){ list=raw.split(/\n|,|\//); }
  list=list.map(x=>clean(typeof x==='string'?x:(x&&(x.name||x.이름)))
            .replace(/^[\s\-•·\d.)"'\[]+|["'\]\s]+$/g,''))
          .filter(x=>x && x.length>=2 && x.length<=30).slice(0,3);
  if(!list.length){ POP.msg='추천을 받지 못했습니다'+(err?' — '+err.slice(0,60):''); return render(); }
  aiPut(r.id, list);
  POP.msg=`AI ${LVN[LV]} 추천 ${list.length}개 — 이 문항은 다음부터 다시 안 부릅니다`;
  render();
}

/* ══ 번호 찾기 — «12-1 6» · «2012 1 6» · «2012년 1회 6번» · 같은 회차면 «6» ══ */
function findNo(txt){
  const me=rowOf(POP.id);
  const n=(String(txt||'').match(/\d+/g)||[]).map(Number);
  if(!n.length || !me) return null;
  let y=null, se=null, no;
  if(n.length>=3) [y,se,no]=n; else if(n.length===2) [se,no]=n; else no=n[0];
  const yl=y==null?0:String(n[0]).length;
  const hit=rows().filter(x=>{
    if(String(x.no)!==String(no)) return false;
    if(String(x.session)!==String(se==null?me.session:se)) return false;
    if(y==null) return String(x.year)===String(me.year);
    return yl>=3 ? +x.year===y : (isReal(x.year) && (+x.year)%100===y);
  });
  return hit.find(x=>String(x.id)!==String(me.id)) || null;
}

/* ══ ★ v282 — 본문으로 찾기 · 제자리 미리보기 ══
   같은 칸에 숫자(12-1 6)를 치면 예전처럼 번호, 글자가 섞이면 본문에서 찾는다.
   찾는 곳 : 문제(q_md·q_text) > 답안(a_md·a_text) > 쉬운 풀이(easy_md) > 유형 이름
   낱말을 띄어 쓰면 «모두 든 것» 만 · 띄어쓰기는 무시하고 견준다(영상 변류기 = 영상변류기).
   결과를 누르면 화면을 옮기지 않고 쪽지 안에서 문제 그림·글·답을 펼쳐 본다. */
const isNoQ=t=>{ t=String(t||'').trim(); return !!t && /^[\d\s\-.\/·,년회번]+$/.test(t) && /\d/.test(t); };
const HAY=new Map();                                   /* id → {sig, q, a, e, t} (띄어쓰기 뺀 소문자) */
const squash=s=>String(s||'').replace(/!\[[^\]]*\]\([^)]*\)|\[\[[^\]]*\]\]/g,' ').replace(/\s+/g,'').toLowerCase();
function hay(r){
  const sig=[r.q_md,r.q_text,r.a_md,r.a_text,r.easy_md].map(x=>(x||'').length).join('|')+'|'+[0,1,2].map(l=>tv(r,l)).join('/');
  let h=HAY.get(String(r.id));
  if(!h || h.sig!==sig){
    h={ sig, q:squash((r.q_md||'')+' '+(r.q_text||'')), a:squash((r.a_md||'')+' '+(r.a_text||'')),
        e:squash(r.easy_md), t:squash([0,1,2].map(l=>tv(r,l)).join(' ')) };
    HAY.set(String(r.id),h);
  }
  return h;
}
function textHits(txt){
  const ws=String(txt||'').trim().split(/\s+/).map(squash).filter(w=>w.length>=1);
  if(!ws.length || ws.join('').length<2) return [];
  const me=String(POP.id), out=[];
  rows().forEach(o=>{
    if(String(o.id)===me) return;
    const h=hay(o); let sc=0, where='';
    for(const w of ws){
      if(h.q.includes(w)){ sc+=3; where=where||'q'; }
      else if(h.a.includes(w)){ sc+=2; where=where||'a'; }
      else if(h.t.includes(w)){ sc+=2; where=where||'t'; }
      else if(h.e.includes(w)){ sc+=1; where=where||'e'; }
      else return;                                     /* 낱말 하나라도 없으면 뺀다 */
    }
    out.push({ o, sc, where });
  });
  return out.sort((a,b)=>b.sc-a.sc || (b.o.year-a.o.year) || (b.o.session-a.o.session) || (a.o.no-b.o.no));
}
/* 찾은 낱말 둘레 글 한 토막 — 원문에서 띄어쓰기를 무시하고 자리를 찾아 <mark> */
function snip(r, txt, where){
  const src={ q:r.q_md||r.q_text, a:r.a_md||r.a_text, e:r.easy_md, t:[0,1,2].map(l=>tv(r,l)).filter(Boolean).join(' › ') }[where]||'';
  const raw=plain(src).replace(/\$+/g,'').replace(/[#*_>`|]/g,' ').replace(/\s+/g,' ').trim();
  if(!raw) return '';
  const ws=String(txt||'').trim().split(/\s+/).map(squash).filter(Boolean);
  /* 띄어쓰기 뺀 글자 자리 → 원문 자리 */
  const map=[]; let flat='';
  for(let i=0;i<raw.length;i++){ if(!/\s/.test(raw[i])){ map.push(i); flat+=raw[i].toLowerCase(); } }
  const rng=[];
  ws.forEach(w=>{ let k=flat.indexOf(w), c=0; while(k>=0 && c<4){ rng.push([map[k], map[k+w.length-1]+1]); k=flat.indexOf(w,k+w.length); c++; } });
  rng.sort((a,b)=>a[0]-b[0]);
  const c0=rng.length?rng[0][0]:0, a=Math.max(0,c0-26), b=Math.min(raw.length,a+96);
  let html='', at=a;
  rng.filter(([x,y])=>x>=a&&y<=b).forEach(([x,y])=>{ if(x<at) return; html+=esc(raw.slice(at,x))+'<mark>'+esc(raw.slice(x,y))+'</mark>'; at=y; });
  html+=esc(raw.slice(at,b));
  return (a>0?'…':'')+html+(b<raw.length?'…':'');
}
const WHERE={ q:'문제', a:'답안', e:'풀이', t:'유형' };
/* 제자리 미리보기 — 문제 그림(있으면) · 문제 글 · 답 한 줄 */
function mini(o){
  const q=plain(o.q_md||o.q_text).replace(/\$+/g,'').slice(0,420);
  const a=plain(o.a_md||o.a_text).replace(/\$+/g,'').slice(0,200);
  return `<div class="qtmini">`
    + (o.q_url?`<a href="${esc(o.q_url)}" target="_blank" rel="noopener" title="새 창에서 크게"><img src="${esc(o.q_url)}" alt="${esc(full(o))} 문제" loading="lazy"></a>`:'')
    + (q&&!o.q_url?`<div class="mq">${esc(q)}${q.length>=420?'…':''}</div>`:'')
    + (a?`<div class="ma"><b>답</b> ${esc(a)}${a.length>=200?'…':''}</div>`:(o.a_url?`<div class="ma"><b>답</b> 그림만 있음</div>`:''))
    + (!o.q_url&&!q?`<div class="mq">문제 그림·글이 없습니다</div>`:'')
    + `<div class="mb"><button type="button" class="mini" data-open="${esc(o.id)}">↗ 이 문항으로 이동</button></div></div>`;
}
function hitRow(o, extra, sub, ck){
  const same=!!cur_() && tv(o)===cur_(), t=tv(o), on=POP.pv===String(o.id);
  return `<div class="hit${on?' on':''}">
      <div class="hh">${ck&&!same?`<input type="checkbox" class="hck" data-ck="${esc(o.id)}"${POP.ck.has(String(o.id))?' checked':''} aria-label="고르기">`:ck?'<span class="hck0"></span>':''}<button type="button" class="eye" data-pv="${esc(o.id)}" aria-expanded="${on}" title="제자리 미리보기">${on?'▾':'👁'}</button>
        <span class="nm" data-pv="${esc(o.id)}">${esc(short(o))}${relTag(rowOf(POP.id),o)}${extra||''}${t?` <small>· ${esc(t)}</small>`:''}</span>
        <button type="button" class="mini${same?'':' lk'}" data-lk="${esc(o.id)}"${same?' disabled title="이미 같은 유형"':''}>${same?'같음':'연동'}</button></div>
      ${sub&&!on?`<div class="sn">${sub}</div>`:''}${on?mini(o):''}</div>`;
}

/* ══ 하는 일 ══ */
async function assign(name){
  const r=rowOf(POP.id), t=clean(name); if(!r || !t) return;
  if(tv(r)===t){ POP.msg=`이미 이 ${LVN[LV]}입니다`; return render(); }
  if(await setType([r.id], t)){
    const n=(groupsOf(LV).get(t)||[]).length;
    POP.msg = n>1 ? `${LVN[LV]} «${t}» — ${n}문항이 서로 연동됐습니다` : `${LVN[LV]} «${t}» 새로 넣었습니다`;
    POP.q='';
  }
  render();
}
async function link(oid){
  const r=rowOf(POP.id), o=rowOf(oid);
  if(!r || !o || String(r.id)===String(o.id)) return;
  const A=tv(r), B=tv(o);
  if(A && A===B){ POP.msg=`${full(o)}은 이미 같은 유형입니다`; return render(); }
  if(A && !B){
    if(await setType([o.id], A)) POP.msg=`${full(o)} → «${A}» 유형으로 연동했습니다`;
  }else if(!A && B){
    if(await setType([r.id], B)) POP.msg=`이 문제 → «${B}» 유형 (${full(o)}과 연동)`;
  }else if(!A && !B){
    const def=clean(POP.q) || (suggest(r).find(x=>!x.ex)||{}).name || (suggest(o).find(x=>!x.ex)||{}).name || '';
    const name=clean(prompt(`${full(r)}과 ${full(o)}을 묶을 유형 이름`, def));
    if(!name) return;
    if(await setType([r.id, o.id], name)) POP.msg=`«${name}» — 두 문항을 연동했습니다`;
  }else{
    const nb=(groupsOf(LV).get(B)||[]);
    if(confirm(`${full(o)}은 이미 «${B}» 유형입니다 (${nb.length}문항).\n\n[확인] «${B}» ${nb.length}문항을 모두 «${A}» 유형으로 합칩니다\n[취소] 다음 물음으로`)){
      if(await setType(nb, A)) POP.msg=`«${B}» 유형을 «${A}» 유형으로 합쳤습니다`;
    }else if(confirm(`그럼 ${full(o)} 한 문항만 «${A}» 유형으로 옮길까요?`)){
      if(await setType([o.id], A)) POP.msg=`${full(o)}만 «${A}» 유형으로 옮겼습니다`;
    }else return;
  }
  POP.fresh=new Set([String(o.id)]);
  /* ★ v291 — 글자로 찾는 중이면 찾은 목록을 그대로 둔다 → 아래를 보면서 연달아 «연동» */
  if(!POP.no.trim() || isNoQ(POP.no)){ POP.no=''; POP.pv=''; POP.more=false; }
  render();
}
/* ★ v291 — 찾은 것 중 «같음» 아닌 것을 한 번에.
   ★ v311 — 다른 유형이 붙은 문항을 말없이 건너뛰지 않는다. 한 번 물어서 옮기고, 연동된 것은 찾은 목록에서 빠져 아래 «문항» 목록으로 내려간다 */
async function linkMany(ids){
  const r=rowOf(POP.id); if(!r) return;
  let A=tv(r);
  const tg=ids.map(rowOf).filter(o=>o && String(o.id)!==String(r.id) && !(A && tv(o)===A));
  if(!tg.length){ POP.msg='연동할 문항이 없습니다'; return render(); }
  const other=tg.filter(o=>tv(o) && tv(o)!==A), free=tg.filter(o=>!tv(o));
  const G=groupsOf(LV);
  /* 이 문제만 A 에 있고, 고른 것이 전부 한 유형(B)이면 — 이 문제가 B 로 가는 편이 자연스러움 */
  const Bs=[...new Set(other.map(o=>tv(o)))];
  if(A && !free.length && Bs.length===1 && (G.get(A)||[]).length<=1){
    const B=Bs[0], nb=(G.get(B)||[]).length;
    if(confirm(`고른 ${other.length}문항은 이미 «${B}» ${LVN[LV]}입니다 (전체 ${nb}문항).\n\n[확인] 이 문제를 «${B}» 로 옮겨 함께 묶음\n[취소] 다음 물음 (고른 것을 «${A}» 로 옮기기)`)){
      if(await setType([r.id], B)){ POP.fresh=new Set(other.map(o=>String(o.id))); POP.ck=new Set();
        POP.msg=`이 문제 → «${B}» — ${nb+1}문항이 함께 묶였습니다 ↓ 아래 목록`; }
      return render();
    }
  }
  if(!A){
    const def=Bs.length===1 ? Bs[0] : (clean(POP.no) || (suggest(r).find(x=>!x.ex)||{}).name || '');
    const name=clean(prompt(`이 문제와 ${tg.length}문항을 묶을 ${LVN[LV]} 이름`, def)); if(!name) return;
    A=name;
  }
  const move=other.filter(o=>tv(o)!==A);
  const same0=other.filter(o=>tv(o)===A);
  let moveOk=false;
  if(move.length){
    const names=[...new Set(move.map(o=>tv(o)))].map(b=>`«${b}»`).join(' · ');
    moveOk=confirm(`«${A}» 로 연동합니다.\n\n· 유형 없던 문항 ${free.length}개 → 그대로 넣음`+(tv(r)?'':'\n· 이 문제')+`\n· 이미 ${names} 인 문항 ${move.length}개\n\n[확인] 이 ${move.length}개도 «${A}» 로 옮김 (그 유형의 나머지 문항은 그대로)\n[취소] 이 ${move.length}개만 건너뜀`);
    if(!moveOk && !free.length && tv(r)){ POP.msg=`건너뛰었습니다 — 연동한 문항 없음`; return render(); }
  }else if(!confirm(`«${A}» 로 ${free.length+same0.length+(tv(r)?0:1)}문항 연동합니다. 계속할까요?`)) return;
  const ids2=[...(tv(r)?[]:[r.id]), ...free.map(o=>o.id), ...same0.map(o=>o.id), ...(moveOk?move.map(o=>o.id):[])];
  if(ids2.length && await setType(ids2, A)){
    POP.fresh=new Set(ids2.map(String).filter(id=>id!==String(r.id))); POP.ck=new Set();
    POP.msg=`«${A}» — ${ids2.length}문항 연동 ↓ 아래 목록으로 옮겼습니다${move.length&&!moveOk?` · ${move.length}문항 건너뜀`:''}`;
  }
  render();
}
async function renameCur(){
  const r=rowOf(POP.id), cur=tv(r); if(!cur) return;
  const nv=clean(prompt(`${LVN[LV]} «${cur}» 의 새 이름`, cur)); if(!nv || nv===cur) return;
  const G=groupsOf(LV);
  const merge=G.has(nv);
  if(merge && !confirm(`«${nv}» 유형이 이미 있습니다 (${G.get(nv).length}문항). 두 유형을 하나로 합칠까요?`)) return;
  if(await setType(G.get(cur)||[], nv)) POP.msg=merge?`«${cur}» 유형을 «${nv}» 유형에 합쳤습니다`:`이름을 바꿨습니다 → «${nv}»`;
  render();
}

/* ══ ① 쪽지 ══
   ★ v269 — 입력칸은 «한 번만» 만든다. 여태 글자 하나 칠 때마다 쪽지를 통째로 다시 그려서
     입력칸이 새것으로 갈렸다 — 한글은 조합 중에 칸이 바뀌면 «ㅈ주주» 처럼 깨진다.
     이제 틀(뼈대)은 문항이 바뀔 때만 만들고, 치는 동안에는 목록·미리보기 칸만 고친다. */
const POP={ on:false, id:null, q:'', no:'', msg:'', pv:'', more:false, ck:new Set(), lvall:false, fresh:new Set() };
let PEL=null, ANCHOR=null, COMPOSING=false;
function pop(){
  if(PEL) return PEL;
  PEL=document.createElement('div'); PEL.className='qtpop'; PEL.id='qtPop';
  PEL.setAttribute('role','dialog'); PEL.setAttribute('aria-label','문항 유형');
  document.body.appendChild(PEL);
  PEL.addEventListener('click', onClick);
  PEL.addEventListener('compositionstart', ()=>{ COMPOSING=true; });
  PEL.addEventListener('compositionend', e=>{ COMPOSING=false; onType(e.target); });
  PEL.addEventListener('input', e=>onType(e.target));
  PEL.addEventListener('keydown', e=>{
    e.stopPropagation();                         /* ← → 가 문항 넘기기로 새지 않게 */
    if(e.key==='Escape'){ e.preventDefault(); return closePop(); }
    if(e.key!=='Enter' || e.isComposing || COMPOSING) return;
    if(e.target.id==='qtQ'){ e.preventDefault(); POP.q=e.target.value; const q=clean(POP.q); if(q) assign(q); }
    if(e.target.id==='qtNo'){ e.preventDefault(); POP.no=e.target.value;
      /* ★ v282 — 글자로 찾는 중이면 Enter = 맨 위 결과 미리보기 (실수로 묶이지 않게 연동은 단추로만) */
      if(!isNoQ(POP.no)){ const h=textHits(POP.no); if(h.length){ POP.pv=String(h[0].o.id); paintPv(); } return; }
      const o=findNo(POP.no);
      if(o) link(o.id); else { POP.msg='그 번호를 이 과목에서 못 찾았습니다'; paintMsg(); } }
  });
  return PEL;
}
/* 치는 동안 — 입력칸은 건드리지 않고 딸린 칸만 */
function onType(el){
  if(!el || !POP.on) return;
  if(el.id==='qtQ'){ POP.q=el.value; paintList(); }
  if(el.id==='qtNo'){ POP.no=el.value; clearTimeout(PVT); PVT=setTimeout(paintPv, isNoQ(el.value)?0:140); }
}
let PVT=0;
function place(){
  if(!PEL || !ANCHOR) return;
  const a=ANCHOR.getBoundingClientRect(), w=PEL.offsetWidth || 384;
  const x=Math.min(Math.max(8, a.left), innerWidth-w-8), y=Math.min(a.bottom+6, innerHeight-240);
  PEL.style.left=x+'px'; PEL.style.top=Math.max(8,y)+'px';
  PEL.style.maxHeight=Math.max(240, innerHeight-Math.max(8,y)-10)+'px';
}
function openPop(id, anchor){
  Object.assign(POP,{ on:true, id:String(id), q:'', no:'', msg:'', pv:'', more:false, ck:new Set(), lvall:false, fresh:new Set() });
  ANCHOR=anchor; pop().classList.add('on'); render(); place();
  anchor && anchor.classList.add('open');
  setTimeout(()=>{ const i=PEL.querySelector('#qtQ'); if(i && matchMedia('(pointer:fine)').matches) i.focus(); },30);
}
function closePop(){
  POP.on=false; COMPOSING=false; PEL && PEL.classList.remove('on');
  $('#qtBtn')?.classList.remove('open');
}
/* 뼈대 — 문항이 바뀔 때만 */
function skeleton(){
  PEL.innerHTML=`
    <div class="hd"><b id="qtHd"></b><span>유형</span><button type="button" class="mini bdb" data-board title="대 › 중 › 소 를 나무처럼 보면서 여러 문항을 골라 한 번에 넣기">🗂 분류판</button><button type="button" class="x" data-x aria-label="닫기">✕</button></div>
    <div class="lvseg" id="qtLv" role="tablist" aria-label="유형 단계"></div>
    <div id="qtCur"></div>
    <div class="sec"><div class="lb">추천 <small>보라 = 있는 유형(누르면 바로) · 흰색 = 새 이름(누르면 칸에 채움)</small></div>
      <div class="chips" id="qtSg"></div></div>
    <div class="sec"><div class="lb"><span id="qtLvNm">유형</span> 목록 <small id="qtCnt"></small></div>
      <input type="text" id="qtQ" placeholder="유형 찾기 · 새 이름 쓰고 Enter" autocomplete="off" spellcheck="false">
      <div class="list" id="qtList"></div></div>
    <div class="sec"><div class="lb">번호·본문으로 연동 <small>숫자면 번호 · 글자면 본문에서 찾기 · 👁 는 제자리 미리보기</small></div>
      <div class="row"><input type="text" id="qtNo" placeholder="12-1 6 · 같은 회차면 6 · 또는 본문 낱말 (영상변류기 지락)" autocomplete="off" spellcheck="false" enterkeyhint="search">
        <button type="button" class="go" data-link id="qtLinkBtn" disabled>연동</button></div>
      <div class="pv" id="qtPv"></div></div>
    <div id="qtNear"></div>
    <div id="qtMem"></div>
    <div class="qtmsg" id="qtMsg" aria-live="polite"></div>
    <div class="foot">바꿀 때만 Supabase 한 번 · 추천은 이 기기에서 셈 · AI 는 누를 때만 부르고 결과를 남깁니다</div>`;
  PEL.__for=POP.id;
}
const cur_=()=>tv(rowOf(POP.id));
function paintLv(){
  const r=rowOf(POP.id), box=PEL.querySelector('#qtLv'); if(!box) return;
  const html=[0,1,2].map(l=>{ const t=tv(r,l);
    return `<button type="button" class="lv${l===LV?' on':''}${t?' has':''}" data-lv="${l}" role="tab" aria-selected="${l===LV}" title="${esc(LVN[l]+(t?' — '+t:' — 없음'))}"><b>${LVN[l]}</b><small>${t?esc(t):'없음'}</small></button>`; }).join('');
  if(box.__h!==html){ box.__h=html; box.innerHTML=html; }
  const nm=PEL.querySelector('#qtLvNm'); if(nm) nm.textContent=LVN[LV];
  const qi=PEL.querySelector('#qtQ'); if(qi) qi.placeholder=`${LVN[LV]} 찾기 · 새 이름 쓰고 Enter`;
}
function paintCur(){
  const r=rowOf(POP.id), cur=cur_(), box=PEL.querySelector('#qtCur'); if(!r||!box) return;
  PEL.querySelector('#qtHd').textContent=full(r);
  const n=cur?(groupsOf(LV).get(cur)||[]).length:0;
  box.className='cur'+(cur?'':' none');
  box.innerHTML=cur
    ? `<span class="t">🏷 ${esc(cur)}</span><span class="mini" style="cursor:default">${n}문항</span>
       <button type="button" class="mini" data-ren>✎ 이름</button><button type="button" class="mini" data-unset>빼기</button>`
    : `<span class="t">아직 ${LVN[LV]}이 없습니다 — 추천을 누르거나 목록에서 고르세요</span>`;
}
function paintSg(){
  const r=rowOf(POP.id), box=PEL.querySelector('#qtSg'); if(!r||!box) return;
  const cur=cur_(), have=new Set(typeList().map(t=>t.name));
  const sg=suggest(r), ai=aiGet(r.id)||[];
  box.innerHTML=
      sg.map(x=>`<button type="button" class="sg${x.ex?' ex':''}" data-sg="${esc(x.name)}" data-ex="${x.ex?1:''}">${esc(x.name)}<small>${esc(x.why)}</small></button>`).join('')
    + ai.filter(n=>n!==cur && !sg.some(x=>x.name===n)).map(n=>`<button type="button" class="sg${have.has(n)?' ex':''}" data-sg="${esc(n)}" data-ex="${have.has(n)?1:''}">${esc(n)}<small>AI 추천</small></button>`).join('')
    + `<button type="button" class="sg ai" data-ai${AIBUSY?' disabled':''}>${AIBUSY?'🤖 받는 중…':(ai.length?'🤖 AI 다시':'🤖 AI 추천')}<small>누를 때만 · 글만 · 1~2원</small></button>`;
}
function paintList(){
  const box=PEL.querySelector('#qtList'); if(!box) return;
  const cur=cur_(), r=rowOf(POP.id);
  /* 중·소문항은 «같은 윗단계» 에서 쓰인 이름을 앞으로 */
  const par=LV&&r?tv(r,LV-1):'', sib=new Set();
  if(par) rows().forEach(o=>{ if(tv(o,LV-1)===par){ const t=tv(o); if(t) sib.add(t); } });
  const all=typeList().map(t=>({ ...t, sib:sib.has(t.name) }))
    .sort((a,b)=>(b.sib-a.sib)||b.n-a.n||a.name.localeCompare(b.name,'ko'));
  const q=clean(POP.q), ql=q.toLowerCase();
  /* ★ v292 — 중·소문항은 «윗단계 안에서» 고른다: 대문항이 같은 문항들이 쓴 중문항만 · 중문항이 같은 것들이 쓴 소문항만.
     찾는 말을 치면 전부에서 찾고, «다른 것도» 를 누르면 전부 보임 */
  const scoped = LV>0 && par && !q && !POP.lvall;
  const base = scoped ? all.filter(t=>t.sib || t.name===cur) : all;
  const list=q ? all.filter(t=>t.name.toLowerCase().includes(ql)) : base;
  const exact=!!q && all.some(t=>t.name===q);
  PEL.querySelector('#qtCnt').textContent = LV>0 && !par
    ? `⚠ ${LVN[LV-1]}을 먼저 정하세요 — 그 안에서 고르게 됩니다`
    : (scoped ? `«${par}» 안의 ${base.length}개` : `${all.length}개`) + ` · 체크하면 이 문제가 그 ${LVN[LV]}으로`;
  box.innerHTML=
      (q&&!exact?`<button type="button" class="it new" data-new="${esc(q)}"><span class="ck">＋</span><span class="nm">«${esc(q)}» 새 ${LVN[LV]}으로 넣기 <small style="color:var(--muted,#64748b);font-weight:600">Enter</small></span></button>`:'')
    + list.map(t=>`<button type="button" class="it${t.name===cur?' on':''}${t.sib?' sib':''}" data-t="${esc(t.name)}" aria-pressed="${t.name===cur}"><span class="ck">${t.name===cur?'✓':''}</span><span class="nm">${esc(t.name)}</span><b>${t.n}</b></button>`).join('')
    + (!list.length&&!q?`<div class="qtempty">${scoped?`«${esc(par)}» 안에 아직 ${LVN[LV]}이 없습니다 — 이름을 쓰고 Enter`:`아직 만든 ${LVN[LV]}이 없습니다. 추천을 누르거나 이름을 쓰고 Enter.`}</div>`:'')
    + (LV>0 && par && !q ? `<button type="button" class="it more2" data-lvall>${POP.lvall?`▴ «${esc(par)}» 안의 것만`:`▾ 다른 ${LVN[LV-1]}의 ${LVN[LV]}도 보기 (${all.length-base.length})`}</button>`:'');
}
function paintPv(){
  const pv=PEL.querySelector('#qtPv'), btn=PEL.querySelector('#qtLinkBtn'); if(!pv) return;
  const t=POP.no.trim();
  /* 번호 */
  if(!t || isNoQ(t)){
    const tgt=t?findNo(POP.no):null;
    btn.hidden=false; btn.disabled=!tgt;
    if(tgt && POP.pv && POP.pv!==String(tgt.id)) POP.pv='';
    pv.innerHTML=!t?'':(tgt
      ? `<div class="hits">${hitRow(tgt, tv(tgt)?'':` <small>· ${LVN[LV]} 없음</small>`)}</div>`
      : '이 과목에서 그 번호를 못 찾았습니다');
    return;
  }
  /* ★ v282 — 본문 */
  btn.hidden=true;
  /* ★ v311 — 이미 같은 유형이 된 문항은 찾은 목록에서 빼서 아래 «문항» 목록으로 */
  const cur0=cur_(), hit0=textHits(t), all=cur0?hit0.filter(h=>tv(h.o)!==cur0):hit0, moved=hit0.length-all.length;
  const MAX=POP.more?40:8, list=all.slice(0,MAX);
  if(POP.pv && !list.some(h=>String(h.o.id)===POP.pv)) POP.pv='';
  pv.innerHTML = !all.length
    ? (moved?`찾은 ${moved}문항 모두 이미 연동됨 — 아래 목록에 있음 ↓`:squash(t).length<2?'두 글자 이상 쳐 주세요':'본문에서 못 찾았습니다 — 낱말을 줄이거나 띄어서 쳐 보세요')
    : `<div class="hn">${all.length}문항${all.length>MAX?` · 위 ${MAX}개`:''}${moved?` <small class="mvd">· 연동된 ${moved}개는 아래 ↓</small>`:''} <small>👁 로 보고 ☑ 골라서</small>${(()=>{
        const cur=cur_(), cand=list.filter(h=>!(cur && tv(h.o)===cur)).map(h=>String(h.o.id));
        POP.ck=new Set([...POP.ck].filter(id=>cand.includes(id)));
        const n=POP.ck.size;
        return cand.length?`<button type="button" class="mini" data-ckall="${esc(cand.join(','))}">${n===cand.length?'☑ 전체 풀기':'☐ 전체 고르기'}</button>
          <button type="button" class="mini all" data-lksel${n?'':' disabled'} title="고른 것을 한 번에 연동 — 다른 유형이 붙은 것은 옮길지 한 번 물음">선택 ${n}개 연동</button>`:''; })()}</div>
       <div class="hits">${list.map(h=>hitRow(h.o, ` <em class="w${h.where}">${WHERE[h.where]}</em>`, snip(h.o,t,h.where), true)).join('')}</div>`
      + (all.length>MAX?`<button type="button" class="mini more" data-more>더 보기 (${Math.min(all.length,40)-MAX}개 더)</button>`:'');
}
function paintNear(){
  const r=rowOf(POP.id), box=PEL.querySelector('#qtNear'); if(!r||!box) return;
  const near=nearOf(r, cur_());
  box.className=near.length?'sec':'';
  /* ★ v282 — 이름을 누르면 이동하지 않고 제자리 미리보기 */
  box.innerHTML=!near.length?'':`<div class="lb">닮은 문항 <small>글이 닮은 순 · 👁 미리보기 · 연동을 누르면 같은 유형으로</small></div>`
    + `<div class="hits">${near.map(x=>hitRow(x.o, ` <em class="pc">${Math.round(x.sim*100)}%</em>`)).join('')}</div>`;
}
function paintMem(){
  const r=rowOf(POP.id), box=PEL.querySelector('#qtMem'); if(!r||!box) return;
  const cur=cur_();
  const mem=cur ? (groupsOf(LV).get(cur)||[]).map(rowOf).filter(Boolean)
                  .sort((a,b)=>(b.year-a.year)||(b.session-a.session)||(a.no-b.no)) : [];
  box.className=cur?'sec':'';
  /* ★ v311 — 칩마다 이 문제와의 사이(동일·유사) · 방금 연동한 것은 반짝 */
  const fr=POP.fresh||new Set();
  const nS=mem.filter(m=>relOf(r,m)==='same').length, nM=mem.filter(m=>relOf(r,m)==='sim').length, nU=mem.filter(m=>relOf(r,m)==='mid').length;
  box.innerHTML=!cur?'':`<div class="lb">«${esc(cur)}» 문항 ${mem.length} <small>눌러서 이동 · ✕ 는 이 유형에서 빼기</small></div>
      <div class="rlleg"><em class="rl same">동일</em> 대·중·소 모두 같음 ${nS} · <em class="rl sim">유사</em> 대문항만 같음 ${nM}${nU?` · <em class="rl mid">소 미정</em> 대·중 같고 소문항 비어 있음 ${nU} — 소문항까지 넣으면 동일`:''}${mem.length-1-nS-nM-nU>0?` · 표시 없음 ${mem.length-1-nS-nM-nU} (대문항 미정)`:''}</div>
      <div class="chips">${mem.map(m=>`<span class="mem${String(m.id)===String(r.id)?' now':''}${fr.has(String(m.id))?' fresh':''}" data-go="${m.id}" title="${esc(full(m))}">${esc(short(m))}${String(m.id)===String(r.id)?'<em class="rl me">지금</em>':relTag(r,m)}<i data-rm="${m.id}" title="이 ${LVN[LV]}에서 빼기">✕</i></span>`).join('')}</div>`;
  if(fr.size) setTimeout(()=>{ POP.fresh=new Set(); PEL&&PEL.querySelectorAll('.mem.fresh').forEach(x=>x.classList.remove('fresh')); }, 2600);
}
function paintMsg(){ const m=PEL&&PEL.querySelector('#qtMsg'); if(m) m.textContent=POP.msg; }
function render(){
  if(!POP.on || !PEL) return;
  if(!rowOf(POP.id)){ closePop(); return; }
  const keepY=PEL.scrollTop;                 /* ★ v291 — 연동해도 보던 자리 그대로 */
  requestAnimationFrame(()=>{ if(PEL && PEL.__for===POP.id) PEL.scrollTop=keepY; });
  if(PEL.__for!==POP.id) skeleton();
  /* 입력칸 값은 «바깥에서 바꿨을 때만» 맞춘다 — 조합 중에는 절대 안 건드림 */
  if(!COMPOSING){
    const qi=PEL.querySelector('#qtQ'), ni=PEL.querySelector('#qtNo');
    if(qi && qi.value!==POP.q) qi.value=POP.q;
    if(ni && ni.value!==POP.no) ni.value=POP.no;
  }
  paintLv(); paintCur(); paintSg(); paintList(); paintPv(); paintNear(); paintMem(); paintMsg();
}
async function onClick(e){
  const ckb=e.target.closest('[data-ck]');
  if(ckb){ const id=String(ckb.dataset.ck); ckb.checked?POP.ck.add(id):POP.ck.delete(id); return paintPv(); }
  const rm=e.target.closest('[data-rm]');
  if(rm){ e.stopPropagation(); await setType([rm.dataset.rm], null); POP.msg=`${LVN[LV]}에서 뺐습니다`; return render(); }
  const t=e.target.closest('button,[data-go],[data-pv]'); if(!t) return;
  const r=rowOf(POP.id); if(!r) return;
  const d=t.dataset;
  if(d.x!=null) return closePop();
  if(d.lv!=null){
    const n=Math.min(2,Math.max(0,+d.lv||0)); if(n===LV) return;
    LV=n; try{ localStorage.setItem(LVKEY,String(n)) }catch(x){globalThis.__q?.(x)}
    POP.q=''; POP.no=''; POP.msg=''; POP.pv=''; POP.more=false; POP.ck=new Set(); POP.lvall=false; render();
    const i=PEL.querySelector('#qtQ'); if(i && matchMedia('(pointer:fine)').matches) i.focus();
    return;
  }
  if(d.t!=null) return assign(d.t);
  if(d.new!=null) return assign(d.new);
  if(d.sg!=null){
    if(d.ex) return assign(d.sg);
    POP.q=d.sg; render();
    const i=PEL.querySelector('#qtQ'); if(i){ i.focus(); try{ i.setSelectionRange(i.value.length,i.value.length) }catch(x){globalThis.__q?.(x)} }
    return;
  }
  if(d.ai!=null) return aiSuggest(r);
  if(d.unset!=null){ if(await setType([r.id], null)) POP.msg=`이 문제를 ${LVN[LV]}에서 뺐습니다`; return render(); }
  if(d.ren!=null) return renameCur();
  if(d.link!=null){ POP.no=PEL.querySelector('#qtNo')?.value||POP.no; const o=findNo(POP.no); if(o) return link(o.id); POP.msg='그 번호를 못 찾았습니다'; return render(); }
  if(d.near!=null) return link(d.near);
  /* ★ v282 */
  if(d.pv!=null){ POP.pv = POP.pv===String(d.pv) ? '' : String(d.pv); paintPv(); paintNear(); return; }
  if(d.lk!=null) return link(d.lk);
  if(d.lkall!=null) return linkMany(String(d.lkall).split(',').filter(Boolean));
  if(d.ckall!=null){ const ids=String(d.ckall).split(',').filter(Boolean); const all=ids.every(id=>POP.ck.has(id));
    POP.ck=all?new Set():new Set(ids); return paintPv(); }
  if(d.lksel!=null){ const ids=[...POP.ck]; POP.ck=new Set(); return linkMany(ids); }
  if(d.board!=null){ const id=POP.id; closePop(); return openBoard(id); }
  if(d.lvall!=null){ POP.lvall=!POP.lvall; return paintList(); }
  if(d.more!=null){ POP.more=true; return paintPv(); }
  if(d.open!=null){ closePop(); try{ window.ovOpen && window.ovOpen(d.open) }catch(x){globalThis.__q?.(x)} return; }
  if(d.go!=null){ closePop(); try{ window.ovOpen && window.ovOpen(d.go) }catch(x){globalThis.__q?.(x)} }
}

/* ══ ★ v292 · 🗂 유형 분류판 ══════════════════════════════════════
   왼쪽 나무 : 대문항 → (고른 대문항 안의) 중문항 → (고른 중문항 안의) 소문항 · 칸마다 «∅ 없음» 과 «＋ 새 이름»
   오른쪽    : 고른 칸의 문항들 — 또는 위 찾기 칸(본문 낱말 · 12-1 6 번호)으로 찾은 문항들
               ☑ 로 여러 개 고르고 → 아래 «넣기» 한 번에 대 › 중 › 소 를 같이 적음
   규칙      : 대문항이 바뀌는 문항은 원래 중·소문항을 비움(다른 갈래 것이라) · 중문항이 바뀌면 소문항을 비움
   같은 문제(진짜 같음)   → 소문항까지 같게
   비슷한 문제            → 중문항만 같게, 소문항은 따로 (또는 비움)
   ══════════════════════════════════════════════════════════════════ */
const BD={ el:null, b:'', m:'', s:'', q:'', ck:new Set(), pv:'', only:'', from:'' };
const NONE='∅';                                       /* ∅ = 그 단계 없음 */
const p3=r=>[0,1,2].map(l=>tv(r,l));
/* ★ v292 — 기준 문항과의 사이: 소문항이 같으면 «동일» · 중문항만 같으면 «유사» · 대문항만 같으면 «같은 단원» */
/* ★ v296 — 동일 = 대·중·소 모두 같음 · 유사 = 대문항만 같음(중문항 = 문제 특성이 다름) */
function relOf(a,b){
  if(!a||!b||String(a.id)===String(b.id)) return '';
  const A=p3(a), B=p3(b);
  if(A[0] && A[0]===B[0] && A[1]===B[1] && A[2] && A[2]===B[2]) return 'same';
  /* ★ v311 — 대·중은 같은데 소문항이 한쪽이라도 비었으면 «소 미정» (소문항까지 같게 넣으면 동일) */
  if(A[0] && A[0]===B[0] && A[1] && A[1]===B[1] && (!A[2] || !B[2])) return 'mid';
  if(A[0] && A[0]===B[0]) return 'sim';
  return '';
}
const REL_NM={ same:'동일', sim:'유사', mid:'소 미정' };
const relTag=(a,b)=>{ const k=relOf(a,b); return k?`<em class="rl ${k}">${REL_NM[k]}</em>`:''; };
function bdRows(){
  const R=rows();
  const q=BD.q.trim();
  if(q){
    if(isNoQ(q)){
      const n=(q.match(/\d+/g)||[]).map(Number); let y=null,se=null,no;
      if(n.length>=3) [y,se,no]=n; else if(n.length===2) [se,no]=n; else no=n[0];
      return R.filter(x=>String(x.no)===String(no) && (se==null||String(x.session)===String(se))
        && (y==null || (String(y).length>=3 ? +x.year===y : (isReal(x.year) && (+x.year)%100===y))));
    }
    const ws=q.split(/\s+/).map(squash).filter(Boolean);
    if(!ws.length || ws.join('').length<2) return [];
    return R.map(o=>{ const h=hay(o); let sc=0;
        for(const w of ws){ if(h.q.includes(w)) sc+=3; else if(h.a.includes(w)) sc+=2; else if(h.t.includes(w)) sc+=2; else if(h.e.includes(w)) sc+=1; else return null; }
        return { o, sc }; }).filter(Boolean)
      .sort((a,b)=>b.sc-a.sc||(b.o.year-a.o.year)||(b.o.session-a.o.session)).map(x=>x.o);
  }
  const mt=(v,sel)=> sel===NONE ? !v : v===sel;
  let L=R;
  if(BD.b) L=L.filter(r=>mt(tv(r,0),BD.b));
  if(BD.b && BD.b!==NONE && BD.m) L=L.filter(r=>mt(tv(r,1),BD.m));
  if(BD.m && BD.m!==NONE && BD.s) L=L.filter(r=>mt(tv(r,2),BD.s));
  if(BD.only==='orph') return (window.__qtypeOrphans?window.__qtypeOrphans():[]).slice();
  if(!BD.b) L=L.filter(r=>tv(r,0));                  /* 아무것도 안 골랐으면 대문항 붙은 것 전부 */
  if(BD.only==='no3') L=L.filter(r=>!tv(r,2));
  return L.slice().sort((a,b)=>(b.year-a.year)||(b.session-a.session)||(a.no-b.no));
}
function bdCount(lv, filt){
  const m=new Map(); let none=0;
  rows().forEach(r=>{ if(!filt(r)) return; const t=tv(r,lv); if(t) m.set(t,(m.get(t)||0)+1); else none++; });
  return { list:[...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ko')), none };
}
function bdCol(lv, sel, filt, title){
  const { list, none }=bdCount(lv, filt);
  const has=list.some(([n])=>n===sel);
  return `<div class="bcol"><div class="bt">${title}<small>${list.length}</small></div>
    <input type="text" class="bnew" data-bnew="${lv}" placeholder="찾기 · 새 이름 Enter" autocomplete="off" spellcheck="false">
    <div class="bl">${sel && sel!==NONE && !has ? `<button type="button" class="bi on newv" data-bsel="${lv}" data-v="${esc(sel)}"><span>＋ ${esc(sel)}</span><b>새</b></button>`:''}
      ${list.map(([n,c])=>`<button type="button" class="bi${n===sel?' on':''}" data-bsel="${lv}" data-v="${esc(n)}"><span>${esc(n)}</span><b>${c}</b></button>`).join('')}
      ${none?`<button type="button" class="bi none${sel===NONE?' on':''}" data-bsel="${lv}" data-v="${NONE}"><span>∅ ${LVN[lv]} 없음</span><b>${none}</b></button>`:''}</div></div>`;
}
function bdTree(){
  const c0=bdCol(0, BD.b, ()=>true, '대문항 <em class="k sim">유사 묶음</em>');
  const c1= BD.b && BD.b!==NONE ? bdCol(1, BD.m, r=>tv(r,0)===BD.b, `중문항 <em class="k">문제 특성</em><em>«${esc(BD.b)}» 안</em>`) : `<div class="bcol off"><div class="bt">중문항 <em class="k">문제 특성</em></div><div class="bh">대문항을 고르면 그 안의 중문항이 나옴<br>대문항만 같고 중문항이 다르면 «유사 문제» — 무엇을 묻는지(특성)가 다름</div></div>`;
  const c2= BD.m && BD.m!==NONE && BD.b && BD.b!==NONE ? bdCol(2, BD.s, r=>tv(r,0)===BD.b && tv(r,1)===BD.m, `소문항 <em class="k same">동일 문제</em><em>«${esc(BD.m)}» 안</em>`) : `<div class="bcol off"><div class="bt">소문항 <em class="k same">동일 문제</em></div><div class="bh">중문항을 고르면 그 안의 소문항이 나옴<br>대·중·소가 모두 같으면 «동일 문제» — 회차만 다른 같은 문제 (회독·해설 같이)</div></div>`;
  return c0+c1+c2;
}
function bdPath(){ return [BD.b,BD.m,BD.s].map(x=>x===NONE?'':x); }
function bdList(){
  const L=bdRows(), MAX=300, show=L.slice(0,MAX);
  const ids=show.map(r=>String(r.id));
  BD.ck=new Set([...BD.ck].filter(id=>rowOf(id)));
  const nSel=BD.ck.size, allOn=ids.length && ids.every(id=>BD.ck.has(id));
  const [b,m,s]=bdPath();
  const tgt=[b,m,s].filter(Boolean);
  const q=BD.q.trim();
  const orph=window.__qtypeOrphans?window.__qtypeOrphans():[];
  const head=(orph.length?`<div class="orph">⚠ 윗단계가 빠진 문항 ${orph.length}개 — <button type="button" class="mini" data-borph>보기</button> 골라서 왼쪽 칸을 정하고 «넣기»</div>`:'')+`<div class="lh"><button type="button" class="mini" data-bckall>${allOn?'☑ 전체 풀기':'☐ 전체 고르기'}</button>
      <span class="cnt">${q?`찾은 ${L.length}문항`:`이 칸 ${L.length}문항`}${L.length>MAX?` · 위 ${MAX}개`:''}</span>
      <label class="only"><input type="checkbox" data-bonly${BD.only==='no3'?' checked':''}> 소문항 없는 것만</label></div>`;
  const body=show.map(r=>{
    const id=String(r.id), p=p3(r), on=BD.pv===id;
    const txt=plain(r.q_md||r.q_text).replace(/\$+/g,'').slice(0,110);
    const sn=q && !isNoQ(q) ? (snip(r,q,(()=>{ const h=hay(r), w=squash(q.split(/\s+/)[0]||''); return h.q.includes(w)?'q':h.a.includes(w)?'a':h.t.includes(w)?'t':'e'; })())||esc(txt)) : esc(txt);
    return `<div class="br${BD.ck.has(id)?' sel':''}${id===BD.from?' me':''}">
      <div class="rh"><input type="checkbox" data-bck="${esc(id)}"${BD.ck.has(id)?' checked':''} aria-label="고르기">
        <button type="button" class="eye" data-bpv="${esc(id)}">${on?'▾':'👁'}</button>
        <b class="no" data-bpv="${esc(id)}">${esc(short(r))}</b>${BD.from?relTag(rowOf(BD.from),r):''}
        <span class="pth">${p.map((x,i)=>x?`<i class="l${i}">${esc(x)}</i>`:'').join('<u>›</u>')||'<i class="nn">유형 없음</i>'}</span></div>
      ${on?mini(r):`<div class="tx">${sn}</div>`}</div>`;
  }).join('');
  const foot=`<div class="bf"><span class="to">${tgt.length?`넣을 곳 <b>${tgt.map(esc).join(' › ')}</b>`:'왼쪽에서 넣을 칸을 고르세요'}</span>
    <button type="button" class="go" data-bput${nSel&&b?'':' disabled'}>☑ ${nSel}개 ${s?'동일 문제로':m?'유사 문제로':'대문항에'} 넣기</button>
    <button type="button" class="mini" data-bout${nSel&&tgt.length?'':' disabled'} title="고른 문항에서 ${tgt.length?LVN[tgt.length-1]:''}(과 그 아래)를 비움">빼기</button></div>`;
  const me=BD.from?rowOf(BD.from):null;
  const quick=me?`<div class="qk"><span>기준 <b>${esc(short(me))}</b>${p3(me).some(Boolean)?` <small>${p3(me).filter(Boolean).map(esc).join(' › ')}</small>`:' <small>유형 없음</small>'}</span>
      <button type="button" class="mini same" data-brel="same" title="고른 문항을 기준과 대·중·소 모두 같게 = 동일 문제 (회독·해설 같이)">＝ 이 문제와 동일로</button>
      <button type="button" class="mini sim" data-brel="sim" title="고른 문항을 기준과 대문항만 같게, 중문항은 그 문제 특성으로 = 유사 문제 (이름을 추천하고 고칠 수 있음)">≈ 이 문제와 유사로</button></div>`:'';
  const plan=BD.plan&&BD.plan.length?`<div class="simplan"><div class="sh">≈ 유사 문제 — 대문항 <b>${esc(BD.plan.b)}</b> 는 같게, 중문항은 문제마다 <b>특성</b>으로 (기준 «${esc(BD.plan.m)}» 과 달라야 함)</div>
      <datalist id="bdMids">${bdCount(1, r=>tv(r,0)===BD.plan.b).list.map(([n])=>`<option value="${esc(n)}">`).join('')}</datalist>
      ${BD.plan.map((x,i)=>{ const r=rowOf(x.id); return `<div class="sp"><b>${esc(short(r))}</b><input type="text" list="bdMids" data-plan="${i}" value="${esc(x.name)}" placeholder="이 문제의 특성 (중문항)"><small>${esc(plain(r.q_md||r.q_text).replace(/\$+/g,'').slice(0,60))}</small></div>`; }).join('')}
      <div class="sf"><small>중문항 이름 = 소문항 이름으로 같이 적음 (그 문제만의 동일 묶음)</small><button type="button" class="mini" data-bplanai${BD.planBusy?' disabled':''} title="기준 문제와 무엇이 다른지를 이름으로 — 글만 보내고 싼 모델, 한 번에">${BD.planBusy?'🤖 받는 중…':'🤖 AI 추천'}</button><button type="button" class="mini" data-bplanx>취소</button><button type="button" class="go" data-bplan>적용</button></div></div>`:'';
  return quick+plan+head+`<div class="rows">${body||`<div class="emp">${q?'찾은 문항이 없습니다':'이 칸에 문항이 없습니다 — 위 찾기 칸에 낱말을 쳐서 찾아 넣으세요'}</div>`}</div>`+foot;
}
function bdPaint(keep){
  if(!BD.el) return;
  const tr=BD.el.querySelector('.tree'), ls=BD.el.querySelector('.list');
  const y1=tr.scrollTop, y2=ls.querySelector('.rows')?.scrollTop||0;
  const fx=document.activeElement && document.activeElement.dataset && document.activeElement.dataset.bnew;
  tr.innerHTML=bdTree(); ls.innerHTML=bdList();
  tr.scrollTop=y1; const rr=ls.querySelector('.rows'); if(rr && keep) rr.scrollTop=y2;
  if(fx!=null) tr.querySelector(`[data-bnew="${fx}"]`)?.focus();
  BD.el.querySelector('.bmsg').textContent=BD.msg||'';
}
/* 넣기 — 대 › 중 › 소 를 같이 적고, 갈래가 바뀐 문항의 아래 단계는 비운다 */
async function bdPut(){
  const ids=[...BD.ck]; const [b,m,s]=bdPath(); if(!ids.length || !b) return;
  const R=ids.map(rowOf).filter(Boolean);
  const clr1=R.filter(r=>tv(r,0)!==b && tv(r,1) && !m).map(r=>r.id);
  const clr2=R.filter(r=>(tv(r,0)!==b || (m && tv(r,1)!==m)) && tv(r,2) && !s).map(r=>r.id);
  const nb=R.filter(r=>tv(r,0)!==b).length;
  if(nb && R.some(r=>tv(r,0) && tv(r,0)!==b) &&
     !confirm(`고른 것 중 다른 대문항이 붙은 문항이 있습니다 — «${b}» 로 옮기고 그 문항의 중·소문항은 비웁니다. 계속할까요?`)) return;
  let ok=await setType(ids, b, 0);
  if(ok && m) ok=await setType(ids, m, 1);
  if(ok && s) ok=await setType(ids, s, 2);
  if(ok && clr1.length) await setType(clr1, null, 1);
  if(ok && clr2.length) await setType(clr2, null, 2);
  if(ok){ BD.msg=`${ids.length}문항 → ${[b,m,s].filter(Boolean).join(' › ')}`; BD.ck=new Set(); }
  bdPaint(true);
}
/* ★ v292 — 기준 문항(분류판을 연 문항)과 «동일» 또는 «유사» 로 */
/* ★ v296 — 기준 문항(분류판을 연 문항)과 동일 / 유사
   동일 : 대·중·소 모두 기준과 같게. 기준에 빈 칸이 있으면 윗칸 이름을 그대로 씀(대문항만 없으면 물음)
   유사 : 대문항만 같게, 중문항은 문제마다 «특성» 이름을 추천 → 고쳐서 적용. 소문항 = 그 중문항 이름 */
async function bdBase(me){
  let [b,m,s]=p3(me);
  if(!b){ b=clean(prompt(`기준 문항 ${short(me)} 에 대문항이 없습니다 — 대문항 이름`, (suggest(me).find(x=>x.ex)||{}).name||askedOf(me)||'')); if(!b) return null; await setType([me.id], b, 0); }
  if(!m){ m=b; await setType([me.id], m, 1); }
  if(!s){ s=m; await setType([me.id], s, 2); }
  return [b,m,s];
}
/* 문제 글 첫 물음에서 «무엇을» 만 — «방폭형 전동기에 대하여 설명하시오» → «방폭형 전동기» */
function headPhrase(r){
  let t=plain(r.q_md||r.q_text).replace(/\$[^$]*\$/g,' ').replace(/[#*_>`|▶]/g,' ');
  t=t.split(/\(\s*1\s*\)|①|\n/)[0] || t;
  t=t.replace(/^\s*\d+\s*[.)]\s*/,'').replace(/^(다음|아래|그림)[^,.]*?(에서|의|을|를)\s*/,'');
  t=t.replace(/\s*(에\s*대하여|에\s*관하여|에\s*대해)?\s*(을|를|은|는|이|가)?\s*(간단히\s*)?(쓰시오|설명하시오|구하시오|계산하시오|답하시오|무엇인가|그리시오|적으시오|쓰라|나열하시오).*$/,'');
  t=t.replace(/\s+/g,' ').trim();
  if(t.length>18){ const w=t.slice(0,18).split(' '); if(w.length>1) w.pop(); t=w.join(' '); }
  return t.length>=2 ? t : '';
}
function simName(r, b, m){
  const bad=new Set([m, b].filter(Boolean));
  const own=tv(r,0)===b ? tv(r,1) : '';
  const cand=[own, askedOf(r), headPhrase(r), ...suggest(r).map(x=>x.name)].map(clean).filter(x=>x && !bad.has(x));
  return cand[0] || `${m} — ${short(r)}`;
}
async function bdRel(kind){
  const me=rowOf(BD.from); if(!me) return;
  const ids=[...BD.ck].filter(id=>id!==String(me.id)); if(!ids.length){ BD.msg='오른쪽에서 ☑ 로 문항을 고르세요'; return bdPaint(true); }
  const base=await bdBase(me); if(!base) return;
  const [b,m,s]=base;
  if(kind==='same'){
    await setType(ids, b, 0); await setType(ids, m, 1); await setType(ids, s, 2);
    BD.msg=`${ids.length}문항 → 기준과 동일 (${[b,m,s].join(' › ')})`;
    Object.assign(BD,{ b, m, s, plan:null }); BD.ck=new Set([String(me.id)]);
    return bdPaint(true);
  }
  BD.plan=ids.map(id=>({ id, name:simName(rowOf(id), b, m) })); BD.plan.b=b; BD.plan.m=m;
  BD.msg='중문항 이름을 확인하고 «적용»'; bdPaint(true);
  setTimeout(()=>BD.el.querySelector('[data-plan="0"]')?.focus(),30);
}
/* 유사 이름 AI 추천 — 기준 문제와 견주어 «무엇이 다른가» 를 중문항 이름으로. 한 번 부름 */
async function bdPlanAI(){
  const P=BD.plan; if(!P || BD.planBusy) return;
  if(typeof window.askAI!=='function'){ BD.msg='AI 모듈이 아직 안 실렸습니다'; return bdPaint(true); }
  const me=rowOf(BD.from);
  const have=bdCount(1, r=>tv(r,0)===P.b).list.map(([n])=>n).slice(0,60);
  const q=r=>plain(r.q_md||r.q_text).replace(/\$+/g,'').slice(0,260);
  const prompt=`전기기사 실기 기출. 대문항(단원) «${P.b}» 안에서 문항마다 «중문항» 이름을 붙인다.
중문항 = 그 문제가 무엇을 묻는지(문제 특성). 기준 문제와 같은 단원이지만 묻는 것이 다른 «유사 문제» 들이다.
- 기준 문제의 중문항은 «${P.m}» — 이것과 달라야 한다. 무엇이 다른지가 이름에 드러나게
- 한국어 명사구 6~18자 (예: 방폭구조 종류 · 방폭형 전동기 특징 · 전선 식별 색상)
- 이미 있는 중문항 가운데 맞는 것이 있으면 그 이름을 글자 그대로 쓴다
- 서로 같은 것을 묻는 문항은 같은 이름
출력: ["이름1","이름2",…] (아래 문항 순서대로 ${P.length}개)

[이미 있는 중문항]
${have.length?have.join(' / '):'(없음)'}

[기준 문제 — 중문항 «${P.m}»]
${me?q(me):''}

[문항]
${P.map((x,i)=>`${i+1}. ${q(rowOf(x.id))}`).join('\n')}`;
  BD.planBusy=true; BD.msg='AI 추천을 받는 중…'; bdPaint(true);
  let txt='', err='';
  try{ window.__aiKind && window.__aiKind('유형 추천') }catch(e){globalThis.__q?.(e)}
  for(const model of ['claude-haiku-4-5-20251001','claude-sonnet-5']){
    try{ txt=await window.askAI(prompt, null, 400, { model, json:true }); if(String(txt||'').trim()) break; }catch(e){ err=String(e.message||e); }
  }
  try{ window.__aiKind && window.__aiKind('그밖') }catch(e){globalThis.__q?.(e)}
  BD.planBusy=false;
  let list=[];
  try{ const j=JSON.parse(String(txt||'').replace(/^```(?:json)?\s*|\s*```$/g,'').trim()); list=Array.isArray(j)?j:(j.names||j.list||[]); }catch(e){globalThis.__q?.(e)}
  list=list.map(x=>clean(typeof x==='string'?x:(x&&x.name))).slice(0,P.length);
  if(!list.length){ BD.msg='추천을 받지 못했습니다'+(err?' — '+err.slice(0,60):''); return bdPaint(true); }
  list.forEach((n,i)=>{ if(n && n!==P.m && P[i]) P[i].name=n; });
  BD.msg=`AI 추천 ${list.length}개 — 고쳐서 «적용»`; bdPaint(true);
}
async function bdPlanApply(){
  const P=BD.plan; if(!P) return;
  const bad=P.find(x=>!clean(x.name) || clean(x.name)===P.m);
  if(bad){ BD.msg=`${short(rowOf(bad.id))} — 중문항이 비었거나 기준(«${P.m}»)과 같습니다. 같으면 «동일로» 를 쓰세요`; return bdPaint(true); }
  const by=new Map(); P.forEach(x=>{ const n=clean(x.name); (by.get(n)||by.set(n,[]).get(n)).push(x.id); });
  await setType(P.map(x=>x.id), P.b, 0);
  for(const [n,ids] of by){ await setType(ids, n, 1); await setType(ids, n, 2); }
  BD.msg=`${P.length}문항 → 기준과 유사 (${P.b} › ${[...by.keys()].join(' / ')})`;
  Object.assign(BD,{ b:P.b, m:'', s:'', plan:null }); BD.ck=new Set([String(BD.from)]);
  bdPaint(true);
}
async function bdOut(){
  const ids=[...BD.ck]; const t=bdPath().filter(Boolean); if(!ids.length || !t.length) return;
  const lv=t.length-1;
  if(!confirm(`고른 ${ids.length}문항에서 ${LVN[lv]}${lv<2?'(과 그 아래)':''}을 비울까요?`)) return;
  for(let l=lv;l<=2;l++) await setType(ids, null, l);
  BD.msg=`${ids.length}문항에서 ${LVN[lv]} 뺌`; BD.ck=new Set(); bdPaint(true);
}
function openBoard(id){
  const r=id?rowOf(id):null;
  if(!BD.el){
    const el=document.createElement('div'); el.className='qtbd'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','유형 분류판');
    el.innerHTML=`<div class="card"><div class="top"><b>🗂 유형 분류판</b>
        <input type="text" class="bq" placeholder="본문 낱말(방폭 구조) · 번호(12-1 6) 로 찾기 — 비우면 왼쪽 칸의 문항" autocomplete="off" spellcheck="false">
        <span class="bmsg" aria-live="polite"></span><button type="button" class="x" data-bx aria-label="닫기">✕</button></div>
      <div class="bd"><div class="tree"></div><div class="list"></div></div></div>`;
    document.body.appendChild(el); BD.el=el;
    let T=0;
    el.addEventListener('input', e=>{
      if(e.target.dataset.plan!=null && BD.plan){ BD.plan[+e.target.dataset.plan].name=e.target.value; return; }
      if(e.target.classList.contains('bq')){ clearTimeout(T); T=setTimeout(()=>{ BD.q=e.target.value; BD.pv=''; bdPaint(); },160); return; }
      const nv=e.target.dataset.bnew;
      if(nv!=null){ const q=e.target.value.trim().toLowerCase();
        e.target.closest('.bcol').querySelectorAll('.bi').forEach(b=>{ b.hidden=!!q && !String(b.dataset.v||'').toLowerCase().includes(q); }); }
    });
    el.addEventListener('keydown', e=>{
      e.stopPropagation();
      if(e.key==='Escape'){ e.preventDefault(); return closeBoard(); }
      if(e.key==='Enter' && !e.isComposing && e.target.dataset.bnew!=null){
        e.preventDefault(); const v=clean(e.target.value); if(!v) return;
        const lv=+e.target.dataset.bnew; bdSel(lv, v); }
    });
    el.addEventListener('click', e=>{
      if(e.target===el || e.target.closest('[data-bx]')) return closeBoard();
      const t=e.target;
      if(t.dataset.bck!=null){ const id=String(t.dataset.bck); t.checked?BD.ck.add(id):BD.ck.delete(id); t.closest('.br')?.classList.toggle('sel',t.checked); return bdFoot(); }
      if(t.dataset.bonly!=null){ BD.only=t.checked?'no3':''; return bdPaint(); }
      const b=t.closest('button,[data-bpv]'); if(!b) return;
      const d=b.dataset;
      if(d.bsel!=null) return bdSel(+d.bsel, d.v);
      if(d.bpv!=null){ BD.pv=BD.pv===String(d.bpv)?'':String(d.bpv); return bdPaint(true); }
      if(d.bckall!=null){ const ids=bdRows().slice(0,300).map(r=>String(r.id)); const all=ids.every(x=>BD.ck.has(x));
        BD.ck=all?new Set():new Set(ids); return bdPaint(true); }
      if(d.bput!=null) return bdPut();
      if(d.borph!=null){ BD.only=BD.only==='orph'?'':'orph'; BD.q=''; BD.el.querySelector('.bq').value=''; return bdPaint(); }
      if(d.brel!=null) return bdRel(d.brel);
      if(d.bplan!=null) return bdPlanApply();
      if(d.bplanx!=null){ BD.plan=null; return bdPaint(true); }
      if(d.bplanai!=null) return bdPlanAI();
      if(d.bout!=null) return bdOut();
      if(d.open!=null){ closeBoard(); try{ window.ovOpen && window.ovOpen(d.open) }catch(x){globalThis.__q?.(x)} }
    });
  }
  const P=r?p3(r):['','',''];
  Object.assign(BD,{ b:P[0]||'', m:P[1]||'', s:P[2]||'', q:'', pv:'', msg:'', plan:null, from:r?String(r.id):'', ck:new Set(r?[String(r.id)]:[]) });
  BD.el.querySelector('.bq').value='';
  BD.el.classList.add('on'); bdPaint();
  setTimeout(()=>BD.el.querySelector('.bq')?.focus(),40);
}
function bdSel(lv, v){
  if(lv===0){ const nv=BD.b===v?'':v; if(nv!==BD.b){ BD.m=''; BD.s=''; } BD.b=nv; }
  if(lv===1){ const nv=BD.m===v?'':v; if(nv!==BD.m) BD.s=''; BD.m=nv; }
  if(lv===2){ BD.s=BD.s===v?'':v; }
  BD.pv=''; bdPaint();
}
function bdFoot(){
  const n=BD.ck.size, [b]=bdPath(), t=bdPath().filter(Boolean);
  const g=BD.el.querySelector('[data-bput]'); if(g){ g.disabled=!(n&&b); g.textContent=`☑ ${n}개 넣기`; }
  const o=BD.el.querySelector('[data-bout]'); if(o) o.disabled=!(n&&t.length);
}
function closeBoard(){ BD.el && BD.el.classList.remove('on'); }
window.__qtBoard=openBoard;
/* 일반 보기에서도 — 등급 줄 끝에 «🗂 분류판» */
setInterval(()=>{ try{ const row=$('#tagRow'); if(row && !$('#qtBoardBtn')){ const b=document.createElement('button'); b.type='button'; b.id='qtBoardBtn';
  b.textContent='🗂 분류판'; b.title='대 › 중 › 소 유형을 나무처럼 보면서 여러 문항을 골라 한 번에 넣기';
  b.addEventListener('click', e=>{ e.stopPropagation(); let id=nowOv(); if(!$('#ovl')?.classList.contains('on')){ try{ const r=window.SHOWN&&window.SHOWN[window.ONEAT|0]; id=r?String(r.id):''; }catch(x){globalThis.__q?.(x)} } openBoard(id); });
  row.appendChild(b); } }catch(e){globalThis.__q?.(e)} }, 1500);

/* ══ ① 머리줄 단추 — ✂ 바로 오른쪽 ══ */
function mountBtn(){
  const oh=$('#ovl .oh'); if(!oh || $('#qtBtn',oh)) return;
  const cut=oh.querySelector('[data-cutsplit="ov"]'); if(!cut) return;
  const b=document.createElement('button');
  b.type='button'; b.className='qtbtn'; b.id='qtBtn';
  cut.after(b);
  b.addEventListener('click', e=>{
    e.preventDefault(); e.stopPropagation();
    const id=nowOv(); if(!id) return;
    if(POP.on && POP.id===id) return closePop();
    openPop(id, b);
  });
  paintBtn();
}
function paintBtn(){
  const b=$('#qtBtn'); if(!b) return;
  const id=nowOv(), t=id?tOf(id):'';
  const path=id?window.__qtypePath(id):['','',''], any=path.filter(Boolean);
  const n=t?(window.__qtypeGroups().get(t)||[]).length:0;
  const html=any.length ? `<span class="nm">🏷 ${esc(any.join(' › '))}</span>${n>1?`<span class="n">${n}</span>`:''}` : '<span class="nm">🏷 유형</span>';
  if(b.__h!==html){ b.__h=html; b.innerHTML=html; }
  b.classList.toggle('has', any.length>0);
  b.title = any.length ? path.map((x,i)=>`${LVN[i]}: ${x||'없음'}`).join('\n')+(t?`\n대문항이 같은 문항 ${n}개 (눌러서 바꾸기 · 번호로 연동)`:'')
              : '이 문제의 유형(대·중·소문항)을 정합니다 — 대문항이 같은 문항끼리 연동되고, 중복 묶기에서 한 덩어리가 됩니다';
}
/* 판이 다른 문항으로 넘어가면 쪽지도 따라간다 — 연달아 유형을 붙이기 좋게 */
let LASTOV='';
function follow(){
  const id=nowOv();
  if(id===LASTOV) return; LASTOV=id;
  paintBtn();
  if(POP.on){
    if(!id || !$('#ovl')?.classList.contains('on')) return closePop();
    Object.assign(POP,{ id, q:'', no:'', msg:'', pv:'', more:false, ck:new Set(), lvall:false }); render();
  }
}

/* ══ ③ 레일 ▼ ══ */
function decorate(){
  const d=dup(), on=!!(d && d.on && d.groups);
  const sh=shown();
  [['#ovrS','ovgo'],['#prail','go']].forEach(([sel,k])=>{
    const rail=$(sel); if(!rail) return;
    $$(':scope > .grpv', rail).forEach(v=>{            /* 짝 잃은 꼬리 치우기 */
      const p=v.previousElementSibling; if(!p || !p.classList.contains('pb')) v.remove();
    });
    $$(':scope > .pb', rail).forEach(b=>{
      const i=b.dataset[k]; let r=null, g=null;
      if(on && i!=null && !/[↤↦]/.test(b.textContent)){ r=sh[+i]; g=r && d.groups.get(String(r.id)); }
      let v=b.nextElementSibling; if(v && !v.classList.contains('grpv')) v=null;
      if(!g || g.length<2){ v && v.remove(); return; }
      if(!v){ v=document.createElement('button'); v.type='button'; v.className='grpv'; v.textContent='▼'; b.after(v); }
      v.dataset.grp=String(r.id);
      const mn=d.man && d.man.get(String(r.id));
      v.title=`${mn?`유형 «${mn}»`:'같은 문제'} ${g.length}문항 펼치기`;
      v.setAttribute('aria-label', v.title);
    });
  });
}
/* ★ v269 — 레일이 번호 단추를 그릴 때 이걸 같이 붙인다(나중에 끼우면 뒤 단추들이 옆으로 튄다) */
window.__grpTail=r=>{
  const d=dup(); if(!d || !d.on || !d.groups || !r) return '';
  const g=d.groups.get(String(r.id)); if(!g || g.length<2) return '';
  const mn=d.man && d.man.get(String(r.id));
  const t=`${mn?`유형 «${mn}»`:'같은 문제'} ${g.length}문항 펼치기`;
  return `<button type="button" class="grpv" data-grp="${esc(r.id)}" title="${esc(t)}" aria-label="${esc(t)}">▼</button>`;
};
let GP=null, GPA=null;
function openGrp(anchor, rep){
  const d=dup(); const g=d && d.groups && d.groups.get(String(rep)); if(!g) return;
  if(!GP){
    GP=document.createElement('div'); GP.className='grppop'; GP.setAttribute('role','menu'); document.body.appendChild(GP);
    GP.addEventListener('click', e=>{
      const b=e.target.closest('[data-gid]'); if(!b) return;
      closeGrp(); go(b.dataset.gid);
    });
  }
  const mn=d.man && d.man.get(String(rep)), cur=nowOv();
  GP.innerHTML=`<div class="t">${mn?`🏷 ${esc(mn)}`:'⧉ 같은 문제'} · ${g.length}문항</div>`
    + g.map((r,i)=>`<button type="button" class="g${String(r.id)===cur?' now':''}" data-gid="${r.id}" style="--i:${i}" role="menuitem">
        <span class="dot${r.easy_md?'':' no'}" title="${r.easy_md?'해설 있음':'해설 없음'}"></span>${esc(full(r))}${String(r.id)===String(rep)?'<small>대표</small>':''}</button>`).join('');
  GP.classList.remove('on'); void GP.offsetWidth; GP.classList.add('on');   /* 다시 누르면 움직임도 다시 */
  const a=anchor.getBoundingClientRect(), w=GP.offsetWidth;
  GP.style.left=Math.min(Math.max(8,a.right-w), innerWidth-w-8)+'px';
  const below=a.bottom+5, h=GP.offsetHeight;
  GP.style.top=(below+h<innerHeight-8 ? below : Math.max(8,a.top-h-5))+'px';
  GPA && GPA.classList.remove('open'); GPA=anchor; anchor.classList.add('open');
}
function closeGrp(){ GP && GP.classList.remove('on'); GPA && GPA.classList.remove('open'); GPA=null; }
function go(id){
  const sh=shown(), i=sh.findIndex(x=>String(x.id)===String(id));
  const ovOn=!!$('#ovl')?.classList.contains('on');
  try{
    if(i>=0 && document.body.classList.contains('oneup') && typeof window.showAt==='function') window.showAt(i);
    if(ovOn || i<0) window.ovOpen && window.ovOpen(id);   /* 접혀 있는 문항은 목록에 없으니 한눈에로 */
  }catch(e){globalThis.__q?.(e)}
}

/* ══ 이벤트 ══ */
document.addEventListener('click', e=>{
  const v=e.target.closest && e.target.closest('.grpv');
  if(v){ e.preventDefault(); e.stopPropagation();
    if(GPA===v && GP && GP.classList.contains('on')) return closeGrp();
    return openGrp(v, v.dataset.grp); }
}, true);
document.addEventListener('pointerdown', e=>{
  const t=e.target;
  if(GP && GP.classList.contains('on') && !GP.contains(t) && !(t.closest && t.closest('.grpv'))) closeGrp();
  if(POP.on && PEL && !PEL.contains(t) && !(t.closest && t.closest('#qtBtn,#ovrail,#pxPick,.grpv,.grppop'))) closePop();
}, true);
addEventListener('keydown', e=>{
  if(e.key!=='Escape') return;
  if(GP && GP.classList.contains('on')){ e.preventDefault(); e.stopImmediatePropagation(); return closeGrp(); }
  if(POP.on){ e.preventDefault(); e.stopImmediatePropagation(); return closePop(); }
}, true);
addEventListener('resize', ()=>{ place(); closeGrp(); });
document.addEventListener('scroll', e=>{ if(GP && GP.classList.contains('on') && e.target && e.target.id==='ovrS') closeGrp(); }, true);

/* 레일은 수시로 다시 그려진다 — 바로 아래 자식이 바뀌면 꼬리를 다시 붙인다 */
let rafD=0;
const soon=()=>{ if(rafD) return; rafD=requestAnimationFrame(()=>{ rafD=0; try{ decorate() }catch(e){globalThis.__q?.(e)} }); };
['#ovrS','#prail'].forEach(sel=>{
  const w=setInterval(()=>{ const n=$(sel); if(!n) return; clearInterval(w);
    new MutationObserver(soon).observe(n,{ childList:true }); soon(); }, 400);
  setTimeout(()=>clearInterval(w), 30000);
});

setInterval(()=>{
  const s=curSid();
  if(s && LOCALSID!==s){ LOCALSID=s; if(applyLocal()) changed(); }
  if(s && SYNCED!==s) sync();
  mountBtn(); follow(); paintBtn(); decorate();
}, 1500);
/* 다른 기기에서 바꿨을 수 있다 — 탭으로 돌아오면 1분에 한 번까지만 다시 묻는다 */
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden || Date.now()-LASTV<60000) return;
  LASTV=Date.now(); sync(true);
});
setTimeout(()=>{ mountBtn(); paintBtn(); }, 900);
/* ★ v269 — 쪽지를 연 채 다른 문항으로 가면 «바로» 따라간다.
   여태 1.5초 시계에만 기대서, 그 사이에 친 유형이 앞 문항에 붙을 수 있었다. */
(function watchTitle(){
  const t=$('#ovTitle'); if(!t) return void setTimeout(watchTitle,500);
  new MutationObserver(()=>{ try{ follow() }catch(e){globalThis.__q?.(e)} })
    .observe(t,{ childList:true, characterData:true, subtree:true });
})();
})();
