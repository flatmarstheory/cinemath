import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { z } from "zod";
import { glossarySchema, lessonSchema, type Glossary, type Lesson } from "./schema";
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
  lessons: Lesson[];
  allLessons: Lesson[];
  glossary: Glossary | null;
} {
  const catalogPath = join(contentDir, "catalog.json");
  let course: Course;
  try {
    course = courseSchema.parse(
      JSON.parse(readFileSync(catalogPath, "utf-8")) as unknown,
    );
  } catch (cause) {
    throw new ContentValidationError(relative(contentDir, catalogPath), cause);
  }

  const allLessons = findLessonFiles(contentDir).map((file) => {
    let lesson: Lesson;
    try {
      lesson = lessonSchema.parse(
        JSON.parse(readFileSync(file, "utf-8")) as unknown,
      );
    } catch (cause) {
      throw new ContentValidationError(relative(contentDir, file), cause);
    }
    if (
      lesson.courseSlug !== course.slug ||
      !course.modules.some((m) => m.slug === lesson.moduleSlug)
    )
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
  });

  if (new Set(allLessons.map((l) => l.lessonId)).size !== allLessons.length)
    throw new ContentValidationError(
      contentDir,
      new Error("Lesson ids must be unique across the course"),
    );

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

  return {
    course,
    allLessons,
    lessons: allLessons.filter((l) => l.status === "published"),
    glossary,
  };
}
