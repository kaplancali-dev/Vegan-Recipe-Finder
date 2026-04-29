/**
 * SW Bootstrap — registers the caching service worker.
 * Loaded before the app bundle so SW installs early.
 */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js')
        .then(function (reg) {
          // Check for updates every 30 minutes
          setInterval(function () { reg.update(); }, 30 * 60 * 1000);
        })
        .catch(function (err) {
          console.warn('SW registration failed:', err);
        });
    });
  }
})();
