"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LessonKind } from "@/lib/schema";

type LessonSummary = {
  lessonId: string;
  title: string;
  moduleTitle: string;
  learningObjective: string;
  kind: LessonKind;
  concepts: string[];
};
type GlossarySummary = { id: string; term: string; definitionMarkdown: string };

const kindLabel: Record<LessonKind, string> = {
  lesson: "LESSON",
  checkpoint: "CHECKPOINT",
  capstone: "CAPSTONE",
};

function matches(haystacks: string[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystacks.some((h) => h.toLowerCase().includes(q));
}

export function SearchClient({
  lessons,
  glossaryTerms,
}: {
  lessons: LessonSummary[];
  glossaryTerms: GlossarySummary[];
}) {
  const [query, setQuery] = useState("");
  const matchingLessons = useMemo(
    () =>
      lessons.filter((lesson) =>
        matches(
          [
            lesson.title,
            lesson.moduleTitle,
            lesson.learningObjective,
            ...lesson.concepts,
          ],
          query,
        ),
      ),
    [lessons, query],
  );
  const matchingTerms = useMemo(
    () =>
      glossaryTerms.filter((term) =>
        matches([term.term, term.definitionMarkdown, term.id], query),
      ),
    [glossaryTerms, query],
  );

  return (
    <>
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="search-form"
      >
        <label htmlFor="course-search">Search term</label>
        <input
          id="course-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. induction, injective, quantifier"
          autoComplete="off"
        />
      </form>
      <section className="dashboard-section" aria-label="Matching lessons">
        <p className="eyebrow">LESSONS</p>
        <h2>
          {matchingLessons.length}{" "}
          {matchingLessons.length === 1 ? "match" : "matches"}
        </h2>
        <div className="dashboard-list">
          {matchingLessons.map((lesson) => (
            <article className="dashboard-card" key={lesson.lessonId}>
              <div>
                <p className="eyebrow">
                  {lesson.moduleTitle} · {kindLabel[lesson.kind]}
                </p>
                <h3>{lesson.title}</h3>
                <p className="muted">{lesson.learningObjective}</p>
              </div>
              <Link className="button" href={`/lesson/${lesson.lessonId}`}>
                Open <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
          {matchingLessons.length === 0 && (
            <p className="muted">No lessons match &ldquo;{query}&rdquo;.</p>
          )}
        </div>
      </section>
      <section className="dashboard-section" aria-label="Matching glossary terms">
        <p className="eyebrow">GLOSSARY</p>
        <h2>
          {matchingTerms.length}{" "}
          {matchingTerms.length === 1 ? "match" : "matches"}
        </h2>
        <ul className="review-list">
          {matchingTerms.map((term) => (
            <li key={term.id}>
              <span>
                <strong>{term.term}</strong>
              </span>
              <Link className="text-button" href={`/glossary#${term.id}`}>
                View definition →
              </Link>
            </li>
          ))}
          {matchingTerms.length === 0 && (
            <li className="muted">No glossary terms match &ldquo;{query}&rdquo;.</li>
          )}
        </ul>
      </section>
    </>
  );
}
