import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/account-store";
import { lessons } from "@/lib/content";
import { decodeProgress } from "@/lib/progress";
import { masteryForCourse } from "@/lib/mastery";
import {
  completionFunnel,
  dropOffByProblemIndex,
  hintUseRateByLevel,
  medianTimePerProblemMs,
  retryCountByProblem,
  sevenDayReturnRate,
  solutionRevealRate,
  type StoredEvent,
} from "@/lib/metrics";

export const runtime = "nodejs";

function response(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Same operator-only bearer token as /api/admin/ai-feedback (docs/phase-4.md).
function authorized(req: NextRequest) {
  const token = process.env.CINEMATH_ADMIN_TOKEN;
  return !!token && req.headers.get("x-admin-token") === token;
}

// Closed-beta metrics dashboard data (ROADMAP.md Phase 5 "Measure" list).
// Loads the whole beta's events; fine at closed-beta scale, revisit if it
// ever needs a date range.
export async function GET(req: NextRequest) {
  if (!authorized(req)) return response({ error: "Unauthorized." }, 401);
  const db = store();
  const rows = db
    .prepare(
      "SELECT created_at, learner_id, lesson_id, problem_id, type, payload FROM analytics_events ORDER BY created_at ASC",
    )
    .all();
  const events: StoredEvent[] = rows.map((row) => ({
    createdAt: Number(row.created_at),
    learnerId: String(row.learner_id),
    lessonId: String(row.lesson_id),
    problemId: row.problem_id === null ? null : String(row.problem_id),
    type: String(row.type) as StoredEvent["type"],
    payload: JSON.parse(String(row.payload)),
  }));

  const feedback = db
    .prepare(
      `SELECT created_at, lesson_id, clarity, challenge, hints_helped, would_return,
              willing_to_continue, most_engaging, most_confusing, next_topic, comments
       FROM feedback_responses ORDER BY created_at DESC LIMIT 500`,
    )
    .all();

  const progressRows = db
    .prepare("SELECT user_id, lesson_id, value FROM progress")
    .all();
  const progressByUser = new Map<
    string,
    Map<string, ReturnType<typeof decodeProgress>>
  >();
  for (const row of progressRows) {
    const lesson = lessons.find((l) => l.lessonId === row.lesson_id);
    if (!lesson) continue;
    try {
      const decoded = decodeProgress(lesson, String(row.value));
      const userId = String(row.user_id);
      const byLesson =
        progressByUser.get(userId) ??
        new Map<string, ReturnType<typeof decodeProgress>>();
      byLesson.set(lesson.lessonId, decoded);
      progressByUser.set(userId, byLesson);
    } catch {
      /* Skip saves from an older content version. */
    }
  }
  const masteryByConcept = new Map<
    string,
    { total: number; count: number }
  >();
  for (const byLesson of progressByUser.values())
    for (const record of masteryForCourse(lessons, byLesson)) {
      const entry = masteryByConcept.get(record.conceptId) ?? {
        total: 0,
        count: 0,
      };
      entry.total += record.score;
      entry.count += 1;
      masteryByConcept.set(record.conceptId, entry);
    }
  const conceptMastery = [...masteryByConcept.entries()]
    .map(([conceptId, { total, count }]) => ({
      conceptId,
      averageScore: total / count,
      learners: count,
    }))
    .sort((a, b) => a.conceptId.localeCompare(b.conceptId));

  return response({
    generatedAt: Date.now(),
    learners: new Set(events.map((e) => e.learnerId)).size,
    funnel: completionFunnel(events),
    dropOff: dropOffByProblemIndex(events),
    medianTimePerProblemMs: medianTimePerProblemMs(events),
    retryByProblem: retryCountByProblem(events),
    hintUseByLevel: hintUseRateByLevel(events),
    solutionRevealRate: solutionRevealRate(events),
    sevenDayReturnRate: sevenDayReturnRate(events),
    conceptMastery,
    feedback: feedback.map((row) => ({
      createdAt: Number(row.created_at),
      lessonId: String(row.lesson_id),
      clarity: String(row.clarity),
      challenge: String(row.challenge),
      hintsHelped: String(row.hints_helped),
      wouldReturn: Boolean(row.would_return),
      willingToContinue: String(row.willing_to_continue),
      mostEngaging: row.most_engaging ? String(row.most_engaging) : null,
      mostConfusing: row.most_confusing ? String(row.most_confusing) : null,
      nextTopic: row.next_topic ? String(row.next_topic) : null,
      comments: row.comments ? String(row.comments) : null,
    })),
  });
}
