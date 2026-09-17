# CineMath Product Specification

## Name

**CineMath** — an interactive, proof-driven learning platform for advanced mathematics.

## One-sentence value proposition

> CineMath teaches advanced mathematics by making you construct and prove ideas yourself, with rigorous, immediate feedback, instead of watching someone else do it.

## Initial promise

> Learn difficult mathematical ideas by working through them — not by merely watching someone else solve them.

## Target learner (single primary persona for MVP)

**Name (archetype):** Priya, the self-directed bridge learner.

- Has completed high-school calculus or an introductory university math sequence.
- Is comfortable with computation but has little or no experience writing formal proofs.
- Is motivated by a concrete goal: a CS/AI degree, a technical interview, a proof-based course, or personal intellectual growth.
- Studies independently, often outside a classroom, and wants structured practice rather than another video course.
- Gets stuck not on the concept itself but on turning an idea into a valid, well-structured argument.

CineMath's MVP is built for this one learner end to end. Secondary personas (see `docs/course-map.md` companion personas below) inform future phases but do not change MVP scope.

## Problem CineMath solves

Existing options fail this learner in one of two ways:

1. **Passive video courses** explain proofs but never require the learner to produce one, so the learner cannot tell whether they actually understand the reasoning.
2. **General-purpose AI chat tools** can answer questions but provide no structured sequence, no deterministic grading, and no guarantee of mathematical rigor — feedback quality varies and there is no notion of mastery over time.

CineMath sits between these: authored, sequenced, proof-focused problems with deterministic grading where possible, staged hints, gated solutions, and clearly-labeled AI feedback only where deterministic grading cannot apply.

## Product boundaries (MVP)

CineMath MVP is:

- A single authored course, one lesson deep for the first deployable slice.
- Web-only, anonymous (no accounts), free.
- Deterministic-first grading with a progressive hint ladder and gated solutions.

CineMath MVP is explicitly **not** (see `ROADMAP.md` → Explicit non-goals):

- Authentication, billing, or accounts.
- AI-generated published content.
- Free-form proof grading by AI.
- Native mobile apps, social features, leaderboards, or spaced repetition.
- A computer algebra system or formal theorem prover.

## End-to-end learner journey (first vertical slice)

1. **Landing.** Learner opens the deployed URL and sees the course page: course title, one-sentence description, and a single available lesson with its learning objective and estimated time.
2. **Lesson start.** Learner opens the lesson. They see the **Retrieve** and **Encounter** content (a short recap plus a concrete puzzle), then the **Explain** section with KaTeX-rendered theory scoped tightly to the objective.
3. **Practice.** Learner works through five problems in sequence. Each problem renders its prompt, accepts a typed response appropriate to its type (multiple choice, numeric, structured), and grades deterministically on submission.
4. **Hint use.** If stuck, the learner may reveal hints one at a time, from most abstract (restate the goal) to most concrete (worked solution after the configured threshold). Hint use is recorded per problem.
5. **Solution gating.** A full solution is available only after the configured attempt/hint threshold is met, or after a correct submission, per `docs/grading-policy.md`.
6. **Reflect.** After each problem (or at lesson end), a short explanation covers why the method works and a common error to avoid.
7. **Completion.** Learner reaches a completion screen summarizing accuracy, attempt count, and hint usage across the five problems, and sees a basic concept-mastery update for the lesson's tagged concepts.
8. **Resume/leave.** A learner who leaves mid-lesson and returns resumes where they left off (attempt persistence), even without an account.

This journey is the acceptance bar for Phase 1 and the description that Phase 0's "learner described end-to-end" exit criterion refers to.

## Success signal for the first vertical slice

The MVP is validated when a learner who has never proven anything formally can:

- Understand what is being asked without external explanation.
- Attempt all five problems.
- Use hints without feeling penalized or judged.
- Finish the lesson understanding *why* each answer was correct, not just *that* it was.
