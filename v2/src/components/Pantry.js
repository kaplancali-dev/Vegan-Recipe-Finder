/**
 * Pantry — My Pantry tab component.
 *
 * Manages ingredient entry, staple chips, quick-action grid,
 * pantry power bar, and the hero section for new users.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { computePantryPower } from '../services/matching.js';
import { QA_ITEMS } from '../data/aliases.js';
import { escHTML, norm } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { $ } from '../utils/dom.js';

const ALLERGEN_LABELS = {
  peanut: '🥜 Peanuts', 'tree nut': '🌰 Tree Nuts', soy: '🫘 Soy',
  coconut: '🥥 Coconut', corn: '🌽 Corn', mushroom: '🍄 Mushrooms',
  nightshade: '🍅 Nightshades',
};

/** @type {Array} Full recipe list */
let _recipes = [];

/** Track subscriptions to prevent listener accumulation on re-init */
let _unsubs = [];

/**
 * Initialize the Pantry tab.
 * @param {Array} recipes
 */
export function initPantry(recipes) {
  _recipes = recipes;

  // Clean up previous subscriptions if re-initialized
  _unsubs.forEach(fn => fn());
  _unsubs = [];

  wireIngredientInput();
  wireQAGrid();
  wireGuideToggle();
  wireSectionToggles();
  renderAllergyChips();
  renderMyIngs();
  renderStapleChips();
  renderPantryPower();
  checkHero();

  // Re-render on state changes (tracked for cleanup)
  _unsubs.push(subscribe('ingredients', () => {
    renderMyIngs();
    renderPantryPower();
  }));
  _unsubs.push(subscribe('inactiveIngs', () => {
    renderMyIngs();
  }));
  _unsubs.push(subscribe('staples', () => {
    renderStapleChips();
    renderPantryPower();
  }));
  _unsubs.push(subscribe('allergies', renderAllergyChips));
}

/* ── Hero Section — collapsible, persisted via localStorage ─── */

const HERO_COLLAPSED_KEY = 'vrf_hero_collapsed';

function checkHero() {
  const toggle = $('#introToggle');
  const body = $('#introBody');
  if (!toggle || !body) return;

  // Restore saved state
  const wasCollapsed = localStorage.getItem(HERO_COLLAPSED_KEY) === '1';
  if (wasCollapsed) {
    body.classList.add('hidden');
    toggle.classList.add('collapsed');
  }

  toggle.addEventListener('click', () => {
    const isHidden = body.classList.toggle('hidden');
    toggle.classList.toggle('collapsed', isHidden);
    try {
      localStorage.setItem(HERO_COLLAPSED_KEY, isHidden ? '1' : '0');
    } catch {}

    // Pause/resume video to save resources when collapsed
    const video = body.querySelector('video');
    if (video) {
      isHidden ? video.pause() : video.play();
    }
  });
}

/* ── Allergy Chips ──────────────────────────────────────────── */

function renderAllergyChips() {
  const container = $('#allergyChips');
  const addContainer = $('#allergyAdd');
  if (!container) return;

  const allergies = getRef('allergies');
  const allergySet = new Set(allergies);

  // Active allergen chips with remove buttons
  if (allergies.length) {
    container.innerHTML = allergies.map((key, idx) => {
      const label = ALLERGEN_LABELS[key] || escHTML(key);
      return `<span class="chip allergy-chip">${label} <span class="chip-x" data-remove-allergy="${idx}" title="Remove">&times;</span></span>`;
    }).join('');
  } else {
    container.innerHTML = '<span class="muted" style="font-size:0.82rem">No allergens set — tap below to filter out recipes</span>';
  }

  container.onclick = (e) => {
    const removeEl = e.target.closest('[data-remove-allergy]');
    if (!removeEl) return;
    const idx = Number(removeEl.dataset.removeAllergy);
    const current = get('allergies');
    current.splice(idx, 1);
    set('allergies', current);
    autoSync();
    showToast('Allergen removed');
  };

  // Add-allergen buttons for allergens not yet active
  if (addContainer) {
    const available = Object.entries(ALLERGEN_LABELS).filter(([key]) => !allergySet.has(key));
    if (available.length) {
      addContainer.innerHTML = available.map(([key, label]) =>
        `<span class="chip allergen-add-chip" data-add-allergy="${escHTML(key)}" style="cursor:pointer">+ ${label}</span>`
      ).join('');
    } else {
      addContainer.innerHTML = '<span class="muted" style="font-size:0.82rem">All allergens active</span>';
    }

    addContainer.onclick = (e) => {
      const chip = e.target.closest('[data-add-allergy]');
      if (!chip) return;
      const key = chip.dataset.addAllergy;
      const current = get('allergies');
      if (!current.includes(key)) {
        current.push(key);
        set('allergies', current);
        autoSync();
        showToast('Allergen added — matching recipes will be hidden');
      }
    };
  }
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

/* ── Collapsible Section Toggles ────────────────────────────── */

function wireSectionToggles() {
  document.querySelectorAll('.section-toggle').forEach(toggle => {
    toggle.style.cursor = 'pointer';
    toggle.addEventListener('click', () => {
      const targetId = toggle.dataset.toggle;
      const body = document.getElementById(targetId);
      if (!body) return;
      const isHidden = body.classList.toggle('hidden');
      toggle.classList.toggle('collapsed', isHidden);
    });
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
    const inactive = get('inactiveIngs');
    const allNormed = new Set([...current.map(norm), ...inactive.map(norm)]);
    const added = [];

    items.forEach(item => {
      const n = norm(item);
      if (n && !allNormed.has(n)) {
        current.push(item.trim());
        allNormed.add(n);
        added.push(item.trim());
      } else if (n && inactive.map(norm).includes(n)) {
        // Re-activate if it was inactive
        const idx = inactive.findIndex(s => norm(s) === n);
        if (idx !== -1) {
          inactive.splice(idx, 1);
          set('inactiveIngs', inactive);
          if (!current.map(norm).includes(n)) {
            current.push(item.trim());
            added.push(item.trim());
          }
        }
      }
    });

    if (added.length) {
      set('ingredients', current);
      autoSync();
      showToast(`Added ${added.length} to My Ingredients`);

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

/* ── My Ingredients (user-typed, with active/inactive toggle) ── */

function renderMyIngs() {
  const container = $('#myIngsChips');
  if (!container) return;

  const active = getRef('ingredients');
  const inactive = getRef('inactiveIngs');

  if (!active.length && !inactive.length) {
    container.innerHTML = '<span class="muted" style="font-size:0.82rem">No ingredients yet — type what you bought above</span>';
    return;
  }

  // Active items first, then inactive
  const rows = [];
  active.forEach((ing, idx) => {
    rows.push(`<label class="my-ing-row">
      <input type="checkbox" checked data-ing-toggle="${idx}" data-ing-active="1">
      <span class="my-ing-name">${escHTML(ing)}</span>
      <span class="chip-x" data-ing-remove="${idx}" data-ing-from="active" title="Remove permanently">&times;</span>
    </label>`);
  });
  inactive.forEach((ing, idx) => {
    rows.push(`<label class="my-ing-row inactive">
      <input type="checkbox" data-ing-toggle="${idx}" data-ing-active="0">
      <span class="my-ing-name">${escHTML(ing)}</span>
      <span class="chip-x" data-ing-remove="${idx}" data-ing-from="inactive" title="Remove permanently">&times;</span>
    </label>`);
  });

  container.innerHTML = rows.join('');

  container.onclick = (e) => {
    // Permanent remove (×)
    const removeEl = e.target.closest('[data-ing-remove]');
    if (removeEl) {
      e.preventDefault();
      const idx = Number(removeEl.dataset.ingRemove);
      const from = removeEl.dataset.ingFrom;
      if (from === 'active') {
        const current = get('ingredients');
        current.splice(idx, 1);
        set('ingredients', current);
      } else {
        const current = get('inactiveIngs');
        current.splice(idx, 1);
        set('inactiveIngs', current);
      }
      autoSync();
      return;
    }

    // Checkbox toggle (active ↔ inactive)
    const checkbox = e.target.closest('[data-ing-toggle]');
    if (checkbox && checkbox.type === 'checkbox') {
      const idx = Number(checkbox.dataset.ingToggle);
      const wasActive = checkbox.dataset.ingActive === '1';

      if (wasActive) {
        // Move from active → inactive
        const current = get('ingredients');
        const item = current[idx];
        if (item) {
          current.splice(idx, 1);
          set('ingredients', current);
          const inact = get('inactiveIngs');
          inact.push(item);
          set('inactiveIngs', inact);
        }
      } else {
        // Move from inactive → active
        const current = get('inactiveIngs');
        const item = current[idx];
        if (item) {
          current.splice(idx, 1);
          set('inactiveIngs', current);
          const act = get('ingredients');
          act.push(item);
          set('ingredients', act);
        }
      }
      autoSync();
    }
  };
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
/** Active popup outside-click handler (for cleanup) */
let _popupCleanup = null;

function showQAPopup(category, anchorEl) {
  // Remove any existing popup and its listener
  const existing = document.querySelector('.qa-popup');
  if (existing) existing.remove();
  if (_popupCleanup) { _popupCleanup(); _popupCleanup = null; }

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
          ${have ? '✓' : '+'} ${escHTML(item)}${have ? ' <span class="chip-x" data-qa-remove="' + escHTML(item) + '" title="Remove">×</span>' : ''}
        </span>`;
      }).join('')}
    </div>
    <button class="btn btn-sm btn-outline" style="margin-top:8px" data-qa-close>Close</button>
  `;

  popup.addEventListener('click', (e) => {
    // Remove button inside a chip
    const removeBtn = e.target.closest('[data-qa-remove]');
    if (removeBtn) {
      e.stopPropagation();
      const item = removeBtn.dataset.qaRemove;
      const n = norm(item);
      // Remove from staples
      const staples = get('staples');
      const sIdx = staples.findIndex(s => norm(s) === n);
      if (sIdx !== -1) {
        staples.splice(sIdx, 1);
        set('staples', staples);
        autoSync();
      }
      // Remove from ingredients
      const ings = get('ingredients');
      const iIdx = ings.findIndex(s => norm(s) === n);
      if (iIdx !== -1) {
        ings.splice(iIdx, 1);
        set('ingredients', ings);
        autoSync();
      }
      // Re-render popup in place
      popup.remove();
      showQAPopup(category, anchorEl);
      return;
    }

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
        chip.innerHTML = `✓ ${escHTML(item)} <span class="chip-x" data-qa-remove="${escHTML(item)}" title="Remove">×</span>`;
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

  // Close on outside click (with tracked cleanup)
  setTimeout(() => {
    const handler = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        cleanup();
      }
    };
    const cleanup = () => {
      document.removeEventListener('click', handler);
      if (_popupCleanup === cleanup) _popupCleanup = null;
    };
    _popupCleanup = cleanup;
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
