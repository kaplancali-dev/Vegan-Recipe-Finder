/**
 * SW Bootstrap — registers the caching service worker.
 *
 * Updates happen silently: when a new version is deployed, the new SW
 * installs in the background and takes control on the user's next page
 * load. No banner, no interruption — they just see the fresh version
 * the next time they open HARVEST.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js')
      .then(function (reg) {
        // Periodically check for new versions in the background.
        // The browser will install any new SW it finds and activate
        // it on the next full page load.
        setInterval(function () { reg.update(); }, 30 * 60 * 1000);
      })
      .catch(function (err) {
        console.warn('SW registration failed:', err);
      });
  });
})();
