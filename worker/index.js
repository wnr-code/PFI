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

function fail(status, message, diagnostic = null) {
  return json({ error: message, ...(diagnostic || {}) }, status);
}

function publicDiagnostic(error) {
  const message = String(error?.message || error || 'Unknown error');
  if (/UNIQUE constraint failed/i.test(message)) return { code: 'DATABASE_UNIQUE_CONFLICT', detail: 'Data akun bertabrakan dengan akun yang sudah tersimpan.' };
  if (/no such table|no such column|has no column named/i.test(message)) return { code: 'DATABASE_SCHEMA_MISMATCH', detail: 'Struktur basis data Production belum sesuai dengan aplikasi.' };
  if (/D1|SQLITE|database/i.test(message)) return { code: 'DATABASE_OPERATION_FAILED', detail: 'Penyimpanan profil akun gagal diproses.' };
  if (/Supabase identity verification is not configured/i.test(message)) return { code: 'IDENTITY_NOT_CONFIGURED', detail: 'Konfigurasi verifikasi identitas belum lengkap.' };
  if (/fetch|network|upstream/i.test(message)) return { code: 'IDENTITY_UPSTREAM_FAILED', detail: 'Layanan verifikasi identitas tidak dapat dihubungi.' };
  return { code: 'INTERNAL_ERROR', detail: 'Terjadi kesalahan internal yang belum dikenali.' };
}

// Accept both Worker runtime names and the existing Vite-prefixed names.
// These values must be configured as runtime bindings in Cloudflare Preview;
// build-time frontend variables alone are not exposed to the Worker.
function supabaseRuntimeConfig(env) {
  return {
    url: String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim(),
    anonKey: String(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim(),
  };
}

// Pending rukyat reports are private to their owner and authorized reviewers.
export function canViewPost(post, profile) {
  if (post?.type !== 'rukyat' || post.status === 'verified') return true;
  return Boolean(profile && (profile.id === post.user_id || ['reviewer', 'admin'].includes(profile.role)));
}

async function canAccessPost(env, post, profile) {
  if (!canViewPost(post, profile)) return false;
  if (!post?.group_id) return true;
  if (!profile) return false;
  if (['reviewer', 'admin'].includes(profile.role)) return true;
  const membership = await env.falaq.prepare(
    'SELECT 1 AS yes FROM memberships WHERE group_id=? AND user_id=?'
  ).bind(post.group_id, profile.id).first();
  return Boolean(membership);
}

// Validate the optional transport length before parsing multipart form data.
export function uploadContentLengthStatus(header) {
  if (header === null) return 0; // Some runtimes do not expose Content-Length.
  const length = Number(header);
  if (!Number.isSafeInteger(length) || length < 1) return 400;
  return length > 3 * 1024 * 1024 + 65536 ? 413 : 0;
}

// Group data is visible only to members and authorized reviewers/admins.
export function canViewGroup(profile, isMember) {
  return Boolean(profile && (isMember || ['reviewer', 'admin'].includes(profile.role)));
}

export function groupSlug(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}


const INSTITUTION_TYPES = new Set([
  'pesantren_madrasah', 'organisasi_kemasyarakatan', 'perguruan_tinggi',
  'observatorium_komunitas', 'lembaga_pemerintah', 'lainnya',
]);

export function normalizeInstitutionApplication(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const fields = {
    institution: [body.institution, 160],
    type: [body.type, 40],
    region: [body.region, 160],
    representative: [body.representative, 120],
    position: [body.position, 120],
    contact: [body.contact, 160],
    website: [body.website || '', 240],
    purpose: [body.purpose || '', 1000],
  };
  const values = {};
  for (const [key, [value, max]] of Object.entries(fields)) {
    if (typeof value !== 'string' || value.trim().length > max) return null;
    values[key] = value.trim();
  }
  if (!values.institution || !INSTITUTION_TYPES.has(values.type) ||
      !values.region || !values.representative || !values.position ||
      !values.contact || values.contact.length < 5) return null;
  if (values.website) {
    try {
      const url = new URL(values.website);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
    } catch { return null; }
  }
  return values;
}

export function canReviewInstitutionApplication(application, profile) {
  return Boolean(application && profile &&
    ['reviewer', 'admin'].includes(profile.role) &&
    application.applicant_user_id !== profile.id &&
    ['pending', 'revision'].includes(application.status));
}

// Normalize observation metadata before it enters the scientific record.
// Coordinates must be explicit; timestamps must carry a timezone/UTC offset.
export function normalizeRukyatDetails(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return null;
  if (!['number', 'string'].includes(typeof details.latitude) ||
      !['number', 'string'].includes(typeof details.longitude) ||
      String(details.latitude).trim() === '' || String(details.longitude).trim() === '') return null;

  const latitude = Number(details.latitude);
  const longitude = Number(details.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;

  const observedAt = typeof details.observedAt === 'string' ? details.observedAt.trim() : '';
  const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!timestampPattern.test(observedAt) || !Number.isFinite(Date.parse(observedAt))) return null;
  const datePart = observedAt.slice(0, 10);
  const validCalendarDate = new Date(`${datePart}T12:00:00.000Z`);
  if (!Number.isFinite(validCalendarDate.getTime()) || validCalendarDate.toISOString().slice(0, 10) !== datePart) return null;

  const zoneOffsets = { WIB: 420, WITA: 480, WIT: 540 };
  const timeZone = details.timeZone;
  const offsetMatch = observedAt.match(/([+-])(\d{2}):(\d{2})$/);
  if (!Object.hasOwn(zoneOffsets, timeZone) || !offsetMatch) return null;
  const sign = offsetMatch[1] === '-' ? -1 : 1;
  const utcOffsetMinutes = sign * (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3]));
  if (utcOffsetMinutes !== zoneOffsets[timeZone]) return null;

  let accuracyMeters = null;
  if (details.accuracyMeters !== null && details.accuracyMeters !== undefined && String(details.accuracyMeters).trim() !== '') {
    accuracyMeters = Number(details.accuracyMeters);
    if (!Number.isFinite(accuracyMeters) || accuracyMeters < 0 || accuracyMeters > 100000) return null;
  }

  let elevation = null;
  if (details.elevation !== null && details.elevation !== undefined && String(details.elevation).trim() !== '') {
    if (!['number', 'string'].includes(typeof details.elevation)) return null;
    elevation = Number(details.elevation);
    if (!Number.isFinite(elevation) || elevation < -500 || elevation > 9000) return null;
  }

  return {
    latitude,
    longitude,
    observedAt: new Date(observedAt).toISOString(),
    timeZone,
    utcOffsetMinutes,
    weather: String(details.weather || '').slice(0, 80),
    instrument: String(details.instrument || '').slice(0, 120),
    visibility: String(details.visibility || '').slice(0, 80),
    elevation,
    accuracyMeters,
  };
}

// Only reviewers/admins may moderate, and never their own account or report.
export function canReviewEntity(entity, item, profile) {
  if (!item || !profile || !['reviewer', 'admin'].includes(profile.role)) return false;
  if (entity === 'users') return item.id !== profile.id;
  if (entity === 'posts') return item.user_id !== profile.id;
  return false;
}

function uuid() {
  return crypto.randomUUID();
}

async function identity(request, env) {
  const value = request.headers.get('authorization') || '';
  const match = value.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const auth = supabaseRuntimeConfig(env);
  if (!auth.url || !auth.anonKey) {
    throw new Error('Supabase identity verification is not configured.');
  }

  // Ask Supabase Auth to validate the access token. Never trust user metadata
  // or decode a JWT without verifying its signature.
  const response = await fetch(new URL('/auth/v1/user', auth.url), {
    headers: {
      apikey: auth.anonKey,
      authorization: `Bearer ${match[1]}`,
    },
  });
  if (!response.ok) return null;
  const user = await response.json();
  if (!user?.id || !user?.email) return null;
  return { id: user.id, email: user.email, name: user.user_metadata?.name || user.user_metadata?.full_name || user.email };
}

const requiredUserColumns = {
  name: "TEXT NOT NULL DEFAULT ''",
  org: "TEXT NOT NULL DEFAULT ''",
  bio: "TEXT NOT NULL DEFAULT ''",
  role: "TEXT NOT NULL DEFAULT 'observer'",
  verification: "TEXT NOT NULL DEFAULT 'none'",
  evidence: "TEXT NOT NULL DEFAULT ''",
  review_note: "TEXT NOT NULL DEFAULT ''",
  prefs: "TEXT NOT NULL DEFAULT '{}'",
  created: "TEXT NOT NULL DEFAULT ''",
  updated: "TEXT NOT NULL DEFAULT ''",
};

// Early Production used an older users table. CREATE TABLE IF NOT EXISTS does
// not add newer columns, so upgrade only the missing, statically defined fields
// while preserving every existing account and related row.
export async function ensureUserSchema(database) {
  if (!database?.prepare) throw new Error('D1 binding is unavailable');
  const result = await database.prepare('PRAGMA table_info(users)').all();
  const existing = new Set((result.results || []).map((column) => column.name));
  if (!existing.has('id') || !existing.has('email')) {
    throw new Error('D1 schema mismatch: users.id and users.email are required');
  }
  for (const [column, definition] of Object.entries(requiredUserColumns)) {
    if (!existing.has(column)) {
      await database.prepare(`ALTER TABLE users ADD COLUMN ${column} ${definition}`).run();
    }
  }
}

async function profileFor(request, env) {
  const who = await identity(request, env);
  if (!who) return null;

  await ensureUserSchema(env.falaq);
  await env.falaq.prepare(`
    INSERT INTO users (id, email, name, created)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = CASE WHEN users.name = '' THEN excluded.name ELSE users.name END,
      updated = datetime('now')
    WHERE users.email != excluded.email OR users.name = ''
  `).bind(who.id, who.email, who.name).run();

  return await env.falaq.prepare(
    'SELECT id,email,name,org,bio,role,verification,review_note,created,prefs FROM users WHERE id = ?'
  ).bind(who.id).first();
}

async function postView(env, post, profile) {
  const userId = profile?.id;
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
    reviewNote: profile && (profile.id === post.user_id || ['reviewer', 'admin'].includes(profile.role)) ? post.review_note : '',
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
          WHERE (group_id IS NULL OR EXISTS (
            SELECT 1 FROM memberships m WHERE m.group_id=posts.group_id AND m.user_id=?
          ))
          AND (type != 'rukyat' OR status = 'verified' OR user_id = ?)
          ORDER BY created DESC LIMIT ?
        `).bind(profile.id, profile.id, limit).all()
      : await env.falaq.prepare(`
          SELECT * FROM posts
          WHERE group_id IS NULL AND (type != 'rukyat' OR status = 'verified')
          ORDER BY created DESC LIMIT ?
        `).bind(limit).all();
  const result = [];
  for (const row of rows.results || []) result.push(await postView(env, row, profile));
  return json(result);
}

async function uploadPostPhoto(request, env, postId) {
  const profile = await profileFor(request, env);
  if (!profile) return fail(401, 'Silakan masuk untuk mengunggah foto.');

  const post = await env.falaq.prepare(
    'SELECT id,user_id,type,group_id FROM posts WHERE id = ?'
  ).bind(postId).first();
  if (!post) return fail(404, 'Laporan tidak ditemukan.');
  if (post.type !== 'rukyat') return fail(400, 'Lampiran foto hanya tersedia untuk laporan rukyat.');
  if (post.user_id !== profile.id && profile.role !== 'admin') {
    return fail(403, 'Anda tidak memiliki izin untuk melampirkan foto pada laporan ini.');
  }
  if (post.group_id && !await canAccessPost(env, post, profile)) {
    return fail(403, 'Anda bukan anggota kelompok laporan ini.');
  }

  const existing = await env.falaq.prepare(
    'SELECT id FROM photos WHERE post_id = ?'
  ).bind(postId).first();
  if (existing) return fail(409, 'Laporan ini sudah memiliki lampiran foto.');

  const lengthStatus = uploadContentLengthStatus(request.headers.get('content-length'));
  if (lengthStatus === 400) return fail(400, 'Header ukuran unggahan tidak valid.');
  if (lengthStatus === 413) return fail(413, 'Ukuran foto maksimal 3 MB.');
  if (!env.r2falaq || typeof env.r2falaq.put !== 'function') {
    return fail(503, 'Penyimpanan foto belum dikonfigurasi.');
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    return fail(400, 'Formulir unggahan foto tidak valid.');
  }
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
    httpMetadata: { contentType: mime, cacheControl: 'private, no-store' },
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

async function getPhoto(request, env, id) {
  const meta = await env.falaq.prepare(
    `SELECT ph.mime,ph.object_key,ph.size_bytes,p.user_id,p.status,p.type,p.group_id
     FROM photos ph JOIN posts p ON p.id = ph.post_id
     WHERE ph.id = ?`
  ).bind(id).first();
  if (!meta) return fail(404, 'Foto tidak ditemukan.');

  // Unverified field-observation photos are private. Never rely on an
  // unguessable photo ID as an authorization mechanism.
  const profile = await profileFor(request, env);
  if (!await canAccessPost(env, meta, profile)) {
    return fail(profile ? 403 : 401, 'Foto atau laporan ini tidak dapat diakses.');
  }
  const isPublic = meta.status === 'verified' && !meta.group_id;

  const object = await env.r2falaq.get(meta.object_key);
  if (!object) return fail(404, 'Berkas foto tidak ditemukan.');
  return new Response(object.body, {
    headers: {
      'content-type': meta.mime,
      'content-length': String(meta.size_bytes),
      'cache-control': isPublic ? 'public, max-age=86400' : 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...JSON_HEADERS, allow: 'GET,POST,PUT,DELETE,OPTIONS' } });
    }

    try {
      if (url.pathname === '/api/health' && request.method === 'GET') {
        // Report real dependency readiness without exposing credentials or IDs.
        const requiredTables = [
          'users', 'groups', 'memberships', 'group_coordinators', 'calculations',
          'posts', 'photos', 'likes', 'comments', 'reviews', 'agendas',
          'institution_applications', 'partner_institutions', 'institution_application_reviews',
        ];
        let database = 'unavailable';
        let missingTables = [...requiredTables];
        try {
          if (!env.falaq?.prepare) throw new Error('D1 binding is unavailable');
          const ping = await env.falaq.prepare('SELECT 1 AS ok').first();
          if (ping?.ok !== 1) throw new Error('D1 health query failed');
          database = 'ok';
          const result = await env.falaq.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN (" +
            requiredTables.map(() => '?').join(',') + ')'
          ).bind(...requiredTables).all();
          const found = new Set((result.results || []).map((row) => row.name));
          missingTables = requiredTables.filter((name) => !found.has(name));
        } catch (error) {
          console.error('PFI health check failed:', error?.message || error);
        }
        const auth = supabaseRuntimeConfig(env);
        const authConfigured = Boolean(auth.url && auth.anonKey);
        const authentication = authConfigured ? 'configured'
          : auth.url ? 'missing_key' : auth.anonKey ? 'missing_url' : 'missing_configuration';
        const storageConfigured = Boolean(
          env.r2falaq && typeof env.r2falaq.put === 'function' && typeof env.r2falaq.get === 'function'
        );
        const schemaReady = missingTables.length === 0;
        const ready = database === 'ok' && schemaReady && authConfigured;
        return json({
          status: ready ? 'ok' : 'degraded',
          runtime: 'cloudflare-workers',
          database,
          schema: { ready: schemaReady, missingTables },
          authentication,
          photoStorage: storageConfigured ? 'configured' : 'missing_binding',
          migrationPhase: 1,
        }, ready ? 200 : 503);
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
        if (typeof start !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(start) || start < '1900-01-01' || start > '2099-12-31') {
          return fail(400, 'Tanggal di luar rentang.');
        }
        const date = localTime(start, '12:00', site);
        if (!Number.isFinite(date.getTime())) return fail(400, 'Tanggal tidak valid.');
        const period = hijri(date, site);
        if (period.day !== 1) return fail(400, 'Pilih hari pertama bulan Hijriah.');
        const method = body.method;
        if (method !== 'mabims') return fail(400, 'Metode hisab belum didukung. Saat ini hanya MABIMS yang tersedia.');
        const result = calculateHisab({ start, ...period }, site, method);
        result.engine = 'Astronomy Engine 2.1.19';

        const profile = await profileFor(request, env);
        result.saved = Boolean(profile);
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
          const normalized = normalizeRukyatDetails(details);
          if (!normalized) {
            return fail(400, 'Koordinat wajib valid, waktu harus menyertakan zona waktu, dan ketinggian harus berada dalam rentang -500 hingga 9.000 meter.');
          }
          details = normalized;
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
        return json(await postView(env, row, profile), 201);
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
      if (photoMatch && request.method === 'GET') return await getPhoto(request, env, photoMatch[1]);

      const likeMatch = url.pathname.match(/^\/api\/posts\/([a-zA-Z0-9_-]+)\/like$/);
      if (likeMatch && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk menyukai postingan.');
        const post = await env.falaq.prepare('SELECT * FROM posts WHERE id = ?').bind(likeMatch[1]).first();
        if (!post || !await canAccessPost(env, post, profile)) return fail(404, 'Postingan tidak ditemukan.');
        const body = await request.json().catch(() => null);
        if (body?.liked === true) {
          await env.falaq.prepare('INSERT OR IGNORE INTO likes (post_id,user_id) VALUES (?,?)').bind(post.id, profile.id).run();
        } else {
          await env.falaq.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').bind(post.id, profile.id).run();
        }
        const row = await env.falaq.prepare('SELECT * FROM posts WHERE id = ?').bind(post.id).first();
        return json(await postView(env, row, profile));
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
        if (!await canAccessPost(env, post, profile)) return fail(404, 'Postingan tidak ditemukan.');
        await env.falaq.prepare(
          'INSERT INTO comments (id,post_id,user_id,body,created) VALUES (?,?,?,?,?)'
        ).bind(uuid(), post.id, profile.id, value, new Date().toISOString()).run();
        const updated = await env.falaq.prepare('SELECT * FROM posts WHERE id = ?').bind(post.id).first();
        return json(await postView(env, updated, profile), 201);
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

      if (url.pathname === '/api/groups' && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk membuat kelompok.');
        if (profile.role !== 'admin') return fail(403, 'Hanya admin yang dapat membuat kelompok.');
        const body = await request.json().catch(() => null);
        const name = typeof body?.name === 'string' ? body.name.trim() : '';
        const description = typeof body?.description === 'string' ? body.description.trim() : '';
        if (name.length < 3 || name.length > 80 || description.length > 500) {
          return fail(400, 'Nama kelompok harus 3–80 karakter dan deskripsi maksimal 500 karakter.');
        }
        const id = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
          .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
        if (!id) return fail(400, 'Nama kelompok tidak dapat dijadikan ID.');
        const created = new Date().toISOString();
        try {
          await env.falaq.batch([
            env.falaq.prepare('INSERT INTO groups (id,name,description,created) VALUES (?,?,?,?)')
              .bind(id, name, description, created),
            env.falaq.prepare('INSERT INTO memberships (group_id,user_id) VALUES (?,?)')
              .bind(id, profile.id),
            env.falaq.prepare('INSERT INTO group_coordinators (group_id,user_id,appointed) VALUES (?,?,?)')
              .bind(id, profile.id, created),
          ]);
        } catch (error) {
          if (/UNIQUE|constraint/i.test(String(error?.message || error))) {
            return fail(409, 'ID kelompok sudah digunakan. Gunakan nama kelompok yang berbeda.');
          }
          throw error;
        }
        return json({ id, name, description, members: 1 }, 201);
      }

      if (url.pathname === '/api/groups' && request.method === 'GET') {
        const rows = await env.falaq.prepare(`
          SELECT g.id,g.name,g.description,COUNT(m.user_id) AS members
          FROM groups g LEFT JOIN memberships m ON m.group_id = g.id
          GROUP BY g.id,g.name,g.description ORDER BY g.name
        `).all();
        return json(rows.results || []);
      }

      if (url.pathname === '/api/profile' && request.method === 'PUT') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk mengubah profil.');
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') return fail(400, 'Data profil tidak valid.');
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const org = typeof body.org === 'string' ? body.org.trim() : '';
        const bio = typeof body.bio === 'string' ? body.bio.trim() : '';
        if (name.length < 2 || name.length > 80 || org.length > 120 || bio.length > 360) {
          return fail(400, 'Nama, organisasi, atau bio tidak sesuai batas karakter.');
        }
        await env.falaq.prepare('UPDATE users SET name=?,org=?,bio=?,updated=? WHERE id=?')
          .bind(name, org, bio, new Date().toISOString(), profile.id).run();
        const updated = await env.falaq.prepare(
          'SELECT id,email,name,org,bio,role,verification,review_note,created FROM users WHERE id=?'
        ).bind(profile.id).first();
        return json({ id: updated.id, email: updated.email, name: updated.name, org: updated.org, bio: updated.bio, role: updated.role, verification: updated.verification, reviewNote: updated.review_note, created: updated.created });
      }

      if (url.pathname === '/api/preferences' && request.method === 'PUT') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk mengubah preferensi.');
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'Preferensi tidak valid.');
        let current = {};
        try { current = JSON.parse(profile.prefs || '{}'); } catch { current = {}; }
        const next = { ...current };
        if ('theme' in body) {
          if (!['light','dark'].includes(body.theme)) return fail(400, 'Tema tidak valid.');
          next.theme = body.theme;
        }
        if ('mode' in body) {
          if (!['pemula','profesional'].includes(body.mode)) return fail(400, 'Mode tidak valid.');
          next.mode = body.mode;
        }
        if ('lang' in body) {
          if (!['id','en'].includes(body.lang)) return fail(400, 'Bahasa tidak valid.');
          next.lang = body.lang;
        }
        if ('site' in body) {
          if (!SITES.some((site) => site.id === body.site)) return fail(400, 'Lokasi pengamatan tidak valid.');
          next.site = body.site;
        }
        if ('notify' in body) next.notify = Boolean(body.notify);
        await env.falaq.prepare('UPDATE users SET prefs=?,updated=? WHERE id=?')
          .bind(JSON.stringify(next), new Date().toISOString(), profile.id).run();
        return json({ ok: true, prefs: next });
      }

      if (url.pathname === '/api/verification' && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk mengajukan verifikasi.');
        if (['verified','pending'].includes(profile.verification)) return fail(409, 'Permohonan sudah diajukan atau disetujui.');
        const body = await request.json().catch(() => null);
        const evidence = typeof body?.evidence === 'string' ? body.evidence.trim() : '';
        if (evidence.length < 20 || evidence.length > 1000) return fail(400, 'Keterangan bukti harus 20–1.000 karakter.');
        await env.falaq.prepare("UPDATE users SET verification='pending',evidence=?,review_note='',updated=? WHERE id=?")
          .bind(evidence, new Date().toISOString(), profile.id).run();
        return json({ status: 'pending' });
      }


      if (url.pathname === '/api/institution-applications' && request.method === 'GET') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk melihat pengajuan lembaga.');
        if (['reviewer','admin'].includes(profile.role)) {
          const rows = await env.falaq.prepare(`
            SELECT a.*,u.name AS applicant_name,u.email AS applicant_email
            FROM institution_applications a JOIN users u ON u.id=a.applicant_user_id
            WHERE a.status IN ('pending','revision') ORDER BY a.updated ASC LIMIT 100
          `).all();
          return json({ applications: rows.results || [] });
        }
        const application = await env.falaq.prepare(
          'SELECT * FROM institution_applications WHERE applicant_user_id=?'
        ).bind(profile.id).first();
        return json({ application: application || null });
      }

      if (url.pathname === '/api/institution-applications' && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk mengajukan kemitraan lembaga.');
        const body = await request.json().catch(() => null);
        const application = normalizeInstitutionApplication(body);
        if (!application) return fail(400, 'Data lembaga tidak lengkap atau tidak valid. Periksa kembali setiap kolom.');
        const existing = await env.falaq.prepare(
          'SELECT id,status FROM institution_applications WHERE applicant_user_id=?'
        ).bind(profile.id).first();
        if (existing && existing.status !== 'revision') {
          return fail(409, existing.status === 'approved'
            ? 'Lembaga Anda telah disetujui. Hubungi PFI untuk perubahan data.'
            : 'Pengajuan lembaga Anda sedang diproses atau telah ditutup.');
        }
        const duplicate = await env.falaq.prepare(
          'SELECT id FROM partner_institutions WHERE lower(name)=lower(?)'
        ).bind(application.institution).first();
        if (duplicate) return fail(409, 'Nama lembaga ini sudah tercatat sebagai mitra PFI.');
        const now = new Date().toISOString();
        if (existing) {
          await env.falaq.prepare(`
            UPDATE institution_applications SET institution_name=?,institution_type=?,region=?,
              representative_name=?,representative_position=?,official_contact=?,website=?,purpose=?,
              status='pending',review_note='',reviewed_by=NULL,reviewed_at=NULL,updated=?
            WHERE id=? AND applicant_user_id=? AND status='revision'
          `).bind(application.institution,application.type,application.region,
            application.representative,application.position,application.contact,
            application.website,application.purpose,now,existing.id,profile.id).run();
          return json({ id: existing.id, status: 'pending', resubmitted: true });
        }
        const id = uuid();
        await env.falaq.prepare(`
          INSERT INTO institution_applications
          (id,applicant_user_id,institution_name,institution_type,region,representative_name,
           representative_position,official_contact,website,purpose,status,created,updated)
          VALUES (?,?,?,?,?,?,?,?,?,?,'pending',?,?)
        `).bind(id,profile.id,application.institution,application.type,application.region,
          application.representative,application.position,application.contact,
          application.website,application.purpose,now,now).run();
        return json({ id, status: 'pending' }, 201);
      }

      const institutionReviewMatch = url.pathname.match(/^\/api\/institution-applications\/([a-zA-Z0-9_-]+)\/review$/);
      if (institutionReviewMatch && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk.');
        if (!['reviewer','admin'].includes(profile.role)) return fail(403, 'Khusus Tim Validasi PFI.');
        const id = institutionReviewMatch[1];
        const application = await env.falaq.prepare(
          'SELECT * FROM institution_applications WHERE id=?'
        ).bind(id).first();
        if (!application) return fail(404, 'Pengajuan lembaga tidak ditemukan.');
        if (application.applicant_user_id === profile.id) return fail(403, 'Petugas tidak boleh memeriksa pengajuannya sendiri.');
        if (!['pending','revision'].includes(application.status)) return fail(409, 'Pengajuan ini tidak sedang menunggu pemeriksaan.');
        const body = await request.json().catch(() => null);
        const decision = body?.decision;
        const note = typeof body?.note === 'string' ? body.note.trim() : '';
        if (!['approved','revision','rejected'].includes(decision) || note.length < 8 || note.length > 1000) {
          return fail(400, 'Keputusan dan catatan pemeriksaan tidak valid.');
        }
        if (decision === 'approved') {
          const duplicate = await env.falaq.prepare(
            'SELECT id FROM partner_institutions WHERE lower(name)=lower(?)'
          ).bind(application.institution_name).first();
          if (duplicate) return fail(409, 'Nama lembaga sudah tercatat sebagai mitra.');
        }
        const now = new Date().toISOString();
        const statements = [
          env.falaq.prepare(`UPDATE institution_applications
            SET status=?,review_note=?,reviewed_by=?,reviewed_at=?,updated=? WHERE id=? AND status IN ('pending','revision')`)
            .bind(decision,note,profile.id,now,now,id),
          env.falaq.prepare(`INSERT INTO institution_application_reviews
            (id,application_id,reviewer_user_id,decision,note,created) VALUES (?,?,?,?,?,?)`)
            .bind(uuid(),id,profile.id,decision,note,now),
        ];
        if (decision === 'approved') {
          statements.push(env.falaq.prepare(`INSERT INTO partner_institutions
            (id,application_id,name,institution_type,region,official_contact,website,status,created,updated)
            VALUES (?,?,?,?,?,?,?,'active',?,?)`)
            .bind(uuid(),id,application.institution_name,application.institution_type,
              application.region,application.official_contact,application.website,now,now));
        }
        await env.falaq.batch(statements);
        return json({ ok: true, status: decision });
      }

      if (url.pathname === '/api/moderation' && request.method === 'GET') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk.');
        if (!['reviewer','admin'].includes(profile.role)) return fail(403, 'Khusus petugas verifikasi.');
        const [users, posts] = await Promise.all([
          env.falaq.prepare("SELECT id,name,org,evidence,created FROM users WHERE verification='pending' ORDER BY created").all(),
          env.falaq.prepare("SELECT * FROM posts WHERE type='rukyat' AND status='pending' ORDER BY created").all(),
        ]);
        const postRows = [];
        for (const post of posts.results || []) postRows.push(await postView(env, post, profile));
        return json({ accounts: users.results || [], posts: postRows });
      }

      const moderationMatch = url.pathname.match(/^\/api\/moderation\/([a-z]+)\/([a-zA-Z0-9_-]+)$/);
      if (moderationMatch && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk.');
        if (!['reviewer','admin'].includes(profile.role)) return fail(403, 'Khusus petugas verifikasi.');
        const [, entity, id] = moderationMatch;
        if (!['users','posts'].includes(entity)) return fail(400, 'Jenis data tidak valid.');
        const body = await request.json().catch(() => null);
        const decision = body?.decision;
        const note = typeof body?.note === 'string' ? body.note.trim() : '';
        if (!['verified','revision'].includes(decision) || note.length < 8 || note.length > 1000) return fail(400, 'Keputusan atau catatan verifikasi tidak valid.');
        const table = entity;
        const item = await env.falaq.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first();
        const column = entity === 'users' ? 'verification' : 'status';
        if (!item || item[column] !== 'pending') return fail(409, 'Pengajuan tidak lagi menunggu tinjauan.');
        if (!canReviewEntity(entity, item, profile)) return fail(403, 'Petugas tidak dapat menyetujui pengajuannya sendiri.');
        await env.falaq.batch([
          env.falaq.prepare(`UPDATE ${table} SET ${column}=?,review_note=? WHERE id=?`).bind(decision, note, id),
          env.falaq.prepare('INSERT INTO reviews (id,reviewer,entity,entity_id,decision,note,created) VALUES (?,?,?,?,?,?,?)')
            .bind(uuid(), profile.id, entity, id, decision, note, new Date().toISOString()),
        ]);
        return json({ ok: true });
      }

      const groupMembersMatch = url.pathname.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/members$/);
      if (groupMembersMatch && request.method === 'GET') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk melihat anggota kelompok.');
        const groupId = groupMembersMatch[1];
        const group = await env.falaq.prepare('SELECT id,name,description FROM groups WHERE id=?').bind(groupId).first();
        if (!group) return fail(404, 'Kelompok tidak ditemukan.');
        const membership = await env.falaq.prepare(
          'SELECT 1 AS yes FROM memberships WHERE group_id=? AND user_id=?'
        ).bind(groupId, profile.id).first();
        if (!canViewGroup(profile, Boolean(membership))) return fail(403, 'Anda bukan anggota kelompok ini.');
        const [coord, rows] = await Promise.all([
          env.falaq.prepare('SELECT user_id FROM group_coordinators WHERE group_id=?').bind(groupId).first(),
          env.falaq.prepare(`SELECT u.id,u.name,u.org,u.bio,u.role,u.verification
            FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.group_id=? ORDER BY u.name`).bind(groupId).all(),
        ]);
        return json({ group: group.id, name: group.name, description: group.description, coordinator: coord?.user_id || null,
          members: (rows.results || []).map((u) => ({ ...u, isCoordinator: coord?.user_id === u.id })) });
      }

      const groupPostsMatch = url.pathname.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/posts$/);
      if (groupPostsMatch && request.method === 'GET') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk untuk melihat postingan kelompok.');
        const groupId = groupPostsMatch[1];
        const group = await env.falaq.prepare('SELECT id FROM groups WHERE id=?').bind(groupId).first();
        if (!group) return fail(404, 'Kelompok tidak ditemukan.');
        const membership = await env.falaq.prepare(
          'SELECT 1 AS yes FROM memberships WHERE group_id=? AND user_id=?'
        ).bind(groupId, profile.id).first();
        if (!canViewGroup(profile, Boolean(membership))) return fail(403, 'Anda bukan anggota kelompok ini.');
        const rows = profile && ['reviewer','admin'].includes(profile.role)
          ? await env.falaq.prepare('SELECT * FROM posts WHERE group_id=? ORDER BY created DESC LIMIT 100').bind(groupId).all()
          : profile
            ? await env.falaq.prepare("SELECT * FROM posts WHERE group_id=? AND (type!='rukyat' OR status='verified' OR user_id=?) ORDER BY created DESC LIMIT 100").bind(groupId, profile.id).all()
            : await env.falaq.prepare("SELECT * FROM posts WHERE group_id=? AND (type!='rukyat' OR status='verified') ORDER BY created DESC LIMIT 100").bind(groupId).all();
        const result = [];
        for (const post of rows.results || []) result.push(await postView(env, post, profile));
        return json(result);
      }

      const groupCoordinatorMatch = url.pathname.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/coordinator$/);
      if (groupCoordinatorMatch && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk.');
        const groupId = groupCoordinatorMatch[1];
        const member = await env.falaq.prepare('SELECT 1 AS yes FROM memberships WHERE group_id=? AND user_id=?').bind(groupId, profile.id).first();
        if (!member) return fail(403, 'Anda belum menjadi anggota kelompok ini.');
        const existing = await env.falaq.prepare('SELECT user_id FROM group_coordinators WHERE group_id=?').bind(groupId).first();
        if (existing && existing.user_id !== profile.id) return fail(403, 'Kelompok ini sudah memiliki koordinator.');
        await env.falaq.prepare('INSERT OR REPLACE INTO group_coordinators (group_id,user_id,appointed) VALUES (?,?,?)')
          .bind(groupId, profile.id, new Date().toISOString()).run();
        return json({ ok: true, group: groupId, coordinator: profile.id });
      }

      if (url.pathname === '/api/agendas' && request.method === 'GET') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk.');
        const memberships = await env.falaq.prepare('SELECT group_id FROM memberships WHERE user_id=?').bind(profile.id).all();
        const ids = (memberships.results || []).map((row) => row.group_id);
        if (!ids.length) return json([]);
        const placeholders = ids.map(() => '?').join(',');
        const rows = await env.falaq.prepare(`SELECT a.*,u.name AS creator_name FROM agendas a JOIN users u ON u.id=a.created_by
          WHERE a.group_id IN (${placeholders}) ORDER BY a.date ASC`).bind(...ids).all();
        return json((rows.results || []).map((a) => ({ id:a.id, group:a.group_id, groupName:a.group_id, title:a.title, body:a.body, date:a.date, location:a.location, createdBy:a.created_by, creatorName:a.creator_name, created:a.created })));
      }

      const agendaMatch = url.pathname.match(/^\/api\/agendas\/([a-zA-Z0-9_-]+)$/);
      if (agendaMatch && request.method === 'GET') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk.');
        const agenda = await env.falaq.prepare('SELECT a.*,u.name AS creator_name FROM agendas a JOIN users u ON u.id=a.created_by WHERE a.id=?').bind(agendaMatch[1]).first();
        if (!agenda) return fail(404, 'Agenda tidak ditemukan.');
        const member = await env.falaq.prepare('SELECT 1 AS yes FROM memberships WHERE group_id=? AND user_id=?').bind(agenda.group_id, profile.id).first();
        if (!member) return fail(403, 'Anda bukan anggota kelompok ini.');
        return json({ id:agenda.id, group:agenda.group_id, groupName:agenda.group_id, title:agenda.title, body:agenda.body, date:agenda.date, location:agenda.location, createdBy:agenda.created_by, creatorName:agenda.creator_name, created:agenda.created });
      }

      if (url.pathname === '/api/agendas' && request.method === 'POST') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk.');
        const body = await request.json().catch(() => null);
        const groupId = typeof body?.group === 'string' ? body.group : '';
        const title = typeof body?.title === 'string' ? body.title.trim() : '';
        const content = typeof body?.body === 'string' ? body.body.trim() : '';
        const date = typeof body?.date === 'string' ? body.date : '';
        const location = typeof body?.location === 'string' ? body.location.trim() : '';
        const validAgendaDate = new Date(`${date}T12:00:00.000Z`);
        if (!title || title.length > 130 || content.length < 3 || content.length > 1000 || location.length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '1900-01-01' || date > '2099-12-31' || !Number.isFinite(validAgendaDate.getTime()) || validAgendaDate.toISOString().slice(0, 10) !== date) return fail(400, 'Data agenda tidak valid.');
        const member = await env.falaq.prepare('SELECT 1 AS yes FROM memberships WHERE group_id=? AND user_id=?').bind(groupId, profile.id).first();
        if (!member) return fail(403, 'Anda bukan anggota kelompok ini.');
        const coord = await env.falaq.prepare('SELECT 1 AS yes FROM group_coordinators WHERE group_id=? AND user_id=?').bind(groupId, profile.id).first();
        if (!coord) return fail(403, 'Hanya koordinator yang dapat membuat agenda.');
        const id = uuid();
        const created = new Date().toISOString();
        await env.falaq.prepare('INSERT INTO agendas (id,group_id,title,body,date,location,created_by,created) VALUES (?,?,?,?,?,?,?,?)')
          .bind(id, groupId, title, content, date, location, profile.id, created).run();
        return json({ id, group: groupId, title, body: content, date, location, createdBy: profile.id, creatorName: profile.name, created }, 201);
      }

      if (agendaMatch && request.method === 'DELETE') {
        const profile = await profileFor(request, env);
        if (!profile) return fail(401, 'Silakan masuk.');
        const agenda = await env.falaq.prepare('SELECT * FROM agendas WHERE id=?').bind(agendaMatch[1]).first();
        if (!agenda) return fail(404, 'Agenda tidak ditemukan.');
        const coord = await env.falaq.prepare('SELECT 1 AS yes FROM group_coordinators WHERE group_id=? AND user_id=?').bind(agenda.group_id, profile.id).first();
        if (!coord || agenda.created_by !== profile.id) return fail(403, 'Hanya koordinator pembuat agenda yang dapat menghapusnya.');
        await env.falaq.prepare('DELETE FROM agendas WHERE id=?').bind(agenda.id).run();
        return json({ ok: true });
      }

      // Fail explicitly rather than silently sending unsupported writes to a
      // partially migrated backend. Remaining endpoints are ported in phases.
      if (url.pathname.startsWith('/api/')) {
        return fail(501, 'Fitur ini sedang dalam proses migrasi ke Cloudflare Workers.');
      }

      return await env.ASSETS.fetch(request);
    } catch (error) {
      const diagnostic = publicDiagnostic(error);
      console.error('PFI Worker error', {
        requestId,
        method: request.method,
        path: url.pathname,
        code: diagnostic.code,
        message: error?.message || String(error),
        stack: error?.stack,
        cause: error?.cause,
      });
      return fail(500, 'Layanan PFI belum dapat menyelesaikan permintaan.', {
        ...diagnostic,
        requestId,
      });
    }
  },
};
