"use client";
import { useState, type FormEvent } from "react";

const TOKEN_KEY = "cinemath:admin-token";

type ContentRow = {
  lessonId: string;
  title: string;
  courseTitle: string;
  moduleTitle: string;
  kind: "lesson" | "checkpoint" | "capstone";
  status: "draft" | "published";
  problemCount: number;
  conceptsIntroduced: string[];
};
type ContentResponse = {
  course: { title: string; modules: { slug: string; title: string }[] };
  lessons: ContentRow[];
};

// Operator-only Phase 6 content/publishing workflow view (ROADMAP.md
// "Instructor/editor publishing workflow"). Mirrors the pattern already
// established by /admin/metrics (Phase 5): a token kept in sessionStorage
// only, never the URL. Authoring content is still a JSON-file change per
// docs/content-authoring-guide.md — this page's job is giving an editor
// visibility into what's published vs. draft before content goes live,
// without building a full CMS the authoring pipeline doesn't need yet.
export default function AdminContentPage() {
  const [token, setToken] = useState(
    () =>
      (typeof window !== "undefined" && sessionStorage.getItem(TOKEN_KEY)) ||
      "",
  );
  const [data, setData] = useState<ContentResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (event?: FormEvent) => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      const res = await fetch("/api/admin/content", {
        headers: { "x-admin-token": token },
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Request failed.");
      setData(body);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const drafts = data?.lessons.filter((l) => l.status === "draft") ?? [];
  const published = data?.lessons.filter((l) => l.status === "published") ?? [];

  return (
    <main id="main" className="dashboard-page">
      <h1>Content publishing status</h1>
      <p className="muted">
        Operator-only. Lists every authored lesson, including drafts the public
        course page never renders (see <code>src/lib/content.ts</code>).
      </p>
      <form onSubmit={(e) => void load(e)}>
        <label>
          Admin token
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Loading…" : "Load content status"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <section className="dashboard-overview" aria-label="Overview">
            <div>
              <strong>{data.lessons.length}</strong>
              <span>authored lessons total</span>
            </div>
            <div>
              <strong>{published.length}</strong>
              <span>published (visible to learners)</span>
            </div>
            <div>
              <strong>{drafts.length}</strong>
              <span>draft (hidden from learners)</span>
            </div>
          </section>
          <section className="dashboard-section">
            <h2>All lessons</h2>
            <table>
              <thead>
                <tr>
                  <th scope="col">Module</th>
                  <th scope="col">Lesson</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Status</th>
                  <th scope="col">Problems</th>
                  <th scope="col">Preview</th>
                </tr>
              </thead>
              <tbody>
                {data.lessons.map((row) => (
                  <tr key={row.lessonId}>
                    <td>
                      {row.courseTitle}
                      <br />
                      {row.moduleTitle}
                    </td>
                    <td>{row.title}</td>
                    <td>{row.kind}</td>
                    <td>{row.status}</td>
                    <td>{row.problemCount}</td>
                    <td>
                      <a href={`/lesson/${row.lessonId}?preview=1`}>
                        Preview ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
