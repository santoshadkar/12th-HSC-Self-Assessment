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
- **SQLite** via `better-sqlite3` — users, sessions, and attempt history (`data/app.db`, created
  automatically on first run, gitignored)
- **Cookie-session auth** with `bcryptjs` password hashing — no third-party auth service
- Plain CSS (`app/globals.css`), responsive for mobile and desktop

## Running locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Sign up with any email/password (stored locally in SQLite; passwords are bcrypt-hashed).

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

Seed content: **2 chapters per subject, 10 questions each (100 total)** to validate the flow
end-to-end. Remaining chapters are listed but awaiting questions.

## Data model (SQLite)

- `users` — id, name, email (unique), bcrypt password hash
- `sessions` — token, user id, expiry (30 days)
- `attempts` — user id, subject, chapter (null for mocks), kind, score, total, time taken, and a
  JSON `detail` of per-question answers for the review screen

## What's left / roadmap

- Fill in question banks for all remaining chapters (target 15+ per chapter)
- Board-style mark weightage per chapter in mock tests
- Optional: per-question timing analytics, spaced-repetition of weak questions
