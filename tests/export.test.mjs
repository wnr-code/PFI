import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHisab, SITES } from '../src/lib/astro.js';
import { resultRows } from '../src/lib/export.js';

test('hisab report preserves seconds and formats angular results as DMS', () => {
  const site = SITES.find((item) => item.id === 'tasik');
  const result = calculateHisab({ start: '2013-08-08', day: 1, month: 10, year: 1434 }, site);
  const rows = Object.fromEntries(resultRows(result, 'id'));
  assert.match(rows['Waktu ijtimak'], /\b\d{2}[:.]\d{2}[:.]\d{2}\b/);
  assert.match(rows['Matahari terbenam'], /\b\d{2}[:.]\d{2}[:.]\d{2}\b/);
  for (const label of ['Tinggi Bulan modern', 'Tinggi Ad-Durrul Aniq', 'Tinggi geosentris (kitab)', 'Elongasi geosentris', 'Azimut Bulan', 'Azimut Matahari']) {
    assert.match(rows[label], /^−?\d+° \d{2}′ \d{2}\.\d{2}″$/, label);
  }
});
