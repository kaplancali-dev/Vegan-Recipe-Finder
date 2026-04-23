/**
 * RecipeDetail — modal component that shows full recipe details.
 *
 * Renders ingredients (highlighted have/missing), nutrition grid,
 * action buttons (favorite, add missing to shopping list, view recipe).
 */

import { escHTML } from '../utils/text.js';
import { get, set } from '../state/store.js';
import { autoSync, reportBrokenLink } from '../services/sync.js';
import { ingredientMatches, expandWithAliases } from '../services/matching.js';
import { shareRecipe } from '../actions/share.js';
import { toggleFavorite } from '../actions/favorites.js';
import { showToast } from '../utils/toast.js';
import { showRating } from '../utils/rating.js';

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
  const userIngs = expandWithAliases([...ings, ...staples]);
  const favs = new Set(get('favorites'));
  const isFav = favs.has(id);
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
      <div class="nut-cell"><span class="nut-val">${nut.cal ?? '—'}</span>cal</div>
      <div class="nut-cell"><span class="nut-val">${nut.pro ?? '—'}g</span>protein</div>
      <div class="nut-cell"><span class="nut-val">${nut.carb ?? '—'}g</span>carbs</div>
      <div class="nut-cell"><span class="nut-val">${nut.fat ?? '—'}g</span>fat</div>
      <div class="nut-cell"><span class="nut-val">${nut.fib ?? '—'}g</span>fiber</div>
    </div>
  `;

  // Ingredient list HTML
  const ingHtml = ingList.map(i => `
    <li class="detail-ing ${i.have ? 'have' : 'missing'}">
      ${i.have ? '✓' : '○'} ${escHTML(i.name)}
    </li>
  `).join('');

  // Missing ingredients for shopping list button
  const missingIngs = ingList.filter(i => !i.have).map(i => i.name);

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

    <div class="detail-section">
      <h4>Notes</h4>
      <textarea id="detailNotes" class="text-input" rows="3" placeholder="Add your notes…"
        style="width:100%;resize:vertical">${escHTML(notes)}</textarea>
    </div>

    <div class="detail-actions">
      ${recipe.url ? `<a href="${escHTML(recipe.url)}" target="_blank" rel="noopener" class="detail-link">View Recipe ↗</a>` : ''}
      <button class="btn btn-primary" id="detailFavBtn">${isFav ? '❤️ Unfavorite' : '🤍 Favorite'}</button>
      ${missingIngs.length ? `<button class="btn btn-outline" id="detailShopBtn">🛒 Add ${missingIngs.length} to list</button>` : ''}
      <button class="btn btn-outline" id="detailCookBtn">🍳 I Made This</button>
      <button class="btn btn-outline" id="detailShareBtn">📤 Share</button>
      ${recipe.url ? `<button class="btn btn-outline btn-sm" id="detailReportBtn">🔗 Report broken link</button>` : ''}
    </div>
  `;

  // Wire detail action buttons
  const favBtn = document.getElementById('detailFavBtn');
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      toggleFavorite(id);
      // Re-render after a short delay to allow collection picker to finish
      const recheckFav = () => {
        const nowFav = new Set(get('favorites')).has(id);
        favBtn.textContent = nowFav ? '❤️ Unfavorite' : '🤍 Favorite';
      };
      // If unfavoriting, update immediately; if favoriting, update after picker closes
      if (isFav) {
        recheckFav();
      } else {
        // Watch for the favorites state change from the picker
        const observer = setInterval(() => {
          if (!document.querySelector('.collection-picker-overlay')) {
            recheckFav();
            clearInterval(observer);
          }
        }, 200);
        // Safety timeout
        setTimeout(() => clearInterval(observer), 10000);
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

  const cookBtn = document.getElementById('detailCookBtn');
  if (cookBtn) {
    cookBtn.addEventListener('click', () => {
      showRating().then((rating) => {
        const history = get('cookHistory');
        history.push({ id, date: new Date().toISOString(), rating });
        set('cookHistory', history);
        autoSync();
        cookBtn.textContent = '✓ Logged!';
        cookBtn.disabled = true;
        const stars = rating ? ' ' + '★'.repeat(rating) : '';
        showToast(`Saved to Cook History${stars}`);
      });
    });
  }

  const shareBtn = document.getElementById('detailShareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      shareRecipe(recipe.title, recipe.url);
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

  _overlay.hidden = false;
  document.body.style.overflow = 'hidden';

  // Focus the close button for accessibility
  _closeBtn?.focus();

  // Set up focus trap
  _trapFocus(_overlay);
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
