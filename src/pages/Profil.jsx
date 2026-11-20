/* Profil anggota PFI */
import React, { useEffect, useMemo, useState } from 'react';
import { usePFI } from '../state.jsx';
import { api } from '../lib/api.js';
import { Bell, Building2, CalendarDays, Camera, Check, Edit3, FileText, Globe2, Image, Languages, LogOut, Mail, Medal, Save, Settings2, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';

const roleInfo = {
  observer: ['Pengamat', 'Observer'], reviewer: ['Reviewer', 'Reviewer'], admin: ['Administrator', 'Administrator'],
};

export default function Profil() {
  const { data, t, logout, tell, setLang, setNotify, update } = usePFI();
  const account = data.account;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({ name: account?.name || '', org: account?.org || '', bio: account?.bio || '', avatarUrl: account?.avatarUrl || '' }));
  useEffect(() => { if (account) setForm({ name: account.name || '', org: account.org || '', bio: account.bio || '', avatarUrl: account.avatarUrl || '' }); }, [account?.id, account?.name, account?.org, account?.bio, account?.avatarUrl]);
  useEffect(() => { if (!settingsOpen) return undefined; const escape = event => event.key === 'Escape' && setSettingsOpen(false); window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape); }, [settingsOpen]);
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
      <div className="profile-cover-actions"><button className="profile-settings-trigger" onClick={() => setSettingsOpen(true)} aria-label={t('Buka pengaturan profil','Open profile settings')}><Settings2 size={19}/><span>{t('Pengaturan','Settings')}</span></button><button className="profile-edit" onClick={() => setEditing(!editing)}>{editing ? <X size={16}/> : <Edit3 size={16}/>} {editing ? t('Batal', 'Cancel') : t('Edit profil', 'Edit profile')}</button></div>
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
          <div className="profile-fields"><label><span><UserRound size={15}/>{t('Nama lengkap', 'Full name')}</span><input value={form.name} onChange={e => setForm({...form, name:e.target.value})} minLength={2} maxLength={80} required/></label><label><span><Building2 size={15}/>{t('Organisasi / lembaga', 'Organization')}</span><input value={form.org} onChange={e => setForm({...form, org:e.target.value})} maxLength={120}/></label><label className="wide"><span><FileText size={15}/>{t('Tentang Anda', 'About you')}</span><textarea value={form.bio} onChange={e => setForm({...form, bio:e.target.value})} maxLength={360} rows={4} placeholder={t('Ceritakan bidang dan pengalaman pengamatan Anda…', 'Share your field and observation experience…')}/><small>{form.bio.length}/360</small></label><label className="wide"><span><Image size={15}/>{t('URL foto profil', 'Profile photo URL')}</span><input type="url" value={form.avatarUrl} onChange={e => setForm({...form, avatarUrl:e.target.value})} placeholder="https://…"/><small>{t('Foto Google digunakan otomatis. Tempel URL HTTPS lain untuk menggantinya.', 'Your Google photo is used automatically. Paste another HTTPS URL to replace it.')}</small></label></div>
          <button className="btn primary" disabled={saving}><Save size={16}/>{saving ? t('Menyimpan…', 'Saving…') : t('Simpan perubahan', 'Save changes')}</button>
        </form> : <section className="profile-panel profile-about"><header><div><span>{t('TENTANG', 'ABOUT')}</span><h2>{t('Profil profesional', 'Professional profile')}</h2></div><UserRound size={20}/></header><p>{account.bio || t('Belum ada bio. Tambahkan bidang keahlian, pengalaman rukyat, atau kegiatan falaq Anda agar anggota lain lebih mengenal Anda.', 'No bio yet. Add your expertise, observation experience, or astronomy activities so other members can know you better.')}</p><dl><div><dt><Mail size={14}/>{t('Email akun · privat', 'Account email · private')}</dt><dd>{account.email}</dd></div><div><dt><CalendarDays size={14}/>{t('Bergabung', 'Joined')}</dt><dd>{account.created ? new Date(account.created).toLocaleDateString(data.lang === 'id' ? 'id-ID' : 'en-US', {month:'long', year:'numeric'}) : '—'}</dd></div><div><dt><Medal size={14}/>{t('Peran anggota', 'Member role')}</dt><dd>{t(...role)}</dd></div><div><dt><ShieldCheck size={14}/>{t('Status verifikasi', 'Verification status')}</dt><dd>{verified?t('Terverifikasi','Verified'):account.verification==='pending'?t('Sedang ditinjau','Under review'):t('Belum terverifikasi','Not verified')}</dd></div></dl>{account.reviewNote&&<div className="profile-review-note"><ShieldCheck size={16}/><span><b>{t('Catatan peninjau','Reviewer note')}</b>{account.reviewNote}</span></div>}</section>}

        {showVerify && <section className="profile-panel verify-panel"><header><div><span>{t('VERIFIKASI', 'VERIFICATION')}</span><h2>{t('Ajukan tanda centang', 'Request verified mark')}</h2></div><ShieldCheck size={20}/></header><p>{t('Jelaskan lembaga, pengalaman, atau bukti kegiatan pengamatan Anda.', 'Describe your institution, experience, or observation evidence.')}</p><label className="verification-evidence">{t('Keterangan bukti','Evidence description')}<textarea value={evidence} onChange={e=>setEvidence(e.target.value)} rows={5} minLength={20} maxLength={1000} placeholder={t('Contoh: lembaga, pengalaman rukyat, tautan publikasi, atau kegiatan falak…','Example: institution, observation experience, publication links, or astronomy activities…')}/><small>{evidence.length}/1000 · {t('minimal 20 karakter','minimum 20 characters')}</small></label><div className="verify-actions"><button className="btn secondary" type="button" onClick={()=>setShowVerify(false)}>{t('Batal','Cancel')}</button><button className="btn primary" disabled={submitting||evidence.trim().length<20} onClick={submitVerification}>{submitting ? t('Mengirim…','Submitting…') : t('Kirim pengajuan','Submit request')}</button></div></section>}
      </main>

      <aside className="profile-sidebar">
        <button className="profile-settings-card" onClick={()=>setSettingsOpen(true)}><span className="profile-settings-icon"><Settings2 size={22}/></span><span><b>{t('Pengaturan profil','Profile settings')}</b><small>{t('Bahasa, pengingat, dan akun','Language, reminders, and account')}</small></span></button>
        {!['pending','verified'].includes(account.verification) && <button className="profile-verify-action" onClick={()=>setShowVerify(!showVerify)}><ShieldCheck size={20}/><span><b>{t('Dapatkan tanda terverifikasi','Get verified')}</b><small>{t('Ajukan pemeriksaan identitas','Request an identity review')}</small></span></button>}
      </aside>
    </div>

    {settingsOpen && <div className="profile-settings-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setSettingsOpen(false)}><section className="profile-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title"><header><div><span className="profile-settings-sheet-icon"><Settings2 size={22}/></span><div><small>PFI MEMBER</small><h2 id="profile-settings-title">{t('Pengaturan profil','Profile settings')}</h2></div></div><button type="button" onClick={()=>setSettingsOpen(false)} aria-label={t('Tutup pengaturan','Close settings')}><X size={21}/></button></header><div className="profile-settings-content"><section><h3><Bell size={18}/>{t('Notifikasi','Notifications')}</h3><div className="setting-row"><div><Bell size={18}/><span><b>{t('Peringatan agenda','Event reminders')}</b><small>{t('Terima pengingat agenda falak penting pada aplikasi.','Receive reminders for important astronomy events in the app.')}</small></span></div><button role="switch" aria-label={t('Aktifkan peringatan agenda','Enable event reminders')} aria-checked={data.notify} className={`profile-switch ${data.notify?'on':''}`} onClick={()=>setNotify(!data.notify)}><i/></button></div></section><section><h3><Languages size={18}/>{t('Bahasa aplikasi','Application language')}</h3><button className="profile-language-choice" onClick={()=>setLang(data.lang==='id'?'en':'id')}><Globe2 size={19}/><span><b>{data.lang==='id'?'Bahasa Indonesia':'English'}</b><small>{t('Sentuh untuk menggunakan English','Tap to use Bahasa Indonesia')}</small></span><span className="mini-action">{t('Ubah','Change')}</span></button></section><section><h3><ShieldCheck size={18}/>{t('Keamanan akun','Account security')}</h3><div className="profile-security-note"><ShieldCheck size={20}/><span><b>{t('Identitas Google terhubung','Google identity connected')}</b><small>{t('PFI tidak menyimpan atau meminta kata sandi Google Anda.','PFI does not store or request your Google password.')}</small></span></div></section></div><footer><button className="profile-logout" onClick={logout}><LogOut size={17}/>{t('Keluar dari akun','Sign out')}</button></footer></section></div>}
  </div>;
}
