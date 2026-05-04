/**
 * SW Cleanup — stable-URL script that runs before the app bundle.
 * Unregisters any service workers and clears all caches so stale
 * builds never block fresh content from loading.
 */
(function () {
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (reg) { reg.unregister(); });
    });
  }
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(function (keys) {
      keys.forEach(function (key) { caches.delete(key); });
    });
  }
})();
