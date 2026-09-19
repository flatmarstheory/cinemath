import type { AnalyticsEvent } from "./analytics";

const ANON_ID_KEY = "cinemath:anon-id:v1";

// A random per-browser id, used only when there's no signed-in account, so
// beta metrics (return rate, drop-off) can group a guest's own events
// without identifying them. Lives under the "cinemath:" prefix so
// deleteLearnerData() clears it along with everything else.
export function anonLearnerId(): string | null {
  try {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Fire-and-forget: a failed analytics beacon must never affect the lesson.
export function sendAnalyticsEvent(
  event: AnalyticsEvent | null,
  learnerId: string | null,
) {
  if (!event || !learnerId) return;
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId, event }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Analytics is best-effort only. */
  }
}

export function purgeAnalytics(learnerId: string | null) {
  if (!learnerId) return;
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "purge", learnerId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Best-effort; local data is already cleared regardless. */
  }
}
