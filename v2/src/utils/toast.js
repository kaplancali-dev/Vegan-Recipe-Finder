/**
 * Toast notification utility.
 * Extracted from main.js to avoid circular imports.
 */

let _toastTimer = null;

/**
 * Show a toast notification.
 * @param {string} msg - Message to display (plain text)
 * @param {number} [ms=2500] - Duration in ms
 */
export function showToast(msg, ms = 2500) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
