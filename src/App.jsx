/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React from 'react';
import { usePFI } from './state.jsx';
import { Sidebar, Topbar, BottomNav } from './components/Shell.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Hisab from './pages/Hisab.jsx';
import Astronomi from './pages/Astronomi.jsx';
import Komunitas from './pages/Komunitas.jsx';
import Profil from './pages/Profil.jsx';
import PetaRukyat from './pages/PetaRukyat.jsx';
import Laporan from './pages/Laporan.jsx';
import Kamus from './pages/Kamus.jsx';

const routes = {
  beranda: Dashboard,
  hisab: Hisab,
  astronomi: Astronomi,
  komunitas: Komunitas,
  profil: Profil,
  peta: PetaRukyat,
  laporan: Laporan,
  kamus: Kamus,
};

export default function App() {
  const { page, modal, toast, ready } = usePFI();
  const Page = routes[page] || Dashboard;

  return (
    <div className="app">
      <Sidebar />
      <div className="main-shell">
        <Topbar />
        <main className="main-content">
          <div className="page-wrap">
            {!ready ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#747f8e' }}>
                PFI dimuat…
              </div>
            ) : (
              <Page />
            )}
          </div>
        </main>
        <BottomNav />
      </div>
      {modal && modal.type === 'auth' && <AuthModal />}
      <div
        className={`toast ${toast ? 'show' : ''}`}
        style={undefined}
        role="status"
        aria-live="polite"
      >
        <span>{toast}</span>
      </div>
    </div>
  );
}
