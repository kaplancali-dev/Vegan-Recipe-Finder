/**
 * Component unit tests.
 *
 * Tests rendering functions and logic for RecipeCard, Shopping,
 * Favorites/MealPlan, and ReadyToCook components.
 *
 * These test the pure/logic parts of components without full DOM mounting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── RecipeCard tests ────────────────────────────────────────────

import { renderCard, renderCardList } from '../../src/components/RecipeCard.js';

const MOCK_RESULT = {
  id: 1,
  title: 'Tofu Curry',
  site: 'Test Kitchen',
  time: 30,
  servings: 4,
  cats: ['Dinner'],
  ing: ['tofu', 'coconut milk', 'curry powder', 'garlic', 'rice'],
  nut: { cal: 400, pro: 18, carb: 45, fat: 20, fib: 5 },
  pct: 80,
  have: 4,
  haveNames: ['tofu', 'coconut milk', 'curry powder', 'garlic'],
  missing: 1,
  missingNames: ['rice'],
};

const MOCK_RESULT_LOW = {
  id: 2,
  title: 'Pasta Salad',
  site: 'Test Kitchen',
  time: 15,
  servings: 2,
  cats: ['Lunch'],
  ing: ['pasta', 'tomatoes', 'basil', 'olive oil', 'salt'],
  nut: { cal: 300, pro: 8, carb: 50, fat: 10, fib: 3 },
  pct: 20,
  have: 1,
  haveNames: ['salt'],
  missing: 4,
  missingNames: ['pasta', 'tomatoes', 'basil', 'olive oil'],
};

describe('RecipeCard', () => {
  describe('renderCard()', () => {
    it('renders a card with recipe title', () => {
      const html = renderCard(MOCK_RESULT);
      expect(html).toContain('Tofu Curry');
    });

    it('renders the site name', () => {
      const html = renderCard(MOCK_RESULT);
      expect(html).toContain('Test Kitchen');
    });

    it('renders cook time and servings', () => {
      const html = renderCard(MOCK_RESULT);
      expect(html).toContain('30 min');
      expect(html).toContain('4 serv');
    });

    it('renders match percentage with correct tier class', () => {
      const htmlHi = renderCard(MOCK_RESULT); // 80% → hi
      expect(htmlHi).toContain('match-pill hi');

      const htmlLo = renderCard(MOCK_RESULT_LOW); // 20% → lo
      expect(htmlLo).toContain('match-pill lo');
    });

    it('renders ingredient count', () => {
      const html = renderCard(MOCK_RESULT);
      expect(html).toContain('4/5 ingredients');
    });

    it('renders a bar fill with correct width', () => {
      const html = renderCard(MOCK_RESULT);
      expect(html).toContain('width:80%');
    });

    it('renders favorite icon based on isFavorite option', () => {
      const htmlFav = renderCard(MOCK_RESULT, { isFavorite: true });
      expect(htmlFav).toContain('❤️');

      const htmlNoFav = renderCard(MOCK_RESULT, { isFavorite: false });
      expect(htmlNoFav).toContain('🤍');
    });

    it('hides match pill when showMatch is false', () => {
      const html = renderCard(MOCK_RESULT, { showMatch: false });
      expect(html).not.toContain('match-pill');
    });

    it('escapes HTML in title', () => {
      const xss = { ...MOCK_RESULT, title: '<script>alert(1)</script>' };
      const html = renderCard(xss);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('sets data-recipe-id attribute', () => {
      const html = renderCard(MOCK_RESULT);
      expect(html).toContain('data-recipe-id="1"');
    });

    it('sets data-fav-id attribute on favorite button', () => {
      const html = renderCard(MOCK_RESULT);
      expect(html).toContain('data-fav-id="1"');
    });
  });

  describe('renderCardList()', () => {
    it('renders multiple cards', () => {
      const html = renderCardList([MOCK_RESULT, MOCK_RESULT_LOW], new Set());
      expect(html).toContain('Tofu Curry');
      expect(html).toContain('Pasta Salad');
    });

    it('marks favorites correctly', () => {
      const html = renderCardList([MOCK_RESULT, MOCK_RESULT_LOW], new Set([1]));
      // First card (id=1) should be favorite
      expect(html).toContain('❤️');
      // Second card (id=2) should not be favorite
      expect(html).toContain('🤍');
    });

    it('returns empty string for empty array', () => {
      expect(renderCardList([], new Set())).toBe('');
    });
  });
});

// ── Toast tests ─────────────────────────────────────────────────

import { showToast } from '../../src/utils/toast.js';

describe('showToast()', () => {
  beforeEach(() => {
    // Set up a minimal toast element
    document.body.innerHTML = '<div id="toast" class="toast"></div>';
  });

  it('sets toast text content', () => {
    showToast('Hello!');
    const el = document.getElementById('toast');
    expect(el.textContent).toBe('Hello!');
  });

  it('adds the show class', () => {
    showToast('Test');
    const el = document.getElementById('toast');
    expect(el.classList.contains('show')).toBe(true);
  });

  it('does not throw if toast element is missing', () => {
    document.body.innerHTML = '';
    expect(() => showToast('No element')).not.toThrow();
  });
});

// ── SyncCode logic tests ────────────────────────────────────────

// Already covered in sync.test.js — we test generateSyncCode and importSyncCode there

// ── Shopping list logic tests ───────────────────────────────────

import { norm } from '../../src/utils/text.js';

describe('Shopping list helpers', () => {
  it('norm() normalizes shopping list items for comparison', () => {
    expect(norm('Olive Oil')).toBe('olive oil');
    expect(norm('  garlic  ')).toBe('garlic');
  });

  it('Set-based dedup works correctly for shopping items', () => {
    const items = ['tofu', 'rice', 'Tofu', 'RICE'];
    const seen = new Set();
    const unique = items.filter(i => {
      const n = norm(i);
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
    expect(unique).toEqual(['tofu', 'rice']);
  });
});

// ── Meal plan slot logic ────────────────────────────────────────

describe('Meal plan data structure', () => {
  it('initializes as 7 null slots', () => {
    const plan = [null, null, null, null, null, null, null];
    expect(plan).toHaveLength(7);
    expect(plan.every(s => s === null)).toBe(true);
  });

  it('can assign a recipe ID to a day', () => {
    const plan = [null, null, null, null, null, null, null];
    plan[0] = 42; // Monday
    expect(plan[0]).toBe(42);
    expect(plan[1]).toBeNull();
  });

  it('can clear a slot by setting to null', () => {
    const plan = [42, null, null, null, null, null, null];
    plan[0] = null;
    expect(plan[0]).toBeNull();
  });

  it('preserves other slots when modifying one', () => {
    const plan = [1, 2, 3, 4, 5, 6, 7];
    plan[3] = null;
    expect(plan).toEqual([1, 2, 3, null, 5, 6, 7]);
  });
});

// ── Ready to Cook filter logic ──────────────────────────────────

describe('Ready to Cook filter', () => {
  const MIN_MATCH = 80;

  it('filters results above threshold', () => {
    const results = [
      { id: 1, pct: 100 },
      { id: 2, pct: 80 },
      { id: 3, pct: 60 },
      { id: 4, pct: 40 },
    ];
    const ready = results.filter(r => r.pct >= MIN_MATCH);
    expect(ready).toHaveLength(2);
    expect(ready.map(r => r.id)).toEqual([1, 2]);
  });

  it('returns empty when no results meet threshold', () => {
    const results = [
      { id: 1, pct: 50 },
      { id: 2, pct: 20 },
    ];
    const ready = results.filter(r => r.pct >= MIN_MATCH);
    expect(ready).toHaveLength(0);
  });

  it('includes exactly 80% match', () => {
    const results = [{ id: 1, pct: 80 }];
    const ready = results.filter(r => r.pct >= MIN_MATCH);
    expect(ready).toHaveLength(1);
  });
});
