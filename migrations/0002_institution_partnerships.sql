-- PFI partner institution applications and validation workflow.
-- This migration is additive. It does not modify community groups or user roles.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS institution_applications (
  id TEXT PRIMARY KEY,
  applicant_user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN (
    'pesantren_madrasah','organisasi_kemasyarakatan','perguruan_tinggi',
    'observatorium_komunitas','lembaga_pemerintah','lainnya'
  )),
  region TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  representative_position TEXT NOT NULL,
  official_contact TEXT NOT NULL,
  website TEXT NOT NULL DEFAULT '',
  purpose TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','revision','approved','rejected')),
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  created TEXT NOT NULL,
  updated TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS institution_applications_status_updated
  ON institution_applications(status, updated);

CREATE TABLE IF NOT EXISTS partner_institutions (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL UNIQUE REFERENCES institution_applications(id),
  name TEXT NOT NULL,
  institution_type TEXT NOT NULL,
  region TEXT NOT NULL,
  official_contact TEXT NOT NULL,
  website TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  coordinator_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created TEXT NOT NULL,
  updated TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_institutions_name_unique
  ON partner_institutions(lower(name));

CREATE TABLE IF NOT EXISTS institution_application_reviews (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES institution_applications(id) ON DELETE CASCADE,
  reviewer_user_id TEXT NOT NULL REFERENCES users(id),
  decision TEXT NOT NULL CHECK (decision IN ('approved','revision','rejected')),
  note TEXT NOT NULL,
  created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS institution_application_reviews_history
  ON institution_application_reviews(application_id, created DESC);
