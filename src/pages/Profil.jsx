import React, { useState, useEffect } from 'react';
import { usePFI } from '../state.jsx';
import { api } from '../lib/api.js';
import { User, CreditCard, Share2, LogOut, Bell, ShieldCheck, FileText } from 'lucide-react';

export default function Profil() {
  const { data, t, logout, tell, update } = usePFI();
  const [evidence, setEvidence] = useState('');
  const [verificationBusy, setVerificationBusy] = useState(false);
  useEffect(() => { setEvidence(''); }, [data.account?.id]);

  const account = data.account;
  const isDemo = !account;
  const roleLabels = { observer: 'Anggota / Pengamat', reviewer: 'Tim Validasi Data', admin: 'Administrator Platform' };
  const roleLabel = roleLabels[account?.role] || 'Anggota / Pengamat';

  const submitVerification = async (event) => {
    event.preventDefault();
    if (evidence.trim().length < 20 || evidence.trim().length > 1000) {
      tell(t('Keterangan bukti harus 20–1.000 karakter.', 'Evidence description must be 20–1,000 characters.'));
      return;
    }
    setVerificationBusy(true);
    try {
      await api('/api/verification', 'POST', { evidence: evidence.trim() });
      update((current) => ({
        account: { ...current.account, verification: 'pending', reviewNote: '' },
      }));
      setEvidence('');
      tell(t('Pengajuan verifikasi berhasil dikirim.', 'Verification request submitted.'));
    } catch (error) {
      tell(error.message || t('Pengajuan verifikasi gagal.', 'Verification request failed.'));
    } finally {
      setVerificationBusy(false);
    }
  };

  const toggleNotifications = async () => {
    const notify = !data.notify;
    update({ notify });
    try {
      await api('/api/preferences', 'PUT', { notify });
    } catch (error) {
      update({ notify: !notify });
      tell(error.message || t('Preferensi gagal disimpan.', 'Unable to save preference.'));
    }
  };

  const changeLanguage = async () => {
    const lang = data.lang === 'id' ? 'en' : 'id';
    update({ lang });
    try {
      await api('/api/preferences', 'PUT', { lang });
    } catch (error) {
      update({ lang: data.lang });
      tell(error.message || t('Bahasa gagal disimpan.', 'Unable to save language.'));
    }
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
                  <b>{roleLabel}</b>
                </div>
                <div className="result-box">
                  <span className="label">{t('Verifikasi', 'Verification')}</span>
                  <b>
                    <span className={`pill ${account.verification === 'verified' ? 'verified' : 'pending'}`} style={{ fontSize: 9, padding: '4px 8px' }}>
                      {account.verification === 'verified' ? t('Terverifikasi', 'Verified') : account.verification === 'pending' ? t('Menunggu', 'Pending') : account.verification === 'revision' ? t('Perlu revisi', 'Revision required') : t('Belum', 'None')}
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
              <p style={{ marginTop: 12, fontSize: 12, color: '#8fa3b8' }}>
                {t('Dukungan pengembangan PFI dapat diberikan melalui halaman resmi Trakteer.', 'Support PFI development through its official Trakteer page.')}
              </p>
              <a className="btn secondary full" href="https://trakteer.id/lanteraku/tip" target="_blank" rel="noreferrer">
                <CreditCard size={18} /> {t('Dukung PFI melalui Trakteer', 'Support PFI via Trakteer')}
              </a>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h2>{t('Pengaturan', 'Settings')}</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid var(--line)' }}>
                <div>
                  <b>{t('Preferensi Notifikasi', 'Notification Preferences')}</b>
                  <div style={{ fontSize: 11, color: '#8fa3b8' }}>{t('Simpan preferensi pengingat agenda; pengiriman otomatis belum aktif', 'Save agenda reminder preference; automatic delivery is not active yet')}</div>
                </div>
                <button onClick={toggleNotifications} aria-pressed={Boolean(data.notify)} style={{ width: 44, height: 24, background: data.notify ? 'var(--gold)' : 'var(--line)', borderRadius: 12, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 2, left: data.notify ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left .2s' }} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
                <div>
                  <b>{t('Bahasa', 'Language')}</b>
                  <div style={{ fontSize: 11, color: '#8fa3b8' }}>{data.lang === 'id' ? 'Indonesia' : 'English'}</div>
                </div>
                <button className="btn secondary" onClick={changeLanguage}>
                  {t('Ubah', 'Change')}
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h2>{t('Panduan Peran dan Keahlian PFI', 'PFI Roles and Expertise Guide')}</h2></div>
            <div className="card-body">
              <p style={{ marginBottom: 12 }}>{t('Peran akun mengatur izin di aplikasi. Peran ini tidak otomatis menunjukkan gelar, keilmuan, jabatan organisasi, atau kewenangan menetapkan awal bulan.', 'Account roles control app permissions. They do not automatically represent academic credentials, religious authority, organizational office, or authority to determine the start of a month.')}</p>
              <div style={{ display: 'grid', gap: 12 }}>
                <div><b>Anggota / Pengamat (observer)</b><p style={{ fontSize: 12, color: '#8fa3b8', margin: '4px 0 0' }}>{t('Akun standar untuk membaca komunitas, bergabung kelompok, berdiskusi, dan mengirim data pengamatan.', 'Standard account for community participation and submitting observations.')}</p></div>
                <div><b>Tim Validasi Data (reviewer)</b><p style={{ fontSize: 12, color: '#8fa3b8', margin: '4px 0 0' }}>{t('Petugas yang diberi izin memeriksa kelengkapan dan konsistensi laporan serta berkas verifikasi. Bukan pengesah resmi hasil sidang isbat.', 'Authorized staff who review completeness and consistency of reports and verification submissions. Not an official authority for isbat decisions.')}</p></div>
                <div><b>Administrator Platform (admin)</b><p style={{ fontSize: 12, color: '#8fa3b8', margin: '4px 0 0' }}>{t('Istilah teknis untuk pengelola aplikasi. Mengatur konfigurasi dan akses sistem melalui backend/database. Bukan gelar keagamaan atau jabatan ketua organisasi.', 'Technical term for the application operator. Manages configuration and system access through backend/database. Not a religious title or organizational chair.')}</p></div>
                <div><b>Koordinator Kelompok</b><p style={{ fontSize: 12, color: '#8fa3b8', margin: '4px 0 0' }}>{t('Penugasan dalam satu kelompok untuk mengoordinasikan anggota dan agenda. Tidak otomatis menjadi admin platform.', 'A role within one group to coordinate members and agendas. Does not grant platform administrator access.')}</p></div>
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 14, paddingTop: 12 }}>
                <b>Ahli Falak / Ulama / Kiai / Ustaz</b>
                <p style={{ fontSize: 12, color: '#8fa3b8', margin: '4px 0 0' }}>{t('Keahlian atau latar keilmuan, bukan role akses aplikasi. Termasuk ulama, kiai, ustaz, guru atau pengasuh pesantren, ahli hisab, dan praktisi rukyat. Mereka dapat memiliki jalur pendidikan pesantren, talaqqi/guru, pengalaman hisab-rukyat, maupun pendidikan akademik. Cantumkan keterangan yang benar pada bukti verifikasi; PFI tidak menyamakan gelar atau sanad keilmuan yang berbeda.', 'Expertise or scholarly background, not an app permission role. This includes ulama, kiai, ustaz, pesantren teachers, hisab specialists, and rukyat practitioners. Describe the actual learning and experience in verification evidence.')}</p>
              </div>
              <p style={{ fontSize: 11, color: '#d6ae62', marginTop: 12 }}>{t('Status laporan: terkirim → ditinjau → terverifikasi secara teknis / perlu revisi. Verifikasi PFI bukan penetapan resmi awal bulan Hijriah.', 'Report status: submitted → under review → technically verified / revision required. PFI review is not an official Hijri month determination.')}</p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h2>{t('Verifikasi Pengamat', 'Observer Verification')}</h2></div>
            <div className="card-body">
              {account.verification === 'verified' ? (
                <p>{t('Akun pengamat Anda telah terverifikasi.', 'Your observer account is verified.')}</p>
              ) : account.verification === 'pending' ? (
                <p>{t('Pengajuan sedang menunggu pemeriksaan petugas.', 'Your request is awaiting reviewer assessment.')}</p>
              ) : (
                <form onSubmit={submitVerification} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {account.reviewNote && <p style={{ color: '#d6ae62', fontSize: 12 }}>{t('Catatan petugas:', 'Reviewer note:')} {account.reviewNote}</p>}
                  <label className="field">
                    <span>{t('Ceritakan pengalaman, pendidikan, pesantren/lembaga, guru pembimbing, atau kegiatan falak (20–1.000 karakter)', 'Describe your experience, education, pesantren/institution, teacher, or falak activities (20–1,000 characters)')}</span>
                    <textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} minLength={20} maxLength={1000} rows={4} required />
                  </label>
                  <button className="btn secondary full" type="submit" disabled={verificationBusy}>
                    <ShieldCheck size={16} /> {verificationBusy ? t('Mengirim…', 'Submitting…') : t('Ajukan Verifikasi', 'Request Verification')}
                  </button>
                </form>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn secondary full" onClick={logout}>
              <LogOut size={16} /> {t('Keluar', 'Sign out')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
