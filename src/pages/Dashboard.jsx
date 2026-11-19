/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, { useMemo } from 'react';
import { usePFI, go } from '../state.jsx';
import Glossary from '../components/Glossary.jsx';
import { lunar, dateFmt, hijriText, phaseNames, clock, zlabel } from '../lib/astro.js';
import {
  Moon, CalendarDays, MapPin, Calculator, Telescope, UsersRound,
  FileText, ArrowRight, Orbit, Clock3, Sparkles,
} from 'lucide-react';

export default function Dashboard() {
  const { t, lang, loc, events } = usePFI();
  const now = new Date();
  const hijri = hijriText(now, loc, lang, false);
  const moon = useMemo(() => lunar(now), [loc]);
  const conjunction = events[0];
  const observation = events.find((event) => event.type === 'rukyat');

  const quickActions = [
    { id: 'hisab', label: t('Hisab awal bulan', 'New month calculation'), description: t('Kriteria MABIMS dan data ephemeris', 'MABIMS criteria and ephemeris data'), icon: Calculator },
    { id: 'astronomi', label: t('Simulasi hilal', 'Crescent simulation'), description: t('Posisi bulan dari lokasi terpilih', 'Moon position from the selected site'), icon: Telescope },
    { id: 'peta', label: t('Peta rukyat', 'Observation map'), description: t('Pantau laporan terverifikasi', 'Monitor verified reports'), icon: MapPin },
    { id: 'komunitas', label: t('Komunitas', 'Community'), description: t('Diskusi dan laporan lapangan', 'Discussion and field reports'), icon: UsersRound },
  ];

  const schedule = [
    { label: t('Ijtimak berikutnya', 'Next conjunction'), event: conjunction, icon: Orbit },
    { label: t('Rukyat hilal', 'Crescent observation'), event: observation, icon: Telescope },
  ];

  return (
    <div className="page-wrap page-enter dashboard-page">
      <section className="observatory-hero" aria-labelledby="dashboard-title">
        <div className="observatory-hero-copy">
          <div className="eyebrow"><i /> {t('OBSERVATORIUM FALAQ DIGITAL', 'DIGITAL FALAQ OBSERVATORY')}</div>
          <h1 id="dashboard-title">{t('Amati langit, lengkapi ilmu Falaq dengan presisi.', 'Observe the sky, advance Falaq with precision.')}</h1>
          <p>{t('Ruang kerja astronomi Islam untuk hisab, simulasi hilal, dan koordinasi rukyat Indonesia.', 'An Islamic astronomy workspace for calculation, crescent simulation, and observation coordination across Indonesia.')}</p>
          <div className="hero-date"><CalendarDays size={15} /><span>{dateFmt(now, loc, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><i /> <b>{hijri}</b></div>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => go('hisab')}><Calculator size={17} />{t('Mulai hisab', 'Start calculation')}</button>
            <button className="btn secondary" onClick={() => go('peta')}><MapPin size={17} />{t('Buka peta rukyat', 'Open observation map')}</button>
          </div>
        </div>
        <div className="lunar-instrument" aria-label={`${t('Iluminasi bulan', 'Moon illumination')} ${Math.round(moon.illumination)}%`}>
          <div className="lunar-orbit orbit-one" /><div className="lunar-orbit orbit-two" />
          <div className="lunar-body"><Moon size={64} /></div>
          <span className="lunar-marker marker-a" /><span className="lunar-marker marker-b" />
          <div className="lunar-caption"><small>{t('FASE BULAN', 'MOON PHASE')}</small><b>{phaseNames[moon.phase][lang === 'en' ? 1 : 0]}</b><span>{Math.round(moon.illumination)}% {t('iluminasi', 'illumination')}</span></div>
        </div>
      </section>

      <section className="dashboard-telemetry" aria-label={t('Ringkasan observasi', 'Observation summary')}>
        <div><Moon size={18} /><span><small>{t('Usia bulan', 'Moon age')}</small><b>{moon.age?.toFixed?.(1) ?? '—'} {t('hari', 'days')}</b></span></div>
        <div><MapPin size={18} /><span><small>{t('Zona waktu', 'Time zone')}</small><b>{zlabel(loc)}</b></span></div>
        <div><Clock3 size={18} /><span><small>{t('Waktu lokal', 'Local time')}</small><b>{clock(now, loc)}</b></span></div>
        <div><Sparkles size={18} /><span><small>{t('Sistem', 'System')}</small><b>{t('Siap mengamati', 'Ready to observe')}</b></span></div>
      </section>

      <div className="dashboard-primary-grid">
        <section className="card schedule-card">
          <div className="card-header"><div><span className="section-kicker">{t('AGENDA UTAMA', 'PRIMARY SCHEDULE')}</span><h2>{t('Ijtimak & rukyat', 'Conjunction & observation')}</h2></div><CalendarDays size={20} /></div>
          <div className="schedule-list">
            {schedule.map(({ label, event, icon: Icon }) => (
              <div className="schedule-row" key={label}>
                <span className="schedule-icon"><Icon size={18} /></span>
                <div><small>{label}</small><b>{event ? dateFmt(event.date, loc, lang, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</b></div>
                <time>{event ? `${clock(event.date, loc)} ${zlabel(loc)}` : '—'}</time>
              </div>
            ))}
          </div>
          <div className="card-footer"><button className="btn secondary" onClick={() => go('hisab')}>{t('Lihat perhitungan', 'View calculation')}<ArrowRight size={16} /></button></div>
        </section>

        <section className="card quick-actions-card">
          <div className="card-header"><div><span className="section-kicker">{t('AKSES CEPAT', 'QUICK ACCESS')}</span><h2>{t('Perangkat observatorium', 'Observatory tools')}</h2></div></div>
          <div className="quick-action-list">
            {quickActions.map(({ id, label, description, icon: Icon }) => (
              <button key={id} className="quick-action" onClick={() => go(id)}>
                <span><Icon size={19} /></span><div><b>{label}</b><small>{description}</small></div><ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <Glossary />

      <section className="card sky-agenda-card">
        <div className="card-header"><div><span className="section-kicker">{t('KALENDER ASTRONOMI', 'ASTRONOMY CALENDAR')}</span><h2>{t('Agenda langit mendatang', 'Upcoming sky events')}</h2></div><button className="text-action" onClick={() => go('astronomi')}>{t('Lihat semua', 'View all')}<ArrowRight size={15} /></button></div>
        <div className="agenda-track">
          {events.length === 0 ? <p className="empty-state">{t('Belum ada agenda astronomi mendatang.', 'No upcoming astronomical events.')}</p> : events.slice(0, 5).map((event) => (
            <article className="agenda-item" key={event.id}><time><b>{dateFmt(new Date(event.date), loc, lang, { day: '2-digit' })}</b><span>{dateFmt(new Date(event.date), loc, lang, { month: 'short' })}</span></time><div><b>{event.title}</b><span><MapPin size={12} />{event.loc?.city ?? t('Indonesia', 'Indonesia')}</span></div></article>
          ))}
        </div>
      </section>
    </div>
  );
}
