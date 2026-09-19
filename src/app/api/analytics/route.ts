import { NextRequest, NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/request-origin";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { store, allowAnalytics } from "@/lib/account-store";

export const runtime = "nodejs";

function response(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Mirrors AnalyticsEvent in src/lib/analytics.ts. Kept as a separate,
// slightly looser schema here: this endpoint only needs enough shape to
// store an auditable event, not to re-derive it.
const eventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lesson_start"), lessonId: z.string() }),
  z.object({
    type: z.literal("problem_view"),
    lessonId: z.string(),
    problemId: z.string(),
    index: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("answer_submit"),
    lessonId: z.string(),
    problemId: z.string(),
    correct: z.boolean(),
    attemptNumber: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("hint_reveal"),
    lessonId: z.string(),
    problemId: z.string(),
    hintOrder: z.number().int().min(1).max(4),
  }),
  z.object({
    type: z.literal("solution_reveal"),
    lessonId: z.string(),
    problemId: z.string(),
  }),
  z.object({ type: z.literal("lesson_complete"), lessonId: z.string() }),
]);
const inputSchema = z.object({
  learnerId: z.string().min(1).max(100),
  event: eventSchema,
});
const purgeSchema = z.object({
  action: z.literal("purge"),
  learnerId: z.string().min(1).max(100),
});

// Beacon-style ingestion. There is no ambient authority to protect here
// (learnerId is a bearer-style random id, same trust model as guest
// localStorage progress), so the origin check below is defense-in-depth
// against noise, not an authorization boundary.
export async function POST(req: NextRequest) {
  if (!hasSameOrigin(req))
    return response({ error: "Invalid request origin." }, 403);
  if (Number(req.headers.get("content-length") || 0) > 5000)
    return response({ error: "Request too large." }, 413);
  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return response({ error: "Invalid request." }, 400);
  }
  const db = store();

  const purge = purgeSchema.safeParse(body);
  if (purge.success) {
    db.prepare("DELETE FROM analytics_events WHERE learner_id = ?").run(
      purge.data.learnerId,
    );
    db.prepare("DELETE FROM feedback_responses WHERE learner_id = ?").run(
      purge.data.learnerId,
    );
    return response({ ok: true });
  }

  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(body);
  } catch {
    return response({ error: "Invalid request." }, 400);
  }
  if (!allowAnalytics(db, input.learnerId))
    return response({ error: "Too many events." }, 429);

  const { type, lessonId, ...rest } = input.event;
  const problemId = "problemId" in rest ? rest.problemId : null;
  db.prepare(
    "INSERT INTO analytics_events (id, created_at, learner_id, lesson_id, problem_id, type, payload) VALUES (?,?,?,?,?,?,?)",
  ).run(
    randomUUID(),
    Date.now(),
    input.learnerId,
    lessonId,
    problemId,
    type,
    JSON.stringify(rest),
  );
  return response({ ok: true });
}
