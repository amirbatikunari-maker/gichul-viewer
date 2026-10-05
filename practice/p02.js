/* practice.html 에서 분리 (v341) — 원래 1306번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

/* ══════════════════════════════════════════════════════════════
   «한눈에» 를 층으로 나눈다 (v117)
   ──────────────────────────────────────────────────────────────
   한눈에 판에는 여러 겹이 얹혀 있고, 어느 겹이 멎게 하는지 밖에서는 안 보였다.
   그래서 겹마다 스위치를 단다. 기본은 «가벼운 것만 켜짐» 이다.
   도구 › 한눈에 기능 에서 하나씩 켜며 검증할 수 있다.
   ══════════════════════════════════════════════════════════════ */
(function(){
  const KEY='prac:ovlayers:v4';   /* v3→v4: fig(그림 채우기)를 기본으로 켠다 — 이건
                                      무거운 실험 기능이 아니라 그냥 «그림을 보여준다» 라서
                                      끄여 있을 이유가 없었다(그래서 한눈에서만 그림이
                                      «오려 오는 중…» 에 계속 멈춰 있었다). ann(형광펜)도
                                      다시 켠다 — 그때 크래시 원인은 ann이 아니라
                                      ResizeObserver 쪽이었고 그건 이미 고쳤다(v174). */
  /* 처음 값 */
  const DEF={ rail:true, dock:true, swipe:false, back:false,
              ann:true, squeeze:false, fig:true, ai:false };
  let V=Object.assign({},DEF);
  try{ V=Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}')) }catch(e){globalThis.__q?.(e)}
  window.OVL={
    get:k=>!!V[k],
    all:()=>Object.assign({},V),
    set(k,on){ V[k]=!!on; try{ localStorage.setItem(KEY,JSON.stringify(V)) }catch(e){globalThis.__q?.(e)}
      document.body&&paint(); },
    reset(){ V=Object.assign({},DEF); try{ localStorage.setItem(KEY,JSON.stringify(V)) }catch(e){globalThis.__q?.(e)} paint(); },
    KEY, DEF
  };
  function paint(){
    const b=document.body; if(!b) return;
    Object.keys(V).forEach(k=>b.classList.toggle('ovl-'+k, !!V[k]));
  }
  window.OVLPAINT=paint;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',paint);
  else paint();
})();
const OVFLAG = k => { try{ return window.OVL ? window.OVL.get(k) : true }catch(e){ return true } };

/* ══════════════════════════════════════════════════════════════
   감시자 폭주 끊기 (storm breaker)
   ──────────────────────────────────────────────────────────────
   화면이 «통째로» 멎는 멈춤은 거의 다 이 꼴이다 —
   감시자가 무언가를 고치고, 그 고침이 자기를 다시 깨우고, 또 고치고 …
   MutationObserver 의 알림은 «마이크로태스크» 라서, 이 고리가 돌기 시작하면
   화면 그리기도 · 손가락도 · 심지어 주소창 이동까지 끼어들 틈이 없다.
   (다른 사이트로 못 넘어가는 것이 그 증거다.)

   그래서 모든 감시자를 한 겹 감싼다. 1초에 400번 넘게 깨어나면
   그 감시자를 «끊고», 어떤 코드였는지 이름을 남긴다.
   기능 하나를 잃는 것이 화면이 죽는 것보다 낫다.
   ══════════════════════════════════════════════════════════════ */
(function(){
  const Native=window.MutationObserver;
  if(!Native||Native.__guarded) return;
  window.__moStorm=[];
  function Guarded(cb){
    let n=0,t0=0;
    const inst=new Native(function(recs,obs){
      const now=Date.now();
      if(now-t0>1000){ t0=now; n=0; }
      if(++n>400){
        try{ obs.disconnect() }catch(e){globalThis.__q?.(e)}
        const src=String(cb).replace(/\s+/g,' ').slice(0,140);
        window.__moStorm.push(src);
        try{ console.error('[감시자 폭주] 끊었습니다 →',src) }catch(e){globalThis.__q?.(e)}
        try{ const el=document.getElementById('cvStat');
          if(el) el.textContent='⚠ 감시자 하나가 폭주해 끊었습니다 — '+src.slice(0,70); }catch(e){globalThis.__q?.(e)}
        return;
      }
      return cb.call(this,recs,obs);
    });
    return inst;
  }
  Guarded.prototype=Native.prototype;
  Guarded.__guarded=1;
  window.MutationObserver=Guarded;
})();
