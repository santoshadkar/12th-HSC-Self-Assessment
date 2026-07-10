import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

function createDb(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL,
      chapter_id TEXT,
      kind TEXT NOT NULL CHECK (kind IN ('chapter', 'mock')),
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      time_taken_seconds INTEGER NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id, created_at);
  `);
  return db;
}

// Reuse one connection across Next.js dev hot reloads
const globalForDb = globalThis as unknown as { __hscDb?: Database.Database };
export const db: Database.Database = globalForDb.__hscDb ?? (globalForDb.__hscDb = createDb());
