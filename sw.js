// 🌿 HARVEST — Service Worker
const VERSION = "vrf-20260419g";

self.addEventListener("install", e => {
  self.skipWaiting(); // activate immediately
});

self.addEventListener("activate", e => {
  // Clear any old caches from previous versions
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Network-first: always try to get fresh content, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const copy = response.clone();
        caches.open(VERSION).then(cache => cache.put(e.request, copy));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
