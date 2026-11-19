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
  MessageCircle, UsersRound, Search, Send, ImageUp, FileText, MapPin,
  Clock, CheckCircle2, Share2, ChevronRight,
} from 'lucide-react';

const TABS = [
  { id: 'beranda', label: 'Beranda', icon: UsersRound },
  { id: 'diskusi', label: 'Diskusi', icon: MessageCircle },
  { id: 'rukyat', label: 'Rukyat', icon: FileText },
  { id: 'berita', label: 'Berita', icon: Share2 },
];

export default function Komunitas() {
  const { data, t, lang, tell, loc, update } = usePFI();
  const [tab, setTab] = useState('beranda');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (!newPost.trim()) return;
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
      tell(t('Postingan berhasil dibuat.', 'Post created.'));
    } catch (e) {
      tell(e.message || 'Gagal membuat postingan.');
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
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('KOMUNITAS RUKYAT', 'CRESCENT WATCH COMMUNITY')}</div>
        <h1>{t('Berbagi pengamatan hilal bersama', 'Share crescent observations together')}</h1>
        <p>{t('Laporan pribadi memerlukan tinjauan dan bukan penetapan resmi awal bulan.', 'Personal reports require review and are not official new month declarations.')}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TABS.map((tb) => (
          <button
            key={tb.id}
            className={`btn ${tab === tb.id ? 'primary' : 'secondary'} full`}
            onClick={() => setTab(tb.id)}
          >
            <tb.icon size={16} /> {tb.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={createPost} className="community-composer">
            <div className="field"><label htmlFor="post-type">{t('Jenis kiriman', 'Post type')}</label><select id="post-type" value={postType} onChange={(e) => setPostType(e.target.value)}><option value="diskusi">{t('Diskusi umum', 'General discussion')}</option><option value="rukyat">{t('Laporan Rukyat', 'Crescent report')}</option></select></div>
            <div className="field"><label htmlFor="post-body">{t('Catatan', 'Notes')}</label><textarea id="post-body" value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder={t('Bagikan pembahasan atau hasil pengamatan secara jelas…', 'Share a discussion or observation clearly…')} minLength={3} maxLength={4000} required rows={4}/><small className="field-hint">{newPost.length}/4000</small></div>
            {postType === 'rukyat' && <div className="rukyat-form-grid">
              <div className="field"><label htmlFor="rukyat-lat">Latitude</label><input id="rukyat-lat" type="number" step="any" min="-90" max="90" value={rukyat.lat} onChange={(e) => setRukyat({...rukyat,lat:e.target.value})} required/></div>
              <div className="field"><label htmlFor="rukyat-lon">Longitude</label><input id="rukyat-lon" type="number" step="any" min="-180" max="180" value={rukyat.lon} onChange={(e) => setRukyat({...rukyat,lon:e.target.value})} required/></div>
              <div className="field"><label htmlFor="rukyat-time">{t('Waktu pengamatan', 'Observation time')}</label><input id="rukyat-time" type="datetime-local" value={rukyat.observedAt} onChange={(e) => setRukyat({...rukyat,observedAt:e.target.value})} required/></div>
              <div className="field"><label htmlFor="rukyat-tool">{t('Instrumen', 'Instrument')}</label><input id="rukyat-tool" value={rukyat.instrument} onChange={(e) => setRukyat({...rukyat,instrument:e.target.value})} minLength={2} maxLength={180} required placeholder={t('Teleskop/binokular', 'Telescope/binoculars')}/></div>
              <div className="field"><label htmlFor="rukyat-weather">{t('Cuaca', 'Weather')}</label><input id="rukyat-weather" value={rukyat.weather} onChange={(e) => setRukyat({...rukyat,weather:e.target.value})} minLength={2} maxLength={100} required placeholder={t('Cerah, berawan…', 'Clear, cloudy…')}/></div>
              <div className="field"><label htmlFor="rukyat-result">{t('Hasil', 'Result')}</label><select id="rukyat-result" value={rukyat.result} onChange={(e) => setRukyat({...rukyat,result:e.target.value})}><option>Tidak terlihat</option><option>Terlihat</option></select></div>
              <div className="field rukyat-photo"><label htmlFor="rukyat-photo">{t('Foto asli (maks. 3 MB)', 'Original photo (max. 3 MB)')}</label><input id="rukyat-photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => { const file=e.target.files?.[0]; if(!file)return; if(file.size>3*1024*1024){tell(t('Foto maksimal 3 MB.','Photo must be under 3 MB.'));e.target.value='';return;} setRukyat({...rukyat,photo:file}); }}/></div>
            </div>}
            <button type="submit" className="btn primary"><Send size={16}/>{postType === 'rukyat' ? t('Kirim untuk ditinjau', 'Submit for review') : t('Bagikan diskusi', 'Share discussion')}</button>
          </form>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#747f8e' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{t('Memuat…', 'Loading…')}</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#747f8e' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{t('Belum ada postingan', 'No posts yet')}</div>
          <p>{t('Jadilah yang pertama membagikan pengamatan.', 'Be the first to share an observation.')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((p) => (
            <div key={p.id} className="post-card">
              <div className="post-header">
                <div className="avatar">{p.author?.split(' ').map((w) => w[0]).join('') ?? '?'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13, display: 'block' }}>{p.author}</b>
                  <div style={{ fontSize: 11, color: '#8fa3b8', display: 'flex', gap: 8 }}>
                    <span>{p.city}</span>
                    <span>{formatDate(p.date)}</span>
                    {p.status === 'verified' && <span className="pill verified" style={{ fontSize: 9, padding: '2px 6px' }}>{t('Terverifikasi', 'Verified')}</span>}
                  </div>
                </div>
              </div>
              <div className="post-body">{p.body}</div>
              <div className="post-actions">
                <button className="btn icon" onClick={() => tell(t('Like', 'Liked'))}>
                  <CheckCircle2 size={16} />
                </button>
                <button className="btn icon">
                  <MessageCircle size={16} />
                </button>
                <button className="btn icon" onClick={() => go(`komunitas/${p.id}`)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
