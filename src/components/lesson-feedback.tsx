"use client";
import { useState, type FormEvent } from "react";
import { submitFeedback } from "@/lib/feedback-client";

// ROADMAP.md Phase 5: a short, entirely optional self-report shown after
// lesson completion. It never blocks or gates anything the learner does.
export function LessonFeedback({
  lessonId,
  learnerId,
}: {
  lessonId: string;
  learnerId: string | null;
}) {
  const [state, setState] = useState<"open" | "sending" | "sent" | "error">(
    "open",
  );
  if (!learnerId) return null;
  if (state === "sent")
    return (
      <section className="dashboard-section" aria-live="polite">
        <p>Thanks — this helps decide what to build next.</p>
      </section>
    );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("sending");
    const data = new FormData(event.currentTarget);
    try {
      await submitFeedback({
        learnerId,
        lessonId,
        clarity: data.get("clarity") as
          | "confusing"
          | "somewhat_clear"
          | "clear"
          | "very_clear",
        challenge: data.get("challenge") as
          | "too_easy"
          | "just_right"
          | "too_hard",
        hintsHelped: data.get("hintsHelped") as
          | "yes"
          | "gave_too_much_away"
          | "did_not_use",
        wouldReturnTomorrow: data.get("wouldReturnTomorrow") === "yes",
        willingToContinuePaid: data.get("willingToContinuePaid") as
          | "yes"
          | "maybe"
          | "no",
        mostEngaging: String(data.get("mostEngaging") || "") || undefined,
        mostConfusing: String(data.get("mostConfusing") || "") || undefined,
        nextTopic: String(data.get("nextTopic") || "") || undefined,
        comments: String(data.get("comments") || "") || undefined,
      });
      setState("sent");
    } catch {
      setState("error");
    }
  };
  return (
    <section className="dashboard-section" aria-labelledby="feedback-heading">
      <h2 id="feedback-heading">How was this lesson?</h2>
      <p className="muted">
        Optional, and it never affects your progress. Used only to improve
        CineMath during this closed beta.
      </p>
      <form onSubmit={(e) => void submit(e)}>
        <fieldset>
          <legend>How clear was this lesson?</legend>
          {(
            [
              ["confusing", "Confusing"],
              ["somewhat_clear", "Somewhat clear"],
              ["clear", "Clear"],
              ["very_clear", "Very clear"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="checkbox-label">
              <input type="radio" name="clarity" value={value} required />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>How was the difficulty?</legend>
          {(
            [
              ["too_easy", "Too easy"],
              ["just_right", "About right"],
              ["too_hard", "Too hard"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="checkbox-label">
              <input type="radio" name="challenge" value={value} required />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Did hints help you keep thinking?</legend>
          {(
            [
              ["yes", "Yes, they helped"],
              ["gave_too_much_away", "They gave too much away"],
              ["did_not_use", "I didn't use hints"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="checkbox-label">
              <input type="radio" name="hintsHelped" value={value} required />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Would you come back tomorrow?</legend>
          {(
            [
              ["yes", "Yes"],
              ["no", "Not likely"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="checkbox-label">
              <input
                type="radio"
                name="wouldReturnTomorrow"
                value={value}
                required
              />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Would you pay for future courses like this?</legend>
          {(
            [
              ["yes", "Yes"],
              ["maybe", "Maybe"],
              ["no", "No"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="checkbox-label">
              <input
                type="radio"
                name="willingToContinuePaid"
                value={value}
                required
              />
              {label}
            </label>
          ))}
        </fieldset>
        <label>
          Where did you feel most engaged? (optional)
          <input name="mostEngaging" maxLength={1000} />
        </label>
        <label>
          Where did it get confusing or frustrating? (optional)
          <input name="mostConfusing" maxLength={1000} />
        </label>
        <label>
          Which advanced topic would you want next? (optional)
          <input name="nextTopic" maxLength={300} />
        </label>
        <label>
          Anything else? (optional)
          <textarea name="comments" maxLength={2000} rows={3} />
        </label>
        <button className="button" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send feedback"}
        </button>
        {state === "error" && (
          <p role="alert">Couldn&apos;t send feedback. You can try again.</p>
        )}
      </form>
    </section>
  );
}
