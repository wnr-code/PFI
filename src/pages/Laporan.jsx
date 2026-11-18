// PFI — Pusat Falak Indonesia | Maintainer: @wnr-code
// Repository: https://github.com/wnr-code/PFI
// Project support: https://trakteer.id/lanteraku/tip
// AI-assisted implementation; reviewed and maintained by the project maintainer.
import React, { useEffect, useMemo, useState } from 'react';
import { usePFI, go } from '../state.jsx';
import { api, offlineGet } from '../lib/api.js';
import {
  FileDown, FileText, Share2, ChevronRight, MapPin, LocateFixed,
  Send, Clock3, CloudSun, Telescope, ShieldCheck, AlertCircle,
} from 'lucide-react';

const localDateTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function Laporan() {
  const { data, t, lang, tell } = usePFI();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', body: '', city: '', latitude: '', longitude: '',
    observedAt: localDateTime(), weather: 'Cerah', instrument: 'Mata telanjang',
    visibility: 'Belum dinilai', elevation: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await api('/api/posts');
        if (!cancelled) setPosts(result);
      } catch {
        const cached = await offlineGet('posts');
        if (!cancelled) setPosts(cached || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const reports = useMemo(() => posts.filter((p) => p.type === 'rukyat'), [posts]);
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const locate = () => {
    if (!navigator.geolocation) {
      tell(t('Perangkat tidak mendukung GPS.', 'GPS is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((f) => ({
        ...f, latitude: coords.latitude.toFixed(6),
        longitude: coords.longitude.toFixed(6),
        elevation: Number.isFinite(coords.altitude) ? String(Math.round(coords.altitude)) : f.elevation,
      })),
      () => tell(t('Lokasi tidak dapat diakses. Periksa izin lokasi perangkat.', 'Unable to access location. Check device permissions.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!data.account) {
      tell(t('Silakan masuk sebelum mengirim laporan.', 'Please sign in before submitting a report.'));
      return;
    }
    setSaving(true);
    try {
      const created = await api('/api/posts', 'POST', {
        type: 'rukyat',
        title: form.title,
        body: form.body,
        city: form.city,
        details: {
          latitude: form.latitude,
          longitude: form.longitude,
          observedAt: new Date(form.observedAt).toISOString(),
          weather: form.weather,
          instrument: form.instrument,
          visibility: form.visibility,
          elevation: form.elevation,
        },
      });
      setPosts((current) => [created, ...current]);
      setForm((f) => ({ ...f, title: '', body: '', latitude: '', longitude: '', elevation: '' }));
      tell(t('Laporan berhasil dikirim dan menunggu verifikasi.', 'Report submitted and awaiting review.'));
    } catch (error) {
      tell(error.message || t('Laporan gagal dikirim.', 'Unable to submit report.'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '—';
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(date);
  };

  const field = (label, key, props = {}) => (
    <label className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span>{label}</span>
      <input value={form[key]} onChange={(e) => update(key, e.target.value)} {...props} />
    </label>
  );

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('PUSAT LAPORAN', 'REPORT CENTRE')}</div>
        <h1>{t('Laporan Pengamatan Hilal', 'Crescent Observation Report')}</h1>
        <p>{t('Kirim catatan pengamatan dengan lokasi dan waktu yang jelas agar dapat ditinjau oleh petugas.', 'Submit an observation with precise location and time for reviewer assessment.')}</p>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ color: 'var(--gold, #d6ae62)' }}><ShieldCheck size={22} /></div>
            <div>
              <b>{t('Formulir laporan rukyat', 'Rukyat report form')}</b>
              <p style={{ color: 'var(--muted, #8fa3b8)', fontSize: 12, margin: '4px 0 0' }}>
                {t('Laporan akan berstatus menunggu sampai ditinjau. Laporan pribadi bukan penetapan resmi awal bulan Hijriah.', 'Reports remain pending until reviewed. Personal reports do not constitute an official Hijri month announcement.')}
              </p>
            </div>
          </div>

          {!data.account && (
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface2)', marginBottom: 14, fontSize: 13 }}>
              <AlertCircle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {t('Anda perlu masuk untuk mengirim laporan.', 'Sign in is required to submit a report.')}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {field(t('Judul pengamatan', 'Observation title'), 'title', { required: true, maxLength: 120, placeholder: t('Contoh: Pengamatan hilal awal Ramadan', 'e.g. Ramadan crescent observation') })}
            {field(t('Kota / lokasi pengamatan', 'City / observation location'), 'city', { required: true, maxLength: 100, placeholder: t('Nama kota atau kabupaten', 'City or regency') })}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
              {field(t('Lintang (latitude)', 'Latitude'), 'latitude', { required: true, type: 'number', step: 'any', min: -90, max: 90, placeholder: '-7.000000' })}
              {field(t('Bujur (longitude)', 'Longitude'), 'longitude', { required: true, type: 'number', step: 'any', min: -180, max: 180, placeholder: '110.000000' })}
            </div>
            <button type="button" className="btn secondary" onClick={locate}>
              <LocateFixed size={16} /> {t('Gunakan lokasi GPS', 'Use GPS location')}
            </button>
            {field(t('Waktu pengamatan', 'Observation time'), 'observedAt', { type: 'datetime-local', required: true })}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
              <label className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span><CloudSun size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />{t('Cuaca', 'Weather')}</span>
                <select value={form.weather} onChange={(e) => update('weather', e.target.value)}>
                  {['Cerah','Berawan','Mendung','Hujan','Kabut'].map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span><Telescope size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />{t('Instrumen', 'Instrument')}</span>
                <select value={form.instrument} onChange={(e) => update('instrument', e.target.value)}>
                  {['Mata telanjang','Binokular','Teleskop','Kamera DSLR','Kamera astronomi'].map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
            </div>
            {field(t('Ketinggian lokasi (meter)', 'Site elevation (metres)'), 'elevation', { type: 'number', min: 0, max: 9000, placeholder: 'Opsional' })}
            <label className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span>{t('Kondisi / hasil pengamatan', 'Observation notes / result')}</span>
              <select value={form.visibility} onChange={(e) => update('visibility', e.target.value)}>
                <option>Belum dinilai</option><option>Hilal terlihat</option><option>Hilal tidak terlihat</option><option>Tertutup awan</option><option>Tidak dapat diamati</option>
              </select>
            </label>
            <label className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span>{t('Catatan pengamatan', 'Observation notes')}</span>
              <textarea required rows={4} maxLength={5000} value={form.body} onChange={(e) => update('body', e.target.value)} placeholder={t('Jelaskan proses pengamatan, arah pandang, kondisi ufuk, dan hasil yang diperoleh…', 'Describe the observation process, viewing direction, horizon conditions, and result…')} />
            </label>
            <button type="submit" className="btn primary" disabled={saving || !data.account}>
              <Send size={16} /> {saving ? t('Mengirim…', 'Submitting…') : t('Kirim laporan untuk ditinjau', 'Submit report for review')}
            </button>
          </form>
          <div style={{ marginTop: 12, color: 'var(--muted, #8fa3b8)', fontSize: 11 }}>
            <AlertCircle size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            {t('Lampiran foto belum tersedia pada tahap ini. Simpan berkas asli untuk dilampirkan setelah fitur upload R2 diaktifkan.', 'Photo attachments are not yet available in this phase. Keep original files for upload once R2 attachment support is enabled.')}
          </div>
        </div>
      </div>

      <div className="page-head">
        <div className="eyebrow"><i /> {t('RIWAYAT', 'HISTORY')}</div>
        <h2>{t('Riwayat Pengamatan', 'Observation History')}</h2>
      </div>
      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: '#8fa3b8' }}>{t('Memuat…', 'Loading…')}</div>
      ) : reports.length === 0 ? (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', color: '#8fa3b8' }}>
          <FileText size={28} /><p>{t('Belum ada laporan rukyat.', 'No rukyat reports yet.')}</p>
        </div></div>
      ) : (
        <div className="card"><div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((p) => (
            <div key={p.id} className="post-card">
              <div className="post-header">
                <div className="avatar">{p.author?.split(' ').map((w) => w[0]).join('') ?? '?'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13, display: 'block' }}>{p.author}</b>
                  <div style={{ fontSize: 11, color: '#8fa3b8' }}>{p.city} · {formatDate(p.date)}</div>
                </div>
                <span className={`pill ${p.status === 'verified' ? 'verified' : 'pending'}`} style={{ fontSize: 9 }}>
                  {p.status === 'verified' ? t('Terverifikasi', 'Verified') : p.status === 'revision' ? t('Perlu revisi', 'Revision') : t('Menunggu', 'Pending')}
                </span>
              </div>
              <b>{p.title}</b>
              <div className="post-body">{p.body}</div>
              <div className="post-actions">
                <button className="btn icon" onClick={() => go(`komunitas/${p.id}`)}><ChevronRight size={14} /></button>
              </div>
            </div>
          ))}
        </div></div>
      )}
    </div>
  );
}
