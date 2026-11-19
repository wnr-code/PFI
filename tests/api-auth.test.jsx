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
  supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'google-identity-token' } } })) } },
}));

import { api } from '../src/lib/api.js';

describe('Cloudflare API identity boundary', () => {
  beforeEach(() => { globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })); });

  it('sends the Google identity token to Cloudflare without Supabase data calls', async () => {
    await api('/api/session');
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/session');
    expect(options.headers.Authorization).toBe('Bearer google-identity-token');
    expect(options.credentials).toBe('include');
  });

  it('lets the browser set the multipart boundary for R2 photo uploads', async () => {
    const form = new FormData();
    form.append('photo', new Blob(['image']), 'rukyat.jpg');
    await api('/api/posts/report-1/photo', 'POST', form);
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(options.body).toBe(form);
  });

  it('surfaces a Cloudflare API error', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'Data D1 tidak tersedia.' }), { status: 503, headers: { 'content-type': 'application/json' } }));
    await expect(api('/api/posts')).rejects.toThrow('Data D1 tidak tersedia.');
  });
});
