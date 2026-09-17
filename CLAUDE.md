# CineMath — Engineering and Pedagogical Constraints

CineMath is a proof-driven learning platform for advanced mathematics. Full product and phase detail lives in `ROADMAP.md`; this file is the concise, always-loaded constraint set.

## Read before doing non-trivial work

- `ROADMAP.md` — phases, milestones, exit criteria.
- `docs/product-spec.md` — target learner, value proposition, end-to-end journey.
- `docs/pedagogical-principles.md` — lesson loop, hint policy.
- `docs/grading-policy.md` — deterministic grading rules, AI-feedback rules.
- `docs/content-authoring-guide.md` and `docs/lesson-template.md` — before authoring or editing any lesson/problem content.

## Non-negotiable engineering constraints

- TypeScript strict mode. Never introduce `any`.
- Validate every API input with Zod.
- Keep math content (problems, solutions, hints) as data, separate from UI code — see `docs/content-authoring-guide.md` for the JSON/MDX format.
- Version problems and solutions; never silently mutate published content in a way that could invalidate an existing learner attempt's context.
- API keys and any AI-provider calls stay server-side only. Never let a provider key or raw prompt reach client code.
- Every learner-facing mathematical string must render through KaTeX.
- Treat keyboard navigation and accessibility as acceptance criteria, not a follow-up pass.
- Prefer simple, testable components over abstraction-heavy frameworks, especially before Phase 2's authoring pipeline exists.

## Non-negotiable pedagogical constraints

- Deterministic grading first. Only use AI-assisted grading (`proof_free_response`) where deterministic validation is genuinely inadequate.
- AI feedback is never labeled as formal verification or proof-checking. It is always presented as educational feedback, grounded in a stated rubric.
- Every problem above trivial difficulty has a 4-step progressive hint ladder (restate goal → point to concept → key observation → worked solution), gated per `docs/grading-policy.md`. Hints never use shaming language.
- A lesson targets one explicit learning objective and 10–25 minutes.
- Mathematical correctness is never traded for engagement. When in doubt, a second read-through against the content quality checklist in `docs/content-authoring-guide.md` is required before publishing.

## Scope discipline

- The current phase is defined in `ROADMAP.md` under **Milestones**. Do not build ahead of the active phase's deliverables (e.g., no accounts/auth/billing/AI grading until their respective phases).
- The first vertical slice is exactly one lesson, five problems, no accounts. Don't add a second lesson, a second course, or generalized authoring tooling before that slice is complete and validated.
- If a request conflicts with an explicit non-goal in `ROADMAP.md` (e.g., social features, native apps, a computer algebra system), say so and confirm before proceeding.
