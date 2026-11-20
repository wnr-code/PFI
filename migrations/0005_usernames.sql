-- Canonical, unique public identity for member profiles.
ALTER TABLE users ADD COLUMN username TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN username_updated_at TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username) WHERE username <> '';
