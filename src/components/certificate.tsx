"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Course } from "@/lib/content-loader";
import type { Lesson } from "@/lib/schema";
import { decodeProgress, storageKey } from "@/lib/progress";
import { learnerData } from "@/lib/account-client";
import { defaultProfile, readProfile } from "@/lib/learner-data";

export function Certificate({
  course,
  lessons,
}: {
  course: Course;
  lessons: Lesson[];
}) {
  const [completedIds, setCompletedIds] = useState<Set<string> | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    let cancelled = false;
    void learnerData()
      .then((data) => {
        if (cancelled) return;
        const completed = new Set<string>();
        for (const lesson of lessons) {
          try {
            const raw = data.account
              ? data.progress?.find((row) => row.lesson_id === lesson.lessonId)
                  ?.value
              : localStorage.getItem(storageKey(lesson));
            if (raw && decodeProgress(lesson, raw).stage === "complete")
              completed.add(lesson.lessonId);
          } catch {
            // An unreadable save is treated as not completed.
          }
        }
        setCompletedIds(completed);
        setDisplayName(
          (data.profile || readProfile() || defaultProfile).displayName,
        );
      })
      .catch(() => setCompletedIds(new Set()));
    return () => {
      cancelled = true;
    };
  }, [lessons]);

  if (!completedIds)
    return (
      <main id="main" className="dashboard-page">
        <h1>Your certificate</h1>
        <p role="status">Checking your course progress…</p>
      </main>
    );

  const total = lessons.length;
  const done = lessons.filter((l) => completedIds.has(l.lessonId)).length;
  const earned = total > 0 && done === total;

  if (!earned)
    return (
      <main id="main" className="dashboard-page">
        <div className="dashboard-header">
          <p className="eyebrow">COURSE COMPLETION</p>
          <h1>Not quite yet</h1>
          <p className="completion-lede">
            Your shareable completion certificate unlocks once every lesson
            in {course.title} is complete. You&apos;ve finished {done} of{" "}
            {total} so far.
          </p>
        </div>
        <progress value={done} max={total} aria-label="Course progress" />
        <p>
          <Link className="button" href="/dashboard">
            Back to your dashboard
          </Link>
        </p>
      </main>
    );

  return (
    <main id="main" className="dashboard-page certificate-page">
      <div className="dashboard-header no-print">
        <p className="eyebrow">COURSE COMPLETION</p>
        <h1>Your certificate is ready</h1>
        <p className="completion-lede">
          Print this page or save it as a PDF to keep or share a record of
          your work. This certifies course completion on CineMath, not an
          accredited or third-party-verified credential.
        </p>
        <button className="button" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>
      <section className="certificate" aria-label="Certificate of completion">
        <p className="certificate-eyebrow">CineMath · Certificate of Completion</p>
        <h2 className="certificate-name">
          {displayName || "A CineMath learner"}
        </h2>
        <p className="certificate-body">
          has completed every lesson of
        </p>
        <h3 className="certificate-course">{course.title}</h3>
        <p className="certificate-meta">
          {total} lessons ·{" "}
          {new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <ol className="certificate-modules">
          {course.modules.map((module) => (
            <li key={module.slug}>{module.title}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
