# Grading and AI-Feedback Policy

## Principle

Grade deterministically whenever the answer space allows it. Use AI only where deterministic validation is genuinely inadequate, and always label AI output as educational feedback, never as formal verification.

## Deterministic grading

Use deterministic grading for these problem types (from `ROADMAP.md` → Content system):

| Type | Grading approach |
|---|---|
| `multiple_choice` | Exact match against the correct option id(s). |
| `numeric` | Match within an explicit, author-specified tolerance (absolute or relative, stated in `answerSpec`). |
| `symbolic` | Structural/semantic equivalence check against the reference expression (e.g., normalized logical form), not string equality. |
| `proof_ordering` | Exact match of step order against the reference ordering; author may mark alternate valid orderings as also correct. |
| `proof_fill_blank` | Each blank matched deterministically (exact string set, symbolic equivalence, or small enumerated set of acceptable forms), defined per blank in `answerSpec`. |
| `counterexample_builder` | Programmatic property check: the learner's construction is evaluated against the stated predicate(s) it must violate/satisfy. |

Every deterministic problem's `answerSpec` must be sufficient, on its own, for a grader to accept or reject any learner input without human or AI judgment.

### Attempt and reveal rules (first vertical slice)

- A learner may submit an unlimited number of attempts per problem in the first vertical slice (no lockout); attempts are recorded for the completion summary and future mastery use.
- Hints 1–3 are available at any time.
- Hint 4 (worked solution) and the full gated solution unlock after **two incorrect attempts on that problem OR after any correct submission**, whichever comes first. This threshold is configuration, not a hard rule, and must be stated wherever it's implemented so it can be tuned later.
- Revealing the full solution does not block lesson completion; it is recorded in the completion summary's "solution reveal" count, consistent with the success metric in `ROADMAP.md` (full-solution reveal rate should stay low enough to show productive struggle).

## AI-assisted feedback (`proof_free_response`, Phase 4)

`proof_free_response` is **not** part of the first vertical slice's five problems (see `docs/course-map.md`); it was introduced in Phase 4 as a separately gated beta (`docs/phase-4.md`) on top of the validated slice, never inside it.

AI feedback must:

- Run **server-side only**; no provider API key or raw prompt ever reaches client code.
- Receive only what's needed to grade: the exact problem prompt, the reference solution, and the rubric — never unrelated learner data.
- Return **validated structured output** (a fixed schema: category, rationale, next-step suggestion, confidence), never freeform prose the UI trusts blindly.
- Classify into exactly one of: `correct`, `mostly_correct`, `needs_revision`, `insufficient`.
- Prefer a **diagnosis and a next step** over revealing a complete corrected proof.
- Never claim formal correctness, completeness, or verification — UI copy must present it as "educational feedback," and prompts must instruct the model to do the same.
- Log the grader/model version and confidence score for every graded attempt, for auditing.
- Degrade gracefully: a malformed or unavailable AI response must never block lesson completion; the learner sees a clear fallback state and can continue.

## Non-goals for grading in the MVP

- No partial credit computation beyond what a deterministic `answerSpec` explicitly defines (e.g., per-blank scoring in `proof_fill_blank`).
- No AI grading of any kind in the first vertical slice — all five Lesson 1 problems are deterministic by construction (see the lesson content file).
- No plagiarism or integrity detection; out of scope until accounts and stakes exist.
