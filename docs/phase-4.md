# Phase 4: AI proof feedback beta

## What this is

A single new problem type, `proof_free_response`, adds AI-assisted feedback on short free-response proofs on top of the existing deterministic engine — it never replaces deterministic grading for any existing problem (`docs/grading-policy.md`). It ships as one beta problem in Lesson 4 (`pfmm-m1-l4-p6-free-response-odd-square`), behind a feature flag, so the validated first vertical slice and Lessons 1–3 are untouched.

## Feature flag and configuration

- `CINEMATH_AI_FEEDBACK_ENABLED=1` — required server-side or `/api/proof-feedback` returns 503 and the problem cannot be graded. Unset by default.
- `ANTHROPIC_API_KEY` — required to call the model; read only in `src/lib/ai-feedback.ts`, a server-only module never imported by client code. If it's missing, requests fail closed into the fallback feedback path below rather than throwing to the learner.
- `CINEMATH_ADMIN_TOKEN` — bearer token for `/api/admin/ai-feedback`. Unset means the admin queue is unreachable (401 for every request).

No API key, prompt, or rubric-authoring detail ever reaches client code; the client only calls `/api/proof-feedback` and receives back the validated `{category, rationale, nextStep, confidence, modelVersion, fallback}` result (`src/lib/proof-feedback-schema.ts`).

## Grading flow

1. The learner writes a proof in a plain `<textarea>` (`AnswerInput`, `proof_free_response` case) and requests feedback once a minimum word count is met (authored per problem in `answerSpec.minWords`).
2. `POST /api/proof-feedback` re-loads the problem from server-side content (never trusts a client-supplied rubric or reference solution), checks the feature flag, checks a per-account-or-IP daily usage cap (`allowAiFeedback`, `src/lib/account-store.ts`), then calls `gradeProofAttempt` (`src/lib/ai-feedback.ts`).
3. The prompt sent to the model is built from exactly the problem's prompt, its authored rubric, and its reference solution — nothing about the learner's identity or history (`buildProofFeedbackPrompt`). The system prompt explicitly forbids claiming formal verification and forbids inventing rubric requirements.
4. The model is called with forced structured tool output (Anthropic Messages API, `tool_choice`), so the response is a typed object, not prose the UI has to trust. Output is re-validated against a Zod schema; a malformed response is retried once.
5. If the model is unavailable, misconfigured, or still malformed after retrying, `gradeProofAttempt` returns a deterministic fallback result (`category: "insufficient"`, `confidence: 0`, `fallback: true`) instead of throwing — a failed AI request never blocks lesson completion.
6. Every graded attempt (real or fallback) is logged to `ai_feedback_log` in SQLite with category, confidence, model version, token usage, and problem/lesson identifiers — but never the learner's raw proof text, for auditing and cost tracking without extra retention of learner writing.
7. The client records the result as a normal attempt (`Action: "submit_proof"`, handled in `src/lib/progress.ts`), reusing the existing deterministic-problem UI: `correct` is `true` only for `category === "correct"`, so mastery, the completion summary, and the existing two-strikes-then-reveal-solution mechanism (`INCORRECT_ATTEMPTS_TO_REVEAL`) all work unmodified. A learner can revise and resubmit; after the threshold, the worked solution unlocks like any other problem.

## What the UI shows

Every AI-graded attempt renders a category pill, the rationale, a suggested next step, and a fixed line: "Educational feedback grounded in this problem's rubric — not formal proof verification." A fallback attempt additionally says feedback was unavailable and that the learner can keep going regardless.

## Admin review queue

`GET /api/admin/ai-feedback` (with header `x-admin-token: <CINEMATH_ADMIN_TOKEN>`) lists unreviewed attempts with `confidence < 0.5` or `fallback = 1`, most recent first — the set worth a human looking at. `POST /api/admin/ai-feedback` with `{id}` marks one reviewed. There's no admin UI page yet; this is a deliberately small, curl-able queue, consistent with "prefer simple, testable components" until there's a second admin need to justify a page.

## Cost monitoring

`ai_feedback_log` stores `input_tokens`/`output_tokens` per graded attempt, so cost-per-active-learner (an explicit Phase 4 exit criterion) is a query away once beta usage exists — no separate metrics pipeline was built for this.

## What's deliberately out of scope here

- No proof-writing UI richness (LaTeX preview, autosave-while-typing beyond the existing draft mechanism, etc.) — the textarea is plain, matching "prefer simple, testable components" for a beta.
- No second AI-graded problem or lesson; one beta problem is enough to validate the mechanism per the Phase 4 exit criteria before authoring more.
- `ReviewPractice` (targeted concept review) skips `proof_free_response` problems — that flow is synchronous and deterministic by design; AI-graded review practice is a future decision, not an oversight.

## Verification

Unit tests cover prompt construction, structured-output validation, the malformed-then-retry-then-fallback path, and fallback output shape (`tests/ai-feedback.test.ts`). API route tests cover the feature flag, content/version mismatches, the usage cap, a successful graded response, and the admin queue's token gate and low-confidence filter (`tests/proof-feedback.test.ts`). `tests/engine.test.ts` and `tests/phase2.test.ts` are unchanged and still pass, confirming Lessons 1–3 and the rest of Lesson 4 are unaffected.
