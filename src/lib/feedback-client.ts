import type { FeedbackInput } from "./feedback-schema";

export async function submitFeedback(input: FeedbackInput) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Unable to submit feedback right now.");
}
