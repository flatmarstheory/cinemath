import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/account-store";
import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/proof-feedback-schema";

export const runtime = "nodejs";

function response(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// A separate operator-only bearer token, not a learner account role — this
// product has no admin accounts yet. Unset means the queue is unreachable.
function authorized(req: NextRequest) {
  const token = process.env.CINEMATH_ADMIN_TOKEN;
  return !!token && req.headers.get("x-admin-token") === token;
}

// Admin review queue for low-confidence feedback (docs/grading-policy.md /
// ROADMAP.md Phase 4). Lists AI-graded attempts worth a human look — never
// includes the learner's raw proof text, only the AI's own output and
// grading metadata.
export async function GET(req: NextRequest) {
  if (!authorized(req)) return response({ error: "Unauthorized." }, 401);
  const rows = store()
    .prepare(
      `SELECT id, created_at, lesson_id, problem_id, problem_version, category,
              confidence, model_version, fallback, input_tokens, output_tokens, reviewed
       FROM ai_feedback_log
       WHERE reviewed = 0 AND (confidence < ? OR fallback = 1)
       ORDER BY created_at DESC LIMIT 200`,
    )
    .all(LOW_CONFIDENCE_THRESHOLD);
  return response({ rows });
}

const reviewSchema = z.object({ id: z.string() });
export async function POST(req: NextRequest) {
  if (!authorized(req)) return response({ error: "Unauthorized." }, 401);
  let input: z.infer<typeof reviewSchema>;
  try {
    input = reviewSchema.parse(JSON.parse(await req.text()) as unknown);
  } catch {
    return response({ error: "Invalid request." }, 400);
  }
  const result = store()
    .prepare("UPDATE ai_feedback_log SET reviewed = 1 WHERE id = ?")
    .run(input.id);
  if (!result.changes) return response({ error: "Unknown entry." }, 404);
  return response({ ok: true });
}
