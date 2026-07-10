import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSubjects, chapterQuestionCount } from "@/lib/questions";
import Header from "@/components/Header";

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subjects = getSubjects();

  return (
    <>
      <Header user={user} />
      <main className="page">
        <h1 className="page-title">Choose a subject</h1>
        <p className="page-subtitle">
          MSBSHSE HSC (12th) Science — chapter quizzes and full-length mock tests.
        </p>
        <div className="grid">
          {subjects.map((subject) => {
            const ready = subject.chapters.filter(
              (ch) => chapterQuestionCount(subject.id, ch.id) > 0
            ).length;
            return (
              <Link
                key={subject.id}
                href={`/subjects/${subject.id}`}
                className="card subject-card"
                style={{ ["--accent" as string]: subject.color }}
              >
                <h2>{subject.name}</h2>
                <p className="card-meta">
                  {subject.chapters.length} chapters · {ready} with questions · 1 mock test
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
