# Phase 1 architecture

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

To add a lesson using supported forms, author another JSON file and register its import in `src/lib/content.ts`; no UI or grading changes are required. Add course/module metadata to `content/catalog.json` as needed. New mathematical checker families or richer symbolic forms require explicit code and tests. A file-discovery authoring command is deferred to Phase 2.

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

Unit tests cover every authored answer type, all quantifier combinations, alternative proof orders, numeric tolerances, malformed inputs, both counterexamples, reveal thresholds, progression, persistence recovery, version isolation, and summary semantics. A rendering test visits authored math and checks for KaTeX errors and MathML output.

Playwright runs the production build at desktop and 360px mobile widths. It completes all five problems with hints, a solution reveal, incorrect and invalid answers, saved drafts, reloads, and a return to the course. It also exercises corrupt and blocked storage. Axe checks the course, introduction, problems, and completion, alongside viewport overflow and browser error checks. CI installs Chromium, runs the checks/build, and executes browser tests.

## Deployment and release checklist

The app needs no secrets or database. Deploy the repository root as a Next.js application on Vercel, or use a Node host with `npm ci`, `npm run build`, and `npm run start -- --hostname 0.0.0.0`. See the official [Next.js deployment documentation](https://nextjs.org/docs/app/getting-started/deploying).

- [x] Implement the five-problem anonymous lesson.
- [ ] Record a publicly reachable demo URL after deploying to the chosen account.
- [ ] Have five real learners complete it without developer assistance.
- [ ] Record learner feedback, completion blockers, and mathematical review findings.

The repository has no configured hosting project or deployment credentials. Local browser tests cannot substitute for the five-person learner trial. These two external exit criteria remain open.
