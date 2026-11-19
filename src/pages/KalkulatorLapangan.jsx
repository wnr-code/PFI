/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, { useMemo, useState } from 'react';
import { Calculator, Compass, Crosshair, LocateFixed, Moon, Navigation, Sun, Clock3, MapPin, Info } from 'lucide-react';
import { usePFI } from '../state.jsx';
import { SITES, localTime, lunar, position, prayers, qibla, zlabel } from '../lib/astro.js';

const TOOLS = [
  ['kiblat', 'Arah Kiblat', 'Qibla Direction', Navigation],
  ['langit', 'Posisi Langit', 'Sky Position', Crosshair],
  ['salat', 'Waktu Salat', 'Prayer Times', Clock3],
  ['koordinat', 'Koordinat', 'Coordinates', MapPin],
];
const pad = (value) => String(value).padStart(2, '0');
const dms = (value, axis) => {
  const number = Number(value); if (!Number.isFinite(number)) return '—';
  const absolute = Math.abs(number), degree = Math.floor(absolute), minuteFloat = (absolute - degree) * 60, minute = Math.floor(minuteFloat), second = (minuteFloat - minute) * 60;
  const direction = axis === 'lat' ? (number < 0 ? 'LS' : 'LU') : (number < 0 ? 'BB' : 'BT');
  return `${degree}° ${minute}′ ${second.toFixed(2)}″ ${direction}`;
};
const compassName = (angle) => ['Utara','Timur Laut','Timur','Tenggara','Selatan','Barat Daya','Barat','Barat Laut'][Math.round(angle / 45) % 8];

export default function KalkulatorLapangan() {
  const { data, t, lang, tell } = usePFI();
  const initial = SITES.find((item) => item.id === data.site) || SITES[0];
  const [tool, setTool] = useState('kiblat');
  const [siteId, setSiteId] = useState(initial.id);
  const [coords, setCoords] = useState({ lat: initial.lat, lon: initial.lon, elev: initial.elev, offset: initial.offset });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`);
  const [locating, setLocating] = useState(false);
  const selected = SITES.find((item) => item.id === siteId);
  const location = { ...(selected || initial), ...coords, lat: Number(coords.lat), lon: Number(coords.lon), elev: Number(coords.elev), offset: Number(coords.offset) };
  const instant = useMemo(() => localTime(date, time, location), [date, time, location.lat, location.lon, location.elev, location.offset]);
  const qiblaResult = useMemo(() => qibla(location), [location.lat, location.lon]);
  const sky = useMemo(() => ({ sun: position('Sun', instant, location), moon: position('Moon', instant, location), phase: lunar(instant) }), [instant, location.lat, location.lon, location.elev]);
  const prayerRows = useMemo(() => prayers(date, location), [date, location.lat, location.lon, location.elev, location.offset]);

  const chooseSite = (id) => { const found = SITES.find((item) => item.id === id); setSiteId(id); if (found) setCoords({ lat: found.lat, lon: found.lon, elev: found.elev, offset: found.offset }); };
  const locate = () => {
    if (!navigator.geolocation) return tell(t('GPS tidak tersedia pada perangkat ini.', 'GPS is not available on this device.'));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords: gps }) => { setSiteId('custom'); setCoords((current) => ({ ...current, lat: Number(gps.latitude.toFixed(6)), lon: Number(gps.longitude.toFixed(6)), elev: Number.isFinite(gps.altitude) ? Math.round(gps.altitude) : current.elev })); setLocating(false); tell(t('Lokasi perangkat berhasil digunakan.', 'Device location applied.')); }, (error) => { setLocating(false); tell(error.message || t('Lokasi tidak dapat dibaca.', 'Location could not be read.')); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  };

  return <div className="page-wrap field-calculator-page page-enter">
    <header className="science-page-head page-head"><div><div className="eyebrow"><i />{t('PERALATAN LAPANGAN', 'FIELD TOOLS')}</div><h1>{t('Kalkulator Falaq', 'Falaq calculator')}</h1><p>{t('Perhitungan praktis arah kiblat, posisi Matahari–Bulan, waktu salat, dan koordinat untuk membantu kegiatan lapangan.', 'Practical Qibla, Sun–Moon position, prayer time, and coordinate calculations for field activities.')}</p></div><span className="method-badge"><Calculator size={16}/>{t('Bisa digunakan offline', 'Works offline')}</span></header>

    <div className="field-tool-tabs" role="tablist" aria-label={t('Pilih kalkulator', 'Choose calculator')}>{TOOLS.map(([id, label, en, Icon]) => <button key={id} role="tab" aria-selected={tool === id} className={tool === id ? 'active' : ''} onClick={() => setTool(id)}><Icon size={17}/><span>{t(label, en)}</span></button>)}</div>

    <section className="card field-location-card"><div className="card-header"><div><span className="section-kicker">{t('LOKASI DAN WAKTU', 'LOCATION AND TIME')}</span><h2>{t('Parameter pengamatan', 'Observation parameters')}</h2></div><button className="btn secondary locate-field-btn" onClick={locate} disabled={locating}><LocateFixed size={16}/>{locating ? t('Mencari…', 'Locating…') : t('Gunakan GPS', 'Use GPS')}</button></div><div className="card-body field-parameter-grid">
      <div className="field"><label>{t('Lokasi tersimpan', 'Saved location')}</label><select value={siteId} onChange={(event) => chooseSite(event.target.value)}><option value="custom">{t('Koordinat khusus', 'Custom coordinates')}</option>{SITES.map((item) => <option key={item.id} value={item.id}>{item.city}, {item.region}</option>)}</select></div>
      <div className="field"><label>{t('Lintang', 'Latitude')}</label><input type="number" step="any" min="-90" max="90" value={coords.lat} onChange={(event) => { setSiteId('custom'); setCoords({ ...coords, lat: event.target.value }); }}/></div>
      <div className="field"><label>{t('Bujur', 'Longitude')}</label><input type="number" step="any" min="-180" max="180" value={coords.lon} onChange={(event) => { setSiteId('custom'); setCoords({ ...coords, lon: event.target.value }); }}/></div>
      <div className="field"><label>{t('Elevasi (meter)', 'Elevation (metres)')}</label><input type="number" value={coords.elev} onChange={(event) => setCoords({ ...coords, elev: event.target.value })}/></div>
      <div className="field"><label>{t('Tanggal', 'Date')}</label><input type="date" value={date} onChange={(event) => setDate(event.target.value)}/></div>
      <div className="field"><label>{t('Waktu lokal', 'Local time')}</label><input type="time" value={time} onChange={(event) => setTime(event.target.value)}/></div>
      <div className="field"><label>{t('Zona waktu', 'Time zone')}</label><select value={coords.offset} onChange={(event) => setCoords({ ...coords, offset: Number(event.target.value) })}><option value="7">WIB · UTC+7</option><option value="8">WITA · UTC+8</option><option value="9">WIT · UTC+9</option></select></div>
    </div></section>

    {tool === 'kiblat' && <section className="field-result-layout"><div className="card qibla-visual"><div className="qibla-compass"><div className="compass-ring"><span className="north">U</span><span className="east">T</span><span className="south">S</span><span className="west">B</span><i className="qibla-needle" style={{ transform: `translate(-50%,-88%) rotate(${qiblaResult.angle}deg)` }}/><b>Ka'bah</b></div></div></div><div className="card field-result-copy"><span className="section-kicker">{t('ARAH DARI UTARA SEJATI', 'BEARING FROM TRUE NORTH')}</span><strong>{qiblaResult.angle.toFixed(2)}°</strong><h2>{compassName(qiblaResult.angle)}</h2><p>{t('Hadapkan arah utara sejati ke tanda U, lalu ikuti jarum emas menuju arah kiblat.', 'Align true north with U, then follow the gold needle toward the Qibla.')}</p><dl><div><dt>{t('Jarak ke Ka’bah', 'Distance to Kaaba')}</dt><dd>{Math.round(qiblaResult.km).toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID')} km</dd></div><div><dt>{t('Lokasi', 'Location')}</dt><dd>{Number(location.lat).toFixed(4)}, {Number(location.lon).toFixed(4)}</dd></div></dl><div className="field-warning"><Info size={16}/>{t('Kompas ponsel dapat terpengaruh benda logam dan medan magnet. Kalibrasi perangkat dan bandingkan dengan arah utara sejati.', 'A phone compass can be affected by metal and magnetic fields. Calibrate your device and compare with true north.')}</div></div></section>}

    {tool === 'langit' && <section className="science-metrics field-sky-results"><article><span><Sun size={17}/>{t('Tinggi Matahari', 'Sun altitude')}</span><b>{sky.sun.alt.toFixed(2)}°</b><small>{t('di atas/bawah ufuk', 'above/below horizon')}</small></article><article><span><Compass size={17}/>{t('Azimut Matahari', 'Sun azimuth')}</span><b>{sky.sun.az.toFixed(2)}°</b><small>{compassName(sky.sun.az)}</small></article><article><span><Moon size={17}/>{t('Tinggi Bulan', 'Moon altitude')}</span><b>{sky.moon.alt.toFixed(2)}°</b><small>{t('di atas/bawah ufuk', 'above/below horizon')}</small></article><article><span><Compass size={17}/>{t('Azimut Bulan', 'Moon azimuth')}</span><b>{sky.moon.az.toFixed(2)}°</b><small>{compassName(sky.moon.az)}</small></article><article><span><Moon size={17}/>{t('Iluminasi Bulan', 'Moon illumination')}</span><b>{sky.phase.illumination.toFixed(1)}%</b><small>{t('bagian tampak terang', 'visible illuminated portion')}</small></article><article><span><Crosshair size={17}/>{t('Elongasi', 'Elongation')}</span><b>{sky.phase.elongation.toFixed(2)}°</b><small>{t('jarak sudut Bulan–Matahari', 'Moon–Sun angular distance')}</small></article></section>}

    {tool === 'salat' && <section className="card prayer-tool"><div className="card-header"><div><span className="section-kicker">{t('PERKIRAAN HARIAN', 'DAILY ESTIMATE')}</span><h2>{t('Waktu salat', 'Prayer times')}</h2></div><Clock3 size={20}/></div><div className="prayer-grid">{prayerRows.map(([id, en, value]) => <div key={id}><span>{t(id, en)}</span><b>{value ? new Intl.DateTimeFormat('en-GB', { timeZone: location.offset === 9 ? 'Asia/Jayapura' : location.offset === 8 ? 'Asia/Makassar' : 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(value) : '—'}</b><small>{zlabel(location)}</small></div>)}</div><div className="field-warning"><Info size={16}/>{t('Waktu merupakan hasil perhitungan astronomis. Gunakan jadwal resmi masjid atau Kementerian Agama sebagai rujukan ibadah setempat.', 'Times are astronomical calculations. Use your mosque or official local schedule as the reference for worship.')}</div></section>}

    {tool === 'koordinat' && <section className="field-coordinate-grid"><article className="card"><span>{t('Lintang desimal', 'Decimal latitude')}</span><b>{Number(location.lat).toFixed(6)}°</b><small>{dms(location.lat, 'lat')}</small></article><article className="card"><span>{t('Bujur desimal', 'Decimal longitude')}</span><b>{Number(location.lon).toFixed(6)}°</b><small>{dms(location.lon, 'lon')}</small></article><article className="card"><span>{t('Zona waktu', 'Time zone')}</span><b>UTC+{location.offset}</b><small>{zlabel(location)}</small></article><article className="card"><span>{t('Elevasi', 'Elevation')}</span><b>{Number(location.elev).toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID')} m</b><small>{t('di atas permukaan laut', 'above sea level')}</small></article></section>}
  </div>;
}
