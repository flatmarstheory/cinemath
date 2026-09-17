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

Once Phase 2 builds the content loader/validator, this directory maps directly into `packages/content/` without a format change — only a location move.

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
| `proof_fill_blank` | `{ blanks: {id, acceptedValues: string[]}[] }` |
| `counterexample_builder` | `{ constraints: string[], predicateDescription: string, checkerNotes: string }` — `checkerNotes` describes, in plain language, exactly how a programmatic checker will validate a submission; the actual checker is implemented in Phase 2. |
| `proof_free_response` | Not used until Phase 4; when introduced, `answerSpec` holds the rubric reference, not a gradable spec. |

For multiple-choice options, `accessibleLabel` is an authored spoken-language description used as the form control name. Keep `label` as Markdown with KaTeX math for the visible option. The Phase 1 counterexample also requires `checker: "integer-square-not-greater"` to select its explicit deterministic validator; English `checkerNotes` are documentation, not executable rules.

Every `answerSpec` must be sufficient on its own for deterministic grading — see `docs/grading-policy.md`.

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
4. Author problems in increasing difficulty, covering at least two problem types where the objective allows it (mirrors the required-format mix in `ROADMAP.md`).
5. Write each problem's solution before its hints — hints are derived from the solution's reasoning, not written independently.
6. Tag concepts, prerequisites, and misconceptions.
7. Run the content quality checklist.
8. Validate against the `Problem` type (manually in Phase 0/1; via the Phase 2 content loader once it exists).
