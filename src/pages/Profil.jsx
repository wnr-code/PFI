import React, { useState } from 'react';
import { usePFI, go } from '../state.jsx';
import { User, CreditCard, Share2, LogOut, Bell, ShieldCheck, FileText } from 'lucide-react';

export default function Profil() {
  const { data, t, lang, logout, tell, update } = usePFI();
  const [showDonasi, setShowDonasi] = useState(false);

  const account = data.account;
  const isDemo = !account;

  const handleDonasi = () => {
    tell('Donasi akan diarahkan ke halaman pembayaran (demo).');
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('PROFIL PENGGUNA', 'USER PROFILE')}</div>
        <h1>{isDemo ? t('Profil Demo', 'Demo Profile') : t('Profil Anda', 'Your Profile')}</h1>
        <p>{t('Kelola akun, verifikasi, dan donasi untuk mendukung PFI.', 'Manage account, verification, and donations to support PFI.')}</p>
      </div>

      {isDemo && (
        <div style={{ padding: 16, background: 'rgba(214,174,98,0.1)', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#d6ae62', marginBottom: 8 }}>{t('Mode Demo', 'Demo Mode')}</p>
          <p style={{ fontSize: 12, color: '#c7d1df' }}>
            {t('Silakan masuk melalui tombol di kanan atas untuk mengakses profil lengkap.', 'Please sign in via the top-right button to access full profile.')}
          </p>
        </div>
      )}

      {!isDemo && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
                  {account.name.split(' ').map((w) => w[0]).join('')}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, marginBottom: 4 }}>{account.name}</h2>
                  <div style={{ fontSize: 12, color: '#8fa3b8' }}>{account.email}</div>
                  {account.org && <div style={{ fontSize: 11, color: '#c7d1df', marginTop: 2 }}>{account.org}</div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <div className="result-box">
                  <span className="label">{t('Peran', 'Role')}</span>
                  <b>{account.role}</b>
                </div>
                <div className="result-box">
                  <span className="label">{t('Verifikasi', 'Verification')}</span>
                  <b>
                    <span className={`pill ${account.verification === 'verified' ? 'verified' : 'pending'}`} style={{ fontSize: 9, padding: '4px 8px' }}>
                      {account.verification === 'verified' ? t('Terverifikasi', 'Verified') : account.verification === 'pending' ? t('Menunggu', 'Pending') : t('Belum', 'None')}
                    </span>
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h2>{t('Donasi untuk PFI', 'Donate to PFI')}</h2>
            </div>
            <div className="card-body">
              <p>{t('Donasi Anda membantu mengembangkan aplikasi PFI sebagai jaringan pengamat hilal seluruh Indonesia.', 'Your donation helps develop PFI as a crescent watch network across Indonesia.')}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn secondary full" onClick={handleDonasi}>
                  <CreditCard size={18} /> {t('Donasi via QRIS', 'Donate via QRIS')}
                </button>
                <button className="btn secondary full" onClick={handleDonasi}>
                  <FileText size={18} /> {t('Rekening Bank', 'Bank Transfer')}
                </button>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(214,174,98,0.05)', borderRadius: 6, fontSize: 11, color: '#8fa3b8' }}>
                {t('Rekening: BCA 1234567890 a/n Pusat Falak Indonesia', 'Account: BCA 1234567890 a/n Pusat Falak Indonesia')}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h2>{t('Pengaturan', 'Settings')}</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid var(--line)' }}>
                <div>
                  <b>{t('Peringatan Agenda', 'Event Reminders')}</b>
                  <div style={{ fontSize: 11, color: '#8fa3b8' }}>{t('Aktifkan pengingat agenda astronomi', 'Enable astronomical event reminders')}</div>
                </div>
                <button style={{ width: 44, height: 24, background: data.notify ? 'var(--gold)' : 'var(--line)', borderRadius: 12, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 2, left: data.notify ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left .2s' }} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
                <div>
                  <b>{t('Bahasa', 'Language')}</b>
                  <div style={{ fontSize: 11, color: '#8fa3b8' }}>{data.lang === 'id' ? 'Indonesia' : 'English'}</div>
                </div>
                <button className="btn secondary" onClick={() => update({ lang: data.lang === 'id' ? 'en' : 'id' })}>
                  {t('Ubah', 'Change')}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn secondary full" onClick={() => tell(t('Fitur belum tersedia (demo).', 'Feature not available (demo).'))}>
              <ShieldCheck size={16} /> {t('Ajukan Verifikasi', 'Request Verification')}
            </button>
            <button className="btn secondary full" onClick={logout}>
              <LogOut size={16} /> {t('Keluar', 'Sign out')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
