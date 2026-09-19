import { join } from "node:path";
import { ContentValidationError, loadContent } from "../src/lib/content-loader";

const contentDir = join(process.cwd(), "content");

try {
  const { courses, allLessons, glossaries } = loadContent(contentDir);
  for (const course of courses) {
    const courseLessons = allLessons.filter(
      (l) => l.courseSlug === course.slug,
    );
    const glossary = glossaries.find((g) => g.courseSlug === course.slug);
    const problemCount = courseLessons.reduce(
      (sum, l) => sum + l.problems.length,
      0,
    );
    const drafts = courseLessons.filter((l) => l.status === "draft").length;
    console.log(
      `OK: ${course.title} — ${courseLessons.length} lesson(s) (${drafts} draft), ${problemCount} problem(s), ${glossary?.terms.length ?? 0} glossary term(s) validated.`,
    );
  }
} catch (error) {
  if (error instanceof ContentValidationError) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}
