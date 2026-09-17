import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lessons } from "../src/lib/content";
import { grade, initialAnswer } from "../src/lib/grading";
import { problemSchema } from "../src/lib/schema";
import { analyticsEventFor } from "../src/lib/analytics";
import { newProgress, transition } from "../src/lib/progress";
import { ContentValidationError, loadContent } from "../src/lib/content-loader";

const lesson2 = lessons.find(
  (l) => l.lessonId === "pfmm-m1-l2-compound-statements-and-connectives",
)!;
const lesson4 = lessons.find(
  (l) => l.lessonId === "pfmm-m1-l4-reading-and-writing-formal-definitions",
)!;
const fillBlank = lesson2.problems.find((p) => p.type === "proof_fill_blank")!;
const secondCounterexample = lesson4.problems.find(
  (p) => p.type === "counterexample_builder",
)!;

describe("proof_fill_blank grading", () => {
  it("accepts the reference blanks, case- and whitespace-insensitively", () => {
    expect(
      grade(fillBlank, {
        kind: "blanks",
        values: { b1: "f", b2: " True ", b3: "F" },
      }),
    ).toMatchObject({ valid: true, correct: true });
  });
  it("rejects incomplete or wrong blanks without crashing", () => {
    expect(grade(fillBlank, initialAnswer(fillBlank)).valid).toBe(false);
    expect(
      grade(fillBlank, {
        kind: "blanks",
        values: { b1: "T", b2: "T", b3: "F" },
      }),
    ).toMatchObject({ valid: true, correct: false });
    expect(
      grade(fillBlank, { kind: "blanks", values: { b1: "F", b2: "T" } }).valid,
    ).toBe(false);
  });
  it("rejects a blank id set that doesn't match the problem", () => {
    expect(problemSchema.safeParse(fillBlank).success).toBe(true);
    const dup = structuredClone(fillBlank);
    dup.answerSpec.blanks[1].id = dup.answerSpec.blanks[0].id;
    expect(problemSchema.safeParse(dup).success).toBe(false);
  });
});

describe("counterexample checker registry", () => {
  it("supports a second, distinct checker for a different predicate", () => {
    for (const value of ["0", "2", "-4", "100"])
      expect(
        grade(secondCounterexample, { kind: "number", value }),
      ).toMatchObject({ valid: true, correct: true });
    for (const value of ["1", "3", "-1"])
      expect(
        grade(secondCounterexample, { kind: "number", value }),
      ).toMatchObject({ valid: true, correct: false });
  });
});

describe("analytics event derivation", () => {
  const lesson = lessons[0];
  it("emits lesson_start only when actually entering practice", () => {
    const before = newProgress(lesson);
    const after = transition(lesson, before, { type: "start" });
    expect(
      analyticsEventFor(lesson, lesson.problems[0], before, after, {
        type: "start",
      }),
    ).toMatchObject({ type: "lesson_start" });
    expect(
      analyticsEventFor(lesson, lesson.problems[0], after, after, {
        type: "start",
      }),
    ).toBeNull();
  });
  it("emits answer_submit with correctness and attempt number, not on invalid submits", () => {
    let progress = transition(lesson, newProgress(lesson), { type: "start" });
    progress = transition(lesson, progress, {
      type: "draft",
      answer: { kind: "choice", selected: ["a"] },
    });
    const before = progress;
    const after = transition(lesson, before, {
      type: "submit",
      at: "2026-09-17T12:00:00.000Z",
    });
    expect(
      analyticsEventFor(lesson, lesson.problems[0], before, after, {
        type: "submit",
        at: "2026-09-17T12:00:00.000Z",
      }),
    ).toMatchObject({
      type: "answer_submit",
      correct: false,
      attemptNumber: 1,
    });
    // An invalid submit (empty draft) leaves state unchanged, so no event.
    const emptyBefore = transition(lesson, newProgress(lesson), {
      type: "start",
    });
    const emptyAfter = transition(lesson, emptyBefore, {
      type: "submit",
      at: "2026-09-17T12:00:00.000Z",
    });
    expect(
      analyticsEventFor(lesson, lesson.problems[0], emptyBefore, emptyAfter, {
        type: "submit",
        at: "2026-09-17T12:00:00.000Z",
      }),
    ).toBeNull();
  });
  it("emits hint_reveal, solution_reveal, problem_view, and lesson_complete", () => {
    let progress = transition(lesson, newProgress(lesson), { type: "start" });
    const beforeHint = progress;
    progress = transition(lesson, progress, { type: "hint" });
    expect(
      analyticsEventFor(lesson, lesson.problems[0], beforeHint, progress, {
        type: "hint",
      }),
    ).toMatchObject({ type: "hint_reveal", hintOrder: 1 });
  });
});

describe("content loader failure modes", () => {
  it("reports a useful, file-scoped error for invalid content and rejects an empty course", () => {
    const dir = mkdtempSync(join(tmpdir(), "cinemath-content-"));
    try {
      writeFileSync(
        join(dir, "catalog.json"),
        JSON.stringify({
          slug: "c",
          title: "C",
          description: "d",
          modules: [{ slug: "m", title: "M" }],
        }),
      );
      writeFileSync(
        join(dir, "broken.json"),
        JSON.stringify({ not: "a lesson" }),
      );
      let error: unknown;
      try {
        loadContent(dir);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ContentValidationError);
      expect((error as ContentValidationError).file).toContain("broken.json");
      expect((error as Error).message).toContain("broken.json");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
