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
];

export default function Komunitas() {
  const { data, t, lang, tell, loc } = usePFI();
  const [tab, setTab] = useState('beranda');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('diskusi');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPosts([]);
    setLoading(true);
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
  }, [data.account?.id]);

  const filtered = useMemo(() => {
    if (tab === 'rukyat') return posts.filter((p) => p.type === 'rukyat');
    if (tab === 'diskusi') return posts.filter((p) => p.type === 'diskusi');
    return posts;
  }, [posts, tab]);

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    if (postType === 'rukyat') {
      tell(t('Untuk laporan rukyat, gunakan formulir laporan agar koordinat, waktu, dan data pengamatan tercatat lengkap.', 'Use the observation report form for rukyat so coordinates, time, and observation details are recorded.'));
      go('laporan');
      return;
    }
    try {
      const created = await api('/api/posts', 'POST', {
        type: postType,
        title: newPost.slice(0, 60),
        body: newPost,
        city: loc.city,
      });
      setPosts((current) => [created, ...current]);
      setNewPost('');
      tell(t('Postingan berhasil dibuat.', 'Post created.'));
    } catch (e) {
      tell(e.message || 'Gagal membuat postingan.');
    }
  };

  const toggleLike = async (post) => {
    try {
      const updated = await api(`/api/posts/${post.id}/like`, 'POST', { liked: !post.liked });
      setPosts((current) => current.map((item) => item.id === post.id ? updated : item));
    } catch (error) {
      tell(error.message || t('Like gagal disimpan.', 'Unable to save like.'));
    }
  };

  const submitComment = async (event, post) => {
    event.preventDefault();
    const text = commentDraft.trim();
    if (!text || text.length > 1400) return;
    setCommentBusy(true);
    try {
      const updated = await api(`/api/posts/${post.id}/comments`, 'POST', { text });
      setPosts((current) => current.map((item) => item.id === post.id ? updated : item));
      setCommentDraft('');
    } catch (error) {
      tell(error.message || t('Komentar gagal dikirim.', 'Unable to submit comment.'));
    } finally {
      setCommentBusy(false);
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
          <form onSubmit={createPost} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <label style={{ margin: 0, minWidth: 100 }}>{t('Jenis', 'Type')}</label>
              <select value={postType} onChange={(e) => setPostType(e.target.value)}>
                <option value="rukyat">{t('Laporan Rukyat (formulir khusus)', 'Rukyat report (dedicated form)')}</option>
                <option value="diskusi">{t('Diskusi', 'Discussion')}</option>
              </select>
            </div>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={t('Apa yang Anda amati di langit hari ini?', 'What did you observe in the sky today?')}
              rows={3}
              style={{
                width: '100%', padding: 12, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
                color: '#fff', fontFamily: 'inherit',
              }}
            />
            <button type="submit" className="btn primary">
              <Send size={16} /> {t('Bagikan', 'Share')}
            </button>
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
                <button className="btn icon" onClick={() => toggleLike(p)} aria-pressed={Boolean(p.liked)}>
                  <CheckCircle2 size={16} /> {p.likes || 0}
                </button>
                <button className="btn icon" onClick={() => setExpandedPostId((current) => current === p.id ? null : p.id)} aria-expanded={expandedPostId === p.id}>
                  <MessageCircle size={16} /> {p.comments?.length || 0}
                </button>
                <button className="btn icon" onClick={() => setExpandedPostId((current) => current === p.id ? null : p.id)} aria-label={t('Lihat diskusi', 'View discussion')}>
                  <ChevronRight size={14} />
                </button>
              </div>
              {expandedPostId === p.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {(p.comments || []).map((comment) => (
                      <div key={comment.id} style={{ fontSize: 12, padding: 8, background: 'var(--surface2)', borderRadius: 8 }}>
                        <b>{comment.author}</b>
                        <div>{comment.text}</div>
                      </div>
                    ))}
                    {(!p.comments || p.comments.length === 0) && (
                      <p style={{ color: '#8fa3b8', fontSize: 12 }}>{t('Belum ada komentar.', 'No comments yet.')}</p>
                    )}
                  </div>
                  <form onSubmit={(event) => submitComment(event, p)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={1400} rows={2} placeholder={t('Tulis komentar…', 'Write a comment…')} required />
                    <button className="btn secondary" type="submit" disabled={commentBusy || !commentDraft.trim()}>
                      {commentBusy ? t('Mengirim…', 'Sending…') : t('Kirim komentar', 'Post comment')}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
