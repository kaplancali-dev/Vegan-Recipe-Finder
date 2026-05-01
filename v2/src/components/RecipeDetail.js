/**
 * RecipeDetail — modal component that shows full recipe details.
 *
 * Renders ingredients (highlighted have/missing), nutrition grid,
 * action buttons (favorite, add missing to shopping list, view recipe).
 */

import { escHTML, decodeHTML, norm, stripMeasure } from '../utils/text.js';
import { GF_SWAPS, SUGAR_SWAPS } from '../data/aliases.js';
import { openRecipeLink } from '../utils/safe-link.js';
import { get, set } from '../state/store.js';
import { autoSync, reportBrokenLink } from '../services/sync.js';
import { ingredientMatches, expandWithAliases } from '../services/matching.js';
import { shareRecipe } from '../actions/share.js';
import { toggleFavorite } from '../actions/favorites.js';
import { showToast } from '../utils/toast.js';
import { handleCook } from '../actions/cook.js';
import { getIngredientBenefits } from '../data/ingredient-benefits.js';
import { initOnboarding } from './Onboarding.js';

/* ── Pre-normalized GF / sugar swap lookups ───────────────────── */

const _gfLookup = new Map();
for (const [key, val] of Object.entries(GF_SWAPS)) {
  _gfLookup.set(norm(key), val);
}

const _sugarLookup = new Map();
for (const [key, val] of Object.entries(SUGAR_SWAPS)) {
  _sugarLookup.set(norm(key), val);
}

function _gfSwap(name) {
  return _gfLookup.get(norm(name)) || null;
}

/** Natural sweeteners that should never get a sugar swap hint */
const _sugarSafe = new Set(['maple syrup', 'maple', 'date syrup', 'molasses', 'coconut nectar'].map(norm));

function _sugarSwap(name) {
  const n = norm(name);
  if (_sugarSafe.has(n)) return null;
  for (const safe of _sugarSafe) { if (n.includes(safe)) return null; }
  const exact = _sugarLookup.get(n);
  if (exact) return exact;
  for (const [key, val] of _sugarLookup) {
    if (n.includes(key) && key.length > 3) return val;
  }
  return null;
}

/**
 * Build inline swap tags for an ingredient.
 * @param {string} name - Raw ingredient name
 * @returns {string} HTML string (may be empty)
 */
function _swapTags(name, displayName) {
  const gf = _gfSwap(name);
  const sf = _sugarSwap(name);
  const display = displayName || stripMeasure(decodeHTML(name));
  const gfTag = gf ? `<span class="gf-swap">GF: ${escHTML(gf)}</span>` : '';
  const sfTag = sf ? `<span class="sf-swap">${escHTML(display)} swap: ${escHTML(sf)} to significantly reduce calories/carbs</span>` : '';
  return gfTag + sfTag;
}

/** @type {Array} Full recipe list — set by init */
let _recipes = [];

/** DOM references (cached after init) */
let _overlay, _title, _body, _closeBtn;

/**
 * Initialize the recipe detail modal.
 * @param {Array} recipes - Full recipe array
 */
export function initRecipeDetail(recipes) {
  _recipes = recipes;
  _overlay = document.getElementById('recipeModal');
  _title = document.getElementById('modalTitle');
  _body = document.getElementById('modalBody');
  _closeBtn = document.getElementById('modalClose');

  if (!_overlay) return;

  // Close button
  _closeBtn?.addEventListener('click', closeDetail);

  // Click outside to close
  _overlay.addEventListener('click', (e) => {
    if (e.target === _overlay) closeDetail();
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !_overlay.hidden) closeDetail();
  });
}

/** Check if a recipe is favorited */
function _isFav(id) {
  return new Set(get('favorites')).has(id);
}

/** Check if a recipe is in My Queue */
function _isQueued(id) {
  return (get('makelist') || []).includes(id);
}

/**
 * Wire action buttons (Favorite, Queue, Cook, Share, Report)
 * shared by both new-visitor and full detail views.
 */
function _wireActionButtons(recipe, missingIngs = []) {
  const id = recipe.id;
  const isFav = _isFav(id);

  const favBtn = document.getElementById('detailFavBtn');
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      toggleFavorite(id);
      const recheckFav = () => {
        const nowFav = _isFav(id);
        favBtn.textContent = nowFav ? '❤️ Fav' : '🤍 Fav';
      };
      if (isFav) {
        recheckFav();
      } else {
        // Poll briefly for collection picker to close (lightweight, max 5s)
        let polls = 0;
        const pollId = setInterval(() => {
          polls++;
          if (!document.querySelector('.collection-picker-overlay') || polls >= 25) {
            clearInterval(pollId);
            recheckFav();
          }
        }, 200);
      }
    });
  }

  const shopBtn = document.getElementById('detailShopBtn');
  if (shopBtn && missingIngs.length) {
    shopBtn.addEventListener('click', () => {
      const currentShop = get('shopList');
      const shopSet = new Set(currentShop);
      missingIngs.forEach(ing => shopSet.add(ing));
      set('shopList', [...shopSet]);
      autoSync();
      shopBtn.textContent = '✓ Added!';
      shopBtn.disabled = true;
    });
  }

  const queueBtn = document.getElementById('detailQueueBtn');
  if (queueBtn) {
    queueBtn.addEventListener('click', () => {
      const current = get('makelist') || [];
      if (current.includes(id)) {
        set('makelist', current.filter(i => i !== id));
        queueBtn.textContent = '📌 Queue';
        showToast('Removed from My Queue');
      } else {
        current.push(id);
        set('makelist', current);
        queueBtn.textContent = '✓ Queue';
        showToast('Added to My Queue');
      }
      autoSync();
    });
  }

  const cookBtn = document.getElementById('detailCookBtn');
  if (cookBtn) {
    cookBtn.addEventListener('click', () => handleCook(id, { title: recipe.title }));
  }

  const shareBtn = document.getElementById('detailShareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => shareRecipe(recipe.title, recipe.url, recipe.id));
  }

  const reportBtn = document.getElementById('detailReportBtn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      reportBrokenLink(recipe.id, recipe.title, recipe.url || '');
      reportBtn.textContent = '✓ Reported';
      reportBtn.disabled = true;
    });
  }
}

/**
 * Open the recipe detail modal for a given recipe ID.
 * @param {number} id - Recipe ID
 */
export function openDetail(id) {
  const recipe = _recipes.find(r => r.id === id);
  if (!recipe || !_overlay) return;

  const ings = get('ingredients');
  const staples = get('staples');
  const isNewVisitor = ings.length === 0 && staples.length === 0;

  if (isNewVisitor) {
    _renderNewVisitorDetail(recipe);
  } else {
    _renderFullDetail(recipe, ings, staples);
  }

  _overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  _closeBtn?.focus();
  _trapFocus(_overlay);
}

/**
 * Render the new-visitor landing view for a shared recipe.
 * Clean layout: big hero, plain ingredients, prominent CTA, HARVEST pitch.
 */
function _renderNewVisitorDetail(recipe) {
  const ingList = recipe.ing || [];
  const nut = recipe.nut || {};

  const ingHtml = ingList.map(ing => {
    const displayName = stripMeasure(decodeHTML(ing));
    const swaps = _swapTags(ing, displayName);
    const extraCls = _gfSwap(ing) ? ' c-gluten' : _sugarSwap(ing) ? ' c-sugar' : '';
    return `<li class="detail-ing visitor-ing${extraCls}">${escHTML(displayName)}${swaps}</li>`;
  }).join('');

  const nutHtml = (nut.cal || nut.pro || nut.carb) ? `
    <div class="detail-section">
      <h4>Nutrition (per serving)</h4>
      <div class="nut-grid">
        <div class="nut-cell"><span class="nut-val">${nut.cal ?? '—'}</span><span class="nut-label">cal</span></div>
        <div class="nut-cell"><span class="nut-val">${nut.pro ?? '—'}g</span><span class="nut-label">protein</span></div>
        <div class="nut-cell"><span class="nut-val">${nut.carb ?? '—'}g</span><span class="nut-label">carbs</span></div>
        <div class="nut-cell"><span class="nut-val">${nut.fat ?? '—'}g</span><span class="nut-label">fat</span></div>
        <div class="nut-cell"><span class="nut-val">${nut.fib ?? '—'}g</span><span class="nut-label">fiber</span></div>
      </div>
    </div>
  ` : '';

  _title.textContent = recipe.title;
  _body.innerHTML = `
    ${recipe.img ? `<img class="detail-img detail-img-hero" loading="lazy" decoding="async" src="${escHTML(recipe.img)}" alt="${escHTML(recipe.title)}">` : ''}

    <div class="visitor-pitch visitor-pitch-purple" id="visitorPitch">
      <div class="visitor-pitch-text">
        <strong>Try HARVEST</strong>
        <span>Find recipes based on what's already in your kitchen</span>
      </div>
      <span class="visitor-pitch-arrow">→</span>
    </div>

    <div class="detail-section">
      <div class="r-site">${escHTML(recipe.site || '')}</div>
      <div class="r-meta" style="margin-top:6px">
        ${recipe.time ? `<span>⏱ ${recipe.time} min</span>` : ''}
        ${recipe.servings ? `<span>🍽 ${recipe.servings} servings</span>` : ''}
      </div>
      ${recipe.cats?.length ? `<div class="detail-cats">${recipe.cats.map(c => `<span class="card-cat">${escHTML(c)}</span>`).join('')}</div>` : ''}
    </div>

    ${recipe.url ? `<a href="#" class="visitor-cta" data-recipe-url="${escHTML(recipe.url)}" data-recipe-title="${escHTML(recipe.title)}" data-recipe-site="${escHTML(recipe.site || '')}">View full recipe</a>` : ''}

    <div class="detail-section">
      <h4>Ingredients (${ingList.length})</h4>
      <ul class="detail-ing-list">${ingHtml}</ul>
    </div>

    ${nutHtml}

    <div class="detail-actions" style="margin-top:12px">
      ${recipe.url ? `<a href="#" class="detail-link" data-recipe-url="${escHTML(recipe.url)}" data-recipe-title="${escHTML(recipe.title)}" data-recipe-site="${escHTML(recipe.site || '')}">📖 Instructions ↗</a>` : ''}
      <button class="btn btn-primary" id="detailFavBtn">${_isFav(recipe.id) ? '❤️ Fav' : '🤍 Fav'}</button>
      <button class="btn btn-outline" id="detailQueueBtn">${_isQueued(recipe.id) ? '✓ Queue' : '📌 Queue'}</button>
      <button class="btn btn-outline" id="detailCookBtn">☐ Made It</button>
      <button class="btn btn-outline" id="detailShareBtn">📤 Share</button>
    </div>
  `;

  // Wire "Try HARVEST" banner — close modal and launch onboarding
  const pitch = document.getElementById('visitorPitch');
  if (pitch) {
    pitch.addEventListener('click', () => {
      closeDetail();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Launch the onboarding wizard
      setTimeout(() => initOnboarding(), 300);
    });
  }

  // Wire all action buttons (same as full detail)
  _wireActionButtons(recipe);
}

/**
 * Render the full detail view for existing users with a pantry.
 */
function _renderFullDetail(recipe, ings, staples) {
  const userIngs = expandWithAliases([...ings, ...staples]);
  const favs = new Set(get('favorites'));
  const makeList = get('makelist') || [];
  const id = recipe.id;
  const isFav = favs.has(id);
  const isQueued = makeList.includes(id);
  const instructions = get('instructions');
  const notes = instructions[id] || '';

  // Categorize ingredients
  const ingList = (recipe.ing || []).map(ing => {
    const have = ingredientMatches(ing, userIngs);
    return { name: ing, have };
  });

  const haveCount = ingList.filter(i => i.have).length;
  const pct = ingList.length ? Math.round(haveCount / ingList.length * 100) : 0;

  // Nutrition
  const nut = recipe.nut || {};
  const nutHtml = `
    <div class="nut-grid">
      <div class="nut-cell"><span class="nut-val">${nut.cal ?? '—'}</span><span class="nut-label">cal</span></div>
      <div class="nut-cell"><span class="nut-val">${nut.pro ?? '—'}g</span><span class="nut-label">protein</span></div>
      <div class="nut-cell"><span class="nut-val">${nut.carb ?? '—'}g</span><span class="nut-label">carbs</span></div>
      <div class="nut-cell"><span class="nut-val">${nut.fat ?? '—'}g</span><span class="nut-label">fat</span></div>
      <div class="nut-cell"><span class="nut-val">${nut.fib ?? '—'}g</span><span class="nut-label">fiber</span></div>
    </div>
  `;

  // Ingredient list HTML (with tap-to-reveal health benefits)
  const ingHtml = ingList.map(i => {
    const displayName = stripMeasure(decodeHTML(i.name));
    const info = getIngredientBenefits(i.name);
    const benefitsHtml = info && info.benefits.length
      ? `<div class="ing-benefits" hidden>
          ${info.benefits.map(b => `<span class="ing-benefit">✦ ${escHTML(b)}</span>`).join('')}
          <span class="ing-evidence">${escHTML(info.evidence)}</span>
        </div>`
      : '';
    const swaps = _swapTags(i.name, displayName);
    const extraCls = _gfSwap(i.name) ? ' c-gluten' : _sugarSwap(i.name) ? ' c-sugar' : '';
    const tappable = info && info.benefits.length ? ' has-benefits' : '';
    return `<li class="detail-ing ${i.have ? 'have' : 'missing'}${tappable}${extraCls}">
      <span class="ing-name">${i.have ? '✓' : '○'} ${escHTML(displayName)}${tappable ? ' <span class="ing-info-icon">ℹ</span>' : ''}</span>
      ${swaps}
      ${benefitsHtml}
    </li>`;
  }).join('');

  // Missing ingredients for shopping list button
  const missingIngs = ingList.filter(i => !i.have).map(i => i.name);

  // Cook history for this recipe
  const cookHistory = get('cookHistory') || [];
  const cooked = cookHistory
    .filter(h => h.id === id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCook = cooked.length ? cooked[0] : null;

  // Build body
  _title.textContent = recipe.title;
  _body.innerHTML = `
    ${recipe.img ? `<img class="detail-img" loading="lazy" decoding="async" src="${escHTML(recipe.img)}" alt="${escHTML(recipe.title)}">` : ''}
    <div class="detail-section">
      <div class="r-site">${escHTML(recipe.site || '')}</div>
      <div class="r-meta" style="margin-top:6px">
        ${recipe.time ? `<span>⏱ ${recipe.time} min</span>` : ''}
        ${recipe.servings ? `<span>🍽 ${recipe.servings} servings</span>` : ''}
        <span>${haveCount}/${ingList.length} ingredients (${pct}%)</span>
      </div>
      ${recipe.cats?.length ? `<div class="detail-cats">${recipe.cats.map(c => `<span class="card-cat">${escHTML(c)}</span>`).join('')}</div>` : ''}
    </div>

    <div class="detail-section">
      <h4>Ingredients</h4>
      <ul class="detail-ing-list">${ingHtml}</ul>
    </div>

    <div class="detail-section">
      <h4>Nutrition (per serving)</h4>
      ${nutHtml}
    </div>

    ${lastCook ? `
    <div class="detail-section detail-cook-history">
      <h4>✅ Cook History</h4>
      ${cooked.map(c => {
        const d = new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const stars = c.rating ? '<span class="cook-stars">' + '★'.repeat(c.rating) + '☆'.repeat(5 - c.rating) + '</span>' : '';
        return `<div class="detail-cook-entry">${d} ${stars}</div>`;
      }).join('')}
    </div>
    ` : ''}

    <div class="detail-section">
      <h4>📝 My Notes</h4>
      <textarea id="detailNotes" class="text-input" rows="3" placeholder="Your tweaks, substitutions, serving tips…"
        style="width:100%;resize:vertical">${escHTML(notes)}</textarea>
    </div>

    <div class="detail-actions">
      ${recipe.url ? `<a href="#" class="detail-link" data-recipe-url="${escHTML(recipe.url)}" data-recipe-title="${escHTML(recipe.title)}" data-recipe-site="${escHTML(recipe.site || '')}">📖 Instructions ↗</a>` : ''}
      <button class="btn btn-primary" id="detailFavBtn">${isFav ? '❤️ Fav' : '🤍 Fav'}</button>
      <button class="btn btn-outline" id="detailQueueBtn">${isQueued ? '✓ Queue' : '📌 Queue'}</button>
      ${missingIngs.length ? `<button class="btn btn-outline" id="detailShopBtn">🛒 +${missingIngs.length}</button>` : ''}
      <button class="btn btn-outline" id="detailCookBtn">${lastCook ? `✅ ${new Date(lastCook.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '☐ Made It'}</button>
      <button class="btn btn-outline" id="detailShareBtn">📤 Share</button>
    </div>
    ${recipe.url ? `<div style="text-align:center;margin-top:6px"><button class="btn-text" id="detailReportBtn" style="font-size:0.75rem;color:var(--ink-muted);background:none;border:none;cursor:pointer">🔗 Report broken link</button></div>` : ''}
  `;

  // Wire ingredient benefit toggles
  _body.querySelectorAll('.detail-ing.has-benefits').forEach(li => {
    li.addEventListener('click', (e) => {
      // Don't toggle if clicking a link or button inside
      if (e.target.closest('a, button')) return;
      const benefits = li.querySelector('.ing-benefits');
      if (benefits) {
        benefits.hidden = !benefits.hidden;
        li.classList.toggle('benefits-open', !benefits.hidden);
      }
    });
  });

  // Wire action buttons (shared helper)
  _wireActionButtons(recipe, missingIngs);

  // Notes auto-save (timer stored on overlay so closeDetail can clear it)
  const notesEl = document.getElementById('detailNotes');
  if (notesEl) {
    notesEl.addEventListener('input', () => {
      clearTimeout(_overlay._noteTimer);
      _overlay._noteTimer = setTimeout(() => {
        if (!document.contains(notesEl)) return;
        const allNotes = get('instructions');
        const val = notesEl.value.trim();
        if (val) {
          allNotes[id] = val;
        } else {
          delete allNotes[id];
        }
        set('instructions', allNotes);
        autoSync();
      }, 800);
    });
  }
}

/** Store the element that had focus before modal opened */
let _previousFocus = null;

/**
 * Trap focus within an element (modal).
 * @param {Element} container
 */
function _trapFocus(container) {
  _previousFocus = document.activeElement;

  const onKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container._focusTrapHandler = onKeyDown;
  container.addEventListener('keydown', onKeyDown);
}

/**
 * Close the recipe detail modal.
 */
export function closeDetail() {
  if (_overlay) {
    // Remove focus trap
    if (_overlay._focusTrapHandler) {
      _overlay.removeEventListener('keydown', _overlay._focusTrapHandler);
      delete _overlay._focusTrapHandler;
    }
    // Clear pending notes auto-save
    clearTimeout(_overlay._noteTimer);
    _overlay.hidden = true;
  }
  document.body.style.overflow = '';

  // Restore focus to the element that triggered the modal
  if (_previousFocus && typeof _previousFocus.focus === 'function') {
    _previousFocus.focus();
  }
  _previousFocus = null;
}
