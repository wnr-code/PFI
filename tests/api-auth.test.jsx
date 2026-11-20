/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/supabase.js', () => ({
  clearPersistedIdentity: vi.fn(),
  initializeIdentity: vi.fn(async () => null),
  supabase: { auth: {
    getSession: vi.fn(async () => ({ data: { session: { access_token: 'google-identity-token' } } })),
    signOut: vi.fn(async () => ({ error: null })),
    signInWithOAuth: vi.fn(async () => ({ data: {}, error: null })),
  } },
}));

import { api, authApi } from '../src/lib/api.js';
import { clearPersistedIdentity, supabase } from '../src/lib/supabase.js';

describe('Cloudflare API identity boundary', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
  });

  it('sends the Google identity token to Cloudflare without Supabase data calls', async () => {
    await api('/api/session');
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/session');
    expect(options.headers.Authorization).toBe('Bearer google-identity-token');
    expect(options.credentials).toBe('omit');
  });

  it('uses the freshly exchanged callback token during session initialization', async () => {
    supabase.auth.getSession.mockClear();
    await api('/api/session', 'GET', null, 'fresh-callback-token');
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer fresh-callback-token');
    expect(supabase.auth.getSession).not.toHaveBeenCalled();
  });

  it('keeps an explicitly anonymous request anonymous during sign-out', async () => {
    supabase.auth.getSession.mockClear();
    await api('/api/session', 'GET', null, null);
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
    expect(supabase.auth.getSession).not.toHaveBeenCalled();
  });

  it('lets the browser set the multipart boundary for R2 photo uploads', async () => {
    const form = new FormData();
    form.append('photo', new Blob(['image']), 'rukyat.jpg');
    await api('/api/posts/report-1/photo', 'POST', form);
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(options.body).toBe(form);
  });

  it('forces deliberate Google account selection on every new login', async () => {
    window.history.replaceState({}, '', '/profil');
    await authApi.signInWithGoogle();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profil`,
        queryParams: { prompt: 'select_account' },
      },
    });
  });

  it('signs out locally and blocks stale session restoration after reload', async () => {
    await authApi.signOut();
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(authApi.isExplicitlySignedOut()).toBe(true);
    const result = await authApi.getIdentitySession();
    expect(result.data.session).toBeNull();
    expect(supabase.auth.getSession).not.toHaveBeenCalled();
  });

  it('clears local identity and broadcasts expiry on a 401 response', async () => {
    const expired = vi.fn();
    window.addEventListener('pfi:auth-expired', expired, { once: true });
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'invalid token' }), { status: 401, headers: { 'content-type': 'application/json' } }));
    await expect(api('/api/preferences', 'PUT', { site: 'tasik' })).rejects.toMatchObject({ code: 'AUTH_SESSION_EXPIRED' });
    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(clearPersistedIdentity).toHaveBeenCalled();
    expect(expired).toHaveBeenCalledOnce();
  });

  it('surfaces a Cloudflare API error', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'Data D1 tidak tersedia.' }), { status: 503, headers: { 'content-type': 'application/json' } }));
    await expect(api('/api/posts')).rejects.toThrow('Data D1 tidak tersedia.');
  });
});
