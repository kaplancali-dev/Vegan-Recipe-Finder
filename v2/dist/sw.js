/**
 * HARVEST — Service Worker kill-switch.
 *
 * Clears ALL caches and unregisters itself so future loads
 * go straight to the network. No fetch interception.
 */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
