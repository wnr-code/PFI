// PFI — Pusat Falak Indonesia | Maintainer: @wnr-code
// Repository: https://github.com/wnr-code/PFI
// Project support: https://trakteer.id/lanteraku/tip
// AI-assisted implementation; reviewed and maintained by the project maintainer.
import { SITES, calculateHisab, hijri, localTime } from '../src/lib/astro.js';

/**
 * PFI Cloudflare Worker API (migration phase 1).
 *
 * This Worker intentionally exposes only endpoints that have been ported and
 * tested at this stage. Do not point production traffic at it until the
 * remaining legacy routes have been migrated and integration-tested.
 *
 * Required Worker vars/secrets:
 *   SUPABASE_URL, SUPABASE_ANON_KEY
 * Bindings:
 *   falaq (D1), r2falaq (R2)
 */

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function fail(status, message) {
  return json({ error: message }, status);
}

function uuid() {
  return crypto.randomUUID();
}

async function identity(request, env) {
  const value = request.headers.get('authorization') || '';
  const match = value.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase identity verification is not configured.');
  }

  // Ask Supabase Auth to validate the access token. Never trust user metadata
  // or decode a JWT without verifying its signature.
  const response = await fetch(new URL('/auth/v1/user', env.SUPABASE_URL), {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${match[1]}`,
    },
  });
  if (!response.ok) return null;
  const user = await response.json();
  if (!user?.id || !user?.email) return null;
  return { id: user.id, email: user.email, name: user.user_metadata?.name || user.user_metadata?.full_name || user.email };
}

async function profileFor(request, env) {
  const who = await identity(request, env);
  if (!who) return null;

  await env.falaq.prepare(`
    INSERT INTO users (id, email, name, created)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = CASE WHEN users.name = '' THEN excluded.name ELSE users.name END,
      updated = datetime('now')
  `).bind(who.id, who.email, who.name).run();

  return await env.falaq.prepare(
    'SELECT id,email,name,org,bio,role,verification,review_note,created,prefs FROM users WHERE id = ?'
  ).bind(who.id).first();
}

async function postView(env, post, userId) {
  const [photo, likes, comments, liked] = await Promise.all([
    env.falaq.prepare('SELECT id,sha256 FROM photos WHERE post_id = ?').bind(post.id).first(),
    env.falaq.prepare('SELECT COUNT(*) AS n FROM likes WHERE post_id = ?').bind(post.id).first(),
    env.falaq.prepare(`
      SELECT c.id,c.body AS text,c.created AS date,u.name AS author
      FROM comments c JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ? ORDER BY c.created LIMIT 150
    `).bind(post.id).all(),
    userId
      ? env.falaq.prepare('SELECT 1 AS yes FROM likes WHERE post_id = ? AND user_id = ?').bind(post.id, userId).first()
      : null,
  ]);
  let details = {};
  try { details = JSON.parse(post.details || '{}'); } catch { details = {}; }
  return {
    ...details,
    id: post.id,
    author: post.author,
    authorId: post.user_id,
    type: post.type,
    title: post.title,
    body: post.body,
    city: post.city,
    group: post.group_id || '',
    date: post.created,
    status: post.status,
    reviewNote: post.review_note,
    photo: photo ? `/api/photos/${photo.id}` : null,
    photoHash: photo?.sha256 || null,
    initial: (post.author || 'PFI').split(' ').slice(0, 2).map((part) => part[0]).join(''),
    likes: likes?.n || 0,
    liked: Boolean(liked),
    comments: comments?.results || [],
  };
}

async function getPosts(request, env, profile) {
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
  // Pending rukyat reports are private to their author and reviewers.
  // Public visitors only see reports after a reviewer verifies them.
  const rows = profile && ['reviewer', 'admin'].includes(profile.role)
    ? await env.falaq.prepare(
        'SELECT * FROM posts ORDER BY created DESC LIMIT ?'
      ).bind(limit).all()
    : profile
      ? await env.falaq.prepare(`
          SELECT * FROM posts
          WHERE type != 'rukyat' OR status = 'verified' OR user_id = ?
          ORDER BY created DESC LIMIT ?
        `).bind(profile.id, limit).all()
      : await env.falaq.prepare(`
          SELECT * FROM posts
          WHERE type != 'rukyat' OR status = 'verified'
          ORDER BY created DESC LIMIT ?
        `).bind(limit).all();
  const result = [];
  for (const row of rows.results || []) result.push(await postView(env, row, profile?.id));
  return json(result);
}

async function uploadPostPhoto(request, env, postId) {
  const profile = await profileFor(request, env);
  if (!profile) return fail(401, 'Silakan masuk untuk mengunggah foto.');

  const post = await env.falaq.prepare(
    'SELECT id,user_id,type FROM posts WHERE id = ?'
  ).bind(postId).first();
  if (!post) return fail(404, 'Laporan tidak ditemukan.');
  if (post.type !== 'rukyat') return fail(400, 'Lampiran foto hanya tersedia untuk laporan rukyat.');
  if (post.user_id !== profile.id && profile.role !== 'admin') {
    return fail(403, 'Anda tidak memiliki izin untuk melampirkan foto pada laporan ini.');
  }

  const existing = await env.falaq.prepare(
    'SELECT id FROM photos WHERE post_id = ?'
  ).bind(postId).first();
  if (existing) return fail(409, 'Laporan ini sudah memiliki lampiran foto.');

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 3 * 1024 * 1024 + 65536) return fail(413, 'Ukuran foto maksimal 3 MB.');
  const form = await request.formData();
  const file = form.get('photo');
  if (!file || typeof file.arrayBuffer !== 'function') return fail(400, 'Pilih satu berkas foto terlebih dahulu.');
  if (file.size < 1 || file.size > 3 * 1024 * 1024) return fail(413, 'Ukuran foto maksimal 3 MB.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const starts = (...values) => values.every((value, index) => bytes[index] === value);
  let mime = '';
  if (starts(0xff, 0xd8, 0xff)) mime = 'image/jpeg';
  else if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) mime = 'image/png';
  else if (bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') mime = 'image/webp';
  if (!mime) return fail(415, 'Format foto harus JPEG, PNG, atau WebP.');

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  const id = uuid();
  const objectKey = `posts/${postId}/${id}`;
  await env.r2falaq.put(objectKey, bytes, {
    httpMetadata: { contentType: mime, cacheControl: 'public, max-age=86400' },
    customMetadata: { postId, uploadedBy: profile.id, sha256 },
  });

  try {
    await env.falaq.prepare(
      'INSERT INTO photos (id,post_id,mime,sha256,object_key,size_bytes,created) VALUES (?,?,?,?,?,?,?)'
    ).bind(id, postId, mime, sha256, objectKey, bytes.byteLength, new Date().toISOString()).run();
  } catch (error) {
    await env.r2falaq.delete(objectKey);
    throw error;
  }
  return json({ id, photo: `/api/photos/${id}`, mime, size: bytes.byteLength, sha256 }, 201);
}

async function getPhoto(env, id) {
  const meta = await env.falaq.prepare(
    'SELECT mime,object_key,size_bytes FROM photos WHERE id = ?'
  ).bind(id).first();
  if (!meta) return fail(404, 'Foto tidak ditemukan.');
  const object = await env.r2falaq.get(meta.object_key);
  if (!object) return fail(404, 'Berkas foto tidak ditemukan.');
  return new Response(object.body, {
    headers: {
      'content-type': meta.mime,
      'content-length': String(meta.size_bytes),
      'cache-control': 'public, max-age=86400',
      'x-content-type-options': 'nosniff',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...JSON_HEADERS, allow: 'GET,POST,PUT,DELETE,OPTIONS' } });
    }

    try {
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return json({ status: 'ok', runtime: 'cloudflare-workers', database: 'd1', storage: 'r2', migrationPhase: 1 });
      }

      if (url.pathname === '/api/session' && request.method === 'GET') {
        const profile = await profileFor(request, env);
        if (!profile) return json({ account: null, groups: [], history: [] });
        const [memberships, calculations] = await Promise.all([
          env.falaq.prepare('SELECT group_id FROM memberships WHERE user_id = ?').bind(profile.id).all(),
          env.falaq.prepare('SELECT result FROM calculations WHERE user_id = ? ORDER BY created DESC LIMIT 100').bind(profile.id).all(),
        ]);
        return json({
          account: {
            id: profile.id, name: profile.name, email: profile.email,
            org: profile.org, bio: profile.bio, role: profile.role,
            verification: profile.verification, reviewNote: profile.review_note,
            created: profile.created,
          },
          prefs: JSON.parse(profile.prefs || '{}'),
          groups: (memberships.results || []).map((row) => row.group_id),
          history: (calculations.results || []).map((row) => {
            try { return JSON.parse(row.result); } catch { return null; }
          }).filter(Boolean),
        });
      }

      if (url.pathname === '/api/hisab' && request.method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') return fail(400, 'Data permintaan tidak valid.');
        const site = SITES.find((item) => item.id === body.site);
        if (!site) return fail(400, 'Lokasi pengamatan tidak dikenal.');
        const start = body.start;
        if (typeof start !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(start) || start < '1900-01-01' || start > '2099-12-31') {
          return fail(400, 'Tanggal di luar rentang.');
        }
        const date = localTime(start, '12:00', site);
        if (!Number.isFinite(date.getTime())) return fail(400, 'Tanggal tidak valid.');
        const period = hijri(date, site);
        if (period.day !== 1) return fail(400, 'Pilih hari pertama bulan Hijriah.');
        const method = body.method;
        if (!['mabims', 'geometri'].includes(method)) return fail(400, 'Metode hisab tidak valid.');
        const result = calculateHisab({ start, ...period }, site, method);
        result.engine = 'Astronomy Engine 2.1.19';

        const profile = await profileFor(request, env);
        if (profile) {
          await env.falaq.prepare(
            'INSERT INTO calculations (id,user_id,result,created) VALUES (?,?,?,?)'
          ).bind(result.id, profile.id, JSON.stringify(result), result.created).run();
        }
        return json(result, 200);
      }

      if (url.pathname === '/api/posts' && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk mengirim laporan.');
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') return fail(400, 'Data laporan tidak valid.');
        const type = body.type;
        if (!['rukyat','diskusi','tanya'].includes(type)) return fail(400, 'Jenis laporan tidak valid.');
        const title = String(body.title || '').trim().slice(0, 120);
        const content = String(body.body || '').trim().slice(0, 5000);
        const city = String(body.city || '').trim().slice(0, 100);
        if (!title || !content || !city) return fail(400, 'Judul, isi laporan, dan lokasi wajib diisi.');
        let details = {};
        if (body.details && typeof body.details === 'object' && !Array.isArray(body.details)) details = body.details;
        if (type === 'rukyat') {
          const lat = Number(details.latitude);
          const lon = Number(details.longitude);
          if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
            return fail(400, 'Koordinat lintang dan bujur wajib valid untuk laporan rukyat.');
          }
          if (!details.observedAt || Number.isNaN(Date.parse(details.observedAt))) return fail(400, 'Waktu pengamatan wajib diisi.');
          details = {
            latitude: lat, longitude: lon,
            observedAt: String(details.observedAt),
            weather: String(details.weather || '').slice(0, 80),
            instrument: String(details.instrument || '').slice(0, 120),
            visibility: String(details.visibility || '').slice(0, 80),
            elevation: Number.isFinite(Number(details.elevation)) ? Number(details.elevation) : null,
          };
        }
        // Validate optional group membership target before writing so invalid IDs
        // return a client error instead of surfacing as an opaque D1 failure.
        let groupId = null;
        if (body.groupId) {
          groupId = String(body.groupId).slice(0, 80);
          const group = await env.falaq.prepare('SELECT id FROM groups WHERE id = ?').bind(groupId).first();
          if (!group) return fail(400, 'Kelompok tujuan tidak ditemukan.');
          const membership = await env.falaq.prepare(
            'SELECT 1 AS yes FROM memberships WHERE group_id = ? AND user_id = ?'
          ).bind(groupId, profile.id).first();
          if (!membership && profile.role !== 'admin') return fail(403, 'Anda belum menjadi anggota kelompok ini.');
        }

        const id = uuid();
        const created = new Date().toISOString();
        await env.falaq.prepare(`
          INSERT INTO posts (id,user_id,author,type,title,body,city,details,group_id,status,created)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)
        `).bind(id, profile.id, profile.name, type, title, content, city, JSON.stringify(details), groupId, type === 'rukyat' ? 'pending' : '', created).run();
        const row = await env.falaq.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
        return json(await postView(env, row, profile.id), 201);
      }

      if (url.pathname === '/api/posts' && request.method === 'GET') {
        const profile = await profileFor(request, env);
        return await getPosts(request, env, profile);
      }

      const postPhotoMatch = url.pathname.match(/^\/api\/posts\/([a-zA-Z0-9_-]+)\/photo$/);
      if (postPhotoMatch && request.method === 'POST') {
        return await uploadPostPhoto(request, env, postPhotoMatch[1]);
      }

      const photoMatch = url.pathname.match(/^\/api\/photos\/([a-zA-Z0-9_-]+)$/);
      if (photoMatch && request.method === 'GET') return await getPhoto(env, photoMatch[1]);

      const likeMatch = url.pathname.match(/^\/api\/posts\/([a-zA-Z0-9_-]+)\/like$/);
      if (likeMatch && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk menyukai postingan.');
        const post = await env.falaq.prepare('SELECT id FROM posts WHERE id = ?').bind(likeMatch[1]).first();
        if (!post) return fail(404, 'Postingan tidak ditemukan.');
        const body = await request.json().catch(() => null);
        if (body?.liked === true) {
          await env.falaq.prepare('INSERT OR IGNORE INTO likes (post_id,user_id) VALUES (?,?)').bind(post.id, profile.id).run();
        } else {
          await env.falaq.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').bind(post.id, profile.id).run();
        }
        const row = await env.falaq.prepare('SELECT * FROM posts WHERE id = ?').bind(post.id).first();
        return json(await postView(env, row, profile.id));
      }

      const commentsMatch = url.pathname.match(/^\/api\/posts\/([a-zA-Z0-9_-]+)\/comments$/);
      if (commentsMatch && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk berkomentar.');
        const post = await env.falaq.prepare('SELECT * FROM posts WHERE id = ?').bind(commentsMatch[1]).first();
        if (!post) return fail(404, 'Postingan tidak ditemukan.');
        const body = await request.json().catch(() => null);
        const value = typeof body?.text === 'string' ? body.text.trim() : '';
        if (!value || value.length > 1400) return fail(400, 'Komentar wajib diisi dan maksimal 1.400 karakter.');
        if (post.type === 'rukyat' && post.status !== 'verified' && post.user_id !== profile.id && !['reviewer','admin'].includes(profile.role)) {
          return fail(404, 'Postingan tidak ditemukan.');
        }
        await env.falaq.prepare(
          'INSERT INTO comments (id,post_id,user_id,body,created) VALUES (?,?,?,?,?)'
        ).bind(uuid(), post.id, profile.id, value, new Date().toISOString()).run();
        const updated = await env.falaq.prepare('SELECT * FROM posts WHERE id = ?').bind(post.id).first();
        return json(await postView(env, updated, profile.id), 201);
      }

      const groupJoinMatch = url.pathname.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)$/);
      if (groupJoinMatch && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk bergabung dengan kelompok.');
        const groupId = groupJoinMatch[1];
        const group = await env.falaq.prepare('SELECT id FROM groups WHERE id = ?').bind(groupId).first();
        if (!group) return fail(404, 'Kelompok tidak ditemukan.');
        const body = await request.json().catch(() => null);
        if (body?.join === true) {
          await env.falaq.prepare('INSERT OR IGNORE INTO memberships (group_id,user_id) VALUES (?,?)').bind(groupId, profile.id).run();
        } else {
          await env.falaq.prepare('DELETE FROM memberships WHERE group_id = ? AND user_id = ?').bind(groupId, profile.id).run();
          await env.falaq.prepare('DELETE FROM group_coordinators WHERE group_id = ? AND user_id = ?').bind(groupId, profile.id).run();
        }
        const memberships = await env.falaq.prepare('SELECT group_id FROM memberships WHERE user_id = ?').bind(profile.id).all();
        return json({ groups: (memberships.results || []).map((row) => row.group_id) });
      }

      if (url.pathname === '/api/groups' && request.method === 'GET') {
        const rows = await env.falaq.prepare(`
          SELECT g.id,g.name,g.description,COUNT(m.user_id) AS members
          FROM groups g LEFT JOIN memberships m ON m.group_id = g.id
          GROUP BY g.id,g.name,g.description ORDER BY g.name
        `).all();
        return json(rows.results || []);
      }

      // Fail explicitly rather than silently sending unsupported writes to a
      // partially migrated backend. Remaining endpoints are ported in phases.
      if (url.pathname.startsWith('/api/')) {
        return fail(501, 'Fitur ini sedang dalam proses migrasi ke Cloudflare Workers.');
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error('PFI Worker error:', error?.message || error);
      return fail(500, 'Layanan PFI belum dapat menyelesaikan permintaan.');
    }
  },
};
