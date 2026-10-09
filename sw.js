/* 오프라인 대비: 앱 껍데기는 캐시 우선, 데이터는 네트워크 우선 + 캐시 백업
   ★ HTML 페이지(index/upload/ingest 등)는 네트워크를 먼저 시도한다.
     예전 버전은 "일단 캐시된 걸 보여주고 끝"이라 새 배포가 반영 안 됐다.
     지금은 "새 버전을 먼저 받아보고, 인터넷이 끊겼을 때만 캐시로 대신한다".

   ★ v233 — Supabase 이미지 전용 캐시(IMG)를 새로 뒀다.
     예전에는 저장 조건이 «내 사이트 · jsdelivr · gstatic» 뿐이라
     supabase.co 이미지는 캐시에 들어가지도 못하고 매번 새로 받았다.
     그게 한 달 전송량 12GB 의 원인이었다.
     IMG 캐시는 앱 판번호를 올려도 지우지 않는다 — 파일명이 고정이라
     내용이 바뀔 일이 없기 때문. (그림을 갈아끼웠으면 아래 IMG 를 img-v2 로.) */
const SHELL = "shell-v347", DATA = "data-v3", IMG = "img-v1";
const FILES = ["./","./index.html","./config.js","./ai-chat.js","./ai-viewer.js","./ai-explain.js","./ncs-gijun.js","./music.js","./manifest.json","./icon.svg","./favicon.ico","./favicon-32.png","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./practice.html","./calc.html","./upload.html","./ingest.html","./interview.html","./portfolio.html","./app-enhance.css","./app-enhance.js","./calc-engine.js","./explain-batch.html","./storage-clean.html","./review.html","./simple.js"];
/* ★ v341 — practice.html 에서 떼어 낸 스크립트들 (tools/bump.sh 가 목록을 다시 만듦) */
const PRACTICE_JS = ["./practice/p01.js","./practice/p02.js","./practice/p03.js","./practice/p04.js","./practice/p05.js","./practice/p06.js","./practice/p07.js","./practice/p08.js","./practice/p09.js","./practice/p10.js","./practice/p11.js","./practice/p12.js","./practice/p13.js","./practice/p14.js","./practice/p15.js","./practice/p16.js","./practice/p17.js","./practice/p18.js","./practice/p19.js","./practice/p20.js","./practice/p21.js","./practice/p22.js","./practice/p23.js","./practice/p24.js","./practice/p25.js","./practice/p26.js","./practice/p27.js","./practice/p28.js","./practice/p29.js","./practice/p30.js","./practice/p31.js","./practice/p32.js","./practice/p33.js","./practice/p34.js","./practice/p35.js","./practice/p36.js","./practice/p37.js","./practice/p38.js","./practice/p39.js","./practice/p40.js","./practice/p41.js","./practice/p42.js","./practice/p43.js","./practice/p44.js","./practice/p45.js","./practice/p46.js","./practice/p47.js","./practice/p48.js","./practice/p49.js","./practice/p50.js","./practice/p51.js","./practice/p52.js","./practice/p53.js","./practice/p54.js","./practice/p55.js","./practice/p56.js","./practice/p57.js","./practice/p58.js","./practice/p59.js","./practice/p60.js","./practice/p61.js","./practice/p62.js","./practice/p63.js","./practice/p64.js","./practice/p65.js","./practice/p66.js","./practice/p67.js","./practice/p68.js","./practice/p69.js","./practice/p70.js"];
FILES.push(...PRACTICE_JS);

/* ★ v235 — 한 파일이라도 못 받으면 addAll 은 통째로 실패하고,
   그러면 서비스워커가 아예 안 깔린다(= 그림 캐시도 안 돈다).
   한 장씩 담고, 실패한 것은 그냥 넘어간다. */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});
/* ★ v235 — 그림 캐시는 한 번도 줄어든 적이 없다.
   문제를 다시 잘라 올리면 주소 뒤 ?t= 값이 바뀌어 «새 그림» 으로 또 담기므로,
   쓰지 않는 옛 판이 기기 안에 계속 쌓인다. 오래된 것부터 잘라 낸다. */
const IMG_MAX = 2500;
async function trimImg(){
  try{
    const c = await caches.open(IMG);
    const ks = await c.keys();
    if(ks.length <= IMG_MAX) return;
    await Promise.all(ks.slice(0, ks.length - IMG_MAX).map(k => c.delete(k)));
  }catch(e){globalThis.__q?.(e)}
}
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== SHELL && k !== DATA && k !== IMG).map(k => caches.delete(k)))
  ).then(trimImg).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // ★ Supabase Storage 그림: 한 번 받으면 계속 그것만 쓴다.
  //   2026_1_05_q.jpg 처럼 이름이 고정이라 다시 받을 이유가 없다.
  if (url.pathname.includes("/storage/v1/object/")) {
    e.respondWith(
      caches.open(IMG).then(c =>
        c.match(e.request).then(hit =>
          hit || fetch(e.request).then(r => {
            if (r.ok) c.put(e.request, r.clone());
            return r;
          }).catch(() => new Response("", { status: 504 }))
        )
      )
    );
    return;
  }

  // Supabase 조회 결과: 온라인이면 새로 받고, 오프라인이면 마지막으로 본 것을 보여준다
  //
  // ★ v235 — 큰 답은 캐시에 넣지 않는다.
  //   문항 표 전체(수 MB)까지 여기 쌓이면서 브라우저 저장공간을 갉아먹었다.
  //   그 자료는 이제 앱이 IndexedDB 에 따로 들고 있으므로 여기 또 둘 이유가 없다.
  //   작은 조회(과목·표시·자료함)만 오프라인 대비로 남긴다.
  if (url.pathname.includes("/rest/v1/")) {
    const MAX = 512 * 1024;
    e.respondWith(
      fetch(e.request).then(r => {
        const len = +(r.headers.get("content-length") || 0);
        if (r.ok && len && len <= MAX) {
          const copy = r.clone();
          caches.open(DATA).then(c => c.put(e.request, copy));
        }
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // ★ HTML 페이지(주소창에 바로 치고 들어가는 문서)는 네트워크가 먼저다.
  //   새 배포가 있으면 그걸 보여주고, 끊겼을 때만 예전 캐시로 대신한다.
  const isHTML = e.request.mode === "navigate" ||
                 url.pathname.endsWith(".html") ||
                 url.pathname === "/" || url.pathname.endsWith("/");
  /* ★ v341 — practice/*.js 는 practice.html 과 «한 몸» 이다. HTML 은 새 판, 스크립트는 옛 판이면
     서로 안 맞아 화면이 깨지므로, HTML 과 똑같이 네트워크 먼저 · 끊겼을 때만 캐시로 한다. */
  const isPracticeJS = url.origin === location.origin && /\/practice\/[^/]+\.js$/.test(url.pathname);
  if ((isHTML || isPracticeJS) && url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) caches.open(SHELL).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => caches.match(e.request).then(hit => hit || (isPracticeJS ? new Response("", { status: 504 }) : caches.match("./index.html"))))
    );
    return;
  }

  // 나머지(CSS/JS/폰트/CDN)는 캐시 우선 — 이런 건 자주 안 바뀌니 빠른 게 이득
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok && (url.origin === location.origin || url.host.includes("jsdelivr") || url.host.includes("gstatic")))
        caches.open(SHELL).then(c => c.put(e.request, r.clone()));
      return r;
    }).catch(() => hit || new Response("", { status: 504 })))
  );
});
