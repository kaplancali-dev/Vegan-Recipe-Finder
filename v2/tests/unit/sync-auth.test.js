/**
 * Authenticated sync path tests.
 *
 * Tests cloudPush/cloudPull behavior with a signed-in user,
 * including the sync guard, status callbacks, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock @supabase/supabase-js ---
let _authChangeCallback = null;

const mockAuth = {
  onAuthStateChange: vi.fn((cb) => { _authChangeCallback = cb; }),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  signOut: vi.fn(),
};

const mockUpsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

const mockFrom = vi.fn((table) => ({
  upsert: mockUpsert,
  select: (...args) => {
    mockSelect(...args);
    return {
      eq: (...eqArgs) => {
        mockEq(...eqArgs);
        return { maybeSingle: mockMaybeSingle };
      },
    };
  },
  insert: vi.fn().mockResolvedValue({ error: null }),
}));

const mockSupabase = { auth: mockAuth, from: mockFrom };

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// --- Mock store ---
vi.mock('../../src/state/store.js', () => ({
  gatherAllData: vi.fn(() => ({
    vrf_ingredients: ['tofu', 'rice'],
    vrf_staples: ['garlic'],
  })),
  applyAllData: vi.fn(),
}));

import {
  sbClient,
  cloudPush,
  cloudPull,
  autoSync,
  isSyncing,
  onStatusChange,
  onAuthChange,
  getUser,
} from '../../src/services/sync.js';

import { gatherAllData, applyAllData } from '../../src/state/store.js';

describe('authenticated sync paths', () => {
  let statusCb;

  beforeEach(() => {
    vi.clearAllMocks();
    statusCb = vi.fn();
    onStatusChange(statusCb);

    // Initialize client so auth listener is registered
    sbClient();

    // Simulate SIGNED_IN event with a mock user
    // First, make the pull triggered by SIGNED_IN succeed quickly
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUpsert.mockResolvedValue({ error: null });

    if (_authChangeCallback) {
      _authChangeCallback('SIGNED_IN', {
        user: { id: 'user-123', email: 'test@example.com' },
      });
    }
  });

  it('getUser() returns the signed-in user after auth change', () => {
    const user = getUser();
    expect(user).not.toBeNull();
    expect(user.id).toBe('user-123');
    expect(user.email).toBe('test@example.com');
  });

  it('cloudPush upserts state data for the user', async () => {
    // Wait for any auto-pull from SIGNED_IN to finish
    await vi.waitFor(() => expect(isSyncing()).toBe(false), { timeout: 500 });

    mockUpsert.mockResolvedValue({ error: null });
    await cloudPush();

    expect(mockFrom).toHaveBeenCalledWith('user_data');
    expect(mockUpsert).toHaveBeenCalledWith({
      id: 'user-123',
      data: expect.objectContaining({ vrf_ingredients: ['tofu', 'rice'] }),
    });
  });

  it('cloudPush updates status to "Synced just now" on success', async () => {
    await vi.waitFor(() => expect(isSyncing()).toBe(false), { timeout: 500 });

    mockUpsert.mockResolvedValue({ error: null });
    await cloudPush();

    expect(statusCb).toHaveBeenCalledWith('Pushing…');
    expect(statusCb).toHaveBeenCalledWith('Synced just now');
  });

  it('cloudPush updates status to "Push failed" on error', async () => {
    await vi.waitFor(() => expect(isSyncing()).toBe(false), { timeout: 500 });

    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } });
    await cloudPush();

    expect(statusCb).toHaveBeenCalledWith('Push failed');
  });

  it('cloudPull fetches and applies cloud data', async () => {
    await vi.waitFor(() => expect(isSyncing()).toBe(false), { timeout: 500 });

    const cloudData = { vrf_ingredients: ['avocado'], vrf_staples: ['salt'] };
    mockMaybeSingle.mockResolvedValue({ data: { data: cloudData }, error: null });

    await cloudPull();

    expect(mockSelect).toHaveBeenCalledWith('data');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    expect(applyAllData).toHaveBeenCalledWith(cloudData);
    expect(statusCb).toHaveBeenCalledWith('Synced just now');
  });

  it('cloudPull falls back to push when no cloud data exists', async () => {
    await vi.waitFor(() => expect(isSyncing()).toBe(false), { timeout: 500 });

    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockUpsert.mockResolvedValue({ error: null });

    await cloudPull();

    // Should have called push (upsert) since no cloud data
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('cloudPull updates status to "Pull failed" on error', async () => {
    await vi.waitFor(() => expect(isSyncing()).toBe(false), { timeout: 500 });

    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'Network error' } });

    await cloudPull();

    expect(statusCb).toHaveBeenCalledWith('Pull failed');
  });

  it('sync guard prevents concurrent push calls', async () => {
    await vi.waitFor(() => expect(isSyncing()).toBe(false), { timeout: 500 });

    // Clear call counts from SIGNED_IN auto-pull/push
    mockUpsert.mockClear();

    // Make upsert slow
    let resolveUpsert;
    mockUpsert.mockImplementation(() => new Promise(r => { resolveUpsert = r; }));

    const push1 = cloudPush();
    expect(isSyncing()).toBe(true);

    // Second push should return immediately (guarded)
    await cloudPush();

    // Only one upsert call (the second was blocked)
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    resolveUpsert({ error: null });
    await push1;
  });

  it('autoSync debounces and triggers push', async () => {
    await vi.waitFor(() => expect(isSyncing()).toBe(false), { timeout: 500 });

    // Clear call counts from SIGNED_IN auto-pull/push
    mockUpsert.mockClear();
    mockUpsert.mockResolvedValue({ error: null });

    vi.useFakeTimers();

    autoSync();
    autoSync();
    autoSync();

    // Nothing pushed yet (still in debounce window)
    expect(mockUpsert).toHaveBeenCalledTimes(0);

    // Advance past debounce (3s)
    await vi.advanceTimersByTimeAsync(3100);

    // Should have pushed once
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('onAuthChange callback fires with user on sign-in', () => {
    const authCb = vi.fn();
    onAuthChange(authCb);

    // Simulate another sign-in
    if (_authChangeCallback) {
      _authChangeCallback('SIGNED_IN', {
        user: { id: 'user-456', email: 'other@example.com' },
      });
    }

    expect(authCb).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-456', email: 'other@example.com' })
    );
  });
});
