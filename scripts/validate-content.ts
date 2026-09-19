import { join } from "node:path";
import { ContentValidationError, loadContent } from "../src/lib/content-loader";

const contentDir = join(process.cwd(), "content");

try {
  const { course, allLessons, glossary } = loadContent(contentDir);
  const problemCount = allLessons.reduce(
    (sum, l) => sum + l.problems.length,
    0,
  );
  const drafts = allLessons.filter((l) => l.status === "draft").length;
  console.log(
    `OK: ${course.title} — ${allLessons.length} lesson(s) (${drafts} draft), ${problemCount} problem(s), ${glossary?.terms.length ?? 0} glossary term(s) validated.`,
  );
} catch (error) {
  if (error instanceof ContentValidationError) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}
