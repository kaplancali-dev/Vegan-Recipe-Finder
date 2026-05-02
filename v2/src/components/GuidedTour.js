/**
 * GuidedTour — tooltip-style walkthrough after onboarding.
 *
 * Shows 7 callout bubbles pointing at key UI elements,
 * advancing on tap/click. Teaches the app without a video.
 */

import { get, set } from '../state/store.js';
import { $ } from '../utils/dom.js';

/* ── Tour steps ─────────────────────────────────────────────── */

const STEPS = [
  {
    target: '#btn-pantry',
    tab: 'pantry',
    scroll: '#perishChips',
    title: 'The fridge confessional',
    body: "Toss in whatever's actually in there right now — the wilting spinach, the optimistic avocado. We'll push recipes that rescue your perishables before they ghost you.",
    arrow: 'top',
  },
  {
    target: '#btn-browse',
    tab: 'browse',
    title: '4,500+ recipes. Zero guilt trips.',
    body: "Every card shows how many ingredients you already own. Search for anything — \"tacos,\" \"comfort food,\" \"impress someone\" — and a new Recipe of the Day drops at the top.",
    arrow: 'top',
  },
  {
    target: '#sortBar',
    tab: 'browse',
    scroll: '#sortBar',
    scrollBlock: 'start',
    title: 'Nutrition nerd mode',
    body: "Tap Protein, Fiber, or Low Cal to sort any search by what your body actually wants. The healthiest version floats to the top like it owns the place.",
    arrow: 'top',
  },
  {
    target: '#btn-canmake',
    tab: 'canmake',
    title: "No store run required",
    body: "These recipes use only what's already in your kitchen. Pick one, start cooking, feel unreasonably proud of yourself.",
    arrow: 'top',
  },
  {
    target: '#btn-wantmake',
    tab: 'wantmake',
    title: 'Your cooking intentions live here',
    body: "Queue up recipes you want to make this week. When it's grocery day, tap the cart to send missing ingredients straight to your shopping list.",
    arrow: 'top',
  },
  {
    target: '#btn-favorites',
    tab: 'favorites',
    title: "Your hall of fame",
    body: "Heart any recipe to save it. Organize into collections — \"Weeknight Wins,\" \"Game Day,\" whatever. Your Made It journal tracks everything you've cooked, with star ratings and everything.",
    arrow: 'top',
  },
  {
    target: '#btn-shopping',
    tab: 'shopping',
    title: 'The list that writes itself',
    body: "Send recipes from your queue and HARVEST builds the grocery list — organized by recipe so you're not wandering the aisles like a lost soul. Tap share to text it to whoever's driving.",
    arrow: 'top',
  },
  {
    target: '#btn-browse',
    tab: 'browse',
    title: 'Cook it, rate it, brag about it',
    body: "Tap I Made This after cooking to rate it 1–5 stars. You'll get the option to share with a friend — because what's the point of nailing a recipe if nobody knows?",
    arrow: 'top',
  },
];

/* ── State ──────────────────────────────────────────────────── */

let _stepIndex = 0;
let _overlay = null;
let _tooltip = null;
let _resizeHandler = null;

/* ── Position the tooltip ───────────────────────────────────── */

function _positionTooltip(targetEl, preferAbove) {
  if (!_tooltip || !targetEl) return;

  const rect = targetEl.getBoundingClientRect();
  const tooltipW = Math.min(320, window.innerWidth - 32);
  _tooltip.style.width = tooltipW + 'px';

  // Horizontal: centered on target, clamped to viewport
  let left = rect.left + rect.width / 2 - tooltipW / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - tooltipW - 12));

  // Vertical: prefer below (or above if preferAbove), flip if clipped
  const gap = 12;
  const tooltipH = _tooltip.offsetHeight || 180; // estimate if not yet rendered
  let top;
  let flipped = false;

  if (preferAbove && rect.top - gap - tooltipH > 12) {
    // Step requests above and there's room
    top = rect.top - gap - tooltipH;
    flipped = true;
  } else if (rect.bottom + gap + tooltipH > window.innerHeight - 12) {
    // Not enough room below — place above
    top = rect.top - gap - tooltipH;
    flipped = true;
  } else {
    top = rect.bottom + gap;
  }

  // Safety: never go above the viewport
  top = Math.max(12, top);

  _tooltip.style.left = left + 'px';
  _tooltip.style.top = top + 'px';

  // Position the arrow to point at the target center
  const arrow = _tooltip.querySelector('.tour-arrow');
  if (arrow) {
    const arrowLeft = rect.left + rect.width / 2 - left - 8;
    arrow.style.left = Math.max(16, Math.min(arrowLeft, tooltipW - 24)) + 'px';

    if (flipped) {
      // Arrow on bottom pointing down
      arrow.style.top = '';
      arrow.style.bottom = '-8px';
    } else {
      // Arrow on top pointing up (default)
      arrow.style.bottom = '';
      arrow.style.top = '-8px';
    }
  }
}

/* ── Render a step ──────────────────────────────────────────── */

function _showStep() {
  const step = STEPS[_stepIndex];
  if (!step) { _dismiss(); return; }

  // Switch tab
  const tabBtn = $(`.tab-btn[data-tab="${step.tab}"]`);
  if (tabBtn) tabBtn.click();

  // Scroll to element if specified
  if (step.scroll) {
    const scrollBlock = step.scrollBlock || 'center';
    setTimeout(() => {
      const scrollEl = $(step.scroll);
      if (scrollEl) scrollEl.scrollIntoView({ behavior: 'smooth', block: scrollBlock });
    }, 150);
  }

  const targetEl = $(step.target);
  if (!targetEl) { _stepIndex++; _showStep(); return; }

  // Pulse the target
  targetEl.classList.add('tour-highlight');

  // Build tooltip
  const isLast = _stepIndex === STEPS.length - 1;
  const stepNum = _stepIndex + 1;
  const total = STEPS.length;

  _tooltip.innerHTML = `
    <div class="tour-arrow"></div>
    <div class="tour-step-count">${stepNum} of ${total}</div>
    <div class="tour-title">${step.title}</div>
    <div class="tour-body">${step.body}</div>
    <button class="tour-next-btn" data-tour-next>
      ${isLast ? 'Start exploring!' : 'Next'}
    </button>
    <div class="tour-dots">
      ${STEPS.map((_, i) =>
        `<span class="tour-dot${i === _stepIndex ? ' on' : ''}"></span>`
      ).join('')}
    </div>
  `;

  _tooltip.style.opacity = '0';
  _tooltip.hidden = false;

  // Always scroll the target into view first (especially for mobile)
  targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Position after a tick (let tab switch + scroll settle)
  setTimeout(() => {
    _positionTooltip(targetEl, step.preferAbove);
    _tooltip.style.opacity = '1';

    // Ensure the tooltip itself is visible on screen
    const tooltipRect = _tooltip.getBoundingClientRect();
    if (tooltipRect.top < 0 || tooltipRect.bottom > window.innerHeight) {
      _tooltip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 500);
}

/* ── Advance ────────────────────────────────────────────────── */

function _advance() {
  // Remove highlight from current target
  const step = STEPS[_stepIndex];
  if (step) {
    const el = $(step.target);
    if (el) el.classList.remove('tour-highlight');
  }

  _stepIndex++;
  if (_stepIndex >= STEPS.length) {
    _dismiss();
  } else {
    _showStep();
  }
}

/* ── Dismiss ────────────────────────────────────────────────── */

function _dismiss() {
  set('toured', true);

  // Clean up highlights
  STEPS.forEach(s => {
    const el = $(s.target);
    if (el) el.classList.remove('tour-highlight');
  });

  // Remove resize listener
  if (_resizeHandler) {
    window.removeEventListener('resize', _resizeHandler);
    _resizeHandler = null;
  }

  if (_overlay) {
    _overlay.style.opacity = '0';
    setTimeout(() => _overlay.remove(), 300);
  }

  // Navigate to Browse as starting point
  const browseBtn = $(`.tab-btn[data-tab="browse"]`);
  if (browseBtn) browseBtn.click();
}

/* ── Init ───────────────────────────────────────────────────── */

/**
 * Start the guided tour. Call after onboarding completes.
 */
export function startTour() {
  // Don't run if already toured
  if (get('toured')) return;

  _stepIndex = 0;

  // Create overlay (semi-transparent, allows seeing content)
  _overlay = document.createElement('div');
  _overlay.className = 'tour-overlay';

  // Create tooltip container
  _tooltip = document.createElement('div');
  _tooltip.className = 'tour-tooltip';
  _tooltip.hidden = true;

  _overlay.appendChild(_tooltip);
  document.body.appendChild(_overlay);

  // Fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      _overlay.classList.add('show');
      _showStep();
    });
  });

  // Event delegation
  _overlay.addEventListener('click', (e) => {
    // Next button
    if (e.target.closest('[data-tour-next]')) {
      _advance();
      return;
    }

    // Click on overlay background (not tooltip) = advance
    if (!e.target.closest('.tour-tooltip')) {
      _advance();
    }
  });

  // Reposition on resize (stored for cleanup in _dismiss)
  _resizeHandler = () => {
    if (_stepIndex < STEPS.length) {
      const step = STEPS[_stepIndex];
      const el = $(step.target);
      if (el) _positionTooltip(el, step.preferAbove);
    }
  };
  window.addEventListener('resize', _resizeHandler);
}
