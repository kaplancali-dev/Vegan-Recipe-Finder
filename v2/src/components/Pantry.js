/**
 * Pantry — My Pantry tab component.
 *
 * Manages ingredient entry, staple chips, quick-action grid,
 * pantry power bar, and the hero section for new users.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { computePantryPower } from '../services/matching.js';
import { QA_ITEMS, PERISHABLES } from '../data/aliases.js';
import { escHTML, norm } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { $ } from '../utils/dom.js';

/** @type {Array} Full recipe list */
let _recipes = [];

/**
 * Initialize the Pantry tab.
 * @param {Array} recipes
 */
export function initPantry(recipes) {
  _recipes = recipes;

  wireIngredientInput();
  wireQAGrid();
  wireGuideToggle();
  renderIngChips();
  renderStapleChips();
  renderPantryPower();
  checkHero();

  // Re-render on state changes
  subscribe('ingredients', () => {
    renderIngChips();
    renderPantryPower();
  });
  subscribe('staples', () => {
    renderStapleChips();
    renderPantryPower();
  });
}

/* ── Hero Section (no-op — intro card is always visible now) ─ */

function checkHero() {
  // Intro hero card is always visible (matches v1 behavior)
}

/* ── User Guide Toggle ──────────────────────────────────────── */

function wireGuideToggle() {
  // About HARVEST collapsible section
  const toggle = $('#aboutToggle');
  const body = $('#aboutBody');
  if (!toggle || !body) return;

  toggle.addEventListener('click', () => {
    const isHidden = body.classList.toggle('hidden');
    toggle.classList.toggle('collapsed', isHidden);
  });
}

/* ── Ingredient Input ────────────────────────────────────────── */

function wireIngredientInput() {
  const input = $('#ingInput');
  const btn = $('#ingAddBtn');
  if (!input || !btn) return;

  const addIngredients = () => {
    const raw = input.value;
    if (!raw.trim()) return;

    // Split by comma, semicolon, or "and"
    const items = raw.split(/[,;\n]+|(?:\s+and\s+)/i)
      .map(s => s.trim())
      .filter(Boolean);

    if (!items.length) return;

    const current = get('ingredients');
    const currentSet = new Set(current.map(norm));
    const added = [];

    items.forEach(item => {
      const n = norm(item);
      if (n && !currentSet.has(n)) {
        current.push(item.trim());
        currentSet.add(n);
        added.push(item.trim());
      }
    });

    if (added.length) {
      set('ingredients', current);
      autoSync();

      // Mark as onboarded after first ingredient add
      if (!get('onboarded')) {
        set('onboarded', true);
        checkHero();
      }
    }

    input.value = '';
    input.focus();
  };

  btn.addEventListener('click', addIngredients);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredients();
    }
  });
}

/* ── Ingredient Chips (split into Perishables + Pantry) ──────── */

function renderIngChips() {
  const perishContainer = $('#perishChips');
  const pantryContainer = $('#pantryChips');
  if (!perishContainer || !pantryContainer) return;

  const ings = getRef('ingredients');

  // Split ingredients into perishable vs shelf-stable
  const perishable = [];
  const shelfStable = [];
  ings.forEach((ing, i) => {
    if (isPerishable(ing)) {
      perishable.push({ ing, idx: i });
    } else {
      shelfStable.push({ ing, idx: i });
    }
  });

  // Render perishables
  if (!perishable.length) {
    perishContainer.innerHTML = '<span class="muted" style="font-size:0.82rem">No perishables — add fresh produce, herbs, or fruits above</span>';
  } else {
    perishContainer.innerHTML = perishable.map(({ ing, idx }) =>
      `<span class="chip perishable">${escHTML(ing)} <span class="chip-x" data-remove-ing="${idx}" title="Remove">&times;</span></span>`
    ).join('');
  }

  // Render shelf-stable pantry items
  if (!shelfStable.length) {
    pantryContainer.innerHTML = '<span class="muted" style="font-size:0.82rem">No pantry items added yet</span>';
  } else {
    pantryContainer.innerHTML = shelfStable.map(({ ing, idx }) =>
      `<span class="chip">${escHTML(ing)} <span class="chip-x" data-remove-ing="${idx}" title="Remove">&times;</span></span>`
    ).join('');
  }

  // Event delegation for both containers
  const removeHandler = (e) => {
    const removeEl = e.target.closest('[data-remove-ing]');
    if (!removeEl) return;
    const idx = Number(removeEl.dataset.removeIng);
    const current = get('ingredients');
    current.splice(idx, 1);
    set('ingredients', current);
    autoSync();
  };
  perishContainer.onclick = removeHandler;
  pantryContainer.onclick = removeHandler;
}

/**
 * Check if an ingredient is perishable (for visual indicator).
 * @param {string} ing
 * @returns {boolean}
 */
function isPerishable(ing) {
  const n = norm(ing);
  return PERISHABLES.some(cat =>
    cat.items.some(item => norm(item) === n || n.includes(norm(item)) || norm(item).includes(n))
  );
}

/* ── Staple Chips ────────────────────────────────────────────── */

function renderStapleChips() {
  const container = $('#stapleChips');
  if (!container) return;

  const staples = getRef('staples');
  if (!staples.length) {
    container.innerHTML = '<span class="muted" style="font-size:0.82rem">No staples set</span>';
    return;
  }

  container.innerHTML = staples.map((s, i) =>
    `<span class="chip staple">
      ${escHTML(s)}
      <span class="chip-x" data-remove-staple="${i}" title="Remove">&times;</span>
    </span>`
  ).join('');

  container.onclick = (e) => {
    const removeEl = e.target.closest('[data-remove-staple]');
    if (!removeEl) return;
    const idx = Number(removeEl.dataset.removeStaple);
    const current = get('staples');
    current.splice(idx, 1);
    set('staples', current);
    autoSync();
  };
}


/* ── Quick Actions Grid ──────────────────────────────────────── */

function wireQAGrid() {
  const grid = $('#qaGrid');
  if (!grid) return;

  grid.innerHTML = QA_ITEMS.map(cat =>
    `<button class="qa-btn" data-qa-cat="${escHTML(cat.cat)}">
      <span class="qa-emoji">${cat.cat.split(' ')[0]}</span>
      ${escHTML(cat.cat.split(' ').slice(1).join(' '))}
    </button>`
  ).join('');

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.qa-btn');
    if (!btn) return;
    const catLabel = btn.dataset.qaCat;
    const category = QA_ITEMS.find(c => c.cat === catLabel);
    if (!category) return;

    // Single-item category: toggle directly, no popup needed
    if (category.items.length === 1) {
      const item = category.items[0];
      const allNormed = new Set([...get('ingredients').map(norm), ...get('staples').map(norm)]);
      if (!allNormed.has(norm(item))) {
        const staples = get('staples');
        staples.push(item);
        set('staples', staples);
        autoSync();
        btn.classList.add('on');
      } else {
        // Already added — remove from staples
        const staples = get('staples');
        const idx = staples.findIndex(s => norm(s) === norm(item));
        if (idx !== -1) {
          staples.splice(idx, 1);
          set('staples', staples);
          autoSync();
          btn.classList.remove('on');
        }
      }
      return;
    }

    // Multi-item category: show quick-add popup
    showQAPopup(category, btn);
  });
}

/**
 * Show a quick-add popup for a QA category.
 */
function showQAPopup(category, anchorEl) {
  // Remove any existing popup
  const existing = document.querySelector('.qa-popup');
  if (existing) existing.remove();

  const currentIngs = new Set(getRef('ingredients').map(norm));
  const currentStaples = new Set(getRef('staples').map(norm));

  const popup = document.createElement('div');
  popup.className = 'qa-popup card';

  popup.innerHTML = `
    <h4 style="margin-bottom:8px;font-family:var(--font-sans)">${escHTML(category.cat)}</h4>
    <div class="chip-wrap">
      ${category.items.map(item => {
        const n = norm(item);
        const have = currentIngs.has(n) || currentStaples.has(n);
        return `<span class="chip${have ? ' staple' : ''}" data-qa-item="${escHTML(item)}" style="cursor:pointer">
          ${have ? '✓' : '+'} ${escHTML(item)}
        </span>`;
      }).join('')}
    </div>
    <button class="btn btn-sm btn-outline" style="margin-top:8px" data-qa-close>Close</button>
  `;

  popup.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-qa-item]');
    if (chip) {
      const item = chip.dataset.qaItem;
      const allNormed = new Set([...get('ingredients').map(norm), ...get('staples').map(norm)]);
      if (!allNormed.has(norm(item))) {
        const staples = get('staples');
        staples.push(item);
        set('staples', staples);
        autoSync();
        chip.classList.add('staple');
        chip.innerHTML = `✓ ${escHTML(item)}`;
      }
      return;
    }

    if (e.target.closest('[data-qa-close]')) {
      popup.remove();
    }
  });

  // Position relative to grid
  const grid = $('#qaGrid');
  if (grid) {
    grid.style.position = 'relative';
    grid.appendChild(popup);
  }

  // Close on outside click
  setTimeout(() => {
    const handler = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', handler);
      }
    };
    document.addEventListener('click', handler);
  }, 100);
}

/* ── Pantry Power Bar ────────────────────────────────────────── */

function renderPantryPower() {
  const bar = $('#ppBar');
  const stats = $('#ppStats');
  if (!bar) return;

  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const power = computePantryPower(_recipes, ings, staples);

  const pct = power.totalRecipes
    ? Math.round(power.eightyPercent / power.totalRecipes * 100)
    : 0;

  bar.style.width = `${pct}%`;

  // Update new PP widget elements if present
  const ppNumber = $('#ppNumber');
  const ppUnit = $('#ppUnit');
  const ppNear = $('#ppNear');

  if (ppNumber) ppNumber.textContent = power.canMakeNow;
  if (ppUnit) ppUnit.textContent = power.canMakeNow === 1 ? 'recipe ready' : 'recipes ready';
  if (ppNear) ppNear.textContent = `+ ${power.eightyPercent - power.canMakeNow} more you're 1 ingredient away from`;
  if (stats) stats.textContent = `${power.canMakeNow} of ${power.totalRecipes} recipes ready`;
}
