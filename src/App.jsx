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
import Panduan from './pages/Panduan.jsx';
import Pengaturan from './pages/Pengaturan.jsx';
import { SITES } from './lib/astro.js';
import { api } from './lib/api.js';

const routes = {
  beranda: Dashboard,
  hisab: Hisab,
  astronomi: Astronomi,
  komunitas: Komunitas,
  profil: Profil,
  peta: PetaRukyat,
  laporan: Laporan,
  kalender: Kalender,
  panduan: Panduan,
  pengaturan: Pengaturan,
};

function AuxiliaryModal() {
  const { modal, close, data, update, t, tell } = usePFI();
  if (!modal || modal.type === 'auth') return null;

  const savePreference = async (key, value) => {
    const previous = data[key];
    update({ [key]: value });
    if (data.account) {
      try {
        await api('/api/preferences', 'PUT', { [key]: value });
      } catch (error) {
        update({ [key]: previous });
        tell(error.message || t('Pengaturan gagal disimpan.', 'Unable to save setting.'));
        return;
      }
    }
    close();
  };

  let title = t('Pengaturan', 'Settings');
  let content = null;
  if (modal.type === 'location') {
    title = t('Lokasi Pengamatan', 'Observation Location');
    content = (
      <label className="field">
        <span>{t('Pilih lokasi acuan', 'Choose reference location')}</span>
        <select value={data.site} onChange={(event) => savePreference('site', event.target.value)}>
          {SITES.map((site) => <option key={site.id} value={site.id}>{site.city} — {site.site}</option>)}
        </select>
      </label>
    );
  } else if (modal.type === 'mode') {
    title = t('Mode Pengalaman', 'Experience Mode');
    content = (
      <div style={{ display: 'flex', gap: 10 }}>
        <button className={`btn ${data.mode === 'pemula' ? 'primary' : 'secondary'} full`} onClick={() => savePreference('mode', 'pemula')}>
          {t('Pemula', 'Beginner')}
        </button>
        <button className={`btn ${data.mode === 'profesional' ? 'primary' : 'secondary'} full`} onClick={() => savePreference('mode', 'profesional')}>
          {t('Profesional', 'Professional')}
        </button>
      </div>
    );
  } else if (modal.type === 'notifications') {
    title = t('Notifikasi', 'Notifications');
    content = (
      <div>
        <p style={{ color: 'var(--muted, #8fa3b8)', fontSize: 13, marginBottom: 14 }}>
          {t('Preferensi pengingat disimpan di akun; pengiriman notifikasi otomatis belum diaktifkan.', 'Reminder preference is saved to your account; automatic notification delivery is not enabled yet.')}
        </p>
        <button className="btn secondary full" onClick={() => savePreference('notify', !data.notify)}>
          {data.notify ? t('Matikan pengingat', 'Turn reminders off') : t('Aktifkan pengingat', 'Turn reminders on')}
        </button>
      </div>
    );
  } else {
    return null;
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="aux-modal-title">
        <header className="modal-head">
          <h2 id="aux-modal-title">{title}</h2>
          <button className="close-btn" onClick={close} aria-label={t('Tutup', 'Close')}>✕</button>
        </header>
        <div className="modal-body">{content}</div>
      </section>
    </div>
  );
}

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error('PFI page render error:', error);
  }
  render() {
    if (this.state.error) {
      return (
        <section className="card page-error" role="alert">
          <div className="card-body">
            <h2>Halaman mengalami kendala</h2>
            <p>Bagian halaman ini gagal ditampilkan. Navigasi PFI tetap dapat digunakan.</p>
            <details>
              <summary>Lihat detail teknis</summary>
              <code>{String(this.state.error?.message || this.state.error)}</code>
            </details>
            <button className="btn secondary" onClick={() => this.setState({ error: null })}>Coba tampilkan kembali</button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { page, modal, data, ready, toast } = usePFI();
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
              <PageErrorBoundary key={page}><Page /></PageErrorBoundary>
            )}
          </div>
        </main>
        <BottomNav />
      </div>
      {modal && modal.type === 'auth' && <AuthModal />}
      <AuxiliaryModal />
      <div
        className="toast"
        style={{ display: toast ? 'flex' : 'none' }}
        role="status"
        aria-live="polite"
      >
        <span>{toast}</span>
      </div>
    </div>
  );
}
