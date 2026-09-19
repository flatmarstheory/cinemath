# Content Authoring Guide

This guide is for anyone writing a CineMath lesson or problem, including Claude Code when asked to author or extend content. It is the operational companion to `docs/pedagogical-principles.md` and `docs/grading-policy.md`.

## Where content lives

Authored content is portable, validated JSON (matching the `Problem` type in `ROADMAP.md` → Content system) or MDX front matter, kept separate from UI code, per `ROADMAP.md` → Architecture requirements.

For the first vertical slice, content lives under:

```text
content/
└── <course-slug>/
    └── <module-slug>/
        └── <lesson-slug>.json
```

Example: `content/proofs-for-modern-mathematics/module-01-mathematical-language/lesson-01-statements-and-quantifiers.json`

`src/lib/content-loader.ts` discovers every `*.json` file under `content/` (except `catalog.json` and `glossary.json`) automatically and validates each against `lessonSchema`. **Adding a lesson means adding a JSON file in this shape — no import to register, no UI or grading code to change**, as long as the lesson uses already-supported problem types. Run `npm run validate:content` to validate all authored content on its own (useful while authoring, and it runs as part of `npm run check` and CI); it reports which file failed and why.

The root catalog now contains a `courses` array. Register each course and its modules there; each lesson's module must belong to its declared course. Keep lesson IDs globally unique and prefix new course concept IDs to avoid glossary and mastery collisions. Each course has its own `glossary.json`. See [Linear Algebra Beyond Computation](linear-algebra-course.md) for the second course's sequence and scope.

This directory maps directly into `packages/content/` without a format change whenever the repository grows into the full monorepo shape — only a location move.

## Lesson file shape

A lesson file has two parts: lesson metadata (including the loop stages) and an array of fully authored problems.

See `docs/lesson-template.md` for the exact template and field-by-field instructions.

## Problem metadata (required fields)

Every problem must declare all fields from the `Problem` type in `ROADMAP.md`:

```ts
type Problem = {
  id: string
  version: number
  lessonId: string
  type:
    | "multiple_choice"
    | "numeric"
    | "symbolic"
    | "proof_ordering"
    | "proof_fill_blank"
    | "proof_free_response"
    | "counterexample_builder"
  promptMarkdown: string
  answerSpec: unknown
  hints: Array<{ order: number; bodyMarkdown: string }>
  solutionMarkdown: string
  concepts: string[]
  prerequisites: string[]
  difficulty: 1 | 2 | 3 | 4 | 5
  misconceptionTags: string[]
}
```

Notes:

- `id` is stable across versions; `version` increments when `promptMarkdown`, `answerSpec`, or `solutionMarkdown` changes in a way that could invalidate past attempts (per `ROADMAP.md`: "Version problems and solutions so learner attempts retain their original context").
- `promptMarkdown` and `solutionMarkdown` must be valid Markdown with KaTeX-compatible math (`$...$` inline, `$$...$$` block, or the project's chosen KaTeX delimiter convention — keep it consistent within a lesson).
- `hints` must be ordered 1–4 and strictly progressive (see hint policy in `docs/pedagogical-principles.md`).
- `concepts` and `misconceptionTags` use kebab-case ids, reused consistently across problems and lessons so mastery tracking and the future glossary can key off them.
- `prerequisites` lists concept ids (not problem ids) that a learner is assumed to know.

## `answerSpec` conventions by type

| Type | `answerSpec` shape |
|---|---|
| `multiple_choice` | `{ options: {id, label, accessibleLabel}[], correctOptionIds: string[] }` |
| `numeric` | `{ correctValue: number, tolerance: number, toleranceType: "absolute" \| "relative" }` |
| `symbolic` | `{ correctExpression: string, equivalenceForm: string }` — `equivalenceForm` names the normalization used for comparison (e.g., `"propositional-normal-form"`). |
| `proof_ordering` | `{ steps: {id, textMarkdown}[], correctOrder: string[], alternateValidOrders?: string[][] }` |
| `proof_fill_blank` | `{ blanks: {id, label, acceptedValues: string[]}[] }` — `label` is the accessible field label shown next to each blank's input; `acceptedValues` are matched case- and whitespace-insensitively. |
| `counterexample_builder` | `{ constraints: string[], predicateDescription: string, checkerNotes: string, checker }` — `checkerNotes` describes, in plain language, exactly how the checker validates a submission; `checker` selects one of a small, closed registry of deterministic integer-predicate checkers (see below). |
| `proof_free_response` | `{ rubric: {id, description}[], minWords: number }` — a rubric reference for AI-assisted feedback (Phase 4, `docs/grading-policy.md`), not a gradable spec: `answerSpec` alone never determines correctness. `solutionMarkdown` doubles as the reference solution grounding AI feedback and is never sent to the client verbatim during grading. |

For multiple-choice options, `accessibleLabel` is an authored spoken-language description used as the form control name. Keep `label` as Markdown with KaTeX math for the visible option.

### Counterexample checkers

`counterexample_builder` never executes author-supplied code. `checker` must be one of `counterexampleCheckerIds` in `src/lib/schema.ts`, each backed by a hand-written, unit-tested function in `src/lib/grading.ts`:

- `integer-square-not-greater`: accepts integers $n$ with $n^2 \le n$.
- `integer-even-with-even-square`: accepts even integers (whose square is, consequently, also even).

Authoring a counterexample problem against a new predicate means adding a new checker id to both files and a unit test — a small, explicit code change, not a content-only change. This keeps grading fully deterministic and safe.

### `proof_fill_blank` UI

Blanks render as one labeled text input per entry, below the prompt (not inline inside the KaTeX-rendered `promptMarkdown`), matching how `proof_ordering` renders its steps as a separate list. Author `acceptedValues` as plain tokens a learner would actually type (numbers, short words, or simple symbols) rather than full LaTeX, since matching is a case-insensitive string comparison, not symbolic equivalence.

Every `answerSpec` must be sufficient on its own for deterministic grading — see `docs/grading-policy.md`.

## Figures (optional diagrams, plots, and charts)

Any lesson loop section (`retrieve`, `encounter`, `explain`, `reflect`) and any problem may carry one optional `figure`, rendered as accessible inline SVG by `src/components/diagrams`. A figure is data, authored in the lesson JSON exactly like `promptMarkdown` — never freeform drawing code. Use one wherever a picture would replace a paragraph of description: an example set, a plotted function, a vector diagram, a relation, or a matrix.

`figure` is validated by `figureSchema` in `src/lib/schema.ts` as a closed, discriminated set of kinds:

| `kind` | Use for | Key fields |
|---|---|---|
| `number-line` | Intervals, quantifier examples, included/excluded points | `min`, `max`, `points: {value, label, style: "include"\|"exclude"}[]`, `intervals: {from, to, closedFrom, closedTo, label?}[]` |
| `function-plot` | Graphing a named function, marking specific inputs/outputs | `domain: [number, number]`, `range?`, `curves: {preset, label, color}[]`, `markedPoints: {x, y, label}[]` |
| `set-diagram` | Venn diagrams for 2–3 sets, set operations, element membership | `sets: {id, label}[]` (2–3), `shadedRegions: string[][]` (each entry: the set ids whose intersection is shaded), `elements: {label, memberOf: string[]}[]` |
| `vector-plane` | Vectors in ℝ², sums, spans | `xRange`, `yRange`, `vectors: {from?, to, label, color}[]` |
| `relation-graph` | Relations, equivalence classes, induction chains | `nodes: {id, label}[]`, `edges: {from, to, directed}[]` |
| `matrix-grid` | Matrices, determinants, highlighted rows/columns/entries | `rows: number[][]`, `highlight: [row, col][]` |

Every figure kind requires a `caption`, which doubles as its accessible label (rendered as visible `<figcaption>` text and as the SVG's `aria-label`) — write it as a complete, standalone sentence a screen-reader user could act on without seeing the picture.

`function-plot` never evaluates an author-supplied expression (this would be a small computer algebra system, an explicit `ROADMAP.md` non-goal). Instead, `curves[].preset` selects from the closed `functionPresetIds` registry in `src/lib/schema.ts` (`identity`, `square`, `cube`, `reciprocal`, `abs`, `sqrt`, `sin`, `floor`, `exp`, `negation`, `constant-zero`, `triangular`, `power-of-two`). Adding a new preset means adding its id to that list and its plain-JS implementation to `presets` in `src/components/diagrams/function-plot.tsx` — the same small, explicit, unit-testable pattern as counterexample checkers.

See `content/proofs-for-modern-mathematics/module-01-mathematical-language/lesson-01-statements-and-quantifiers.json` and `content/linear-algebra-beyond-computation/module-01-vector-spaces/lesson-01-vectors-as-objects.json` for worked examples of each kind in context.

## Content quality checklist (must pass before publishing any problem)

1. The learning objective is singular and explicit.
2. Prerequisites have been taught or are linked for review.
3. The intended solution is mathematically correct.
4. At least one plausible misconception has been identified and tagged.
5. Hints are genuinely progressive, not repeated solutions in different words.
6. The answer specification matches the chosen problem type and is sufficient for deterministic grading.
7. Notation is consistent with the course glossary (until a glossary exists, consistent within the lesson and course-map terminology).
8. The problem is accessible without unnecessary trick wording.
9. The solution explains strategy, not only the final derivation.
10. The expected time and difficulty are realistic for the stated learner persona.

A second reviewer (human or a fresh read-through) should confirm this checklist before a lesson is marked ready, per `docs/pedagogical-principles.md`.

## Authoring a new lesson, step by step

1. Confirm the module and lesson slot in `docs/course-map.md`; add a row if this is a new lesson.
2. Write the single learning objective first. If it doesn't fit in one sentence, split the lesson.
3. Draft the lesson loop stages (Retrieve/Encounter/Explain) using `docs/lesson-template.md`.
4. Author problems in increasing difficulty, covering at least two problem types where the objective allows it (mirrors the required-format mix in `ROADMAP.md`). Add a `figure` to a loop section or a problem wherever a diagram would do the explaining more clearly than another paragraph of prose (see Figures above).
5. Write each problem's solution before its hints — hints are derived from the solution's reasoning, not written independently.
6. Tag concepts, prerequisites, and misconceptions.
7. Run the content quality checklist.
8. Validate against the `Problem` type (manually in Phase 0/1; via the Phase 2 content loader once it exists).
