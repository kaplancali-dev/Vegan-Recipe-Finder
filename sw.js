/**
 * HARVEST — Caching Service Worker
 *
 * Strategies:
 *  - App shell (HTML, CSS, JS): cache-first with version-based invalidation
 *  - Recipe images (Supabase): cache-first, persistent across versions
 *  - Supabase API calls: network-only (live sync data)
 *  - Everything else: network-first with cache fallback
 */

const CACHE_VERSION = 'harvest-moqcx638';
const IMG_CACHE    = 'harvest-images';

// App shell — updated by the build step (hashes change each deploy)
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './apple-touch-icon.png',
  './favicon.png',
  './hero.mp4',
];

/* ── Install: pre-cache app shell ──────────────────────────────── */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: clean old version caches ────────────────────────── */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k !== IMG_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: route by request type ──────────────────────────────── */

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and Supabase API calls (auth, sync, storage uploads)
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co') && url.pathname.startsWith('/rest/')) return;
  if (url.hostname.includes('supabase.co') && url.pathname.startsWith('/auth/')) return;

  // Recipe images from Supabase storage — cache-first, persistent
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/recipe-images/')) {
    event.respondWith(cacheFirst(event.request, IMG_CACHE));
    return;
  }

  // Hashed assets (CSS/JS with content hash in filename) — cache-first
  if (url.pathname.startsWith('/assets/') && /\.[a-zA-Z0-9]{8,}\.(js|css)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request, CACHE_VERSION));
    return;
  }

  // Everything else (HTML, manifest, etc.) — network-first with cache fallback
  event.respondWith(networkFirst(event.request, CACHE_VERSION));
});

/* ── Cache strategies ──────────────────────────────────────────── */

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
    // Offline and not cached — return a simple fallback
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // If it's a navigation request, return the cached index.html (SPA fallback)
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
