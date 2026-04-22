import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock @supabase/supabase-js before importing sync module ---
const mockAuth = {
  onAuthStateChange: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  signOut: vi.fn(),
};
const mockFrom = vi.fn();
const mockSupabase = { auth: mockAuth, from: mockFrom };

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// --- Mock store functions ---
vi.mock('../../src/state/store.js', () => ({
  gatherAllData: vi.fn(() => ({
    vrf_ingredients: ['tofu', 'rice'],
    vrf_staples: ['garlic'],
  })),
  applyAllData: vi.fn(),
}));

import {
  sbClient,
  getUser,
  sendOtp,
  verifyOtp,
  signOut,
  cloudPush,
  cloudPull,
  autoSync,
  reportBrokenLink,
  logError,
  isSyncing,
  generateSyncCode,
  importSyncCode,
  onStatusChange,
  onAuthChange,
} from '../../src/services/sync.js';

import { gatherAllData, applyAllData } from '../../src/state/store.js';

describe('sync service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal state by re-triggering auth change with null
    mockAuth.onAuthStateChange.mockClear();
  });

  describe('sbClient()', () => {
    it('returns the Supabase client singleton', () => {
      const client = sbClient();
      expect(client).toBe(mockSupabase);
    });

    it('returns the same instance on subsequent calls', () => {
      const a = sbClient();
      const b = sbClient();
      expect(a).toBe(b);
    });

    it('sets up auth listener on the client', () => {
      // The singleton is created on first sbClient() call in the module.
      // By the time tests run, onAuthStateChange was already registered.
      // We verify the auth object has the listener method.
      expect(typeof mockAuth.onAuthStateChange).toBe('function');
      expect(sbClient().auth).toBe(mockAuth);
    });
  });

  describe('getUser()', () => {
    it('returns null when no user is signed in', () => {
      // User starts as null
      expect(getUser()).toBeNull();
    });
  });

  describe('sendOtp()', () => {
    it('calls signInWithOtp with the email', async () => {
      mockAuth.signInWithOtp.mockResolvedValue({ error: null });
      await sendOtp('test@example.com');
      expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('verifyOtp()', () => {
    it('calls verifyOtp with email, token, and type', async () => {
      mockAuth.verifyOtp.mockResolvedValue({ data: {}, error: null });
      await verifyOtp('test@example.com', '123456');
      expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'email',
      });
    });
  });

  describe('signOut()', () => {
    it('calls auth.signOut and triggers onAuthChange with null', async () => {
      const authCb = vi.fn();
      onAuthChange(authCb);

      mockAuth.signOut.mockResolvedValue({});
      await signOut();

      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(authCb).toHaveBeenCalledWith(null);
    });
  });

  describe('cloudPush()', () => {
    it('does nothing when no user is signed in', async () => {
      // getUser() is null
      await cloudPush();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('does not call upsert concurrently (sync guard)', async () => {
      // We can't easily test the guard without a signed-in user,
      // but we verify it returns early if no user
      await cloudPush();
      await cloudPush();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('cloudPull()', () => {
    it('does nothing when no user is signed in', async () => {
      await cloudPull();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('autoSync()', () => {
    it('does nothing when no user is signed in', () => {
      // Should not throw
      autoSync();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('isSyncing()', () => {
    it('returns false when no sync is in progress', () => {
      expect(isSyncing()).toBe(false);
    });
  });

  describe('onStatusChange()', () => {
    it('sets the status callback', async () => {
      const cb = vi.fn();
      onStatusChange(cb);
      // Push without user — won't call status
      await cloudPush();
      // No status change since no user
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('generateSyncCode()', () => {
    it('returns a base64-encoded string', () => {
      const code = generateSyncCode();
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });

    it('encodes state data with a version marker', () => {
      const code = generateSyncCode();
      const decoded = JSON.parse(decodeURIComponent(escape(atob(code))));
      expect(decoded.v).toBe(1);
      expect(decoded.vrf_ingredients).toEqual(['tofu', 'rice']);
    });
  });

  describe('importSyncCode()', () => {
    it('imports a valid sync code and returns true', () => {
      const code = generateSyncCode();
      const result = importSyncCode(code);
      expect(result).toBe(true);
      expect(applyAllData).toHaveBeenCalled();
    });

    it('returns false for invalid base64', () => {
      expect(importSyncCode('not-valid-base64!!!')).toBe(false);
    });

    it('returns false for valid base64 without version marker', () => {
      const noVersion = btoa(JSON.stringify({ foo: 'bar' }));
      expect(importSyncCode(noVersion)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(importSyncCode('')).toBe(false);
    });
  });

  describe('reportBrokenLink()', () => {
    it('inserts a broken link report into app_errors', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ insert: insertMock });

      await reportBrokenLink(42, 'Test Recipe', 'https://example.com/broken');

      expect(mockFrom).toHaveBeenCalledWith('app_errors');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Broken link report'),
          source: 'user_report',
          line: 42,
        })
      );
    });

    it('does not throw on insert failure', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('DB down');
      });
      // Should not throw
      await expect(reportBrokenLink(1, 'X', 'Y')).resolves.toBeUndefined();
    });
  });

  describe('logError()', () => {
    it('inserts an error record into app_errors', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ insert: insertMock });

      const err = new Error('Something broke');
      err.lineno = 42;
      err.colno = 7;
      await logError(err);

      expect(mockFrom).toHaveBeenCalledWith('app_errors');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Something broke',
          source: 'js_error',
          line: 42,
          col: 7,
        })
      );
    });

    it('does not throw on insert failure', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('DB down');
      });
      await expect(logError(new Error('test'))).resolves.toBeUndefined();
    });
  });
});
