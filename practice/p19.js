/* practice.html 에서 분리 (v341) — 원래 11214번째 줄의 <script>. 실행 순서가 중요함 — practice.html 의 자리 그대로 둘 것 */

(function(){
'use strict';
/* 이 브라우저가 «그림 속 도려내기» 를 아는가 (크롬 104+) */
const OVB = (() => { try{ return CSS.supports('object-view-box','inset(0% 0% 0% 0%)'); }catch(e){ return false; } })();
window.__cropOVB = OVB;

const hostOf = im => im.closest('.tw, .pz, .imgbox');
const pc = v => (v * 100).toFixed(3);

/* 여백 자르기 창을 끄고 켠다 */
window.__cropUntrim = function(im){ const h = hostOf(im); if(h) h.classList.add('cropwin'); };
window.__cropRetrim = function(im){ const h = hostOf(im); if(h) h.classList.remove('cropwin'); };

/* ★ 자른 자리를 그린다 — 이것 하나만 쓴다 (v102 · v111 이 같이 부른다) */
window.__cropPaint = function(im, b){
  if(!im) return;
  const clear = () => {
    im.style.removeProperty('object-view-box');
    im.style.removeProperty('object-fit');
    im.style.removeProperty('aspect-ratio');
    im.style.removeProperty('clip-path');
    im.style.removeProperty('margin');
    im.classList.remove('cropfit');
  };
  if(!b || !(b.w > 0) || !(b.h > 0)){ clear(); window.__cropRetrim(im); return; }

  window.__cropUntrim(im);                      /* 둘이 같은 그림을 다투지 않게 */

  if(OVB){
    /* 자리는 하나도 안 건드린다 — 그림 «속» 만 도려낸다 */
    im.style.removeProperty('clip-path');
    im.style.removeProperty('margin');
    im.style.objectViewBox = `inset(${pc(b.t)}% ${pc(1-b.l-b.w)}% ${pc(1-b.t-b.h)}% ${pc(b.l)}%)`;
    im.style.objectFit = 'contain';
    const nw = im.naturalWidth || 0, nh = im.naturalHeight || 0;
    if(nw && nh) im.style.aspectRatio = `${(nw*b.w).toFixed(3)} / ${(nh*b.h).toFixed(3)}`;
    else im.addEventListener('load', () => window.__cropPaint(im, b), { once:true });
    im.classList.add('cropfit');
    return;
  }

  /* 옛 브라우저 — 예전 방식으로 가리되, 창을 끈 뒤라 밀려 나가지는 않는다 */
  const W = im.offsetWidth, H = im.offsetHeight;
  if(!W || !H){ im.addEventListener('load', () => window.__cropPaint(im, b), { once:true }); return; }
  im.style.clipPath = `inset(${pc(b.t)}% ${pc(1-b.l-b.w)}% ${pc(1-b.t-b.h)}% ${pc(b.l)}%)`;
  im.style.margin = `${(-(b.t*H)).toFixed(1)}px ${(-((1-b.l-b.w)*W)).toFixed(1)}px `
                  + `${(-((1-b.t-b.h)*H)).toFixed(1)}px ${(-(b.l*W)).toFixed(1)}px`;
  im.classList.add('cropfit');
};
})();
