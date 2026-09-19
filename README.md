# CineMath

An interactive, proof-driven learning platform for advanced mathematics.

Phase 1 implemented one anonymous, end-to-end lesson: **Statements, Truth Values, and Quantifiers**. Phase 2 generalized the pipeline (a file-discovery content loader and CLI validator, a new fill-in-the-blank interaction, a small extensible counterexample-checker registry, problem-level analytics events, and a non-persistent preview mode) and authored three more Module 1 lessons, for **4 lessons and 20 problems total** across six interaction types: multiple choice, structured quantifier negation, fill-in-the-blank, numeric, keyboard-accessible proof ordering, and integer counterexamples. Math is rendered with KaTeX and MathML.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Guest practice needs no account. Account storage is initialized automatically in `data/cinemath.sqlite`. Set `CINEMATH_DB_PATH` to a persistent disk path for production; do not use an ephemeral serverless filesystem.

```sh
npm run check          # TypeScript, lint, unit tests, formatting, content validation
npm run validate:content  # Just the content validator, useful while authoring
npm run build           # Production build
npx playwright install chromium
npm run test:e2e        # Production server, desktop + 360px mobile, accessibility checks
npm run start           # Serve the production build
```

To preview a lesson exactly as a learner would see it, without touching saved progress, visit it with `?preview=1`, e.g. `/lesson/pfmm-m1-l2-compound-statements-and-connectives?preview=1`.

Run `npm run build` before the browser tests. If Chromium cannot be downloaded, set `PLAYWRIGHT_CHANNEL=chrome` to use an installed Chrome browser (PowerShell: `$env:PLAYWRIGHT_CHANNEL = "chrome"`). Playwright starts its own production server on port 3100. `npm run format` formats the implementation; original planning documents retain their existing formatting.

## What works

- Course page, lesson introduction, five sequential problems, reflection, and completion summary.
- Unlimited valid attempts, deterministic feedback, and all three progressive hints.
- A worked solution unlocks after two incorrect attempts or any correct submission. It counts once as a solution reveal, separately from hints. A correct answer or a revealed solution permits continuation.
- Attempts, drafts, hint use, solution reveals, and position survive reloads in the same browser. Each save includes the original content and problem versions. Storage failures are visible and do not block practice.
- Accuracy means correct on the first valid attempt. The summary also reports total attempts, hints, solutions, and a conservative concept snapshot. Answers copied after a solution reveal do not count toward the snapshot's correct total.

Guest progress is local to this browser and origin. Account progress syncs across signed-in devices. The dashboard provides profiles, review settings, concept mastery, targeted practice, JSON export, and data/account deletion. Answer keys are delivered to the browser for this low-stakes demo. The solution gate is a learning interaction, not an anti-cheating boundary.

## Structure

- `src/app`: Next.js App Router pages and responsive styling.
- `src/components`: accessible lesson, answer, hint, and math rendering UI.
- `src/lib`: shared Zod schemas, the content loader, deterministic grading, state transitions, progress validation, and analytics event derivation.
- `content`: seeded course/module metadata and four fully authored lessons, discovered automatically by the content loader.
- `scripts/validate-content.ts`: standalone CLI content validator, also run by `npm run check` and CI.
- `tests`, `e2e`: grading (including every problem type), persistence, math rendering, content-loader failure modes, full learner journeys, preview mode, and accessibility checks.
- [Architecture and deployment](docs/architecture.md): behavior, limitations, and deployment instructions.
- [Roadmap](ROADMAP.md): phases and exit criteria.
- [Product specification](docs/product-spec.md), [grading policy](docs/grading-policy.md), and [authoring guide](docs/content-authoring-guide.md): product and instructional constraints.

## Phase 3

Authentication, server-persisted progress, profiles, deterministic chronological mastery, resume, targeted review, and privacy controls are implemented. See [Phase 3 architecture and operations](docs/phase-3.md) for the exact mastery model, storage setup, concurrency behavior, and retention policy. Password recovery is not included; no email addresses are collected. Production hosting requires one Node instance with a persistent SQLite disk.

## Phase 4

A feature-flagged AI proof-feedback beta is implemented on one Lesson 4 problem: server-side-only model calls, structured-output validation with a retry and a deterministic fallback, per-identity usage limits, a low-confidence admin review queue, and cost-tracking via logged token usage. See [Phase 4: AI proof feedback beta](docs/phase-4.md) for the full flow. `CINEMATH_AI_FEEDBACK_ENABLED` and `ANTHROPIC_API_KEY` must both be set for it to activate; it is off by default and never blocks lesson completion when it's off or unavailable.

## Phase status

Phase 1 and Phase 2's build scope are both implemented, with automated checks covering them. Public deployment, the five-person unaided learner trial, and the Phase 4 beta-learner rollout remain release validation steps; they are not claimed as completed by local tests. See the release checklist in [architecture.md](docs/architecture.md).
