import React, { useState, useMemo, useEffect } from 'react';
import { usePFI, go } from '../state.jsx';
import {
  calculateHisab, hijri, periods, SITES, num, clock, zlabel,
} from '../lib/astro.js';
import { api } from '../lib/api.js';
import {
  Calendar, MapPin, Settings, Sun, Moon, Compass, FileDown, Share2, Calculator,
  ArrowRight, CheckCircle2, Info, History,
} from 'lucide-react';

const BULAN_HIJRIAH = [
  'Muharram', 'Safar', 'Rabi\'ul Awwal', 'Rabi\'ul Akhir',
  'Jumadil Awwal', 'Jumadil Akhir', 'Rajab', 'Syaban',
  'Ramadan', 'Syawal', 'Dzulqaidah', 'Dzulhijah',
];

const BULAN_HIJRIAH_EN = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah',
];

export default function Hisab() {
  const { data, t, lang, loc, tell, update } = usePFI();
  const [bulan, setBulan] = useState(8); // Ramadan default
  const [siteId, setSiteId] = useState(() => SITES.some((item) => item.id === data.site) ? data.site : 'tasik');
  const [metode, setMetode] = useState('mabims');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (SITES.some((item) => item.id === data.site)) setSiteId(data.site);
  }, [data.site]);

  const site = SITES.find((s) => s.id === siteId) || SITES[0];

  const hitung = async () => {
    setBusy(true);
    try {
      const period = periods(new Date(), site)
        .filter((item) => item.month === bulan + 1)
        .sort((a, b) => a.start.localeCompare(b.start))[0];
      if (!period) throw new Error('Awal bulan Hijriah yang dipilih belum ditemukan dalam rentang kalender.');
      const r = calculateHisab(period, site, metode);
      try {
        const authoritative = await api('/api/hisab', 'POST', {
          site: siteId,
          start: period.start,
          method: metode,
        });
        setResult(authoritative);
        tell(authoritative.saved
          ? t('Perhitungan selesai dan tersimpan ke riwayat akun.', 'Calculation complete and saved to account history.')
          : t('Perhitungan selesai. Masuk ke akun untuk menyimpan riwayat.', 'Calculation complete. Sign in to save it to account history.'));
      } catch (e) {
        // Only a network failure may fall back to the local engine. HTTP errors
        // mean the server rejected the request and must be shown to the user.
        if (Number.isInteger(e.status)) throw e;
        console.warn('API hisab tidak terjangkau; memakai perhitungan lokal:', e.message);
        setResult(r);
        tell(t('Perhitungan lokal selesai. Hasil belum tersimpan ke akun.', 'Local calculation complete. Result has not been saved to your account.'));
      }
    } catch (e) {
      tell(e.message || 'Perhitungan gagal.');
    } finally {
      setBusy(false);
    }
  };

  const formatAngle = (v) => v?.toFixed?.(2) ?? '—';
  const formatTime = (v) => {
    if (!v) return '—';
    return new Date(v).toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-GB', {
      timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };

  const formatLocalTime = (value) => value ? `${clock(new Date(value), site)} ${zlabel(site)}` : '—';
  const bulanLabel = lang === 'id' ? BULAN_HIJRIAH[bulan] : BULAN_HIJRIAH_EN[bulan];

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('HISAB AWAL BULAN', 'NEW MONTH CALCULATION')}</div>
        <h1>{t('Perhitungan awal bulan Hijriah', 'New month calculation')}</h1>
        <p>{t('Hitung ijtimak, terbenam matahari, tinggi hilal, elongasi, dan posisi bulan.', 'Calculate conjunction, sunset, crescent height, elongation, and moon position.')}</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="field">
              <label>{t('Bulan Hijriah', 'Hijri Month')}</label>
              <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
                {BULAN_HIJRIAH.map((b, i) => (
                  <option key={i} value={i}>{b}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('Lokasi Pengamatan', 'Observation Site')}</label>
              <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                {SITES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.city}, {s.region}
                  </option>
                ))}
              </select>
              <small>{t('Titik acuan proyek; cocokkan koordinat dan elevasi dengan data lapangan sebelum digunakan untuk keputusan operasional.', 'Project reference site; verify coordinates and elevation against field data before operational use.')}</small>
            </div>
            <div className="field">
              <label>{t('Metode Hisab', 'Calculation Method')}</label>
              <small>{t('Saat ini metode MABIMS yang sudah tersedia dan divalidasi pada API.', 'MABIMS is currently the implemented and API-validated method.')}</small>
              <select value={metode} onChange={(e) => setMetode(e.target.value)}>
                <option value="mabims">MABIMS (tinggi ≥ 3°, elongasi ≥ 6,4°)</option>

              </select>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <button
              className="btn primary full"
              onClick={hitung}
              disabled={busy}
            >
              {busy ? t('Menghitung…', 'Calculating…') : <><Calculator size={18} /> {t('Hitung Sekarang', 'Calculate Now')}</>}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="card">
          <div className="card-header">
            <h2>{t('Hasil Perhitungan', 'Calculation Result')}</h2>
            <span className="pill verified">{t('Data astronomis', 'Astronomical Data')}</span>
          </div>
          <div className="card-body">
            <div className="result-grid">
              <div className="result-box">
                <span className="label">{t('Waktu Ijtimak', 'Conjunction Time')}</span>
                <b>{formatTime(result.conj)}</b>
                <small>{t('UTC', 'UTC')}</small>
              </div>
              <div className="result-box">
                <span className="label">{t('Terbenam Matahari', 'Local Sunset')}</span>
                <b>{formatLocalTime(result.sunset)}</b>
                <small>{site.city} · {zlabel(site)}</small>
              </div>
              <div className="result-box">
                <span className="label">{t('Tinggi Hilal', 'Crescent Height')}</span>
                <b>{formatAngle(result.moon?.alt)}°</b>
                <small>{t('pada terbenam matahari', 'at sunset')}</small>
              </div>
              <div className="result-box">
                <span className="label">{t('Elongasi', 'Elongation')}</span>
                <b>{formatAngle(result.elongation)}°</b>
                <small>{t('jarak bulan-matahari', 'moon-sun distance')}</small>
              </div>
              <div className="result-box">
                <span className="label">{t('Umur Bulan', 'Moon Age')}</span>
                <b>{formatAngle(result.age)}</b>
                <small>{t('jam', 'hours')}</small>
              </div>
              <div className="result-box">
                <span className="label">{t('Azimut Hilal', 'Crescent Azimuth')}</span>
                <b>{formatAngle(result.moon?.az)}°</b>
                <small>{t('arah mata kompas', 'compass direction')}</small>
              </div>
              <div className="result-box">
                <span className="label">{t('Visibilitas', 'Visibility')}</span>
                <b>{result.meets ? t('Memenuhi kriteria', 'Criteria met') : t('Belum memenuhi', 'Criteria not met')}</b>
                <small>{result.meets ? '✓' : '✗'}</small>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 14, background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 8 }}>
              <h3 style={{ fontSize: 13, marginBottom: 8, color: '#d6ae62' }}>{t('Kesimpulan', 'Conclusion')}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#c7d1df' }}>{result.meets ? t('Kriteria MABIMS terpenuhi secara hisab pada lokasi yang dipilih. Ini bukan evaluasi seluruh titik Indonesia, bukan bukti hilal benar-benar terlihat, dan bukan penetapan resmi awal bulan.', 'The MABIMS criteria are met at the selected location only. This is not a nationwide multi-site assessment, does not prove an actual sighting, and is not an official month declaration.') : t('Kriteria MABIMS belum terpenuhi pada lokasi yang dipilih. Ini bukan evaluasi seluruh titik Indonesia dan bukan keputusan resmi awal bulan.', 'The MABIMS criteria are not met at the selected location. This is not a nationwide multi-site assessment or an official month determination.')}</p>
              <p style={{ fontSize: 11, color: '#747f8e', marginTop: 8 }}>
                {t('Hasil perhitungan adalah data astronomis, bukan keputusan resmi awal bulan. Setiap lembaga (MUI, NU, Muhammadiyah, dll.) memiliki metoda perhitungan sendiri.', 'Calculation results are astronomical data, not official new month determination. Each institution (MUI, NU, Muhammadiyah, etc.) has its own calculation method.')}
              </p>
            </div>
          </div>
          <div className="card-footer">
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn secondary full" onClick={() => tell(t('PDF akan diunduh (demo).', 'PDF will download (demo).'))}>
                <FileDown size={16} /> {t('Unduh PDF', 'Download PDF')}
              </button>
              <button className="btn secondary full" onClick={() => {
                const txt = `Hisab ${bulanLabel}: Tinggi ${formatAngle(result.moon?.alt)}°, Elongasi ${formatAngle(result.elongation)}°, ${result.meets ? 'Kriteria MABIMS terpenuhi' : 'Kriteria MABIMS belum terpenuhi'}`;
                navigator.clipboard?.writeText(txt).then(() => tell(t('Disalin ke clipboard.', 'Copied to clipboard.')));
              }}>
                <Share2 size={16} /> {t('Bagikan', 'Share')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
