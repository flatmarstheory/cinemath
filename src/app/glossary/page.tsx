import Link from "next/link";
import { glossary } from "@/lib/content";
import { MathContent } from "@/components/math-content";

export const metadata = { title: "Glossary · CineMath" };

// Phase 6 (ROADMAP.md "Content search and glossary linking"). Term ids are
// the same kebab-case concept ids used throughout authored content
// (docs/content-authoring-guide.md), so every lesson's concept tags can link
// straight here (see the lesson-player completion summary and dashboard).
export default function GlossaryPage() {
  const terms = [...(glossary?.terms ?? [])].sort((a, b) =>
    a.term.localeCompare(b.term),
  );
  return (
    <main id="main" className="dashboard-page">
      <div className="dashboard-header">
        <p className="eyebrow">SHARED VOCABULARY</p>
        <h1>Mathematics glossary</h1>
        <p className="completion-lede">
          Every term below is defined once, here, and used consistently across
          every lesson — the same concept id you see in your dashboard&apos;s
          mastery list links back to its definition on this page.
        </p>
      </div>
      {terms.length === 0 ? (
        <p className="muted">No glossary terms have been authored yet.</p>
      ) : (
        <dl className="glossary-list">
          {terms.map((term) => (
            <div className="glossary-entry" id={term.id} key={term.id}>
              <dt>
                <h2>{term.term}</h2>
              </dt>
              <dd>
                <MathContent>{term.definitionMarkdown}</MathContent>
                {term.relatedTerms.length > 0 && (
                  <p className="glossary-related muted">
                    See also:{" "}
                    {term.relatedTerms.map((relatedId, i) => {
                      const related = terms.find((t) => t.id === relatedId);
                      if (!related) return null;
                      return (
                        <span key={relatedId}>
                          {i > 0 && ", "}
                          <Link href={`#${relatedId}`}>{related.term}</Link>
                        </span>
                      );
                    })}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </main>
  );
}
