import { lessons, glossary, courses } from "@/lib/content";
import { SearchClient } from "@/components/search-client";

export const metadata = { title: "Search · CineMath" };

// Phase 6 (ROADMAP.md "Content search and glossary linking"). Content is
// small enough (one course) that a client-side filter over the already
// server-loaded lesson/glossary metadata is simple, fast, and needs no
// search index or new dependency — matching CLAUDE.md's "prefer simple,
// testable components over abstraction-heavy frameworks."
export default function SearchPage() {
  const lessonSummaries = lessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    title: lesson.title,
    moduleTitle: `${courses.find((c) => c.slug === lesson.courseSlug)?.title} · ${courses.find((c) => c.slug === lesson.courseSlug)?.modules.find((m) => m.slug === lesson.moduleSlug)?.title ?? ""}`,
    learningObjective: lesson.learningObjective,
    kind: lesson.kind,
    concepts: [...new Set(lesson.problems.flatMap((p) => p.concepts))].sort(),
  }));
  const glossaryTerms = (glossary?.terms ?? []).map((t) => ({
    id: t.id,
    term: t.term,
    definitionMarkdown: t.definitionMarkdown,
  }));
  return (
    <main id="main" className="dashboard-page">
      <div className="dashboard-header">
        <p className="eyebrow">FIND SOMETHING SPECIFIC</p>
        <h1>Search all courses</h1>
        <p className="completion-lede">
          Search lessons by title, objective, or concept, and glossary terms by
          name or definition.
        </p>
      </div>
      <SearchClient lessons={lessonSummaries} glossaryTerms={glossaryTerms} />
    </main>
  );
}
