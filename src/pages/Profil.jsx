/* Profil anggota PFI */
import React, { useEffect, useMemo, useState } from 'react';
import { usePFI } from '../state.jsx';
import { api } from '../lib/api.js';
import { Bell, Camera, Check, Edit3, Globe2, LogOut, Medal, Save, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';

const roleInfo = {
  observer: ['Pengamat', 'Observer'], reviewer: ['Reviewer', 'Reviewer'], admin: ['Administrator', 'Administrator'],
};

export default function Profil() {
  const { data, t, logout, tell, setLang, setNotify, update } = usePFI();
  const account = data.account;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({ name: account?.name || '', org: account?.org || '', bio: account?.bio || '', avatarUrl: account?.avatarUrl || '' }));
  useEffect(() => { if (account) setForm({ name: account.name || '', org: account.org || '', bio: account.bio || '', avatarUrl: account.avatarUrl || '' }); }, [account?.id, account?.name, account?.org, account?.bio, account?.avatarUrl]);
  const completeness = useMemo(() => account ? Math.round(([account.name, account.email, account.org, account.bio, account.avatarUrl].filter(Boolean).length / 5) * 100) : 0, [account]);

  if (!account) return null;
  const verified = account.verification === 'verified';
  const role = roleInfo[account.role] || roleInfo.observer;
  const initials = account.name.split(' ').map((word) => word[0]).join('').slice(0, 2);

  const saveProfile = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const next = await api('/api/profile', 'PUT', form);
      update({ account: next }); setForm({ name: next.name, org: next.org || '', bio: next.bio || '', avatarUrl: next.avatarUrl || '' });
      setEditing(false); tell(t('Profil berhasil diperbarui.', 'Profile updated.'));
    } catch (error) { tell(error.message); } finally { setSaving(false); }
  };
  const submitVerification = async () => {
    if (evidence.trim().length < 20) return tell(t('Keterangan bukti minimal 20 karakter.', 'Evidence must be at least 20 characters.'));
    setSubmitting(true);
    try { await api('/api/verification', 'POST', { evidence: evidence.trim() }); update({ account: { ...account, verification: 'pending' } }); tell(t('Pengajuan verifikasi berhasil dikirim.', 'Verification request submitted.')); setShowVerify(false); }
    catch (error) { tell(error.message); } finally { setSubmitting(false); }
  };

  return <div className="page-wrap profile-page">
    <section className="profile-cover">
      <div className="profile-cover-copy"><span>PFI MEMBER SPACE</span><h1>{t('Profil Anggota', 'Member Profile')}</h1><p>{t('Identitas, reputasi, dan kontribusi Anda di jaringan pengamat falaq Indonesia.', 'Your identity, reputation, and contribution in Indonesia’s astronomy observer network.')}</p></div>
      <button className="profile-edit" onClick={() => setEditing(!editing)}>{editing ? <X size={16}/> : <Edit3 size={16}/>} {editing ? t('Batal', 'Cancel') : t('Edit profil', 'Edit profile')}</button>
    </section>

    <section className="profile-identity">
      <div className="profile-avatar-frame" title={t('Bingkai Kontributor PFI', 'PFI Contributor frame')}>
        {account.avatarUrl ? <img src={account.avatarUrl} alt={account.name} referrerPolicy="no-referrer"/> : <span>{initials}</span>}
        <i><Sparkles size={12}/></i>
      </div>
      <div className="profile-person">
        <div className="profile-name"><h2>{account.name}</h2>{verified && <span className="verified-mark" title={t('Akun terverifikasi', 'Verified account')}><Check size={13}/></span>}</div>
        <p>{account.org || t('Anggota Platform Falak Indonesia', 'Platform Falak Indonesia member')}</p>
        <div className="profile-badges"><span className={`role-badge ${account.role}`}><UserRound size={12}/>{t(...role)}</span><span className="frame-badge"><Medal size={12}/>{t('Bingkai Kontributor', 'Contributor frame')}</span></div>
      </div>
      <div className="profile-trust"><small>{t('STATUS AKUN', 'ACCOUNT STATUS')}</small><b>{verified ? t('Terverifikasi', 'Verified') : account.verification === 'pending' ? t('Sedang ditinjau', 'Under review') : t('Belum terverifikasi', 'Not verified')}</b><span>{verified ? t('Identitas telah diperiksa PFI', 'Identity reviewed by PFI') : t('Lengkapi profil dan ajukan verifikasi', 'Complete your profile and request verification')}</span><div className="profile-completeness"><i style={{width:`${completeness}%`}}/><small>{t('Kelengkapan profil','Profile completeness')} {completeness}%</small></div></div>
    </section>

    <div className="profile-layout">
      <main>
        {editing ? <form className="profile-panel profile-form" onSubmit={saveProfile}>
          <header><div><span>{t('PENGATURAN PROFIL', 'PROFILE SETTINGS')}</span><h2>{t('Ubah informasi publik', 'Edit public information')}</h2></div><Camera size={20}/></header>
          <div className="profile-fields"><label>{t('Nama lengkap', 'Full name')}<input value={form.name} onChange={e => setForm({...form, name:e.target.value})} minLength={2} maxLength={80} required/></label><label>{t('Organisasi / lembaga', 'Organization')}<input value={form.org} onChange={e => setForm({...form, org:e.target.value})} maxLength={120}/></label><label className="wide">{t('Tentang Anda', 'About you')}<textarea value={form.bio} onChange={e => setForm({...form, bio:e.target.value})} maxLength={360} rows={4} placeholder={t('Ceritakan bidang dan pengalaman pengamatan Anda…', 'Share your field and observation experience…')}/><small>{form.bio.length}/360</small></label><label className="wide">{t('URL foto profil', 'Profile photo URL')}<input type="url" value={form.avatarUrl} onChange={e => setForm({...form, avatarUrl:e.target.value})} placeholder="https://…"/><small>{t('Foto Google digunakan otomatis. Tempel URL HTTPS lain untuk menggantinya.', 'Your Google photo is used automatically. Paste another HTTPS URL to replace it.')}</small></label></div>
          <button className="btn primary" disabled={saving}><Save size={16}/>{saving ? t('Menyimpan…', 'Saving…') : t('Simpan perubahan', 'Save changes')}</button>
        </form> : <section className="profile-panel profile-about"><header><div><span>{t('TENTANG', 'ABOUT')}</span><h2>{t('Profil profesional', 'Professional profile')}</h2></div><UserRound size={20}/></header><p>{account.bio || t('Belum ada bio. Tambahkan bidang keahlian, pengalaman rukyat, atau kegiatan falaq Anda agar anggota lain lebih mengenal Anda.', 'No bio yet. Add your expertise, observation experience, or astronomy activities so other members can know you better.')}</p><dl><div><dt>{t('Email akun · privat', 'Account email · private')}</dt><dd>{account.email}</dd></div><div><dt>{t('Bergabung', 'Joined')}</dt><dd>{account.created ? new Date(account.created).toLocaleDateString(data.lang === 'id' ? 'id-ID' : 'en-US', {month:'long', year:'numeric'}) : '—'}</dd></div><div><dt>{t('Peran anggota', 'Member role')}</dt><dd>{t(...role)}</dd></div><div><dt>{t('Status verifikasi', 'Verification status')}</dt><dd>{verified?t('Terverifikasi','Verified'):account.verification==='pending'?t('Sedang ditinjau','Under review'):t('Belum terverifikasi','Not verified')}</dd></div></dl>{account.reviewNote&&<div className="profile-review-note"><ShieldCheck size={16}/><span><b>{t('Catatan peninjau','Reviewer note')}</b>{account.reviewNote}</span></div>}</section>}

        {showVerify && <section className="profile-panel verify-panel"><header><div><span>{t('VERIFIKASI', 'VERIFICATION')}</span><h2>{t('Ajukan tanda centang', 'Request verified mark')}</h2></div><ShieldCheck size={20}/></header><p>{t('Jelaskan lembaga, pengalaman, atau bukti kegiatan pengamatan Anda.', 'Describe your institution, experience, or observation evidence.')}</p><label className="verification-evidence">{t('Keterangan bukti','Evidence description')}<textarea value={evidence} onChange={e=>setEvidence(e.target.value)} rows={5} minLength={20} maxLength={1000} placeholder={t('Contoh: lembaga, pengalaman rukyat, tautan publikasi, atau kegiatan falak…','Example: institution, observation experience, publication links, or astronomy activities…')}/><small>{evidence.length}/1000 · {t('minimal 20 karakter','minimum 20 characters')}</small></label><div className="verify-actions"><button className="btn secondary" type="button" onClick={()=>setShowVerify(false)}>{t('Batal','Cancel')}</button><button className="btn primary" disabled={submitting||evidence.trim().length<20} onClick={submitVerification}>{submitting ? t('Mengirim…','Submitting…') : t('Kirim pengajuan','Submit request')}</button></div></section>}
      </main>

      <aside className="profile-sidebar">
        <section className="profile-panel"><header><div><span>{t('PREFERENSI', 'PREFERENCES')}</span><h2>{t('Pengaturan akun', 'Account settings')}</h2></div></header><div className="setting-row"><div><Bell size={16}/><span><b>{t('Peringatan agenda','Event reminders')}</b><small>{data.notify ? t('Aktif','On') : t('Nonaktif','Off')}</small></span></div><button role="switch" aria-label={t('Aktifkan peringatan agenda','Enable event reminders')} aria-checked={data.notify} className={`profile-switch ${data.notify?'on':''}`} onClick={()=>setNotify(!data.notify)}><i/></button></div><div className="setting-row"><div><Globe2 size={16}/><span><b>{t('Bahasa','Language')}</b><small>{data.lang==='id'?'Indonesia':'English'}</small></span></div><button className="mini-action" onClick={()=>setLang(data.lang==='id'?'en':'id')}>{t('Ubah','Change')}</button></div></section>
        {!['pending','verified'].includes(account.verification) && <button className="profile-verify-action" onClick={()=>setShowVerify(!showVerify)}><ShieldCheck size={20}/><span><b>{t('Dapatkan tanda terverifikasi','Get verified')}</b><small>{t('Ajukan pemeriksaan identitas','Request an identity review')}</small></span></button>}
        <button className="profile-logout" onClick={logout}><LogOut size={16}/>{t('Keluar dari akun','Sign out')}</button>
      </aside>
    </div>
  </div>;
}
