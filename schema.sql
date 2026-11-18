-- PFI Database Schema for Cloudflare D1
-- Dijalankan otomatis via wrangler migration
-- Gunakan CREATE TABLE IF NOT EXISTS agar aman dijalankan berulang kali

-- Tabel users (auth dari Supabase, sinkronisasi profil di sini)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'member', -- member, koordinator, admin
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabel groups (kelompok pengamat)
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    deskripsi TEXT,
    wilayah TEXT, -- provinsi/kabupaten
    koordinator_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (koordinator_id) REFERENCES users(id)
);

-- Tabel group_members (anggota kelompok)
CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member', -- member, koordinator
    joined_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(group_id, user_id)
);

-- Tabel agendas (agenda pengamatan)
CREATE TABLE IF NOT EXISTS agendas (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    judul TEXT NOT NULL,
    deskripsi TEXT,
    tanggal_pengamatan TEXT NOT NULL,
    lokasi TEXT,
    koordinat TEXT, -- lat,lng
    status TEXT DEFAULT 'aktif', -- aktif, selesai, dibatalkan
    created_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabel reports (laporan pengamatan)
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    agenda_id TEXT,
    user_id TEXT NOT NULL,
    judul TEXT NOT NULL,
    keterangan TEXT,
    foto_url TEXT, -- path di R2
    lokasi TEXT,
    koordinat TEXT,
    fase_bulan TEXT,
    visible BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, diverifikasi, ditolak
    verifikasi_oleh TEXT,
    verifikasi_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (agenda_id) REFERENCES agendas(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (verifikasi_oleh) REFERENCES users(id)
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_agenda_id ON reports(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agendas_group_id ON agendas(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);