"use client";
import { useState, type FormEvent } from "react";

const TOKEN_KEY = "cinemath:admin-token";

type Metrics = {
  generatedAt: number;
  learners: number;
  funnel: {
    lessonId: string;
    starts: number;
    completions: number;
    completionRate: number;
  }[];
  dropOff: { index: number; count: number }[];
  medianTimePerProblemMs: number | null;
  retryByProblem: {
    problemId: string;
    submissions: number;
    retries: number;
  }[];
  hintUseByLevel: { level: number; rate: number }[];
  solutionRevealRate: number;
  sevenDayReturnRate: number;
  conceptMastery: {
    conceptId: string;
    averageScore: number;
    learners: number;
  }[];
  feedback: {
    createdAt: number;
    lessonId: string;
    clarity: string;
    challenge: string;
    hintsHelped: string;
    wouldReturn: boolean;
    willingToContinue: string;
    mostEngaging: string | null;
    mostConfusing: string | null;
    nextTopic: string | null;
    comments: string | null;
  }[];
};

const pct = (n: number) => `${Math.round(n * 100)}%`;
const minutes = (ms: number | null) =>
  ms === null ? "—" : `${(ms / 60000).toFixed(1)} min`;

// Operator-only closed-beta metrics view (ROADMAP.md Phase 5). A second
// admin surface, unlike the curl-able /api/admin/ai-feedback queue
// (docs/phase-4.md) — several numbers need to be read together to judge
// beta health, which justifies a small page. The token is kept in
// sessionStorage only, never in the URL.
export default function AdminMetricsPage() {
  const [token, setToken] = useState(
    () =>
      (typeof window !== "undefined" &&
        sessionStorage.getItem(TOKEN_KEY)) ||
      "",
  );
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (event?: FormEvent) => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      const res = await fetch("/api/admin/metrics", {
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

  return (
    <main id="main" className="dashboard-page">
      <h1>Closed beta metrics</h1>
      <p className="muted">
        Operator-only. Data reflects recruited beta learners only — see
        ROADMAP.md Phase 5 for the recruiting and interview process this
        dashboard supports.
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
          {loading ? "Loading…" : "Load metrics"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <section className="dashboard-overview" aria-label="Overview">
            <div>
              <strong>{data.learners}</strong>
              <span>learners with activity</span>
            </div>
            <div>
              <strong>{pct(data.sevenDayReturnRate)}</strong>
              <span>seven-day return rate</span>
            </div>
            <div>
              <strong>{pct(data.solutionRevealRate)}</strong>
              <span>solution-reveal rate</span>
            </div>
            <div>
              <strong>{minutes(data.medianTimePerProblemMs)}</strong>
              <span>median time per problem</span>
            </div>
          </section>

          <section className="dashboard-section">
            <h2>Lesson completion funnel</h2>
            <table>
              <thead>
                <tr>
                  <th scope="col">Lesson</th>
                  <th scope="col">Starts</th>
                  <th scope="col">Completions</th>
                  <th scope="col">Completion rate</th>
                </tr>
              </thead>
              <tbody>
                {data.funnel.map((row) => (
                  <tr key={row.lessonId}>
                    <td>{row.lessonId}</td>
                    <td>{row.starts}</td>
                    <td>{row.completions}</td>
                    <td>{pct(row.completionRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="dashboard-section">
            <h2>Drop-off by problem index</h2>
            <p className="muted">
              Where learners who did not finish the lesson last stopped.
            </p>
            <ul>
              {data.dropOff.map((row) => (
                <li key={row.index}>
                  Problem {row.index + 1}: {row.count} learners stalled here
                </li>
              ))}
            </ul>
          </section>

          <section className="dashboard-section">
            <h2>Retries by problem</h2>
            <table>
              <thead>
                <tr>
                  <th scope="col">Problem</th>
                  <th scope="col">Submissions</th>
                  <th scope="col">Retries</th>
                </tr>
              </thead>
              <tbody>
                {data.retryByProblem.map((row) => (
                  <tr key={row.problemId}>
                    <td>{row.problemId}</td>
                    <td>{row.submissions}</td>
                    <td>{row.retries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="dashboard-section">
            <h2>Hint use rate by level</h2>
            <ul>
              {data.hintUseByLevel.map((row) => (
                <li key={row.level}>
                  Hint {row.level}: {pct(row.rate)}
                </li>
              ))}
            </ul>
          </section>

          <section className="dashboard-section">
            <h2>Concept mastery progression</h2>
            <table>
              <thead>
                <tr>
                  <th scope="col">Concept</th>
                  <th scope="col">Average score</th>
                  <th scope="col">Learners</th>
                </tr>
              </thead>
              <tbody>
                {data.conceptMastery.map((row) => (
                  <tr key={row.conceptId}>
                    <td>{row.conceptId}</td>
                    <td>{pct(row.averageScore)}</td>
                    <td>{row.learners}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="dashboard-section">
            <h2>Self-reported feedback</h2>
            <p className="muted">
              {data.feedback.length} responses, most recent first.
            </p>
            <ul>
              {data.feedback.map((row, i) => (
                <li key={i}>
                  <p>
                    <strong>{row.lessonId}</strong> · {row.clarity} ·{" "}
                    {row.challenge} · hints: {row.hintsHelped} · return:{" "}
                    {row.wouldReturn ? "yes" : "no"} · pay:{" "}
                    {row.willingToContinue}
                  </p>
                  {row.mostEngaging && <p>Engaged: {row.mostEngaging}</p>}
                  {row.mostConfusing && <p>Confusing: {row.mostConfusing}</p>}
                  {row.nextTopic && <p>Wants next: {row.nextTopic}</p>}
                  {row.comments && <p>Comments: {row.comments}</p>}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
