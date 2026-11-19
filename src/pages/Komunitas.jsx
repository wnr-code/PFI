/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, { useState, useEffect, useMemo } from 'react';
import { usePFI, go } from '../state.jsx';
import { api, offlineStore, offlineGet } from '../lib/api.js';
import {
  MessageCircle, UsersRound, Send, FileText, MapPin,
  CheckCircle2, ChevronRight, Plus, X, Telescope,
} from 'lucide-react';

const TABS = [
  { id: 'semua', label: 'Semua', icon: UsersRound },
  { id: 'diskusi', label: 'Diskusi', icon: MessageCircle },
  { id: 'rukyat', label: 'Rukyat', icon: Telescope },
];

export default function Komunitas() {
  const { data, t, lang, tell, loc, update } = usePFI();
  const [tab, setTab] = useState('semua');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('diskusi');
  const [rukyat, setRukyat] = useState({ lat: '', lon: '', instrument: '', weather: '', result: 'Tidak terlihat', observedAt: '', photo: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api('/api/posts');
        await offlineStore('posts', p);
        if (!cancelled) setPosts(p);
      } catch (e) {
        const cached = await offlineGet('posts');
        if (!cancelled) setPosts(cached || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'rukyat') return posts.filter((p) => p.type === 'rukyat');
    if (tab === 'diskusi') return posts.filter((p) => p.type === 'diskusi');
    return posts;
  }, [posts, tab]);

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || submitting) return;
    setSubmitting(true);
    try {
      const payload = { type: postType, title: newPost.slice(0, 60), body: newPost, city: loc.city };
      if (postType === 'rukyat') {
        const offset = String(loc.offset).padStart(2, '0');
        const observedAt = `${rukyat.observedAt}:00+${offset}:00`;
        payload.details = {
          latitude: Number(rukyat.lat), longitude: Number(rukyat.lon), observedAt,
          timeZone: loc.offset === 9 ? 'WIT' : loc.offset === 8 ? 'WITA' : 'WIB',
          instrument: rukyat.instrument, weather: rukyat.weather,
          visibility: rukyat.result, elevation: loc.elev, accuracyMeters: null,
        };
      }
      const created = await api('/api/posts', 'POST', payload);
      if (postType === 'rukyat' && rukyat.photo) {
        const upload = new FormData();
        upload.append('photo', rukyat.photo);
        try { await api(`/api/posts/${created.id}/photo`, 'POST', upload); }
        catch (photoError) { tell(t('Laporan tersimpan, tetapi foto gagal diunggah: ', 'Report saved, but photo upload failed: ') + photoError.message); }
      }
      setNewPost('');
      setTab(postType === 'rukyat' ? 'rukyat' : 'diskusi');
      // The 201 response is authoritative: show it immediately instead of
      // waiting for a follow-up list request that may briefly lag behind.
      setPosts((current) => [created, ...current.filter((post) => post.id !== created.id)]);
      update((current) => ({ posts: [created, ...(current.posts || []).filter((post) => post.id !== created.id)] }));
      try {
        const latest = await api('/api/posts');
        const merged = latest.some((post) => post.id === created.id) ? latest : [created, ...latest];
        setPosts(merged);
        update({ posts: merged });
        await offlineStore('posts', merged);
      } catch {
        await offlineStore('posts', [created, ...posts.filter((post) => post.id !== created.id)]);
      }
      setShowComposer(false);
      tell(t('Postingan berhasil dibuat.', 'Post created.'));
    } catch (e) {
      tell(e.message || 'Gagal membuat postingan.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return '-'; }
  };

  return (
    <div className="page-wrap community-page">
      <section className="community-hero">
        <div>
          <div className="eyebrow"><i /> {t('RUANG PENGAMAT', 'OBSERVER SPACE')}</div>
          <h1>{t('Komunitas Falaq', 'Falaq Community')}</h1>
          <p>{t('Diskusi, catatan lapangan, dan laporan rukyat dari pengamat di seluruh Indonesia.', 'Discussions, field notes, and crescent reports from observers across Indonesia.')}</p>
        </div>
        <div className="community-summary" aria-label={t('Ringkasan komunitas', 'Community summary')}>
          <span><b>{posts.length}</b>{t('kiriman', 'posts')}</span>
          <span><b>{posts.filter((post) => post.type === 'rukyat').length}</b>{t('laporan rukyat', 'reports')}</span>
        </div>
      </section>

      <div className="community-toolbar">
        <div className="community-tabs" role="tablist" aria-label={t('Filter kiriman', 'Post filters')}>
          {TABS.map((tb) => (
            <button key={tb.id} role="tab" aria-selected={tab === tb.id} className={tab === tb.id ? 'active' : ''} onClick={() => setTab(tb.id)}>
              <tb.icon size={16} /> {t(tb.label, tb.id === 'semua' ? 'All' : tb.label)}
              <small>{tb.id === 'semua' ? posts.length : posts.filter((post) => post.type === tb.id).length}</small>
            </button>
          ))}
        </div>
        <button className={`community-create ${showComposer ? 'active' : ''}`} onClick={() => setShowComposer((value) => !value)}>
          {showComposer ? <X size={18}/> : <Plus size={18}/>}
          {showComposer ? t('Tutup', 'Close') : t('Buat kiriman', 'Create post')}
        </button>
      </div>

      {showComposer && <section className="community-compose-card">
        <header><div><span>{t('KIRIMAN BARU', 'NEW POST')}</span><h2>{postType === 'rukyat' ? t('Laporan pengamatan', 'Observation report') : t('Mulai diskusi', 'Start a discussion')}</h2></div><FileText size={22}/></header>
        <form onSubmit={createPost} className="community-composer">
          <div className="community-type-picker">
            <button type="button" className={postType === 'diskusi' ? 'active' : ''} onClick={() => setPostType('diskusi')}><MessageCircle size={17}/>{t('Diskusi', 'Discussion')}</button>
            <button type="button" className={postType === 'rukyat' ? 'active' : ''} onClick={() => setPostType('rukyat')}><Telescope size={17}/>{t('Laporan Rukyat', 'Crescent report')}</button>
          </div>
          <div className="field community-notes"><label htmlFor="post-body">{t('Apa yang ingin Anda bagikan?', 'What would you like to share?')}</label><textarea id="post-body" value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder={t('Tuliskan catatan secara jelas dan bermanfaat…', 'Write a clear and useful note…')} minLength={3} maxLength={4000} required rows={4}/><small className="field-hint">{newPost.length}/4000</small></div>
          {postType === 'rukyat' && <div className="rukyat-form-grid">
            <div className="field"><label htmlFor="rukyat-lat">Latitude</label><input id="rukyat-lat" type="number" step="any" min="-90" max="90" value={rukyat.lat} onChange={(e) => setRukyat({...rukyat,lat:e.target.value})} required/></div>
            <div className="field"><label htmlFor="rukyat-lon">Longitude</label><input id="rukyat-lon" type="number" step="any" min="-180" max="180" value={rukyat.lon} onChange={(e) => setRukyat({...rukyat,lon:e.target.value})} required/></div>
            <div className="field"><label htmlFor="rukyat-time">{t('Waktu pengamatan', 'Observation time')}</label><input id="rukyat-time" type="datetime-local" value={rukyat.observedAt} onChange={(e) => setRukyat({...rukyat,observedAt:e.target.value})} required/></div>
            <div className="field"><label htmlFor="rukyat-tool">{t('Instrumen', 'Instrument')}</label><input id="rukyat-tool" value={rukyat.instrument} onChange={(e) => setRukyat({...rukyat,instrument:e.target.value})} minLength={2} maxLength={180} required placeholder={t('Teleskop/binokular', 'Telescope/binoculars')}/></div>
            <div className="field"><label htmlFor="rukyat-weather">{t('Cuaca', 'Weather')}</label><input id="rukyat-weather" value={rukyat.weather} onChange={(e) => setRukyat({...rukyat,weather:e.target.value})} minLength={2} maxLength={100} required placeholder={t('Cerah, berawan…', 'Clear, cloudy…')}/></div>
            <div className="field"><label htmlFor="rukyat-result">{t('Hasil', 'Result')}</label><select id="rukyat-result" value={rukyat.result} onChange={(e) => setRukyat({...rukyat,result:e.target.value})}><option>Tidak terlihat</option><option>Terlihat</option></select></div>
            <div className="field rukyat-photo"><label htmlFor="rukyat-photo">{t('Foto asli (maks. 3 MB)', 'Original photo (max. 3 MB)')}</label><input id="rukyat-photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => { const file=e.target.files?.[0]; if(!file)return; if(file.size>3*1024*1024){tell(t('Foto maksimal 3 MB.','Photo must be under 3 MB.'));e.target.value='';return;} setRukyat({...rukyat,photo:file}); }}/></div>
          </div>}
          <button type="submit" className="community-submit" disabled={submitting || newPost.trim().length < 3}><Send size={17}/>{submitting ? t('Mengirim…', 'Sending…') : postType === 'rukyat' ? t('Kirim untuk ditinjau', 'Submit for review') : t('Publikasikan diskusi', 'Publish discussion')}</button>
        </form>
      </section>}

      <section className="community-feed-head"><div><span>{t('LINIMASA', 'TIMELINE')}</span><h2>{tab === 'semua' ? t('Kiriman terbaru', 'Latest posts') : TABS.find((item) => item.id === tab)?.label}</h2></div><small>{filtered.length} {t('kiriman', 'posts')}</small></section>

      {loading ? (
        <div className="community-state"><span className="loading-orbit"/><b>{t('Memuat linimasa…', 'Loading timeline…')}</b></div>
      ) : filtered.length === 0 ? (
        <div className="community-state empty"><MessageCircle size={30}/><b>{t('Belum ada kiriman', 'No posts yet')}</b><p>{t('Mulai percakapan yang bermanfaat untuk sesama pengamat.', 'Start a useful conversation with fellow observers.')}</p></div>
      ) : (
        <div className="community-feed">
          {filtered.map((p) => (
            <article key={p.id} className={`community-post ${p.type}`}>
              <header>
                <div className="avatar">{p.author?.split(' ').map((w) => w[0]).join('').slice(0,2) ?? '?'}</div>
                <div className="community-author"><b>{p.author || t('Pengamat', 'Observer')}</b><span><MapPin size={12}/>{p.city || '—'}<i/>{formatDate(p.date)}</span></div>
                <span className="community-kind">{p.type === 'rukyat' ? <Telescope size={13}/> : <MessageCircle size={13}/>} {p.type === 'rukyat' ? 'Rukyat' : 'Diskusi'}</span>
              </header>
              <div className="community-post-body">{p.title && p.title !== p.body ? <h3>{p.title}</h3> : null}<p>{p.body}</p></div>
              <footer>
                <div>{p.status === 'verified' ? <span className="post-status verified"><CheckCircle2 size={13}/>{t('Terverifikasi', 'Verified')}</span> : p.type === 'rukyat' ? <span className="post-status pending">{t('Dalam tinjauan', 'Under review')}</span> : null}</div>
                <button onClick={() => go(`komunitas/${p.id}`)}>{t('Buka kiriman', 'Open post')}<ChevronRight size={15}/></button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
