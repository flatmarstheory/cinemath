import { describe, expect, it } from "vitest";
import { lessons } from "../src/lib/content";
import {
  masteryForLesson,
  masteryForCourse,
  reviewQueue,
  updateMastery,
} from "../src/lib/mastery";
import { newProgress, transition } from "../src/lib/progress";

const lesson = lessons[0];

describe("transparent mastery model", () => {
  const attempt = {
    answer: { kind: "choice" as const, selected: ["a"] },
    correct: true,
    at: "2026-09-17T10:00:00Z",
    hintsUsed: 0,
    solutionRevealed: false,
  };
  it("applies exact coefficients, clamping, hint costs and solution penalties", () => {
    expect(updateMastery(0, 3, attempt)).toBeCloseTo(0.072);
    expect(updateMastery(0, 3, { ...attempt, hintsUsed: 2 })).toBeCloseTo(
      0.052,
    );
    expect(updateMastery(0.5, 3, { ...attempt, correct: false })).toBeCloseTo(
      0.428,
    );
    expect(updateMastery(0, 5, { ...attempt, correct: false })).toBe(0);
    expect(updateMastery(0.99, 5, attempt)).toBe(1);
    expect(updateMastery(0.5, 5, { ...attempt, solutionRevealed: true })).toBe(
      0.5,
    );
  });
  it("breaks equal-timestamp ties by lessonId, then problemId, then attempt index", () => {
    const a = structuredClone(lesson);
    const b = structuredClone(lesson);
    b.lessonId = "aaa-earlier-lesson";
    const conceptId = lesson.problems[0].concepts[0];
    const sharedAt = "2026-09-17T10:00:00Z";
    const pa = newProgress(a);
    pa.records[0].attempts = [{ ...attempt, correct: false, at: sharedAt }];
    const pb = newProgress(b);
    pb.records[0].attempts = [{ ...attempt, correct: false, at: sharedAt }];
    const map = new Map([
      [a.lessonId, pa],
      [b.lessonId, pb],
    ]);
    // b's lessonId sorts before a's, so its incorrect attempt should apply first
    // even though both attempts share the same timestamp.
    const viaCourse = masteryForCourse([a, b], map).find(
      (r) => r.conceptId === conceptId,
    )!;
    const bOnly = masteryForLesson(b, pb).find(
      (r) => r.conceptId === conceptId,
    )!;
    expect(viaCourse.score).toBeCloseTo(
      updateMastery(bOnly.score, lesson.problems[0].difficulty, {
        ...attempt,
        correct: false,
        at: sharedAt,
      }),
    );
  });
  it("locks a correct submission against duplicate attempts within a practice run", () => {
    const problem = lesson.problems[0];
    if (problem.type !== "multiple_choice") throw new Error("fixture drift");
    const correctAnswer = {
      kind: "choice" as const,
      selected: problem.answerSpec.correctOptionIds,
    };
    let progress = transition(lesson, newProgress(lesson), { type: "start" });
    progress = transition(lesson, progress, {
      type: "draft",
      answer: correctAnswer,
    });
    progress = transition(lesson, progress, {
      type: "submit",
      at: "2026-09-17T10:00:00Z",
    });
    expect(progress.records[0].attempts).toEqual([
      expect.objectContaining({ correct: true }),
    ]);
    // Resubmitting after an already-correct attempt must not add a second one.
    const afterSecondSubmit = transition(lesson, progress, {
      type: "submit",
      at: "2026-09-17T10:05:00Z",
    });
    expect(afterSecondSubmit.records[0].attempts).toHaveLength(1);
    expect(
      masteryForLesson(lesson, afterSecondSubmit).find(
        (r) => r.conceptId === problem.concepts[0],
      )?.attempts,
    ).toBe(1);
  });
  it("replays shared concepts chronologically instead of adding clamped lesson scores", () => {
    const a = structuredClone(lesson);
    const b = structuredClone(lesson);
    b.lessonId = "other";
    const pa = newProgress(a);
    const pb = newProgress(b);
    pa.records[0].attempts = [attempt];
    pb.records[0].attempts = [
      { ...attempt, correct: false, at: "2026-09-18T10:00:00Z" },
    ];
    const map = new Map([
      [a.lessonId, pa],
      [b.lessonId, pb],
    ]);
    const records = masteryForCourse([a, b], map);
    expect(records).toEqual(masteryForCourse([b, a], map));
    expect(
      records.find((r) => r.conceptId === a.problems[0].concepts[0])?.score,
    ).toBe(0);
  });
  it("adds fresh review evidence without modifying original lesson progress", () => {
    const progress = newProgress(lesson);
    progress.reviewAttempts = [{ problemIndex: 0, attempt }];
    const record = masteryForLesson(lesson, progress).find(
      (r) => r.conceptId === lesson.problems[0].concepts[0],
    )!;
    expect(record.attempts).toBe(1);
    expect(record.score).toBeGreaterThan(0);
    expect(progress.stage).toBe("intro");
    expect(progress.records[0].attempts).toHaveLength(0);
  });
  it("is deterministic and keeps scores within the documented range", () => {
    const progress = transition(lesson, newProgress(lesson), { type: "start" });
    const first = masteryForLesson(lesson, progress);
    const second = masteryForLesson(lesson, progress);
    expect(first).toEqual(second);
    expect(
      first.every((record) => record.score >= 0 && record.score <= 1),
    ).toBe(true);
  });

  it("suggests unfinished lessons for review", () => {
    const progress = transition(lesson, newProgress(lesson), { type: "start" });
    const queue = reviewQueue(lessons, new Map([[lesson.lessonId, progress]]));
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0].reason).toBe("unfinished");
  });
});
