/**
 * SW Bootstrap — registers the caching service worker.
 * Loaded before the app bundle so SW installs early.
 *
 * When a new version is deployed and the SW updates,
 * shows a toast prompting the user to refresh.
 */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js')
        .then(function (reg) {
          // Check for updates every 30 minutes
          setInterval(function () { reg.update(); }, 30 * 60 * 1000);

          // Listen for a new SW waiting to activate
          reg.addEventListener('updatefound', function () {
            var newSW = reg.installing;
            if (!newSW) return;
            newSW.addEventListener('statechange', function () {
              // New SW is active and the old one is replaced
              if (newSW.state === 'activated' && navigator.serviceWorker.controller) {
                showUpdateToast();
              }
            });
          });
        })
        .catch(function (err) {
          console.warn('SW registration failed:', err);
        });

      // Also catch the controller change event (covers skipWaiting path)
      var refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        // Only show toast if this isn't the first SW install
        if (refreshing) return;
        if (navigator.serviceWorker.controller) {
          showUpdateToast();
        }
      });

      function showUpdateToast() {
        // Build a small fixed banner at the top of the screen
        var banner = document.createElement('div');
        banner.setAttribute('role', 'alert');
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;' +
          'background:#2d6a4f;color:#fff;padding:14px 20px;text-align:center;' +
          'font-family:system-ui,sans-serif;font-size:0.92rem;font-weight:600;' +
          'display:flex;align-items:center;justify-content:center;gap:12px;' +
          'box-shadow:0 2px 12px rgba(0,0,0,0.2);';
        banner.innerHTML =
          '<span>✨ HARVEST just got better!</span>' +
          '<button id="swRefreshBtn" style="background:#fff;color:#2d6a4f;border:none;' +
          'padding:8px 18px;border-radius:20px;font-weight:700;font-size:0.85rem;cursor:pointer;">' +
          'Refresh Now</button>';
        document.body.appendChild(banner);

        document.getElementById('swRefreshBtn').addEventListener('click', function () {
          refreshing = true;
          window.location.reload();
        });
      }
    });
  }
})();
