import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { z } from "zod";
import {
  glossarySchema,
  lessonSchema,
  type Glossary,
  type Lesson,
} from "./schema";
import { quantifierSpec } from "./grading";

export const courseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  modules: z.array(z.object({ slug: z.string(), title: z.string() })),
});
export type Course = z.infer<typeof courseSchema>;

export class ContentValidationError extends Error {
  constructor(
    public readonly file: string,
    cause: unknown,
  ) {
    super(
      `Invalid content in ${file}:\n${
        cause instanceof z.ZodError
          ? cause.issues
              .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
              .join("\n")
          : String(cause)
      }`,
    );
    this.name = "ContentValidationError";
  }
}

// Reserved filenames at any level under content/ that are not lesson files.
const RESERVED_FILES = new Set(["catalog.json", "glossary.json"]);

function findLessonFiles(root: string): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir).sort()) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith(".json") && !RESERVED_FILES.has(entry))
        files.push(path);
    }
  };
  walk(root);
  return files;
}

/**
 * Discovers and validates every authored lesson under `contentDir`, plus the
 * course catalog at `<contentDir>/catalog.json` and, if present, the course
 * glossary at `<contentDir>/<course-slug>/glossary.json` (Phase 6).
 *
 * `lessons` contains only `status: "published"` content, matching what the
 * public app renders; `allLessons` (including drafts) is for the Phase 6
 * author/admin content workflow (`src/app/admin/content`), which needs to
 * see and validate unpublished lessons without exposing them to learners.
 * This is the single place that reads authored JSON off disk, shared by the
 * app, the CLI validator (scripts/validate-content.ts), and tests.
 */
export function loadContent(contentDir: string): {
  course: Course;
  courses: Course[];
  lessons: Lesson[];
  allLessons: Lesson[];
  glossary: Glossary | null;
  glossaries: Glossary[];
} {
  const catalogPath = join(contentDir, "catalog.json");
  let courses: Course[];
  try {
    const raw: unknown = JSON.parse(readFileSync(catalogPath, "utf-8"));
    const catalog = z
      .union([
        courseSchema,
        z.object({ courses: z.array(courseSchema).min(1) }),
      ])
      .parse(raw);
    courses = "courses" in catalog ? catalog.courses : [catalog];
    if (new Set(courses.map((c) => c.slug)).size !== courses.length)
      throw new Error("Course slugs must be unique");
    for (const c of courses)
      if (new Set(c.modules.map((m) => m.slug)).size !== c.modules.length)
        throw new Error(`Module slugs must be unique in ${c.slug}`);
  } catch (cause) {
    throw new ContentValidationError(relative(contentDir, catalogPath), cause);
  }

  const course = courses[0];
  const allLessons = findLessonFiles(contentDir)
    .map((file) => {
      let lesson: Lesson;
      try {
        lesson = lessonSchema.parse(
          JSON.parse(readFileSync(file, "utf-8")) as unknown,
        );
      } catch (cause) {
        throw new ContentValidationError(relative(contentDir, file), cause);
      }
      const owner = courses.find((c) => c.slug === lesson.courseSlug);
      if (!owner?.modules.some((m) => m.slug === lesson.moduleSlug))
        throw new ContentValidationError(
          relative(contentDir, file),
          new Error("Lesson must belong to a seeded course and module"),
        );
      for (const problem of lesson.problems) {
        if (problem.type === "symbolic")
          try {
            quantifierSpec(problem.answerSpec.correctExpression);
          } catch (cause) {
            throw new ContentValidationError(relative(contentDir, file), cause);
          }
      }
      return lesson;
    })
    .sort(
      (a, b) =>
        courses.findIndex((c) => c.slug === a.courseSlug) -
        courses.findIndex((c) => c.slug === b.courseSlug),
    );

  if (new Set(allLessons.map((l) => l.lessonId)).size !== allLessons.length)
    throw new ContentValidationError(
      contentDir,
      new Error("Lesson ids must be unique across the course"),
    );

  const glossaries: Glossary[] = [];
  for (const course of courses) {
    const glossaryPath = join(contentDir, course.slug, "glossary.json");
    let glossary: Glossary | null = null;
    if (existsSync(glossaryPath)) {
      try {
        glossary = glossarySchema.parse(
          JSON.parse(readFileSync(glossaryPath, "utf-8")) as unknown,
        );
      } catch (cause) {
        throw new ContentValidationError(
          relative(contentDir, glossaryPath),
          cause,
        );
      }
      if (glossary.courseSlug !== course.slug)
        throw new ContentValidationError(
          relative(contentDir, glossaryPath),
          new Error("Glossary must belong to the seeded course"),
        );
    }
    if (glossary) glossaries.push(glossary);
  }
  const termIds = glossaries.flatMap((g) => g.terms.map((t) => t.id));
  if (new Set(termIds).size !== termIds.length)
    throw new ContentValidationError(
      contentDir,
      new Error("Glossary ids must be globally unique"),
    );

  return {
    course,
    courses,
    allLessons,
    lessons: allLessons.filter((l) => l.status === "published"),
    glossary: glossaries.find((g) => g.courseSlug === course.slug) ?? null,
    glossaries,
  };
}
