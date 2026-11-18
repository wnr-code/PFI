import React, { useMemo, useState } from 'react';
import { usePFI } from '../state.jsx';
import { zone } from '../lib/astro.js';
import { api } from '../lib/api.js';
import { CalendarDays, ChevronLeft, ChevronRight, MoonStar, MapPin, Clock, Info } from 'lucide-react';

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];
const DAYS = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];

function localISO(date = new Date(), loc) {
  const local = new Date(date.getTime() + (loc?.offset || 7) * 3600000);
  return local.toISOString().slice(0, 10);
}

function hijriLabel(date, locale = 'id-ID', loc) {
  try {
    return new Intl.DateTimeFormat(locale + '-u-ca-islamic-umalqura', {
      timeZone: zone(loc), day: 'numeric', month: 'short',
    }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat('en-u-ca-islamic', {
        timeZone: zone(loc), day: 'numeric', month: 'short',
      }).format(date);
    } catch {
      return '';
    }
  }
}

export default function Kalender() {
  const { data, t, lang, loc, refresh, tell } = usePFI();
  const [month, setMonth] = useState(() => {
    const today = localISO(new Date(), loc).split('-').map(Number);
    return new Date(Date.UTC(today[0], today[1] - 1, 1, 12));
  });
  const [selected, setSelected] = useState(() => localISO(new Date(), loc));
  const [groups, setGroups] = useState([]);
  const [groupDetails, setGroupDetails] = useState({});
  const [agendaForm, setAgendaForm] = useState({ group: '', title: '', body: '', location: '' });
  const [agendaBusy, setAgendaBusy] = useState(false);

  const cells = useMemo(() => {
    const year = month.getUTCFullYear();
    const monthIndex = month.getUTCMonth();
    const first = new Date(Date.UTC(year, monthIndex, 1, 12));
    const offset = (first.getUTCDay() + 6) % 7;
    const count = new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
    const total = Math.ceil((offset + count) / 7) * 7;
    const todayISO = localISO(new Date(), loc);
    return Array.from({ length: total }, (_, i) => {
      const day = i - offset + 1;
      if (day < 1 || day > count) return null;
      const date = new Date(Date.UTC(year, monthIndex, day, 12) - loc.offset * 3600000);
      const iso = [year, String(monthIndex + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-');
      return {
        day,
        iso,
        hijri: hijriLabel(date, lang === 'en' ? 'en' : 'id-ID', loc),
        today: iso === todayISO,
      };
    });
  }, [month, lang, loc]);

  const agendas = useMemo(() => (data.agendas || []).filter((item) => {
    const date = String(item.date || '').slice(0, 10);
    return date === selected;
  }), [data.agendas, selected]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const allGroups = await api('/api/groups');
        if (cancelled) return;
        setGroups(allGroups || []);
        const ids = data.groups || [];
        const details = await Promise.all(ids.map((id) =>
          api(`/api/groups/${id}/members`).catch(() => null)
        ));
        if (!cancelled) {
          setGroupDetails(Object.fromEntries(details.filter(Boolean).map((item) => [item.group, item])));
        }
      } catch {
        if (!cancelled) setGroupDetails({});
      }
    })();
    return () => { cancelled = true; };
  }, [data.account?.id, (data.groups || []).join(',')]);

  const coordinatorGroups = groups.filter((group) =>
    groupDetails[group.id]?.coordinator === data.account?.id
  );
  const createAgenda = async (event) => {
    event.preventDefault();
    const group = agendaForm.group || coordinatorGroups[0]?.id;
    if (!group) return;
    setAgendaBusy(true);
    try {
      await api('/api/agendas', 'POST', {
        group,
        title: agendaForm.title.trim(),
        body: agendaForm.body.trim(),
        date: selected,
        location: agendaForm.location.trim(),
      });
      await refresh();
      setAgendaForm((current) => ({ ...current, title: '', body: '', location: '' }));
      tell(t('Agenda kelompok berhasil dibuat.', 'Group agenda created.'));
    } catch (error) {
      tell(error.message || t('Agenda gagal dibuat. Pastikan Anda koordinator kelompok.', 'Unable to create agenda. Confirm you are the group coordinator.'));
    } finally {
      setAgendaBusy(false);
    }
  };

  const selectedDate = new Date(`${selected}T12:00:00Z`);
  const moveMonth = (delta) => setMonth((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + delta, 1, 12)));
  const monthTitle = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { timeZone: zone(loc), month: 'long', year: 'numeric' }).format(month);

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
          <strong>{hijriLabel(new Date(), lang === 'en' ? 'en' : 'id-ID', loc)}</strong>
          <small>{new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', { timeZone: zone(loc), dateStyle: 'full' }).format(new Date())}</small>
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

      {coordinatorGroups.length > 0 && (
        <section className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2>{t('Buat Agenda Kelompok', 'Create Group Agenda')}</h2></div>
          <div className="card-body">
            <form onSubmit={createAgenda} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {coordinatorGroups.length > 1 && (
                <label className="field">
                  <span>{t('Kelompok', 'Group')}</span>
                  <select value={agendaForm.group || coordinatorGroups[0].id} onChange={(event) => setAgendaForm((current) => ({ ...current, group: event.target.value }))}>
                    {coordinatorGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </select>
                </label>
              )}
              <label className="field">
                <span>{t('Judul agenda', 'Agenda title')}</span>
                <input value={agendaForm.title} onChange={(event) => setAgendaForm((current) => ({ ...current, title: event.target.value }))} maxLength={130} required />
              </label>
              <label className="field">
                <span>{t('Keterangan', 'Description')}</span>
                <textarea value={agendaForm.body} onChange={(event) => setAgendaForm((current) => ({ ...current, body: event.target.value }))} minLength={3} maxLength={1000} rows={3} required />
              </label>
              <label className="field">
                <span>{t('Lokasi', 'Location')}</span>
                <input value={agendaForm.location} onChange={(event) => setAgendaForm((current) => ({ ...current, location: event.target.value }))} maxLength={100} placeholder={t('Nama lokasi atau titik pengamatan', 'Location or observation site')} />
              </label>
              <p style={{ color: '#8fa3b8', fontSize: 12 }}>{t('Tanggal agenda mengikuti tanggal yang dipilih pada kalender.', 'Agenda date follows the selected calendar date.')}: {selected}</p>
              <button className="btn primary" type="submit" disabled={agendaBusy || agendaForm.title.trim().length === 0 || agendaForm.body.trim().length < 3}>
                {agendaBusy ? t('Menyimpan…', 'Saving…') : t('Simpan agenda', 'Save agenda')}
              </button>
            </form>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <div>
            <h2>{t('Agenda pada tanggal terpilih','Agenda on selected date')}</h2>
            <p className="calendar-subtitle">{new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'id-ID', { timeZone: zone(loc), dateStyle: 'long' }).format(selectedDate)}</p>
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
