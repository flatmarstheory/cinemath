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
  reason: "developing" | "unfinished";
};
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
): ReviewItem[] {
  return masteryForCourse(lessons, progressByLesson)
    .filter((record) => record.score < REVIEW_THRESHOLD)
    .flatMap((record) => {
      const lesson = lessons.find(
        (l) =>
          progressByLesson.has(l.lessonId) &&
          l.problems.some((p) => p.concepts.includes(record.conceptId)),
      );
      return lesson
        ? [
            {
              lessonId: lesson.lessonId,
              lessonTitle: lesson.title,
              conceptId: record.conceptId,
              score: record.score,
              reason:
                progressByLesson.get(lesson.lessonId)?.stage === "complete"
                  ? ("developing" as const)
                  : ("unfinished" as const),
            },
          ]
        : [];
    })
    .sort(
      (a, b) => a.score - b.score || a.conceptId.localeCompare(b.conceptId),
    );
}
