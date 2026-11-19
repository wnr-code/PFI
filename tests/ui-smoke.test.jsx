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
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SITES, agenda } from '../src/lib/astro.js';

const loc = SITES[0];
const context = {
  data: { site: loc.id, posts: [], account: null, mode: 'pemula', notify: false },
  page: 'beranda',
  site: loc.id,
  setSite: vi.fn(),
  setNotify: vi.fn(),
  t: (id) => id,
  lang: 'id',
  loc,
  events: agenda(new Date(), loc),
  tell: vi.fn(),
  update: vi.fn(),
  refreshPosts: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
  open: vi.fn(),
  close: vi.fn(),
  refresh: vi.fn(async () => {}),
  isAuthConfigured: () => true,
  auth: { signInWithGoogle: vi.fn(async () => ({ data: {}, error: null })) },
};

vi.mock('../src/state.jsx', () => ({
  usePFI: () => context,
  go: vi.fn(),
}));
vi.mock('../src/lib/api.js', () => ({ api: vi.fn(async () => []), offlineStore: vi.fn(), offlineGet: vi.fn(async () => []) }));

import Dashboard from '../src/pages/Dashboard.jsx';
import Hisab from '../src/pages/Hisab.jsx';
import Astronomi from '../src/pages/Astronomi.jsx';
import Komunitas from '../src/pages/Komunitas.jsx';
import Profil from '../src/pages/Profil.jsx';
import PetaRukyat from '../src/pages/PetaRukyat.jsx';
import Laporan from '../src/pages/Laporan.jsx';
import { AuthModal } from '../src/components/AuthModal.jsx';
import { Topbar } from '../src/components/Shell.jsx';

AfterEachSetup();
function AfterEachSetup() { afterEach(() => cleanup()); }

describe('PFI UI smoke tests in Happy DOM', () => {
  it('renders the dashboard with current astronomy data', () => {
    render(<Dashboard />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/ilmu falaq/i);
    expect(screen.getAllByText(/Fase Bulan/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Kamus istilah Falaq/i })).toBeTruthy();
  });

  it('keeps the 3D globe and 2D map in separate renderer hosts', () => {
    render(<PetaRukyat />);
    const globeButton = screen.getByRole('button', { name: /Globe 3D/i });
    const mapButton = screen.getByRole('button', { name: /Peta 2D/i });
    expect(globeButton.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('.pfi-globe-canvas')).toBeTruthy();
    expect(document.querySelector('.pfi-leaflet-map')).toBeFalsy();
    fireEvent.click(mapButton);
    expect(mapButton.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('.pfi-globe-canvas')).toBeFalsy();
    expect(document.querySelector('.pfi-leaflet-map')).toBeTruthy();
  });

  it('renders Hisab controls without unresolved component errors', () => {
    render(<Hisab />);
    expect(screen.getByRole('button', { name: /Hitung Sekarang/i })).toBeTruthy();
    expect(document.querySelectorAll('select')).toHaveLength(3);
  });

  it('opens Google login from the account control while signed out', () => {
    context.open.mockClear();
    render(<Topbar />);
    fireEvent.click(screen.getByRole('button', { name: /Masuk dengan Google/i }));
    expect(context.open).toHaveBeenCalledWith('auth');
  });

  it('offers Google identity only and no password database form', () => {
    render(<AuthModal />);
    expect(screen.getByRole('button', { name: /Lanjutkan dengan Google/i })).toBeTruthy();
    expect(document.querySelector('input[type="password"]')).toBeFalsy();
    expect(screen.getByText(/tidak pernah meminta kata sandi Google/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Cloudflare D1|R2|Supabase/i);
  });

  it.each([
    ['Astronomi', Astronomi],
    ['Komunitas', Komunitas],
    ['Profil', Profil],
    ['Laporan', Laporan],
  ])('renders the %s page without a runtime crash', (_name, Page) => {
    render(<Page />);
    expect(document.querySelector('.page-head h1')).toBeTruthy();
  });
});
