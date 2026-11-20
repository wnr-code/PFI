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
import { api } from '../src/lib/api.js';

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
import Kamus from '../src/pages/Kamus.jsx';
import KalkulatorLapangan from '../src/pages/KalkulatorLapangan.jsx';
import { AuthModal } from '../src/components/AuthModal.jsx';
import { Topbar } from '../src/components/Shell.jsx';

AfterEachSetup();
function AfterEachSetup() { afterEach(() => cleanup()); }

describe('PFI UI smoke tests in Happy DOM', () => {
  it('renders the dashboard with current astronomy data', () => {
    render(<Dashboard />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/ilmu falaq/i);
    expect(screen.getByText(/Fase Bulan/i)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /Kamus istilah Falaq/i })).toBeFalsy();
  });

  it('keeps the glossary on its own searchable page', () => {
    render(<Kamus />);
    expect(screen.getByRole('heading', { level: 1, name: /Kamus Falaq/i })).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: /Cari istilah Falaq/i })).toBeTruthy();
    expect(screen.getByText('Hilal')).toBeTruthy();
  });

  it('renders practical field calculators with four tools', () => {
    render(<KalkulatorLapangan />);
    expect(screen.getByRole('heading', { level: 1, name: /Kalkulator Falaq/i })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByText(/Arah dari utara sejati/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: /Posisi Langit/i }));
    expect(screen.getByText(/Tinggi Matahari/i)).toBeTruthy();
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

  it('opens verified map reports in a draggable translucent bottom sheet', async () => {
    api.mockResolvedValueOnce([{ id: 'report-1', type: 'rukyat', city: 'Tasikmalaya', title: 'Rukyat Ramadan', author: 'Ahmad', latitude: -7.3, longitude: 108.2, status: 'verified', date: '2026-11-20T10:00:00Z' }]);
    render(<PetaRukyat />);
    const report = await screen.findByRole('button', { name: /Tasikmalaya/i });
    fireEvent.click(report);
    expect(document.querySelector('.pfi-map-bottom-sheet.peek')).toBeTruthy();
    expect(screen.getByAltText(/Ilustrasi pengamatan hilal/i)).toBeTruthy();
    const handle = screen.getByRole('button', { name: /Perluas detail/i });
    fireEvent.touchStart(handle, { touches: [{ clientY: 220 }] });
    fireEvent.touchMove(handle, { touches: [{ clientY: 120 }] });
    fireEvent.touchEnd(handle);
    expect(document.querySelector('.pfi-map-bottom-sheet.expanded')).toBeTruthy();
  });

  it('renders Hisab controls without unresolved component errors', () => {
    render(<Hisab />);
    expect(screen.getByRole('button', { name: /Hitung Sekarang/i })).toBeTruthy();
    expect(document.querySelectorAll('select')).toHaveLength(3);
  });

  it('explains kitab correction terms through dismissible information tips', async () => {
    render(<Hisab />);
    fireEvent.click(screen.getByRole('button', { name: /Hitung Sekarang/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^Ad-Durrul Aniq$/i }));
    expect(await screen.findByText(/Urutan perhitungan dan rujukan/i)).toBeTruthy();
    expect(screen.getByText('P = HP × cos hc')).toBeTruthy();
    expect(screen.getByText('C = acos(cos z × cos Y)')).toBeTruthy();
    const info = await screen.findByRole('button', { name: /Tinggi geosentris · informasi/i });
    fireEvent.click(info);
    expect(screen.getByText(/sebelum koreksi pengamat seperti paralaks dan refraksi/i)).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /Tinggi geosentris/i })).toBeFalsy();
  });

  it('offers GPS and editable manual coordinates as two location methods', () => {
    render(<Hisab />);
    fireEvent.change(document.querySelectorAll('select')[1], { target: { value: 'custom' } });
    expect(screen.getByRole('button', { name: /Gunakan GPS/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Isi manual/i })).toBeTruthy();
    expect(screen.getByText(/Sumber: input manual/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Informasi lokasi$/i }));
    expect(screen.getByText(/GPS mengisi koordinat perangkat/i)).toBeTruthy();
  });

  it('opens Google login from the account control while signed out', () => {
    context.open.mockClear();
    render(<Topbar />);
    fireEvent.click(screen.getByRole('button', { name: /Masuk dengan Google/i }));
    expect(context.open).toHaveBeenCalledWith('auth');
  });

  it('offers Google identity in a mobile sheet that can be swiped down', () => {
    context.close.mockClear();
    render(<AuthModal />);
    expect(screen.getByRole('button', { name: /Lanjutkan dengan Google/i })).toBeTruthy();
    expect(document.querySelector('input[type="password"]')).toBeFalsy();
    expect(screen.getByText(/tidak pernah meminta kata sandi Google/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Cloudflare D1|R2|Supabase/i);
    const handle = document.querySelector('.modal-drag-handle');
    fireEvent.touchStart(handle, { touches: [{ clientY: 80 }] });
    fireEvent.touchMove(handle, { touches: [{ clientY: 190 }] });
    fireEvent.touchEnd(handle);
    expect(context.close).toHaveBeenCalled();
  });

  it('renders the professional profile for an authenticated member', () => {
    context.data.account = { id: 'member-1', name: 'Aep Falaq', email: 'aep@example.test', org: 'PFI', bio: '', role: 'observer', verification: 'verified', created: '2026-01-01T00:00:00Z', avatarUrl: 'https://example.test/avatar.jpg' };
    render(<Profil />);
    expect(document.querySelector('.profile-cover h1')).toBeTruthy();
    expect(document.querySelector('.verified-mark')).toBeTruthy();
    context.data.account = null;
  });

  it('evaluates MABIMS at sunset rather than the freely selected simulation time', () => {
    render(<Astronomi />);
    expect(screen.getByText(/MABIMS saat sunset/i)).toBeTruthy();
    expect(screen.getByText(/Kriteria saat sunset/i)).toBeTruthy();
  });

  it.each([
    ['Astronomi', Astronomi, '.page-head h1'],
    ['Komunitas', Komunitas, '.community-hero h1'],
    ['Laporan', Laporan, '.page-head h1'],
  ])('renders the %s page without a runtime crash', (_name, Page, headingSelector) => {
    render(<Page />);
    expect(document.querySelector(headingSelector)).toBeTruthy();
  });
});
