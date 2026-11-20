/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, { useState, useMemo } from 'react';
import { usePFI, go } from '../state.jsx';
import {
  calculateHisab, periods, SITES, zone, zlabel,
} from '../lib/astro.js';
import { api } from '../lib/api.js';
import { exportReport } from '../lib/export.js';
import {
  Calendar, MapPin, Settings, Sun, Moon, Compass, FileDown, Share2,
  ArrowRight, CheckCircle2, Info, History, Calculator,
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
  const [bulan, setBulan] = useState(8); // Ramadan
  const [siteId, setSiteId] = useState(data.site || 'tasik');
  const [customSite, setCustomSite] = useState({ city: '', region: '', lat: '', lon: '', elev: '0', offset: '7' });
  const [metode, setMetode] = useState('comparison');
  const [resultModel, setResultModel] = useState('comparison');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const site = siteId === 'custom' ? { id: 'custom', site: customSite.city || t('Lokasi khusus', 'Custom location'), city: customSite.city || t('Lokasi khusus', 'Custom location'), region: customSite.region || '—', lat: Number(customSite.lat), lon: Number(customSite.lon), elev: Number(customSite.elev), offset: Number(customSite.offset) } : (SITES.find((s) => s.id === siteId) || SITES[0]);

  const hitung = async () => {
    setBusy(true);
    try {
      if (siteId === 'custom' && (!customSite.city.trim() || !Number.isFinite(site.lat) || site.lat < -90 || site.lat > 90 || !Number.isFinite(site.lon) || site.lon < -180 || site.lon > 180 || !Number.isFinite(site.elev) || site.elev < -500 || site.elev > 9000 || !Number.isInteger(site.offset) || site.offset < -12 || site.offset > 14)) throw new Error(t('Lengkapi lokasi khusus dengan koordinat, elevasi, dan zona waktu yang valid.', 'Complete the custom location with valid coordinates, elevation, and time zone.'));
      const candidates = periods(new Date(), site);
      const period = candidates.find((item) => item.month === bulan + 1 && new Date(item.start) >= new Date())
        || candidates.find((item) => item.month === bulan + 1);
      if (!period) throw new Error(t('Periode Hijriah tidak ditemukan.', 'Hijri period was not found.'));
      const r = calculateHisab(period, site, metode);
      setResult(r);
      try {
        await api('/api/hisab', 'POST', {
          site: siteId,
          location: siteId === 'custom' ? site : undefined,
          start: period.start,
          method: metode,
          result: r,
        });
      } catch (e) {
        // offline: store locally
        console.warn('API hisab gagal, simpan lokal:', e.message);
      }
      tell(t('Perhitungan selesai.', 'Calculation complete.'));
    } catch (e) {
      tell(e.message || 'Perhitungan gagal.');
    } finally {
      setBusy(false);
    }
  };

  const formatAngle = (v) => v?.toFixed?.(3) ?? '—';
  const dms = (value) => {
    if (!Number.isFinite(value)) return '—';
    const sign = value < 0 ? '−' : ''; const absolute = Math.abs(value);
    const degrees = Math.floor(absolute); const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat); const seconds = (minutesFloat - minutes) * 60;
    return `${sign}${degrees}° ${String(minutes).padStart(2, '0')}′ ${seconds.toFixed(2).padStart(5, '0')}″`;
  };
  const formatTime = (v) => {
    if (!v) return '—';
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { timeZone: zone(site), hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(v));
  };
  const duration = (minutes) => {
    if (!Number.isFinite(minutes)) return '—';
    const total = Math.max(0, Math.round(minutes * 60));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  const bulanLabel = lang === 'id' ? BULAN_HIJRIAH[bulan] : BULAN_HIJRIAH_EN[bulan];

  return (
    <div className="page-wrap hisab-page page-enter">
      <header className="science-page-head page-head">
        <div><div className="eyebrow"><i /> {t('LABORATORIUM HISAB', 'CALCULATION LABORATORY')}</div>
        <h1>{t('Hisab awal bulan', 'New month calculation')}</h1>
        <p>{t('Hitung ijtimak, matahari terbenam, tinggi hilal, dan elongasi menggunakan kriteria MABIMS.', 'Calculate conjunction, sunset, crescent height, and elongation using MABIMS criteria.')}</p></div>
        <div className="hisab-head-actions"><span className="method-badge"><Calculator size={16}/>MABIMS 2021</span><button className="btn secondary" onClick={() => go('kalkulator')}><Compass size={16}/>{t('Kalkulator Lapangan', 'Field Calculator')}</button></div>
      </header>

      <section className="card hisab-parameters">
        <div className="card-header"><div><span className="section-kicker">{t('PARAMETER HISAB', 'CALCULATION PARAMETERS')}</span><h2>{t('Tentukan periode dan lokasi', 'Select period and location')}</h2></div><Settings size={20}/></div>
        <div className="card-body">
          <div className="hisab-form-grid">
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
                <option value="custom">{t('Lokasi khusus…', 'Custom location…')}</option>
              </select>
            </div>
            <div className="field">
              <label>{t('Metode Hisab', 'Calculation Method')}</label>
              <select value={metode} onChange={(e) => setMetode(e.target.value)}>
                <option value="comparison">{t('Perbandingan 2 model + MABIMS', 'Two-model comparison + MABIMS')}</option>
              </select>
            </div>
          </div>
          {siteId === 'custom' && <div className="custom-site-panel"><div className="custom-site-head"><MapPin size={17}/><div><b>{t('Koordinat lokasi khusus', 'Custom location coordinates')}</b><small>{t('Digunakan untuk kedua model dan tidak mengubah daftar lokasi resmi.', 'Used by both models and does not change official locations.')}</small></div></div><div className="custom-site-grid"><div className="field"><label>{t('Nama lokasi', 'Location name')}</label><input value={customSite.city} maxLength={80} onChange={e=>setCustomSite({...customSite,city:e.target.value})} placeholder="Observatorium…"/></div><div className="field"><label>{t('Wilayah', 'Region')}</label><input value={customSite.region} maxLength={80} onChange={e=>setCustomSite({...customSite,region:e.target.value})} placeholder="Kabupaten / negara"/></div><div className="field"><label>Latitude (−90…90)</label><input type="number" step="any" min="-90" max="90" value={customSite.lat} onChange={e=>setCustomSite({...customSite,lat:e.target.value})}/></div><div className="field"><label>Longitude (−180…180)</label><input type="number" step="any" min="-180" max="180" value={customSite.lon} onChange={e=>setCustomSite({...customSite,lon:e.target.value})}/></div><div className="field"><label>{t('Elevasi meter', 'Elevation metres')}</label><input type="number" min="-500" max="9000" value={customSite.elev} onChange={e=>setCustomSite({...customSite,elev:e.target.value})}/></div><div className="field"><label>{t('Zona waktu UTC', 'UTC time zone')}</label><select value={customSite.offset} onChange={e=>setCustomSite({...customSite,offset:e.target.value})}>{Array.from({length:27},(_,i)=>i-12).map(value=><option key={value} value={value}>UTC{value>=0?'+':''}{value}</option>)}</select></div></div></div>}
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
      </section>

      {result && (() => {
        const modern = result.models.modern; const kitab = result.models.adDurrul;
        const rows = [
          [t('Tinggi hilal', 'Crescent altitude'), dms(modern.moon.alt), dms(kitab.topocentricAltitude)],
          [t('Elongasi geosentris', 'Geocentric elongation'), dms(modern.elongation), dms(kitab.elongation)],
          [t('Azimut hilal', 'Crescent azimuth'), dms(modern.moon.az), dms(kitab.moon.az)],
          [t('Azimut Matahari', 'Solar azimuth'), dms(modern.sun.az), dms(kitab.sun.az)],
          [t('Iluminasi', 'Illumination'), `${modern.illumination.toFixed(3)}%`, `${kitab.illumination.toFixed(3)}%`],
          [t('Kriteria MABIMS', 'MABIMS criteria'), modern.meets ? t('Memenuhi', 'Meets') : t('Belum', 'Not met'), kitab.meets ? t('Memenuhi', 'Meets') : t('Belum', 'Not met')],
        ];
        return <section className="hisab-dual-results">
          <div className="hisab-result-intro"><div><span className="section-kicker">{t('HASIL TERORGANISIR', 'ORGANIZED RESULTS')}</span><h2>{t('Perbandingan dua model', 'Two-model comparison')}</h2><p>{t('Waktu ditampilkan hingga detik. Pilih model untuk melihat rincian koreksinya.', 'Times are displayed to the second. Select a model to inspect its corrections.')}</p></div><span className="method-badge"><Calculator size={16}/>{result.criteria.name}</span></div>
          <div className="hisab-time-strip"><article><span>{t('Ijtimak', 'Conjunction')}</span><b>{formatTime(result.conj)}</b><small>{zlabel(site)}</small></article><article><span>{t('Matahari terbenam', 'Sunset')}</span><b>{formatTime(result.sunset)}</b><small>{zlabel(site)}</small></article><article><span>{t('Umur Bulan', 'Lunar age')}</span><b>{String(Math.floor(result.age)).padStart(2,'0')}:{String(Math.floor((result.age%1)*60)).padStart(2,'0')}:{String(Math.round((((result.age%1)*60)%1)*60)).padStart(2,'0')}</b><small>{t('jam:menit:detik', 'hours:minutes:seconds')}</small></article></div>
          <div className="model-tabs" role="tablist"><button className={resultModel==='comparison'?'active':''} onClick={()=>setResultModel('comparison')}>{t('Bandingkan', 'Compare')}</button><button className={resultModel==='modern'?'active':''} onClick={()=>setResultModel('modern')}>{t('Astronomi modern', 'Modern astronomy')}</button><button className={resultModel==='kitab'?'active':''} onClick={()=>setResultModel('kitab')}>Ad-Durrul Aniq</button></div>
          {resultModel==='comparison' && <div className="model-comparison"><header><b>{t('Parameter', 'Parameter')}</b><b>{t('Astronomi modern', 'Modern astronomy')}</b><b>Ad-Durrul Aniq</b></header>{rows.map(([label,a,b])=><div key={label}><span>{label}</span><strong>{a}</strong><strong>{b}</strong></div>)}</div>}
          {resultModel==='modern' && <div className="model-detail"><div className="model-detail-head modern"><div><small>MODEL 01</small><h3>{t('Astronomi modern', 'Modern astronomy')}</h3><p>Astronomy Engine 2.1.19 · {t('posisi toposentris dengan refraksi standar', 'topocentric position with standard refraction')}</p></div><span className={modern.meets?'pass':'fail'}>{modern.meets?t('Memenuhi MABIMS','Meets MABIMS'):t('Belum memenuhi','Not met')}</span></div><div className="detail-metrics"><article><span>{t('Tinggi toposentris', 'Topocentric altitude')}</span><b>{dms(modern.moon.alt)}</b><small>{formatAngle(modern.moon.alt)}°</small></article><article><span>{t('Elongasi geosentris', 'Geocentric elongation')}</span><b>{dms(modern.elongation)}</b><small>{formatAngle(modern.elongation)}°</small></article><article><span>{t('Azimut Bulan', 'Lunar azimuth')}</span><b>{dms(modern.moon.az)}</b></article><article><span>{t('Azimut Matahari', 'Solar azimuth')}</span><b>{dms(modern.sun.az)}</b></article><article><span>{t('Iluminasi', 'Illumination')}</span><b>{modern.illumination.toFixed(3)}%</b></article><article><span>{t('Jarak Bulan', 'Lunar distance')}</span><b>{Math.round(modern.moon.dist).toLocaleString('id-ID')} km</b></article><article><span>{t('Asensiorekta Bulan', 'Lunar right ascension')}</span><b>{modern.moon.ra.toFixed(6)}h</b></article><article><span>{t('Deklinasi Bulan', 'Lunar declination')}</span><b>{dms(modern.moon.dec)}</b></article><article><span>{t('Tinggi Matahari', 'Solar altitude')}</span><b>{dms(modern.sun.alt)}</b></article></div></div>}
          {resultModel==='kitab' && <div className="model-detail"><div className="model-detail-head kitab"><div><small>MODEL 02</small><h3>Ad-Durrul Aniq</h3><p>{t('Koreksi hilal hlm. 41–43; ephemeris dasar Astronomy Engine', 'Crescent corrections pp. 41–43; base ephemeris from Astronomy Engine')}</p></div><span className={kitab.meets?'pass':'fail'}>{kitab.meets?t('Memenuhi MABIMS','Meets MABIMS'):t('Belum memenuhi','Not met')}</span></div><div className="detail-metrics"><article><span>{t('Tinggi geosentris (hc)', 'Geocentric altitude (hc)')}</span><b>{dms(kitab.geocentricAltitude)}</b></article><article><span>{t('Paralaks horizontal (HP)', 'Horizontal parallax (HP)')}</span><b>{dms(kitab.horizontalParallax)}</b></article><article><span>{t('Paralaks Bulan (P)', 'Lunar parallax (P)')}</span><b>{dms(kitab.parallax)}</b></article><article><span>{t('Refraksi (Ref)', 'Refraction (Ref)')}</span><b>{dms(kitab.refraction)}</b></article><article><span>{t('Kerendahan ufuk (Dip)', 'Horizon dip')}</span><b>{dms(kitab.dip)}</b></article><article><span>{t('Semidiameter Bulan', 'Lunar semidiameter')}</span><b>{dms(kitab.semiDiameter)}</b></article><article className="highlight"><span>{t('Tinggi toposentris (hc′)', 'Topocentric altitude (hc′)')}</span><b>{dms(kitab.topocentricAltitude)}</b></article><article><span>{t('Elongasi geosentris', 'Geocentric elongation')}</span><b>{dms(kitab.elongation)}</b></article><article><span>{t('Elongasi toposentris', 'Topocentric elongation')}</span><b>{dms(kitab.topocentricElongation)}</b></article><article><span>{t('Beda azimut', 'Azimuth difference')}</span><b>{dms(kitab.azimuthDifference)}</b><small>{kitab.position==='south'?t('selatan Matahari','south of Sun'):t('utara Matahari','north of Sun')}</small></article><article><span>{t('Muktsul hilal', 'Crescent duration')}</span><b>{duration(kitab.muktsulMinutes)}</b><small>{t('menit:detik', 'minutes:seconds')}</small></article><article><span>{t('Nurul Hilal', 'Crescent illumination')}</span><b>{kitab.illumination.toFixed(3)}%</b></article><article><span>{t('Beda tinggi Matahari–hilal', 'Sun–crescent altitude difference')}</span><b>{dms(kitab.altitudeDifference)}</b></article><article><span>{t('Jarak sudut (C)', 'Angular distance (C)')}</span><b>{dms(kitab.angularDistance)}</b></article><article><span>{t('Perkiraan Bulan terbenam', 'Estimated moonset')}</span><b>{formatTime(kitab.estimatedMoonset)}</b><small>{zlabel(site)}</small></article></div><div className="formula-note"><Info size={17}/><p>{t('Model kitab menerapkan hc′ = hc − paralaks; refraksi, dip, dan semidiameter hanya diterapkan bila hasil awal positif. Untuk transparansi ilmiah, ephemeris dasarnya masih berasal dari Astronomy Engine; tabel ijtimak asli kitab akan diverifikasi sebagai tahap lanjutan.', 'The book model starts with hc′ = hc − parallax; refraction, dip, and semidiameter apply only when the initial result is positive. For scientific transparency, its base ephemeris still comes from Astronomy Engine; the book’s original conjunction tables require further verification.')}</p></div></div>}
          <div className="hisab-conclusion"><CheckCircle2 size={20}/><div><b>{t('Kesimpulan bukan keputusan resmi', 'Conclusion is not an official decision')}</b><p>{t('Kriteria MABIMS memerlukan tinggi minimal 3° dan elongasi minimal 6,4°. Penetapan awal bulan tetap menjadi kewenangan sidang isbat.', 'MABIMS requires at least 3° altitude and 6.4° elongation. Official month determination remains under the isbat authority.')}</p></div></div>
          <div className="hisab-result-actions"><button className="btn secondary" onClick={()=>exportReport(result,lang,'pdf').catch(error=>tell(error.message))}><FileDown size={16}/>{t('Unduh PDF','Download PDF')}</button><button className="btn secondary" onClick={()=>navigator.clipboard?.writeText(`Hisab ${bulanLabel}: Modern ${dms(modern.moon.alt)}, Ad-Durrul Aniq ${dms(kitab.topocentricAltitude)}, elongasi ${dms(kitab.elongation)}`).then(()=>tell(t('Disalin ke clipboard.','Copied.')))}><Share2 size={16}/>{t('Bagikan','Share')}</button></div>
        </section>;
      })()}
    </div>
  );
}
