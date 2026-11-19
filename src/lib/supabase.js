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
    // OAuth callback is exchanged explicitly before the application requests
    // its Cloudflare session, preventing a race on slower mobile browsers.
    detectSessionInUrl: false,
    flowType: 'pkce',
    storageKey: 'pfi.google.identity',
  },
});

let initialization;
export function initializeIdentity() {
  if (initialization) return initialization;
  initialization = (async () => {
    if (typeof window === 'undefined' || !isAuthConfigured()) return null;
    const callback = new URL(window.location.href);
    const code = callback.searchParams.get('code');
    const oauthError = callback.searchParams.get('error_description') || callback.searchParams.get('error');
    if (oauthError) {
      callback.searchParams.delete('error');
      callback.searchParams.delete('error_code');
      callback.searchParams.delete('error_description');
      window.history.replaceState({}, document.title, `${callback.pathname}${callback.search}${callback.hash || '#/beranda'}`);
      throw new Error(decodeURIComponent(oauthError.replaceAll('+', ' ')));
    }
    if (!code) return null;
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    callback.searchParams.delete('code');
    window.history.replaceState({}, document.title, `${callback.pathname}${callback.search}${callback.hash || '#/beranda'}`);
    if (error) throw error;
    return data.session || null;
  })();
  return initialization;
}
