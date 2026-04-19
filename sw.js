// 🌿 HARVEST — Service Worker
const VERSION = "vrf-20260419p";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;
  // Only cache same-origin GET requests with http(s) scheme
  if (e.request.method !== 'GET' || (!url.startsWith('http://') && !url.startsWith('https://'))) return;
  // Skip chrome-extension, Supabase auth, and analytics
  if (url.includes('chrome-extension') || url.includes('supabase') || url.includes('analytics')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Only cache successful, complete responses
        if (response.ok && response.status === 200 && response.type !== 'opaque') {
          const copy = response.clone();
          caches.open(VERSION).then(cache => {
            try { cache.put(e.request, copy); } catch(err) {}
          });
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
