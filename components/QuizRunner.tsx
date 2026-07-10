"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientQuestion } from "@/lib/questions";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

type Props = {
  subjectId: string;
  subjectName: string;
  chapterId: string | null;
  title: string;
  kind: "chapter" | "mock";
  durationSeconds: number;
  questions: ClientQuestion[];
};

function formatTime(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function QuizRunner({
  subjectId,
  subjectName,
  chapterId,
  title,
  kind,
  durationSeconds,
  questions,
}: Props) {
  const router = useRouter();
  const [selections, setSelections] = useState<(number | null)[]>(() =>
    questions.map(() => null)
  );
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const selectionsRef = useRef(selections);
  selectionsRef.current = selections;
  const secondsRef = useRef(secondsLeft);
  secondsRef.current = secondsLeft;

  const submit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current) return;
      const current = selectionsRef.current;
      if (!auto) {
        const unanswered = current.filter((s) => s === null).length;
        if (
          unanswered > 0 &&
          !window.confirm(
            `You have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`
          )
        ) {
          return;
        }
      }
      submittedRef.current = true;
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectId,
            chapterId,
            kind,
            timeTakenSeconds: durationSeconds - Math.max(0, secondsRef.current),
            answers: questions.map((q, i) => ({
              questionId: q.id,
              selected: current[i] ?? -1,
            })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Submission failed");
        router.push(`/results/${data.attemptId}`);
      } catch (e) {
        submittedRef.current = false;
        setSubmitting(false);
        setError(e instanceof Error ? e.message : "Submission failed. Please try again.");
      }
    },
    [subjectId, chapterId, kind, durationSeconds, questions, router]
  );

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) submit(true);
  }, [secondsLeft, submit]);

  const question = questions[index];
  const answeredCount = selections.filter((s) => s !== null).length;

  function choose(optionIndex: number) {
    setSelections((prev) => {
      const next = [...prev];
      next[index] = optionIndex;
      return next;
    });
  }

  return (
    <main className="page">
      <div className="quiz-top">
        <div className="titles">
          <h1>{title}</h1>
          <p>
            {subjectName} · {kind === "mock" ? "Mock test" : "Chapter quiz"} ·{" "}
            {answeredCount}/{questions.length} answered
          </p>
        </div>
        <div className={`timer${secondsLeft <= 60 ? " warning" : ""}`} aria-live="polite">
          ⏱ {formatTime(secondsLeft)}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="card question-card">
        <p className="q-count">
          Question {index + 1} of {questions.length}
        </p>
        <p className="q-text">{question.question}</p>
        <div className="options">
          {question.options.map((option, i) => (
            <button
              key={i}
              type="button"
              className={`option${selections[index] === i ? " selected" : ""}`}
              onClick={() => choose(i)}
            >
              <span className="letter">{LETTERS[i]}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        <div className="quiz-nav">
          <button
            type="button"
            className="btn secondary"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0 || submitting}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={index === questions.length - 1 || submitting}
          >
            Next →
          </button>
          <span className="spacer" />
          <button type="button" className="btn" onClick={() => submit(false)} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>

        <div className="palette" aria-label="Question palette">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${selections[i] !== null ? "answered" : ""}${i === index ? " current" : ""}`}
              onClick={() => setIndex(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
