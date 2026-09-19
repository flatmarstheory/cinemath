import { afterAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

process.env.CINEMATH_DB_PATH = ":memory:";
process.env.CINEMATH_ADMIN_TOKEN = "secret-token";

const { POST: analyticsPost } = await import(
  "../src/app/api/analytics/route"
);
const { POST: feedbackPost } = await import("../src/app/api/feedback/route");
const { GET: adminGet } = await import("../src/app/api/admin/metrics/route");
const { store } = await import("../src/lib/account-store");

const origin = "http://localhost:3000";

function post(
  handler: typeof analyticsPost,
  path: string,
  body: object,
  requestOrigin = origin,
) {
  return handler(
    new NextRequest(`${origin}${path}`, {
      method: "POST",
      headers: { origin: requestOrigin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}
function adminMetrics(token?: string) {
  return adminGet(
    new NextRequest(`${origin}/api/admin/metrics`, {
      headers: token ? { "x-admin-token": token } : {},
    }),
  );
}

afterAll(() => store().close());

describe("POST /api/analytics", () => {
  it("rejects cross-origin requests", async () => {
    const result = await post(
      analyticsPost,
      "/api/analytics",
      { learnerId: "l1", event: { type: "lesson_start", lessonId: "x" } },
      "https://other.test",
    );
    expect(result.status).toBe(403);
  });
  it("rejects an invalid event shape", async () => {
    const result = await post(analyticsPost, "/api/analytics", {
      learnerId: "l1",
      event: { type: "not_a_real_type" },
    });
    expect(result.status).toBe(400);
  });
  it("stores a valid event and it shows up in admin metrics", async () => {
    const result = await post(analyticsPost, "/api/analytics", {
      learnerId: "learner-1",
      event: { type: "lesson_start", lessonId: "lesson-x" },
    });
    expect(result.status).toBe(200);
    const metrics = await (await adminMetrics("secret-token")).json();
    expect(metrics.funnel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lessonId: "lesson-x", starts: 1 }),
      ]),
    );
  });
  it("enforces an hourly cap per learner", async () => {
    let last = 200;
    for (let i = 0; i < 601; i++)
      last = (
        await post(analyticsPost, "/api/analytics", {
          learnerId: "spammer",
          event: { type: "lesson_start", lessonId: "lesson-x" },
        })
      ).status;
    expect(last).toBe(429);
  });
  it("purges a learner's events on request", async () => {
    await post(analyticsPost, "/api/analytics", {
      learnerId: "to-delete",
      event: { type: "lesson_start", lessonId: "lesson-x" },
    });
    const purge = await post(analyticsPost, "/api/analytics", {
      action: "purge",
      learnerId: "to-delete",
    });
    expect(purge.status).toBe(200);
    const rows = store()
      .prepare("SELECT * FROM analytics_events WHERE learner_id = ?")
      .all("to-delete");
    expect(rows).toHaveLength(0);
  });
});

describe("POST /api/feedback", () => {
  const base = () => ({
    learnerId: "learner-1",
    lessonId: "lesson-x",
    clarity: "clear" as const,
    challenge: "just_right" as const,
    hintsHelped: "yes" as const,
    wouldReturnTomorrow: true,
    willingToContinuePaid: "maybe" as const,
  });
  it("rejects cross-origin requests", async () => {
    expect(
      (await post(feedbackPost, "/api/feedback", base(), "https://other.test"))
        .status,
    ).toBe(403);
  });
  it("stores valid feedback and it shows up in admin metrics", async () => {
    const result = await post(feedbackPost, "/api/feedback", base());
    expect(result.status).toBe(200);
    const metrics = await (await adminMetrics("secret-token")).json();
    expect(metrics.feedback[0]).toMatchObject({
      lessonId: "lesson-x",
      clarity: "clear",
      wouldReturn: true,
    });
  });
  it("rejects an invalid clarity value", async () => {
    const result = await post(feedbackPost, "/api/feedback", {
      ...base(),
      clarity: "amazing",
    });
    expect(result.status).toBe(400);
  });
  it("enforces a daily submission cap per learner", async () => {
    let last = 200;
    for (let i = 0; i < 11; i++)
      last = (
        await post(feedbackPost, "/api/feedback", {
          ...base(),
          learnerId: "frequent-flyer",
        })
      ).status;
    expect(last).toBe(429);
  });
});

describe("GET /api/admin/metrics", () => {
  it("requires a configured admin token", async () => {
    expect((await adminMetrics()).status).toBe(401);
    expect((await adminMetrics("wrong")).status).toBe(401);
  });
});
