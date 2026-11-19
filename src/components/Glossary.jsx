/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, { useMemo, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { usePFI } from '../state.jsx';

const TERMS = [
  ['Hisab', 'Perhitungan astronomis untuk mengetahui posisi Matahari dan Bulan serta memperkirakan awal bulan Hijriah.', 'Astronomical calculations used to determine the positions of the Sun and Moon and estimate the start of a Hijri month.'],
  ['Rukyat', 'Pengamatan hilal secara langsung setelah Matahari terbenam.', 'Direct observation of the crescent after sunset.'],
  ['Hilal', 'Bulan sabit muda yang dicari setelah ijtimak sebagai salah satu dasar penentuan awal bulan Hijriah.', 'The young crescent sought after conjunction as one basis for determining a new Hijri month.'],
  ['Ijtimak', 'Saat Bulan dan Matahari berada pada arah bujur langit yang sama. Peristiwa ini menjadi titik awal perhitungan hilal.', 'The moment the Moon and Sun share the same celestial longitude; it is the starting point for crescent calculations.'],
  ['MABIMS', 'Kriteria regional Menteri Agama Brunei, Indonesia, Malaysia, dan Singapura. Aplikasi memakai tinggi Bulan minimal 3° dan elongasi minimal 6,4°.', 'Regional criteria used by Brunei, Indonesia, Malaysia, and Singapore. The app uses a minimum lunar altitude of 3° and elongation of 6.4°.'],
  ['Elongasi', 'Jarak sudut antara Bulan dan Matahari di langit.', 'The angular separation between the Moon and Sun in the sky.'],
  ['Azimut', 'Arah benda langit pada kompas, dihitung dalam derajat mulai dari utara.', 'The compass direction of a celestial object, measured in degrees from north.'],
  ['Tinggi hilal', 'Sudut ketinggian Bulan di atas garis ufuk atau horizon.', 'The angular height of the Moon above the horizon.'],
  ['Ufuk / horizon', 'Garis batas pandangan antara langit dan permukaan Bumi.', 'The apparent boundary between the sky and Earth.'],
  ['Iluminasi', 'Persentase bagian Bulan yang tampak terang dari Bumi.', 'The percentage of the Moon that appears illuminated from Earth.'],
  ['Fase Bulan', 'Perubahan bentuk Bulan yang terlihat, seperti sabit, separuh, cembung, dan purnama.', 'The changing apparent shape of the Moon, such as crescent, quarter, gibbous, and full.'],
  ['Ephemeris', 'Data hasil perhitungan posisi benda langit pada waktu tertentu.', 'Calculated position data for celestial objects at a particular time.'],
  ['Koordinat ekuatorial', 'Sistem penunjuk posisi benda di langit menggunakan right ascension dan declination.', 'A system for locating objects in the sky using right ascension and declination.'],
  ['Right ascension', 'Koordinat arah timur–barat pada bola langit, mirip garis bujur di Bumi.', 'The east–west coordinate on the celestial sphere, similar to longitude on Earth.'],
  ['Declination', 'Koordinat arah utara–selatan pada bola langit, mirip garis lintang di Bumi.', 'The north–south coordinate on the celestial sphere, similar to latitude on Earth.'],
  ['Lintang dan bujur', 'Koordinat untuk menunjukkan lokasi di permukaan Bumi. Lintang menunjukkan utara–selatan, bujur menunjukkan timur–barat.', 'Coordinates for a location on Earth. Latitude is north–south and longitude is east–west.'],
  ['Akurasi GPS', 'Perkiraan ketepatan lokasi perangkat. Nilai ± meter yang lebih kecil berarti lokasi lebih akurat.', 'An estimate of device location precision. A smaller ± metre value means greater accuracy.'],
  ['WIB, WITA, WIT', 'Tiga zona waktu Indonesia: UTC+7, UTC+8, dan UTC+9.', 'Indonesia’s three time zones: UTC+7, UTC+8, and UTC+9.'],
  ['UTC', 'Standar waktu dunia yang menjadi acuan perbandingan zona waktu.', 'The global time standard used as a reference for time zones.'],
  ['Terverifikasi', 'Laporan telah diperiksa dan disetujui peninjau PFI. Status ini bukan keputusan resmi awal bulan.', 'The report has been reviewed and approved by a PFI reviewer. This is not an official new-month declaration.'],
  ['Reviewer / peninjau', 'Pengguna berwenang yang memeriksa kelengkapan dan kewajaran laporan sebelum memberi status terverifikasi.', 'An authorised user who checks a report before assigning verified status.'],
  ['Sidang isbat', 'Proses resmi pemerintah Indonesia untuk menetapkan awal bulan tertentu. Hasil aplikasi hanya data bantu astronomi.', 'Indonesia’s official government process for determining certain Hijri month starts. App results are astronomical aids only.'],
  ['ISS', 'Stasiun Luar Angkasa Internasional, laboratorium berawak yang mengorbit Bumi. ISS tidak memengaruhi terlihatnya hilal.', 'The International Space Station, a crewed laboratory orbiting Earth. It does not affect crescent visibility.'],
];

export default function Glossary() {
  const { t } = usePFI();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => TERMS.filter(([term, id, en]) => `${term} ${id} ${en}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  return <section className="card glossary-card" aria-labelledby="glossary-title">
    <div className="card-header"><div><span className="section-kicker">{t('PANDUAN PEMULA', 'BEGINNER GUIDE')}</span><h2 id="glossary-title"><BookOpen size={19}/>{t('Kamus istilah Falaq', 'Falaq glossary')}</h2></div><span className="glossary-count">{filtered.length}</span></div>
    <div className="glossary-search"><Search size={16}/><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Cari istilah, misalnya hilal atau azimut…', 'Search a term, such as crescent or azimuth…')} aria-label={t('Cari istilah Falaq', 'Search Falaq terms')}/>{query && <button type="button" onClick={() => setQuery('')} aria-label={t('Hapus pencarian', 'Clear search')}><X size={15}/></button>}</div>
    <div className="glossary-grid">{filtered.map(([term, id, en]) => <details key={term} className="glossary-item"><summary>{term}</summary><p>{t(id, en)}</p></details>)}</div>
    {!filtered.length && <p className="glossary-empty">{t('Istilah tidak ditemukan. Coba kata lain.', 'Term not found. Try another word.')}</p>}
  </section>;
}
