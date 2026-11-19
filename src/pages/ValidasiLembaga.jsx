import React,{useCallback,useEffect,useState} from 'react';
import {usePFI} from '../state.jsx';
import {api} from '../lib/api.js';
import {ShieldCheck,RefreshCw,Building2,MapPin,UserRound,Mail,Globe,ClipboardList} from 'lucide-react';

const TYPE_LABELS={
 pesantren_madrasah:'Pesantren / madrasah',
 organisasi_kemasyarakatan:'Organisasi kemasyarakatan',
 perguruan_tinggi:'Perguruan tinggi',
 observatorium_komunitas:'Observatorium / komunitas astronomi',
 lembaga_pemerintah:'Lembaga pemerintah',
 lainnya:'Lainnya',
};

export default function ValidasiLembaga(){
 const {data,t,tell}=usePFI();
 const [items,setItems]=useState([]);
 const [notes,setNotes]=useState({});
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState('');
 const [error,setError]=useState('');
 const allowed=['reviewer','admin'].includes(data.account?.role);
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{const result=await api('/api/institution-applications');setItems(result.applications||[]);}
  catch(e){setError(e.message||t('Gagal memuat antrean pengajuan.','Unable to load application queue.'));}
  finally{setLoading(false);}
 },[t]);
 useEffect(()=>{if(allowed)load();else setLoading(false);},[allowed,load]);
 const decide=async(item,decision)=>{
  const note=(notes[item.id]||'').trim();
  if(note.length<8){tell(t('Catatan pemeriksaan minimal 8 karakter.','Review note must be at least 8 characters.'));return;}
  setBusy(item.id);
  try{
   await api('/api/institution-applications/'+encodeURIComponent(item.id)+'/review','POST',{decision,note});
   tell(t('Keputusan pemeriksaan berhasil disimpan.','Review decision saved.'));
   setItems(current=>current.filter(row=>row.id!==item.id));
  }catch(e){tell(e.message||t('Keputusan gagal disimpan.','Unable to save decision.'));}
  finally{setBusy('');}
 };
 if(!allowed)return <div className="page-wrap"><section className="card"><div className="card-body"><h2>{t('Akses terbatas','Restricted access')}</h2><p>{t('Halaman ini hanya untuk anggota Tim Validasi PFI yang memiliki peran reviewer atau administrator platform.','This page is only for PFI Validation Team members with reviewer or platform administrator access.')}</p></div></section></div>;
 return <div className="page-wrap pfi-policy-page">
  <header className="policy-hero"><div className="policy-hero-icon"><ShieldCheck size={23}/></div><div className="eyebrow"><i/>{t('DASHBOARD INTERNAL','INTERNAL DASHBOARD')}</div><h1>{t('Validasi Lembaga Mitra','Partner Institution Validation')}</h1><p>{t('Periksa identitas lembaga, kecocokan perwakilan, dan informasi pengajuan sebelum menetapkan keputusan.','Review institution identity, representative authority, and application details before making a decision.')}</p></header>
  <div className="policy-boundary"><ClipboardList size={18}/><p>{t('Pemeriksaan ini terpisah dari moderasi laporan rukyat dan verifikasi akun pengamat. Jangan menyetujui pengajuan sendiri atau kasus yang memiliki konflik kepentingan.','This review is separate from rukyat report moderation and observer account verification. Do not approve your own application or a case involving a conflict of interest.')}</p></div>
  <div className="validation-toolbar"><b>{t('Antrean pengajuan','Application queue')} · {items.length}</b><button className="btn secondary" onClick={load} disabled={loading}><RefreshCw size={15}/>{t('Muat ulang','Refresh')}</button></div>
  {loading&&<div className="card"><div className="card-body">{t('Memuat pengajuan…','Loading applications…')}</div></div>}
  {error&&<div className="policy-boundary"><p>{error}</p></div>}
  {!loading&&!error&&!items.length&&<div className="card"><div className="card-body"><b>{t('Belum ada pengajuan yang menunggu.','No applications are waiting for review.')}</b><p>{t('Pengajuan baru atau yang telah dikirim ulang akan muncul di sini.','New or resubmitted applications will appear here.')}</p></div></div>}
  <div className="validation-list">{items.map(item=><article className="card validation-card" key={item.id}>
   <div className="validation-card-head"><div><div className="eyebrow">{t('PENGAJUAN LEMBAGA','INSTITUTION APPLICATION')}</div><h2>{item.institution_name}</h2></div><span className="pill pending">{item.status==='revision'?t('Dikirim ulang','Resubmitted'):t('Menunggu','Pending')}</span></div>
   <div className="validation-details">
    <p><Building2 size={15}/><span>{TYPE_LABELS[item.institution_type]||item.institution_type}</span></p>
    <p><MapPin size={15}/><span>{item.region}</span></p>
    <p><UserRound size={15}/><span>{item.representative_name} · {item.representative_position}</span></p>
    <p><Mail size={15}/><span>{item.official_contact}</span></p>
    {item.applicant_name&&<p><UserRound size={15}/><span>{t('Pengaju akun: ','Applicant account: ')}{item.applicant_name} ({item.applicant_email})</span></p>}
    {item.website&&<p><Globe size={15}/><a href={item.website} target="_blank" rel="noreferrer">{item.website}</a></p>}
   </div>
   {item.purpose&&<div className="validation-purpose"><b>{t('Tujuan kemitraan','Partnership purpose')}</b><p>{item.purpose}</p></div>}
   <label className="field"><span>{t('Catatan pemeriksaan (wajib, minimal 8 karakter)','Review note (required, at least 8 characters)')}</span><textarea rows={3} maxLength={1000} value={notes[item.id]||''} onChange={e=>setNotes(current=>({...current,[item.id]:e.target.value}))} placeholder={t('Tuliskan dasar keputusan atau dokumen yang perlu dilengkapi…','Explain the decision or identify evidence that needs clarification…')}/></label>
   <div className="validation-actions">
    <button className="btn primary" disabled={busy===item.id} onClick={()=>decide(item,'approved')}>{t('Setujui lembaga','Approve institution')}</button>
    <button className="btn secondary" disabled={busy===item.id} onClick={()=>decide(item,'revision')}>{t('Minta perbaikan','Request revision')}</button>
    <button className="btn danger" disabled={busy===item.id} onClick={()=>decide(item,'rejected')}>{t('Tolak pengajuan','Reject application')}</button>
   </div>
   <p className="institution-prep-disclaimer">{t('Persetujuan hanya mencatat lembaga sebagai mitra PFI. Penunjukan koordinator lembaga merupakan tahap terpisah dan tidak mengubah role akun.','Approval registers the institution as a PFI partner only. Appointing an institution coordinator is a separate step and does not change account roles.')}</p>
  </article>)}</div>
 </div>;
}
