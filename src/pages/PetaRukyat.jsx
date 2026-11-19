// PFI — Pusat Falak Indonesia | @wnr-code
// Repository: https://github.com/wnr-code/PFI
// Dukungan proyek: https://trakteer.id/lanteraku/tip
import React, { useMemo, useState, useEffect } from 'react';
import { usePFI } from '../state.jsx';
import { api, offlineGet } from '../lib/api.js';
import { MapPin, UsersRound, FileText, RefreshCw, Clock3, Globe2, Map as MapIcon, X, ExternalLink } from 'lucide-react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function PetaRukyat() {
  const { data, t, lang } = usePFI();
  const [mode, setMode] = useState('globe');
  const [layer, setLayer] = useState('reports');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const posts = await api('/api/posts');
      setReports((Array.isArray(posts) ? posts : []).filter((post) => post.type === 'rukyat' && post.status === 'verified'));
    } catch {
      const cached = await offlineGet('posts');
      setReports((Array.isArray(cached) ? cached : []).filter((post) => post.type === 'rukyat' && post.status === 'verified'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setReports([]);
    setSelected(null);
    setLoading(true);
    load();
  }, [data.account?.id]);

  const located = useMemo(() => reports.filter((r) =>
    Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude))
    && Number(r.latitude) >= -90 && Number(r.latitude) <= 90
    && Number(r.longitude) >= -180 && Number(r.longitude) <= 180
  ), [reports]);

  const dateLabel = (value, report) => {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return value || '—';
    const offset = Number(report?.utcOffsetMinutes);
    if (Number.isFinite(offset)) {
      const local = new Date(date.getTime() + offset * 60000);
      return `${local.toISOString().slice(0, 16).replace('T', ' ')} ${report.timeZone || ''}`.trim();
    }
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  const pointPosition = (report) => {
    // Peta tematik Indonesia: rentang koordinat untuk menempatkan laporan di wilayah Nusantara.
    const x = 70 + ((Number(report.longitude) - 95) / 46) * 660;
    const y = 45 + ((6 - Number(report.latitude)) / 17) * 300;
    return { x: clamp(x, 30, 770), y: clamp(y, 25, 365) };
  };

  const openReport = (report) => setSelected(report);
  const mapLink = selected
    ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(selected.latitude)}&mlon=${encodeURIComponent(selected.longitude)}#map=10/${encodeURIComponent(selected.latitude)}/${encodeURIComponent(selected.longitude)}`
    : '';

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('PUSAT PEMANTAUAN RUKYAT', 'RUKYAT MONITORING CENTRE')}</div>
        <h1>{t('Sebaran Pengamatan Hilal Indonesia', 'Indonesian Crescent Observation Network')}</h1>
        <p>{t('Jelajahi titik pengamatan melalui bola dunia atau peta Indonesia. Titik hanya berasal dari laporan rukyat terverifikasi yang memiliki koordinat.', 'Explore observation sites on the globe or Indonesia map. Markers come only from verified rukyat reports with coordinates.')}</p>
      </div>

      <section className="rukyat-visual-card">
        <div className="rukyat-visual-head">
          <div>
            <span className="rukyat-kicker">{t('VISUALISASI INTERAKTIF', 'INTERACTIVE VISUALIZATION')}</span>
            <h2>{t('Peta Pengamatan Nasional', 'National Observation Map')}</h2>
          </div>
          <div className="rukyat-mode-switch" role="group" aria-label={t('Pilih mode tampilan', 'Choose display mode')}>
            <button type="button" className={mode === 'globe' ? 'active' : ''} onClick={() => { setMode('globe'); setSelected(null); }} aria-pressed={mode === 'globe'}>
              <Globe2 size={17} /> {t('Bola Dunia', 'Globe')}
            </button>
            <button type="button" className={mode === 'map' ? 'active' : ''} onClick={() => { setMode('map'); setSelected(null); }} aria-pressed={mode === 'map'}>
              <MapIcon size={17} /> {t('Peta', 'Map')}
            </button>
          </div>
        </div>

        {mode === 'globe' ? (
          <div className="rukyat-globe-stage">
            <div className="rukyat-stars" aria-hidden="true" />
            <div className="rukyat-globe">
              <div className="rukyat-globe-grid" />
              <svg className="rukyat-globe-land" viewBox="0 0 640 640" aria-hidden="true">
                <path d="M105 190l38-43 55-18 37 20 11 40-28 28-13 42-48 12-30-29-36-4zM245 130l55-38 66 9 32 36-17 39-51 12-18 44-42-16-33-42zM370 255l44-28 57 19 17 45-34 33-57-8-31-28zM180 335l42-22 36 28-8 53-42 24-39-31zM420 390l48-21 46 32-12 48-53 9-34-35z" />
              </svg>
              <div className="rukyat-globe-points">
                {located.map((report) => {
                  const pos = pointPosition(report);
                  const x = 50 + ((Number(report.longitude) - 95) / 46) * 80;
                  const y = 50 + ((6 - Number(report.latitude)) / 17) * 50;
                  return (
                    <button key={report.id} type="button" className="rukyat-point globe-point" style={{ left: `${clamp(x, 8, 92)}%`, top: `${clamp(y, 12, 88)}%` }} onClick={() => openReport(report)} title={report.city || report.title} aria-label={t('Lihat laporan ', 'View report ') + (report.city || report.title)}>
                      <span />
                    </button>
                  );
                })}
              </div>
              <div className="rukyat-globe-shine" />
            </div>
            <div className="rukyat-globe-caption">
              <b>{t('BUMI · JARINGAN RUKYAT INDONESIA', 'EARTH · INDONESIAN RUKYAT NETWORK')}</b>
              <span>{t('Putaran visual • pilih titik untuk detail laporan', 'Animated view • select a marker for report details')}</span>
            </div>
          </div>
        ) : (
          <div className="rukyat-map-stage">
            <div className="rukyat-map-topline"><span>{t('INDONESIA', 'INDONESIA')}</span><small>{t('Koordinat laporan terverifikasi', 'Verified report coordinates')}</small></div>
            <svg className="rukyat-indonesia-map" viewBox="0 0 800 410" role="img" aria-label={t('Peta skematis Indonesia dengan titik laporan rukyat', 'Schematic map of Indonesia with rukyat report markers')}>
              <defs>
                <linearGradient id="pfiSea" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#102b4d"/><stop offset="100%" stopColor="#07182e"/></linearGradient>
                <linearGradient id="pfiLand" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#d8bd83"/><stop offset="100%" stopColor="#987849"/></linearGradient>
              </defs>
              <rect width="800" height="410" rx="18" fill="url(#pfiSea)"/>
              <g className="rukyat-map-graticule">
                {Array.from({length:7},(_,i)=><line key={'v'+i} x1={80+i*105} y1="18" x2={80+i*105} y2="392"/> )}
                {Array.from({length:5},(_,i)=><line key={'h'+i} x1="25" y1={55+i*75} x2="775" y2={55+i*75}/> )}
              </g>
              <g fill="url(#pfiLand)" stroke="#f0d59a" strokeWidth="2" className="rukyat-islands">
                <path d="M72 112l24-22 35 4 26 20-8 20-32 9-29-12zM110 166l29-18 32 14 13 33-20 26-38-9-21-24z"/>
                <path d="M212 175l36-20 42 10 22 27-22 18-48-5-34-14zM252 230l28-13 23 13-6 27-30 8-19-17z"/>
                <path d="M335 120l38-14 44 17 18 28-28 23-42-7-29-22zM376 197l24-16 29 13 10 30-26 18-32-18z"/>
                <path d="M466 170l39-16 40 17 21 25-24 24-49-6-29-20zM520 238l30-12 25 19-12 25-32 1-18-16z"/>
                <path d="M600 120l30-12 31 18 10 24-26 19-34-12-17-19zM654 208l29-12 29 18-10 25-33 3-20-18z"/>
                <path d="M150 300l24-9 22 15-7 17-26 7-18-13zM310 315l30-12 24 18-13 21-29-2-18-13zM450 315l22-9 22 14-8 19-25 1-16-12z"/>
              </g>
              {located.map((report) => {
                const pos = pointPosition(report);
                const x = 40 + ((Number(report.longitude) - 95) / 46) * 720;
                const y = 35 + ((6 - Number(report.latitude)) / 17) * 340;
                return <g key={report.id} className="rukyat-map-marker" transform={`translate(${clamp(x,25,775)} ${clamp(y,25,385)})`} onClick={() => openReport(report)} role="button" tabIndex="0" aria-label={report.city || report.title}>
                  <circle r="13" className="marker-pulse"/><circle r="5.5" className="marker-core"/>
                </g>;
              })}
            </svg>
            <div className="rukyat-map-legend"><span><i /> {t('Lokasi laporan terverifikasi', 'Verified report location')}</span><span>{t('Peta skematis Nusantara', 'Schematic Indonesian archipelago')}</span></div>
          </div>
        )}

        <div className="rukyat-stats">
          <div><b>{reports.length}</b><span>{t('Laporan terverifikasi', 'Verified reports')}</span></div>
          <div><b>{located.length}</b><span>{t('Titik berkoordinat', 'Geotagged locations')}</span></div>
          <button type="button" className="btn secondary" onClick={() => { setLoading(true); load(); }}><RefreshCw size={16}/>{t('Muat ulang', 'Refresh')}</button>
        </div>
        {selected && (
          <div className="rukyat-detail" role="region" aria-live="polite">
            <button className="rukyat-detail-close" onClick={() => setSelected(null)} aria-label={t('Tutup detail', 'Close details')}><X size={18}/></button>
            <span className="rukyat-kicker">{t('DETAIL PENGAMATAN', 'OBSERVATION DETAILS')}</span>
            <h3>{selected.city || selected.title || t('Lokasi pengamatan', 'Observation site')}</h3>
            <p>{selected.title}</p>
            <div className="rukyat-detail-grid">
              <span><small>{t('Pengamat', 'Observer')}</small><b>{selected.author || '—'}</b></span>
              <span><small>{t('Waktu pengamatan', 'Observation time')}</small><b>{dateLabel(selected.observedAt || selected.date, selected)}</b></span>
              <span><small>{t('Koordinat', 'Coordinates')}</small><b>{Number(selected.latitude).toFixed(5)}, {Number(selected.longitude).toFixed(5)}</b></span>
              <span><small>{t('Status', 'Status')}</small><b className="verified-text">{t('Terverifikasi', 'Verified')}</b></span>
            </div>
            <a className="btn secondary" href={mapLink} target="_blank" rel="noreferrer"><ExternalLink size={15}/>{t('Buka koordinat', 'Open coordinates')}</a>
          </div>
        )}
      </section>

      <div className="card">
        <div className="card-header"><h2>{t('Daftar Laporan Rukyat', 'Rukyat Reports')}</h2></div>
        <div className="card-body">
          {loading ? <div className="rukyat-empty">{t('Memuat laporan…', 'Loading reports…')}</div> :
            reports.length === 0 ? <div className="rukyat-empty"><MapPin size={28}/><b>{t('Belum ada laporan rukyat terverifikasi', 'No verified rukyat reports yet')}</b><span>{t('Titik akan muncul setelah laporan berkoordinat ditinjau dan diverifikasi.', 'Markers appear after geotagged reports are reviewed and verified.')}</span></div> :
            <div className="rukyat-report-list">
              {reports.map((report) => <button type="button" key={report.id} className={selected?.id === report.id ? 'rukyat-report selected' : 'rukyat-report'} onClick={() => { setSelected(report); if (!Number.isFinite(Number(report.latitude)) || !Number.isFinite(Number(report.longitude))) setMode('map'); }}>
                <span className="rukyat-report-icon"><FileText size={17}/></span>
                <span className="rukyat-report-copy"><b>{report.title || t('Laporan rukyat', 'Rukyat report')}</b><small>{report.author || '—'} · {report.city || t('Lokasi tidak disebutkan', 'Location not specified')}</small></span>
                <span className="pill verified">{t('Terverifikasi', 'Verified')}</span>
              </button>)}
            </div>
          }
        </div>
      </div>
      <div className="rukyat-note"><UsersRound size={17}/>{t('Hanya laporan terverifikasi yang ditampilkan sebagai titik. Data contoh tidak akan dianggap sebagai hasil rukyat nyata.', 'Only verified reports are shown as markers. Sample data is never presented as real rukyat results.')}</div>
    </div>
  );
}
