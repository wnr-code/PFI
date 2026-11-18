import React, { useState, useMemo } from 'react';
import { usePFI, go } from '../state.jsx';
import { lunar, position, dateFmt, SITES } from '../lib/astro.js';
import {
  Moon, Sun, Calendar, Clock, MapPin, Play, Compass, Eclipse, RefreshCw,
} from 'lucide-react';

const TABS = [
  { id: 'simulasi', label: 'Simulasi Hilal', icon: Moon },
  { id: 'fase', label: 'Fase Bulan', icon: Sun },
  { id: 'peta', label: 'Peta Langit', icon: Compass },
];

export default function Astronomi() {
  const { data, t, lang, loc } = usePFI();
  const [tab, setTab] = useState('simulasi');
  [new Date().toISOString().slice(0, 10)];
  const [waktu, setWaktu] = useState('18:00');
  const [siteId, setSiteId] = useState(data.site || 'jakarta');

  const site = SITES.find((s) => s.id === siteId) || SITES[0];
  const moon = useMemo(() => lunar(new Date(`${waktu}:00+07:00`)), [waktu, siteId]);

  const simulasi = useMemo(() => {
    try {
      const pos = position(new Date(`${waktu}:00+07:00`), site);
      return {
        alt: pos.alt?.toFixed?.(2) ?? 0,
        az: pos.az?.toFixed?.(2) ?? 0,
        ra: pos.ra?.toFixed?.(2) ?? 0,
        dec: pos.dec?.toFixed?.(2) ?? 0,
        dist: pos.dist?.toFixed?.(0) ?? 0,
      };
    } catch (e) {
      return { alt: 0, az: 0, ra: 0, dec: 0, dist: 0 };
    }
  }, [waktu, siteId]);

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('ASTRONOMI / SIMULASI HILAL', 'ASTRONOMY / CRESCENT SIMULATION')}</div>
        <h1>{t('Simulasi posisi bulan setelah matahari terbenam', 'Crescent position simulation after sunset')}</h1>
        <p>{t('Lihat ketinggian, azimut, dan visibilitas hilal dari lokasi pengamatan.', 'View crescent height, azimuth, and visibility from observation site.')}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{t('Pengaturan Simulasi', 'Simulation Settings')}</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="field">
              <label>{t('Tanggal', 'Date')}</label>
              <input type="date" defaultValue="2026-02-17" />
            </div>
            <div className="field">
              <label>{t('Waktu', 'Time')}</label>
              <select value={waktu} onChange={(e) => setWaktu(e.target.value)}>
                {[17, 18, 19, 20, 21].map((h) => (
                  <option key={h} value={`${h}:00`}>{h.toString().padStart(2, '0')}:00 WIB</option>
                ))}
              </select>
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
          <div style={{ marginTop: 18 }}>
            <button
              className="btn primary full"
              onClick={() => tell(t('Simulasi dijalankan.', 'Simulation run.'))}
            >
              <Play size={18} /> {t('Jalankan Simulasi', 'Run Simulation')}
            </button>
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
              <b>{simulasi.alt}°</b>
              <small>{t('di atas horizon', 'above horizon')}</small>
            </div>
            <div className="metric">
              <span className="label">{t('Azimut', 'Azimuth')}</span>
              <b>{simulasi.az}°</b>
              <small>{t('arah kompas', 'compass direction')}</small>
            </div>
            <div className="metric">
              <span className="label">{t('Elongasi', 'Elongation')}</span>
              <b>{moon.elongation?.toFixed?.(1) ?? '—'}°</b>
              <small>{t('jarak dari matahari', 'from sun')}</small>
            </div>
            <div className="metric">
              <span className="label">{t('Visibilitas', 'Visibility')}</span>
              <b>{Number(simulasi.alt) >= 3 ? t('Cukup Baik', 'Good') : t('Kurang Baik', 'Poor')}</b>
              <small>{Number(simulasi.alt) >= 3 ? '✓' : '✗'}</small>
            </div>
          </div>

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
