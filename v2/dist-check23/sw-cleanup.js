/**
 * SW Bootstrap — registers the caching service worker (sw.js).
 *
 * sw.js handles:
 *  - cache-first for Supabase recipe images (massive bandwidth savings)
 *  - cache-first for hashed CSS/JS assets (immutable URLs by hash)
 *  - network-first for HTML/manifest so deploys take effect on next visit
 *  - skips caching Supabase API/auth calls (always live)
 *
 * Background update check runs every 30 minutes; the browser installs
 * any new SW it finds and activates it on the user's next page load.
 *
 * History: this file used to UNREGISTER service workers as a transition
 * safeguard during the v2 rewrite. That's no longer needed and was
 * causing every visit to re-download all images from Supabase, which
 * drove free-tier bandwidth way past quota.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js')
      .then(function (reg) {
        // Periodically check for new versions in the background.
        setInterval(function () { reg.update(); }, 30 * 60 * 1000);
      })
      .catch(function (err) {
        console.warn('SW registration failed:', err);
      });
  });
})();
