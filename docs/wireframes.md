# Low-Fidelity Wireframes

These are structural, low-fidelity wireframes for the five screens needed by the first vertical slice: course, lesson, problem, hint, and completion. They describe layout and content hierarchy, not visual design. Accessibility notes call out keyboard/screen-reader requirements per `ROADMAP.md` principle 9.

## 1. Course screen

```
┌──────────────────────────────────────────────┐
│ CineMath                                      │  <- site header, skip-to-content link
├──────────────────────────────────────────────┤
│ Proofs for Modern Mathematics                 │  <- course title (h1)
│ Learn to read, evaluate, and write proofs.    │  <- one-line description
│                                                │
│ ┌────────────────────────────────────────┐   │
│ │ Lesson 1: Statements, Truth Values,     │   │  <- single lesson card, clickable
│ │ and Quantifiers                         │   │     (only lesson in MVP)
│ │ Objective: distinguish statements from  │   │
│ │ non-statements; negate quantifiers.     │   │
│ │ ~15-20 min                    [Start →] │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

Accessibility: lesson card is a single focusable link (not nested interactive elements); objective and time are read as part of the link's accessible name.

## 2. Lesson screen

```
┌──────────────────────────────────────────────┐
│ ← Course     Lesson 1 of 1        [1/5 solved]│  <- progress indicator
├──────────────────────────────────────────────┤
│ Statements, Truth Values, and Quantifiers     │  <- h1
│                                                │
│ [Encounter]                                   │
│  "Is 'x + 1 = 5' a statement? What about      │
│   'x + 1 = 5 for every real number x'?"       │
│                                                │
│ [Explain]                                     │
│  A statement is a sentence that is either     │
│  true or false, unambiguously... (KaTeX)      │
│                                                │
│              [Start problem 1 →]              │
└──────────────────────────────────────────────┘
```

Accessibility: content sections use real headings (h2) so screen-reader users can jump between Encounter/Explain; KaTeX output must include MathML or an aria-label fallback.

## 3. Problem screen

```
┌──────────────────────────────────────────────┐
│ ← Lesson    Problem 3 of 5                    │
├──────────────────────────────────────────────┤
│ Prompt (KaTeX-rendered):                      │
│  "Negate: ∀x ∈ ℝ, ∃y ∈ ℝ such that x + y = 0" │
│                                                │
│ [ Answer input — shape depends on type ]      │
│   multiple_choice → radio group               │
│   numeric/symbolic → text input + live preview│
│   proof_ordering → reorderable list           │
│   proof_fill_blank → inline blanks in prompt  │
│   counterexample_builder → structured input   │
│                                                │
│ [Submit]                    [Hints ▾]         │
│                                                │
│ (after submit)                                │
│ ✓/✗ Result + 1-line rationale                 │
│ [Try again]           [Continue →] (if solved)│
└──────────────────────────────────────────────┘
```

Accessibility: reorderable list (proof_ordering) must support keyboard reordering (e.g., grab via Enter, move via arrow keys, drop via Enter), not drag-only; result/rationale is announced via an `aria-live` region.

## 4. Hint screen (in-place panel, not a separate route)

```
┌──────────────────────────────────────────────┐
│ Problem 3 of 5                    [Hints ▾]   │
├──────────────────────────────────────────────┤
│ Hint 1: Restate the goal                      │
│  "You need the logical negation of a          │
│   ∀...∃... statement."                        │
│                                    [Reveal →]  │
│                                                │
│ Hint 2: locked until Hint 1 revealed           │
│ Hint 3: locked                                │
│ Hint 4 (worked solution): locked until 2       │
│   incorrect attempts or a correct submission   │
│   — see docs/grading-policy.md                │
└──────────────────────────────────────────────┘
```

Accessibility: locked hints are visible but disabled with a clear reason ("unlocks after 2 attempts"), not hidden — supports predictability for screen-reader and low-vision users; no shaming copy (see `docs/pedagogical-principles.md`).

## 5. Completion screen

```
┌──────────────────────────────────────────────┐
│ Lesson complete: Statements, Truth Values,    │
│ and Quantifiers                               │
├──────────────────────────────────────────────┤
│ Accuracy:        4/5 correct on first attempt │
│ Total attempts:  7                            │
│ Hints used:      3 (across 2 problems)        │
│ Solutions revealed: 0                         │
│                                                │
│ Concepts updated:                             │
│  ✓ statement            (mastery: developing) │
│  ✓ universal-quantifier (mastery: developing) │
│  ✓ existential-quantifier (mastery: developing)│
│  ✓ quantifier-negation  (mastery: developing) │
│                                                │
│ [Back to course]                              │
└──────────────────────────────────────────────┘
```

Accessibility: summary is a real list/table (not an image or canvas chart) so it's readable by assistive tech; focus moves to the completion heading when the screen appears.

## Cross-screen requirements

- All five screens must be usable with keyboard only (Tab/Shift+Tab, Enter, Arrow keys where relevant) with a visible focus indicator at every step.
- All five screens must render correctly from mobile widths (~360px) through desktop, per `ROADMAP.md` acceptance criteria.
- Every learner-facing mathematical string renders through KaTeX; no math ships as a plain-text approximation.
