import React, { useState, useMemo, useEffect } from 'react';
import { usePFI, go } from '../state.jsx';
import { lunar, position, sunsetTime, clock, isoDay, SITES, zlabel } from '../lib/astro.js';
import {
  Moon, Sun, Calendar, Clock, MapPin, Play, Compass, Eclipse, RefreshCw,
} from 'lucide-react';

const TABS = [
  { id: 'simulasi', label: 'Simulasi Hilal', icon: Moon },
  { id: 'fase', label: 'Fase Bulan', icon: Sun },
  { id: 'peta', label: 'Peta Langit', icon: Compass },
];

export default function Astronomi() {
  const { data, t, tell } = usePFI();
  const [tanggal, setTanggal] = useState(() => {
    const initialSite = SITES.find((item) => item.id === data.site) || SITES[0];
    return isoDay(new Date(), initialSite);
  });
  const [siteId, setSiteId] = useState(() => SITES.some((item) => item.id === data.site) ? data.site : 'tasik');

  useEffect(() => {
    if (SITES.some((item) => item.id === data.site)) setSiteId(data.site);
  }, [data.site]);

  const site = SITES.find((s) => s.id === siteId) || SITES[0];
  // MABIMS criteria are evaluated at local sunset, not at an arbitrary clock time.
  const observationDate = useMemo(() => sunsetTime(tanggal, site), [tanggal, site]);
  const moon = useMemo(() => observationDate ? lunar(observationDate) : null, [observationDate]);

  const simulasi = useMemo(() => {
    if (!observationDate) return null;
    try {
      const pos = position('Moon', observationDate, site);
      return {
        alt: pos.alt,
        az: pos.az,
        ra: pos.ra,
        dec: pos.dec,
        dist: pos.dist,
      };
    } catch {
      return null;
    }
  }, [observationDate, site]);
  const meets = Number.isFinite(simulasi?.alt) && simulasi.alt >= 3 &&
    Number.isFinite(moon?.elongation) && moon.elongation >= 6.4;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('ASTRONOMI / SIMULASI HILAL', 'ASTRONOMY / CRESCENT SIMULATION')}</div>
        <h1>{t('Simulasi posisi hilal saat matahari terbenam', 'Crescent position simulation at local sunset')}</h1>
        <p>{t('Lihat ketinggian, azimut, dan pemenuhan kriteria MABIMS pada waktu terbenam Matahari. Verifikasi koordinat serta elevasi lokasi acuan sebelum digunakan di lapangan.', 'View crescent height, azimuth, and MABIMS criteria at local sunset. Verify reference-site coordinates and elevation before field use.')}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{t('Pengaturan Simulasi', 'Simulation Settings')}</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="field">
              <label>{t('Tanggal', 'Date')}</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('Waktu terbenam Matahari', 'Local sunset')}</label>
              <div className="result-box">
                <b>{observationDate ? `${clock(observationDate, site)} ${zlabel(site)}` : '—'}</b>
                <small>{t('Dihitung dari koordinat lokasi', 'Calculated for selected coordinates')}</small>
              </div>
            </div>
            <div className="field">
              <label>{t('Lokasi', 'Location')}</label>
              <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                {SITES.map((s) => (
                  <option key={s.id} value={s.id}>{s.city}, {s.region}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{t('Hasil Simulasi', 'Simulation Result')}</h2>
        </div>
        <div className="card-body">
          <div className="result-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            <div className="metric">
              <span className="label">{t('Tinggi Hilal', 'Crescent Height')}</span>
              <b>{simulasi ? simulasi.alt.toFixed(2) : '—'}°</b>
              <small>{t('di atas horizon', 'above horizon')}</small>
            </div>
            <div className="metric">
              <span className="label">{t('Azimut', 'Azimuth')}</span>
              <b>{simulasi ? simulasi.az.toFixed(2) : '—'}°</b>
              <small>{t('arah kompas', 'compass direction')}</small>
            </div>
            <div className="metric">
              <span className="label">{t('Elongasi', 'Elongation')}</span>
              <b>{moon?.elongation?.toFixed?.(1) ?? '—'}°</b>
              <small>{t('jarak dari matahari', 'from sun')}</small>
            </div>
            <div className="metric">
              <span className="label">{t('Kriteria MABIMS', 'MABIMS Criteria')}</span>
              <b>{meets ? t('Memenuhi kriteria', 'Criteria met') : t('Belum memenuhi', 'Criteria not met')}</b>
              <small>{meets ? '✓' : '✗'}</small>
            </div>
          </div>

          <p style={{ marginTop: 14, fontSize: 11, lineHeight: 1.6, color: '#8fa3b8' }}>
            {t('Perhitungan 3° dan 6,4° ini berlaku untuk lokasi terpilih pada saat Matahari terbenam, bukan evaluasi nasional multi-titik. Memenuhi kriteria tidak menjamin hilal pasti terlihat; cuaca, transparansi atmosfer, dan kondisi ufuk tetap berpengaruh. Penetapan resmi mengikuti keputusan pemerintah.', 'The 3° and 6.4° thresholds are evaluated at sunset for the selected location, not as a nationwide multi-site assessment. Meeting them does not guarantee an actual sighting; weather, atmospheric transparency, and horizon conditions still matter. Official month declarations follow the competent authority.')}
          </p>
          <div style={{ marginTop: 20, height: 200, background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: '#8fa3b8', textAlign: 'center', padding: 10 }}>
              {t('Diagram ketinggian hilal (ilustrasi)', 'Crescent height diagram (illustration)')}
              <br />
              0°{'\xa0\xa0\xa0\xa0'}45°{'\xa0\xa0\xa0\xa0'}90°
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
