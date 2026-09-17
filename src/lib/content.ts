import lessonData from "../../content/proofs-for-modern-mathematics/module-01-mathematical-language/lesson-01-statements-and-quantifiers.json";
import catalog from "../../content/catalog.json";
import { z } from "zod";
import { lessonSchema } from "./schema";
import { quantifierSpec } from "./grading";

export const course = z
  .object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    modules: z.array(z.object({ slug: z.string(), title: z.string() })),
  })
  .parse(catalog);
export const lessons = [lessonSchema.parse(lessonData)];
for (const lesson of lessons) {
  if (
    lesson.courseSlug !== course.slug ||
    !course.modules.some((m) => m.slug === lesson.moduleSlug)
  )
    throw new Error("Lesson must belong to a seeded course and module");
  for (const problem of lesson.problems) {
    if (problem.type === "symbolic")
      quantifierSpec(problem.answerSpec.correctExpression);
  }
}
