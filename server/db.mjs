import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { categories, games } from './catalog.mjs';

export function hashPassword(password) { const salt=randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password,salt,64).toString('hex')}`; }
export function verifyPassword(password, hash) { const [salt,key]=hash.split(':'); const actual=scryptSync(password,salt,64); const expected=Buffer.from(key,'hex'); return expected.length===actual.length && timingSafeEqual(expected,actual); }
export function openDatabase(file=process.env.DATABASE_PATH || './data/playnova.sqlite') {
  if(file!==':memory:') mkdirSync(dirname(resolve(file)),{recursive:true});
  const db=new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL UNIQUE, icon TEXT NOT NULL DEFAULT 'Gamepad2');
    CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, description TEXT NOT NULL, instructions TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT, thumbnail TEXT NOT NULL, source_kind TEXT NOT NULL DEFAULT 'builtin', source TEXT NOT NULL,
      authorised INTEGER NOT NULL DEFAULT 1, featured INTEGER NOT NULL DEFAULT 0, popular INTEGER NOT NULL DEFAULT 0, is_new INTEGER NOT NULL DEFAULT 1,
      enabled INTEGER NOT NULL DEFAULT 1, plays INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_games_category ON games(category_id);
    CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
  if(!db.prepare('SELECT version FROM migrations WHERE version=1').get()) {
    db.exec('BEGIN');
    try {
      for(const [slug,name,icon] of categories) db.prepare('INSERT OR IGNORE INTO categories(slug,name,icon) VALUES(?,?,?)').run(slug,name,icon);
      for(const g of games) db.prepare(`INSERT OR IGNORE INTO games(slug,title,description,instructions,category_id,thumbnail,source,featured,popular,is_new) VALUES(?,?,?,?,(SELECT id FROM categories WHERE slug=?),?,?,?,?,?)`).run(g.slug,g.title,g.description,g.instructions,g.category,`/art/${g.slug}.svg`,g.engine,g.featured,g.popular,g.is_new);
      db.prepare('INSERT INTO migrations(version) VALUES(1)').run(); db.exec('COMMIT');
    } catch(e){db.exec('ROLLBACK');throw e;}
  }
  return db;
}
export function configureAdmin(db,username,password) {
  if(!/^[a-zA-Z0-9_.-]{3,40}$/.test(username) || password.length<12 || password.length>128) throw new Error('Use a 3–40 character username and a 12–128 character password.');
  db.prepare('INSERT INTO admins(username,password_hash) VALUES(?,?) ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash').run(username,hashPassword(password));
  db.prepare('DELETE FROM sessions WHERE admin_id=(SELECT id FROM admins WHERE username=?)').run(username);
}
