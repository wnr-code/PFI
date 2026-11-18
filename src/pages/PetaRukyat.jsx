// PFI — Pusat Falak Indonesia | Maintainer: @wnr-code
// Repository: https://github.com/wnr-code/PFI
// Project support: https://trakteer.id/lanteraku/tip
// AI-assisted implementation; reviewed and maintained by the project maintainer.
import React, { useMemo, useState, useEffect } from 'react';
import { usePFI } from '../state.jsx';
import { api, offlineGet } from '../lib/api.js';
import { MapPin, UsersRound, FileText, RefreshCw, Clock3 } from 'lucide-react';

export default function PetaRukyat() {
  const { t, lang } = usePFI();
  const [layer, setLayer] = useState('reports');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const posts = await api('/api/posts');
      setReports((posts || []).filter((post) => post.type === 'rukyat'));
    } catch {
      const cached = await offlineGet('posts');
      setReports((cached || []).filter((post) => post.type === 'rukyat'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const located = useMemo(() => reports.filter((r) =>
    Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude))
  ), [reports]);

  const dateLabel = (value) => {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return value || '—';
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('PETA RUKYAT NASIONAL', 'NATIONAL OBSERVATION MAP')}</div>
        <h1>{t('Sebaran Laporan Rukyat', 'Rukyat Report Locations')}</h1>
        <p>{t('Lokasi ditampilkan berdasarkan koordinat yang dikirim bersama laporan pengamat. Tidak ada titik contoh yang ditampilkan sebagai laporan nyata.', 'Locations are derived from coordinates submitted with observer reports. Sample locations are not presented as real reports.')}</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className={`btn ${layer === 'reports' ? 'primary' : 'secondary'} full`} onClick={() => setLayer('reports')}>
          <FileText size={16} /> {t('Laporan', 'Reports')}
        </button>
        <button className={`btn ${layer === 'locations' ? 'primary' : 'secondary'} full`} onClick={() => setLayer('locations')}>
          <MapPin size={16} /> {t('Koordinat', 'Coordinates')}
        </button>
        <button className="btn secondary" onClick={() => { setLoading(true); load(); }} aria-label={t('Muat ulang', 'Refresh')}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="card" style={{ minHeight: 240 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 18, marginBottom: 16 }}>
            <div><b style={{ fontSize: 22 }}>{reports.length}</b><div style={{ color: '#8fa3b8', fontSize: 11 }}>{t('Total laporan', 'Total reports')}</div></div>
            <div><b style={{ fontSize: 22 }}>{located.length}</b><div style={{ color: '#8fa3b8', fontSize: 11 }}>{t('Dengan koordinat', 'With coordinates')}</div></div>
          </div>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#8fa3b8' }}>{t('Memuat laporan…', 'Loading reports…')}</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8fa3b8' }}>
              <MapPin size={28} /><p>{t('Belum ada laporan rukyat. Titik akan muncul setelah pengamat mengirim laporan berkoordinat.', 'No rukyat reports yet. Locations appear after observers submit geotagged reports.')}</p>
            </div>
          ) : layer === 'locations' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {located.length === 0 ? <p style={{ color: '#8fa3b8' }}>{t('Belum ada laporan dengan koordinat valid.', 'No reports with valid coordinates yet.')}</p> :
                located.map((r) => (
                  <div key={r.id} style={{ padding: 12, background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                    <b>{r.city}</b>
                    <div style={{ fontSize: 12, color: '#8fa3b8', marginTop: 4 }}>{Number(r.latitude).toFixed(5)}, {Number(r.longitude).toFixed(5)}</div>
                    <a href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(r.latitude)}&mlon=${encodeURIComponent(r.longitude)}#map=12/${encodeURIComponent(r.latitude)}/${encodeURIComponent(r.longitude)}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--gold, #d6ae62)' }}>
                      {t('Lihat di OpenStreetMap', 'View on OpenStreetMap')}
                    </a>
                  </div>
                ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reports.map((report) => (
                <div key={report.id} style={{ padding: 12, background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                    <div>
                      <b style={{ fontSize: 13 }}>{report.title}</b>
                      <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 3 }}>{report.author} · {report.city}</div>
                      <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 3 }}><Clock3 size={12} style={{ verticalAlign: 'middle' }} /> {dateLabel(report.observedAt || report.date)}</div>
                    </div>
                    <span className={`pill ${report.status === 'verified' ? 'verified' : 'pending'}`} style={{ fontSize: 9 }}>
                      {report.status === 'verified' ? t('Terverifikasi', 'Verified') : report.status === 'revision' ? t('Revisi', 'Revision') : t('Menunggu', 'Pending')}
                    </span>
                  </div>
                  {Number.isFinite(Number(report.latitude)) && Number.isFinite(Number(report.longitude)) && (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#8fa3b8' }}>
                      <MapPin size={12} style={{ verticalAlign: 'middle' }} /> {Number(report.latitude).toFixed(5)}, {Number(report.longitude).toFixed(5)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 14, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: 11, color: '#8fa3b8' }}>
        <UsersRound size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        {t('Status laporan mengikuti hasil pemeriksaan petugas. Tampilan koordinat ini adalah daftar lokasi; peta interaktif nasional akan dikembangkan pada tahap berikutnya.', 'Report status follows reviewer assessment. This coordinate view is a location list; the interactive national map is planned for a later phase.')}
      </div>
    </div>
  );
}
