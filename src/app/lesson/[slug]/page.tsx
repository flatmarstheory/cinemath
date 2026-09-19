import { notFound } from "next/navigation";
import { lessons, allLessons, courses } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson-player";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ slug: lesson.lessonId }));
}
export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = lessons.findIndex((item) => item.lessonId === slug);
  if (index !== -1)
    return (
      <LessonPlayer
        lesson={lessons[index]}
        courseTitle={
          courses.find((c) => c.slug === lessons[index].courseSlug)!.title
        }
        lessonNumber={
          lessons
            .filter((l) => l.courseSlug === lessons[index].courseSlug)
            .findIndex((l) => l.lessonId === slug) + 1
        }
      />
    );
  // Draft lessons (Phase 6 "Instructor/editor publishing workflow") are
  // excluded from `lessons`/static generation but must still be reachable
  // by an editor's direct preview link (see src/app/admin/content).
  const draft = allLessons.find((item) => item.lessonId === slug);
  if (!draft) notFound();
  return (
    <LessonPlayer
      lesson={draft}
      courseTitle={courses.find((c) => c.slug === draft.courseSlug)!.title}
    />
  );
}
