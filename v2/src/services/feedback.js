/**
 * Feedback service — submits user feedback to Supabase.
 *
 * Uses the existing Supabase client with anonymous insert
 * (no login required). The `feedback` table must exist in Supabase
 * with RLS allowing anonymous inserts.
 */

import { sbClient } from './sync.js';

/**
 * Submit feedback to Supabase.
 * @param {Object} data
 * @param {string} data.type - 'suggestion' | 'bug' | 'love'
 * @param {string} data.message - User's message
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function submitFeedback({ type, message }) {
  try {
    const sb = sbClient();
    const { error } = await sb
      .from('feedback')
      .insert({
        type,
        message,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[feedback] insert error:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error('[feedback] submit error:', err);
    return { ok: false, error: err.message };
  }
}
