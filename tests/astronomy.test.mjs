import {strict as assert} from 'node:assert';
import {lunar,hijri,hijriText,qibla,prayers,calculateHisab,SITES,localTime,periods,phaseNames} from '../src/lib/astro.js';

const tasik=SITES[0];
const d=new Date('2026-11-18T14:15:00Z');

const m=lunar(d);
assert.ok(Number.isInteger(m.phase)&&m.phase>=0&&m.phase<=7,'phase index range');
assert.ok(m.phase===3,'Nov 2026 should be waxing gibbous at test time bucket');
assert.ok(Number.isFinite(m.illumination)&&m.illumination>=0&&m.illumination<=100,'illumination');
assert.ok(Number.isFinite(m.age)&&m.age>0,'lunar age');
assert.ok(Number.isFinite(m.distance)&&m.distance>300000,'lunar distance');

const h=hijri(d,tasik);
assert.ok(h.year>=1400&&h.month>=1&&h.month<=12&&h.day>=1,'hijri shape');
assert.equal(typeof hijriText(d,tasik,'id'),'string');

const q=qibla(tasik);
assert.ok(Number.isFinite(q.angle)&&q.angle>=0&&q.angle<360,'qibla angle');
assert.ok(Number.isFinite(q.km)&&q.km>8000,'qibla distance');

const pl=prayers('2026-11-18',tasik);
assert.equal(pl.length,6,'six prayer times');
assert.ok(pl.every(([id,,date])=>date),'all prayer times resolved');
const r=calculateHisab({start:'2026-12-10',month:8,year:1448},tasik,'mabims');
assert.ok(typeof r.meets==='boolean','meets flag');
assert.ok(r.age>0&&r.elongation>0,'computed values');
assert.equal(typeof r.moon.alt,'number');

const ps=periods(d,tasik);
assert.ok(ps.length>10,'period list');
assert.equal(phaseNames[m.phase][0],'Cembung Awal');

console.log('PFI astronomy tests OK');
console.log('qibla:',q.angle.toFixed(2),'°  ilumination:',m.illumination.toFixed(2),'%  hijri:',hijriText(d,tasik,'id'));