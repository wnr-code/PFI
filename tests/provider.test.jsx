/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../src/lib/supabase.js', () => ({
  isAuthConfigured: () => true,
  supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: null } })) } },
}));
vi.mock('../src/lib/api.js', () => ({
  authApi: {
    getIdentitySession: vi.fn(async () => ({ data: { session: null } })),
    onAuthStateChange: vi.fn((callback) => {
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

function Status() { const { ready, loc, events, data } = usePFI(); return <div>{ready ? 'ready' : 'loading'}|{loc.city}|{events.length}|{data.account?.email || 'anonymous'}</div>; }

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
});
