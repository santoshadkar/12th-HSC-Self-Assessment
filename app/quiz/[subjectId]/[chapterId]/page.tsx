import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getSubject,
  getChapterQuestions,
  getMockQuestions,
  sanitize,
  SECONDS_PER_QUESTION,
} from "@/lib/questions";
import QuizRunner from "@/components/QuizRunner";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ subjectId: string; chapterId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { subjectId, chapterId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  const isMock = chapterId === "mock";
  const chapter = isMock ? null : subject.chapters.find((c) => c.id === chapterId);
  if (!isMock && !chapter) notFound();

  const questions = isMock
    ? getMockQuestions(subject.id)
    : getChapterQuestions(subject.id, chapterId);

  if (questions.length === 0) redirect(`/subjects/${subject.id}`);

  return (
    <QuizRunner
      subjectId={subject.id}
      subjectName={subject.name}
      chapterId={isMock ? null : chapterId}
      title={isMock ? "Full Mock Test" : chapter!.name}
      kind={isMock ? "mock" : "chapter"}
      durationSeconds={questions.length * SECONDS_PER_QUESTION}
      questions={sanitize(questions)}
    />
  );
}
