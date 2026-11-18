import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { canReviewEntity, canViewGroup, canViewPost, normalizeRukyatDetails, uploadContentLengthStatus } from '../worker/index.js';
import { SITES, calculateHisab, clock, lunar, sunsetTime } from '../src/lib/astro.js';

test('Worker health endpoint reports Cloudflare runtime', async () => {
  const response = await worker.fetch(new Request('https://pfi.test/api/health'), {}, {});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.runtime, 'cloudflare-workers');
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
  assert.equal(normalizeRukyatDetails({ latitude: '91', longitude: '0', observedAt: '2026-11-19T18:30:00Z' }), null);
  assert.equal(normalizeRukyatDetails({ latitude: true, longitude: '0', observedAt: '2026-11-19T18:30:00Z' }), null);
  assert.equal(normalizeRukyatDetails({ latitude: '0', longitude: '0', observedAt: '2026-11-19T18:30:00Z', elevation: '9001' }), null);
});


test('sunset calculation uses a real local horizon event and rejects invalid dates', () => {
  assert.equal(sunsetTime('not-a-date', SITES[0]), null);
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
