import Link from "next/link";
import { course, lessons, glossary } from "@/lib/content";

export const metadata = { title: "Prerequisite map · CineMath" };

// Phase 6 (ROADMAP.md "Prerequisite map"). Rendered as a structured,
// keyboard-navigable list rather than a node-and-arrow diagram: every
// dependency is still fully expressed (each lesson names exactly which
// concepts it requires and introduces, each linked to its glossary
// definition), and a list needs no separate accessible-text fallback the
// way an SVG graph would (CLAUDE.md: accessibility is an acceptance
// criterion, not a follow-up pass).
export default function PrerequisiteMapPage() {
  const known = new Set(glossary?.terms.map((t) => t.id) ?? []);
  const term = (id: string) =>
    glossary?.terms.find((t) => t.id === id)?.term ?? id.replaceAll("-", " ");
  return (
    <main id="main" className="dashboard-page">
      <div className="dashboard-header">
        <p className="eyebrow">HOW THE COURSE FITS TOGETHER</p>
        <h1>Prerequisite map</h1>
        <p className="completion-lede">
          {course.title} is a linear sequence of modules — each module
          assumes the concepts introduced by the ones before it. Every lesson
          below lists exactly what it requires and what it introduces.
        </p>
      </div>
      {course.modules.map((module, moduleIndex) => {
        const moduleLessons = lessons.filter(
          (l) => l.moduleSlug === module.slug,
        );
        if (moduleLessons.length === 0) return null;
        return (
          <section className="dashboard-section" key={module.slug}>
            <p className="eyebrow">
              MODULE {String(moduleIndex + 1).padStart(2, "0")}
            </p>
            <h2>{module.title}</h2>
            <ol className="prereq-lesson-list">
              {moduleLessons.map((lesson) => (
                <li key={lesson.lessonId}>
                  <div className="prereq-lesson-head">
                    <Link href={`/lesson/${lesson.lessonId}`}>
                      {lesson.title}
                    </Link>
                    {lesson.kind !== "lesson" && (
                      <span className="pill">
                        {lesson.kind.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <dl className="prereq-detail">
                    <div>
                      <dt>Requires</dt>
                      <dd>
                        {lesson.prerequisites.length === 0
                          ? "Nothing — this is a course entry point."
                          : lesson.prerequisites.map((id, i) => (
                              <span key={id}>
                                {i > 0 && ", "}
                                {known.has(id) ? (
                                  <Link href={`/glossary#${id}`}>
                                    {term(id)}
                                  </Link>
                                ) : (
                                  term(id)
                                )}
                              </span>
                            ))}
                      </dd>
                    </div>
                    <div>
                      <dt>Introduces</dt>
                      <dd>
                        {lesson.conceptsIntroduced.map((id, i) => (
                          <span key={id}>
                            {i > 0 && ", "}
                            {known.has(id) ? (
                              <Link href={`/glossary#${id}`}>{term(id)}</Link>
                            ) : (
                              term(id)
                            )}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </main>
  );
}
