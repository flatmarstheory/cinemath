import type { LearnerProfile } from "./learner-data";
export type LearnerData = {
  account: { id: string; username: string } | null;
  profile?: LearnerProfile;
  progress?: { lesson_id: string; value: string; revision: number }[];
};
export async function learnerData(): Promise<LearnerData> {
  const response = await fetch("/api/learner", { cache: "no-store" });
  if (!response.ok)
    throw new Error("Account data is unavailable. Reload to try again.");
  return response.json();
}
export async function accountAction(body: object) {
  const response = await fetch("/api/learner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Unable to save your changes.");
  return data;
}
