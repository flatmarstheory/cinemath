import { describe, expect, it } from "vitest";
import { lessons } from "../src/lib/content";
import { grade, initialAnswer, quantifierSpec } from "../src/lib/grading";
import { lessonSchema, problemSchema, type Answer } from "../src/lib/schema";
import {
  canReveal,
  decodeProgress,
  encodeProgress,
  isFinished,
  newProgress,
  storageKey,
  summarize,
  transition,
} from "../src/lib/progress";

const lesson = lessons[0];
const [choice, secondChoice, symbolic, order, counterexample] = lesson.problems;
const now = "2026-09-17T12:00:00.000Z";
const answers: Answer[] = [
  { kind: "choice", selected: ["b"] },
  { kind: "choice", selected: ["c"] },
  { kind: "quantifiers", outer: "exists", inner: "forall", relation: "neq" },
  { kind: "order", steps: ["s1", "s2", "s3", "s4"] },
  { kind: "number", value: "0" },
];

describe("authored content and deterministic grading", () => {
  it("validates exactly five complete authored problems", () => {
    expect(lessonSchema.parse(lesson).problems).toHaveLength(5);
  });
  it("rejects mismatched lessons, invalid option ids, duplicate problems, and broken hint ladders", () => {
    const invalid = structuredClone(lesson);
    invalid.problems[0].lessonId = "elsewhere";
    expect(lessonSchema.safeParse(invalid).success).toBe(false);
    expect(
      lessonSchema.safeParse({ ...lesson, problems: [choice, choice] }).success,
    ).toBe(false);
    expect(
      problemSchema.safeParse({
        ...choice,
        answerSpec: {
          options: [
            { id: "a", label: "A" },
            { id: "a", label: "B" },
          ],
          correctOptionIds: ["z"],
        },
      }).success,
    ).toBe(false);
    expect(
      problemSchema.safeParse({ ...choice, hints: [...choice.hints].reverse() })
        .success,
    ).toBe(false);
  });
  it.each(answers.map((answer, i) => [i, answer] as const))(
    "accepts the reference response for problem %i",
    (i, answer) => {
      expect(grade(lesson.problems[i], answer)).toMatchObject({
        valid: true,
        correct: true,
      });
    },
  );
  it("requires an exact valid choice set", () => {
    expect(grade(choice, { kind: "choice", selected: [] }).valid).toBe(false);
    expect(
      grade(choice, { kind: "choice", selected: ["no-such-id"] }).valid,
    ).toBe(false);
    expect(grade(choice, { kind: "choice", selected: ["a", "b"] }).valid).toBe(
      false,
    );
    expect(
      grade(secondChoice, { kind: "choice", selected: ["a"] }),
    ).toMatchObject({ valid: true, correct: false });
  });
  it("grades all eight quantifier and relation combinations structurally", () => {
    for (const outer of ["forall", "exists"] as const)
      for (const inner of ["forall", "exists"] as const)
        for (const relation of ["=", "neq"] as const)
          expect(
            grade(symbolic, { kind: "quantifiers", outer, inner, relation }),
          ).toMatchObject({
            valid: true,
            correct:
              outer === "exists" && inner === "forall" && relation === "neq",
          });
    expect(grade(symbolic, initialAnswer(symbolic)).valid).toBe(false);
    expect(() => quantifierSpec("arbitrary LaTeX")).toThrow();
  });
  it("accepts both proof orders and rejects missing or duplicated steps", () => {
    expect(
      grade(order, { kind: "order", steps: ["s1", "s3", "s2", "s4"] }),
    ).toMatchObject({ correct: true });
    expect(grade(order, initialAnswer(order))).toMatchObject({
      valid: true,
      correct: false,
    });
    expect(
      grade(order, { kind: "order", steps: ["s1", "s1", "s3", "s4"] }).valid,
    ).toBe(false);
  });
  it("checks the counterexample predicate without floating-point overflow", () => {
    for (const value of ["0", "1", " +1 ", "-0"])
      expect(grade(counterexample, { kind: "number", value })).toMatchObject({
        valid: true,
        correct: true,
      });
    for (const value of ["-1", "2", "9007199254740991", "-9007199254740991"])
      expect(grade(counterexample, { kind: "number", value })).toMatchObject({
        valid: true,
        correct: false,
      });
    for (const value of [
      "",
      " ",
      "0.5",
      "1e0",
      "Infinity",
      "NaN",
      "9007199254740992",
      "0x0",
    ])
      expect(grade(counterexample, { kind: "number", value }).valid).toBe(
        false,
      );
  });
  it("supports explicit absolute and relative numeric tolerances", () => {
    const numeric = problemSchema.parse({
      ...choice,
      type: "numeric",
      answerSpec: {
        correctValue: 100,
        tolerance: 0.01,
        toleranceType: "relative",
      },
    });
    expect(grade(numeric, { kind: "number", value: "101" })).toMatchObject({
      correct: true,
    });
    expect(grade(numeric, { kind: "number", value: "101.01" })).toMatchObject({
      correct: false,
    });
    const absolute = problemSchema.parse({
      ...numeric,
      answerSpec: {
        correctValue: 0,
        tolerance: 0.1,
        toleranceType: "absolute",
      },
    });
    expect(grade(absolute, { kind: "number", value: ".1" })).toMatchObject({
      correct: true,
    });
    expect(grade(absolute, { kind: "number", value: " " }).valid).toBe(false);
  });
});

describe("progress, gating, and recovery", () => {
  function start() {
    return transition(lesson, newProgress(lesson), { type: "start" });
  }
  function wrong(progress = start()) {
    return transition(
      lesson,
      transition(lesson, progress, {
        type: "draft",
        answer: { kind: "choice", selected: ["a"] },
      }),
      { type: "submit", at: now },
    );
  }
  it("never advances unfinished problems or counts malformed attempts", () => {
    let p = start();
    p = transition(lesson, p, { type: "submit", at: now });
    expect(p.records[0].attempts).toHaveLength(0);
    expect(transition(lesson, p, { type: "next" }).index).toBe(0);
    expect(
      transition(lesson, p, { type: "solution" }).records[0].solutionRevealed,
    ).toBe(false);
  });
  it("does not leak the fourth hint before the gate", () => {
    let p = start();
    for (let i = 0; i < 5; i++) p = transition(lesson, p, { type: "hint" });
    expect(p.records[0].hintsUsed).toBe(3);
    expect(canReveal(p.records[0])).toBe(false);
    p = wrong(p);
    expect(canReveal(p.records[0])).toBe(false);
    p = wrong(p);
    expect(canReveal(p.records[0])).toBe(true);
    p = transition(lesson, p, { type: "solution" });
    expect(isFinished(p.records[0])).toBe(true);
    expect(transition(lesson, p, { type: "next" }).index).toBe(1);
    expect(summarize(lesson, p)).toMatchObject({
      solutions: 1,
      hints: 3,
      correct: 0,
    });
  });
  it("unlocks after a correct answer and preserves drafts, hints, attempt context, and exact position", () => {
    let p = start();
    p = transition(lesson, p, { type: "hint" });
    p = transition(lesson, p, { type: "draft", answer: answers[0] });
    p = transition(lesson, p, { type: "submit", at: now });
    expect(canReveal(p.records[0])).toBe(true);
    p = transition(lesson, p, { type: "next" });
    p = transition(lesson, p, { type: "draft", answer: answers[1] });
    expect(decodeProgress(lesson, encodeProgress(lesson, p))).toEqual(p);
    expect(p.records[0].attempts[0]).toMatchObject({
      hintsUsed: 1,
      solutionRevealed: false,
      at: now,
    });
  });
  it("rejects corrupt, tampered, and incompatible version saves", () => {
    expect(() => decodeProgress(lesson, "broken json")).toThrow();
    const p = start();
    p.stage = "complete";
    expect(() => decodeProgress(lesson, encodeProgress(lesson, p))).toThrow();
    p.stage = "practice";
    p.records[0].solutionRevealed = true;
    expect(() => decodeProgress(lesson, encodeProgress(lesson, p))).toThrow();
    const changed = structuredClone(lesson);
    changed.problems[0].version++;
    expect(storageKey(changed)).not.toBe(storageKey(lesson));
    expect(() =>
      decodeProgress(changed, encodeProgress(lesson, start())),
    ).toThrow();
  });
  it("completes once with accurate metrics and conservative concept summaries", () => {
    let p = start();
    answers.forEach((answer) => {
      p = transition(lesson, p, { type: "draft", answer });
      p = transition(lesson, p, { type: "submit", at: now });
      p = transition(lesson, p, { type: "submit", at: now });
      p = transition(lesson, p, { type: "next" });
    });
    expect(p.stage).toBe("complete");
    expect(decodeProgress(lesson, encodeProgress(lesson, p))).toEqual(p);
    const summary = summarize(lesson, p);
    expect(summary).toMatchObject({
      firstCorrect: 5,
      correct: 5,
      attempts: 5,
      hints: 0,
      solutions: 0,
    });
    expect(summary.concepts.every((c) => c.status === "Solid")).toBe(true);
  });
  it("does not count copying an already revealed solution toward mastery", () => {
    let p = wrong(wrong());
    p = transition(lesson, p, { type: "solution" });
    p = transition(lesson, p, { type: "draft", answer: answers[0] });
    p = transition(lesson, p, { type: "submit", at: now });
    expect(
      summarize(lesson, p).concepts.find((c) => c.id === "statement"),
    ).toMatchObject({ correct: 0, status: "Developing" });
  });
});

it("rejects malformed saved proof drafts while preserving incomplete valid drafts", () => {
  const p = newProgress(lesson);
  p.records[3].draft = { kind: "order", steps: ["unknown"] };
  expect(() => decodeProgress(lesson, encodeProgress(lesson, p))).toThrow(
    "Invalid saved proof order",
  );
  expect(
    decodeProgress(lesson, encodeProgress(lesson, newProgress(lesson))),
  ).toEqual(newProgress(lesson));
});
