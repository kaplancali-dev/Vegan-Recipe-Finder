/**
 * Rating — 5-star rating popup and cook-confirm dialog.
 *
 * showRating()      → 5-star overlay, resolves 1–5 or 0 (skip).
 * showCookConfirm() → "Log again / Undo" chooser when recipe
 *                     was already cooked. Resolves 'log' | 'undo' | 'cancel'.
 */

/**
 * Show the star-rating popup and return a Promise<number>.
 * Resolves with 1–5 if the user picks stars, or 0 if they skip.
 * @returns {Promise<number>}
 */
export function showRating() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'rate-overlay';

    overlay.innerHTML = `
      <div class="rate-card">
        <div class="rate-title">How was it?</div>
        <div class="rate-stars">
          <span class="rate-star" data-star="1">★</span>
          <span class="rate-star" data-star="2">★</span>
          <span class="rate-star" data-star="3">★</span>
          <span class="rate-star" data-star="4">★</span>
          <span class="rate-star" data-star="5">★</span>
        </div>
        <button class="rate-skip" data-rate-skip>Skip</button>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('show'));
    });

    function dismiss(rating) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 250);
      resolve(rating);
    }

    const stars = overlay.querySelectorAll('.rate-star');
    function highlightUpTo(n) {
      stars.forEach((s, i) => s.classList.toggle('on', i < n));
    }

    overlay.addEventListener('pointerenter', (e) => {
      const star = e.target.closest('[data-star]');
      if (star) highlightUpTo(Number(star.dataset.star));
    }, true);

    overlay.addEventListener('pointerleave', (e) => {
      const star = e.target.closest('[data-star]');
      if (star) highlightUpTo(0);
    }, true);

    overlay.addEventListener('click', (e) => {
      const star = e.target.closest('[data-star]');
      if (star) {
        const val = Number(star.dataset.star);
        highlightUpTo(val);
        setTimeout(() => dismiss(val), 200);
        return;
      }

      if (e.target.closest('[data-rate-skip]')) {
        dismiss(0);
        return;
      }

      if (!e.target.closest('.rate-card')) {
        dismiss(0);
      }
    });
  });
}

/**
 * Show a chooser when the recipe already has a cook entry.
 * Resolves with 'log' (cook again), 'undo' (remove last), or 'cancel'.
 * @param {string} dateStr - Human-readable date of last cook (e.g. "4/23")
 * @returns {Promise<'log'|'undo'|'cancel'>}
 */
export function showCookConfirm(dateStr) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'rate-overlay';

    overlay.innerHTML = `
      <div class="rate-card">
        <div class="rate-title">You made this on ${dateStr}</div>
        <button class="cook-confirm-btn cook-confirm-log" data-confirm="log">Log again</button>
        <button class="cook-confirm-btn cook-confirm-undo" data-confirm="undo">Undo last entry</button>
        <button class="rate-skip" data-confirm="cancel">Cancel</button>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('show'));
    });

    function dismiss(action) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 250);
      resolve(action);
    }

    overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-confirm]');
      if (btn) {
        dismiss(btn.dataset.confirm);
        return;
      }

      if (!e.target.closest('.rate-card')) {
        dismiss('cancel');
      }
    });
  });
}

/**
 * Build a star display string for a given rating (1–5).
 * Returns empty string if rating is 0 or falsy.
 * @param {number} rating
 * @returns {string}
 */
export function starsHTML(rating) {
  if (!rating) return '';
  const filled = '★'.repeat(rating);
  const empty = '☆'.repeat(5 - rating);
  return `<span class="stars-display">${filled}${empty}</span>`;
}
