// PFI — Pusat Falak Indonesia | @wnr-code
// Repository: https://github.com/wnr-code/PFI
// Dukungan proyek: https://trakteer.id/lanteraku/tip
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePFI } from '../state.jsx';
import { api, offlineGet } from '../lib/api.js';
import { position, lunar, SITES, phaseNames } from '../lib/astro.js';
import { MapPin, RefreshCw, Globe2, Map as MapIcon, X, ExternalLink, Activity, Satellite, Clock3 } from 'lucide-react';

const GLOBE_SCRIPT = 'https://unpkg.com/globe.gl';
const LEAFLET_SCRIPT = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const EARTH_TEXTURE = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const EARTH_BUMP = 'https://unpkg.com/three-globe/example/img/earth-topology.png';
const NIGHT_SKY = 'https://unpkg.com/three-globe/example/img/night-sky.png';

function loadScript(src, globalName) {
  if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
  const existing = document.querySelector('script[data-pfi-src="' + src + '"]');
  if (existing) return new Promise((resolve, reject) => {
    if (globalName && window[globalName]) return resolve(window[globalName]);
    existing.addEventListener('load', () => resolve(window[globalName]), { once: true });
    existing.addEventListener('error', reject, { once: true });
  });
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.pfiSrc = src;
    script.onload = () => globalName && window[globalName] ? resolve(window[globalName]) : reject(new Error('Library tidak tersedia: ' + globalName));
    script.onerror = () => reject(new Error('Gagal memuat pustaka peta.'));
    document.head.appendChild(script);
  });
}

function loadLeafletCss() {
  if (document.querySelector('link[data-pfi-leaflet]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = LEAFLET_CSS;
  link.dataset.pfiLeaflet = 'true';
  document.head.appendChild(link);
}

const validCoordinates = (item) => {
  const lat = Number(item.latitude), lng = Number(item.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export default function PetaRukyat() {
  const { data, t, lang } = usePFI();
  const [mode, setMode] = useState('globe');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [libraryError, setLibraryError] = useState('');
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [skySiteId, setSkySiteId] = useState('tasik');
  const [skyNow, setSkyNow] = useState(() => new Date());
  const globeHost = useRef(null);
  const mapHost = useRef(null);
  const globeInstance = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);

  const loadReports = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const rows = await api('/api/posts?limit=100');
      const safe = (Array.isArray(rows) ? rows : []).filter((row) => row.type === 'rukyat' && row.status === 'verified' && validCoordinates(row));
      setReports(safe);
      setLastUpdated(new Date());
    } catch {
      try {
        const cached = await offlineGet('posts');
        setReports((Array.isArray(cached) ? cached : []).filter((row) => row.type === 'rukyat' && row.status === 'verified' && validCoordinates(row)));
      } catch { /* Tampilkan keadaan kosong tanpa membuat data pengamatan palsu. */ }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setReports([]);
    setSelected(null);
    loadReports();
  }, [data.account?.id, loadReports]);

  // Refresh berkala hanya mengambil laporan yang benar-benar tersimpan di PFI.
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = window.setInterval(() => loadReports(true), 30000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, loadReports]);

  const located = useMemo(() => reports.filter(validCoordinates), [reports]);
  const skySite = useMemo(() => SITES.find((site) => site.id === skySiteId) || SITES[0], [skySiteId]);
  const skyData = useMemo(() => { try { return { sun: position('Sun', skyNow, skySite), moon: position('Moon', skyNow, skySite), phase: lunar(skyNow), valid: true }; } catch { return { valid: false }; } }, [skyNow, skySite]);
  useEffect(() => { const timer = window.setInterval(() => setSkyNow(new Date()), 30000); return () => window.clearInterval(timer); }, []);
  const skyNumber = (value) => Number.isFinite(value) ? value.toFixed(1) + '°' : '—';
  const phaseLabel = skyData.valid ? (phaseNames[skyData.phase.phase]?.[lang === 'en' ? 1 : 0] || '—') : '—';
  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };

  // Globe.GL: globe 3D dengan tekstur bumi, relief, atmosfer, marker dan gelombang.
  useEffect(() => {
    if (mode !== 'globe' || !globeHost.current) return undefined;
    let cancelled = false;
    let observer;
    setLibraryError('');
    loadScript(GLOBE_SCRIPT, 'Globe').then((GlobeFactory) => {
      if (cancelled || !globeHost.current) return;
      const host = globeHost.current;
      const globe = new GlobeFactory(host, { animateIn: true })
        .globeImageUrl(EARTH_TEXTURE)
        .bumpImageUrl(EARTH_BUMP)
        .backgroundImageUrl(NIGHT_SKY)
        .showAtmosphere(true)
        .atmosphereColor('#5ca8ff')
        .atmosphereAltitude(0.19)
        .showGraticules(true)
        .pointsData(located)
        .pointLat((d) => Number(d.latitude))
        .pointLng((d) => Number(d.longitude))
        .pointAltitude(0.025)
        .pointRadius(0.22)
        .pointColor(() => '#ffd166')
        .pointResolution(12)
        .onPointClick((point) => setSelected(point))
        .ringsData(located)
        .ringLat((d) => Number(d.latitude))
        .ringLng((d) => Number(d.longitude))
        .ringColor(() => (t => t < 0.5 ? 'rgba(255,209,102,0.8)' : 'rgba(255,209,102,0)'))
        .ringMaxRadius(2.4)
        .ringPropagationSpeed(1.2)
        .ringRepeatPeriod(1700)
        .width(host.clientWidth || 640)
        .height(host.clientHeight || 440);
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.35;
      globe.controls().enableDamping = true;
      globe.pointOfView({ lat: -2, lng: 118, altitude: 2.1 }, 1200);
      globeInstance.current = globe;
      observer = new ResizeObserver(() => {
        if (globeInstance.current && host.clientWidth) {
          globeInstance.current.width(host.clientWidth).height(host.clientHeight || 440);
        }
      });
      observer.observe(host);
    }).catch((error) => {
      if (!cancelled) setLibraryError(error?.message || t('Globe 3D tidak dapat dimuat.', '3D globe could not be loaded.'));
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      if (globeInstance.current) {
        try { globeInstance.current._destructor?.(); } catch { /* Renderer dibersihkan saat elemen dilepas. */ }
        globeInstance.current = null;
      }
      if (globeHost.current) globeHost.current.replaceChildren();
    };
  }, [mode, located, t]);

  // Leaflet: peta geografis asli dengan tile basemap, pan, zoom dan marker.
  useEffect(() => {
    if (mode !== 'map' || !mapHost.current) return undefined;
    let cancelled = false;
    loadLeafletCss();
    loadScript(LEAFLET_SCRIPT, 'L').then((L) => {
      if (cancelled || !mapHost.current || mapInstance.current) return;
      const map = L.map(mapHost.current, { zoomControl: true, scrollWheelZoom: true }).setView([-2.5, 118], 4.5);
      // OpenStreetMap standard tiles: no CARTO account or API key required.
      // Respect the public tile service policy and keep attribution visible.
      const baseTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 2,
        maxZoom: 19,
        maxNativeZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
      });
      baseTiles.on('tileerror', () => {
        if (!cancelled) setLibraryError(t('Sebagian ubin peta gagal dimuat. Periksa koneksi internet atau coba segarkan.', 'Some map tiles failed to load. Check your internet connection or refresh.'));
      });
      baseTiles.addTo(map);
      markersLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
      const renderMarkers = () => {
        markersLayer.current?.clearLayers();
        located.forEach((report) => {
          const marker = L.marker([Number(report.latitude), Number(report.longitude)], {
            icon: L.divIcon({
              className: 'pfi-map-pulse-marker',
              html: '<span class="pfi-map-pulse-ring"></span><span class="pfi-map-pulse-core"></span>',
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            }),
          }).addTo(markersLayer.current);
          marker.bindTooltip(String(report.city || report.title || 'Titik rukyat'), { direction: 'top' });
          marker.on('click', () => setSelected(report));
        });
      };
      renderMarkers();
      map.invalidateSize();
      map._pfiRenderMarkers = renderMarkers;
    }).catch((error) => {
      if (!cancelled) setLibraryError(error?.message || t('Peta tidak dapat dimuat.', 'Map could not be loaded.'));
    });
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersLayer.current = null;
      }
    };
  }, [mode, located, t]);

  const openCoordinates = selected
    ? 'https://www.openstreetmap.org/?mlat=' + encodeURIComponent(selected.latitude) + '&mlon=' + encodeURIComponent(selected.longitude) + '#map=10/' + encodeURIComponent(selected.latitude) + '/' + encodeURIComponent(selected.longitude)
    : '';

  return (
    <div className="page-wrap pfi-live-page">
      <style>{".pfi-observatory-scene{position:relative;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#102b50 0%,#050d1c 58%,#02050d 100%);border-radius:18px}\n.pfi-observatory-scene:before{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at 50% 48%,transparent 34%,rgba(1,5,15,.28) 100%)}\n.pfi-cosmos-stars{position:absolute;inset:0;z-index:0;pointer-events:none;background-image:radial-gradient(1px 1px at 8% 18%,#fff 98%,transparent),radial-gradient(1.5px 1.5px at 22% 72%,#9dcaff 98%,transparent),radial-gradient(1px 1px at 76% 22%,#fff 98%,transparent),radial-gradient(2px 2px at 88% 64%,#d7e9ff 98%,transparent),radial-gradient(1px 1px at 56% 12%,#fff 98%,transparent),radial-gradient(1px 1px at 42% 86%,#9dcaff 98%,transparent);background-size:310px 260px;animation:pfiStarDrift 90s linear infinite;opacity:.72}\n@keyframes pfiStarDrift{from{transform:translate3d(0,0,0)}to{transform:translate3d(-30px,18px,0)}}\n.pfi-observatory-hud{position:absolute;z-index:3;top:14px;left:14px;width:min(270px,calc(100% - 28px));padding:13px;border:1px solid rgba(133,183,232,.22);border-radius:14px;background:rgba(4,13,27,.76);backdrop-filter:blur(14px);box-shadow:0 12px 38px rgba(0,0,0,.28);color:#eaf4ff}\n.pfi-hud-heading{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:10px}.pfi-hud-heading span{font-size:10px;letter-spacing:1.2px;font-weight:800;color:#9ecbff}.pfi-hud-heading i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#65e6ad;box-shadow:0 0 10px #65e6ad;margin-right:6px}.pfi-hud-heading small,.pfi-sky-source{font-size:9px;color:#9fb2c9}\n.pfi-sky-site{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;color:#b7c9dc;margin-bottom:10px}.pfi-sky-site select{max-width:62%;min-width:0;background:#10233c;color:#eaf4ff;border:1px solid #294565;border-radius:7px;padding:6px;font-size:10px}\n.pfi-sky-readouts{display:grid;grid-template-columns:1fr 1fr;gap:7px}.pfi-sky-readouts>div{min-width:0;padding:8px;border-radius:9px;background:rgba(27,53,82,.58);border:1px solid rgba(142,184,225,.12)}.pfi-sky-readouts>div:last-child{grid-column:1/-1}.pfi-sky-readouts span,.pfi-sky-readouts small{display:block;font-size:9px;color:#a9c1db}.pfi-sky-readouts b{display:block;font-size:17px;line-height:1.3;color:#fff;margin:3px 0}.pfi-sky-readouts>div:last-child b{font-size:13px}.pfi-sky-source{display:block;margin-top:9px;line-height:1.4}\n@media(max-width:600px){.pfi-observatory-hud{top:9px;left:9px;width:min(230px,calc(100% - 18px));padding:10px}.pfi-sky-readouts{gap:5px}.pfi-sky-readouts>div{padding:6px}.pfi-sky-readouts b{font-size:15px}}"}</style>
      <div className="page-head">
        <div className="eyebrow"><i /> {t('PUSAT PEMANTAUAN RUKYAT', 'RUKYAT MONITORING CENTRE')}</div>
        <h1>{t('Jaringan Pengamatan Hilal', 'Crescent Observation Network')}</h1>
        <p>{t('Pantau lokasi rukyat terverifikasi di atas permukaan bumi dan peta geografis. Data diperbarui otomatis setiap 30 detik.', 'Explore verified rukyat sites on a real 3D globe and geographic map. Data refreshes every 30 seconds.')}</p>
      </div>

      <section className="pfi-live-panel">
        <header className="pfi-live-header">
          <div className="pfi-live-title">
            <span className="pfi-live-eyebrow"><Activity size={13}/> {t('PANTAUAN JARINGAN PFI', 'PFI NETWORK MONITOR')}</span>
            <h2>{t('Bumi dalam pantauan', 'Earth under observation')}</h2>
            <p>{t('Pilih mode visualisasi', 'Choose visualization mode')}</p>
          </div>
          <div className="pfi-live-switch" role="group" aria-label={t('Mode tampilan', 'Display mode')}>
            <button type="button" className={mode === 'globe' ? 'active' : ''} onClick={() => { setMode('globe'); setLibraryError(''); }} aria-pressed={mode === 'globe'}><Globe2 size={17}/>{t('Globe 3D', '3D Globe')}</button>
            <button type="button" className={mode === 'map' ? 'active' : ''} onClick={() => { setMode('map'); setLibraryError(''); }} aria-pressed={mode === 'map'}><MapIcon size={17}/>{t('Peta 2D', '2D Map')}</button>
          </div>
        </header>

        <div className="pfi-live-toolbar">
          <span className="pfi-live-status"><i/> {t('DATA PFI', 'PFI DATA')} · {t('TERVERIFIKASI', 'VERIFIED')}</span>
          <span className="pfi-live-updated"><Clock3 size={13}/>{lastUpdated ? t('Diperbarui ', 'Updated ') + formatDate(lastUpdated) : t('Menunggu data', 'Waiting for data')}</span>
        </div>

        {mode === 'globe' ? <div className="pfi-globe-wrap pfi-observatory-scene"><div className="pfi-cosmos-stars" aria-hidden="true"/><div ref={globeHost} className="pfi-globe-canvas"/><div className="pfi-observatory-hud"><div className="pfi-hud-heading"><span><i/> {t('OBSERVATORIUM LANGIT', 'SKY OBSERVATORY')}</span><small>{skyNow.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: skySite.offset === 9 ? 'Asia/Jayapura' : skySite.offset === 8 ? 'Asia/Makassar' : 'Asia/Jakarta' })} {skySite.offset === 9 ? 'WIT' : skySite.offset === 8 ? 'WITA' : 'WIB'}</small></div><label className="pfi-sky-site">{t('Lokasi acuan', 'Reference site')}<select value={skySiteId} onChange={(event) => setSkySiteId(event.target.value)} aria-label={t('Pilih lokasi acuan astronomi', 'Choose astronomical reference site')}>{SITES.map((site) => <option key={site.id} value={site.id}>{site.city} · {site.region}</option>)}</select></label><div className="pfi-sky-readouts"><div><span>☀ {t('MATAHARI', 'SUN')}</span><b>{skyData.valid ? skyNumber(skyData.sun.alt) : '—'}</b><small>Alt {skyData.valid ? skyNumber(skyData.sun.alt) : '—'} · Az {skyData.valid ? skyNumber(skyData.sun.az) : '—'}</small></div><div><span>☾ {t('BULAN', 'MOON')}</span><b>{skyData.valid ? skyNumber(skyData.moon.alt) : '—'}</b><small>Alt {skyData.valid ? skyNumber(skyData.moon.alt) : '—'} · Az {skyData.valid ? skyNumber(skyData.moon.az) : '—'}</small></div><div><span>{t('FASE BULAN', 'MOON PHASE')}</span><b>{phaseLabel}</b><small>{skyData.valid ? skyData.phase.illumination.toFixed(1) + '% ' + t('terang', 'illuminated') : '—'}</small></div></div><small className="pfi-sky-source">{t('Posisi dihitung secara astronomis untuk lokasi acuan terpilih; bukan data teleskop live.', 'Positions are astronomically calculated for the selected reference site; not live telescope data.')}</small></div><div className="pfi-globe-hint"><span>{t('GESER UNTUK MEMUTAR', 'DRAG TO ROTATE')}</span><span>{t('SCROLL / CUBIT UNTUK ZOOM', 'SCROLL / PINCH TO ZOOM')}</span></div></div> : <div className="pfi-map-wrap"><div ref={mapHost} className="pfi-leaflet-map"/></div>}

        {libraryError && <div className="pfi-map-error"><Satellite size={18}/><span>{libraryError} {t('Periksa koneksi internet lalu coba lagi.', 'Check your internet connection and try again.')}</span></div>}

        <div className="pfi-live-footer">
          <div className="pfi-live-count"><b>{located.length}</b><span>{t('TITIK RUKYAT TERVERIFIKASI', 'VERIFIED RUKYAT SITES')}</span></div>
          <div className="pfi-live-actions">
            <label className="pfi-auto-refresh"><input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)}/>{t('Pembaruan otomatis', 'Auto refresh')}</label>
            <button type="button" onClick={() => loadReports()}><RefreshCw size={15}/>{t('Segarkan', 'Refresh')}</button>
          </div>
        </div>

        {selected && <div className="pfi-live-detail">
          <button type="button" className="pfi-detail-close" onClick={() => setSelected(null)} aria-label={t('Tutup detail', 'Close details')}><X size={18}/></button>
          <span className="pfi-live-eyebrow">{t('LAPORAN RUKYAT TERVERIFIKASI', 'VERIFIED RUKYAT REPORT')}</span>
          <h3>{selected.city || selected.title || t('Lokasi pengamatan', 'Observation location')}</h3>
          <p>{selected.title || selected.body || ''}</p>
          <div className="pfi-detail-grid">
            <span><small>{t('Pengamat', 'Observer')}</small><b>{selected.author || '—'}</b></span>
            <span><small>{t('Waktu pengamatan', 'Observation time')}</small><b>{formatDate(selected.observedAt || selected.date)}</b></span>
            <span><small>{t('Koordinat', 'Coordinates')}</small><b>{Number(selected.latitude).toFixed(5)}, {Number(selected.longitude).toFixed(5)}</b></span>
            <span><small>{t('Cuaca', 'Weather')}</small><b>{selected.weather || '—'}</b></span>
            <span><small>{t('Hasil pengamatan', 'Observation result')}</small><b>{selected.visibility || t('Belum dicantumkan', 'Not provided')}</b></span>
            <span><small>{t('Instrumen', 'Instrument')}</small><b>{selected.instrument || '—'}</b></span>
          </div>
          {selected.photo && <img className="pfi-report-photo" src={selected.photo} alt={t('Foto laporan rukyat', 'Rukyat report photo')} loading="lazy"/>}
          <a className="pfi-coordinate-link" href={openCoordinates} target="_blank" rel="noreferrer"><ExternalLink size={15}/>{t('Buka lokasi pada OpenStreetMap', 'Open location in OpenStreetMap')}</a>
        </div>}
      </section>

      <div className="pfi-live-explain"><MapPin size={17}/><span>{t('Setiap titik adalah laporan rukyat nyata yang sudah diverifikasi. Gelombang berdenyut hanya efek visual penanda lokasi, bukan pergerakan data atau hasil pengamatan palsu.', 'Every marker represents a real verified rukyat report. Pulses are visual location effects, not fabricated moving data or observation results.')}</span></div>

      <section className="card pfi-report-list-card">
        <div className="card-header"><h2>{t('Laporan Rukyat Terbaru', 'Latest Rukyat Reports')}</h2><span className="pfi-report-total">{reports.length}</span></div>
        <div className="card-body">
          {loading ? <div className="pfi-report-empty">{t('Memuat data laporan…', 'Loading reports…')}</div> :
            reports.length === 0 ? <div className="pfi-report-empty"><MapPin size={28}/><b>{t('Belum ada titik pengamatan terverifikasi', 'No verified observation markers yet')}</b><span>{t('Lokasi akan muncul otomatis setelah laporan rukyat berkoordinat disetujui reviewer.', 'Locations will appear after geotagged rukyat reports are approved by a reviewer.')}</span></div> :
            <div className="pfi-report-list">{reports.map((report) => <button key={report.id} type="button" className={selected?.id === report.id ? 'pfi-report-row selected' : 'pfi-report-row'} onClick={() => { setSelected(report); if (mode === 'map' && mapInstance.current) mapInstance.current.setView([Number(report.latitude), Number(report.longitude)], 8); if (mode === 'globe' && globeInstance.current) globeInstance.current.pointOfView({ lat: Number(report.latitude), lng: Number(report.longitude), altitude: 1.2 }, 900); }}>
              <span className="pfi-report-dot"/><span className="pfi-report-text"><b>{report.city || report.title}</b><small>{report.author || '—'} · {formatDate(report.observedAt || report.date)}</small></span><span className="pfi-verified-tag">{t('VERIFIED', 'VERIFIED')}</span>
            </button>)}</div>
          }
        </div>
      </section>
    </div>
  );
}
