import React,{useEffect,useState} from 'react';
import {usePFI} from '../state.jsx';
import {api} from '../lib/api.js';
import {Building2,FileText,Send,RefreshCw} from 'lucide-react';

const TYPES=[
 ['pesantren_madrasah','Pesantren / madrasah'],
 ['organisasi_kemasyarakatan','Organisasi kemasyarakatan'],
 ['perguruan_tinggi','Perguruan tinggi'],
 ['observatorium_komunitas','Observatorium / komunitas astronomi'],
 ['lembaga_pemerintah','Lembaga pemerintah'],
 ['lainnya','Lainnya'],
];
const EMPTY={institution:'',type:'pesantren_madrasah',region:'',representative:'',position:'',contact:'',website:'',purpose:''};

export default function AjukanLembaga(){
 const {data,t,tell}=usePFI();
 const [form,setForm]=useState(EMPTY);
 const [application,setApplication]=useState(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const load=async()=>{
  setLoading(true);setError('');
  try{
   const result=await api('/api/institution-applications');
   const item=result.application||null;
   setApplication(item);
   if(item?.status==='revision')setForm({
    institution:item.institution_name||'',type:item.institution_type||EMPTY.type,
    region:item.region||'',representative:item.representative_name||'',
    position:item.representative_position||'',contact:item.official_contact||'',
    website:item.website||'',purpose:item.purpose||''
   });
  }catch(e){setError(e.message||t('Gagal memuat status pengajuan.','Unable to load application status.'));}
  finally{setLoading(false);}
 };
 useEffect(()=>{if(data.account)load();else setLoading(false);},[data.account?.id]);
 const submit=async(e)=>{
  e.preventDefault();setBusy(true);
  try{
   await api('/api/institution-applications','POST',form);
   tell(t('Pengajuan lembaga berhasil dikirim.','Institution application submitted.'));
   await load();
  }catch(e){tell(e.message||t('Pengajuan gagal dikirim.','Unable to submit application.'));}
  finally{setBusy(false);}
 };
 const field=(key,label,max=160,required=true)=> <label className="field" key={key}><span>{label}{required?' *':''}</span><input required={required} maxLength={max} value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))}/></label>;
 if(!data.account)return <div className="page-wrap"><section className="card"><div className="card-body"><h2>{t('Masuk untuk mengajukan kemitraan','Sign in to apply for partnership')}</h2><p>{t('Pengajuan lembaga hanya dapat dikirim melalui akun PFI.','Institution applications require a PFI account.')}</p></div></section></div>;
 return <div className="page-wrap pfi-policy-page">
  <header className="policy-hero"><div className="policy-hero-icon"><Building2 size={23}/></div><div className="eyebrow"><i/> {t('KEMITRAAN PFI','PFI PARTNERSHIP')}</div><h1>{t('Pengajuan Lembaga Mitra','Partner Institution Application')}</h1><p>{t('Ajukan kerja sama resmi antara lembaga Anda dan Platform Falak Indonesia. Baca Pedoman Lembaga Mitra sebelum mengirim.','Apply for an official partnership between your institution and PFI. Read the Partner Institution Guidelines before submitting.')}</p><a className="btn secondary" href="/pedoman-lembaga"><FileText size={16}/>{t('Baca Pedoman Lembaga','Read Institution Guidelines')}</a></header>
  {loading?<section className="card"><div className="card-body">{t('Memuat status…','Loading status…')}</div></section>:null}
  {error?<section className="policy-boundary"><p>{error}</p><button className="btn secondary" onClick={load}><RefreshCw size={15}/>{t('Coba lagi','Try again')}</button></section>:null}
  {!loading&&application&&application.status!=='revision'&&<section className="card"><div className="card-body"><b>{t('Status pengajuan: ','Application status: ')}{application.status==='pending'?t('Menunggu pemeriksaan','Pending review'):application.status==='approved'?t('Disetujui','Approved'):t('Ditolak','Rejected')}</b>{application.review_note&&<p>{t('Catatan tim validasi: ','Validation team note: ')}{application.review_note}</p>}<p>{t('Anda dapat melihat status ini kembali dari halaman pengajuan lembaga.','You can return to this page to check the application status.')}</p></div></section>}
  {!loading&&(!application||application.status==='revision')&&<form className="card" onSubmit={submit}><div className="card-header"><h2>{application?.status==='revision'?t('Perbaiki pengajuan','Revise application'):t('Data lembaga','Institution details')}</h2></div><div className="card-body" style={{display:'grid',gap:12}}>
   {application?.review_note&&<div className="policy-boundary"><b>{t('Catatan perbaikan','Revision note')}</b><p>{application.review_note}</p></div>}
   {field('institution',t('Nama resmi lembaga'),160)}
   <label className="field"><span>{t('Jenis lembaga','Institution type')} *</span><select required value={form.type} onChange={e=>setForm(v=>({...v,type:e.target.value}))}>{TYPES.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
   {field('region',t('Wilayah / alamat lembaga'),160)}
   {field('representative',t('Nama penanggung jawab / perwakilan'),120)}
   {field('position',t('Jabatan perwakilan di lembaga'),120)}
   {field('contact',t('Kontak resmi (email / telepon)'),160)}
   {field('website',t('Situs resmi (opsional)'),240,false)}
   <label className="field"><span>{t('Tujuan kemitraan (opsional)','Partnership purpose (optional)')}</span><textarea rows={4} maxLength={1000} value={form.purpose} onChange={e=>setForm(v=>({...v,purpose:e.target.value}))}/></label>
   <p className="institution-prep-disclaimer">{t('Pastikan Anda berwenang mewakili lembaga. Pengajuan akan diperiksa oleh Tim Validasi PFI. Persetujuan tidak otomatis memberikan hak administrator atau menetapkan koordinator.','Ensure you are authorized to represent the institution. The PFI Validation Team will review the application. Approval does not grant administrator privileges or automatically appoint a coordinator.')}</p>
   <button className="btn primary full" disabled={busy} type="submit"><Send size={16}/>{busy?t('Mengirim…','Submitting…'):t('Kirim Pengajuan','Submit Application')}</button>
  </div></form>}
 </div>;
}
