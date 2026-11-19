/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import { createClient } from '@supabase/supabase-js';

const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
export const isAuthConfigured = () => Boolean(url && anonKey && /^https:\/\//.test(url));

// Supabase is identity-only. Application data is never read from or written to Supabase.
const fallbackUrl = 'https://identity-not-configured.invalid';
export const supabase = createClient(url || fallbackUrl, anonKey || 'identity-not-configured', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'pfi.google.identity',
  },
});
