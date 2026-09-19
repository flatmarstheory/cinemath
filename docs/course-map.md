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

## Module lesson breakdown (as of Phase 6)

All 8 modules are now authored: **28 lesson files, 127 problems total**. Modules 2–7 each end with a `checkpoint` (a shorter, mixed-review lesson, `kind: "checkpoint"`); module 8 is two `capstone` lessons (`kind: "capstone"`) instead of a checkpoint, since the capstone itself is the course's final assessment. Module 1 predates checkpoints (authored in Phase 2) and has none.

1. **Mathematical language** (4 lessons, 21 problems) — `module-01-mathematical-language/`
2. **Direct proofs and definitions** (3 lessons + checkpoint, 18 problems) — `module-02-direct-proofs-and-definitions/`
3. **Contrapositive and proof by contradiction** (2 lessons + checkpoint, 13 problems) — `module-03-contrapositive-and-contradiction/`
4. **Sets, functions, injections, and bijections** (4 lessons + checkpoint, 23 problems) — `module-04-sets-functions-injections-bijections/`
5. **Induction and recursive reasoning** (3 lessons + checkpoint, 18 problems) — `module-05-induction-and-recursive-reasoning/`
6. **Counterexamples, edge cases, and proof debugging** (2 lessons + checkpoint, 13 problems) — `module-06-counterexamples-and-proof-debugging/`
7. **Relations, equivalence, and invariants** (2 lessons + checkpoint, 13 problems) — `module-07-relations-equivalence-invariants/`
8. **Capstone proof workshop** (2 capstone lessons, 8 problems) — `module-08-capstone-proof-workshop/`

## Lesson summaries

### Module 1: Mathematical language (Phase 1–2)

| # | Title | Objective | Concepts introduced | Problems |
|---|---|---|---|---|
| 1 | Statements, Truth Values, and Quantifiers | Distinguish statements from non-statements; interpret, evaluate, and negate $\forall$/$\exists$ statements. | `statement`, `truth-value`, `universal-quantifier`, `existential-quantifier`, `quantifier-negation` | 5 (multiple choice ×2, symbolic, proof ordering, counterexample) |
| 2 | Compound Statements and Logical Connectives | Evaluate compound statements with $\land$, $\lor$, $\lnot$, $\to$; translate English to symbols. | `conjunction`, `disjunction`, `negation-connective`, `conditional`, `truth-table` | 5 (multiple choice ×2, fill-in-the-blank, numeric, proof ordering) |
| 3 | Negating Compound and Quantified Statements | Apply De Morgan's laws and conditional negation, combined with quantifier negation, to mixed statements. | `de-morgans-laws`, `negation-of-conjunction`, `negation-of-disjunction`, `negation-of-conditional`, `mixed-quantifier-negation` | 5 (multiple choice ×2, fill-in-the-blank, proof ordering, numeric) |
| 4 | Reading and Writing Formal Definitions | State and use the formal definitions of even, odd, and divisibility. | `formal-definition`, `even-integer`, `odd-integer`, `divisibility` | 6 (multiple choice ×2, fill-in-the-blank, counterexample, proof ordering, proof free response — AI feedback beta, Phase 4) |

### Module 2: Direct proofs and definitions (Phase 6)

| # | Title | Concepts introduced | Problems |
|---|---|---|---|
| 1 | Direct Proof Strategy | `direct-proof`, `proof-structure` | 5 |
| 2 | Proving Divisibility Claims | `divisibility-proof`, `closure-under-linear-combination` | 5 |
| 3 | Proving Claims About Even and Odd Integers | `parity-proof`, `case-free-direct-proof` | 5 |
| Checkpoint | — | (review) | 3 |

### Module 3: Contrapositive and proof by contradiction (Phase 6)

| # | Title | Concepts introduced | Problems |
|---|---|---|---|
| 1 | Proof by Contrapositive | `contrapositive`, `logical-equivalence-of-conditional-and-contrapositive` | 5 |
| 2 | Proof by Contradiction | `proof-by-contradiction`, `deriving-a-contradiction` | 5 |
| Checkpoint | — | (review) | 3 |

### Module 4: Sets, functions, injections, and bijections (Phase 6)

| # | Title | Concepts introduced | Problems |
|---|---|---|---|
| 1 | Sets and Set Operations | `set-membership-proof`, `subset-proof`, `set-operations` | 5 |
| 2 | Functions, Domain, Codomain, and Range | `function-definition`, `well-defined-function`, `range-vs-codomain` | 5 |
| 3 | Injective and Surjective Functions | `injective-function`, `surjective-function` | 5 |
| 4 | Bijections and Inverse Functions | `bijective-function`, `inverse-function` | 5 |
| Checkpoint | — | (review) | 3 |

### Module 5: Induction and recursive reasoning (Phase 6)

| # | Title | Concepts introduced | Problems |
|---|---|---|---|
| 1 | The Principle of Mathematical Induction | `induction-base-case`, `induction-inductive-step`, `mathematical-induction` | 5 |
| 2 | Strong Induction | `strong-induction` | 5 |
| 3 | Induction on Recursively Defined Sequences | `recursive-definition`, `structural-induction` | 5 |
| Checkpoint | — | (review) | 3 |

### Module 6: Counterexamples, edge cases, and proof debugging (Phase 6)

| # | Title | Concepts introduced | Problems |
|---|---|---|---|
| 1 | Disproving False Claims | `disproof-strategy`, `counterexample-construction` | 5 |
| 2 | Finding Flaws in Proofs | `proof-flaw-identification`, `common-proof-errors` | 5 |
| Checkpoint | — | (review) | 3 |

### Module 7: Relations, equivalence, and invariants (Phase 6)

| # | Title | Concepts introduced | Problems |
|---|---|---|---|
| 1 | Relations and Their Properties | `relation-properties`, `reflexivity`, `symmetry`, `transitivity` | 5 |
| 2 | Equivalence Relations and Invariants | `equivalence-relation`, `equivalence-class`, `invariant-argument` | 5 |
| Checkpoint | — | (review) | 3 |

### Module 8: Capstone proof workshop (Phase 6)

| # | Title | Concepts introduced | Problems |
|---|---|---|---|
| 1 | Capstone: Choosing Your Proof Technique | `technique-selection` | 4 (no technique named in any prompt — direct, contrapositive, contradiction, and induction all appear) |
| 2 | Capstone Workshop: Independent Proofs | `independent-proof-construction` | 4 (two `proof_free_response`, AI-feedback beta) |

Each problem has a full 4-step hint ladder, a worked solution, concept/prerequisite/misconception tags, and a deterministic `answerSpec` (or, for `proof_free_response`, a rubric), per `docs/content-authoring-guide.md`. Adding a lesson only requires a new JSON file under `content/`; see `docs/architecture.md` for how the content loader discovers it automatically. Every concept introduced across all 8 modules has a definition in `content/proofs-for-modern-mathematics/glossary.json`, linked from the course page, dashboard, and prerequisite map (`docs/content-authoring-guide.md`'s note that consistent terminology "until a glossary exists" no longer applies — it exists as of Phase 6).

## Prerequisite structure across modules

Modules are linearly prerequisite for the course (each module assumes the concepts introduced by the ones before it) — see the full lesson-by-lesson breakdown at `/course/prerequisites` (`src/app/course/prerequisites/page.tsx`), which lists exactly what each lesson requires and introduces, every concept linked to its glossary definition. This is still a linear chain, not a general graph (`PrerequisiteEdge` from `ROADMAP.md` → Content system → Core entities remains unbuilt) — there is exactly one path through the course, so a graph structure would add complexity without adding information yet. Revisit if a second course or alternate learning paths make the chain genuinely branch.
