import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { canViewPost } from '../worker/index.js';

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
