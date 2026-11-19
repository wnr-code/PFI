/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import React, { useMemo, useState, useEffect } from 'react';
import { usePFI, go } from '../state.jsx';
import { api, offlineGet } from '../lib/api.js';
import { download } from '../lib/export.js';
import { FileDown, FileText, Share2, ChevronRight, MapPin, CheckCircle2, Clock3, Database } from 'lucide-react';

export default function Laporan() {
  const { t, lang, tell } = usePFI();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let cancelled = false; (async () => { try { const result = await api('/api/posts'); if (!cancelled) setPosts(result); } catch { const cached = await offlineGet('posts'); if (!cancelled) setPosts(cached || []); } finally { if (!cancelled) setLoading(false); } })(); return () => { cancelled = true; }; }, []);
  const reports = useMemo(() => posts.filter((post) => post.type === 'rukyat'), [posts]);
  const verified = reports.filter((post) => post.status === 'verified').length;
  const formatDate = (date) => { try { return new Date(date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return '—'; } };
  const exportData = (format) => {
    if (!reports.length) return tell(t('Belum ada data untuk diekspor.', 'There is no data to export.'));
    const rows = reports.map(({ id, date, author, city, body, status }) => ({ id, date, author, city, body, status }));
    if (format === 'json') download(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }), 'PFI-laporan-rukyat.json');
    else { const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`; const csv = [['ID','Tanggal','Pengamat','Kota','Status','Catatan'], ...rows.map((row) => [row.id,row.date,row.author,row.city,row.status,row.body])].map((row) => row.map(quote).join(',')).join('\r\n'); download(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }), 'PFI-laporan-rukyat.csv'); }
    tell(t('Data berhasil diekspor.', 'Data exported successfully.'));
  };
  const shareData = async () => { const text = `${t('Laporan rukyat PFI', 'PFI observation reports')}: ${reports.length} · ${t('terverifikasi', 'verified')}: ${verified}`; try { if (navigator.share) await navigator.share({ title: 'PFI', text }); else { await navigator.clipboard?.writeText(text); tell(t('Ringkasan disalin.', 'Summary copied.')); } } catch { /* user cancelled */ } };

  return <div className="page-wrap page-enter report-centre-page">
    <header className="science-page-head page-head"><div><div className="eyebrow"><i />{t('ARSIP OBSERVASI', 'OBSERVATION ARCHIVE')}</div><h1>{t('Pusat laporan', 'Report centre')}</h1><p>{t('Arsip laporan rukyat dari komunitas dengan status peninjauan yang transparan.', 'An archive of community observation reports with transparent review status.')}</p></div><span className="archive-count"><Database size={16}/><b>{reports.length}</b>{t('laporan', 'reports')}</span></header>
    <section className="report-summary"><div><FileText size={18}/><span><small>{t('Total laporan', 'Total reports')}</small><b>{reports.length}</b></span></div><div><CheckCircle2 size={18}/><span><small>{t('Terverifikasi', 'Verified')}</small><b>{verified}</b></span></div><div><Clock3 size={18}/><span><small>{t('Dalam tinjauan', 'Under review')}</small><b>{reports.length - verified}</b></span></div></section>
    <section className="report-actions" aria-label={t('Ekspor laporan', 'Report export')}><div><b>{t('Ekspor data terbuka', 'Export open data')}</b><small>{t('Unduh data asli dalam format yang mudah diolah.', 'Download source data in interoperable formats.')}</small></div><button className="btn secondary" onClick={() => exportData('csv')}><FileDown size={16}/>CSV</button><button className="btn secondary" onClick={() => exportData('json')}><FileText size={16}/>JSON</button><button className="btn secondary" onClick={shareData}><Share2 size={16}/>{t('Bagikan', 'Share')}</button></section>
    <section className="card report-archive"><div className="card-header"><div><span className="section-kicker">{t('DATA LAPANGAN', 'FIELD DATA')}</span><h2>{t('Riwayat pengamatan', 'Observation history')}</h2></div></div>
      {loading ? <div className="report-empty"><span className="loading-orbit"/><b>{t('Memuat laporan…', 'Loading reports…')}</b></div> : reports.length === 0 ? <div className="report-empty"><FileText size={32}/><b>{t('Belum ada laporan', 'No reports yet')}</b><span>{t('Laporan rukyat yang dikirim akan tampil di sini.', 'Submitted observation reports will appear here.')}</span></div> : <div className="archive-list">{reports.map((post) => <article className="archive-row" key={post.id}><div className="avatar">{post.author?.split(' ').map((word) => word[0]).join('').slice(0,2) ?? '?'}</div><div className="archive-main"><div><b>{post.author || t('Pengamat', 'Observer')}</b><span className={`pill ${post.status === 'verified' ? 'verified' : 'pending'}`}>{post.status === 'verified' ? t('Terverifikasi', 'Verified') : t('Ditinjau', 'In review')}</span></div><p>{post.body}</p><small><MapPin size={12}/>{post.city || '—'}<i/> {formatDate(post.date)}</small></div><button className="archive-open" onClick={() => go(`komunitas/${post.id}`)} aria-label={t('Buka laporan', 'Open report')}><ChevronRight size={18}/></button></article>)}</div>}
    </section>
  </div>;
}
