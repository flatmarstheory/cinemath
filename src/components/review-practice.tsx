"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/schema";
import { newProgress, transition, type Progress } from "@/lib/progress";
import { grade } from "@/lib/grading";
import { AnswerInput } from "./answer-input";
import { MathContent } from "./math-content";

export function ReviewPractice({
  lesson,
  concept,
  progress,
  onSave,
  message,
}: {
  lesson: Lesson;
  concept: string;
  progress: Progress;
  onSave: (next: Progress) => void;
  message: string;
}) {
  // proof_free_response needs AI grading, which this synchronous review flow
  // doesn't perform; only deterministic problem types are used for review.
  const indices = lesson.problems.flatMap((p, i) =>
    p.concepts.includes(concept) && p.type !== "proof_free_response" ? [i] : [],
  );
  const [position, setPosition] = useState(0);
  const [practice, setPractice] = useState(
    () =>
      ({
        ...newProgress(lesson),
        index: indices[0] ?? 0,
        stage: "practice" as const,
      }) as Progress,
  );
  const [feedback, setFeedback] = useState("");
  const problem = lesson.problems[practice.index];
  const record = practice.records[practice.index];
  const done = record.attempts.some((a) => a.correct);
  if (!indices.length)
    return (
      <main id="main" className="dashboard-page">
        <h1>Concept not found</h1>
        <Link href="/dashboard">Back to dashboard</Link>
      </main>
    );
  return (
    <main id="main" className="dashboard-page">
      <p className="eyebrow">TARGETED REVIEW</p>
      <h1>{concept.replace(/^la-/, "").replaceAll("-", " ")}</h1>
      <p>
        Fresh practice adds evidence to your mastery without resetting lesson
        completion.
      </p>
      <p role="status">{message}</p>
      <MathContent>{problem.promptMarkdown}</MathContent>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const result = grade(problem, record.draft);
          setFeedback(result.message);
          if (!result.valid || done) return;
          const next = transition(lesson, practice, {
            type: "submit",
            at: new Date().toISOString(),
          });
          setPractice(next);
          onSave({
            ...progress,
            reviewAttempts: [
              ...(progress.reviewAttempts ?? []),
              {
                problemIndex: practice.index,
                attempt: next.records[practice.index].attempts.at(-1)!,
              },
            ],
          });
        }}
      >
        <AnswerInput
          problem={problem}
          answer={record.draft}
          disabled={done}
          onChange={(answer) =>
            setPractice(transition(lesson, practice, { type: "draft", answer }))
          }
        />
        <button className="button" disabled={done}>
          Check answer
        </button>
      </form>
      <p role="status">{feedback}</p>
      <button
        className="text-button"
        disabled={record.hintsUsed === 3 || done}
        onClick={() =>
          setPractice(transition(lesson, practice, { type: "hint" }))
        }
      >
        Show next hint
      </button>
      {problem.hints.slice(0, record.hintsUsed).map((hint, i) => (
        <MathContent key={i}>{hint.bodyMarkdown}</MathContent>
      ))}
      {done && position + 1 < indices.length && (
        <button
          className="button"
          onClick={() => {
            setPosition(position + 1);
            setPractice({ ...practice, index: indices[position + 1] });
            setFeedback("");
          }}
        >
          Next review problem
        </button>
      )}
      {done && position + 1 === indices.length && (
        <p>Review complete. Your dashboard now includes this practice.</p>
      )}
      <p>
        <Link href="/dashboard">Back to dashboard</Link>
      </p>
    </main>
  );
}
