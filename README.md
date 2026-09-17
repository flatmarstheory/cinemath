# CineMath

An interactive, proof-driven learning platform for advanced mathematics.

Phase 1 implemented one anonymous, end-to-end lesson: **Statements, Truth Values, and Quantifiers**. Phase 2 generalized the pipeline (a file-discovery content loader and CLI validator, a new fill-in-the-blank interaction, a small extensible counterexample-checker registry, problem-level analytics events, and a non-persistent preview mode) and authored three more Module 1 lessons, for **4 lessons and 20 problems total** across six interaction types: multiple choice, structured quantifier negation, fill-in-the-blank, numeric, keyboard-accessible proof ordering, and integer counterexamples. Math is rendered with KaTeX and MathML.

## Run locally

Use Node.js 22.13+ (Node 24 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No environment variables, database, or accounts are required.

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

Progress is local to this browser and origin. Clearing browser data removes it; it does not sync across devices. Answer keys are delivered to the browser for this low-stakes demo. The solution gate is a learning interaction, not an anti-cheating boundary.

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

## Phase status

Phase 1 and Phase 2's build scope are both implemented, with automated checks covering them. Public deployment and the five-person unaided learner trial remain release validation steps; they are not claimed as completed by local tests. See the release checklist in [architecture.md](docs/architecture.md).
