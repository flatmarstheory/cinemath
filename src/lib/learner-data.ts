export const PROFILE_KEY = "cinemath:profile:v1";
const STORAGE_PREFIX = "cinemath:";

export type LearnerProfile = {
  displayName: string;
  reviewReminders: boolean;
};

export const defaultProfile: LearnerProfile = {
  displayName: "",
  reviewReminders: true,
};

export function readProfile(): LearnerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).displayName !== "string" ||
      typeof (parsed as Record<string, unknown>).reviewReminders !== "boolean"
    )
      return defaultProfile;
    return parsed as LearnerProfile;
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(profile: LearnerProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function deleteLearnerData() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  const anonId = localStorage.getItem("cinemath:anon-id:v1");
  keys.forEach((key) => localStorage.removeItem(key));
  // Best-effort: purge this guest's server-side analytics/feedback rows too,
  // now that the local id that ties them together is gone.
  if (anonId) {
    import("./analytics-client")
      .then(({ purgeAnalytics }) => purgeAnalytics(anonId))
      .catch(() => {});
  }
}
