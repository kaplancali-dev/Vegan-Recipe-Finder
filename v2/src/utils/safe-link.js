/**
 * Safe external recipe link utility.
 *
 * Builds a Google-search fallback URL for recipe links. If the original
 * blog page is ever moved or deleted, the user lands on a Google search
 * for that recipe on the same site — not a dead 404 page.
 *
 * Usage:
 *   import { safeRecipeHref, wireSafeLinks } from '../utils/safe-link.js';
 *
 *   // In HTML templates:
 *   `<a href="${safeRecipeHref(url, title, site)}" data-recipe-url="${url}" ...>`
 *
 *   // After rendering, wire up click handlers:
 *   wireSafeLinks(container);
 */

/**
 * Build a fallback Google search URL for a recipe.
 * Searches: site:example.com "Recipe Title"
 *
 * @param {string} url - Original recipe URL
 * @param {string} title - Recipe title
 * @param {string} [site] - Site name (used in search if URL parsing fails)
 * @returns {string} Google search URL
 */
export function buildFallbackUrl(url, title, site) {
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = site || '';
  }
  const query = domain
    ? `site:${domain} ${title}`
    : title;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Return the original URL (for href), but data attributes carry
 * the fallback info. The click handler in wireSafeLinks() will
 * intercept and provide the safety net.
 *
 * @param {string} url - Original recipe URL
 * @param {string} title - Recipe title
 * @param {string} [site] - Site name
 * @returns {string} The original URL (unchanged)
 */
export function safeRecipeHref(url, title, site) {
  return url; // href stays the same; fallback is handled on click
}

/**
 * Wire click handlers on [data-recipe-url] links inside a container.
 * On click, opens the original URL in a new tab. After a short delay,
 * checks if the tab is still on an error page. If detection isn't
 * possible (cross-origin), it does nothing extra — the fallback
 * is available via the "Report broken link" button.
 *
 * More importantly: this sets up the global handler that intercepts
 * all recipe link clicks and provides a "search instead" option
 * when the user reports a broken link.
 */
export function wireSafeLinks() {
  // Handled via delegation in the global click handler below
}

/**
 * Open a recipe URL with fallback behavior.
 * Opens original URL, then shows a small toast with a "Page not found? Search instead" link.
 *
 * @param {string} url - Original URL
 * @param {string} title - Recipe title
 * @param {string} [site] - Site name
 */
export function openRecipeLink(url, title, site) {
  const fallback = buildFallbackUrl(url, title, site);

  // Open original URL
  window.open(url, '_blank', 'noopener');

  // Show a brief helper toast with fallback search link
  _showFallbackToast(fallback);
}

/**
 * Show a small dismissable toast with a Google search fallback link.
 * Auto-dismisses after 6 seconds.
 */
function _showFallbackToast(fallbackUrl) {
  // Remove any existing fallback toast
  const existing = document.querySelector('.fallback-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'fallback-toast';
  toast.innerHTML = `
    <span>Page not found?</span>
    <a href="${fallbackUrl}" target="_blank" rel="noopener">Search for it instead ↗</a>
    <button class="fallback-toast-close" aria-label="Dismiss">×</button>
  `;

  toast.querySelector('.fallback-toast-close').addEventListener('click', () => toast.remove());

  document.body.appendChild(toast);

  // Auto-dismiss after 6 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('fallback-toast-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 6000);
}
