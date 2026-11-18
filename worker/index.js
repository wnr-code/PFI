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
  const rows = await env.falaq.prepare(
    'SELECT * FROM posts ORDER BY created DESC LIMIT ?'
  ).bind(limit).all();
  const result = [];
  for (const row of rows.results || []) result.push(await postView(env, row, profile?.id));
  return json(result);
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
        return json(profile ? {
          account: {
            id: profile.id, name: profile.name, email: profile.email,
            org: profile.org, bio: profile.bio, role: profile.role,
            verification: profile.verification, reviewNote: profile.review_note,
            created: profile.created,
          },
          prefs: JSON.parse(profile.prefs || '{}'),
        } : { account: null });
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

      if (url.pathname === '/api/posts' && request.method === 'GET') {
        const profile = await profileFor(request, env);
        return await getPosts(request, env, profile);
      }

      const photoMatch = url.pathname.match(/^\/api\/photos\/([a-zA-Z0-9_-]+)$/);
      if (photoMatch && request.method === 'GET') return await getPhoto(env, photoMatch[1]);

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
