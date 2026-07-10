import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSubject, gradeAnswers, type AnswerSubmission } from "@/lib/questions";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const subjectId = typeof body?.subjectId === "string" ? body.subjectId : "";
  const chapterId = typeof body?.chapterId === "string" ? body.chapterId : null;
  const kind = body?.kind === "mock" ? "mock" : body?.kind === "chapter" ? "chapter" : null;
  const timeTakenSeconds = Number.isFinite(body?.timeTakenSeconds)
    ? Math.max(0, Math.round(body.timeTakenSeconds))
    : 0;

  const subject = getSubject(subjectId);
  if (!subject || !kind) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }
  if (kind === "chapter" && (!chapterId || !subject.chapters.some((c) => c.id === chapterId))) {
    return NextResponse.json({ error: "Invalid chapter." }, { status: 400 });
  }

  const rawAnswers = Array.isArray(body?.answers) ? body.answers : null;
  if (!rawAnswers || rawAnswers.length === 0 || rawAnswers.length > 200) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }
  const answers: AnswerSubmission[] = [];
  const seen = new Set<string>();
  for (const a of rawAnswers) {
    if (typeof a?.questionId !== "string" || !Number.isInteger(a?.selected)) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }
    if (seen.has(a.questionId)) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }
    seen.add(a.questionId);
    answers.push({ questionId: a.questionId, selected: a.selected });
  }

  const graded = gradeAnswers(subjectId, answers);
  if (!graded) {
    return NextResponse.json({ error: "Unknown question in submission." }, { status: 400 });
  }

  const info = db
    .prepare(
      `INSERT INTO attempts (user_id, subject_id, chapter_id, kind, score, total, time_taken_seconds, detail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      user.id,
      subjectId,
      kind === "chapter" ? chapterId : null,
      kind,
      graded.score,
      graded.total,
      timeTakenSeconds,
      JSON.stringify(graded.detail)
    );

  return NextResponse.json({
    attemptId: Number(info.lastInsertRowid),
    score: graded.score,
    total: graded.total,
  });
}
