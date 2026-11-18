import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
export function database(path=process.env.PFI_DB||resolve('.pfi-data/pfi.sqlite')){
 if(path!==':memory:')mkdirSync(dirname(path),{recursive:true,mode:0o700});
 const db=new DatabaseSync(path);db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,org TEXT NOT NULL DEFAULT '',bio TEXT NOT NULL DEFAULT '',role TEXT NOT NULL DEFAULT 'observer',verification TEXT NOT NULL DEFAULT 'none',evidence TEXT NOT NULL DEFAULT '',review_note TEXT NOT NULL DEFAULT '',prefs TEXT NOT NULL DEFAULT '{}',created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires);
 CREATE TABLE IF NOT EXISTS calculations(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES accounts(id),result TEXT NOT NULL,created TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS calc_by_user ON calculations(user_id,created DESC);
 CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY,user_id TEXT REFERENCES accounts(id),author TEXT NOT NULL,type TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,city TEXT NOT NULL DEFAULT '',details TEXT NOT NULL DEFAULT '{}',group_id TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT '',review_note TEXT NOT NULL DEFAULT '',created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS photos(id TEXT PRIMARY KEY,post_id TEXT NOT NULL UNIQUE REFERENCES posts(id),mime TEXT NOT NULL,sha256 TEXT NOT NULL,original BLOB NOT NULL);
 CREATE TABLE IF NOT EXISTS likes(post_id TEXT NOT NULL REFERENCES posts(id),user_id TEXT NOT NULL REFERENCES accounts(id),PRIMARY KEY(post_id,user_id));
 CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY,post_id TEXT NOT NULL REFERENCES posts(id),user_id TEXT NOT NULL REFERENCES accounts(id),body TEXT NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS memberships(group_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES accounts(id),PRIMARY KEY(group_id,user_id));
 CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY,reviewer TEXT NOT NULL REFERENCES accounts(id),entity TEXT NOT NULL,entity_id TEXT NOT NULL,decision TEXT NOT NULL,note TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS group_coordinators(group_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES accounts(id),PRIMARY KEY(group_id,user_id));
CREATE TABLE IF NOT EXISTS agendas(id TEXT PRIMARY KEY,group_id TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,date TEXT NOT NULL,location TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL REFERENCES accounts(id),created TEXT NOT NULL);
 PRAGMA user_version=1;`);
 db.prepare('INSERT OR IGNORE INTO posts(id,author,type,title,body,created) VALUES(?,?,?,?,?,?)').run('panduan-pengamat','Redaksi PFI','panduan','Ruang temu para pengamat langit','Selamat datang di komunitas PFI. Bagikan pertanyaan, catatan lapangan, atau laporan rukyat Anda. Untuk laporan pengamatan, sertakan koordinat, waktu setempat, instrumen, kondisi cuaca, dan foto asli. Setiap laporan perlu ditinjau sebelum memperoleh status terverifikasi.',new Date().toISOString());
 return db;
}
