# Pedagogical Principles

This document expands the ten principles and the lesson loop from `ROADMAP.md` into working guidance for anyone authoring or building CineMath lessons.

## The ten principles, applied

1. **Mathematical correctness first.** Every solution and hint is checked against a reference proof before publishing. When correctness and engagement conflict, correctness wins — see the content quality checklist in `docs/content-authoring-guide.md`.
2. **Active work over passive watching.** No lesson section is purely expository for more than a couple of paragraphs before asking the learner to do something (predict, construct, derive, prove, revise).
3. **Small learning units.** A lesson targets a single objective and 10–25 minutes. If a topic needs more, split it into multiple lessons rather than lengthening one.
4. **Hints before solutions.** The hint ladder (below) is mandatory for every problem above trivial difficulty.
5. **Deterministic grading where possible.** Only use AI-graded free response when no deterministic answer specification can capture correctness (see `docs/grading-policy.md`).
6. **AI feedback is not formal verification.** UI copy and prompts must never claim certainty AI feedback cannot back up.
7. **Content is the moat.** Prioritize authoring time over building generalized tooling in the first vertical slice.
8. **Ship vertical slices.** Phase 1 ships one complete lesson end to end before any second lesson is built.
9. **Accessible by default.** Every wireframe and component decision considers keyboard-only use and screen readers from the start, not as a retrofit.
10. **Measure learning, not vanity.** Instrument completion, retries, hint use, and mastery — not page views or time-on-site alone.

## Lesson loop (Retrieve → Encounter → Explain → Practice → Hint → Reflect → Master)

| Stage | Purpose | Authoring guidance |
|---|---|---|
| **Retrieve** | Activate one or two prerequisite concepts. | 1–2 sentences or a single quick question. Skip entirely for the course's first lesson, which has no prerequisites. |
| **Encounter** | Hook the learner with a concrete puzzle, example, or failure case before naming the theory. | Should be answerable-in-your-head or provoke a "wait, is that true?" reaction. Never opens with a formal definition. |
| **Explain** | Present only the theory needed for this lesson's objective. | KaTeX for all math. No tangents into future-lesson material. |
| **Practice** | The five authored problems. | See `docs/content-authoring-guide.md` for problem-type selection and the answer-specification format. |
| **Hint** | Staged, optional help. | See hint policy below. |
| **Reflect** | Explain why the method worked and name a common error. | Tie back explicitly to the misconception tags on the problem(s) just attempted. |
| **Master** | Update concept-level mastery. | MVP uses a basic update (see `ROADMAP.md` → Phase 3 for the full model); the first vertical slice only needs a visible, honest summary, not the tuned algorithm. |

## Hint policy

Every problem above trivial difficulty has up to four hints, in order:

1. **Restate the goal** in more precise mathematical language — no new information, just clarity.
2. **Point to** a relevant definition, theorem, construction, or strategy — names the tool, not the move.
3. **Supply an important intermediate observation** — the key insight, without carrying it to the answer.
4. **Reveal a worked solution**, available only after the configured threshold (see `docs/grading-policy.md` for the exact reveal rule).

Requirements:

- Hints are strictly progressive — hint *n+1* must add real information beyond hint *n*, never repeat it in different words.
- The UI must show the learner what using a hint costs (e.g., effect on the completion summary) without shaming language. Never use words like "cheating," "giving up," or similar in hint copy.
- Hint use is always optional and always logged per problem for the completion summary and future mastery calculations.

## Definition of a well-formed lesson

A lesson is ready to publish only when every item in the content quality checklist (`ROADMAP.md` → Content quality checklist, restated in `docs/content-authoring-guide.md`) is satisfied, and a reviewer other than the original author has worked through the lesson as a learner would.
