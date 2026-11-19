import React from 'react';
import { BookOpen, UsersRound, Building2, ShieldCheck, Telescope, FileCheck2, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { usePFI } from '../state.jsx';

const items = [
  { icon: UsersRound, title: 'Pedoman Keanggotaan', en: 'Membership Guidelines', desc: 'Hak, peran, dan tata cara partisipasi anggota PFI.', descEn: 'Member roles, participation, and community expectations.' },
  { icon: Building2, title: 'Pedoman Lembaga Mitra', en: 'Partner Institution Guidelines', desc: 'Pendaftaran lembaga, penunjukan koordinator, dan hubungan kemitraan.', descEn: 'Institution registration, coordinator appointments, and partnerships.' },
  { icon: ShieldCheck, title: 'Pedoman Verifikasi', en: 'Verification Guidelines', desc: 'Persyaratan bukti, tahapan pemeriksaan, dan arti status verifikasi.', descEn: 'Evidence requirements, review stages, and verification status meanings.' },
  { icon: Telescope, title: 'Pedoman Pengamatan Rukyat', en: 'Rukyat Observation Guidelines', desc: 'Data waktu, lokasi, instrumen, kondisi ufuk, dan dokumentasi laporan.', descEn: 'Time, location, instruments, horizon conditions, and report documentation.' },
  { icon: FileCheck2, title: 'Pedoman Etika Komunitas', en: 'Community Code of Conduct', desc: 'Kejujuran data, penghormatan perbedaan, dan perlindungan privasi.', descEn: 'Data integrity, respectful discussion, and privacy protection.' },
];

export default function Pengaturan() {
  const { t, lang } = usePFI();
  const english = lang === 'en';
  return (
    <div className="page-wrap pfi-settings">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('PREFERENSI & INFORMASI', 'PREFERENCES & INFORMATION')}</div>
        <h1>{t('Pengaturan', 'Settings')}</h1>
        <p>{t('Temukan pedoman dan ketentuan penggunaan Pusat Falak Indonesia dalam satu tempat.', 'Find PFI guidelines and platform policies in one place.')}</p>
      </div>
      <section className="settings-intro">
        <div className="settings-intro-icon"><SettingsIcon size={22} /></div>
        <div><b>{t('Pusat Pedoman PFI', 'PFI Guidelines Centre')}</b><p>{t('Baca pedoman yang sesuai dengan kegiatan Anda. Tautan juga tersedia pada formulir pengajuan agar pemohon dapat mempelajarinya sebelum mengirim permohonan.', 'Read the guidelines relevant to your activity. Links are also provided in application forms so applicants can review them before submitting.')}</p></div>
      </section>
      <div className="settings-guide-grid">
        {items.map(({icon:Icon,title,en,desc,descEn},i)=>(
          <a className="card settings-guide-card" href="#/panduan" key={title}>
            <div className="settings-guide-icon"><Icon size={20}/></div>
            <div className="settings-guide-copy"><small>{t('PEDOMAN', 'GUIDELINE')} 0{i+1}</small><h2>{english?en:title}</h2><p>{english?descEn:desc}</p></div>
            <ChevronRight size={18} className="settings-guide-arrow"/>
          </a>
        ))}
      </div>
      <div className="settings-note"><BookOpen size={17}/><p>{t('Pedoman ini merupakan panduan umum awal dan dapat diperbarui mengikuti kebijakan serta perkembangan fitur PFI. Jika terdapat perbedaan, ikuti ketentuan resmi yang diumumkan pengelola PFI.', 'These are initial general guidelines and may be updated as PFI policies and features evolve. If anything differs, follow the official rules announced by PFI administrators.')}</p></div>
    </div>
  );
}

// PFI settings page: guideline links are centralized here.
