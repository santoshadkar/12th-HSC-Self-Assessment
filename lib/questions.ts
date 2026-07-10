import fs from "fs";
import path from "path";

export type Question = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

// What the browser receives — no answers or explanations
export type ClientQuestion = { id: string; question: string; options: string[] };

export type Chapter = { id: string; name: string };

export type Subject = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  note?: string;
  mock: { questionCount: number };
  chapters: Chapter[];
};

export const SECONDS_PER_QUESTION = 90;

type Bank = Record<string, Question[]>; // chapterId -> questions

type Cache = { subjects: Subject[]; banks: Record<string, Bank> };

const dataDir = path.join(process.cwd(), "data");
let cache: Cache | null = null;

function load(): Cache {
  if (cache) return cache;
  const syllabus = JSON.parse(fs.readFileSync(path.join(dataDir, "syllabus.json"), "utf8")) as {
    subjects: Subject[];
  };
  const banks: Record<string, Bank> = {};
  for (const subject of syllabus.subjects) {
    const file = path.join(dataDir, "questions", `${subject.id}.json`);
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { chapters: Bank };
      banks[subject.id] = parsed.chapters;
    } else {
      banks[subject.id] = {};
    }
  }
  cache = { subjects: syllabus.subjects, banks };
  return cache;
}

export function getSubjects(): Subject[] {
  return load().subjects;
}

export function getSubject(subjectId: string): Subject | undefined {
  return load().subjects.find((s) => s.id === subjectId);
}

export function getChapterQuestions(subjectId: string, chapterId: string): Question[] {
  return load().banks[subjectId]?.[chapterId] ?? [];
}

export function chapterQuestionCount(subjectId: string, chapterId: string): number {
  return getChapterQuestions(subjectId, chapterId).length;
}

export function subjectQuestionCount(subjectId: string): number {
  const bank = load().banks[subjectId] ?? {};
  return Object.values(bank).reduce((sum, qs) => sum + qs.length, 0);
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Mock test: draw questions across all chapters that have content
export function getMockQuestions(subjectId: string): Question[] {
  const subject = getSubject(subjectId);
  if (!subject) return [];
  const bank = load().banks[subjectId] ?? {};
  const all = Object.values(bank).flat();
  return shuffle(all).slice(0, subject.mock.questionCount);
}

export function sanitize(questions: Question[]): ClientQuestion[] {
  return questions.map(({ id, question, options }) => ({ id, question, options }));
}

export function findQuestion(subjectId: string, questionId: string): Question | undefined {
  const bank = load().banks[subjectId] ?? {};
  for (const questions of Object.values(bank)) {
    const found = questions.find((q) => q.id === questionId);
    if (found) return found;
  }
  return undefined;
}

export type AnswerSubmission = { questionId: string; selected: number };
export type GradedAnswer = {
  questionId: string;
  selected: number;
  correctIndex: number;
  correct: boolean;
};

export function gradeAnswers(
  subjectId: string,
  answers: AnswerSubmission[]
): { score: number; total: number; detail: GradedAnswer[] } | null {
  const detail: GradedAnswer[] = [];
  for (const answer of answers) {
    const question = findQuestion(subjectId, answer.questionId);
    if (!question) return null;
    const correct = answer.selected === question.answerIndex;
    detail.push({
      questionId: answer.questionId,
      selected: answer.selected,
      correctIndex: question.answerIndex,
      correct,
    });
  }
  return { score: detail.filter((d) => d.correct).length, total: detail.length, detail };
}
