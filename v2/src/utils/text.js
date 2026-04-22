/**
 * Text utilities — normalization, stemming, escaping.
 * Pure functions with zero side effects.
 */

/** Normalize an ingredient name: lowercase, strip non-alphanumeric (except spaces). */
export function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

/**
 * Naive English stemmer tuned for recipe ingredient names.
 * Handles: curries→curry, halves→half, roasting→roast, roasted→roast,
 *          potatoes→potato, burgers→burger.
 */
export function stem(w) {
  w = w.toLowerCase();
  if (w.length < 4) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ves') && w.length > 4) return w.slice(0, -3) + 'f';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed')  && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('es')  && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s')   && w.length > 3) return w.slice(0, -1);
  return w;
}

/**
 * Escape a string for safe insertion into an onclick='...' attribute.
 * Escapes backslashes and single quotes.
 */
export function escQ(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Escape a string for safe insertion into innerHTML.
 * Prevents XSS by converting <, >, &, ", ' to HTML entities.
 */
export function escHTML(s) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return s.replace(/[&<>"']/g, c => map[c]);
}

/**
 * Wrap each digit in a colored span for the animated counter display.
 * Cycles through purple, orange, green.
 */
export function colorDigits(n) {
  const s = String(n);
  const colors = ['#7C3AED', '#E65100', '#059669'];
  return s.split('').map((d, i) =>
    `<span style="color:${colors[i % 3]};font-weight:800">${d}</span>`
  ).join('');
}
