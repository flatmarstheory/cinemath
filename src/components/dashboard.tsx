"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AccountForm } from "./account-form";
import {
  accountAction,
  learnerData,
  type LearnerData,
} from "@/lib/account-client";
import type { Lesson } from "@/lib/schema";
import {
  decodeProgress,
  storageKey,
  summarize,
  type Progress,
} from "@/lib/progress";
import {
  masteryForCourse,
  reviewQueue,
  type MasteryRecord,
} from "@/lib/mastery";
import {
  defaultProfile,
  deleteLearnerData,
  readProfile,
  saveProfile,
  type LearnerProfile,
} from "@/lib/learner-data";

export function Dashboard({ lessons }: { lessons: Lesson[] }) {
  const [progressByLesson, setProgressByLesson] = useState<
    Map<string, Progress>
  >(new Map());
  const [profile, setProfile] = useState<LearnerProfile>(defaultProfile);
  const [account, setAccount] = useState<LearnerData["account"]>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const profileQueue = useRef(Promise.resolve());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void learnerData()
      .then((data) => {
        if (cancelled) return;
        setAccount(data.account);
        const progress = new Map<string, Progress>();
        for (const lesson of lessons) {
          try {
            const raw = data.account
              ? data.progress?.find((row) => row.lesson_id === lesson.lessonId)
                  ?.value
              : localStorage.getItem(storageKey(lesson));
            if (raw) progress.set(lesson.lessonId, decodeProgress(lesson, raw));
          } catch {
            // A malformed lesson save is ignored; the lesson player offers recovery.
          }
        }
        // Dashboard data is browser-only and must hydrate after static rendering.
        setProgressByLesson(progress);
        setProfile(data.profile || readProfile());
        setReady(true);
      })
      .catch((error) => {
        if (!cancelled) setError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [lessons]);

  const mastery = masteryForCourse(lessons, progressByLesson);
  const reviews = profile.reviewReminders
    ? reviewQueue(lessons, progressByLesson)
    : [];
  const completed = lessons.filter(
    (lesson) => progressByLesson.get(lesson.lessonId)?.stage === "complete",
  ).length;

  function updateProfile(next: LearnerProfile) {
    setProfile(next);
    setSaved(false);
    profileQueue.current = profileQueue.current.then(async () => {
      try {
        if (account)
          await accountAction({
            action: "profile",
            accountId: account.id,
            profile: next,
          });
        else saveProfile(next);
        setSaved(true);
        setError("");
      } catch (error) {
        setError((error as Error).message);
      }
    });
  }
  async function deleteData() {
    if (
      !window.confirm(
        "Delete all learning data and profile settings? This cannot be undone.",
      )
    )
      return;
    try {
      await profileQueue.current;
      if (account)
        await accountAction({ action: "delete-data", accountId: account.id });
      else deleteLearnerData();
      setProgressByLesson(new Map());
      setProfile(defaultProfile);
      setSaved(false);
      setError("");
    } catch (error) {
      setError((error as Error).message);
    }
  }
  async function accountCommand(action: string) {
    if (
      action === "delete-account" &&
      !window.confirm(
        "Permanently delete your account, profile, and all learning data?",
      )
    )
      return;
    try {
      await profileQueue.current;
      await accountAction({ action, accountId: account?.id });
      window.location.reload();
    } catch (error) {
      setError((error as Error).message);
    }
  }
  async function exportData() {
    try {
      const data = account
        ? await learnerData()
        : { profile, progress: [...progressByLesson.values()], mastery };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "cinemath-learning-data.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setError((error as Error).message);
    }
  }
  if (!ready)
    return (
      <main id="main" className="dashboard-page">
        <h1>Your dashboard</h1>
        <p role="status">{error || "Loading your learning data…"}</p>
      </main>
    );

  return (
    <main id="main" className="dashboard-page">
      <div className="dashboard-header">
        <p className="eyebrow">YOUR PRACTICE</p>
        <h1>
          {profile.displayName
            ? `${profile.displayName}'s dashboard`
            : "Your dashboard"}
        </h1>
        <p className="completion-lede">
          {account
            ? "Your progress is saved privately to your account."
            : "Your guest progress is private to this browser."}{" "}
          Scores are deterministic and explainable, not a judgment of your
          ability.
        </p>
      </div>
      {error && <p role="alert">{error}</p>}
      {account ? (
        <p>
          Signed in as {account.username}.{" "}
          <button
            className="text-button"
            onClick={() => void accountCommand("logout")}
          >
            Sign out
          </button>
        </p>
      ) : (
        <AccountForm />
      )}
      <section className="dashboard-overview" aria-label="Course overview">
        <div>
          <strong>{completed}</strong>
          <span>lessons complete</span>
        </div>
        <div>
          <strong>{progressByLesson.size}</strong>
          <span>lessons started</span>
        </div>
        <div>
          <strong>{mastery.length}</strong>
          <span>concepts tracked</span>
        </div>
      </section>
      <section className="dashboard-section">
        <p className="eyebrow">KEEP GOING</p>
        <h2>Resume learning</h2>
        <div className="dashboard-list">
          {lessons.map((lesson) => {
            const progress = progressByLesson.get(lesson.lessonId);
            const summary = progress ? summarize(lesson, progress) : null;
            return (
              <article className="dashboard-card" key={lesson.lessonId}>
                <div>
                  <h3>{lesson.title}</h3>
                  <p className="muted">
                    {summary
                      ? `${summary.correct} of ${lesson.problems.length} problems correct`
                      : "Not started"}
                  </p>
                </div>
                <Link className="button" href={`/lesson/${lesson.lessonId}`}>
                  {progress?.stage === "complete"
                    ? "Review results"
                    : progress
                      ? "Resume"
                      : "Start"}{" "}
                  →
                </Link>
              </article>
            );
          })}
        </div>
      </section>
      <section className="dashboard-section">
        <p className="eyebrow">REVIEW QUEUE</p>
        <h2>Ideas worth revisiting</h2>
        {reviews.length === 0 ? (
          <p className="muted">
            {profile.reviewReminders
              ? "No weak concepts need review yet. Keep practicing."
              : "Review suggestions are turned off in your settings."}
          </p>
        ) : (
          <ul className="review-list">
            {reviews.map((item) => (
              <li key={`${item.lessonId}-${item.conceptId}`}>
                <span>
                  <strong>{item.conceptId.replaceAll("-", " ")}</strong>
                  <small>
                    {item.lessonTitle} · {item.reason}
                  </small>
                </span>
                <Link
                  href={`/lesson/${item.lessonId}?review=${encodeURIComponent(item.conceptId)}`}
                  className="text-button"
                >
                  Practice →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="dashboard-section">
        <p className="eyebrow">CONCEPT MASTERY</p>
        <h2>A transparent measure</h2>
        <p className="muted">
          Correct work raises a concept by difficulty; incorrect work lowers it.
          Each attempt adds 0.12 × (difficulty ÷ 5) for correct work or
          subtracts it for incorrect work, less 0.03 × (hints ÷ 3). Work after a
          solution reveal earns no increase. Scores stay between 0 and 1; below
          60% suggests review.
        </p>
        <ul className="mastery-list">
          {mastery.map((record: MasteryRecord) => (
            <li key={record.conceptId}>
              <span>{record.conceptId.replaceAll("-", " ")}</span>
              <progress
                max={1}
                value={record.score}
                aria-label={`${record.conceptId} mastery`}
              />
              <strong>{Math.round(record.score * 100)}%</strong>
            </li>
          ))}
        </ul>
      </section>
      <section className="dashboard-section settings-section">
        <p className="eyebrow">PRIVACY & SETTINGS</p>
        <h2>Your choices</h2>
        <label>
          Display name (optional)
          <input
            value={profile.displayName}
            maxLength={60}
            onChange={(event) =>
              updateProfile({ ...profile, displayName: event.target.value })
            }
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={profile.reviewReminders}
            onChange={(event) =>
              updateProfile({
                ...profile,
                reviewReminders: event.target.checked,
              })
            }
          />
          Suggest review items on my dashboard
        </label>
        {saved && <p role="status">Settings saved.</p>}
        <p>
          <Link href="/privacy">Privacy and retention policy</Link>
        </p>
        <button className="text-button" onClick={() => void exportData()}>
          Download my learning data
        </button>
        {account && (
          <button
            className="danger-button"
            onClick={() => void accountCommand("delete-account")}
          >
            Delete account permanently
          </button>
        )}
        <button className="danger-button" onClick={deleteData}>
          Delete all learning data
        </button>
      </section>
    </main>
  );
}
