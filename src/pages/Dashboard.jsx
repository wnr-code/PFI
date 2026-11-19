import React, { useMemo } from 'react';
import { usePFI, go } from '../state.jsx';
import { lunar, dateFmt, hijriText, clock, zlabel, phaseNames } from '../lib/astro.js';
import {
  Moon, Sun, CalendarDays, MapPin, Calculator, Telescope, UsersRound,
  FileText, Share2, Orbit, History, FileDown, ArrowRight,
} from 'lucide-react';

export default function Dashboard() {
  const { data, t, lang, loc, events, tell } = usePFI();
  const today = dateFmt(new Date(), loc, lang, { day: 'numeric', month: 'long', year: 'numeric' });
  const hijri = hijriText(new Date(), loc, lang, false);

  const moon = useMemo(() => lunar(new Date()), [loc]);
  const conjunction = events.find((event) => event.type === 'new');
  const observation = events.find((event) => event.type === 'rukyat');

  const quickActions = [
    { id: 'hisab', label: t('Hisab Awal Bulan', 'New Month Calculation'), icon: Calculator, color: 'text-gold' },
    { id: 'astronomi', label: t('Simulasi Hilal', 'Crescent Simulation'), icon: Telescope, color: 'text-gold' },
    { id: 'kalender', label: t('Kalender Hijriah', 'Hijri Calendar'), icon: CalendarDays, color: 'text-gold' },
    { id: 'peta', label: t('Peta Rukyat', 'Observation Map'), icon: MapPin, color: 'text-gold' },
    { id: 'komunitas', label: t('Komunitas', 'Community'), icon: UsersRound, color: 'text-gold' },
    { id: 'laporan', label: t('Pusat Laporan', 'Report Centre'), icon: FileText, color: 'text-gold' },
  ];

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow">
          <i /> {t('ASSALAMU\'ALAIKUM', 'ASSALAMU\'ALAIKUM')}
        </div>
        <h1>{t('Mari bersama melengkapi ilmu falak dan astronomi Islam.', 'Let\'s complete Islamic astronomy and falak knowledge together.')}</h1>
        <p>{dateFmt(new Date(), loc, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {hijri}</p>
      </div>

      <section className="pfi-hero" aria-label={t('Langit malam Pusat Falak Indonesia', 'PFI night sky')}>
        <img
          className="pfi-hero-image"
          src="https://commons.wikimedia.org/wiki/Special:FilePath/ISS043-E-39748_-_View_of_Earth%27s_horizon_and_the_crescent_Moon.jpg?width=2400"
          alt={t('Bulan sabit di langit malam', 'Crescent moon in the night sky')}
          loading="eager"
        />
        <div className="pfi-hero-shade" />
        <div className="pfi-hero-copy">
          <span className="pfi-hero-kicker">{t('PUSAT FALAK INDONESIA', 'INDONESIAN FALAK CENTRE')}</span>
          <h2>{t('Menghubungkan Ilmu, Mengamati Semesta, Menyatukan Umat.', 'Connecting knowledge, observing the universe, uniting the community.')}</h2>
          <p>{t('Jelajahi data hilal, astronomi, dan pengamatan langit bersama.', 'Explore crescent data, astronomy, and sky observations together.')}</p>
          <button className="btn primary" onClick={() => go('hisab')}>
            <Calculator size={17} /> {t('Mulai Hisab', 'Start Calculation')}
          </button>
        </div>
        <span className="pfi-hero-stars" aria-hidden="true">✦　·　✧　·　✦</span>
      </section>

      <section className="dashboard-rukyat-entry">
        <div className="dashboard-rukyat-orb" aria-hidden="true"><span /></div>
        <div className="dashboard-rukyat-copy">
          <span className="rukyat-kicker">{t('PEMANTAUAN NASIONAL', 'NATIONAL MONITORING')}</span>
          <h2>{t('Jelajahi titik pengamatan hilal', 'Explore crescent observation sites')}</h2>
          <p>{t('Pilih bola dunia interaktif atau peta Indonesia untuk melihat sebaran laporan rukyat.', 'Choose the interactive globe or Indonesia map to explore rukyat reports.')}</p>
          <button className="btn primary" onClick={() => go('peta')}><MapPin size={17}/>{t('Buka Peta Rukyat', 'Open Observation Map')} <ArrowRight size={16}/></button>
        </div>
      </section>

      <div className="card">
        <div className="card-body">
          <div className="moon-display">
            <div className="moon-big">
              <Moon size={48} color="#d6ae62" />
            </div>
            <div className="moon-info">
              <h3>{t('Fase Bulan', 'Moon Phase')} · {phaseNames[moon.phase]?.[lang === 'en' ? 1 : 0] || '—'}</h3>
              <p>{t('Iluminasi', 'Illumination')}: {Math.round(moon.illumination)}% · {t('Usia', 'Age')}: {moon.age?.toFixed?.(1) ?? '—'} {t('hari', 'days')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="card">
          <div className="card-header">
            <h2>{t('Jadwal Ijtimak & Rukyat', 'Conjunction & Observation Schedule')}</h2>
          </div>
          <div className="card-body">
            <div className="result-grid">
              <div className="metric">
                <span className="label">{t('Ijtimak Berikutnya', 'Next Conjunction')}</span>
                <b>{conjunction ? dateFmt(new Date(conjunction.date), loc, lang, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</b>
                <small>{conjunction ? `${clock(new Date(conjunction.date), loc)} ${zlabel(loc)}` : '—'}</small>
              </div>
              <div className="metric">
                <span className="label">{t('Rukyat Hilal', 'Crescent Observation')}</span>
                <b>{observation ? dateFmt(new Date(observation.date), loc, lang, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</b>
                <small>{observation ? `${clock(new Date(observation.date), loc)} ${zlabel(loc)}` : '—'}</small>
              </div>
            </div>
          </div>
          <div className="card-footer">
            <button className="btn primary full" onClick={() => go('hisab')}>
              <CalendarDays size={16} /> {t('Hitung Sekarang', 'Calculate Now')}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{t('Pilihan Cepat', 'Quick Actions')}</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            {quickActions.map((a) => (
              <button
                key={a.id}
                className={`btn secondary full ${a.color}`}
                onClick={() => go(a.id)}
              >
                <a.icon size={18} /> {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{t('Agenda Langit', 'Sky Events')}</h2>
        </div>
        <div className="card-body">
          {events.length === 0 ? (
            <p style={{ color: '#747f8e', fontSize: 13, textAlign: 'center', padding: 20 }}>
              {t('Tidak ada agenda astronomi mendatang.', 'No upcoming astronomical events.')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.slice(0, 5).map((e) => (
                <div key={e.id} style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b style={{ fontSize: 13 }}>{e.title}</b>
                      <div style={{ fontSize: 11, color: '#8fa3b8' }}>{e.loc?.city ?? '-'}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#d6ae62', fontWeight: 600 }}>
                      {dateFmt(new Date(e.date), loc, lang, { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card-footer">
          <button className="btn secondary full" onClick={() => go('kalender')}>
            <CalendarDays size={16} /> {t('Lihat Kalender Lengkap', 'View Full Calendar')}
          </button>
        </div>
      </div>
    </div>
  );
}
