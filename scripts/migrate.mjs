import { sql } from "@vercel/postgres";

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at BIGINT NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL,
      chapter_id TEXT,
      kind TEXT NOT NULL CHECK (kind IN ('chapter', 'mock')),
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      time_taken_seconds INTEGER NOT NULL,
      detail TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id, created_at);`;

  console.log("Migration complete: users, sessions, attempts tables are ready.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
