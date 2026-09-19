import type { Lesson } from "./schema";
import type { Progress } from "./progress";
export const MASTERY_ALPHA = 0.12;
export const MASTERY_BETA = 0.03;
export const REVIEW_THRESHOLD = 0.6;
export type MasteryRecord = {
  conceptId: string;
  score: number;
  attempts: number;
  correct: number;
  hints: number;
  lastPracticedAt: string | null;
};
export type ReviewItem = {
  lessonId: string;
  lessonTitle: string;
  conceptId: string;
  score: number;
  reason: "developing" | "unfinished" | "due";
};
// Phase 6 "review scheduling improvements" (ROADMAP.md): a small,
// deterministic spaced-repetition tier on top of the Phase 3 mastery score,
// not a full SRS algorithm (out of scope per ROADMAP.md "full spaced
// repetition system" as a non-goal for the vertical slice; this keeps that
// boundary while still spacing out review of concepts a learner already
// cleared). Higher mastery earns a longer gap before a concept is
// resurfaced; a concept below REVIEW_THRESHOLD is always due regardless of
// how recently it was practiced.
export function reviewIntervalDays(score: number) {
  if (score < 0.4) return 1;
  if (score < 0.6) return 3;
  if (score < 0.8) return 7;
  return 14;
}
type Attempt = Progress["records"][number]["attempts"][number];
export function updateMastery(
  score: number,
  difficulty: number,
  attempt: Attempt,
) {
  const quality = attempt.solutionRevealed ? 0 : attempt.correct ? 1 : -1;
  return Math.max(
    0,
    Math.min(
      1,
      score +
        MASTERY_ALPHA * (difficulty / 5) * quality -
        MASTERY_BETA * (attempt.hintsUsed / 3),
    ),
  );
}
export function masteryForCourse(
  lessons: Lesson[],
  progressByLesson: Map<string, Progress>,
): MasteryRecord[] {
  const records = new Map<string, MasteryRecord>();
  const events: {
    conceptId: string;
    attempt: Attempt;
    difficulty: number;
    key: string;
  }[] = [];
  for (const lesson of lessons) {
    const progress = progressByLesson.get(lesson.lessonId);
    if (!progress) continue;
    for (const conceptId of lesson.master.conceptsUpdated) {
      if (!records.has(conceptId))
        records.set(conceptId, {
          conceptId,
          score: 0,
          attempts: 0,
          correct: 0,
          hints: 0,
          lastPracticedAt: null,
        });
      lesson.problems.forEach((problem, i) => {
        if (!problem.concepts.includes(conceptId)) return;
        const attempts = [
          ...progress.records[i].attempts,
          ...(progress.reviewAttempts ?? [])
            .filter((a) => a.problemIndex === i)
            .map((a) => a.attempt),
        ];
        attempts.forEach((attempt, j) =>
          events.push({
            conceptId,
            attempt,
            difficulty: problem.difficulty,
            key: `${lesson.lessonId}:${problem.id}:${String(j).padStart(8, "0")}`,
          }),
        );
      });
    }
  }
  events.sort(
    (a, b) =>
      Date.parse(a.attempt.at) - Date.parse(b.attempt.at) ||
      a.key.localeCompare(b.key),
  );
  for (const { conceptId, attempt, difficulty } of events) {
    const record = records.get(conceptId)!;
    record.score = updateMastery(record.score, difficulty, attempt);
    record.attempts++;
    record.correct += Number(attempt.correct && !attempt.solutionRevealed);
    record.hints += attempt.hintsUsed;
    record.lastPracticedAt = attempt.at;
  }
  return [...records.values()].sort((a, b) =>
    a.conceptId.localeCompare(b.conceptId),
  );
}
export function masteryForLesson(lesson: Lesson, progress: Progress) {
  return masteryForCourse([lesson], new Map([[lesson.lessonId, progress]]));
}
export function reviewQueue(
  lessons: Lesson[],
  progressByLesson: Map<string, Progress>,
  now: number = Date.now(),
): ReviewItem[] {
  return masteryForCourse(lessons, progressByLesson)
    .filter((record) => {
      if (record.score < REVIEW_THRESHOLD) return true;
      if (!record.lastPracticedAt) return false;
      const daysSince =
        (now - Date.parse(record.lastPracticedAt)) / 86400000;
      return daysSince >= reviewIntervalDays(record.score);
    })
    .flatMap((record) => {
      const lesson = lessons.find(
        (l) =>
          progressByLesson.has(l.lessonId) &&
          l.problems.some((p) => p.concepts.includes(record.conceptId)),
      );
      if (!lesson) return [];
      const unfinished =
        progressByLesson.get(lesson.lessonId)?.stage !== "complete";
      return [
        {
          lessonId: lesson.lessonId,
          lessonTitle: lesson.title,
          conceptId: record.conceptId,
          score: record.score,
          reason: unfinished
            ? ("unfinished" as const)
            : record.score < REVIEW_THRESHOLD
              ? ("developing" as const)
              : ("due" as const),
        },
      ];
    })
    .sort(
      (a, b) => a.score - b.score || a.conceptId.localeCompare(b.conceptId),
    );
}
