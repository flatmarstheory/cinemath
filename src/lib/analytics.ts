import type { Lesson, Problem } from "./schema";
import type { Action, Progress } from "./progress";

// Problem-level analytics events, per ROADMAP.md Phase 2. There is no
// analytics backend yet: emitAnalyticsEvent dispatches a DOM CustomEvent a
// real provider can subscribe to later, and logs in development. Event
// derivation itself is a pure function so it can be unit tested without a
// browser.
export type AnalyticsEvent =
  | { type: "lesson_start"; lessonId: string }
  | { type: "problem_view"; lessonId: string; problemId: string; index: number }
  | {
      type: "answer_submit";
      lessonId: string;
      problemId: string;
      correct: boolean;
      attemptNumber: number;
    }
  | {
      type: "hint_reveal";
      lessonId: string;
      problemId: string;
      hintOrder: number;
    }
  | { type: "solution_reveal"; lessonId: string; problemId: string }
  | { type: "lesson_complete"; lessonId: string };

export function analyticsEventFor(
  lesson: Lesson,
  problem: Problem,
  before: Progress,
  after: Progress,
  action: Action,
): AnalyticsEvent | null {
  const lessonId = lesson.lessonId;
  const problemId = problem.id;
  switch (action.type) {
    case "start":
      if (before.stage === "intro" && after.stage === "practice")
        return { type: "lesson_start", lessonId };
      return null;
    case "submit":
    case "submit_proof": {
      const beforeRecord = before.records[before.index];
      const afterRecord = after.records[before.index];
      if (afterRecord.attempts.length === beforeRecord.attempts.length)
        return null;
      const attempt = afterRecord.attempts.at(-1)!;
      return {
        type: "answer_submit",
        lessonId,
        problemId,
        correct: attempt.correct,
        attemptNumber: afterRecord.attempts.length,
      };
    }
    case "hint": {
      const afterRecord = after.records[before.index];
      const beforeRecord = before.records[before.index];
      if (afterRecord.hintsUsed === beforeRecord.hintsUsed) return null;
      return {
        type: "hint_reveal",
        lessonId,
        problemId,
        hintOrder: afterRecord.hintsUsed,
      };
    }
    case "solution": {
      if (
        after.records[before.index].solutionRevealed ===
        before.records[before.index].solutionRevealed
      )
        return null;
      return { type: "solution_reveal", lessonId, problemId };
    }
    case "next":
      if (after.stage === "complete" && before.stage !== "complete")
        return { type: "lesson_complete", lessonId };
      if (after.index !== before.index)
        return {
          type: "problem_view",
          lessonId,
          problemId: lesson.problems[after.index].id,
          index: after.index,
        };
      return null;
    default:
      return null;
  }
}

export function emitAnalyticsEvent(event: AnalyticsEvent | null) {
  if (!event) return;
  if (process.env.NODE_ENV !== "test")
    console.debug("[cinemath:analytics]", event);
  if (typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent("cinemath:analytics", { detail: event }),
    );
}
