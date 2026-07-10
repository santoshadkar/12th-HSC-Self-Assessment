import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { findQuestion, getSubject, type GradedAnswer } from "@/lib/questions";
import Header from "@/components/Header";

type AttemptRow = {
  id: number;
  user_id: number;
  subject_id: string;
  chapter_id: string | null;
  kind: string;
  score: number;
  total: number;
  time_taken_seconds: number;
  detail: string;
  created_at: string;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { attemptId } = await params;
  const attemptIdNum = Number(attemptId);
  if (!Number.isInteger(attemptIdNum)) notFound();

  const { rows } = await sql<AttemptRow>`SELECT * FROM attempts WHERE id = ${attemptIdNum}`;
  const attempt = rows[0];
  if (!attempt || attempt.user_id !== user.id) notFound();

  const subject = getSubject(attempt.subject_id);
  const chapterName = attempt.chapter_id
    ? subject?.chapters.find((c) => c.id === attempt.chapter_id)?.name
    : null;
  const detail = JSON.parse(attempt.detail) as GradedAnswer[];
  const pct = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
  const verdict = pct >= 75 ? "Excellent work!" : pct >= 50 ? "Good effort — review the explanations below." : "Keep practising — the explanations below will help.";

  const retryHref = attempt.chapter_id
    ? `/quiz/${attempt.subject_id}/${attempt.chapter_id}`
    : `/quiz/${attempt.subject_id}/mock`;

  return (
    <>
      <Header user={user} />
      <main className="page">
        <div className="card score-hero">
          <p className="card-meta">
            {subject?.name ?? attempt.subject_id} ·{" "}
            {attempt.kind === "mock" ? "Full Mock Test" : chapterName ?? "Chapter quiz"}
          </p>
          <p className="big">
            {attempt.score} / {attempt.total}
          </p>
          <p className="pct">
            {pct}% · time taken {formatDuration(attempt.time_taken_seconds)} · {verdict}
          </p>
          <div className="actions">
            <Link className="btn" href="/dashboard">
              Go to dashboard
            </Link>
            <Link className="btn secondary" href={retryHref}>
              Retry
            </Link>
            <Link className="btn secondary" href={`/subjects/${attempt.subject_id}`}>
              More {subject?.shortName ?? ""} quizzes
            </Link>
          </div>
        </div>

        <h2 className="section-title">Answers &amp; explanations</h2>
        {detail.map((entry, i) => {
          const question = findQuestion(attempt.subject_id, entry.questionId);
          if (!question) return null;
          return (
            <div className="card review-item" key={entry.questionId}>
              <p className="card-meta">
                Question {i + 1} · {entry.correct ? "Correct" : entry.selected === -1 ? "Skipped" : "Incorrect"}
              </p>
              <p className="q-text">{question.question}</p>
              {question.options.map((option, oi) => {
                const isCorrect = oi === entry.correctIndex;
                const isChosen = oi === entry.selected;
                const cls = isCorrect
                  ? "review-option correct"
                  : isChosen
                    ? "review-option wrong"
                    : "review-option";
                return (
                  <div key={oi} className={cls}>
                    <span className="letter" style={{ fontWeight: 700, color: "var(--muted)" }}>
                      {LETTERS[oi]}
                    </span>
                    <span>{option}</span>
                    {isCorrect && <span className="tag">✓ Correct answer</span>}
                    {isChosen && !isCorrect && <span className="tag">✗ Your answer</span>}
                  </div>
                );
              })}
              <div className="explanation">{question.explanation}</div>
            </div>
          );
        })}
      </main>
    </>
  );
}
