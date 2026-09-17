import { z } from "zod";
import { answerSchema, type Answer, type Lesson } from "./schema";
import { grade, initialAnswer } from "./grading";

// docs/grading-policy.md: two incorrect attempts OR any correct submission.
export const INCORRECT_ATTEMPTS_TO_REVEAL = 2;
const attemptSchema = z.object({
  answer: answerSchema,
  correct: z.boolean(),
  at: z.string().datetime(),
  hintsUsed: z.number().int().min(0).max(3),
  solutionRevealed: z.boolean(),
});
const recordSchema = z.object({
  draft: answerSchema,
  attempts: z.array(attemptSchema),
  hintsUsed: z.number().int().min(0).max(3),
  solutionRevealed: z.boolean(),
});
const progressSchema = z.object({
  formatVersion: z.literal(1),
  lessonId: z.string(),
  stage: z.enum(["intro", "practice", "complete"]),
  index: z.number().int().nonnegative(),
  records: z.array(recordSchema),
});
export type Progress = z.infer<typeof progressSchema>;
export type ProblemProgress = Progress["records"][number];
export function newProgress(lesson: Lesson): Progress {
  return {
    formatVersion: 1,
    lessonId: lesson.lessonId,
    stage: "intro",
    index: 0,
    records: lesson.problems.map((p) => ({
      draft: initialAnswer(p),
      attempts: [],
      hintsUsed: 0,
      solutionRevealed: false,
    })),
  };
}
export function storageKey(lesson: Lesson) {
  return `cinemath:v1:${lesson.lessonId}:${lesson.problems.map((p) => `${p.id}@${p.version}`).join("|")}`;
}
export function canReveal(record: ProblemProgress) {
  return (
    record.attempts.some((a) => a.correct) ||
    record.attempts.filter((a) => !a.correct).length >=
      INCORRECT_ATTEMPTS_TO_REVEAL
  );
}
export function isFinished(record: ProblemProgress) {
  return record.attempts.some((a) => a.correct) || record.solutionRevealed;
}
export type Action =
  | { type: "start" }
  | { type: "draft"; answer: Answer }
  | { type: "submit"; at: string }
  | { type: "hint" }
  | { type: "solution" }
  | { type: "next" }
  | { type: "review" };
export function transition(
  lesson: Lesson,
  progress: Progress,
  action: Action,
): Progress {
  const next = structuredClone(progress);
  const record = next.records[next.index];
  const problem = lesson.problems[next.index];
  if (action.type === "review") {
    next.stage = "intro";
    return next;
  }
  if (action.type === "start") {
    next.stage = "practice";
    return next;
  }
  if (next.stage !== "practice") return progress;
  switch (action.type) {
    case "draft":
      record.draft = action.answer;
      break;
    case "submit": {
      if (record.attempts.some((a) => a.correct)) return progress;
      const result = grade(problem, record.draft);
      if (!result.valid) return progress;
      record.attempts.push({
        answer: structuredClone(record.draft),
        correct: result.correct,
        at: action.at,
        hintsUsed: record.hintsUsed,
        solutionRevealed: record.solutionRevealed,
      });
      break;
    }
    case "hint":
      record.hintsUsed = Math.min(3, record.hintsUsed + 1);
      break;
    case "solution":
      if (canReveal(record)) record.solutionRevealed = true;
      break;
    case "next":
      if (!isFinished(record)) return progress;
      if (next.index === lesson.problems.length - 1) next.stage = "complete";
      else next.index += 1;
  }
  return next;
}
export function encodeProgress(lesson: Lesson, progress: Progress) {
  // Preserve the authored version alongside responses, even after future content updates.
  return JSON.stringify({ contentSnapshot: lesson, progress });
}
export function decodeProgress(lesson: Lesson, raw: string): Progress {
  const envelope = z
    .object({ contentSnapshot: z.unknown(), progress: progressSchema })
    .parse(JSON.parse(raw) as unknown);
  const progress = envelope.progress;
  if (
    JSON.stringify(envelope.contentSnapshot) !== JSON.stringify(lesson) ||
    progress.lessonId !== lesson.lessonId ||
    progress.records.length !== lesson.problems.length ||
    progress.index >= lesson.problems.length
  )
    throw new Error("Saved content does not match this lesson version");
  progress.records.forEach((record, i) => {
    const problem = lesson.problems[i];
    if (record.draft.kind !== initialAnswer(problem).kind)
      throw new Error("Wrong saved answer type");
    if (record.draft.kind === "order" && !grade(problem, record.draft).valid)
      throw new Error("Invalid saved proof order");
    if (
      record.draft.kind === "choice" &&
      record.draft.selected.length > 0 &&
      !grade(problem, record.draft).valid
    )
      throw new Error("Invalid saved option selection");
    for (const [j, attempt] of record.attempts.entries()) {
      const result = grade(problem, attempt.answer);
      const before = { ...record, attempts: record.attempts.slice(0, j) };
      if (
        !result.valid ||
        result.correct !== attempt.correct ||
        (attempt.solutionRevealed && !canReveal(before)) ||
        attempt.hintsUsed > record.hintsUsed ||
        (attempt.solutionRevealed && !record.solutionRevealed)
      )
        throw new Error("Invalid saved attempt");
    }
    if (record.solutionRevealed && !canReveal(record))
      throw new Error("Invalid solution reveal");
    if (i < progress.index && !isFinished(record))
      throw new Error("Invalid lesson position");
  });
  if (progress.stage === "complete" && !progress.records.every(isFinished))
    throw new Error("Incomplete lesson");
  return progress;
}
export function summarize(lesson: Lesson, progress: Progress) {
  const records = progress.records;
  return {
    firstCorrect: records.filter((r) => r.attempts[0]?.correct).length,
    correct: records.filter((r) => r.attempts.some((a) => a.correct)).length,
    attempts: records.reduce((sum, r) => sum + r.attempts.length, 0),
    hints: records.reduce((sum, r) => sum + r.hintsUsed, 0),
    helpedProblems: records.filter((r) => r.hintsUsed > 0).length,
    solutions: records.filter((r) => r.solutionRevealed).length,
    concepts: lesson.master.conceptsUpdated.map((id) => {
      const relevant = records.filter((_, i) =>
        lesson.problems[i].concepts.includes(id),
      );
      const attempted = relevant.filter((r) => r.attempts.length > 0).length;
      const correct = relevant.filter((r) =>
        r.attempts.some((a) => a.correct && !a.solutionRevealed),
      ).length;
      const solid =
        relevant.length > 0 &&
        relevant.every((r) =>
          r.attempts.some(
            (a) => a.correct && a.hintsUsed === 0 && !a.solutionRevealed,
          ),
        );
      return { id, attempted, correct, status: solid ? "Solid" : "Developing" };
    }),
  };
}
