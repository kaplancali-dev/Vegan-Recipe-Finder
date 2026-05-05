/**
 * HARVEST — Image-Only Caching Service Worker
 *
 * Strategy: cache the heavy stuff (Supabase recipe images) so we don't
 * burn bandwidth re-downloading them, but leave everything else
 * (HTML, CSS, JS, recipe data, API calls) uncached so deploys take
 * effect on the next visit and dev iteration stays snappy.
 *
 * Why this trade-off: at <5 users, fast iteration matters more than
 * peak optimization. Image caching alone covers ~90% of bandwidth
 * since recipes.json is gzipped and code bundles are small relative
 * to images.
 */

const IMG_CACHE = 'harvest-images-v1';

/* ── Install: take over immediately ────────────────────────────── */

self.addEventListener('install', (event) => {
  // Skip waiting so the new SW activates without requiring a second visit
  event.waitUntil(self.skipWaiting());
});

/* ── Activate: clean up any stale caches from old versions ─────── */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== IMG_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: only intercept Supabase recipe images ──────────────── */

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache-first for Supabase recipe image storage
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/recipe-images/')) {
    event.respondWith(cacheFirst(event.request, IMG_CACHE));
    return;
  }

  // Everything else: don't intercept — let the browser handle it normally.
  // (No event.respondWith() means the browser handles the request natively,
  // which means HTML/JS/CSS deploys appear immediately on next visit.)
});

/* ── Cache strategy ────────────────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
