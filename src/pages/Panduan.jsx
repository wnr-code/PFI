import React from 'react';
import { usePFI } from '../state.jsx';
import {
  BookOpen, UsersRound, Building2, UserRoundCheck, MapPin,
  ClipboardCheck, Camera, ShieldCheck, MessageCircle, ArrowRight,
} from 'lucide-react';

const sections = [
  {
    icon: UsersRound, title: 'Jenis keanggotaan', en: 'Membership types',
    intro: 'PFI terbuka untuk pengamat mandiri, komunitas, pesantren, perguruan tinggi, dan lembaga yang ingin berkolaborasi.',
    introEn: 'PFI welcomes independent observers, communities, pesantren, universities, and institutions interested in collaboration.',
    points: [
      ['Anggota / Pengamat', 'Bergabung untuk belajar, berdiskusi, dan mengirim catatan pengamatan.'],
      ['Pengamat mandiri', 'Melakukan pengamatan atas inisiatif sendiri dan mencantumkan data lokasi serta instrumen.'],
      ['Lembaga Mitra', 'Institusi atau komunitas yang mendaftar untuk berkolaborasi dengan PFI.'],
      ['Koordinator Lembaga', 'Orang yang ditunjuk lembaga mitra sebagai penghubung dan pengelola partisipasi lembaganya.'],
    ],
    pointsEn: [
      ['Member / Observer', 'Join to learn, discuss, and submit observation notes.'],
      ['Independent observer', 'Observe independently and provide location and instrument details.'],
      ['Partner institution', 'An institution or community registered to collaborate with PFI.'],
      ['Institution coordinator', 'A person appointed by a partner institution to coordinate its participation.'],
    ],
  },
  {
    icon: UserRoundCheck, title: 'Cara bergabung', en: 'How to join',
    intro: 'Mulai dari akun pribadi. Jika bergabung melalui lembaga, ajukan atau pilih lembaga sesuai fitur yang tersedia.',
    introEn: 'Start with a personal account. If joining through an institution, submit or select the institution where available.',
    points: [
      ['Buat akun', 'Daftar atau masuk melalui fitur akun di aplikasi PFI.'],
      ['Lengkapi profil', 'Gunakan informasi yang benar dan dapat dihubungi.'],
      ['Ajukan lembaga (jika ada)', 'Cantumkan nama lembaga dan hubungan Anda secara jujur.'],
      ['Tunggu pemeriksaan', 'Pengajuan dapat berstatus Menunggu Verifikasi sampai petugas memeriksanya.'],
    ],
    pointsEn: [
      ['Create an account', 'Register or sign in through the PFI account feature.'],
      ['Complete your profile', 'Use accurate and contactable information.'],
      ['Submit institution details (if applicable)', 'Provide the institution name and your relationship honestly.'],
      ['Wait for review', 'An application may remain Pending Verification until reviewed.'],
    ],
  },
  {
    icon: MapPin, title: 'Mengirim laporan rukyat', en: 'Submitting a rukyat report',
    intro: 'Data yang lengkap membantu petugas memahami konteks pengamatan. Periksa kembali informasi sebelum mengirim.',
    introEn: 'Complete data helps reviewers understand the observation context. Check the details before submitting.',
    points: [
      ['Waktu', 'Tanggal, jam pengamatan, dan zona waktu setempat.'],
      ['Lokasi', 'Nama lokasi dan koordinat GPS yang sesuai dengan tempat pengamatan.'],
      ['Kondisi dan instrumen', 'Cuaca, keadaan ufuk, alat yang digunakan, dan metode pengamatan.'],
      ['Dokumentasi', 'Uraian hasil dan foto asli jika tersedia. Jangan merekayasa data atau dokumentasi.'],
    ],
    pointsEn: [
      ['Time', 'Observation date, time, and local time zone.'],
      ['Location', 'Site name and GPS coordinates matching the observation location.'],
      ['Conditions and instruments', 'Weather, horizon conditions, equipment, and observation method.'],
      ['Documentation', 'Findings and original photos when available. Do not fabricate data or evidence.'],
    ],
  },
  {
    icon: ClipboardCheck, title: 'Tahapan verifikasi', en: 'Verification stages',
    intro: 'Laporan ditinjau melalui proses internal PFI. Petugas dapat meminta informasi tambahan jika diperlukan.',
    introEn: 'Reports are reviewed through PFI’s internal process. Reviewers may request additional information.',
    points: [
      ['Terkirim', 'Laporan sudah diterima oleh sistem.'],
      ['Menunggu pemeriksaan', 'Laporan menunggu peninjauan petugas.'],
      ['Perlu dilengkapi', 'Ada informasi atau dokumentasi yang perlu ditambahkan.'],
      ['Terverifikasi oleh PFI', 'Pemeriksaan internal PFI selesai sesuai prosedur yang berlaku.'],
    ],
    pointsEn: [
      ['Submitted', 'The system has received the report.'],
      ['Pending review', 'The report is waiting for a reviewer.'],
      ['More information needed', 'Additional details or documentation are requested.'],
      ['Verified by PFI', 'PFI’s internal review is complete under its current procedure.'],
    ],
  },
];

export default function Panduan() {
  const { t, lang } = usePFI();
  const english = lang === 'en';
  return (
    <div className="page-wrap pfi-guide">
      <section className="guide-hero">
        <div className="guide-hero-icon"><BookOpen size={25} /></div>
        <div className="eyebrow"><i /> {t('PUSAT BANTUAN PFI', 'PFI HELP CENTRE')}</div>
        <h1>{t('Panduan Anggota PFI', 'PFI Member Guide')}</h1>
        <p>{t('Panduan singkat untuk anggota, pengamat, dan lembaga mitra dalam menggunakan ruang kolaborasi Pusat Falak Indonesia.', 'A practical guide for members, observers, and partner institutions using the Pusat Falak Indonesia collaboration platform.')}</p>
        <div className="guide-tags"><span>Anggota</span><span>Pengamat</span><span>Lembaga Mitra</span></div>
      </section>

      <div className="guide-notice">
        <ShieldCheck size={19} />
        <p>{t('Verifikasi PFI adalah pemeriksaan internal platform/komunitas. Status ini bukan penetapan resmi pemerintah, bukan keputusan sidang isbat, dan tidak menggantikan kewenangan lembaga yang berwenang.', 'PFI verification is an internal platform/community review. It is not an official government determination or an isbat decision, and does not replace the authority of authorized institutions.')}</p>
      </div>

      <div className="guide-section-list">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const points = english ? section.pointsEn : section.points;
          return (
            <section className="card guide-card" key={section.title}>
              <div className="guide-card-heading">
                <div className="guide-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="guide-card-icon"><Icon size={20} /></div>
                <div><h2>{english ? section.en : section.title}</h2><p>{english ? section.introEn : section.intro}</p></div>
              </div>
              <div className="guide-points">
                {points.map(([title, detail]) => (
                  <div className="guide-point" key={title}>
                    <span className="guide-point-mark"><ArrowRight size={14} /></span>
                    <div><b>{title}</b><p>{detail}</p></div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="card guide-etiquette">
        <div className="guide-card-heading">
          <div className="guide-card-icon"><MessageCircle size={20} /></div>
          <div><h2>{t('Etika komunitas', 'Community guidelines')}</h2><p>{t('Jaga ruang belajar bersama tetap aman, terbuka, dan saling menghormati.', 'Keep this shared learning space safe, open, and respectful.')}</p></div>
        </div>
        <ul>
          {(english ? [
            'Share observation data and experience honestly.',
            'Respect differences in hisab, rukyat, and scholarly approaches.',
            'Credit sources when quoting other people’s work.',
            'Protect members’ privacy and do not share personal data without permission.',
            'Discuss disagreements politely and constructively.',
          ] : [
            'Sampaikan data dan pengalaman pengamatan secara jujur.',
            'Hormati perbedaan metode hisab, rukyat, dan pendekatan keilmuan.',
            'Cantumkan sumber saat mengutip karya pihak lain.',
            'Jaga privasi anggota dan jangan membagikan data pribadi tanpa izin.',
            'Sampaikan perbedaan pendapat dengan santun dan membangun.',
          ]).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <div className="guide-footer">
        <Camera size={18} />
        <p>{t('Butuh bantuan akun atau mengalami kendala penggunaan? Gunakan kanal bantuan resmi yang ditampilkan di aplikasi PFI. Panduan ini merupakan panduan umum awal dan dapat diperbarui mengikuti perkembangan fitur.', 'Need account assistance or having trouble using the app? Use the official support channel shown in PFI. This is an initial general guide and may change as features evolve.')}</p>
      </div>
    </div>
  );
}
