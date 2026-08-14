/* 오프라인 대비: 앱 껍데기는 캐시 우선, 데이터는 네트워크 우선 + 캐시 백업 */
const SHELL = "shell-v1", DATA = "data-v1";
const FILES = ["./","./index.html","./config.js","./manifest.json","./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

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
  // 나머지(HTML/CSS/폰트/CDN)
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok && (url.origin === location.origin || url.host.includes("jsdelivr") || url.host.includes("gstatic")))
        caches.open(SHELL).then(c => c.put(e.request, r.clone()));
      return r;
    }).catch(() => hit || new Response("", { status: 504 })))
  );
});
