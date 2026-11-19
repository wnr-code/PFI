-- Tambahkan foto profil tanpa mengubah migrasi awal yang sudah diterapkan.
ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT '';
