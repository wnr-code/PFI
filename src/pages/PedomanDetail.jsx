import React, { useState } from 'react';
import { usePFI } from '../state.jsx';
import { api } from '../lib/api.js';
import { ArrowLeft, BookOpen, CheckCircle2, Info, ShieldCheck, ClipboardCopy, ClipboardCheck, Building2 } from 'lucide-react';

const GUIDES = {
 membership: {
  title:'Pedoman Keanggotaan',en:'Membership Guidelines',intro:'Ketentuan dasar bagi individu yang bergabung dalam ruang kolaborasi Platform Falak Indonesia.',introEn:'Basic guidance for individuals joining the Platform Falak Indonesia collaboration space.',
  blocks:[
   ['Siapa yang dapat bergabung','Keanggotaan terbuka bagi pengamat mandiri, pelajar, pendidik, praktisi ilmu falak, komunitas, dan masyarakat yang berminat mempelajari astronomi Islam serta pengamatan hilal. Pendaftaran tidak mensyaratkan seseorang berasal dari organisasi tertentu.','Who may join','Membership is open to independent observers, students, educators, falak practitioners, communities, and anyone interested in Islamic astronomy and crescent observation. Membership is not limited to a particular organization.'],
   ['Data akun','Gunakan nama dan alamat kontak yang benar. Lengkapi profil seperlunya. Jangan memasukkan data pribadi orang lain tanpa persetujuan dan jangan membagikan kata sandi atau kode OTP kepada siapa pun.','Account information','Use an accurate name and contact details. Complete only the information needed. Do not submit another person’s personal data without consent or share passwords or one-time codes.'],
   ['Peran dalam aplikasi','Peran Anggota/Pengamat, Tim Validasi Data, dan Administrator Platform merupakan pembagian hak akses aplikasi. Peran tersebut tidak otomatis memberikan gelar akademik, otoritas keagamaan, jabatan organisasi, atau kewenangan resmi.','Application roles','Member/Observer, Data Validation Team, and Platform Administrator are application access roles. They do not automatically confer academic titles, religious authority, organizational office, or official powers.'],
   ['Hak dan tanggung jawab','Anggota dapat mengikuti ruang diskusi dan fitur yang tersedia, menyampaikan data secara jujur, menghormati anggota lain, serta mengikuti kebijakan privasi dan moderasi PFI.','Rights and responsibilities','Members may participate in available discussions and features, provide truthful data, respect others, and follow PFI privacy and moderation policies.']
  ]
 },
 institution:{
  title:'Pedoman Lembaga Mitra',en:'Partner Institution Guidelines',intro:'Panduan untuk pesantren, organisasi kemasyarakatan, perguruan tinggi, observatorium, komunitas, dan lembaga lain yang ingin berkolaborasi.',introEn:'Guidance for pesantren, civil organizations, universities, observatories, communities, and other prospective partners.',
  blocks:[
   ['Kedudukan lembaga mitra','Lembaga mitra tetap berdiri mandiri dengan nama, kepengurusan, aturan, dan kewenangannya sendiri. Kemitraan dengan PFI tidak otomatis menjadikan lembaga sebagai pengurus PFI atau menyatakan dukungan resmi dari seluruh anggota lembaga.','Partner institution status','A partner institution remains independent, retaining its own name, leadership, rules, and authority. Partnership does not automatically make it part of PFI management or imply endorsement by all of its members.'],
   ['Informasi dan bukti pendukung','Siapkan nama resmi lembaga, jenis lembaga, alamat atau wilayah kegiatan, kontak resmi, serta dokumen pengenal yang wajar jika diminta. Dokumen dapat berupa surat keterangan, profil resmi, atau bukti lain yang dapat diperiksa. Jangan mengunggah dokumen rahasia yang tidak diperlukan.','Institution details and evidence','Prepare the institution’s official name, type, location or activity area, official contact, and reasonable identifying documents if requested. Evidence may include an introduction letter, official profile, or other verifiable material. Do not upload unnecessary confidential documents.'],
   ['Penunjukan koordinator','Koordinator Lembaga adalah orang yang ditunjuk atau disetujui oleh lembaga untuk menjadi penghubung. Koordinator bukan otomatis ketua PFI, administrator platform, atau pemegang kewenangan verifikasi seluruh laporan.','Appointing a coordinator','An Institution Coordinator is appointed or endorsed by the institution as its liaison. The coordinator is not automatically PFI chair, platform administrator, or authorized to verify every report.'],
   ['Pemeriksaan dan perubahan data','Pengajuan lembaga dapat diminta dilengkapi atau diklarifikasi. Perubahan koordinator, kontak, atau status kemitraan perlu disampaikan melalui mekanisme resmi yang disediakan PFI. Selama belum disetujui, statusnya tetap menunggu pemeriksaan.','Review and updates','Institution applications may require clarification or additional evidence. Coordinator, contact, or partnership changes should be submitted through PFI’s designated process. Pending applications remain under review.']
  ]
 },
 verification:{
  title:'Pedoman Verifikasi Pengamat',en:'Observer Verification Guidelines',intro:'Verifikasi akun membantu PFI menilai kelengkapan profil dan keterlacakan identitas pengamat. Verifikasi bukan penetapan kompetensi ahli falak.',introEn:'Account verification helps PFI assess profile completeness and observer traceability. It is not a certification of falak expertise.',
  blocks:[
   ['Siapa yang mengajukan','Anggota yang ingin mengajukan status pengamat terverifikasi dapat mengisi formulir verifikasi pada Profil. Pengajuan dilakukan atas akun sendiri dan data harus sesuai keadaan sebenarnya.','Who may apply','Members seeking observer verification may use the verification form in Profile. Apply for your own account and ensure all information is accurate.'],
   ['Informasi yang perlu disiapkan','Jelaskan pengalaman pengamatan, lokasi atau kegiatan yang pernah diikuti, komunitas atau lembaga terkait (jika ada), serta kontak rujukan yang relevan. Sertakan bukti pendukung hanya melalui fitur unggah resmi jika tersedia atau ketika diminta petugas.','Information to prepare','Describe observation experience, locations or activities attended, related community or institution (if any), and relevant references. Submit supporting evidence only through an official upload feature if available or when requested by a reviewer.'],
   ['Proses peninjauan','Petugas yang ditugaskan memeriksa konsistensi informasi dan dapat meminta klarifikasi. Hasil pemeriksaan dapat berupa diterima, perlu dilengkapi/revisi, atau ditolak disertai alasan. Hindari mengirim pengajuan berulang untuk mempercepat antrean.','Review process','An assigned reviewer checks consistency and may request clarification. Outcomes may be approved, returned for completion/revision, or declined with a reason. Avoid repeated submissions to bypass the queue.'],
   ['Batas verifikasi','Status terverifikasi pada akun hanya menunjukkan pemeriksaan internal PFI sesuai prosedur. Status ini tidak otomatis membuktikan seseorang ahli falak, tidak memberi jabatan lembaga, dan bukan pengesahan resmi pemerintah atau keputusan sidang isbat.','Limits of verification','An account’s verified status only indicates an internal PFI review. It does not certify falak expertise, confer an institutional position, or constitute government recognition or an isbat decision.']
  ]
 },
 expertise:{
  title:'Pedoman Verifikasi Keahlian Falak',en:'Falak Expertise Review Guidelines',intro:'Penilaian keahlian falak harus melihat bukti kompetensi dan pengalaman secara proporsional, bukan hanya gelar atau label.',introEn:'Falak expertise review should consider evidence of competence and experience proportionately, not titles or labels alone.',
  blocks:[
   ['Jalur keilmuan beragam','Latar belakang dapat berasal dari pendidikan formal, pesantren, talaqqi atau bimbingan guru, pembelajaran mandiri yang teruji, praktik hisab-rukyat, penelitian, maupun pengalaman observasi. Tidak semua jalur memiliki bentuk dokumen yang sama.','Multiple learning pathways','Backgrounds may include formal education, pesantren, talaqqi or mentorship, demonstrated independent study, hisab-rukyat practice, research, or observation experience. Not every pathway produces the same documents.'],
   ['Bukti yang dapat dipertimbangkan','Contohnya ijazah atau sertifikat yang relevan, daftar karya atau penelitian, catatan kegiatan pengamatan, pengalaman mengajar, rekomendasi guru/pembimbing, atau portofolio perhitungan dan observasi. Berikan konteks waktu, peran, dan sumber bukti.','Evidence that may be considered','Examples include relevant diplomas or certificates, publications or research, observation logs, teaching experience, mentor recommendations, or a portfolio of calculations and observations. Provide context, dates, role, and evidence sources.'],
   ['Penilaian yang adil','Penilai mempertimbangkan relevansi, keaslian, konsistensi, kedalaman pengalaman, serta ruang lingkup kompetensi. Gelar kiai, ustaz, akademisi, atau sebutan lain tidak boleh disamaratakan sebagai satu standar tunggal dan tidak boleh diklaim tanpa dasar.','Fair assessment','Reviewers consider relevance, authenticity, consistency, depth of experience, and scope of competence. Titles such as kiai, ustaz, or academic must not be reduced to one standard or claimed without basis.'],
   ['Hasil dan batas pengakuan','Jika kelak tersedia fitur penilaian keahlian, hasilnya harus menyebut ruang lingkup yang dinilai dan dasar pemeriksaannya. Pengakuan internal PFI tidak menggantikan ijazah, otoritas lembaga pendidikan, atau pengesahan instansi berwenang.','Outcome and limits','If an expertise assessment feature becomes available, its result should state the scope assessed and review basis. PFI’s internal recognition does not replace academic qualifications, educational authority, or recognition by competent institutions.']
  ]
 },
 rukyat:{
  title:'Pedoman Laporan Rukyat',en:'Rukyat Report Guidelines',intro:'Laporan yang baik memisahkan fakta lapangan, hasil pengamatan, dan interpretasi pengamat.',introEn:'A good report separates field facts, observation results, and the observer’s interpretation.',
  blocks:[
   ['Waktu dan lokasi','Catat tanggal, waktu mulai dan selesai, zona waktu, nama lokasi, koordinat, serta akurasi GPS bila tersedia. Pastikan koordinat menunjukkan tempat pengamatan, bukan lokasi rumah atau lokasi lain yang tidak relevan.','Time and location','Record date, start and end time, time zone, site name, coordinates, and GPS accuracy when available. Ensure coordinates identify the observation site, not an unrelated location.'],
   ['Kondisi lapangan','Catat cuaca, awan, transparansi atmosfer, keadaan ufuk, penghalang, dan perubahan kondisi selama pengamatan. Tuliskan jika kondisi membuat pengamatan tidak dapat dilakukan secara optimal.','Field conditions','Record weather, clouds, atmospheric transparency, horizon conditions, obstructions, and changes during observation. Note when conditions limited the observation.'],
   ['Instrumen dan metode','Sebutkan alat yang digunakan, spesifikasi penting jika diketahui, pembesaran atau pengaturan relevan, metode pencarian, serta apakah pengamatan dilakukan dengan mata telanjang atau alat bantu.','Instruments and method','Name the equipment, relevant specifications if known, magnification or settings, search method, and whether observation was naked-eye or assisted.'],
   ['Hasil dan dokumentasi','Pisahkan apa yang benar-benar terlihat dari dugaan atau analisis. Lampirkan foto asli bila tersedia dan jelaskan waktu pengambilan serta perangkatnya. Jangan memodifikasi foto untuk membuat objek tampak sebagai hilal.','Findings and documentation','Separate what was actually seen from assumptions or analysis. Attach original photos when available and describe capture time and device. Do not manipulate photos to make an object appear as the crescent.']
  ]
 },
 ethics:{
  title:'Etika dan Kebijakan Komunitas',en:'Community Code of Conduct',intro:'PFI menjadi ruang kolaborasi lintas latar belakang. Perbedaan metode dan pandangan perlu disikapi secara ilmiah dan santun.',introEn:'PFI is a cross-background collaboration space. Differences in methods and views should be handled respectfully and constructively.',
  blocks:[
   ['Integritas informasi','Jangan memalsukan identitas, afiliasi, koordinat, waktu, foto, atau hasil pengamatan. Koreksi kesalahan secara terbuka melalui mekanisme yang tersedia.','Information integrity','Do not falsify identity, affiliation, coordinates, time, photos, or observation results. Correct mistakes transparently through available processes.'],
   ['Menghormati perbedaan','Hormati perbedaan metode hisab, rukyat, tradisi keilmuan, dan pendapat. Kritik diarahkan pada data dan argumen, bukan serangan pribadi atau kelompok.','Respect differences','Respect differences in hisab, rukyat, scholarly traditions, and opinions. Critique data and arguments, not individuals or groups.'],
   ['Privasi dan keselamatan','Jangan menyebarkan data kontak, dokumen, foto pribadi, atau lokasi sensitif orang lain tanpa izin. Utamakan keselamatan saat pengamatan dan patuhi aturan lokasi.','Privacy and safety','Do not disclose others’ contact details, documents, personal photos, or sensitive locations without permission. Prioritize safety and follow site rules during observations.'],
   ['Konflik kepentingan','Petugas sebaiknya tidak memeriksa pengajuan sendiri atau pengajuan yang memiliki konflik kepentingan. Laporkan hubungan yang relevan kepada pengelola.','Conflicts of interest','Reviewers should not assess their own applications or cases where a conflict of interest exists. Disclose relevant relationships to administrators.']
  ]
 }
};

function InstitutionPrepForm({t,lang,account,tell}){
 const english=lang==='en';
 const empty={institution:'',type:'',region:'',representative:'',position:'',contact:'',website:'',purpose:''};
 const [form,setForm]=useState(empty);
 const [draft,setDraft]=useState('');
 const [copied,setCopied]=useState(false);
 const [application,setApplication]=useState(null);
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [loadError,setLoadError]=useState('');
 const update=(key,value)=>{setForm(current=>({...current,[key]:value}));setCopied(false);};
 useEffect(()=>{
  let active=true;
  if(!account){setApplication(null);setLoadError('');return ()=>{active=false;};}
  setLoading(true);setLoadError('');
  api('/api/institution-applications').then(result=>{
   if(!active)return;
   const item=result.application||null;
   setApplication(item);
   if(item)setForm({
    institution:item.institution_name||'',type:item.institution_type||'',region:item.region||'',
    representative:item.representative_name||'',position:item.representative_position||'',
    contact:item.official_contact||'',website:item.website||'',purpose:item.purpose||''
   });
  }).catch(error=>{if(active)setLoadError(error.message||'Gagal memuat status pengajuan.');})
   .finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[account?.id]);
 const makeDraft=()=>{
  const labels=english
   ? ['Institution name','Institution type','City / region','Representative name','Representative position','Official contact','Website / public profile','Partnership purpose']
   : ['Nama lembaga','Jenis lembaga','Kota / wilayah','Nama perwakilan','Jabatan perwakilan','Kontak resmi','Situs / profil publik','Tujuan kemitraan'];
  const values=[form.institution,form.type,form.region,form.representative,form.position,form.contact,form.website,form.purpose];
  const result='DRAF PERSIAPAN PENGAJUAN KEMITRAAN PFI\\n'+labels.map((label,i)=>label+': '+(values[i].trim()||'-')).join('\\n')+'\\n\\n'+(english?'This is a preparation draft only.':'Ini hanya draf persiapan, belum dikirim ke PFI.');
  setDraft(result);setCopied(false);return result;
 };
 const copyDraft=async()=>{
  const value=draft||makeDraft();
  try{await navigator.clipboard.writeText(value);setCopied(true);}
  catch{setCopied(false);tell(t('Tidak dapat menyalin otomatis. Pilih teks draf lalu salin.','Could not copy automatically. Select the draft text and copy it.'));}
 };
 const submitApplication=async(event)=>{
  event.preventDefault();
  if(!account){tell(t('Masuk ke akun PFI terlebih dahulu untuk mengirim pengajuan.','Sign in to your PFI account before submitting.'));return;}
  setBusy(true);
  try{
   const result=await api('/api/institution-applications','POST',form);
   setApplication({...form,institution_name:form.institution,institution_type:form.type,
    representative_name:form.representative,representative_position:form.position,
    official_contact:form.contact,status:result.status,review_note:''});
   tell(t('Pengajuan lembaga berhasil dikirim dan menunggu Tim Validasi PFI.','Institution application submitted and is awaiting PFI validation.'));
  }catch(error){tell(error.message||t('Pengajuan gagal dikirim.','Application submission failed.'));}
  finally{setBusy(false);}
 };
 const types=[
  ['pesantren_madrasah',t('Pesantren / madrasah','Pesantren / Islamic school')],
  ['organisasi_kemasyarakatan',t('Organisasi kemasyarakatan','Civil / community organization')],
  ['perguruan_tinggi',t('Perguruan tinggi','University / college')],
  ['observatorium_komunitas',t('Observatorium / komunitas astronomi','Observatory / astronomy community')],
  ['lembaga_pemerintah',t('Lembaga pemerintah','Government institution')],
  ['lainnya',t('Lainnya','Other')]
 ];
 const statusLabel={pending:t('Menunggu pemeriksaan','Awaiting review'),revision:t('Perlu perbaikan','Revision requested'),approved:t('Disetujui','Approved'),rejected:t('Tidak disetujui','Not approved')};
 const locked=['pending','approved','rejected'].includes(application?.status);
 const fields=[
  ['institution',t('Nama resmi lembaga *','Official institution name *'),'text',120],
  ['type',t('Jenis lembaga *','Institution type *'),'select',0],
  ['region',t('Kota / wilayah kegiatan *','City / activity region *'),'text',120],
  ['representative',t('Nama perwakilan *','Representative name *'),'text',100],
  ['position',t('Jabatan di lembaga *','Institutional position *'),'text',100],
  ['contact',t('Kontak resmi (email / telepon) *','Official contact (email / phone) *'),'text',120],
  ['website',t('Situs atau profil publik (opsional)','Website or public profile (optional)'),'url',180],
  ['purpose',t('Tujuan dan bidang kerja sama (opsional)','Purpose and proposed collaboration (optional)'),'textarea',500],
 ];
 return <section className="card institution-prep">
  <div className="institution-prep-head"><div className="settings-guide-icon"><Building2 size={20}/></div><div><b>{t('Pengajuan Kemitraan Lembaga','Institution Partnership Application')}</b><p>{t('Ajukan atas nama lembaga dengan persetujuan perwakilan yang berwenang. Pengajuan akan diperiksa oleh Tim Validasi PFI.','Apply on behalf of an institution with authorization from its representative. The PFI Validation Team will review the application.')}</p></div></div>
  {!account&&<div className="policy-boundary"><Info size={17}/><p>{t('Silakan masuk melalui tombol Masuk di bagian atas aplikasi sebelum mengirim pengajuan. Draf persiapan tetap dapat dibuat tanpa masuk.','Please sign in using the button at the top of the app before submitting. You can still prepare a draft without signing in.')}</p></div>}
  {loading&&<p className="institution-prep-disclaimer">{t('Memuat status pengajuan…','Loading application status…')}</p>}
  {loadError&&<p className="institution-prep-disclaimer">{t('Status pengajuan belum dapat dimuat: ','Unable to load application status: ')}{loadError}</p>}
  {application&&<div className="institution-application-status">
   <b>{t('Status pengajuan: ','Application status: ')}{statusLabel[application.status]||application.status}</b>
   {application.review_note&&<p>{t('Catatan Tim Validasi: ','Validation Team note: ')}{application.review_note}</p>}
   {application.status==='pending'&&<p>{t('Pengajuan sudah tercatat. Tidak perlu mengirim ulang selama menunggu pemeriksaan.','Your application is recorded. Please do not resubmit while it is under review.')}</p>}
   {application.status==='approved'&&<p>{t('Lembaga telah tercatat sebagai mitra. Penunjukan koordinator dilakukan melalui proses terpisah.','The institution is registered as a partner. Coordinator appointment is handled separately.')}</p>}
   {application.status==='rejected'&&<p>{t('Pengajuan ini ditutup. Hubungi pengelola PFI untuk klarifikasi sebelum mengajukan kembali.','This application is closed. Contact PFI administrators for clarification before applying again.')}</p>}
  </div>}
  <form onSubmit={submitApplication} className="institution-prep-grid">
   {fields.map(([key,label,type,max])=><label className={'field institution-field '+(type==='textarea'?'institution-field-wide':'')} key={key}><span>{label}</span>{type==='select'?<select value={form[key]} onChange={event=>update(key,event.target.value)} required disabled={locked}><option value="">{t('Pilih jenis lembaga','Choose institution type')}</option>{types.map(([value,name])=><option key={value} value={value}>{name}</option>)}</select>:type==='textarea'?<textarea value={form[key]} maxLength={max} rows={3} onChange={event=>update(key,event.target.value)} placeholder={t('Jelaskan tujuan kerja sama secara singkat…','Briefly describe the proposed collaboration…')} disabled={locked}/>:<input type={type} value={form[key]} maxLength={max} required={['institution','region','representative','position','contact'].includes(key)} onChange={event=>update(key,event.target.value)} disabled={locked}/>}</label>)}
   <div className="institution-prep-actions">
    <button className="btn secondary" type="button" onClick={makeDraft}>{t('Buat draf untuk disalin','Prepare copyable draft')}</button>
    {account&&<button className="btn primary" type="submit" disabled={busy||loading||locked}>{busy?t('Mengirim…','Submitting…'):application?.status==='revision'?t('Kirim perbaikan','Resubmit revisions'):t('Kirim pengajuan resmi','Submit official application')}</button>}
   </div>
  </form>
  {draft&&<div className="institution-draft-result"><label className="field"><span>{t('Draf untuk disalin','Draft to copy')}</span><textarea readOnly rows={9} value={draft} onFocus={event=>event.target.select()}/></label><button className="btn secondary" type="button" onClick={copyDraft}>{copied?<ClipboardCheck size={16}/>:<ClipboardCopy size={16}/>} {copied?t('Tersalin','Copied'):t('Salin draf','Copy draft')}</button></div>}
  <p className="institution-prep-disclaimer"><Info size={15}/>{t('Jangan mengirim dokumen rahasia atau nomor identitas yang tidak diperlukan. Persetujuan kemitraan tidak otomatis menunjuk koordinator atau memberikan peran administrator.','Do not submit confidential documents or unnecessary identity numbers. Partnership approval does not automatically appoint a coordinator or grant administrator access.')}</p>
 </section>;
}
function PedomanPage({kind}){
 const {t,lang,data,tell}=usePFI(); const g=GUIDES[kind]; const en=lang==='en';
 return <div className="page-wrap pfi-policy-page">
  <a className="policy-back" href="#/pengaturan"><ArrowLeft size={16}/>{t('Kembali ke Pusat Pedoman','Back to Guidelines Centre')}</a>
  <header className="policy-hero"><div className="policy-hero-icon"><BookOpen size={23}/></div><div className="eyebrow"><i/>{t('PEDOMAN PLATFORM PFI','PFI PLATFORM GUIDELINE')}</div><h1>{en?g.en:g.title}</h1><p>{en?g.introEn:g.intro}</p></header>
  <div className="policy-boundary"><Info size={18}/><p>{t('Pedoman ini menjelaskan prosedur internal platform PFI. Pedoman tidak menggantikan aturan lembaga mitra, keputusan pemerintah, atau kewenangan otoritas keagamaan dan pendidikan.','This guideline describes PFI platform procedures. It does not replace partner institution rules, government decisions, or religious and educational authorities.')}</p></div>
  <div className="policy-blocks">{g.blocks.map(([title,body,titleEn,bodyEn],i)=><section className="card policy-block" key={title}><div className="policy-index">{String(i+1).padStart(2,'0')}</div><div><h2>{en?titleEn:title}</h2><p>{en?bodyEn:body}</p></div></section>)}</div>
  {kind==='verification'&&<section className="policy-action"><ShieldCheck size={19}/><div><b>{t('Siap mengajukan verifikasi pengamat?','Ready to request observer verification?')}</b><p>{t('Buka Profil, baca persyaratan di atas, lalu isi formulir verifikasi. Pengajuan akan menunggu petugas yang ditugaskan.','Open Profile, review the requirements above, then complete the verification form. Your request will wait for an assigned reviewer.')}</p><a href="#/profil">{t('Buka Profil dan ajukan','Open Profile to apply')} →</a></div></section>}
  {kind==='institution'&&<><section className="policy-action"><BookOpen size={19}/><div><b>{t('Lembaga ingin bermitra dengan PFI?','Want your institution to partner with PFI?')}</b><p>{t('Siapkan informasi dasar melalui draf di bawah. Setelah itu, kirimkan melalui kanal resmi PFI yang diumumkan pengelola. Draf ini bukan pendaftaran resmi.','Prepare basic information using the draft below, then send it through an official PFI channel announced by administrators. This draft is not an official application.')}</p></div></section><InstitutionPrepForm t={t} lang={lang} account={data.account} tell={tell}/></>}
  {kind==='expertise'&&<section className="policy-action"><ShieldCheck size={19}/><div><b>{t('Penilaian keahlian terpisah dari verifikasi akun','Expertise review is separate from account verification')}</b><p>{t('Formulir verifikasi akun saat ini tidak otomatis mengajukan pengakuan keahlian. Jangan menganggap status akun terverifikasi sebagai sertifikasi ahli.','The current account verification form does not automatically request expertise recognition. Do not treat account verification as expert certification.')}</p></div></section>}
  <div className="policy-foot"><CheckCircle2 size={16}/>{t('Siapkan informasi yang benar dan hanya kirim dokumen melalui kanal resmi PFI.','Provide accurate information and submit documents only through official PFI channels.')}</div>
 </div>;
}
export const PedomanKeanggotaan=()=> <PedomanPage kind="membership"/>;
export const PedomanLembaga=()=> <PedomanPage kind="institution"/>;
export const PedomanVerifikasi=()=> <PedomanPage kind="verification"/>;
export const PedomanKeahlian=()=> <PedomanPage kind="expertise"/>;
export const PedomanRukyat=()=> <PedomanPage kind="rukyat"/>;
export const PedomanEtika=()=> <PedomanPage kind="ethics"/>;
