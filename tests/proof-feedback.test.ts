import { afterAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { lessons } from "../src/lib/content";
import type { ProofFeedbackResult } from "../src/lib/proof-feedback-schema";

process.env.CINEMATH_DB_PATH = ":memory:";
process.env.CINEMATH_AI_FEEDBACK_ENABLED = "1";

// vi.mock factories are hoisted above imports, so referenced values must
// come from vi.hoisted rather than plain module-scope consts.
const { mockResult, gradeProofAttempt } = vi.hoisted(() => {
  const mockResult: ProofFeedbackResult = {
    category: "correct",
    rationale: "Uses the definition and computes correctly.",
    nextStep: "Nothing further needed.",
    confidence: 0.9,
    modelVersion: "test-model",
    fallback: false,
  };
  return {
    mockResult,
    gradeProofAttempt: vi.fn(async () => ({
      result: mockResult,
      usage: { inputTokens: 120, outputTokens: 40 },
    })),
  };
});
vi.mock("../src/lib/ai-feedback", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/lib/ai-feedback")>();
  return { ...actual, gradeProofAttempt };
});

const { POST } = await import("../src/app/api/proof-feedback/route");
const {
  GET: adminGet,
  POST: adminPost,
} = await import("../src/app/api/admin/ai-feedback/route");
const { store } = await import("../src/lib/account-store");

const origin = "http://localhost:3000";
const lesson = lessons.find(
  (l) => l.lessonId === "pfmm-m1-l4-reading-and-writing-formal-definitions",
)!;
const problem = lesson.problems.find(
  (p) => p.type === "proof_free_response",
)!;
if (problem.type !== "proof_free_response") throw new Error("fixture setup");
const validText =
  "Assume n is odd so n equals two k plus one for some integer k. Then n squared expands to four k squared plus four k plus one, which is two times an integer plus one, so n squared is odd by definition.";

function request(body: object, requestOrigin = origin) {
  return POST(
    new NextRequest(`${origin}/api/proof-feedback`, {
      method: "POST",
      headers: { origin: requestOrigin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}
function base() {
  return {
    accountId: null,
    lessonId: lesson.lessonId,
    problemId: problem.id,
    problemVersion: problem.version,
    text: validText,
  };
}
function adminRequest(handler: typeof adminGet, token?: string, body?: object) {
  return handler(
    new NextRequest(`${origin}/api/admin/ai-feedback`, {
      method: body ? "POST" : "GET",
      headers: {
        ...(token ? { "x-admin-token": token } : {}),
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
}

afterAll(() => store().close());

describe("POST /api/proof-feedback", () => {
  it("rejects cross-origin requests", async () => {
    expect((await request(base(), "https://other.test")).status).toBe(403);
  });
  it("rejects unknown or outdated problems", async () => {
    expect(
      (await request({ ...base(), problemId: "no-such-problem" })).status,
    ).toBe(404);
    expect(
      (await request({ ...base(), problemVersion: 999 })).status,
    ).toBe(404);
  });
  it("rejects a proof under the authored minimum word count", async () => {
    const result = await request({ ...base(), text: "too short" });
    expect(result.status).toBe(400);
  });
  it("grades a valid attempt, returns structured feedback, and logs it", async () => {
    const result = await request(base());
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body.feedback).toMatchObject({
      category: "correct",
      fallback: false,
    });
    const rows = store()
      .prepare("SELECT * FROM ai_feedback_log WHERE problem_id = ?")
      .all(problem.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      category: "correct",
      input_tokens: 120,
      output_tokens: 40,
      fallback: 0,
    });
  });
  it("enforces a daily usage cap per identity", async () => {
    const ip = "203.0.113.9";
    const withIp = (body: object) =>
      POST(
        new NextRequest(`${origin}/api/proof-feedback`, {
          method: "POST",
          headers: {
            origin,
            "Content-Type": "application/json",
            "x-forwarded-for": ip,
          },
          body: JSON.stringify(body),
        }),
      );
    let last = 200;
    for (let i = 0; i < 21; i++) last = (await withIp(base())).status;
    expect(last).toBe(429);
  });
  it("returns 503 when the feature flag is disabled", async () => {
    process.env.CINEMATH_AI_FEEDBACK_ENABLED = "0";
    try {
      expect((await request(base())).status).toBe(503);
    } finally {
      process.env.CINEMATH_AI_FEEDBACK_ENABLED = "1";
    }
  });
});

describe("admin AI feedback queue", () => {
  it("requires a configured admin token", async () => {
    expect((await adminRequest(adminGet)).status).toBe(401);
    process.env.CINEMATH_ADMIN_TOKEN = "secret-token";
    expect((await adminRequest(adminGet, "wrong")).status).toBe(401);
  });
  it("lists unreviewed low-confidence and fallback attempts, and marks review", async () => {
    process.env.CINEMATH_ADMIN_TOKEN = "secret-token";
    gradeProofAttempt.mockResolvedValueOnce({
      result: { ...mockResult, category: "needs_revision", confidence: 0.1 },
      usage: { inputTokens: 100, outputTokens: 30 },
    });
    await request(base());
    const listed = await adminRequest(adminGet, "secret-token");
    const body = await listed.json();
    expect(body.rows.length).toBeGreaterThan(0);
    const id = body.rows[0].id as string;
    const markResult = await adminPost(
      new NextRequest(`${origin}/api/admin/ai-feedback`, {
        method: "POST",
        headers: {
          "x-admin-token": "secret-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      }),
    );
    expect(markResult.status).toBe(200);
    const after = await (await adminRequest(adminGet, "secret-token")).json();
    expect(after.rows.some((r: { id: string }) => r.id === id)).toBe(false);
  });
});
