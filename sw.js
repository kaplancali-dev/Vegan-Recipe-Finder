// Kill-switch service worker — clears all caches and unregisters itself.
// Deployed to replace the v1 caching SW so the browser fetches fresh assets.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => caches.delete(name)))
    ).then(() => self.clients.matchAll()).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
      return self.registration.unregister();
    })
  );
});
