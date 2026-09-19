import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { store, hashToken, allowAiFeedback } from "@/lib/account-store";
import { lessons } from "@/lib/content";
import { proofWordCount } from "@/lib/grading";
import {
  gradeProofAttempt,
  proofFeedbackEnabled,
} from "@/lib/ai-feedback";

export const runtime = "nodejs";
const cookie = "cinemath_session";

const inputSchema = z.object({
  accountId: z.string().nullable().optional(),
  lessonId: z.string(),
  problemId: z.string(),
  problemVersion: z.number().int().positive(),
  text: z.string().min(1).max(20000),
});

function response(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Best-effort attribution only (used for the rate limit key and the audit
// log), not an authorization check — proof feedback works for guests too.
function sessionAccountId(req: NextRequest) {
  const account = store()
    .prepare(
      "SELECT users.id FROM users JOIN sessions ON users.id=sessions.user_id WHERE token=? AND expires>?",
    )
    .get(hashToken(req.cookies.get(cookie)?.value || ""), Date.now());
  return account ? String(account.id) : null;
}

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin)
    return response({ error: "Invalid request origin." }, 403);
  if (Number(req.headers.get("content-length") || 0) > 100000)
    return response({ error: "Request too large." }, 413);
  if (!proofFeedbackEnabled())
    return response({ error: "AI feedback is not enabled." }, 503);

  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(JSON.parse(await req.text()) as unknown);
  } catch {
    return response({ error: "Invalid request." }, 400);
  }

  const lesson = lessons.find((l) => l.lessonId === input.lessonId);
  const problem = lesson?.problems.find((p) => p.id === input.problemId);
  if (
    !lesson ||
    !problem ||
    problem.type !== "proof_free_response" ||
    problem.version !== input.problemVersion
  )
    return response({ error: "Unknown or outdated problem." }, 404);
  if (proofWordCount(input.text) < problem.answerSpec.minWords)
    return response(
      { error: `Write at least ${problem.answerSpec.minWords} words.` },
      400,
    );

  const accountId = sessionAccountId(req);
  const limitKey =
    accountId ||
    `ip:${req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"}`;
  if (!allowAiFeedback(store(), limitKey))
    return response(
      { error: "You've reached today's AI feedback limit. Try again tomorrow." },
      429,
    );

  const { result, usage } = await gradeProofAttempt(problem, input.text);

  store()
    .prepare(
      "INSERT INTO ai_feedback_log (id, created_at, lesson_id, problem_id, problem_version, account_id, category, confidence, model_version, fallback, input_tokens, output_tokens) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    )
    .run(
      randomUUID(),
      Date.now(),
      lesson.lessonId,
      problem.id,
      problem.version,
      accountId,
      result.category,
      result.confidence,
      result.modelVersion,
      result.fallback ? 1 : 0,
      usage?.inputTokens ?? null,
      usage?.outputTokens ?? null,
    );

  return response({ feedback: result });
}
