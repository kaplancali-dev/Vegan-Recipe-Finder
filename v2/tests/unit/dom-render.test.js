/**
 * DOM rendering tests.
 *
 * Verifies that components render correct DOM structures
 * when initialized with the app shell markup.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── RecipeDetail DOM tests ────────────────────────────────────────

describe('RecipeDetail DOM', () => {
  let initRecipeDetail, openDetail, closeDetail;

  beforeEach(async () => {
    vi.resetModules();

    // Mock store
    vi.doMock('../../src/state/store.js', () => ({
      get: vi.fn((key) => {
        const store = {
          ingredients: ['tofu', 'garlic'],
          staples: [],
          favorites: [1],
          instructions: {},
        };
        return store[key] ?? [];
      }),
      set: vi.fn(),
    }));

    // Mock sync
    vi.doMock('../../src/services/sync.js', () => ({
      autoSync: vi.fn(),
      reportBrokenLink: vi.fn(),
    }));

    // Mock matching
    vi.doMock('../../src/services/matching.js', () => ({
      ingredientMatches: vi.fn((ing, ings) => ings.includes(ing)),
      expandWithAliases: vi.fn((ings) => ings),
    }));

    // Set up the DOM with modal markup
    document.body.innerHTML = `
      <div id="recipeModal" hidden>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <div class="modal-header">
            <h2 id="modalTitle" class="modal-title"></h2>
            <button id="modalClose" class="modal-close" aria-label="Close">&times;</button>
          </div>
          <div id="modalBody" class="modal-body"></div>
        </div>
      </div>
    `;

    const mod = await import('../../src/components/RecipeDetail.js');
    initRecipeDetail = mod.initRecipeDetail;
    openDetail = mod.openDetail;
    closeDetail = mod.closeDetail;
  });

  const RECIPE = {
    id: 1,
    title: 'Test Curry',
    site: 'Test Kitchen',
    time: 30,
    servings: 4,
    cats: ['Dinner'],
    ing: ['tofu', 'garlic', 'rice'],
    nut: { cal: 400, pro: 18, carb: 45, fat: 20, fib: 5 },
    url: 'https://example.com/recipe',
  };

  it('initializes without errors', () => {
    expect(() => initRecipeDetail([RECIPE])).not.toThrow();
  });

  it('opens the modal and sets the title', () => {
    initRecipeDetail([RECIPE]);
    openDetail(1);
    const modal = document.getElementById('recipeModal');
    const title = document.getElementById('modalTitle');
    expect(modal.hidden).toBe(false);
    expect(title.textContent).toBe('Test Curry');
  });

  it('renders ingredients with have/missing classes', () => {
    initRecipeDetail([RECIPE]);
    openDetail(1);
    const body = document.getElementById('modalBody');
    const items = body.querySelectorAll('.detail-ing');
    expect(items.length).toBe(3);
    // tofu and garlic should be 'have', rice should be 'missing'
    const haveItems = body.querySelectorAll('.detail-ing.have');
    const missingItems = body.querySelectorAll('.detail-ing.missing');
    expect(haveItems.length).toBe(2);
    expect(missingItems.length).toBe(1);
  });

  it('renders nutrition grid', () => {
    initRecipeDetail([RECIPE]);
    openDetail(1);
    const body = document.getElementById('modalBody');
    const nutGrid = body.querySelector('.nut-grid');
    expect(nutGrid).not.toBeNull();
    expect(nutGrid.querySelectorAll('.nut-cell').length).toBe(5);
  });

  it('renders View Recipe link for recipes with URL', () => {
    initRecipeDetail([RECIPE]);
    openDetail(1);
    const body = document.getElementById('modalBody');
    const link = body.querySelector('.detail-link');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('https://example.com/recipe');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('renders favorite button with correct state', () => {
    initRecipeDetail([RECIPE]);
    openDetail(1);
    const favBtn = document.getElementById('detailFavBtn');
    expect(favBtn).not.toBeNull();
    // Recipe 1 is in favorites
    expect(favBtn.textContent).toContain('Unfavorite');
  });

  it('renders notes textarea', () => {
    initRecipeDetail([RECIPE]);
    openDetail(1);
    const notes = document.getElementById('detailNotes');
    expect(notes).not.toBeNull();
    expect(notes.tagName).toBe('TEXTAREA');
  });

  it('closes the modal', () => {
    initRecipeDetail([RECIPE]);
    openDetail(1);
    expect(document.getElementById('recipeModal').hidden).toBe(false);
    closeDetail();
    expect(document.getElementById('recipeModal').hidden).toBe(true);
  });

  it('restores body overflow on close', () => {
    initRecipeDetail([RECIPE]);
    openDetail(1);
    expect(document.body.style.overflow).toBe('hidden');
    closeDetail();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes on Escape key', () => {
    initRecipeDetail([RECIPE]);
    openDetail(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.getElementById('recipeModal').hidden).toBe(true);
  });

  it('does not open for non-existent recipe ID', () => {
    initRecipeDetail([RECIPE]);
    openDetail(999);
    expect(document.getElementById('recipeModal').hidden).toBe(true);
  });
});

// ── RecipeCard DOM insertion test ────────────────────────────────

import { renderCard, renderCardList } from '../../src/components/RecipeCard.js';

describe('RecipeCard DOM insertion', () => {
  const RESULT = {
    id: 5,
    title: 'Veggie Bowl',
    site: 'Chef Blog',
    time: 20,
    servings: 2,
    cats: ['Lunch'],
    ing: ['kale', 'quinoa', 'tahini'],
    nut: { cal: 350, pro: 14, carb: 40, fat: 18, fib: 7 },
    pct: 67,
    have: 2,
    haveNames: ['kale', 'quinoa'],
    missing: 1,
    missingNames: ['tahini'],
  };

  it('creates valid DOM when inserted into a container', () => {
    const container = document.createElement('div');
    container.innerHTML = renderCard(RESULT);
    const card = container.querySelector('.r-card');
    expect(card).not.toBeNull();
    expect(card.dataset.recipeId).toBe('5');
  });

  it('contains an accessible favorite button', () => {
    const container = document.createElement('div');
    container.innerHTML = renderCard(RESULT);
    const btn = container.querySelector('.fav-btn');
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('aria-label')).toBe('Toggle favorite');
  });

  it('renders a progress bar with correct width', () => {
    const container = document.createElement('div');
    container.innerHTML = renderCard(RESULT);
    const bar = container.querySelector('.bar-fill');
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe('67%');
  });

  it('renderCardList creates multiple card articles', () => {
    const results = [
      RESULT,
      { ...RESULT, id: 6, title: 'Smoothie Bowl' },
    ];
    const container = document.createElement('div');
    container.innerHTML = renderCardList(results, new Set([5]));
    const cards = container.querySelectorAll('.r-card');
    expect(cards.length).toBe(2);
    // First card should show filled heart (favorite)
    const firstFav = cards[0].querySelector('.fav-btn');
    expect(firstFav.textContent).toContain('❤️');
    // Second card should show empty heart
    const secondFav = cards[1].querySelector('.fav-btn');
    expect(secondFav.textContent).toContain('🤍');
  });
});
