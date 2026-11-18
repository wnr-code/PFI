import React, { useState, useMemo } from 'react';
import { usePFI, go } from '../state.jsx';
import { MapPin, UsersRound, FileText } from 'lucide-react';

export default function PetaRukyat() {
  const { data, t, lang } = usePFI();
  const [layer, setLayer] = useState('sites');

  const sites = [
    { id: 'tasik', city: 'Tasikmalaya', site: 'Bukit Panyangrayan', region: 'Jawa Barat', lat: -7.407, lon: 108.142, elev: 698 },
    { id: 'bogor', city: 'Bogor', site: 'Kemang', region: 'Jawa Barat', lat: -6.597, lon: 106.797, elev: 220 },
    { id: 'yogya', city: 'Yogyakarta', site: 'Bukit Ijo', region: 'DIY', lat: -7.833, lon: 110.417, elev: 290 },
  ];

  const reports = [
    { id: 'r1', city: 'Tasikmalaya', author: 'Tim Rukyat PFI', status: 'verified', date: '28 Feb 2025', initial: 'TR' },
    { id: 'r2', city: 'Bogor', author: 'Ahmad Fauzi', status: 'pending', date: '28 Feb 2025', initial: 'AF' },
  ];

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('PETA RUKYAT NASIONAL', 'NATIONAL OBSERVATION MAP')}</div>
        <h1>{t('Titik Pengamatan', 'Observation Sites')}</h1>
        <p>{t('Lokasi referensi pengamatan hilal dan laporan komunitas di seluruh Indonesia.', 'Reference crescent observation sites and community reports across Indonesia.')}</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          className={`btn ${layer === 'sites' ? 'primary' : 'secondary'} full`}
          onClick={() => setLayer('sites')}
        >
          <LayerGroup size={16} /> {t('Tampilkan titik', 'Show sites')}
        </button>
        <button
          className={`btn ${layer === 'reports' ? 'primary' : 'secondary'} full`}
          onClick={() => setLayer('reports')}
        >
          <UsersRound size={16} /> {t('Tampilkan laporan', 'Show reports')}
        </button>
      </div>

      <div className="card" style={{ minHeight: 400 }}>
        <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#747f8e', fontSize: 13 }}>
          {t('Peta interaktif akan ditampilkan di sini (demo). Titik-titik merah adalah lokasi referensi rukyat.', 'Interactive map will be displayed here (demo). Red dots are reference rukyat locations.')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, padding: 16 }}>
          {sites.map((s) => (
            <div key={s.id} style={{ padding: 12, background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 8 }}>
              <b style={{ fontSize: 13 }}>{s.city}</b>
              <div style={{ fontSize: 11, color: '#8fa3b8' }}>{s.site}, {s.region}</div>
              <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 4 }}>{s.lat}°, {s.lon}° · {s.elev} m</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{t('Laporan Terbaru', 'Recent Reports')}</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reports.map((r) => (
              <div key={r.id} style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <b style={{ fontSize: 13 }}>{r.author}</b>
                    <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 2 }}>{r.city} · {r.date}</div>
                  </div>
                  <span className={`pill ${r.status === 'verified' ? 'verified' : 'pending'}`} style={{ fontSize: 9 }}>
                    {r.status === 'verified' ? t('Terverifikasi', 'Verified') : t('Menunggu', 'Pending')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: 11, color: '#747f8e' }}>
        {t('Proyeksi peta sederhana untuk ilustrasi. Koordinat dalam derajat desimal WGS84.', 'Simple map projection for illustration. Coordinates in decimal degrees WGS84.')}
      </div>
    </div>
  );
}
