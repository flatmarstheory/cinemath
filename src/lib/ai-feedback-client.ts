import { proofFeedbackResultSchema } from "./proof-feedback-schema";

export async function requestProofFeedback(input: {
  accountId: string | null;
  lessonId: string;
  problemId: string;
  problemVersion: number;
  text: string;
}) {
  const response = await fetch("/api/proof-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Unable to get feedback right now.");
  return proofFeedbackResultSchema.parse(data.feedback);
}
