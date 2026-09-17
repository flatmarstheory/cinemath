"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { learnerData } from "@/lib/account-client";
import type { Lesson } from "@/lib/schema";
import { decodeProgress, storageKey } from "@/lib/progress";
import Link from "next/link";

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
}
export function LessonLink({ lesson }: { lesson: Lesson }) {
  const [accountLabel, setAccountLabel] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void learnerData()
      .then((data) => {
        if (cancelled || !data.account) return;
        const row = data.progress?.find(
          (row) => row.lesson_id === lesson.lessonId,
        );
        let label = "Start lesson";
        if (row) {
          try {
            label =
              decodeProgress(lesson, row.value).stage === "complete"
                ? "View your results"
                : "Resume lesson";
          } catch {
            label = "Resume lesson";
          }
        }
        setAccountLabel(label);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lesson]);
  const label = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const saved = localStorage.getItem(storageKey(lesson));
        if (saved)
          return decodeProgress(lesson, saved).stage === "complete"
            ? "View your results"
            : "Resume lesson";
      } catch {
        /* The player provides recovery for unavailable or invalid storage. */
      }
      return "Start lesson";
    },
    () => "Start lesson",
  );
  return (
    <Link className="button" href={`/lesson/${lesson.lessonId}`}>
      {accountLabel || label} <span aria-hidden="true">↗</span>
    </Link>
  );
}
