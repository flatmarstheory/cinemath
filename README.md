# CineMath

An interactive, proof-driven learning platform for advanced mathematics.

Phase 1 implemented one anonymous, end-to-end lesson: **Statements, Truth Values, and Quantifiers**. Phase 2 generalized the pipeline (a file-discovery content loader and CLI validator, a new fill-in-the-blank interaction, a small extensible counterexample-checker registry, problem-level analytics events, and a non-persistent preview mode) and authored three more Module 1 lessons. Phases 3–5 added accounts and mastery, a feature-flagged AI proof-feedback beta, and closed-beta measurement infrastructure. Phase 6 completed the course: **all 8 modules, 28 lesson files, and 127 problems**, plus a glossary, content search, a prerequisite map, a completion certificate, a lightweight content-publishing workflow, and improved review scheduling — see [Phase 6](docs/phase-6.md). Math is rendered with KaTeX and MathML.

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

## Run with Docker Compose

With Docker Engine running and the Docker Compose v2 plugin installed, run from
the repository root:

```sh
docker compose up --build -d --wait
```

Open [localhost:3000](http://localhost:3000). This builds and runs the production
app on Node.js 24 as a non-root user. No host Node.js installation is required.
The first build needs internet access to download the base image and npm packages.
On Docker Desktop, use Linux containers.

SQLite accounts, progress, and analytics are stored in the `cinemath-data` named
volume at `/app/data/cinemath.sqlite`, and survive container rebuilds and
`docker compose down`. The host's existing `data/` directory is not imported.
Guest progress stays in the browser and is tied to the site origin.

Optionally copy `.env.example` to `.env` before starting. Set `CINEMATH_PORT=3001`
to use [localhost:3001](http://localhost:3001), or configure the optional AI and
admin settings. Compose passes these settings at runtime; `.env` files are
excluded from the image. The port is bound to `127.0.0.1` for local testing.

```sh
docker compose ps                    # Check container health
docker compose logs -f app           # Follow application logs
docker compose down                  # Stop, preserving the database
docker compose up --build -d --wait  # Rebuild after code or content changes
```

There is no source-code mount or hot reload in this production setup. To reset
all stored accounts and server data, `docker compose down --volumes` deletes the
database volume permanently. Run only one app instance against this SQLite volume.

## What works

**New course:** Linear Algebra Beyond Computation adds 6 modules, 13 lessons,
65 problems, and a 20-term glossary. Choose it from the course selector on the
home page, or open
[the linear algebra course](http://localhost:3000/?course=linear-algebra-beyond-computation#course).
See [the curriculum and implementation notes](docs/linear-algebra-course.md).
Login and registration now have separate modes, responsive styling, password
visibility controls, and guidance for creating an account.

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
- `content`: seeded course/module metadata, a course glossary, and all 28 authored lessons across 8 modules, discovered automatically by the content loader.
- `scripts/validate-content.ts`: standalone CLI content validator, also run by `npm run check` and CI.
- `tests`, `e2e`: grading (including every problem type), persistence, math rendering, content-loader failure modes, full learner journeys, preview mode, and accessibility checks.
- [Architecture and deployment](docs/architecture.md): behavior, limitations, and deployment instructions.
- [Roadmap](ROADMAP.md): phases and exit criteria.
- [Product specification](docs/product-spec.md), [grading policy](docs/grading-policy.md), and [authoring guide](docs/content-authoring-guide.md): product and instructional constraints.

## Phase 3

Authentication, server-persisted progress, profiles, deterministic chronological mastery, resume, targeted review, and privacy controls are implemented. See [Phase 3 architecture and operations](docs/phase-3.md) for the exact mastery model, storage setup, concurrency behavior, and retention policy. Password recovery is not included; no email addresses are collected. Production hosting requires one Node instance with a persistent SQLite disk.

## Phase 4

A feature-flagged AI proof-feedback beta is implemented on one Lesson 4 problem: server-side-only model calls, structured-output validation with a retry and a deterministic fallback, per-identity usage limits, a low-confidence admin review queue, and cost-tracking via logged token usage. See [Phase 4: AI proof feedback beta](docs/phase-4.md) for the full flow. `CINEMATH_AI_FEEDBACK_ENABLED` and `ANTHROPIC_API_KEY` must both be set for it to activate; it is off by default and never blocks lesson completion when it's off or unavailable.

## Phase 5

ROADMAP.md's Phase 5 ("Closed beta and learning validation") has no code deliverables of its own — recruiting learners, running interviews, and picking the next course from evidence are product activities. What's implemented is the measurement infrastructure that phase depends on: a durable, privacy-documented event log for the existing lesson/problem interaction events, an optional post-lesson feedback form, pure aggregation covering the roadmap's "Measure" list (completion funnel, drop-off, time per problem, retries, hint-use rate, solution-reveal rate, seven-day return rate, concept mastery progression), and an operator-only `/admin/metrics` dashboard. See [Phase 5](docs/phase-5.md). No beta has been run and no data is seeded; the dashboard starts empty.

## Phase 6

The course is now complete: all 8 modules from `docs/course-map.md`, each module 2-7 ending in a mixed-review checkpoint, module 8 a two-lesson capstone workshop that never names a proof technique in its prompts. New: a course glossary (`/glossary`, linked from the dashboard, lesson summaries, and search), a prerequisite map (`/course/prerequisites`), client-side content search (`/search`), a printable completion certificate (`/certificate`), a lightweight draft/published content-status workflow (`/admin/content`, token-gated like `/admin/metrics`), and a small deterministic review-scheduling improvement (concepts resurface after a mastery-scaled interval, not only when below the review threshold). See [Phase 6](docs/phase-6.md) for the full writeup, and [the accessibility](docs/accessibility-audit.md) and [performance](docs/performance-audit.md) audits it also ran.

**Note:** this environment had no Node.js/npm installed while Phase 6 was authored, so `npm run check` could not actually be run here — every new schema/content change was instead checked against a standalone script re-implementing the Zod rules. Run `npm run check` and `npm run test:e2e` yourself before deploying.

## Phase status

Phase 1 and Phase 2's build scope are both implemented, with automated checks covering them. Public deployment, the five-person unaided learner trial, the Phase 4 beta-learner rollout, and the Phase 5 closed beta itself remain release validation steps; they are not claimed as completed by local tests. See the release checklist in [architecture.md](docs/architecture.md).
