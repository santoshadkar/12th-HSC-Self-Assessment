import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSubjects } from "@/lib/questions";
import Header from "@/components/Header";

type AttemptRow = {
  id: number;
  subject_id: string;
  chapter_id: string | null;
  kind: string;
  score: number;
  total: number;
  created_at: string;
};

function pctClass(pct: number) {
  return pct >= 75 ? "pct-pill pct-good" : pct >= 50 ? "pct-pill pct-mid" : "pct-pill pct-low";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const attempts = db
    .prepare(
      `SELECT id, subject_id, chapter_id, kind, score, total, created_at
       FROM attempts WHERE user_id = ? ORDER BY id ASC`
    )
    .all(user.id) as AttemptRow[];

  const subjects = getSubjects();
  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  const totalAttempts = attempts.length;
  const overallPct =
    totalAttempts > 0
      ? Math.round(
          (attempts.reduce((sum, a) => sum + a.score, 0) /
            attempts.reduce((sum, a) => sum + a.total, 0)) *
            100
        )
      : 0;
  const bestPct =
    totalAttempts > 0
      ? Math.max(...attempts.map((a) => Math.round((a.score / a.total) * 100)))
      : 0;

  // per-subject stats
  const bySubject = subjects
    .map((subject) => {
      const list = attempts.filter((a) => a.subject_id === subject.id);
      if (list.length === 0) return null;
      const pct = Math.round(
        (list.reduce((s, a) => s + a.score, 0) / list.reduce((s, a) => s + a.total, 0)) * 100
      );
      return { subject, count: list.length, pct };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // weak chapters: avg < 60% across chapter attempts
  const chapterAgg = new Map<string, { score: number; total: number; count: number }>();
  for (const a of attempts) {
    if (!a.chapter_id) continue;
    const key = `${a.subject_id}|${a.chapter_id}`;
    const agg = chapterAgg.get(key) ?? { score: 0, total: 0, count: 0 };
    agg.score += a.score;
    agg.total += a.total;
    agg.count += 1;
    chapterAgg.set(key, agg);
  }
  const weakChapters = [...chapterAgg.entries()]
    .map(([key, agg]) => {
      const [subjectId, chapterId] = key.split("|");
      const subject = subjectById.get(subjectId);
      const chapter = subject?.chapters.find((c) => c.id === chapterId);
      return {
        subjectId,
        chapterId,
        subjectName: subject?.shortName ?? subjectId,
        chapterName: chapter?.name ?? chapterId,
        pct: Math.round((agg.score / agg.total) * 100),
        count: agg.count,
      };
    })
    .filter((c) => c.pct < 60)
    .sort((a, b) => a.pct - b.pct);

  const recent = [...attempts].reverse().slice(0, 10);
  const trend = attempts.slice(-12).map((a) => ({
    id: a.id,
    pct: Math.round((a.score / a.total) * 100),
  }));

  return (
    <>
      <Header user={user} />
      <main className="page">
        <h1 className="page-title">Hi {user.name.split(" ")[0]} 👋</h1>
        <p className="page-subtitle">Here's how your preparation is going.</p>

        {totalAttempts === 0 ? (
          <div className="card empty-state">
            <p style={{ marginBottom: "1rem" }}>
              No attempts yet. Take your first chapter quiz to start tracking progress.
            </p>
            <Link className="btn" href="/subjects">
              Browse subjects
            </Link>
          </div>
        ) : (
          <>
            <div className="stat-grid">
              <div className="card stat">
                <p className="label">Attempts</p>
                <p className="value">{totalAttempts}</p>
              </div>
              <div className="card stat">
                <p className="label">Average score</p>
                <p className="value">{overallPct}%</p>
              </div>
              <div className="card stat">
                <p className="label">Best score</p>
                <p className="value">{bestPct}%</p>
              </div>
              <div className="card stat">
                <p className="label">Subjects tried</p>
                <p className="value">
                  {bySubject.length}/{subjects.length}
                </p>
              </div>
            </div>

            <div className="card">
              <p className="label" style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600 }}>
                SCORE TREND (LAST {trend.length} ATTEMPTS)
              </p>
              <div className="trend">
                {trend.map((t) => (
                  <div
                    key={t.id}
                    className="bar"
                    style={{ height: `${Math.max(4, t.pct)}%` }}
                    title={`${t.pct}%`}
                  />
                ))}
              </div>
            </div>

            <h2 className="section-title">Performance by subject</h2>
            <div className="card table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Attempts</th>
                    <th>Average</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bySubject.map(({ subject, count, pct }) => (
                    <tr key={subject.id}>
                      <td>{subject.name}</td>
                      <td>{count}</td>
                      <td>
                        <span className={pctClass(pct)}>{pct}%</span>
                      </td>
                      <td>
                        <Link href={`/subjects/${subject.id}`}>Practise →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="section-title">Weak chapters (below 60%)</h2>
            <div className="card">
              {weakChapters.length === 0 ? (
                <p className="card-meta">
                  Nothing below 60% — nice! Keep attempting new chapters to find gaps.
                </p>
              ) : (
                weakChapters.map((c) => (
                  <div className="weak-chapter" key={`${c.subjectId}|${c.chapterId}`}>
                    <div>
                      <strong>{c.chapterName}</strong>
                      <p className="card-meta">
                        {c.subjectName} · {c.count} attempt{c.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
                      <span className={pctClass(c.pct)}>{c.pct}%</span>
                      <Link className="btn secondary small" href={`/quiz/${c.subjectId}/${c.chapterId}`}>
                        Retry
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <h2 className="section-title">Recent attempts</h2>
            <div className="card table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Test</th>
                    <th>Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((a) => {
                    const subject = subjectById.get(a.subject_id);
                    const chapterName = a.chapter_id
                      ? subject?.chapters.find((c) => c.id === a.chapter_id)?.name
                      : "Mock test";
                    const pct = Math.round((a.score / a.total) * 100);
                    return (
                      <tr key={a.id}>
                        <td>{a.created_at.slice(0, 16).replace("T", " ")}</td>
                        <td>
                          {subject?.shortName ?? a.subject_id} — {chapterName}
                        </td>
                        <td>
                          <span className={pctClass(pct)}>
                            {a.score}/{a.total}
                          </span>
                        </td>
                        <td>
                          <Link href={`/results/${a.id}`}>Review →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link className="btn" href="/subjects">
            Start a new quiz
          </Link>
        </div>
      </main>
    </>
  );
}
