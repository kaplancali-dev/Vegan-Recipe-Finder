/**
 * Rating — 5-star rating popup for "I Made This".
 *
 * Shows a compact overlay with 5 tappable stars. Returns the
 * selected rating (1–5) or 0 if skipped. Uses event delegation
 * and CSS classes from theme.css.
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

    // Fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add('show'));
    });

    function dismiss(rating) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 250);
      resolve(rating);
    }

    // Hover/touch preview
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
        // Brief pause so the user sees their selection
        setTimeout(() => dismiss(val), 200);
        return;
      }

      if (e.target.closest('[data-rate-skip]')) {
        dismiss(0);
        return;
      }

      // Tap outside card = skip
      if (!e.target.closest('.rate-card')) {
        dismiss(0);
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
