/**
 * Supabase cloud sync service.
 *
 * Handles authentication (magic link OTP), push/pull with conflict guard,
 * and debounced auto-sync.
 */

import { createClient } from '@supabase/supabase-js';
import { gatherAllData, applyAllData } from '../state/store.js';

const SUPABASE_URL  = 'https://zhncgdbhgkeiybdbzsql.supabase.co';
const SUPABASE_ANON = 'sb_publishable_BZH9BWe5WHbvYYZVz6tK5A_7zw4qj2D';

let _sb = null;
let _sbUser = null;
let _syncInProgress = false;
let _syncDebounce = null;

/** UI callback hooks — set by the app to update sync status display */
let _onStatusChange = () => {};
let _onAuthChange = () => {};

/**
 * Set UI callback for sync status updates.
 * @param {Function} fn - Called with status string
 */
export function onStatusChange(fn) { _onStatusChange = fn; }

/**
 * Set UI callback for auth state changes.
 * @param {Function} fn - Called with user object or null
 */
export function onAuthChange(fn) { _onAuthChange = fn; }

/**
 * Initialize or return the Supabase client singleton.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function sbClient() {
  if (!_sb) {
    _sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });

    // Listen for auth state changes
    _sb.auth.onAuthStateChange((event, session) => {
      _sbUser = session?.user ?? null;
      _onAuthChange(_sbUser);
      if (event === 'SIGNED_IN' && _sbUser) {
        cloudPull();
      }
    });
  }
  return _sb;
}

/**
 * Get the current authenticated user, or null.
 * @returns {Object|null}
 */
export function getUser() { return _sbUser; }

/**
 * Send a magic link OTP to the given email.
 * @param {string} email
 * @returns {Promise<{error: Error|null}>}
 */
export async function sendOtp(email) {
  const sb = sbClient();
  return sb.auth.signInWithOtp({ email });
}

/**
 * Verify an OTP code.
 * @param {string} email
 * @param {string} token
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export async function verifyOtp(email, token) {
  const sb = sbClient();
  return sb.auth.verifyOtp({ email, token, type: 'email' });
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const sb = sbClient();
  await sb.auth.signOut();
  _sbUser = null;
  _onAuthChange(null);
}

/**
 * Push all local state to cloud.
 * Guarded against concurrent calls.
 */
export async function cloudPush() {
  if (_syncInProgress) return;
  const sb = sbClient();
  if (!_sbUser) return;

  _syncInProgress = true;
  _onStatusChange('Pushing…');

  try {
    const allData = gatherAllData();
    const { error } = await sb.from('user_data').upsert({
      id: _sbUser.id,
      data: allData,
    });

    if (error) {
      _onStatusChange('Push failed');
      console.warn('Cloud push failed:', error.message);
    } else {
      _onStatusChange('Synced just now');
    }
  } finally {
    _syncInProgress = false;
  }
}

/**
 * Pull cloud state and apply it locally.
 * Guarded against concurrent calls.
 */
export async function cloudPull() {
  if (_syncInProgress) return;
  const sb = sbClient();
  if (!_sbUser) return;

  _syncInProgress = true;
  _onStatusChange('Pulling…');

  try {
    const { data, error } = await sb.from('user_data')
      .select('data')
      .eq('id', _sbUser.id)
      .maybeSingle();

    if (error) {
      _onStatusChange('Pull failed');
      console.warn('Cloud pull failed:', error.message);
      return;
    }

    if (data && data.data) {
      applyAllData(data.data);
      _onStatusChange('Synced just now');
    } else {
      // No cloud data yet — push local data up after releasing lock
      _onStatusChange('Pushing…');
      const allData = gatherAllData();
      const { error: pushErr } = await sb.from('user_data').upsert({
        id: _sbUser.id,
        data: allData,
      });
      _onStatusChange(pushErr ? 'Push failed' : 'Synced just now');
    }
  } finally {
    _syncInProgress = false;
  }
}

/**
 * Debounced auto-push — call after any local state change.
 * Waits 3 seconds after last call, then pushes.
 */
export function autoSync() {
  if (!_sbUser) return;
  clearTimeout(_syncDebounce);
  _syncDebounce = setTimeout(() => {
    cloudPush().catch(() => {});
  }, 3000);
}

/**
 * Report a broken recipe link to Supabase.
 * @param {number} recipeId
 * @param {string} recipeTitle
 * @param {string} url
 */
export async function reportBrokenLink(recipeId, recipeTitle, url) {
  try {
    const sb = sbClient();
    await sb.from('app_errors').insert({
      message: 'Broken link report: ' + String(recipeTitle).slice(0, 200),
      source: 'user_report',
      line: recipeId || 0,
      col: 0,
      stack: String(url).slice(0, 1000),
      user_agent: navigator.userAgent.slice(0, 200),
      url: location.pathname,
      user_id: _sbUser ? _sbUser.id : null,
    });
  } catch (e) {
    // Silent fail — error reporting shouldn't break the app
  }
}

/**
 * Log a client-side error to Supabase.
 * @param {Error} err
 */
export async function logError(err) {
  try {
    const sb = sbClient();
    await sb.from('app_errors').insert({
      message: String(err.message).slice(0, 500),
      source: 'js_error',
      line: err.lineno || 0,
      col: err.colno || 0,
      stack: String(err.stack || '').slice(0, 2000),
      user_agent: navigator.userAgent.slice(0, 200),
      url: location.pathname,
      user_id: _sbUser ? _sbUser.id : null,
    });
  } catch (e) {
    // Silent fail
  }
}

/**
 * Check if sync is currently in progress.
 * @returns {boolean}
 */
export function isSyncing() { return _syncInProgress; }

/**
 * Generate a portable sync code (base64-encoded state).
 * @returns {string}
 */
export function generateSyncCode() {
  const data = gatherAllData();
  data.v = 1; // version marker
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

/**
 * Import state from a sync code.
 * @param {string} code - Base64-encoded sync data
 * @returns {boolean} true if import succeeded
 */
export function importSyncCode(code) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(code))));
    if (!data.v) return false;
    applyAllData(data);
    return true;
  } catch {
    return false;
  }
}
