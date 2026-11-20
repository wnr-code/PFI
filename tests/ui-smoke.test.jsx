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
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    expect(screen.getByRole('img', { name: /Kompas arah kiblat/i })).toBeTruthy();
    expect(document.querySelector('.qibla-true-north')?.textContent).toMatch(/UTARA SEJATI/i);
    expect(screen.getByText(/Mode diagram — tidak mengikuti putaran ponsel/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Informasi mode kompas/i }));
    expect(screen.getByRole('dialog', { name: /Mengapa kompas tidak bergerak/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tutup informasi/i }));
    expect(screen.getByRole('button', { name: /^Kompas Langsung Mengikuti sensor ponsel$/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Cara kalibrasi kompas langsung/i }));
    expect(screen.getByRole('dialog', { name: /Kalibrasi kompas ponsel/i }).textContent).toMatch(/angka 8/i);
    fireEvent.click(screen.getByRole('button', { name: /Tutup panduan kalibrasi/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Kompas Langsung Mengikuti sensor ponsel$/i }));
    expect(screen.getByRole('status').textContent).toMatch(/Menunggu data sensor|Sensor orientasi tidak tersedia/i);
    fireEvent.click(screen.getByRole('tab', { name: /Posisi Langit/i }));
    expect(screen.getByText(/Tinggi Matahari/i)).toBeTruthy();
    expect(screen.getByText(/Input manual/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Lintang/i), { target: { value: '91' } });
    expect(screen.getByRole('alert').textContent).toMatch(/nilai yang valid/i);
    expect(screen.queryByText(/Tinggi Matahari/i)).toBeFalsy();
  });

  it('marks calculator GPS coordinates as manual after they are edited', async () => {
    const original = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (success) => success({ coords: { latitude: -7.327, longitude: 108.22, altitude: 351, accuracy: 8 } }) } });
    render(<KalkulatorLapangan />);
    fireEvent.click(screen.getByRole('button', { name: /Gunakan GPS/i }));
    expect(await screen.findByText(/GPS perangkat · akurasi ±8 m/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Bujur/i), { target: { value: '108.3' } });
    expect(screen.getByText(/Input manual/i)).toBeTruthy();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: original });
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

  it('shows a branded orbit animation while refreshing map reports', async () => {
    let finish;
    api.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    render(<PetaRukyat />);
    expect((await screen.findByRole('status')).textContent).toMatch(/Memperbarui jaringan rukyat/i);
    expect(document.querySelector('.pfi-refresh-logo img')?.getAttribute('src')).toBe('/images/pfi-brand.png');
    finish([]);
    await waitFor(() => expect(screen.queryByText(/Memperbarui jaringan rukyat/i)).toBeFalsy());
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

  it('uses an icon-only mobile location control with coordinates on demand', () => {
    render(<Topbar />);
    const location = screen.getByRole('button', { name: /Informasi lokasi pengamatan/i });
    fireEvent.click(location);
    expect(screen.getByRole('dialog', { name: /Lokasi pengamatan/i })).toBeTruthy();
    expect(screen.getByText(/-7\.40700°/i)).toBeTruthy();
    expect(screen.getByText(/698 m/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tutup informasi lokasi/i }));
    expect(screen.queryByRole('dialog', { name: /Lokasi pengamatan/i })).toBeFalsy();
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
    expect(screen.getByText(/Kelengkapan profil/i)).toBeTruthy();
    expect(screen.getByText(/Email akun · privat/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Buka pengaturan profil/i }));
    expect(screen.getByRole('dialog', { name: /Pengaturan profil/i })).toBeTruthy();
    expect(screen.getByText(/Tampilan profil/i)).toBeTruthy();
    expect(screen.getByText(/^Animasi sampul$/i)).toBeTruthy();
    expect(screen.getByText(/^Ganti avatar$/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Orbit satelit/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('switch', { name: /Aktifkan peringatan agenda/i })).toBeTruthy();
    expect(screen.getByText(/Identitas Google terhubung/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tutup pengaturan/i }));
    expect(screen.queryByRole('dialog', { name: /Pengaturan profil/i })).toBeFalsy();
    context.data.account = null;
  });

  it('saves edited public profile fields through the authenticated API', async () => {
    context.data.account = { id: 'member-1', name: 'Aep Falaq', email: 'aep@example.test', org: 'PFI', bio: '', role: 'observer', verification: 'none', created: '2026-01-01T00:00:00Z', avatarUrl: '' };
    api.mockResolvedValueOnce({ avatarUrl: '/api/avatars/member-1?v=1' }).mockResolvedValueOnce({ ...context.data.account, name: 'Aep Falak', bio: 'Pengamat hilal Tasikmalaya', avatarUrl: '/api/avatars/member-1', coverTheme: 'meteors' });
    render(<Profil />);
    fireEvent.click(screen.getByRole('button', { name: /Edit profil/i }));
    const avatar = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Unggah avatar/i), { target: { files: [avatar] } });
    await waitFor(() => expect(api).toHaveBeenCalledWith('/api/profile/avatar', 'POST', expect.any(FormData)));
    fireEvent.change(screen.getByLabelText(/Nama lengkap/i), { target: { value: 'Aep Falak' } });
    fireEvent.change(screen.getByLabelText(/Tentang Anda/i), { target: { value: 'Pengamat hilal Tasikmalaya' } });
    fireEvent.click(screen.getByRole('button', { name: /Bintang jatuh/i }));
    expect(screen.getByRole('button', { name: /Bintang jatuh/i }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Simpan perubahan/i }));
    await waitFor(() => expect(api).toHaveBeenCalledWith('/api/profile', 'PUT', expect.objectContaining({ name: 'Aep Falak', coverTheme: 'meteors' })));
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
