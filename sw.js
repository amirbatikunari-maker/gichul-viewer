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
const SHELL = "shell-v233", DATA = "data-v2", IMG = "img-v1";
const FILES = ["./","./index.html","./config.js","./ai-chat.js","./ai-viewer.js","./ai-explain.js","./ncs-gijun.js","./music.js","./manifest.json","./icon.svg","./practice.html","./calc.html","./upload.html","./ingest.html","./interview.html","./portfolio.html","./app-enhance.css","./app-enhance.js","./calc-engine.js","./explain-batch.html","./storage-clean.html","./review.html","./simple.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== SHELL && k !== DATA && k !== IMG).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
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
  if (url.pathname.includes("/rest/v1/")) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(DATA).then(c => c.put(e.request, copy));
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
  if (isHTML && url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) caches.open(SHELL).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
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
