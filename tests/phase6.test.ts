import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allLessons, course, glossary, lessons } from "../src/lib/content";
import { ContentValidationError, loadContent } from "../src/lib/content-loader";
import { glossarySchema, lessonSchema } from "../src/lib/schema";

const baseLesson = {
  courseSlug: "c",
  moduleSlug: "m",
  title: "T",
  learningObjective: "Objective.",
  estimatedMinutes: { min: 10, max: 20 },
  prerequisites: [],
  conceptsIntroduced: ["x"],
  loop: {
    retrieve: { bodyMarkdown: "" },
    encounter: { bodyMarkdown: "e" },
    explain: { bodyMarkdown: "e" },
    reflect: { bodyMarkdown: "r" },
  },
  problems: [
    {
      id: "p1",
      version: 1,
      lessonId: "l1",
      type: "numeric" as const,
      promptMarkdown: "?",
      answerSpec: { correctValue: 1, tolerance: 0, toleranceType: "absolute" as const },
      hints: [1, 2, 3, 4].map((order) => ({ order, bodyMarkdown: "h" })),
      solutionMarkdown: "s",
      concepts: ["x"],
      prerequisites: [],
      difficulty: 1 as const,
      misconceptionTags: [],
    },
  ],
  master: { conceptsUpdated: ["x"], notes: "n" },
};

describe("lesson kind and status (Phase 6)", () => {
  it("defaults kind to 'lesson' and status to 'published'", () => {
    const parsed = lessonSchema.parse({ ...baseLesson, lessonId: "l1" });
    expect(parsed.kind).toBe("lesson");
    expect(parsed.status).toBe("published");
  });
  it("accepts explicit checkpoint/capstone kinds and draft status", () => {
    const checkpoint = lessonSchema.parse({
      ...baseLesson,
      lessonId: "l1",
      kind: "checkpoint",
      status: "draft",
    });
    expect(checkpoint.kind).toBe("checkpoint");
    expect(checkpoint.status).toBe("draft");
  });
  it("rejects an invalid kind", () => {
    expect(
      lessonSchema.safeParse({ ...baseLesson, lessonId: "l1", kind: "quiz" })
        .success,
    ).toBe(false);
  });
});

describe("glossary schema (Phase 6)", () => {
  it("requires at least one term and a matching course slug", () => {
    expect(
      glossarySchema.safeParse({ courseSlug: "c", terms: [] }).success,
    ).toBe(false);
    expect(
      glossarySchema.safeParse({
        courseSlug: "c",
        terms: [{ id: "x", term: "X", definitionMarkdown: "d" }],
      }).success,
    ).toBe(true);
  });
  it("defaults relatedTerms to an empty array", () => {
    const parsed = glossarySchema.parse({
      courseSlug: "c",
      terms: [{ id: "x", term: "X", definitionMarkdown: "d" }],
    });
    expect(parsed.terms[0].relatedTerms).toEqual([]);
  });
});

describe("content loader: drafts, glossary, reserved filenames (Phase 6)", () => {
  function withDir(fn: (dir: string) => void) {
    const dir = mkdtempSync(join(tmpdir(), "cinemath-content-p6-"));
    try {
      fn(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  it("excludes draft lessons from `lessons` but includes them in `allLessons`", () => {
    withDir((dir) => {
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
        join(dir, "published.json"),
        JSON.stringify({ ...baseLesson, lessonId: "published" }),
      );
      writeFileSync(
        join(dir, "draft.json"),
        JSON.stringify({
          ...baseLesson,
          lessonId: "draft",
          status: "draft",
          problems: [{ ...baseLesson.problems[0], lessonId: "draft" }],
        }),
      );
      const result = loadContent(dir);
      expect(result.lessons.map((l) => l.lessonId)).toEqual(["published"]);
      expect(result.allLessons.map((l) => l.lessonId).sort()).toEqual([
        "draft",
        "published",
      ]);
    });
  });

  it("loads and validates a course glossary, rejecting a mismatched course slug", () => {
    withDir((dir) => {
      writeFileSync(
        join(dir, "catalog.json"),
        JSON.stringify({
          slug: "c",
          title: "C",
          description: "d",
          modules: [{ slug: "m", title: "M" }],
        }),
      );
      mkdirSync(join(dir, "c"));
      writeFileSync(
        join(dir, "c", "glossary.json"),
        JSON.stringify({
          courseSlug: "c",
          terms: [{ id: "x", term: "X", definitionMarkdown: "d" }],
        }),
      );
      const result = loadContent(dir);
      expect(result.glossary?.terms).toHaveLength(1);
    });
  });

  it("treats glossary.json like catalog.json: never discovered as a lesson file", () => {
    withDir((dir) => {
      writeFileSync(
        join(dir, "catalog.json"),
        JSON.stringify({
          slug: "c",
          title: "C",
          description: "d",
          modules: [{ slug: "m", title: "M" }],
        }),
      );
      mkdirSync(join(dir, "c"));
      writeFileSync(
        join(dir, "c", "glossary.json"),
        JSON.stringify({
          courseSlug: "c",
          terms: [{ id: "x", term: "X", definitionMarkdown: "d" }],
        }),
      );
      expect(() => loadContent(dir)).not.toThrow();
      expect(loadContent(dir).allLessons).toHaveLength(0);
    });
  });

  it("returns glossary: null when no glossary.json is authored", () => {
    withDir((dir) => {
      writeFileSync(
        join(dir, "catalog.json"),
        JSON.stringify({
          slug: "c",
          title: "C",
          description: "d",
          modules: [{ slug: "m", title: "M" }],
        }),
      );
      expect(loadContent(dir).glossary).toBeNull();
    });
  });
});

describe("the authored Phase 6 course as a whole", () => {
  it("spans all 8 roadmap modules with published content", () => {
    expect(course.modules.length).toBe(8);
    const modulesWithContent = new Set(lessons.map((l) => l.moduleSlug));
    for (const module of course.modules)
      expect(modulesWithContent.has(module.slug)).toBe(true);
  });
  it("has a capstone module whose lessons are all kind 'capstone'", () => {
    const capstoneLessons = lessons.filter(
      (l) => l.moduleSlug === "module-08-capstone-proof-workshop",
    );
    expect(capstoneLessons.length).toBeGreaterThan(0);
    for (const lesson of capstoneLessons) expect(lesson.kind).toBe("capstone");
  });
  it("has a checkpoint in every Phase 6 module (2-7; module 1 predates checkpoints, module 8 is the capstone)", () => {
    for (const module of course.modules) {
      if (
        module.slug === "module-01-mathematical-language" ||
        module.slug === "module-08-capstone-proof-workshop"
      )
        continue;
      const moduleLessons = lessons.filter(
        (l) => l.moduleSlug === module.slug,
      );
      const checkpoints = moduleLessons.filter((l) => l.kind === "checkpoint");
      expect(checkpoints.length).toBeGreaterThanOrEqual(1);
    }
  });
  it("keeps every problem's concepts and misconceptionTags as kebab-case ids", () => {
    const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const lesson of allLessons)
      for (const problem of lesson.problems) {
        for (const id of problem.concepts) expect(id).toMatch(kebab);
        for (const id of problem.misconceptionTags) expect(id).toMatch(kebab);
      }
  });
  it("has a glossary term for every concept introduced by a published lesson", () => {
    const terms = new Set(glossary?.terms.map((t) => t.id) ?? []);
    const missing = new Set<string>();
    for (const lesson of lessons)
      for (const id of lesson.conceptsIntroduced)
        if (!terms.has(id)) missing.add(id);
    expect([...missing]).toEqual([]);
  });
  it("rejects a lesson whose id collides with another lesson's id", () => {
    expect(
      new Set(allLessons.map((l) => l.lessonId)).size,
    ).toBe(allLessons.length);
  });
});
