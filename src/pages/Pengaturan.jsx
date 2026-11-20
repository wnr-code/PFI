import React from 'react';
import { BookOpen, UsersRound, Building2, ShieldCheck, Telescope, FileCheck2, ChevronRight, Settings as SettingsIcon, GraduationCap, Send } from 'lucide-react';
import { usePFI } from '../state.jsx';
const items = [
 {route:'pedoman-keanggotaan',icon:UsersRound,title:'Pedoman Keanggotaan',en:'Membership Guidelines',desc:'Hak, peran, pendaftaran, dan tata cara partisipasi anggota PFI.',descEn:'Member rights, roles, registration, and participation.'},
 {route:'pedoman-lembaga',icon:Building2,title:'Pedoman Lembaga Mitra',en:'Partner Institution Guidelines',desc:'Persyaratan lembaga, dokumen pendukung, dan penunjukan koordinator.',descEn:'Institution requirements, supporting documents, and coordinator appointments.'},
 {route:'pedoman-verifikasi',icon:ShieldCheck,title:'Pedoman Verifikasi Pengamat',en:'Observer Verification Guidelines',desc:'Bukti identitas, pengalaman pengamatan, dan tahapan pemeriksaan akun.',descEn:'Identity evidence, observation experience, and account review stages.'},
 {route:'pedoman-keahlian',icon:GraduationCap,title:'Pedoman Keahlian Falak',en:'Falak Expertise Guidelines',desc:'Penilaian kompetensi, pendidikan, guru pembimbing, dan pengalaman.',descEn:'Competency review, education, mentors, and experience.'},
 {route:'pedoman-rukyat',icon:Telescope,title:'Pedoman Laporan Rukyat',en:'Rukyat Report Guidelines',desc:'Standar pencatatan waktu, lokasi, kondisi, instrumen, dan dokumentasi.',descEn:'Standards for recording time, location, conditions, instruments, and evidence.'},
 {route:'pedoman-etika',icon:FileCheck2,title:'Etika dan Kebijakan Komunitas',en:'Community Code of Conduct',desc:'Kejujuran data, privasi, keselamatan, dan sikap saling menghormati.',descEn:'Data integrity, privacy, safety, and respectful participation.'},
];
export default function Pengaturan(){
 const {t,lang}=usePFI(); const english=lang==='en';
 return <div className="page-wrap pfi-settings">
  <div className="page-head"><div className="eyebrow"><i/>{t('PREFERENSI & INFORMASI','PREFERENCES & INFORMATION')}</div><h1>{t('Pengaturan','Settings')}</h1><p>{t('Pusat pedoman dan ketentuan penggunaan Platform Falak Indonesia.','PFI guidelines and platform policies in one place.')}</p></div>
  <section className="settings-intro"><div className="settings-intro-icon"><SettingsIcon size={22}/></div><div><b>{t('Pusat Pedoman PFI','PFI Guidelines Centre')}</b><p>{t('Pilih pedoman sesuai pengajuan atau kegiatan Anda. Bacalah persyaratan sebelum mengirim permohonan. Pedoman internal pengurus tidak ditampilkan di area publik ini.','Choose the guideline relevant to your application or activity. Review requirements before submitting. Internal governance documents are not displayed in this public area.')}</p></div></section>
  <a className="card settings-guide-card" href="#/ajukan-lembaga" style={{marginBottom:16,borderColor:'var(--gold)'}}><div className="settings-guide-icon"><Send size={20}/></div><div className="settings-guide-copy"><small>{t('LAYANAN LEMBAGA','INSTITUTION SERVICE')}</small><h2>{t('Ajukan Kemitraan Lembaga','Apply for Institution Partnership')}</h2><p>{t('Kirim permohonan resmi lembaga Anda dan pantau status pemeriksaannya.','Submit your institution partnership request and track its review status.')}</p></div><ChevronRight size={18} className="settings-guide-arrow"/></a>
  <div className="settings-guide-grid">{items.map(({route,icon:Icon,title,en,desc,descEn},i)=><a className="card settings-guide-card" href={'#/'+route} key={route}><div className="settings-guide-icon"><Icon size={20}/></div><div className="settings-guide-copy"><small>{t('PEDOMAN','GUIDELINE')} 0{i+1}</small><h2>{english?en:title}</h2><p>{english?descEn:desc}</p></div><ChevronRight size={18} className="settings-guide-arrow"/></a>)}</div>
  <div className="settings-note"><BookOpen size={17}/><p>{t('Pedoman umum ini dapat diperbarui mengikuti kebijakan dan perkembangan fitur PFI. Jika ada perubahan, pengelola akan mengumumkan versi yang berlaku.','These public guidelines may be updated as PFI policies and features evolve. Administrators will announce the current version when changes are made.')}</p></div>
 </div>;
}
