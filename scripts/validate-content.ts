import { join } from "node:path";
import { ContentValidationError, loadContent } from "../src/lib/content-loader";

const contentDir = join(process.cwd(), "content");

try {
  const { course, lessons } = loadContent(contentDir);
  const problemCount = lessons.reduce((sum, l) => sum + l.problems.length, 0);
  console.log(
    `OK: ${course.title} — ${lessons.length} lesson(s), ${problemCount} problem(s) validated.`,
  );
} catch (error) {
  if (error instanceof ContentValidationError) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}
