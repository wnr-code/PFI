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
import Kalender from './pages/Kalender.jsx';

const routes = {
  beranda: Dashboard,
  hisab: Hisab,
  astronomi: Astronomi,
  komunitas: Komunitas,
  profil: Profil,
  peta: PetaRukyat,
  laporan: Laporan,
  kalender: Kalender,
};

export default function App() {
  const { page, modal, data, ready } = usePFI();
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
        className="toast"
        style={{ display: data.toast ? 'flex' : 'none' }}
        role="status"
        aria-live="polite"
      >
        <span>{data.toast}</span>
      </div>
    </div>
  );
}
