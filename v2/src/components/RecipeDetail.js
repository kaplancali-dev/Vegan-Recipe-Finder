/**
 * RecipeDetail — modal component that shows full recipe details.
 *
 * Renders ingredients (highlighted have/missing), nutrition grid,
 * action buttons (favorite, add missing to shopping list, view recipe).
 */

import { escHTML, decodeHTML } from '../utils/text.js';
import { get, set } from '../state/store.js';
import { autoSync, reportBrokenLink } from '../services/sync.js';
import { ingredientMatches, expandWithAliases } from '../services/matching.js';
import { shareRecipe } from '../actions/share.js';
import { toggleFavorite } from '../actions/favorites.js';
import { showToast } from '../utils/toast.js';
import { handleCook } from '../actions/cook.js';
import { getIngredientBenefits } from '../data/ingredient-benefits.js';
import { initOnboarding } from './Onboarding.js';

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
    const displayName = decodeHTML(ing);
    return `<li class="detail-ing visitor-ing">${escHTML(displayName)}</li>`;
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
    </div>

    ${recipe.url ? `<a href="${escHTML(recipe.url)}" target="_blank" rel="noopener" class="visitor-cta">View full recipe</a>` : ''}

    <div class="detail-section">
      <h4>Ingredients (${ingList.length})</h4>
      <ul class="detail-ing-list">${ingHtml}</ul>
    </div>

    ${nutHtml}

    <div class="detail-actions" style="margin-top:12px">
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

  const shareBtn = document.getElementById('detailShareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      shareRecipe(recipe.title, recipe.url, recipe.id);
    });
  }
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
    const displayName = decodeHTML(i.name);
    const info = getIngredientBenefits(i.name);
    const benefitsHtml = info && info.benefits.length
      ? `<div class="ing-benefits" hidden>
          ${info.benefits.map(b => `<span class="ing-benefit">✦ ${escHTML(b)}</span>`).join('')}
          <span class="ing-evidence">${escHTML(info.evidence)}</span>
        </div>`
      : '';
    const tappable = info && info.benefits.length ? ' has-benefits' : '';
    return `<li class="detail-ing ${i.have ? 'have' : 'missing'}${tappable}">
      <span class="ing-name">${i.have ? '✓' : '○'} ${escHTML(displayName)}${tappable ? ' <span class="ing-info-icon">ℹ</span>' : ''}</span>
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
      <h4>🍳 Cook History</h4>
      ${cooked.map(c => {
        const d = new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const stars = c.rating ? '<span class="cook-stars">' + '★'.repeat(c.rating) + '☆'.repeat(5 - c.rating) + '</span>' : '';
        return `<div class="detail-cook-entry">${d} ${stars}</div>`;
      }).join('')}
    </div>
    ` : ''}

    <div class="detail-section">
      <h4>Notes</h4>
      <textarea id="detailNotes" class="text-input" rows="3" placeholder="Add your notes…"
        style="width:100%;resize:vertical">${escHTML(notes)}</textarea>
    </div>

    <div class="detail-actions">
      ${recipe.url ? `<a href="${escHTML(recipe.url)}" target="_blank" rel="noopener" class="detail-link">📖 View Instructions ↗</a>` : ''}
      <button class="btn btn-primary" id="detailFavBtn">${isFav ? '❤️ Favorited' : '🤍 Favorite'}</button>
      <button class="btn btn-outline" id="detailQueueBtn">${isQueued ? '✓ My Queue' : '📌 My Queue'}</button>
      ${missingIngs.length ? `<button class="btn btn-outline" id="detailShopBtn">🛒 Add ${missingIngs.length} to list</button>` : ''}
      <button class="btn btn-outline" id="detailCookBtn">${lastCook ? '🍳 Cook Again' : '🍳 I Made This'}</button>
      <button class="btn btn-outline" id="detailShareBtn">📤 Share</button>
      ${recipe.url ? `<button class="btn btn-outline btn-sm" id="detailReportBtn">🔗 Report broken link</button>` : ''}
    </div>
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

  // Wire detail action buttons
  const favBtn = document.getElementById('detailFavBtn');
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      toggleFavorite(id);
      // Re-render after a short delay to allow collection picker to finish
      const recheckFav = () => {
        const nowFav = new Set(get('favorites')).has(id);
        favBtn.textContent = nowFav ? '❤️ Favorited' : '🤍 Favorite';
      };
      // If unfavoriting, update immediately; if favoriting, update after picker closes
      if (isFav) {
        recheckFav();
      } else {
        // Watch for picker overlay removal via MutationObserver
        const mo = new MutationObserver(() => {
          if (!document.querySelector('.collection-picker-overlay')) {
            recheckFav();
            mo.disconnect();
          }
        });
        mo.observe(document.body, { childList: true, subtree: true });
        // Safety timeout
        setTimeout(() => mo.disconnect(), 10000);
      }
    });
  }

  const shopBtn = document.getElementById('detailShopBtn');
  if (shopBtn) {
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
        queueBtn.textContent = '📌 My Queue';
        showToast('Removed from My Queue');
      } else {
        current.push(id);
        set('makelist', current);
        queueBtn.textContent = '✓ My Queue';
        showToast('Added to My Queue');
      }
      autoSync();
    });
  }

  const cookBtn = document.getElementById('detailCookBtn');
  if (cookBtn) {
    cookBtn.addEventListener('click', () => {
      handleCook(id);
    });
  }

  const shareBtn = document.getElementById('detailShareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      shareRecipe(recipe.title, recipe.url, recipe.id);
    });
  }

  const reportBtn = document.getElementById('detailReportBtn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      reportBrokenLink(recipe.id, recipe.title, recipe.url || '');
      reportBtn.textContent = '✓ Reported';
      reportBtn.disabled = true;
    });
  }

  // Notes auto-save
  const notesEl = document.getElementById('detailNotes');
  if (notesEl) {
    let noteTimer;
    notesEl.addEventListener('input', () => {
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
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
    _overlay.hidden = true;
  }
  document.body.style.overflow = '';

  // Restore focus to the element that triggered the modal
  if (_previousFocus && typeof _previousFocus.focus === 'function') {
    _previousFocus.focus();
  }
  _previousFocus = null;
}
