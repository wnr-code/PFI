import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { canReviewEntity, canViewGroup, canViewPost, ensureUserSchema, groupSlug, usernameBase, HISAB_METHODS, normalizeHisabSite, normalizeRukyatDetails, uploadContentLengthStatus } from '../worker/index.js';
import { SITES, calculateHisab, clock, eclipseTimeline, lunar, meetsMabims, sunsetTime } from '../src/lib/astro.js';

test('Worker health endpoint verifies D1 schema and authentication configuration', async () => {
  const requiredTables = [
    'users', 'groups', 'memberships', 'group_coordinators', 'calculations',
    'posts', 'photos', 'likes', 'comments', 'reviews', 'agendas',
    'institution_applications', 'partner_institutions', 'institution_application_reviews',
  ];
  const env = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'test-public-key',
    falaq: {
      prepare(sql) {
        return {
          first: async () => ({ ok: 1 }),
          bind: (...values) => ({
            all: async () => ({ results: values.map((name) => ({ name })) }),
          }),
        };
      },
    },
    r2falaq: { put() {}, get() {} },
  };
  const response = await worker.fetch(new Request('https://pfi.test/api/health'), env, {});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.runtime, 'cloudflare-workers');
  assert.equal(body.database, 'ok');
  assert.equal(body.schema.ready, true);
  assert.deepEqual(body.schema.missingTables, []);
  assert.equal(body.authentication, 'configured');
  assert.equal(body.photoStorage, 'configured');
});

test('Worker health accepts existing Vite-prefixed Supabase runtime bindings', async () => {
  const requiredTables = [
    'users', 'groups', 'memberships', 'group_coordinators', 'calculations',
    'posts', 'photos', 'likes', 'comments', 'reviews', 'agendas',
    'institution_applications', 'partner_institutions', 'institution_application_reviews',
  ];
  const env = {
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-public-key',
    falaq: {
      prepare() {
        return {
          first: async () => ({ ok: 1 }),
          bind: (...values) => ({ all: async () => ({ results: values.map((name) => ({ name })) }) }),
        };
      },
    },
    r2falaq: { put() {}, get() {} },
  };
  const response = await worker.fetch(new Request('https://pfi.test/api/health'), env, {});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.authentication, 'configured');
});

test('Worker health endpoint reports missing runtime dependencies', async () => {
  const response = await worker.fetch(new Request('https://pfi.test/api/health'), {}, {});
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.status, 'degraded');
  assert.equal(body.database, 'unavailable');
  assert.equal(body.authentication, 'missing_configuration');
});

test('legacy Production user tables are upgraded without replacing existing data', async () => {
  const added = [];
  const database = {
    prepare(sql) {
      if (sql === 'PRAGMA table_info(users)') {
        return { all: async () => ({ results: [{ name: 'id' }, { name: 'email' }] }) };
      }
      return { run: async () => { added.push(sql); } };
    },
  };
  await ensureUserSchema(database);
  assert.equal(added.length, 15);
  assert.ok(added.some((sql) => sql.startsWith('ALTER TABLE users ADD COLUMN name ')));
  assert.ok(added.some((sql) => sql.startsWith('ALTER TABLE users ADD COLUMN avatar_url ')));
  assert.ok(added.some((sql) => sql.startsWith('ALTER TABLE users ADD COLUMN cover_theme ')));
  assert.ok(added.some((sql) => sql.startsWith('ALTER TABLE users ADD COLUMN prefs ')));
  assert.ok(added.some((sql) => sql.startsWith('ALTER TABLE users ADD COLUMN username ')));
  assert.ok(added.some((sql) => sql.startsWith('CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique')));
  assert.ok(added.slice(0, -1).every((sql) => sql.startsWith('ALTER TABLE users ADD COLUMN ')));
});

test('profile usernames are normalized into stable readable slugs', () => {
  assert.equal(usernameBase('Aép Saepulloh'), 'aep-saepulloh');
  assert.equal(usernameBase('  Pengamat   Hilal  '), 'pengamat-hilal');
  assert.equal(usernameBase('!?'), 'pengamat');
});

test('Worker failures include a safe diagnostic code and traceable request reference', async () => {
  const env = {
    ASSETS: { fetch: async () => { throw new Error('UNIQUE constraint failed: users.email'); } },
  };
  const response = await worker.fetch(new Request('https://pfi.test/'), env, {});
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.code, 'DATABASE_UNIQUE_CONFLICT');
  assert.match(body.detail, /akun/i);
  assert.match(body.requestId, /^[0-9a-f-]{36}$/i);
  assert.equal(body.error, 'Layanan PFI belum dapat menyelesaikan permintaan.');
});

test('protected post creation rejects anonymous requests', async () => {
  const request = new Request('https://pfi.test/api/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'diskusi', title: 'Uji', body: 'Uji konten', city: 'Bandung' }),
  });
  const response = await worker.fetch(request, {}, {});
  assert.equal(response.status, 401);
});

test('Worker accepts the dual-model hisab method used by the frontend', () => {
  assert.ok(HISAB_METHODS.includes('comparison'));
  assert.ok(HISAB_METHODS.includes('mabims'));
  assert.equal(HISAB_METHODS.includes('unknown'), false);
});

test('custom hisab locations are normalized with strict coordinate limits', () => {
  const site = normalizeHisabSite('custom', { city: 'Observatorium Uji', region: 'Indonesia', lat: -7.4, lon: 108.1, elev: 700, offset: 7 });
  assert.deepEqual(site, { id: 'custom', site: 'Observatorium Uji', city: 'Observatorium Uji', region: 'Indonesia', lat: -7.4, lon: 108.1, elev: 700, offset: 7, source: 'manual', accuracy: null });
  const gps = normalizeHisabSite('custom', { city: 'GPS', lat: -7.4, lon: 108.1, elev: 700, offset: 7, source: 'gps', accuracy: 12 });
  assert.equal(gps.source, 'gps');
  assert.equal(gps.accuracy, 12);
  assert.equal(normalizeHisabSite('custom', { city: 'Tidak valid', lat: 91, lon: 108, elev: 0, offset: 7 }), null);
  assert.equal(normalizeHisabSite('custom', { city: 'Tidak valid', lat: -7, lon: 108, elev: 0, offset: 7.5 }), null);
});

test('hisab rejects an unknown observation site before accessing D1', async () => {
  const request = new Request('https://pfi.test/api/hisab', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ site: 'unknown', start: '2026-01-01', method: 'mabims' }),
  });
  const response = await worker.fetch(request, {}, {});
  assert.equal(response.status, 400);
});

test('unported API endpoints fail explicitly with 501', async () => {
  const response = await worker.fetch(new Request('https://pfi.test/api/not-yet-migrated'), {}, {});
  assert.equal(response.status, 501);
});


test('pending rukyat posts are visible only to their owner and reviewers', () => {
  const post = { type: 'rukyat', status: 'pending', user_id: 'observer-1' };
  assert.equal(canViewPost(post, null), false);
  assert.equal(canViewPost(post, { id: 'observer-2', role: 'observer' }), false);
  assert.equal(canViewPost(post, { id: 'observer-1', role: 'observer' }), true);
  assert.equal(canViewPost(post, { id: 'reviewer-1', role: 'reviewer' }), true);
  assert.equal(canViewPost(post, { id: 'admin-1', role: 'admin' }), true);
});

test('verified rukyat posts are public', () => {
  assert.equal(canViewPost({ type: 'rukyat', status: 'verified', user_id: 'observer-1' }, null), true);
});

test('reviewers cannot moderate their own account or rukyat report', () => {
  const reviewer = { id: 'reviewer-1', role: 'reviewer' };
  assert.equal(canReviewEntity('users', { id: 'reviewer-1' }, reviewer), false);
  assert.equal(canReviewEntity('posts', { user_id: 'reviewer-1' }, reviewer), false);
  assert.equal(canReviewEntity('users', { id: 'observer-1' }, reviewer), true);
  assert.equal(canReviewEntity('posts', { user_id: 'observer-1' }, reviewer), true);
});

test('only reviewers and admins may moderate entities', () => {
  const item = { id: 'observer-1', user_id: 'observer-1' };
  assert.equal(canReviewEntity('users', item, { id: 'admin-1', role: 'admin' }), true);
  assert.equal(canReviewEntity('users', item, { id: 'observer-2', role: 'observer' }), false);
  assert.equal(canReviewEntity('unknown', item, { id: 'admin-1', role: 'admin' }), false);
});

test('photo upload validates optional Content-Length safely', () => {
  assert.equal(uploadContentLengthStatus(null), 0);
  assert.equal(uploadContentLengthStatus('1024'), 0);
  assert.equal(uploadContentLengthStatus(''), 400);
  assert.equal(uploadContentLengthStatus('not-a-number'), 400);
  assert.equal(uploadContentLengthStatus('-1'), 400);
  assert.equal(uploadContentLengthStatus(String(3 * 1024 * 1024 + 65537)), 413);
});


test('group data is restricted to members and authorized reviewers', () => {
  assert.equal(canViewGroup(null, true), false);
  assert.equal(canViewGroup({ id: 'observer-1', role: 'observer' }, false), false);
  assert.equal(canViewGroup({ id: 'observer-1', role: 'observer' }, true), true);
  assert.equal(canViewGroup({ id: 'reviewer-1', role: 'reviewer' }, false), true);
  assert.equal(canViewGroup({ id: 'admin-1', role: 'admin' }, false), true);
});


test('rukyat metadata requires explicit coordinates and timezone-aware time', () => {
  const valid = normalizeRukyatDetails({
    latitude: '-7.407', longitude: '108.142',
    observedAt: '2026-11-19T18:30:00+07:00', timeZone: 'WIB',
    elevation: '', weather: 'Cerah', instrument: 'Teleskop',
  });
  assert.equal(valid.latitude, -7.407);
  assert.equal(valid.longitude, 108.142);
  assert.equal(valid.observedAt, '2026-11-19T11:30:00.000Z');
  assert.equal(valid.timeZone, 'WIB');
  assert.equal(valid.utcOffsetMinutes, 420);
  assert.equal(valid.elevation, null);
  assert.equal(normalizeRukyatDetails({ latitude: '', longitude: '0', observedAt: '2026-11-19T18:30:00+07:00' }), null);
  assert.equal(normalizeRukyatDetails({ latitude: '0', longitude: '0', observedAt: '2026-11-19T18:30:00' }), null);
  assert.equal(normalizeRukyatDetails({ latitude: '0', longitude: '0', observedAt: '2026-11-19T18:30:00+07:00', timeZone: 'WITA' }), null);
  assert.equal(normalizeRukyatDetails({ latitude: '0', longitude: '0', observedAt: '2026-02-31T18:30:00+07:00', timeZone: 'WIB' }), null);
  assert.equal(normalizeRukyatDetails({ latitude: '91', longitude: '0', observedAt: '2026-11-19T18:30:00Z' }), null);
  assert.equal(normalizeRukyatDetails({ latitude: true, longitude: '0', observedAt: '2026-11-19T18:30:00Z' }), null);
  assert.equal(normalizeRukyatDetails({ latitude: '0', longitude: '0', observedAt: '2026-11-19T18:30:00Z', elevation: '9001' }), null);
});


test('sunset calculation uses a real local horizon event and rejects invalid dates', () => {
  assert.equal(sunsetTime('not-a-date', SITES[0]), null);
  assert.equal(sunsetTime('2026-02-31', SITES[0]), null);
  const sunset = sunsetTime('2026-11-19', SITES[0]);
  assert.ok(sunset instanceof Date);
  assert.ok(Number.isFinite(sunset.getTime()));
  const localHour = Number(clock(sunset, SITES[0]).slice(0, 2));
  assert.ok(localHour >= 16 && localHour <= 19);
});

test('lunar phase data exposes a finite geocentric elongation', () => {
  const result = lunar(new Date('2026-11-19T12:00:00.000Z'));
  assert.ok(Number.isFinite(result.elongation));
  assert.ok(result.elongation >= 0 && result.elongation <= 180);
});


test('Shawwal 1443 hisab remains within the published 1 May 2022 Indonesian reference envelope', () => {
  const aceh = SITES.find((site) => site.id === 'aceh');
  assert.throws(() => calculateHisab({ start: '2022-05-02', day: 1 }, aceh, 'geometri'));
  assert.throws(() => calculateHisab({ start: '2022-05-02', day: 2 }, aceh, 'mabims'));
  const result = calculateHisab(
    { start: '2022-05-02', year: 1443, month: 10, day: 1 },
    aceh,
    'mabims'
  );
  assert.ok(result.sunset > result.conj);
  assert.ok(result.age > 0 && result.age < 24);
  assert.ok(result.moon.alt >= 3.5 && result.moon.alt <= 6.0);
  assert.ok(result.elongation >= 5.0 && result.elongation <= 8.0);
  assert.equal(result.meets, result.moon.alt >= 3 && result.elongation >= 6.4);
});


test('real-time eclipse timeline activates only inside observed contact times', () => {
  const dallas = { id: 'dallas', city: 'Dallas', region: 'Texas', site: 'Dallas', lat: 32.7767, lon: -96.797, elev: 131, offset: -5 };
  const during = eclipseTimeline(new Date('2024-04-08T18:42:00Z'), dallas).find((event) => event.body === 'Sun');
  assert.equal(during.active, true);
  assert.ok(during.progress > 0 && during.progress < 1);
  assert.ok(['beginning', 'peak', 'ending'].includes(during.phase));
  const ordinaryInstant = new Date('2024-04-10T18:42:00Z');
  const ordinaryDay = eclipseTimeline(ordinaryInstant, dallas);
  assert.equal(ordinaryDay.some((event) => event.active), false);
  assert.ok(ordinaryDay.every((event) => new Date(event.start) > ordinaryInstant));
  assert.ok(ordinaryDay.every((event) => new Date(event.start) < new Date(event.peak) && new Date(event.peak) < new Date(event.end)));
  assert.equal(typeof during.visible, 'boolean');
});

test('scientific core rejects coordinates, elevation, and time zones outside supported bounds', () => {
  const period = { start: '2013-08-08', day: 1, month: 10, year: 1434 };
  const base = { id: 'invalid', city: 'Invalid', region: 'Test', lat: 0, lon: 0, elev: 0, offset: 0 };
  for (const patch of [{ lat: 90.001 }, { lat: -90.001 }, { lon: 180.001 }, { lon: -180.001 }, { elev: -500.001 }, { elev: 9000.001 }, { offset: -13 }, { offset: 15 }, { offset: 7.5 }]) {
    assert.throws(() => calculateHisab(period, { ...base, ...patch }), /Lokasi pengamatan tidak valid/);
  }
});

test('Ad-Durrul Aniq correction chain preserves signs, units, and algebraic order', () => {
  const cases = [
    [{ start: '2013-08-08', day: 1, month: 10, year: 1434 }, { id: 'banyuwangi-audit', city: 'Banyuwangi', region: 'Jawa Timur', lat: -8.6574, lon: 114.3614, elev: 2, offset: 7 }],
    [{ start: '2013-01-13', day: 1, month: 3, year: 1434 }, { id: 'vancouver-audit', city: 'Vancouver', region: 'Canada', lat: 49.25, lon: -123.1667, elev: 0, offset: -8 }],
  ];
  for (const [period, site] of cases) {
    const k = calculateHisab(period, site).models.adDurrul;
    assert.ok(k.horizontalParallax > 0 && k.horizontalParallax < 2);
    assert.ok(k.semiDiameter > 0 && k.semiDiameter < 0.5);
    assert.ok(k.parallax >= 0 && k.parallax <= k.horizontalParallax);
    assert.ok(k.refraction >= 0 && k.refraction < 2);
    assert.ok(k.dip >= 0 && k.dip < 3);
    assert.ok(Math.abs(k.parallaxCorrectedAltitude - (k.geocentricAltitude - k.parallax)) < 1e-12);
    assert.equal(k.secondaryCorrectionsApplied, true);
    const expected = k.parallaxCorrectedAltitude + k.refraction + k.dip - k.semiDiameter;
    assert.ok(Math.abs(k.topocentricAltitude - expected) < 1e-12);
    const toRad = value => value * Math.PI / 180;
    const toDeg = value => value * 180 / Math.PI;
    const expectedTopocentricElongation = toDeg(Math.acos(Math.sin(toRad(k.topocentricAltitude)) * Math.sin(toRad(k.sun.alt)) + Math.cos(toRad(k.topocentricAltitude)) * Math.cos(toRad(k.sun.alt)) * Math.cos(toRad(k.azimuthDifference))));
    const expectedAngularDistance = toDeg(Math.acos(Math.cos(toRad(k.azimuthDifference)) * Math.cos(toRad(k.altitudeDifference))));
    assert.ok(Math.abs(k.topocentricElongation - expectedTopocentricElongation) < 1e-12);
    assert.ok(Math.abs(k.angularDistance - expectedAngularDistance) < 1e-12);
    assert.ok(Math.abs(k.altitudeDifference - (k.geocentricAltitude - k.sun.alt)) < 1e-12);
    assert.equal(k.muktsulApplicable, true);
    assert.ok(Math.abs(k.muktsulMinutes - k.geocentricAltitude * 4) < 1e-12);
    assert.equal(k.meets, meetsMabims(k.topocentricAltitude, k.elongation));
    assert.match(k.illuminationSource, /hybrid.*not yet transcribed/i);
  }
});

test('MABIMS evaluates true elongation rather than the 0–360 lunar phase angle', () => {
  assert.equal(meetsMabims(3, 6.4), true);
  assert.equal(meetsMabims(2.999, 6.4), false);
  assert.equal(meetsMabims(3, 6.399), false);
  assert.equal(meetsMabims(5, Number.NaN), false);
});

test('an eclipse in progress below the local horizon is not labelled LIVE', () => {
  // The 3 March 2026 lunar eclipse starts before moonrise in Tasikmalaya.
  const tasik = SITES.find((site) => site.id === 'tasik');
  const event = eclipseTimeline(new Date('2026-03-03T08:46:00Z'), tasik).find((item) => item.body === 'Moon');
  assert.equal(event.withinContacts, true);
  assert.equal(event.visible, true); // A later part of the contact sequence is observable.
  assert.equal(event.currentVisible, false);
  assert.equal(event.active, false);
  assert.equal(event.phase, 'below-horizon');
  assert.ok(event.progress > 0 && event.progress < 1);
  assert.ok(event.contacts.current < 0);
});

test('an eclipse that continues after moonset stops being labelled LIVE', () => {
  const tasik = SITES.find((site) => site.id === 'tasik');
  const event = eclipseTimeline(new Date('2027-02-21T01:12:00Z'), tasik).find((item) => item.body === 'Moon');
  assert.equal(event.withinContacts, true);
  assert.equal(event.visible, true); // Earlier contacts were observable before moonset.
  assert.equal(event.currentVisible, false);
  assert.equal(event.active, false);
  assert.equal(event.phase, 'below-horizon');
  assert.ok(event.progress > 0.9);
  assert.ok(event.contacts.current < 0);
});

test('Ad-Durrul Aniq negative-altitude rule follows the published Syakban 1434 Sampang example', () => {
  const sampang = { id: 'sampang', city: 'Sampang', region: 'Jawa Timur', site: 'Sampang', lat: -7.2, lon: 113.25, elev: 5, offset: 7 };
  const result = calculateHisab({ start: '2013-07-09', day: 1, month: 9, year: 1434 }, sampang);
  const kitab = result.models.adDurrul;
  // Ad-Durrul Aniq hlm. 28–30: hc−P negatif tidak ditambah Ref, Dip, dan sdc.
  assert.ok(kitab.parallaxCorrectedAltitude < 0);
  assert.equal(kitab.secondaryCorrectionsApplied, false);
  assert.equal(kitab.muktsulApplicable, true);
  assert.ok(kitab.muktsulMinutes > 0); // hc positif meskipun hc−P dan hc′ negatif.
  assert.equal(kitab.topocentricAltitude, kitab.parallaxCorrectedAltitude);
  assert.ok(Math.abs(kitab.topocentricAltitude - (-(21 / 60 + 7 / 3600))) < 0.12);
  assert.ok(Math.abs(kitab.elongation - (4 + 40 / 60 + 40 / 3600)) < 0.08);
});

test('Ad-Durrul Aniq does not invent muktsul or moonset when geocentric altitude is non-positive', () => {
  const tasik = SITES.find((site) => site.id === 'tasik');
  const result = calculateHisab({ start: '2026-07-15', day: 1, month: 2, year: 1448 }, tasik);
  const kitab = result.models.adDurrul;
  assert.ok(kitab.geocentricAltitude <= 0);
  assert.equal(kitab.muktsulApplicable, false);
  assert.equal(kitab.muktsulMinutes, null);
  assert.equal(kitab.estimatedMoonset, null);
});

test('Ad-Durrul Aniq model supports western time zones using the Vancouver 1434 example', () => {
  const vancouver = { id: 'vancouver', city: 'Vancouver', region: 'Canada', site: 'Vancouver', lat: 49.25, lon: -(123 + 10 / 60), elev: 0, offset: -8 };
  const result = calculateHisab({ start: '2013-01-13', day: 1, month: 3, year: 1434 }, vancouver);
  const kitab = result.models.adDurrul;
  assert.equal(clock(result.conj, vancouver), '11:44');
  assert.equal(clock(result.sunset, vancouver), '16:37');
  assert.ok(Math.abs(kitab.geocentricAltitude - (4 + 31 / 60 + 24 / 3600)) < 0.3);
  assert.ok(Math.abs(kitab.topocentricAltitude - (3 + 25 / 60 + 20 / 3600)) < 0.3);
  assert.ok(Math.abs(kitab.elongation - (5 + 25 / 60 + 36 / 3600)) < 0.3);
});

test('Ad-Durrul Aniq correction model follows the published Ramadan 1434 Banyuwangi example', () => {
  const palengkung = {
    id: 'palengkung', city: 'Banyuwangi', region: 'Jawa Timur', site: 'Trianggulasi Palengkung',
    lat: -(8 + 39 / 60 + 26.52 / 3600), lon: 114 + 21 / 60 + 41.1 / 3600, elev: 2, offset: 7,
  };
  const result = calculateHisab({ start: '2013-08-08', day: 1, month: 10, year: 1434 }, palengkung);
  const kitab = result.models.adDurrul;
  assert.ok(Number.isFinite(result.comparison.altitudeDifference));
  assert.ok(Number.isFinite(result.comparison.elongationDifference));
  assert.match(result.comparison.note, /Diagnostic only/);
  assert.equal('agreement' in result.comparison, false);
  assert.equal(result.audit.kitabModelStatus, 'hybrid-corrections');
  assert.match(result.audit.verifiedKitabScope, /hc′/);
  assert.match(result.audit.pendingKitabScope, /Nurul Hilal/);
  // Ad-Durrul Aniq terjemahan Kemenag 2025, hlm. 39–43.
  assert.ok(Math.abs(kitab.geocentricAltitude - (4 + 13 / 60 + 11 / 3600)) < 0.06);
  assert.ok(Math.abs(kitab.topocentricAltitude - (3 + 17 / 60 + 16 / 3600)) < 0.06);
  assert.ok(Math.abs(kitab.elongation - (7 + 40 / 60 + 2 / 3600)) < 0.03);
  assert.ok(Math.abs(kitab.illumination - 0.45) < 0.03);
  assert.ok(Math.abs(kitab.azimuthDifference - (-(5 + 43 / 60 + 49 / 3600))) < 0.03);
});

test('group IDs are generated as stable URL-safe slugs', () => {
  assert.equal(groupSlug('Falak Tasikmalaya'), 'falak-tasikmalaya');
  assert.equal(groupSlug('Kelompok Falak: Jawa Barat'), 'kelompok-falak-jawa-barat');
  assert.equal(groupSlug('   '), '');
  assert.equal(groupSlug(null), '');
});

test('institution application normalization rejects incomplete and unsafe data', async () => {
  const { normalizeInstitutionApplication } = await import('../worker/index.js');
  const valid = normalizeInstitutionApplication({
    institution: 'Pesantren Falak', type: 'pesantren_madrasah', region: 'Tasikmalaya',
    representative: 'Ahmad', position: 'Pengasuh', contact: 'sekretariat@example.org',
    website: 'https://example.org', purpose: 'Kolaborasi rukyat',
  });
  assert.equal(valid.institution, 'Pesantren Falak');
  assert.equal(normalizeInstitutionApplication({ ...valid, type: 'unknown' }), null);
  assert.equal(normalizeInstitutionApplication({ ...valid, website: 'javascript:alert(1)' }), null);
  assert.equal(normalizeInstitutionApplication({ ...valid, institution: ' ' }), null);
});

test('institution applications cannot be reviewed by their own applicant', async () => {
  const { canReviewInstitutionApplication } = await import('../worker/index.js');
  const application = { applicant_user_id: 'applicant-1', status: 'pending' };
  assert.equal(canReviewInstitutionApplication(application, { id: 'applicant-1', role: 'admin' }), false);
  assert.equal(canReviewInstitutionApplication(application, { id: 'reviewer-1', role: 'reviewer' }), true);
  assert.equal(canReviewInstitutionApplication({ ...application, status: 'revision' }, { id: 'reviewer-1', role: 'reviewer' }), true);
  assert.equal(canReviewInstitutionApplication(application, { id: 'member-1', role: 'observer' }), false);
  assert.equal(canReviewInstitutionApplication({ ...application, status: 'approved' }, { id: 'reviewer-1', role: 'reviewer' }), false);
});

test('institution application endpoint requires an authenticated account', async () => {
  const response = await worker.fetch(new Request('https://pfi.test/api/institution-applications', { method: 'GET' }), {}, {});
  assert.equal(response.status, 401);
});
