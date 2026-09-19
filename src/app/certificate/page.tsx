import { courses, lessons } from "@/lib/content";
import { notFound } from "next/navigation";
import { Certificate } from "@/components/certificate";

export const metadata = { title: "Certificate · CineMath" };

// Phase 6 (ROADMAP.md "Course completion certificate or shareable
// completion artifact, if useful"). A printable page (browser
// print-to-PDF) rather than a generated image/PDF file: no new dependency,
// no server-side rendering pipeline, and it stays fully accessible text
// (CLAUDE.md: keyboard/accessibility is an acceptance criterion).
export default async function CertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: slug } = await searchParams;
  const course = slug ? courses.find((c) => c.slug === slug) : courses[0];
  if (!course) notFound();
  return (
    <Certificate
      key={course.slug}
      courses={courses}
      course={course}
      lessons={lessons.filter((l) => l.courseSlug === course.slug)}
    />
  );
}
