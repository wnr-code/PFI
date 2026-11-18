import React, { useMemo, useState, useEffect } from 'react';
import { usePFI, go } from '../state.jsx';
import { api, offlineGet } from '../lib/api.js';
import { FileDown, FileText, Share2, ChevronRight } from 'lucide-react';

export default function Laporan() {
  const { data, t, lang, tell } = usePFI();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api('/api/posts');
        setPosts(p);
      } catch (e) {
        const cached = await offlineGet('posts');
        setPosts(cached || []);
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const rukyatPosts = useMemo(() => posts.filter((p) => p.type === 'rukyat'), [posts]);

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch (_) { return '-'; }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#747f8e' }}>
        {t('Memuat…', 'Loading…')}
      </div>
    );
  }

  if (ruyatPosts.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#747f8e' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>{t('Belum ada laporan', 'No reports yet')}</div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div className="eyebrow"><i /> {t('PUSAT LAPORAN', 'REPORT CENTRE')}</div>
        <h1>{t('Riwayat Pengamatan', 'Observation History')}</h1>
        <p>{t('Lihat riwayat laporan rukyat yang telah disimpan.', 'View saved rukyat report history.')}</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="btn secondary full" onClick={() => tell(t('Unduh PDF (demo).', 'Download PDF (demo).'))}>
          <FileDown size={16} /> {t('Unduh PDF', 'Download PDF')}
        </button>
        <button className="btn secondary full" onClick={() => tell(t('Unduh PNG (demo).', 'Download PNG (demo).'))}>
          <FileText size={16} /> {t('Unduh PNG', 'Download PNG')}
        </button>
        <button className="btn secondary full" onClick={() => {
          const txt = posts.map((p) => `${p.date} - ${p.author}: ${p.body}`).join('\n');
          navigator.clipboard?.writeText(txt).then(() => tell(t('Disalin.', 'Copied.')));
        }}>
          <Share2 size={16} /> {t('Bagikan Data', 'Share Data')}
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ruyatPosts.map((p) => (
            <div key={p.id} className="post-card">
              <div className="post-header">
                <div className="avatar">{p.author?.split(' ').map((w) => w[0]).join('') ?? '?'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13, display: 'block' }}>{p.author}</b>
                  <div style={{ fontSize: 11, color: '#8fa3b8', display: 'flex', gap: 8 }}>
                    <span>{p.city}</span>
                    <span>{formatDate(p.date)}</span>
                  </div>
                </div>
              </div>
              <div className="post-body">{p.body}</div>
              <div className="post-meta">
                <span>{p.type === 'rukyat' ? t('Rukyat', 'Crescent Watch') : t('Diskusi', 'Discussion')}</span>
                <span>{p.status === 'verified' ? t('Terverifikasi', 'Verified') : t('Pending', 'Pending')}</span>
              </div>
              <div className="post-actions">
                <button className="btn icon" onClick={() => go(`komunitas/${p.id}`)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
