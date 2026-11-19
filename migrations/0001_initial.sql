-- PFI D1 initial schema (target Cloudflare architecture)
-- Identity is managed by the configured identity provider. This database stores
-- application profiles and authorization roles only; never store provider passwords
-- or browser access tokens in D1.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                 -- verified identity-provider subject
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  org TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'observer'
    CHECK (role IN ('observer','reviewer','admin')),
  verification TEXT NOT NULL DEFAULT 'none'
    CHECK (verification IN ('none','pending','verified','revision')),
  evidence TEXT NOT NULL DEFAULT '',
  review_note TEXT NOT NULL DEFAULT '',
  prefs TEXT NOT NULL DEFAULT '{}',
  created TEXT NOT NULL,
  updated TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memberships (
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_coordinators (
  group_id TEXT PRIMARY KEY REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointed TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS calculations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  result TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS calculations_user_created
  ON calculations(user_id, created DESC);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rukyat','diskusi','tanya','panduan')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT '{}',
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT '',
  review_note TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS posts_created ON posts(created DESC);
CREATE INDEX IF NOT EXISTS posts_group_created ON posts(group_id, created DESC);
CREATE INDEX IF NOT EXISTS posts_type_status ON posts(type, status, created DESC);

-- Binary image data lives in R2. D1 stores only metadata and an opaque object key.
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  mime TEXT NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/webp')),
  sha256 TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 3145728),
  created TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS likes (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS comments_post_created ON comments(post_id, created);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  reviewer TEXT NOT NULL REFERENCES users(id),
  entity TEXT NOT NULL CHECK (entity IN ('users','posts')),
  entity_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('verified','revision')),
  note TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS reviews_entity ON reviews(entity, entity_id, created DESC);

CREATE TABLE IF NOT EXISTS agendas (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS agendas_group_date ON agendas(group_id, date);

INSERT OR IGNORE INTO groups(id,name,description) VALUES
 ('nusantara','Jaringan Nusantara','Kelompok pengamat hilal seluruh Indonesia, dari Sabang hingga Merauke.'),
 ('kelas-falak','Kelas Falak','Komunitas pelajar dan praktikan ilmu falak untuk hisab dan rukyat.'),
 ('lab-hisab','Lab Hisab','Kelompok fokus perhitungan awal bulan dan verifikasi hisab.');

INSERT OR IGNORE INTO posts(id,user_id,author,type,title,body,city,details,group_id,status,created)
VALUES (
 'panduan-pengamat',NULL,'Redaksi PFI','panduan',
 'Ruang temu para pengamat langit',
 'Selamat datang di komunitas PFI. Bagikan pertanyaan, catatan lapangan, atau laporan rukyat Anda. Sertakan koordinat, waktu setempat, instrumen, kondisi cuaca, dan foto asli. Setiap laporan pengamatan perlu ditinjau sebelum memperoleh status terverifikasi.',
 '', '{}', NULL, '', datetime('now')
);
