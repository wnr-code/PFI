/*
 * Dibuat/diperbarui: 2026-11-19
 * Dibuat oleh: AEP
 * GitHub: https://github.com/wnr-code/PFI
 * Maintainer: @wnr-code — https://github.com/wnr-code
 * Dukung pengembang: https://trakteer.id/lanteraku/tip
 */
import { Observer, Equator, EquatorFromVector, GeoVector, Horizon, MoonPhase, RotateVector, Rotation_EQJ_EQD, SearchMoonPhase, Illumination, AngleFromSun, SearchRiseSet, SearchAltitude, SearchHourAngle, SearchLunarEclipse, SearchGlobalSolarEclipse, SearchLocalSolarEclipse, KM_PER_AU } from 'astronomy-engine';
export const DAY=86400000;
export const SITES=[
 {id:'tasik',city:'Tasikmalaya',region:'Jawa Barat',site:'Bukit Panyangrayan',lat:-7.407,lon:108.142,elev:698,offset:7},
 {id:'lembang',city:'Lembang',region:'Jawa Barat',site:'Dataran Tinggi Lembang',lat:-6.825,lon:107.616,elev:1310,offset:7},
 {id:'sukabumi',city:'Sukabumi',region:'Jawa Barat',site:'Pantai Palabuhanratu',lat:-6.986,lon:106.543,elev:12,offset:7},
 {id:'aceh',city:'Lhoknga',region:'Aceh',site:'Pantai Lhoknga',lat:5.477,lon:95.231,elev:10,offset:7},
 {id:'yogya',city:'Yogyakarta',region:'DI Yogyakarta',site:'Pantai Parangkusumo',lat:-8.024,lon:110.325,elev:8,offset:7},
 {id:'surabaya',city:'Surabaya',region:'Jawa Timur',site:'Pesisir Kenjeran',lat:-7.238,lon:112.795,elev:5,offset:7},
 {id:'mataram',city:'Mataram',region:'Nusa Tenggara Barat',site:'Pantai Ampenan',lat:-8.57,lon:116.071,elev:10,offset:8},
 {id:'makassar',city:'Makassar',region:'Sulawesi Selatan',site:'Pantai Losari',lat:-5.144,lon:119.407,elev:8,offset:8},
 {id:'biak',city:'Biak',region:'Papua',site:'Pesisir Biak',lat:-1.189,lon:136.081,elev:10,offset:9}
];
export const zone=l=>{const offset=Number(l?.offset??7),indonesia={7:'Asia/Jakarta',8:'Asia/Makassar',9:'Asia/Jayapura'}[offset];if(indonesia)return indonesia;return `Etc/GMT${offset<=0?'+':'-'}${Math.abs(offset)}`;};
export const zlabel=l=>({7:'WIB',8:'WITA',9:'WIT'})[Number(l?.offset??7)]||`UTC${Number(l?.offset??0)>=0?'+':''}${Number(l?.offset??0)}`;
export const num=(n,lang='id',digits=1)=>Number(n).toLocaleString(lang==='en'?'en-GB':'id-ID',{maximumFractionDigits:digits,minimumFractionDigits:digits});
export const dateFmt=(d,l=SITES[0],lang='id',opts={day:'numeric',month:'long',year:'numeric'})=>new Intl.DateTimeFormat(lang==='en'?'en-GB':'id-ID',{timeZone:zone(l),...opts}).format(new Date(d));
export const clock=(d,l=SITES[0])=>new Intl.DateTimeFormat('en-GB',{timeZone:zone(l),hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(d));
export const isoDay=(d,l=SITES[0])=>new Date(+new Date(d)+l.offset*3600000).toISOString().slice(0,10);
export const localTime=(day,time,l=SITES[0])=>{const offset=Number(l.offset)||0,sign=offset<0?'-':'+';return new Date(`${day}T${time}:00${sign}${String(Math.abs(offset)).padStart(2,'0')}:00`);};
export const HIJRI=['Muharam','Safar','Rabiul Awal','Rabiul Akhir','Jumadil Awal','Jumadil Akhir','Rajab','Syaban','Ramadan','Syawal','Zulkaidah','Zulhijah'];
export const HIJRI_EN=['Muharram','Safar','Rabi I','Rabi II','Jumada I','Jumada II','Rajab',"Sha'ban",'Ramadan','Shawwal',"Dhu al-Qadah",'Dhu al-Hijjah'];
const hFormats=new Map();
export function hijri(d,l=SITES[0]){const tz=zone(l);if(!hFormats.has(tz))hFormats.set(tz,new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{timeZone:tz,year:'numeric',month:'numeric',day:'numeric'}));const p=Object.fromEntries(hFormats.get(tz).formatToParts(new Date(d)).map(x=>[x.type,x.value]));return{day:+p.day,month:+p.month,year:+p.year};}
export function hijriText(d,l,lang='id',withDay=true){const h=hijri(d,l);return `${withDay?h.day+' ':''}${(lang==='en'?HIJRI_EN:HIJRI)[h.month-1]} ${h.year} H`;}
export function periods(now,l){const out=[];for(let i=-35;i<355;i++){const d=new Date(+now+i*DAY),h=hijri(d,l);if(h.day===1)out.push({start:isoDay(d,l),...h});}return out;}
export const phaseNames=[['Bulan Baru','New Moon'],['Sabit Awal','Waxing Crescent'],['Perbani Awal','First Quarter'],['Cembung Awal','Waxing Gibbous'],['Bulan Purnama','Full Moon'],['Cembung Akhir','Waning Gibbous'],['Perbani Akhir','Last Quarter'],['Sabit Akhir','Waning Crescent']];
export function phaseIndex(angle){return angle<5||angle>=355?0:angle<84?1:angle<96?2:angle<175?3:angle<185?4:angle<264?5:angle<276?6:7;}
export function lunar(d){const angle=MoonPhase(d),i=Illumination('Moon',d);return{angle,phase:phaseIndex(angle),elongation:AngleFromSun('Moon',d),illumination:100*i.phase_fraction,age:(+d-SearchMoonPhase(0,d,-32).date)/DAY,distance:i.geo_dist*KM_PER_AU};}
export function position(body,d,l){const obs=new Observer(l.lat,l.lon,l.elev),e=Equator(body,d,obs,true,true),h=Horizon(d,obs,e.ra,e.dec,'normal');return {alt:h.altitude,az:h.azimuth,dec:e.dec,ra:e.ra,dist:e.dist*KM_PER_AU};}
export function sunsetTime(day,l=SITES[0]){if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;try{const check=new Date(`${day}T12:00:00.000Z`);if(!Number.isFinite(check.getTime())||check.toISOString().slice(0,10)!==day)return null;const start=localTime(day,'00:00',l);if(!Number.isFinite(start.getTime()))return null;const result=SearchRiseSet('Sun',new Observer(l.lat,l.lon,l.elev),-1,start,1);return result?.date||null;}catch{return null;}}
export function starPosition(ra,dec,d,l){const h=Horizon(d,new Observer(l.lat,l.lon,l.elev),ra,dec);return{alt:h.altitude,az:h.azimuth};}
const rad=(value)=>value*Math.PI/180;
const deg=(value)=>value*180/Math.PI;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const signedAngle=(value)=>((value+540)%360)-180;
export const meetsMabims=(altitude,elongation)=>Number.isFinite(altitude)&&Number.isFinite(elongation)&&altitude>=3&&elongation>=6.4;
function airlessPosition(body,d,l,geocentric=false){
 const obs=new Observer(l.lat,l.lon,l.elev);
 const e=geocentric?EquatorFromVector(RotateVector(Rotation_EQJ_EQD(d),GeoVector(body,d,true))):Equator(body,d,obs,true,true);
 const h=Horizon(d,obs,e.ra,e.dec);
 return{alt:h.altitude,az:h.azimuth,dec:e.dec,ra:e.ra,dist:e.dist*KM_PER_AU};
}
function adDurrulHilal(sunset,l,elongation){
 // Ad-Durrul Aniq, pembahasan data hilal hlm. 41–43: tinggi markazi,
 // paralaks, refraksi, dip, semidiameter, tinggi sathi, elongasi dan muktsul.
 // Ephemeris dasar tetap Astronomy Engine; koreksi hilal mengikuti rumus kitab.
 const moon=airlessPosition('Moon',sunset,l,true),sun=airlessPosition('Sun',sunset,l,true);
 const horizontalParallax=deg(Math.asin(clamp(6378.14/moon.dist,-1,1)));
 const semiDiameter=.272476*horizontalParallax;
 const dip=(1.76/60)*Math.sqrt(Math.max(0,l.elev||0));
 const refraction=moon.alt>-4.3?.0167/Math.tan(rad(moon.alt+7.31/(moon.alt+4.4))):0;
 const parallax=horizontalParallax*Math.cos(rad(moon.alt));
 const parallaxCorrectedAltitude=moon.alt-parallax;
 // Ad-Durrul Aniq hlm. 28: bila hc − P negatif, jangan tambahkan
 // refraksi, dip, atau semidiameter; koreksi lanjutan hanya untuk hasil positif.
 const secondaryCorrectionsApplied=parallaxCorrectedAltitude>=0;
 const topocentricAltitude=secondaryCorrectionsApplied?parallaxCorrectedAltitude+refraction+dip-semiDiameter:parallaxCorrectedAltitude;
 const azimuthDifference=signedAngle(moon.az-sun.az);
 const topocentricElongation=deg(Math.acos(clamp(Math.sin(rad(topocentricAltitude))*Math.sin(rad(sun.alt))+Math.cos(rad(topocentricAltitude))*Math.cos(rad(sun.alt))*Math.cos(rad(azimuthDifference)),-1,1)));
 const altitudeDifference=moon.alt-sun.alt;
 const angularDistance=deg(Math.acos(clamp(Math.cos(rad(azimuthDifference))*Math.cos(rad(altitudeDifference)),-1,1)));
 const muktsulMinutes=Math.max(0,moon.alt*4);
 return{moon,sun,geocentricAltitude:moon.alt,parallaxCorrectedAltitude,secondaryCorrectionsApplied,topocentricAltitude,horizontalParallax,parallax,refraction,dip,semiDiameter,elongation,topocentricElongation,illumination:100*Illumination('Moon',sunset).phase_fraction,illuminationSource:'Astronomy Engine phase fraction (hybrid; original kitab anomaly tables not yet transcribed)',muktsulMinutes,estimatedMoonset:new Date(+sunset+muktsulMinutes*60000).toISOString(),azimuthDifference,altitudeDifference,angularDistance,position:azimuthDifference<0?'south':'north',meets:meetsMabims(topocentricAltitude,elongation)};
}
export function calculateHisab(period,l,method='comparison'){
 if(!['comparison','mabims'].includes(method))throw new Error('Metode hisab belum didukung.');
 if(!period?.start||period.day!==1)throw new Error('Tanggal acuan harus merupakan tanggal 1 bulan Hijriah.');
 if(!l||!Number.isFinite(l.lat)||l.lat < -90||l.lat > 90||!Number.isFinite(l.lon)||l.lon < -180||l.lon > 180||!Number.isFinite(l.elev)||l.elev < -500||l.elev > 9000||!Number.isInteger(l.offset)||l.offset < -12||l.offset > 14)throw new Error('Lokasi pengamatan tidak valid.');
 const start=localTime(period.start,'00:00',l);if(!Number.isFinite(start.getTime()))throw new Error('Tanggal acuan tidak valid.');
 const conjunction=SearchMoonPhase(0,new Date(+start-5*DAY),10),conj=conjunction?.date;if(!conj)throw new Error('Ijtimak tidak ditemukan pada rentang pencarian.');
 const sunsetEvent=SearchRiseSet('Sun',new Observer(l.lat,l.lon,l.elev),-1,conj,2),sunset=sunsetEvent?.date;if(!sunset)throw new Error('Matahari terbenam tidak ditemukan untuk lokasi dan tanggal ini.');
 const moon=position('Moon',sunset,l),sun=position('Sun',sunset,l),elongation=AngleFromSun('Moon',sunset),age=(sunset-conj)/3600000;
 const modern={moon,sun,elongation,age,illumination:100*Illumination('Moon',sunset).phase_fraction,meets:meetsMabims(moon.alt,elongation),engine:'Astronomy Engine 2.1.19'};
 const adDurrul=adDurrulHilal(sunset,l,elongation);
 const comparison={altitudeDifference:modern.moon.alt-adDurrul.topocentricAltitude,elongationDifference:modern.elongation-adDurrul.elongation,note:'Diagnostic only: the models use different altitude corrections; this is not an accuracy verdict.'};
 return{id:crypto.randomUUID(),created:new Date().toISOString(),period,loc:l,method:'comparison',conj:conj.toISOString(),sunset:sunset.toISOString(),moon,sun,elongation,age,meets:modern.meets,models:{modern,adDurrul},comparison,criteria:{name:'MABIMS 2021',minAltitude:3,minElongation:6.4},audit:{schema:'pfi-hisab-v2',modernEngine:'Astronomy Engine 2.1.19',kitabReference:'Ad-Durrul Aniq terjemahan Kemenag RI 2025, hlm. 28 dan 39–43',ephemerisBase:'Astronomy Engine 2.1.19',locationSource:l.source||'catalog',locationAccuracy:Number.isFinite(l.accuracy)?l.accuracy:null,calculatedAt:new Date().toISOString()}};
}
export function qibla(l){const r=Math.PI/180,y1=l.lat*r,y2=21.4225*r,dl=(39.8262-l.lon)*r;return{angle:(Math.atan2(Math.sin(dl),Math.cos(y1)*Math.tan(y2)-Math.sin(y1)*Math.cos(dl))/r+360)%360,km:6371*Math.acos(Math.sin(y1)*Math.sin(y2)+Math.cos(y1)*Math.cos(y2)*Math.cos(dl))};}
export function prayers(day,l){const start=localTime(day,'00:00',l),o=new Observer(l.lat,l.lon,l.elev),dhuhr=SearchHourAngle('Sun',o,0,start).time.date,dec=position('Sun',dhuhr,l).dec,asrAlt=Math.atan(1/(1+Math.tan(Math.abs(l.lat-dec)*Math.PI/180)))*180/Math.PI;return[
 ['Subuh','Fajr',SearchAltitude('Sun',o,1,start,1,-20)?.date],['Terbit','Sunrise',SearchRiseSet('Sun',o,1,start,1)?.date],['Zuhur','Dhuhr',dhuhr],['Asar','Asr',SearchAltitude('Sun',o,-1,dhuhr,1,asrAlt)?.date],['Magrib','Maghrib',SearchRiseSet('Sun',o,-1,start,1)?.date],['Isya','Isha',SearchAltitude('Sun',o,-1,start,1,-18)?.date]];}
export function eclipses(date){const lunar=SearchLunarEclipse(date),solar=SearchGlobalSolarEclipse(date);return[{body:'Moon',kind:lunar.kind,date:lunar.peak.date,obscuration:lunar.obscuration},{body:'Sun',kind:solar.kind,date:solar.peak.date,obscuration:solar.obscuration}].sort((a,b)=>a.date-b.date);}
export function eclipseTimeline(date,l=SITES[0]){
 const now=new Date(date),searchStart=new Date(+now-2*DAY),observer=new Observer(l.lat,l.lon,l.elev);
 let lunar=SearchLunarEclipse(searchStart),lunarHalf=Math.max(lunar.sd_penum,lunar.sd_partial,lunar.sd_total)*60000;
 let lunarStart=new Date(+lunar.peak.date-lunarHalf),lunarEnd=new Date(+lunar.peak.date+lunarHalf);
 if(lunarEnd<now){lunar=SearchLunarEclipse(now);lunarHalf=Math.max(lunar.sd_penum,lunar.sd_partial,lunar.sd_total)*60000;lunarStart=new Date(+lunar.peak.date-lunarHalf);lunarEnd=new Date(+lunar.peak.date+lunarHalf);}
 let solar=SearchLocalSolarEclipse(searchStart,observer),solarStart=solar.partial_begin.time.date,solarEnd=solar.partial_end.time.date;
 if(solarEnd<now){solar=SearchLocalSolarEclipse(now,observer);solarStart=solar.partial_begin.time.date;solarEnd=solar.partial_end.time.date;}
 const make=(body,kind,obscuration,start,peak,end,visible=true,currentVisible=visible,contacts={})=>{
  const withinContacts=now>=start&&now<=end,active=withinContacts&&currentVisible,progress=withinContacts?clamp((now-start)/(end-start),0,1):0;
  let phase=withinContacts&&!currentVisible?'below-horizon':'upcoming';
  if(active)phase=now<peak?'beginning':Math.abs(now-peak)<60000?'peak':'ending';
  return{body,kind,obscuration,start:start.toISOString(),peak:peak.toISOString(),end:end.toISOString(),active,withinContacts,progress,phase,visible,currentVisible,contacts};
 };
 const lunarAltitudes={start:position('Moon',lunarStart,l).alt,peak:position('Moon',lunar.peak.date,l).alt,end:position('Moon',lunarEnd,l).alt,current:position('Moon',now,l).alt};
 const solarVisible=[solar.partial_begin.altitude,solar.peak.altitude,solar.partial_end.altitude].some((alt)=>alt>0),solarCurrentAltitude=position('Sun',now,l).alt;
 return[
  make('Sun',solar.kind,solar.obscuration,solarStart,solar.peak.time.date,solarEnd,solarVisible,solarCurrentAltitude>-0.833,{totalBegin:solar.total_begin?.time.date?.toISOString()||null,totalEnd:solar.total_end?.time.date?.toISOString()||null,peakAltitude:solar.peak.altitude,currentAltitude:solarCurrentAltitude}),
  make('Moon',lunar.kind,lunar.obscuration,lunarStart,lunar.peak.date,lunarEnd,[lunarAltitudes.start,lunarAltitudes.peak,lunarAltitudes.end].some((alt)=>alt>0),lunarAltitudes.current>0,{penumbralBegin:lunarStart.toISOString(),partialBegin:lunar.sd_partial?new Date(+lunar.peak.date-lunar.sd_partial*60000).toISOString():null,totalBegin:lunar.sd_total?new Date(+lunar.peak.date-lunar.sd_total*60000).toISOString():null,totalEnd:lunar.sd_total?new Date(+lunar.peak.date+lunar.sd_total*60000).toISOString():null,partialEnd:lunar.sd_partial?new Date(+lunar.peak.date+lunar.sd_partial*60000).toISOString():null,penumbralEnd:lunarEnd.toISOString(),penumbralSemiDuration:lunar.sd_penum,partialSemiDuration:lunar.sd_partial,totalSemiDuration:lunar.sd_total,...lunarAltitudes}),
 ].sort((a,b)=>new Date(a.start)-new Date(b.start));
}
export const eventTypes={full:['Fase Bulan','Moon phase'],new:['Ijtimak','Conjunction'],rukyat:['Rukyat','Observation'],quarter:['Fase Bulan','Moon phase']};
function event(type,d,l,title,en,desc,descEn){return{id:`${type}-${d.toISOString().slice(0,16)}-${l.id}`,type,date:d.toISOString(),title,en,desc,descEn,loc:l};}
function newEvents(d,l){const monthDate=new Date(+d+3*DAY),h=hijri(monthDate,l),n=HIJRI[h.month-1],ne=HIJRI_EN[h.month-1],r=SearchRiseSet('Sun',new Observer(l.lat,l.lon,l.elev),-1,d,2).date;return [event('new',d,l,`Ijtimak ${n} ${h.year} H`,`${ne} ${h.year} conjunction`,'Saat bujur ekliptika Bulan dan Matahari berimpit. Ijtimak bukan penetapan awal bulan.','The Sun and Moon share the same ecliptic longitude. This is not an official month declaration.'),event('rukyat',r,l,`Rukyatul Hilal ${n}`,`${ne} crescent watch`,'Usulan waktu pengamatan hilal pada terbenam Matahari pertama setelah ijtimak. Bukan jadwal kegiatan resmi.','A suggested observing time at the first sunset following conjunction, not an official event.')];}
function fullEvent(d,l){return event('full',d,l,'Bulan Purnama','Full Moon','Puncak fase purnama, ketika sisi Bulan yang menghadap Bumi hampir seluruhnya diterangi Matahari.','The full Moon is nearly fully illuminated as seen from Earth.');}
export function agenda(now,l){const c=SearchMoonPhase(0,now,32).date,p=SearchMoonPhase(180,now,32).date;return [fullEvent(p,l),...newEvents(c,l)].sort((a,b)=>new Date(a.date)-new Date(b.date));}
export function monthEvents(y,m,l){const start=localTime(`${y}-${String(m+1).padStart(2,'0')}-01`,'00:00',l),last=new Date(Date.UTC(y,m+1,1)-l.offset*3600000),arr=[];for(const phase of [0,90,180,270]){let d=SearchMoonPhase(phase,new Date(+start-2*DAY),32).date;while(d<last){arr.push(...(phase===0?newEvents(d,l):phase===180?[fullEvent(d,l)]:[event('quarter',d,l,phase===90?'Perbani Awal':'Perbani Akhir',phase===90?'First Quarter':'Last Quarter','Separuh piringan Bulan tampak terang dari Bumi.','Half of the lunar disc is illuminated as seen from Earth.')]));d=SearchMoonPhase(phase,new Date(+d+2*DAY),32).date;}}return arr.filter(e=>new Date(e.date)>=start&&new Date(e.date)<last).sort((a,b)=>new Date(a.date)-new Date(b.date));}
