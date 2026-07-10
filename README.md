# HSC Science Self-Assessment

A self-assessment web app for 12th Grade (HSC) Science students following the Maharashtra State
Board (MSBSHSE) syllabus. Covers **Mathematics, Physics, Chemistry, Computer Science Paper I and
Paper II** with chapter-wise timed MCQ quizzes, full-length mock tests, instant explanations, and
a per-user progress dashboard.

> ## ⚠️ Important disclaimers
>
> - **The practice questions in this app are illustrative**, written originally for this project.
>   They are **not** official MSBSHSE board questions and are **not** copied from any textbook or
>   question bank.
> - **Verify the chapter lists** in `data/syllabus.json` against the **current official MSBSHSE
>   curriculum** before relying on them — the syllabus can change year to year, and the bifocal
>   Computer Science chapter lists in particular vary between revisions.

## Stack

- **Next.js (App Router, TypeScript)** — pages + API routes in a single app
- **Postgres** via `@vercel/postgres` — users, sessions, and attempt history, hosted on Vercel's
  integrated Postgres (Neon) so it works on Vercel's serverless/read-only filesystem
- **Cookie-session auth** with `bcryptjs` password hashing — no third-party auth service
- Plain CSS (`app/globals.css`), responsive for mobile and desktop

> This app previously used local SQLite (`better-sqlite3`), which worked for local development but
> **cannot work on Vercel** — serverless functions there have a read-only filesystem, so any
> attempt to create/write a SQLite file throws and the whole app 500s. Postgres is a real network
> database, so it works the same locally and in production.

## Setup: database (required before running, locally or on Vercel)

1. In the [Vercel dashboard](https://vercel.com/dashboard), open this project → **Storage** tab →
   **Create Database** → choose **Postgres** (Neon-backed) → connect it to the project. This
   injects `POSTGRES_URL` (and related) env vars into the project automatically.
2. Link this local folder to the Vercel project and pull those env vars down:
   ```bash
   npx vercel login
   npx vercel link
   npx vercel env pull .env.local
   ```
3. Create the tables (one-time; safe to re-run, uses `CREATE TABLE IF NOT EXISTS`):
   ```bash
   npm run migrate
   ```
4. Redeploy (push to the connected GitHub repo, or `npx vercel --prod`) so the live site picks up
   the same env vars and schema.

If your Vercel dashboard shows a **native Neon integration** instead of the older "Vercel Postgres"
product, the connection string env var may be named `DATABASE_URL` instead of `POSTGRES_URL` — in
that case add `POSTGRES_URL=<value of DATABASE_URL>` to the project's environment variables (or
switch `lib/db.ts` to `@neondatabase/serverless` with `neon(process.env.DATABASE_URL)`), since
`@vercel/postgres` specifically looks for `POSTGRES_URL`.

## Running locally

```bash
npm install
npm run migrate   # first time only, after completing the database setup above
npm run dev
# open http://localhost:3000
```

Sign up with any email/password (stored in Postgres; passwords are bcrypt-hashed).

## How the app flows

Login/Signup → **Subjects** → chapter list (or **Full Mock Test**) → timed quiz (auto-submits when
the countdown ends) → **Results** with correct answers + explanations → **Dashboard** with score
trend, per-subject averages, weak-chapter highlighting (< 60%), and attempt history.

## Question bank — how to add/edit questions

All content lives in `data/` and is completely separate from app logic:

- `data/syllabus.json` — subjects and their chapter lists (id, name, colour, mock-test size)
- `data/questions/<subjectId>.json` — questions grouped by chapter id:

```json
{
  "subjectId": "physics",
  "chapters": {
    "wave-optics": [
      {
        "id": "phy-wo-01",
        "question": "…",
        "options": ["…", "…", "…", "…"],
        "answerIndex": 2,
        "explanation": "…"
      }
    ]
  }
}
```

Rules:

- `id` must be **unique within the subject** (used for grading and attempt review).
- `answerIndex` is the 0-based index into `options`.
- A chapter listed in `syllabus.json` with no questions shows as “Coming soon” automatically.
- Mock tests draw `mock.questionCount` random questions across all chapters that have content —
  they get better automatically as more chapters are filled in.
- Timers are derived from question count (90 seconds/question, `SECONDS_PER_QUESTION` in
  `lib/questions.ts`).

Current content: **every chapter in every subject has 10 questions (550 total)** — Maths 15/15,
Physics 16/16, Chemistry 16/16, Computer Science Paper I 4/4, Paper II 4/4. All are illustrative
practice questions written for this app (see disclaimer above); expanding any chapter beyond 10
questions is just a matter of appending more objects to its array.

## Data model (Postgres, see `scripts/migrate.mjs` for the DDL)

- `users` — id, name, email (unique), bcrypt password hash
- `sessions` — token, user id, expiry (30 days)
- `attempts` — user id, subject, chapter (null for mocks), kind, score, total, time taken, and a
  JSON `detail` of per-question answers for the review screen

## What's left / roadmap

- Expand each chapter beyond the current 10 questions (target 15+) for more variety on repeat
  attempts
- Board-style mark weightage per chapter in mock tests (currently a uniform random draw)
- Optional: per-question timing analytics, spaced-repetition of weak questions
