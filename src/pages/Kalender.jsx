import React, { useMemo, useState } from 'react';
import { usePFI, go } from '../state.jsx';
import { CalendarDays, ChevronLeft, ChevronRight, MoonStar, MapPin, Clock, Info } from 'lucide-react';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];
const DAYS = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];

function hijriLabel(date, locale = 'id-ID') {
  try {
    return new Intl.DateTimeFormat(locale + '-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'short',
    }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'short' }).format(date);
    } catch {
      return '';
    }
  }
}

export default function Kalender() {
  const { data, t, lang } = usePFI();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => new Date().toISOString().slice(0, 10));

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const total = Math.ceil((offset + count) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const day = i - offset + 1;
      if (day < 1 || day > count) return null;
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      return {
        day,
        iso: [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-'),
        hijri: hijriLabel(date, lang === 'en' ? 'en' : 'id-ID'),
        today: date.toDateString() === new Date().toDateString(),
      };
    });
  }, [month, lang]);

  const agendas = useMemo(() => (data.agendas || []).filter((item) => {
    const date = String(item.date || '').slice(0, 10);
    return date === selected;
  }), [data.agendas, selected]);

  const selectedDate = new Date(selected + 'T12:00:00');
  const moveMonth = (delta) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  const monthTitle = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { month: 'long', year: 'numeric' }).format(month);

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('WAKTU & AGENDA FALAK', 'ASTRONOMY TIME & AGENDA')}</div>
        <h1>{t('Kalender Hijriah', 'Hijri Calendar')}</h1>
        <p>{t('Pantau tanggal Hijriah, agenda pengamatan, dan momen astronomi dalam satu tampilan.', 'Track Hijri dates, observation agendas, and astronomical moments in one view.')}</p>
      </div>

      <section className="calendar-hero">
        <div className="calendar-hero-orbit" aria-hidden="true"><MoonStar size={34} /></div>
        <div className="calendar-hero-copy">
          <span>{t('TANGGAL HIJRIAH HARI INI', 'TODAY IN THE HIJRI CALENDAR')}</span>
          <strong>{hijriLabel(new Date(), lang === 'en' ? 'en' : 'id-ID')}</strong>
          <small>{new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', { dateStyle: 'full' }).format(new Date())}</small>
        </div>
      </section>

      <section className="card calendar-card">
        <div className="calendar-toolbar">
          <button className="btn icon" onClick={() => moveMonth(-1)} aria-label={t('Bulan sebelumnya','Previous month')}><ChevronLeft /></button>
          <h2>{monthTitle}</h2>
          <button className="btn icon" onClick={() => moveMonth(1)} aria-label={t('Bulan berikutnya','Next month')}><ChevronRight /></button>
        </div>
        <div className="calendar-grid">
          {DAYS.map((day) => <div className="calendar-weekday" key={day}>{lang === 'en' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][DAYS.indexOf(day)] : day}</div>)}
          {cells.map((cell, index) => cell ? (
            <button
              key={cell.iso}
              className={`calendar-day ${selected === cell.iso ? 'selected' : ''} ${cell.today ? 'today' : ''}`}
              onClick={() => setSelected(cell.iso)}
              aria-pressed={selected === cell.iso}
            >
              <b>{cell.day}</b>
              <small>{cell.hijri}</small>
              {cell.today && <i />}
            </button>
          ) : <div className="calendar-day empty" key={'empty-' + index} />)}
        </div>
        <div className="calendar-legend">
          <span><i className="legend-today" /> {t('Hari ini','Today')}</span>
          <span><i className="legend-selected" /> {t('Dipilih','Selected')}</span>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>{t('Agenda pada tanggal terpilih','Agenda on selected date')}</h2>
            <p className="calendar-subtitle">{new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', { dateStyle: 'long' }).format(selectedDate)}</p>
          </div>
          <CalendarDays size={20} className="text-gold" />
        </div>
        <div className="card-body">
          {agendas.length ? agendas.map((agenda) => (
            <article className="agenda-item" key={agenda.id}>
              <div className="agenda-date"><CalendarDays size={17} /></div>
              <div className="agenda-content">
                <b>{agenda.title}</b>
                <p>{agenda.body}</p>
                <small><Clock size={12} /> {agenda.time || t('Waktu belum ditentukan','Time not set')} <MapPin size={12} /> {agenda.location || t('Lokasi belum ditentukan','Location not set')}</small>
              </div>
            </article>
          )) : (
            <div className="calendar-empty">
              <CalendarDays size={28} />
              <b>{t('Belum ada agenda pada tanggal ini','No agenda on this date')}</b>
              <span>{t('Agenda pengamatan dari kelompok atau koordinator akan tampil di sini setelah tersedia.','Observation agendas from groups or coordinators will appear here when available.')}</span>
            </div>
          )}
        </div>
      </section>

      <div className="calendar-note">
        <Info size={17} />
        <p>{t('Tanggal Hijriah pada kalender ini merupakan konversi kalender Umm al-Qura untuk referensi. Penetapan resmi awal Ramadan, Syawal, dan Zulhijah mengikuti keputusan otoritas yang berwenang di Indonesia.','Hijri dates shown here are Umm al-Qura calendar conversions for reference. Official Ramadan, Shawwal, and Dhu al-Hijjah starts follow the competent authority in Indonesia.')}</p>
      </div>
    </div>
  );
}
