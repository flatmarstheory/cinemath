import { notFound } from "next/navigation";
import { lessons, course } from "@/lib/content";
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
  if (index === -1) notFound();
  return (
    <LessonPlayer
      lesson={lessons[index]}
      courseTitle={course.title}
      lessonNumber={index + 1}
    />
  );
}
