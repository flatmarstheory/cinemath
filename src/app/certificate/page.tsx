import { course, lessons } from "@/lib/content";
import { Certificate } from "@/components/certificate";

export const metadata = { title: "Certificate · CineMath" };

// Phase 6 (ROADMAP.md "Course completion certificate or shareable
// completion artifact, if useful"). A printable page (browser
// print-to-PDF) rather than a generated image/PDF file: no new dependency,
// no server-side rendering pipeline, and it stays fully accessible text
// (CLAUDE.md: keyboard/accessibility is an acceptance criterion).
export default function CertificatePage() {
  return <Certificate course={course} lessons={lessons} />;
}
