# Architecture

**Current Phase 3 implementation:** see [accounts, persistence, mastery, and deployment](phase-3.md). **Phase 4 addition:** see [AI proof feedback beta](phase-4.md) for the feature-flagged `proof_free_response` grading flow, its API routes, and the admin review queue — it layers onto this architecture and doesn't change it. The descriptions below document the Phase 1/2 guest experience. Account mode adds an API and persistent SQLite storage and supersedes the former no-database deployment instructions.

## Application

CineMath is a single Next.js App Router application with strict TypeScript. Keeping one app is the smallest repository setup for one lesson; there are no empty workspace packages. Lightweight internal components use native form controls, semantic landmarks, visible keyboard focus, and locally bundled KaTeX fonts. CSS handles responsive layout without a runtime styling dependency. No external fonts or image service are needed.

`src/lib/content.ts` validates the catalog and authored JSON with Zod when imported. Pages are statically generated from the lesson registry; unknown lesson URLs return 404. There are no API routes or external providers in this phase. Any future API inputs must use Zod at their boundary.

The lesson player owns the browser interaction. Grading, reveal eligibility, progression, and statistics are pure functions in `src/lib`, shared with tests. Markdown does not allow raw HTML, and KaTeX runs with `trust: false` and MathML output.

## The authored interactions

The Phase 0 lesson already includes symbolic negation, proof ordering, and a counterexample. Phase 1 implements these specific interactions to preserve its five authored problems. It does not add a general symbolic engine or authoring pipeline.

- Multiple choice: exact option set, supporting one or several correct choices. Each option includes an authored `accessibleLabel` in spoken language because a math-only MathML label does not reliably provide a radio button name. This additive accessibility metadata does not change the question or accepted answers.
- Quantifier negation: a bounded structured normal form with two distinct variables over the real numbers, a sum, zero, and equality/inequality. The learner selects the two quantifiers and relation. The reference expression is parsed to a structure; grading compares that structure, never raw LaTeX strings. Unsupported reference forms fail when loading content.
- Proof ordering: a permutation of every step, with both authored valid orders accepted. Native up/down buttons work with keyboard and touch.
- Counterexample: the named `integer-square-not-greater` checker evaluates the stated predicate using `BigInt` after validating safe integer input. The added `checker` field makes execution explicit rather than interpreting English `checkerNotes`. The prompt, accepted answers, and solution have not changed, so its existing problem version is retained.
- Numeric: an explicit absolute or relative tolerance. Relative tolerance at a zero reference accepts only zero. This generic input is available without adding a sixth exercise.

To add a lesson using supported forms, author another JSON file under `content/`; `src/lib/content-loader.ts` discovers and validates it automatically, so no import needs registering and no UI or grading changes are required. Add course/module metadata to `content/catalog.json` as needed. New mathematical checker families or richer symbolic forms require explicit code and tests.

## Phase 2 additions

- **File-discovery content loader.** `src/lib/content-loader.ts` walks `content/`, validates the catalog and every lesson JSON file with Zod, and cross-checks lesson/course/module references. `src/lib/content.ts` (server-only) calls it with `content/` at the repository root; `scripts/validate-content.ts` calls it standalone for authors and CI (`npm run validate:content`, wired into `npm run check`). A `ContentValidationError` names the offending file and every Zod issue, so invalid content fails with a specific, actionable message rather than a generic parse error.
- **`proof_fill_blank`.** A new problem type: one or more labeled blanks, each with a list of accepted plain-text values matched case- and whitespace-insensitively. Rendered as labeled text inputs below the prompt, mirroring `proof_ordering`'s pattern of keeping structured input separate from the KaTeX-rendered prompt.
- **Generalized counterexample checker.** `checker` is now one of a small, explicit enum (`counterexampleCheckerIds` in `schema.ts`) backed by a registry of pure integer-predicate functions in `grading.ts`, instead of a single hardcoded literal. Adding a new counterexample predicate means adding one entry to both, plus a unit test — never arbitrary author-supplied code.
- **Problem-level analytics events.** `src/lib/analytics.ts` derives a typed `AnalyticsEvent` (`lesson_start`, `problem_view`, `answer_submit`, `hint_reveal`, `solution_reveal`, `lesson_complete`) from each state transition as a pure, unit-tested function, and `emitAnalyticsEvent` dispatches it as a `cinemath:analytics` DOM `CustomEvent` (plus a dev-mode console log) for a future analytics provider to subscribe to. There is no backend yet — this defines the event contract and proves it's derivable from state.
- **Preview mode.** Visiting a lesson at `?preview=1` runs the exact learner UI without reading or writing `localStorage` (detected client-side, so the route stays statically generated) and shows a "PREVIEW" indicator, so an author can test a new or edited lesson without touching real learner progress or needing to clear storage between runs.
- **Four fully authored Module 1 lessons, 20 problems total**, across six interaction types (`multiple_choice`, `symbolic`, `proof_ordering`, `counterexample_builder`, `numeric`, `proof_fill_blank`), satisfying the Phase 2 exit criterion of 20–30 authored problems and at least three production-ready interaction types.

## State and persistence

A versioned localStorage key contains the lesson id and every problem id/version. The stored envelope includes the complete authored content snapshot, drafts, timestamped attempts, hint count, solution reveal status, current problem, and screen. Each attempt records its submitted answer and support already used. Old keys are retained when versions change; an incompatible current-key save is not silently treated as valid.

Browser storage loads only after hydration. Every learner action saves synchronously; loading never overwrites an existing save. Malformed saves yield a fresh state and an explanatory message. Failed writes leave the in-memory lesson usable and display a warning. Simultaneous tabs use last-write-wins; account sync and conflict resolution are outside this demo.

The reducer enforces the reveal gate and progression even if a disabled control is invoked programmatically. Hints 1–3 are sequential and always available. Hint 4 and the full solution are the same reveal event, unlocked by the constant `INCORRECT_ATTEMPTS_TO_REVEAL = 2` or a correct submission. Empty/malformed inputs do not count as incorrect attempts. Correctly answered problems cannot accumulate duplicate submissions. Studying an unlocked solution permits continuing without claiming correctness.

This is an anonymous local demo, not a secure examination system: reference answers are bundled with the lesson. No learner data leaves the browser. LocalStorage availability, quota, browser-data deletion, and origin changes affect persistence.

## Completion and concept snapshot

- First-attempt accuracy: number of problems whose first valid submission was correct, over all lesson problems.
- Attempts: all valid submissions, including incorrect responses; invalid input is excluded.
- Hints: revealed hints 1–3, plus how many problems used them.
- Solutions: number of problems with the worked solution revealed, counted once.
- Concept snapshot: for each authored `master.conceptsUpdated` entry, show related problems correct before a solution reveal / related problems attempted. A concept is **Solid** only if every related problem has a correct attempt with no earlier hints or solution reveal; otherwise it is **Developing**. Retries are reflected separately in the attempt metrics. This is deliberately a lesson snapshot, not Phase 3's long-term mastery model.

## Verification

Unit tests cover every authored answer type, all quantifier combinations, alternative proof orders, numeric tolerances, malformed inputs, both counterexamples, reveal thresholds, progression, persistence recovery, version isolation, and summary semantics. A rendering test visits authored math and checks for KaTeX errors and MathML output. `tests/phase2.test.ts` adds `proof_fill_blank` grading (including case/whitespace-insensitive matching and rejection of incomplete or mismatched blanks), the two-entry counterexample checker registry, analytics event derivation for every action type, and content-loader failure modes against on-the-fly invalid-content fixtures.

Playwright runs the production build at desktop and 360px mobile widths. `e2e/lesson.spec.ts` completes Lesson 1's five problems with hints, a solution reveal, incorrect and invalid answers, saved drafts, reloads, and a return to the course, and exercises corrupt and blocked storage. `e2e/lesson2.spec.ts` completes Lesson 2's `proof_fill_blank` and `numeric` problems end to end and verifies preview mode neither persists nor requires the server to opt the route out of static generation. Axe checks the course, introduction, problems, and completion, alongside viewport overflow and browser error checks. CI installs Chromium, runs the checks/build, and executes browser tests.

## Deployment and release checklist

The app needs no secrets or database. Deploy the repository root as a Next.js application on Vercel, or use a Node host with `npm ci`, `npm run build`, and `npm run start -- --hostname 0.0.0.0`. See the official [Next.js deployment documentation](https://nextjs.org/docs/app/getting-started/deploying).

- [x] Implement the five-problem anonymous lesson.
- [ ] Record a publicly reachable demo URL after deploying to the chosen account.
- [ ] Have five real learners complete it without developer assistance.
- [ ] Record learner feedback, completion blockers, and mathematical review findings.

The repository has no configured hosting project or deployment credentials. Local browser tests cannot substitute for the five-person learner trial. These two external exit criteria remain open.
