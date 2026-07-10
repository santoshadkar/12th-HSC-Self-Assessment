import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getSubject,
  chapterQuestionCount,
  subjectQuestionCount,
  SECONDS_PER_QUESTION,
} from "@/lib/questions";
import Header from "@/components/Header";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  const totalQuestions = subjectQuestionCount(subject.id);
  const mockCount = Math.min(subject.mock.questionCount, totalQuestions);
  const mockMinutes = Math.ceil((mockCount * SECONDS_PER_QUESTION) / 60);

  return (
    <>
      <Header user={user} />
      <main className="page">
        <p className="page-subtitle" style={{ marginBottom: "0.2rem" }}>
          <Link href="/subjects">← All subjects</Link>
        </p>
        <h1 className="page-title">{subject.name}</h1>
        <p className="page-subtitle">
          Pick a chapter quiz, or take a full-length mock test drawn from every chapter.
          {subject.note ? ` ${subject.note}` : ""}
        </p>

        <div className="card" style={{ marginBottom: "1rem", borderTop: `4px solid ${subject.color}` }}>
          <div className="chapter-row">
            <div>
              <strong>Full mock test</strong>
              <p className="card-meta">
                {mockCount} questions across chapters · {mockMinutes} min · auto-submits on time-up
              </p>
            </div>
            {totalQuestions > 0 ? (
              <Link className="btn" href={`/quiz/${subject.id}/mock`}>
                Start mock test
              </Link>
            ) : (
              <span className="badge">Questions coming soon</span>
            )}
          </div>
        </div>

        <div className="card">
          <ul className="chapter-list">
            {subject.chapters.map((chapter, i) => {
              const count = chapterQuestionCount(subject.id, chapter.id);
              const minutes = Math.ceil((count * SECONDS_PER_QUESTION) / 60);
              return (
                <li key={chapter.id} className={`chapter-row${count === 0 ? " disabled" : ""}`}>
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "baseline" }}>
                    <span className="num">{i + 1}.</span>
                    <div>
                      <strong>{chapter.name}</strong>
                      {count > 0 && (
                        <p className="card-meta">
                          {count} questions · {minutes} min
                        </p>
                      )}
                    </div>
                  </div>
                  {count > 0 ? (
                    <Link className="btn secondary small" href={`/quiz/${subject.id}/${chapter.id}`}>
                      Start quiz
                    </Link>
                  ) : (
                    <span className="badge">Coming soon</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </>
  );
}
