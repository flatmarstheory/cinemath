import { NextRequest, NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/request-origin";
import { randomUUID } from "node:crypto";
import { store, allowFeedback } from "@/lib/account-store";
import { feedbackSchema } from "@/lib/feedback-schema";

export const runtime = "nodejs";

function response(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Closed-beta feedback capture (ROADMAP.md Phase 5). Anyone can submit —
// guests included — same trust model as the analytics beacon.
export async function POST(req: NextRequest) {
  if (!hasSameOrigin(req))
    return response({ error: "Invalid request origin." }, 403);
  if (Number(req.headers.get("content-length") || 0) > 20000)
    return response({ error: "Request too large." }, 413);
  let input;
  try {
    input = feedbackSchema.parse(JSON.parse(await req.text()));
  } catch {
    return response({ error: "Invalid request." }, 400);
  }
  const db = store();
  if (!allowFeedback(db, input.learnerId))
    return response({ error: "Too many submissions today." }, 429);
  db.prepare(
    `INSERT INTO feedback_responses
      (id, created_at, learner_id, lesson_id, clarity, challenge, hints_helped, would_return, willing_to_continue, most_engaging, most_confusing, next_topic, comments)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    randomUUID(),
    Date.now(),
    input.learnerId,
    input.lessonId,
    input.clarity,
    input.challenge,
    input.hintsHelped,
    input.wouldReturnTomorrow ? 1 : 0,
    input.willingToContinuePaid,
    input.mostEngaging ?? null,
    input.mostConfusing ?? null,
    input.nextTopic ?? null,
    input.comments ?? null,
  );
  return response({ ok: true });
}
