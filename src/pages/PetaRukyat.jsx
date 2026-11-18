import React, { useMemo, useState } from 'react';
import { usePFI } from '../state.jsx';
import { MapPin, UsersRound, FileText } from 'lucide-react';

export default function PetaRukyat() {
  const { data, t, lang } = usePFI();
  const [layer, setLayer] = useState('sites');

  const sites = [
    { id: 'tasik', city: 'Tasikmalaya', site: 'Bukit Panyangrayan', region: 'Jawa Barat', lat: -7.407, lon: 108.142, elev: 698 },
    { id: 'bogor', city: 'Bogor', site: 'Kemang', region: 'Jawa Barat', lat: -6.597, lon: 106.797, elev: 220 },
    { id: 'yogya', city: 'Yogyakarta', site: 'Bukit Ijo', region: 'DIY', lat: -7.833, lon: 110.417, elev: 290 },
  ];

  const reports = useMemo(
    () => (data.posts || []).filter((post) => post.type === 'rukyat'),
    [data.posts]
  );

  const dateLabel = (value) => {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return value || '—';
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

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
          <MapPin size={16} /> {t('Tampilkan titik', 'Show sites')}
        </button>
        <button
          className={`btn ${layer === 'reports' ? 'primary' : 'secondary'} full`}
          onClick={() => setLayer('reports')}
        >
          <UsersRound size={16} /> {t('Tampilkan laporan', 'Show reports')}
        </button>
      </div>

      <div className="card" style={{ minHeight: 260 }}>
        <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#747f8e', fontSize: 13 }}>
          <MapPin size={20} />
          {t(
            'Visualisasi peta interaktif sedang disiapkan. Daftar di bawah menampilkan lokasi referensi dan laporan yang benar-benar diterima API.',
            'The interactive map is being prepared. The list below shows reference sites and reports actually returned by the API.'
          )}
        </div>

        {layer === 'sites' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, padding: 16 }}>
            {sites.map((site) => (
              <div key={site.id} style={{ padding: 12, background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                <b style={{ fontSize: 13 }}>{site.city}</b>
                <div style={{ fontSize: 11, color: '#8fa3b8' }}>{site.site}, {site.region}</div>
                <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 4 }}>{site.lat}°, {site.lon}° · {site.elev} m</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reports.length === 0 ? (
              <div style={{ padding: 18, textAlign: 'center', color: '#8fa3b8', fontSize: 13 }}>
                {t('Belum ada laporan rukyat yang diterima.', 'No crescent observation reports have been received yet.')}
              </div>
            ) : reports.map((report) => (
              <div key={report.id} style={{ padding: 12, background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                  <div>
                    <b style={{ fontSize: 13 }}>{report.author}</b>
                    <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 2 }}>{report.city} · {dateLabel(report.date)}</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>{report.title}</div>
                  </div>
                  <span className={`pill ${report.status === 'verified' ? 'verified' : 'pending'}`} style={{ fontSize: 9 }}>
                    {report.status === 'verified'
                      ? t('Terverifikasi', 'Verified')
                      : t('Menunggu', 'Pending')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: 11, color: '#747f8e' }}>
        <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        {t('Koordinat lokasi referensi menggunakan derajat desimal WGS84. Status laporan mengikuti hasil verifikasi petugas.', 'Reference coordinates use WGS84 decimal degrees. Report status reflects reviewer verification.')}
      </div>
    </div>
  );
}
