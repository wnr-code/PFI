/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, { useState, useMemo } from 'react';
import { usePFI } from '../state.jsx';
import { lunar, position, localTime, zlabel, SITES } from '../lib/astro.js';
import { Moon, Sun, Play, Compass, Crosshair, Orbit, Telescope } from 'lucide-react';

export default function Astronomi() {
  const { data, t, tell } = usePFI();
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [waktu, setWaktu] = useState('18:00');
  const [siteId, setSiteId] = useState(data.site || 'tasik');
  const site = SITES.find((item) => item.id === siteId) || SITES[0];
  const instant = useMemo(() => localTime(tanggal, waktu, site), [tanggal, waktu, site]);
  const moon = useMemo(() => lunar(instant), [instant]);
  const simulasi = useMemo(() => {
    try {
      const pos = position('Moon', instant, site);
      return { alt: pos.alt?.toFixed?.(2) ?? '0', az: pos.az?.toFixed?.(2) ?? '0', ra: pos.ra?.toFixed?.(2) ?? '0', dec: pos.dec?.toFixed?.(2) ?? '0', dist: pos.dist?.toFixed?.(0) ?? '0' };
    } catch {
      return { alt: '0', az: '0', ra: '0', dec: '0', dist: '0' };
    }
  }, [instant, site]);
  const meets = Number(simulasi.alt) >= 3 && moon.angle >= 6.4;
  const altitude = Math.max(4, Math.min(86, Number(simulasi.alt)));
  const moonLeft = Math.max(8, Math.min(92, 50 + (Number(simulasi.az) - 270) * .35));

  return (
    <div className="page-wrap astronomy-page page-enter">
      <header className="science-page-head page-head">
        <div><div className="eyebrow"><i /> {t('LABORATORIUM ASTRONOMI', 'ASTRONOMY LABORATORY')}</div><h1>{t('Simulasi hilal', 'Crescent simulation')}</h1><p>{t('Telaah posisi bulan terhadap horizon secara kontekstual dari lokasi pengamatan.', 'Study the moon position against the horizon in context from your observation site.')}</p></div>
        <span className={`criteria-status ${meets ? 'pass' : ''}`}><i />{meets ? t('Memenuhi MABIMS', 'Meets MABIMS') : t('Belum memenuhi MABIMS', 'Below MABIMS criteria')}</span>
      </header>

      <div className="astronomy-workspace">
        <section className="card simulation-controls">
          <div className="card-header"><div><span className="section-kicker">{t('PARAMETER', 'PARAMETERS')}</span><h2>{t('Kondisi pengamatan', 'Observation conditions')}</h2></div><Crosshair size={20} /></div>
          <div className="card-body simulation-form">
            <div className="field"><label>{t('Tanggal', 'Date')}</label><input type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} /></div>
            <div className="field"><label>{t('Waktu lokal', 'Local time')}</label><select value={waktu} onChange={(event) => setWaktu(event.target.value)}>{[17, 18, 19, 20, 21].map((hour) => <option key={hour} value={`${hour}:00`}>{String(hour).padStart(2, '0')}:00 {zlabel(site)}</option>)}</select></div>
            <div className="field"><label>{t('Lokasi observasi', 'Observation site')}</label><select value={siteId} onChange={(event) => setSiteId(event.target.value)}>{SITES.map((item) => <option key={item.id} value={item.id}>{item.city}, {item.region}</option>)}</select></div>
            <button className="btn primary full" onClick={() => tell(t('Simulasi diperbarui.', 'Simulation updated.'))}><Play size={17} />{t('Perbarui simulasi', 'Update simulation')}</button>
          </div>
          <div className="simulation-note"><Telescope size={16} /><span>{t('Model ini bersifat bantuan astronomis. Penetapan resmi tetap mengikuti sidang isbat.', 'This model is an astronomical aid. Official determination remains subject to the isbat session.')}</span></div>
        </section>

        <section className="sky-viewport" aria-label={t('Diagram posisi hilal', 'Crescent position diagram')}>
          <div className="sky-stars" /><div className="sky-grid" />
          <div className="sky-label"><span>{t('HORIZON BARAT', 'WESTERN HORIZON')}</span><b>{site.city} · {waktu} {zlabel(site)}</b></div>
          <Sun className="setting-sun" size={42} />
          <div className="simulated-moon" style={{ left: `${moonLeft}%`, bottom: `${altitude}%` }}><span /><Moon size={28} /><small>{simulasi.alt}°</small></div>
          <div className="altitude-guide" style={{ height: `${altitude}%` }}><span>{t('tinggi', 'altitude')}</span></div>
          <div className="horizon-line"><span>240°</span><span>270° W</span><span>300°</span></div>
          <div className="viewport-legend"><span><i className="moon-dot" />{t('Bulan', 'Moon')}</span><span><i className="sun-dot" />{t('Matahari', 'Sun')}</span></div>
        </section>
      </div>

      <section className="science-metrics" aria-label={t('Hasil simulasi', 'Simulation results')}>
        <article><span><Moon size={17} />{t('Tinggi hilal', 'Crescent height')}</span><b>{simulasi.alt}°</b><small>{t('terhadap horizon', 'above horizon')}</small></article>
        <article><span><Compass size={17} />{t('Azimut', 'Azimuth')}</span><b>{simulasi.az}°</b><small>{t('arah kompas', 'compass bearing')}</small></article>
        <article><span><Orbit size={17} />{t('Elongasi', 'Elongation')}</span><b>{moon.angle?.toFixed?.(1) ?? '—'}°</b><small>{t('bulan–matahari', 'moon–sun')}</small></article>
        <article><span><Crosshair size={17} />{t('Jarak bulan', 'Moon distance')}</span><b>{Number(simulasi.dist).toLocaleString('id-ID')}</b><small>km</small></article>
      </section>

      <section className="card technical-readout"><div className="card-header"><div><span className="section-kicker">{t('DATA TEKNIS', 'TECHNICAL DATA')}</span><h2>{t('Koordinat ekuatorial', 'Equatorial coordinates')}</h2></div></div><div className="technical-grid"><div><small>Right ascension</small><b>{simulasi.ra}°</b></div><div><small>Declination</small><b>{simulasi.dec}°</b></div><div><small>{t('Iluminasi', 'Illumination')}</small><b>{moon.illumination?.toFixed?.(1) ?? '—'}%</b></div><div><small>{t('Kriteria', 'Criteria')}</small><b>≥3° / ≥6,4°</b></div></div></section>
    </div>
  );
}
