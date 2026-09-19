import { describe, expect, it } from "vitest";
import { courses, lessons, glossaries } from "../src/lib/content";
import { grade, initialAnswer } from "../src/lib/grading";
import { storageKey } from "../src/lib/progress";
import { loadContent } from "../src/lib/content-loader";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { Answer } from "../src/lib/schema";

const slug = "linear-algebra-beyond-computation";
const courseLessons = lessons.filter((l) => l.courseSlug === slug);

describe("Linear Algebra Beyond Computation", () => {
  it("has a coherent sequence with taught prerequisites and glossary coverage", () => {
    expect(courses.map((c) => c.slug)).toEqual([
      "proofs-for-modern-mathematics",
      slug,
    ]);
    expect(courseLessons).toHaveLength(13);
    const course = courses.find((c) => c.slug === slug)!;
    expect(course.modules).toHaveLength(6);
    const known = new Set<string>();
    const terms = new Set(
      glossaries.find((g) => g.courseSlug === slug)!.terms.map((t) => t.id),
    );
    for (const lesson of courseLessons) {
      for (const prerequisite of lesson.prerequisites)
        expect(
          known.has(prerequisite),
          `${lesson.lessonId}: ${prerequisite}`,
        ).toBe(true);
      for (const concept of lesson.conceptsIntroduced) {
        expect(terms.has(concept)).toBe(true);
        known.add(concept);
      }
      expect(lesson.problems).toHaveLength(5);
      expect(new Set(lesson.problems.map((p) => p.type)).size).toBeGreaterThan(
        1,
      );
    }
    expect(courseLessons.at(-1)?.kind).toBe("capstone");
    for (const mod of course.modules)
      expect(courseLessons.some((l) => l.moduleSlug === mod.slug)).toBe(true);
    expect(new Set(lessons.map(storageKey)).size).toBe(lessons.length);
  });

  it("accepts every reference answer and rejects a substantive wrong answer", () => {
    for (const lesson of courseLessons)
      for (const problem of lesson.problems) {
        let correct: Answer;
        let wrong: Answer;
        switch (problem.type) {
          case "multiple_choice":
            correct = {
              kind: "choice",
              selected: problem.answerSpec.correctOptionIds,
            };
            wrong = {
              kind: "choice",
              selected: [
                problem.answerSpec.options.find(
                  (o) => !problem.answerSpec.correctOptionIds.includes(o.id),
                )!.id,
              ],
            };
            break;
          case "numeric":
            correct = {
              kind: "number",
              value: String(problem.answerSpec.correctValue),
            };
            wrong = {
              kind: "number",
              value: String(problem.answerSpec.correctValue + 1),
            };
            break;
          case "proof_fill_blank":
            correct = {
              kind: "blanks",
              values: Object.fromEntries(
                problem.answerSpec.blanks.map((b) => [
                  b.id,
                  b.acceptedValues[0],
                ]),
              ),
            };
            wrong = {
              kind: "blanks",
              values: Object.fromEntries(
                problem.answerSpec.blanks.map((b) => [b.id, "incorrect"]),
              ),
            };
            break;
          case "proof_ordering":
            expect(grade(problem, initialAnswer(problem))).toMatchObject({
              valid: true,
              correct: false,
            });
            correct = { kind: "order", steps: problem.answerSpec.correctOrder };
            wrong = {
              kind: "order",
              steps: [...problem.answerSpec.correctOrder].reverse(),
            };
            break;
          default:
            throw new Error(
              `Unexpected nondeterministic problem ${problem.id}`,
            );
        }
        expect(grade(problem, correct), problem.id).toMatchObject({
          valid: true,
          correct: true,
        });
        expect(grade(problem, wrong), problem.id).toMatchObject({
          valid: true,
          correct: false,
        });
      }
  });

  it("checks numeric keys independently of the answer specifications", () => {
    // Independently worked results in curriculum order, including signs and dimensions.
    const expected = [1, 1, 2, 4, -4, 2, -1, 1, -6, -4, 2, 1, 8, 0, 2, 2, 5, 3];
    const numeric = courseLessons
      .flatMap((l) => l.problems)
      .filter((p) => p.type === "numeric");
    expect(numeric.map((p) => p.answerSpec.correctValue)).toEqual(expected);
  });
});

describe("multi-course catalog boundaries", () => {
  function withCatalog(run: (dir: string) => void) {
    const dir = mkdtempSync(join(tmpdir(), "cinemath-multicourse-"));
    try {
      run(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  it("rejects duplicate course slugs", () =>
    withCatalog((dir) => {
      writeFileSync(
        join(dir, "catalog.json"),
        JSON.stringify({ courses: [courses[0], courses[0]] }),
      );
      expect(() => loadContent(dir)).toThrow("Course slugs must be unique");
    }));
  it("does not accept a module owned only by a different course", () =>
    withCatalog((dir) => {
      writeFileSync(join(dir, "catalog.json"), JSON.stringify({ courses }));
      writeFileSync(
        join(dir, "lesson.json"),
        JSON.stringify({
          ...courseLessons[0],
          moduleSlug: courses[0].modules[0].slug,
        }),
      );
      expect(() => loadContent(dir)).toThrow(
        "Lesson must belong to a seeded course and module",
      );
    }));
});
