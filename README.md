# CineMath

An interactive, proof-driven learning platform for advanced mathematics.

Phase 1 implements one anonymous, end-to-end lesson: **Statements, Truth Values, and Quantifiers**. The five authored exercises include multiple choice, structured quantifier negation, keyboard-accessible proof ordering, and an integer counterexample. Math is rendered with KaTeX and MathML.

## Run locally

Use Node.js 22.13+ (Node 24 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No environment variables, database, or accounts are required.

```sh
npm run check        # TypeScript, lint, unit tests, formatting
npm run build        # Production build
npx playwright install chromium
npm run test:e2e     # Production server, desktop + 360px mobile, accessibility checks
npm run start       # Serve the production build
```

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
- `src/lib`: shared Zod schemas, deterministic grading, state transitions, and progress validation.
- `content`: seeded course/module metadata and the original authored lesson.
- `tests`, `e2e`: grading, persistence, math rendering, full learner journey, and accessibility checks.
- [Architecture and deployment](docs/architecture.md): behavior, limitations, and deployment instructions.
- [Roadmap](ROADMAP.md): phases and exit criteria.
- [Product specification](docs/product-spec.md), [grading policy](docs/grading-policy.md), and [authoring guide](docs/content-authoring-guide.md): product and instructional constraints.

## Phase 1 status

The implementation and automated checks cover the Phase 1 build scope. Public deployment and the five-person unaided learner trial remain release validation steps; they are not claimed as completed by local tests. See the release checklist in [architecture.md](docs/architecture.md).
