import { describe, expect, it } from "vitest";
import {
  completionFunnel,
  dropOffByProblemIndex,
  hintUseRateByLevel,
  medianTimePerProblemMs,
  retryCountByProblem,
  sevenDayReturnRate,
  solutionRevealRate,
  type StoredEvent,
} from "../src/lib/metrics";

const dayMs = 86400000;
const e = (over: Partial<StoredEvent>): StoredEvent => ({
  createdAt: 0,
  learnerId: "l1",
  lessonId: "lesson-1",
  problemId: null,
  type: "lesson_start",
  payload: {},
  ...over,
});

describe("completionFunnel", () => {
  it("computes a per-lesson completion rate", () => {
    const events = [
      e({ learnerId: "a", type: "lesson_start" }),
      e({ learnerId: "b", type: "lesson_start" }),
      e({ learnerId: "a", type: "lesson_complete" }),
    ];
    expect(completionFunnel(events)).toEqual([
      { lessonId: "lesson-1", starts: 2, completions: 1, completionRate: 0.5 },
    ]);
  });
  it("reports zero for a lesson with no starts", () => {
    expect(completionFunnel([])).toEqual([]);
  });
});

describe("dropOffByProblemIndex", () => {
  it("counts the last problem index reached by learners who did not finish", () => {
    const events = [
      e({ learnerId: "a", type: "lesson_start" }),
      e({
        learnerId: "a",
        type: "problem_view",
        problemId: "p2",
        payload: { index: 1 },
      }),
      e({ learnerId: "b", type: "lesson_start" }),
      e({ learnerId: "b", type: "lesson_complete" }),
    ];
    expect(dropOffByProblemIndex(events)).toEqual([{ index: 1, count: 1 }]);
  });
});

describe("medianTimePerProblemMs", () => {
  it("takes the median gap between successive views", () => {
    const events = [
      e({ learnerId: "a", type: "lesson_start", createdAt: 0 }),
      e({
        learnerId: "a",
        type: "problem_view",
        problemId: "p2",
        payload: { index: 1 },
        createdAt: 10000,
      }),
      e({ learnerId: "a", type: "lesson_complete", createdAt: 40000 }),
    ];
    expect(medianTimePerProblemMs(events)).toBe(20000);
  });
  it("returns null with no data", () => {
    expect(medianTimePerProblemMs([])).toBeNull();
  });
});

describe("retryCountByProblem", () => {
  it("counts submissions and sums retries beyond each learner's first attempt", () => {
    const events = [
      e({
        learnerId: "a",
        type: "answer_submit",
        problemId: "p1",
        payload: { attemptNumber: 1, correct: false },
      }),
      e({
        learnerId: "a",
        type: "answer_submit",
        problemId: "p1",
        payload: { attemptNumber: 2, correct: true },
      }),
      e({
        learnerId: "b",
        type: "answer_submit",
        problemId: "p1",
        payload: { attemptNumber: 1, correct: true },
      }),
    ];
    expect(retryCountByProblem(events)).toEqual([
      { problemId: "p1", submissions: 3, retries: 1 },
    ]);
  });
});

describe("hintUseRateByLevel", () => {
  it("rates hint reveals against learners who saw the problem", () => {
    const events = [
      e({
        learnerId: "a",
        type: "problem_view",
        problemId: "p1",
        payload: { index: 0 },
      }),
      e({
        learnerId: "b",
        type: "problem_view",
        problemId: "p1",
        payload: { index: 0 },
      }),
      e({
        learnerId: "a",
        type: "hint_reveal",
        problemId: "p1",
        payload: { hintOrder: 1 },
      }),
    ];
    expect(hintUseRateByLevel(events)).toEqual([
      { level: 1, rate: 0.5 },
      { level: 2, rate: 0 },
      { level: 3, rate: 0 },
    ]);
  });
});

describe("solutionRevealRate", () => {
  it("rates solution reveals against learners who saw the problem", () => {
    const events = [
      e({
        learnerId: "a",
        type: "problem_view",
        problemId: "p1",
        payload: { index: 0 },
      }),
      e({
        learnerId: "b",
        type: "problem_view",
        problemId: "p1",
        payload: { index: 0 },
      }),
      e({ learnerId: "a", type: "solution_reveal", problemId: "p1" }),
    ];
    expect(solutionRevealRate(events)).toBe(0.5);
  });
});

describe("sevenDayReturnRate", () => {
  it("counts a learner as returning if a later active day is within 7 days", () => {
    const events = [
      e({ learnerId: "a", createdAt: 0 }),
      e({ learnerId: "a", createdAt: 3 * dayMs }),
      e({ learnerId: "b", createdAt: 0 }),
      e({ learnerId: "b", createdAt: 10 * dayMs }),
    ];
    expect(sevenDayReturnRate(events)).toBe(0.5);
  });
  it("returns 0 with no learners", () => {
    expect(sevenDayReturnRate([])).toBe(0);
  });
});
