# Course Map — Proofs for Modern Mathematics

## Why this course is first

Proof literacy is a prerequisite skill for every later CineMath subject (linear algebra beyond computation, real analysis, abstract algebra, probability foundations, optimization). It also lets CineMath demonstrate its core interaction patterns — deterministic grading, staged hints, gated solutions, mastery tracking — without requiring a computer algebra system.

## Learner personas for this course

### Primary: Priya, the self-directed bridge learner

See `docs/product-spec.md`. Has computational math background, no formal proof experience, motivated by an external goal (CS/AI program, technical interview, coursework).

### Secondary: Marcus, the returning-to-math professional

- Studied some proof-based math years ago and is rusty, not a beginner.
- Wants faster pacing and is more likely to skip hints and jump to solutions.
- Values seeing *why* a proof strategy was chosen, not just the mechanics.
- Not designed for in the first vertical slice, but the hint ladder (hints are optional and skippable) already serves this learner without extra work.

### Secondary: Amara, the current CS/math undergraduate

- Currently taking or about to take a proof-based course (discrete math, intro to proofs, algorithms) and wants extra deliberate practice outside lecture.
- Cares about seeing common mistakes named explicitly (misconception tags), since that mirrors what loses her points on homework.
- Not designed for in the first vertical slice, but misconception tagging and the "find a flaw" problem format directly serve her.

## Course-level learning objective

By the end of the course, a learner can read a precise mathematical claim, decide whether it is true, and construct a correct, clearly structured proof or disproof using the standard techniques of direct proof, contraposition, contradiction, induction, and counterexample.

## Modules (6–8, per roadmap)

| # | Module | Objective |
|---|---|---|
| 1 | Mathematical language, statements, and quantifiers | Read and write precise statements; correctly negate quantified claims. |
| 2 | Direct proofs and definitions | Prove a claim directly from definitions using clean logical steps. |
| 3 | Contrapositive and proof by contradiction | Choose and execute an indirect proof strategy when direct proof is awkward. |
| 4 | Sets, functions, injections, and bijections | Prove properties of sets and functions, including injectivity/surjectivity. |
| 5 | Induction and recursive reasoning | Prove statements about natural numbers and recursively defined structures. |
| 6 | Counterexamples, edge cases, and proof debugging | Disprove false claims and identify flaws in proposed proofs. |
| 7 | Relations, equivalence, and invariants | Prove properties of relations and use invariants in proofs. |
| 8 | Capstone proof workshop | Combine techniques on multi-step problems without being told which technique to use. |

This satisfies the Phase 0 exit criterion of 6–8 modules.

## Module 1 lesson breakdown

Module 1 is the only module with a fully authored lesson in the first vertical slice. Its lessons:

1. **Statements, truth values, and quantifiers** — *fully authored for the first vertical slice (see `content/proofs-for-modern-mathematics/module-01-mathematical-language/lesson-01-statements-and-quantifiers.json`)*
2. Compound statements and logical connectives *(planned, not yet authored)*
3. Negation of compound and quantified statements *(planned, not yet authored)*
4. Reading and writing formal definitions *(planned, not yet authored)*

Only Lesson 1 is in scope for Phase 0/Phase 1. Lessons 2–4 are listed to show the module has a coherent arc, per the content quality checklist's expectation that prerequisites are linked, not to be built yet.

## Lesson 1 summary

- **Title:** Statements, Truth Values, and Quantifiers
- **Learning objective:** Distinguish valid mathematical statements from non-statements, and correctly interpret, evaluate, and negate quantified statements using ∀ and ∃.
- **Prerequisites:** None (course entry point).
- **Concepts introduced:** `statement`, `truth-value`, `universal-quantifier`, `existential-quantifier`, `quantifier-negation`.
- **Estimated time:** 15–20 minutes.
- **Problems:** 5, covering multiple choice, symbolic negation, proof ordering, and counterexample construction (see the lesson template and content-authoring guide for format details).

## Prerequisite structure across modules

Modules are linearly prerequisite for the MVP course (each module assumes the previous one). Later phases may relax this into a graph via `PrerequisiteEdge` once more than one path through the material is authored (see `ROADMAP.md` → Content system → Core entities).
