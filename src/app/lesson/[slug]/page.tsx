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
  const lesson = lessons.find((item) => item.lessonId === slug);
  if (!lesson) notFound();
  return <LessonPlayer lesson={lesson} courseTitle={course.title} />;
}
