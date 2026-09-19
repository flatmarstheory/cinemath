# Phase 5: Closed beta and learning validation

## What this is

Unlike Phases 1-4, ROADMAP.md's Phase 5 has no **Build** section — its actual deliverables are recruiting real beta learners, running interviews, and choosing the next course from evidence. Those are product and research activities, not code. This phase therefore only builds the measurement infrastructure the rest of Phase 5 depends on: a durable event log, an aggregation library, an operator dashboard, and an optional in-app feedback form. It does not simulate a beta, fabricate learners, or invent results — the "Recruit," "Interview questions," and "Exit criteria" sections of ROADMAP.md Phase 5 remain the team's job to actually run.

## What was built

### Event log

`analytics_events` (SQLite, `src/lib/account-store.ts`) durably stores the same `AnalyticsEvent` shapes Phase 2 already derives in `src/lib/analytics.ts` (`lesson_start`, `problem_view`, `answer_submit`, `hint_reveal`, `solution_reveal`, `lesson_complete`). Previously `emitAnalyticsEvent` only logged to the console and dispatched a DOM event for a future subscriber; `src/lib/analytics-client.ts` now also POSTs each event to `/api/analytics` (`src/app/api/analytics/route.ts`), fire-and-forget, so a failed beacon never affects the lesson. Events are keyed by `learnerId`: the signed-in account id, or a random id generated once per browser and stored under `cinemath:anon-id:v1` (same `cinemath:` prefix `deleteLearnerData()` already clears, so guest analytics reset with everything else).

### Feedback

`feedback_responses` stores an optional short self-report shown once a lesson is completed (`src/components/lesson-feedback.tsx`, `POST /api/feedback`). Its fields map directly to ROADMAP.md Phase 5's "Measure" list (self-reported clarity and challenge, willingness to continue or pay) and its "Interview questions" (most engaging moment, most confusing moment, next topic of interest) as a lightweight structured proxy — it is explicitly not a substitute for the qualitative learner interviews ROADMAP.md calls for.

### Aggregation

`src/lib/metrics.ts` is a pure, DB-free module (unit-tested in `tests/metrics.test.ts`) computing the quantitative half of the "Measure" list from a list of stored events: per-lesson completion funnel, drop-off by problem index, median time per problem, retries by problem, hint-use rate by level, solution-reveal rate, and seven-day return rate. Concept mastery progression reuses the existing `masteryForCourse` (`src/lib/mastery.ts`) averaged across every account's stored progress.

### Operator dashboard

`GET /api/admin/metrics` (bearer `x-admin-token`, same gate as `/api/admin/ai-feedback`) returns all of the above plus raw feedback rows. `src/app/admin/metrics/page.tsx` is a small client page that takes the token (kept in `sessionStorage`, never the URL) and renders it. Unlike the deliberately page-less `/api/admin/ai-feedback` queue (docs/phase-4.md), this one earns a page: several numbers need to be read together to judge beta health, which is the "second admin need" that doc named as the bar for adding one.

## Privacy

`docs/privacy` (the `/privacy` page) documents the new event and feedback storage: no raw answer text is ever recorded, submitting feedback is always optional, and deleting account data or guest browser data removes the corresponding `analytics_events`/`feedback_responses` rows (`/api/learner`'s `delete-data`/`delete-account` actions; `purgeAnalytics` for guests).

## Verification

`tests/metrics.test.ts` covers the aggregation functions against fixture event arrays. `tests/analytics-api.test.ts` covers the analytics and feedback routes' origin check, schema validation, rate limits, the purge action, and the admin token gate, plus an end-to-end check that a stored event/feedback row surfaces through `/api/admin/metrics`.

## What's deliberately out of scope here

- Recruiting learners, scheduling and conducting interviews, and deciding the second course from evidence — ROADMAP.md Phase 5's actual deliverables, and not code.
- Any synthetic or seeded "beta" data — the dashboard starts empty and only reflects a real closed beta once one runs.
