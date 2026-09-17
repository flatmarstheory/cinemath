"use client";

import { useSyncExternalStore } from "react";
import type { Lesson } from "@/lib/schema";
import { decodeProgress, storageKey } from "@/lib/progress";
import Link from "next/link";

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
}
export function LessonLink({ lesson }: { lesson: Lesson }) {
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
      {label} <span aria-hidden="true">↗</span>
    </Link>
  );
}
