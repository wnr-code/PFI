/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const authHarness = vi.hoisted(() => ({ callback: null }));

vi.mock('../src/lib/supabase.js', () => ({
  isAuthConfigured: () => true,
  supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: null } })) } },
}));
vi.mock('../src/lib/api.js', () => ({
  authApi: {
    getIdentitySession: vi.fn(async () => ({ data: { session: null } })),
    onAuthStateChange: vi.fn((callback) => {
      authHarness.callback = callback;
      queueMicrotask(() => callback('INITIAL_SESSION', null));
      return { data: { subscription: { unsubscribe() {} } } };
    }),
    signOut: vi.fn(),
  },
  api: vi.fn(async (path) => path === '/api/session' ? { account: null } : []),
  offlineStore: vi.fn(),
  offlineGet: vi.fn(async () => []),
}));

import { Provider, usePFI } from '../src/state.jsx';
import { api, authApi } from '../src/lib/api.js';

function Status() { const { ready, loc, events, data, logout } = usePFI(); return <><div>{ready ? 'ready' : 'loading'}|{loc.city}|{events.length}|{data.account?.email || 'anonymous'}</div><button onClick={logout}>logout</button></>; }

afterEach(() => cleanup());

describe('PFI provider lifecycle', () => {
  it('moves from loading to ready after Cloudflare session initialization', async () => {
    window.scrollTo = vi.fn();
    render(<Provider><Status /></Provider>);
    await waitFor(() => expect(screen.getByText(/^ready\|Tasikmalaya\|.*\|anonymous$/)).toBeTruthy());
  });

  it('shows the PFI account after a Google identity session is established', async () => {
    window.scrollTo = vi.fn();
    authApi.getIdentitySession.mockResolvedValueOnce({ data: { session: { access_token: 'token' } } });
    api.mockImplementation(async (path) => path === '/api/session'
      ? { account: { id: 'google-user-1', name: 'Pengamat PFI', email: 'pengamat@example.com' }, prefs: {} }
      : []);
    render(<Provider><Status /></Provider>);
    await waitFor(() => expect(screen.getByText(/^ready\|Tasikmalaya\|.*\|pengamat@example\.com$/)).toBeTruthy());
  });

  it('does not let a delayed signed-in event restore the account after logout', async () => {
    window.scrollTo = vi.fn();
    authApi.getIdentitySession.mockResolvedValueOnce({ data: { session: { access_token: 'token' } } });
    api.mockImplementation(async (path) => path === '/api/session'
      ? { account: { id: 'google-user-3', name: 'Akun Keluar', email: 'keluar@example.com' }, prefs: {} }
      : []);
    render(<Provider><Status /></Provider>);
    await waitFor(() => expect(screen.getByText(/keluar@example\.com$/)).toBeTruthy());
    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByText(/anonymous$/)).toBeTruthy());
    await act(async () => authHarness.callback('SIGNED_IN', { access_token: 'stale-token' }));
    expect(screen.getByText(/anonymous$/)).toBeTruthy();
  });

  it('retries a temporarily unavailable profile without discarding Google login', async () => {
    window.scrollTo = vi.fn();
    authApi.getIdentitySession.mockResolvedValueOnce({ data: { session: { access_token: 'fresh-token' } } });
    let sessionRequests = 0;
    api.mockImplementation(async (path) => {
      if (path !== '/api/session') return [];
      sessionRequests += 1;
      if (sessionRequests < 3) return { account: null };
      return { account: { id: 'google-user-2', name: 'Pengamat Baru', email: 'baru@example.com' }, prefs: {} };
    });
    render(<Provider><Status /></Provider>);
    await waitFor(
      () => expect(screen.getByText(/^ready\|Tasikmalaya\|.*\|baru@example\.com$/)).toBeTruthy(),
      { timeout: 2500 }
    );
    expect(sessionRequests).toBe(3);
  });
});
