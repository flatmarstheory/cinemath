"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/schema";
import { grade } from "@/lib/grading";
import {
  canReveal,
  decodeProgress,
  encodeProgress,
  INCORRECT_ATTEMPTS_TO_REVEAL,
  isFinished,
  newProgress,
  storageKey,
  summarize,
  transition,
  type Action,
  type Progress,
} from "@/lib/progress";
import { accountAction, learnerData } from "@/lib/account-client";
import { ReviewPractice } from "./review-practice";
import { MathContent } from "./math-content";
import { AnswerInput } from "./answer-input";
import { analyticsEventFor, emitAnalyticsEvent } from "@/lib/analytics";

export function LessonPlayer({
  lesson,
  courseTitle,
  lessonNumber = 1,
}: {
  lesson: Lesson;
  courseTitle: string;
  lessonNumber?: number;
}) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [storageMessage, setStorageMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showTheory, setShowTheory] = useState(false);
  // Detected client-side (not via server searchParams) so this route stays statically generated.
  const [preview, setPreview] = useState(false);
  const account = useRef<string | null>(null);
  const revision = useRef(0);
  const pending = useRef(Promise.resolve());
  const failed = useRef(false);
  const [reviewConcept, setReviewConcept] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const isPreview =
      new URLSearchParams(window.location.search).get("preview") === "1";
    // Browser-only URL is read after the server's identical loading screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(isPreview);
    if (isPreview) {
      setProgress(newProgress(lesson));
      setStorageMessage(
        "Preview mode: this run is not saved and does not touch a learner's real progress.",
      );
      return;
    }
    let cancelled = false;
    void learnerData()
      .then((data) => {
        if (cancelled) return;
        account.current = data.account?.id || null;
        setReviewConcept(
          new URLSearchParams(window.location.search).get("review"),
        );
        let loaded = newProgress(lesson);
        let message = "Progress saves automatically in this browser.";
        try {
          const saved = data.progress?.find(
            (row) => row.lesson_id === lesson.lessonId,
          );
          revision.current = saved?.revision || 0;
          const raw = data.account
            ? saved?.value
            : localStorage.getItem(storageKey(lesson));
          if (raw) {
            try {
              loaded = decodeProgress(lesson, raw);
            } catch {
              message =
                "Your saved progress could not be restored. A fresh lesson is ready; the old save is kept until you continue.";
            }
          }
        } catch {
          message =
            "Browser storage is unavailable. You can still learn, but progress will not survive a reload.";
        }
        // Browser-only storage is hydrated after the server's identical loading screen.
        setProgress(loaded);
        setStorageMessage(
          data.account ? "Progress saves to your account." : message,
        );
      })
      .catch((error) => {
        if (!cancelled) setStorageMessage(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [lesson]);
  useEffect(() => {
    heading.current?.focus();
  }, [progress?.stage, progress?.index]);
  if (!progress)
    return (
      <main id="main" className="empty-state" aria-busy="true">
        {storageMessage || "Opening your lesson…"}
      </main>
    );

  const persist = (next: Progress) => {
    if (preview) return;
    if (failed.current) return;
    if (account.current) {
      setStorageMessage("Saving to your account…");
      pending.current = pending.current.then(async () => {
        if (failed.current) return;
        try {
          const result = await accountAction({
            action: "progress",
            accountId: account.current,
            lessonId: lesson.lessonId,
            value: encodeProgress(lesson, next),
            revision: revision.current,
          });
          revision.current = result.revision;
          setStorageMessage("Progress saved to your account.");
        } catch (error) {
          failed.current = true;
          setStorageMessage(
            (error as Error).message +
              " Keep this tab open; changes are not saved. Reload to reconnect.",
          );
        }
      });
      return;
    }
    try {
      localStorage.setItem(storageKey(lesson), encodeProgress(lesson, next));
      setStorageMessage("Progress saves automatically in this browser.");
    } catch {
      setStorageMessage(
        "Your latest work could not be saved. Keep this tab open to continue; reloading may lose progress.",
      );
    }
  };
  const act = (action: Action) => {
    const problemBefore = lesson.problems[progress.index];
    const next = transition(lesson, progress, action);
    setProgress(next);
    emitAnalyticsEvent(
      analyticsEventFor(lesson, problemBefore, progress, next, action),
    );
    persist(next);
  };
  if (reviewConcept && !preview)
    return (
      <ReviewPractice
        lesson={lesson}
        concept={reviewConcept}
        progress={progress}
        message={storageMessage}
        onSave={(next) => {
          setProgress(next);
          persist(next);
        }}
      />
    );
  const record = progress.records[progress.index];
  const problem = lesson.problems[progress.index];
  const solved = record.attempts.some((a) => a.correct);
  const finished = progress.records.filter(isFinished).length;
  const latest = record.attempts.at(-1);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = grade(problem, record.draft);
    setFeedback(result.message);
    if (result.valid) act({ type: "submit", at: new Date().toISOString() });
  };
  const summary = summarize(lesson, progress);
  const theory = (
    <>
      <section className="lesson-section">
        <p className="eyebrow">01 / GET READY</p>
        <h2>A familiar starting point</h2>
        <MathContent>{lesson.loop.retrieve.bodyMarkdown}</MathContent>
      </section>
      <section className="lesson-section encounter">
        <p className="eyebrow">02 / ENCOUNTER</p>
        <h2>When does a sentence say something?</h2>
        <MathContent>{lesson.loop.encounter.bodyMarkdown}</MathContent>
      </section>
      <section className="lesson-section">
        <p className="eyebrow">03 / THE IDEA</p>
        <h2>A precise language for your reasoning</h2>
        <MathContent>{lesson.loop.explain.bodyMarkdown}</MathContent>
      </section>
    </>
  );
  return (
    <main id="main" className="learning-page">
      <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">← Course</Link>
        <span>{courseTitle}</span>
        <span className="pill">
          LESSON {String(lessonNumber).padStart(2, "0")}
        </span>
        {preview && <span className="pill preview-pill">PREVIEW</span>}
      </nav>
      <div className="learning-layout">
        <aside className="lesson-sidebar">
          <p className="eyebrow">THE LANGUAGE OF PROOF</p>
          <h2>{lesson.title}</h2>
          <p className="muted">
            {lesson.estimatedMinutes.min}–{lesson.estimatedMinutes.max} minutes
            · {lesson.problems.length} problems
          </p>
          <progress
            value={finished}
            max={lesson.problems.length}
            aria-label="Lesson progress"
          />
          <p className="progress-label">
            {finished} of {lesson.problems.length} problems completed
          </p>
          <ol className="lesson-outline">
            <li className={progress.stage === "intro" ? "active" : ""}>
              <span>01</span>Explore the idea
            </li>
            <li className={progress.stage === "practice" ? "active" : ""}>
              <span>02</span>Put it into practice
            </li>
            <li className={progress.stage === "complete" ? "active" : ""}>
              <span>03</span>Reflect & grow
            </li>
          </ol>
          <p className="storage-note" role="status">
            {storageMessage}
          </p>
        </aside>
        <div className="lesson-workspace">
          {progress.stage === "intro" && (
            <>
              <p className="eyebrow">
                A FOUNDATION FOR EVERYTHING THAT FOLLOWS
              </p>
              <h1 tabIndex={-1} ref={heading}>
                {lesson.title}
              </h1>
              <div className="objective">
                <span className="eyebrow">BY THE END OF THIS LESSON</span>
                <MathContent>{lesson.learningObjective}</MathContent>
              </div>
              {theory}
              <button
                className="button"
                onClick={() => {
                  setFeedback("");
                  act({ type: "start" });
                }}
              >
                {progress.records.some((r) => r.attempts.length > 0)
                  ? "Resume practice"
                  : "Start problem 1"}{" "}
                <span aria-hidden="true">→</span>
              </button>
            </>
          )}
          {progress.stage === "practice" && (
            <>
              <div className="problem-heading">
                <p className="eyebrow">
                  PRACTICE / {String(progress.index + 1).padStart(2, "0")} OF{" "}
                  {String(lesson.problems.length).padStart(2, "0")}
                </p>
                <button
                  className="text-button"
                  onClick={() => setShowTheory(!showTheory)}
                  aria-expanded={showTheory}
                >
                  Revisit the idea {showTheory ? "−" : "+"}
                </button>
              </div>
              {showTheory && <div className="theory-review">{theory}</div>}
              <h1 ref={heading} tabIndex={-1}>
                Problem {progress.index + 1}
              </h1>
              <div className="problem-prompt">
                <MathContent>{problem.promptMarkdown}</MathContent>
              </div>
              <form onSubmit={submit}>
                <AnswerInput
                  problem={problem}
                  answer={record.draft}
                  onChange={(answer) => {
                    act({ type: "draft", answer });
                    setFeedback("");
                  }}
                  disabled={solved}
                />
                <div className="submit-row">
                  <button type="submit" className="button" disabled={solved}>
                    {solved ? "Correct ✓" : "Check answer"}
                  </button>
                  <span className="muted">
                    {record.attempts.length}{" "}
                    {record.attempts.length === 1 ? "attempt" : "attempts"} ·
                    Take your time
                  </span>
                </div>
              </form>
              <div
                className={`feedback ${solved ? "success" : ""}`}
                role="status"
                aria-live="polite"
              >
                {feedback ||
                  (latest
                    ? grade(problem, latest.answer).message
                    : "Your reasoning matters more than speed.")}
              </div>
              <section className="hint-panel" aria-labelledby="hint-heading">
                <div>
                  <h2 id="hint-heading">A little help along the way</h2>
                  <p>
                    Hints guide your thinking and are recorded in your summary.
                    Use them whenever they help.
                  </p>
                </div>
                {problem.hints.slice(0, 3).map((hint, i) => (
                  <div className="hint-row" key={hint.order} aria-live="polite">
                    <h3>
                      Hint {hint.order} ·{" "}
                      {
                        ["Find the goal", "Choose a tool", "Make a connection"][
                          i
                        ]
                      }
                    </h3>
                    {i < record.hintsUsed ? (
                      <MathContent>{hint.bodyMarkdown}</MathContent>
                    ) : (
                      <button
                        className="text-button"
                        disabled={i !== record.hintsUsed}
                        onClick={() => act({ type: "hint" })}
                      >
                        {i === record.hintsUsed
                          ? `Reveal hint ${hint.order}`
                          : `Reveal hint ${i} first`}
                      </button>
                    )}
                  </div>
                ))}
                <div className="hint-row">
                  <h3>Hint 4 · Worked solution</h3>
                  <p id="solution-rule">
                    Unlocks after {INCORRECT_ATTEMPTS_TO_REVEAL} incorrect
                    attempts or one correct answer. Revealing it is recorded
                    separately from hints.
                  </p>
                  {record.solutionRevealed ? (
                    <div className="solution">
                      <MathContent>{problem.hints[3].bodyMarkdown}</MathContent>
                      <h3>Why it works</h3>
                      <MathContent>{problem.solutionMarkdown}</MathContent>
                    </div>
                  ) : (
                    <button
                      className="secondary-button"
                      disabled={!canReveal(record)}
                      aria-describedby="solution-rule"
                      onClick={() => act({ type: "solution" })}
                    >
                      Reveal worked solution
                    </button>
                  )}
                </div>
              </section>
              <div className="continue-row">
                <p className="muted">
                  {isFinished(record)
                    ? record.solutionRevealed && !solved
                      ? "You can try again or continue with the worked solution."
                      : "Ready when you are."
                    : "Answer correctly or study the unlocked solution to continue."}
                </p>
                <button
                  className="button"
                  disabled={!isFinished(record)}
                  onClick={() => {
                    act({ type: "next" });
                    setFeedback("");
                    setShowTheory(false);
                  }}
                >
                  {progress.index === lesson.problems.length - 1
                    ? "See your summary"
                    : "Next problem"}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </>
          )}
          {progress.stage === "complete" && (
            <>
              <p className="eyebrow">ONE STEP FURTHER</p>
              <h1 ref={heading} tabIndex={-1}>
                A clearer way to think.
              </h1>
              <p className="completion-lede">
                Lesson complete. You’ve practiced the language that turns an
                idea into a mathematical claim.
              </p>
              <h2>{lesson.title}</h2>
              <dl className="summary-grid">
                <div>
                  <dt>First-attempt accuracy</dt>
                  <dd>
                    {summary.firstCorrect}
                    <span> / {lesson.problems.length}</span>
                  </dd>
                </div>
                <div>
                  <dt>Total attempts</dt>
                  <dd>{summary.attempts}</dd>
                </div>
                <div>
                  <dt>Hints used</dt>
                  <dd>
                    {summary.hints}
                    <span>
                      {" "}
                      across {summary.helpedProblems}{" "}
                      {summary.helpedProblems === 1 ? "problem" : "problems"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Solutions revealed</dt>
                  <dd>{summary.solutions}</dd>
                </div>
              </dl>
              <p className="muted">
                {summary.correct} of {lesson.problems.length} problems answered
                correctly. Studying a worked solution also counts toward lesson
                completion.
              </p>
              <section className="lesson-section">
                <h2>What to take with you</h2>
                <MathContent>{lesson.loop.reflect.bodyMarkdown}</MathContent>
              </section>
              <section className="mastery">
                <h2>Your concepts, taking shape</h2>
                <p>
                  Solid means every related problem was solved before using
                  help. Developing means there’s room to practice. This is a
                  snapshot of this lesson, not a long-term mastery score.
                </p>
                <ul>
                  {summary.concepts.map((concept) => (
                    <li key={concept.id}>
                      <div>
                        <strong>{concept.id.replaceAll("-", " ")}</strong>
                        <span>
                          {concept.correct} correct before seeing a solution /{" "}
                          {concept.attempted} attempted
                        </span>
                      </div>
                      <span
                        className={`pill ${concept.status === "Solid" ? "solid" : ""}`}
                      >
                        {concept.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <div className="completion-actions">
                <Link href="/" className="button">
                  Back to course ↗
                </Link>
                <button
                  className="text-button"
                  onClick={() => act({ type: "review" })}
                >
                  Revisit the explanation
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
