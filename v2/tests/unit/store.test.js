import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get, getRef, set, subscribe, loadState, gatherAllData, applyAllData, resetState, STORAGE_KEYS } from '../../src/state/store.js';

// Mock localStorage
const storage = {};
const localStorageMock = {
  getItem: vi.fn(key => storage[key] ?? null),
  setItem: vi.fn((key, val) => { storage[key] = String(val); }),
  removeItem: vi.fn(key => { delete storage[key]; }),
  clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]); }),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  resetState();
});

describe('get() / set()', () => {
  it('returns default empty array for ingredients', () => {
    expect(get('ingredients')).toEqual([]);
  });

  it('sets and retrieves a value', () => {
    set('ingredients', ['garlic', 'onion']);
    expect(get('ingredients')).toEqual(['garlic', 'onion']);
  });

  it('returns a copy, not a reference (arrays)', () => {
    set('ingredients', ['garlic']);
    const a = get('ingredients');
    a.push('onion');
    expect(get('ingredients')).toEqual(['garlic']);
  });

  it('returns a copy, not a reference (objects)', () => {
    set('instructions', { 1: 'chop finely' });
    const obj = get('instructions');
    obj[2] = 'dice';
    expect(get('instructions')).toEqual({ 1: 'chop finely' });
  });

  it('throws on unknown key', () => {
    expect(() => get('nonexistent')).toThrow('Unknown state key');
    expect(() => set('nonexistent', 'x')).toThrow('Unknown state key');
  });
});

describe('getRef()', () => {
  it('returns the actual internal reference', () => {
    set('ingredients', ['garlic']);
    const ref = getRef('ingredients');
    expect(ref).toEqual(['garlic']);
    // This IS the internal array (performance path)
    expect(ref).toBe(getRef('ingredients'));
  });
});

describe('persistence', () => {
  it('persists arrays to localStorage on set', () => {
    set('ingredients', ['garlic', 'onion']);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'vrf_ings',
      JSON.stringify(['garlic', 'onion'])
    );
  });

  it('persists objects to localStorage on set', () => {
    set('instructions', { 42: 'notes here' });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'vrf_instr',
      JSON.stringify({ 42: 'notes here' })
    );
  });

  it('persists onboarded as "1" string for backward compat', () => {
    set('onboarded', true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('vrf_onboarded', '1');
  });
});

describe('loadState()', () => {
  it('loads data from localStorage', () => {
    storage['vrf_ings'] = JSON.stringify(['tomato', 'basil']);
    storage['vrf_staples'] = JSON.stringify(['olive oil', 'salt']);
    storage['vrf_favs'] = JSON.stringify([{ id: 1, title: 'Test' }]);
    storage['vrf_instr'] = JSON.stringify({ 1: 'some notes' });

    loadState();

    expect(get('ingredients')).toEqual(['tomato', 'basil']);
    expect(get('staples')).toEqual(['olive oil', 'salt']);
    expect(get('favorites')).toEqual([{ id: 1, title: 'Test' }]);
    expect(get('instructions')).toEqual({ 1: 'some notes' });
  });

  it('falls back to defaults when localStorage is empty', () => {
    loadState();
    expect(get('ingredients')).toEqual([]);
    expect(get('staples')).toEqual([]);
    expect(get('instructions')).toEqual({});
  });

  it('handles corrupt localStorage gracefully', () => {
    storage['vrf_ings'] = 'not valid json{{{';
    loadState();
    expect(get('ingredients')).toEqual([]);
  });
});

describe('subscribe()', () => {
  it('notifies listener on set', () => {
    const fn = vi.fn();
    subscribe('ingredients', fn);
    set('ingredients', ['garlic']);
    expect(fn).toHaveBeenCalledWith(['garlic']);
  });

  it('supports multiple listeners', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    subscribe('staples', fn1);
    subscribe('staples', fn2);
    set('staples', ['salt']);
    expect(fn1).toHaveBeenCalledWith(['salt']);
    expect(fn2).toHaveBeenCalledWith(['salt']);
  });

  it('returns an unsubscribe function', () => {
    const fn = vi.fn();
    const unsub = subscribe('ingredients', fn);
    unsub();
    set('ingredients', ['garlic']);
    expect(fn).not.toHaveBeenCalled();
  });

  it('does not fire for unrelated keys', () => {
    const fn = vi.fn();
    subscribe('ingredients', fn);
    set('staples', ['salt']);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('gatherAllData()', () => {
  it('returns all syncable state with vrf_ keys', () => {
    set('favorites', [{ id: 1, title: 'Test' }]);
    set('staples', ['salt']);
    set('ingredients', ['garlic']);
    set('instructions', { 1: 'notes' });
    set('mealPlan', [1]);
    set('shopList', ['onion']);
    set('allergies', ['peanut']);

    const data = gatherAllData();
    expect(data.vrf_favs).toEqual([{ id: 1, title: 'Test' }]);
    expect(data.vrf_staples).toEqual(['salt']);
    expect(data.vrf_ings).toEqual(['garlic']);
    expect(data.vrf_instr).toEqual({ 1: 'notes' });
    expect(data.vrf_meal).toEqual([1]);
    expect(data.vrf_shop).toEqual(['onion']);
    expect(data.vrf_allergies).toEqual(['peanut']);
  });
});

describe('applyAllData()', () => {
  it('applies cloud data to state', () => {
    applyAllData({
      vrf_favs: [{ id: 2, title: 'From Cloud' }],
      vrf_staples: ['pepper'],
      vrf_ings: ['basil'],
    });

    expect(get('favorites')).toEqual([{ id: 2, title: 'From Cloud' }]);
    expect(get('staples')).toEqual(['pepper']);
    expect(get('ingredients')).toEqual(['basil']);
  });

  it('skips undefined keys without overwriting', () => {
    set('favorites', [{ id: 1, title: 'Local' }]);
    applyAllData({ vrf_staples: ['pepper'] });
    expect(get('favorites')).toEqual([{ id: 1, title: 'Local' }]);
  });

  it('triggers subscribers for each applied key', () => {
    const fn = vi.fn();
    subscribe('favorites', fn);
    applyAllData({ vrf_favs: [{ id: 3, title: 'New' }] });
    expect(fn).toHaveBeenCalledWith([{ id: 3, title: 'New' }]);
  });
});

describe('resetState()', () => {
  it('resets all state to defaults', () => {
    set('ingredients', ['garlic']);
    set('staples', ['salt']);
    resetState();
    expect(get('ingredients')).toEqual([]);
    expect(get('staples')).toEqual([]);
  });

  it('clears all subscribers', () => {
    const fn = vi.fn();
    subscribe('ingredients', fn);
    resetState();
    set('ingredients', ['garlic']);
    expect(fn).not.toHaveBeenCalled();
  });
});
