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

All four planned Module 1 lessons are fully authored as of Phase 2 (20 problems total):

1. **Statements, truth values, and quantifiers** — `content/proofs-for-modern-mathematics/module-01-mathematical-language/lesson-01-statements-and-quantifiers.json`
2. **Compound statements and logical connectives** — `content/proofs-for-modern-mathematics/module-01-mathematical-language/lesson-02-compound-statements-and-connectives.json`
3. **Negating compound and quantified statements** — `content/proofs-for-modern-mathematics/module-01-mathematical-language/lesson-03-negating-compound-and-quantified-statements.json`
4. **Reading and writing formal definitions** — `content/proofs-for-modern-mathematics/module-01-mathematical-language/lesson-04-reading-and-writing-formal-definitions.json`

Modules 2–8 remain unauthored; they're listed above to show the course has a coherent arc, per the content quality checklist's expectation that prerequisites are linked.

## Lesson summaries

| # | Title | Objective | Concepts introduced | Problems |
|---|---|---|---|---|
| 1 | Statements, Truth Values, and Quantifiers | Distinguish statements from non-statements; interpret, evaluate, and negate $\forall$/$\exists$ statements. | `statement`, `truth-value`, `universal-quantifier`, `existential-quantifier`, `quantifier-negation` | 5 (multiple choice ×2, symbolic, proof ordering, counterexample) |
| 2 | Compound Statements and Logical Connectives | Evaluate compound statements with $\land$, $\lor$, $\lnot$, $\to$; translate English to symbols. | `conjunction`, `disjunction`, `negation-connective`, `conditional`, `truth-table` | 5 (multiple choice ×2, fill-in-the-blank, numeric, proof ordering) |
| 3 | Negating Compound and Quantified Statements | Apply De Morgan's laws and conditional negation, combined with quantifier negation, to mixed statements. | `de-morgans-laws`, `negation-of-conjunction`, `negation-of-disjunction`, `negation-of-conditional`, `mixed-quantifier-negation` | 5 (multiple choice ×2, fill-in-the-blank, proof ordering, numeric) |
| 4 | Reading and Writing Formal Definitions | State and use the formal definitions of even, odd, and divisibility. | `formal-definition`, `even-integer`, `odd-integer`, `divisibility` | 5 (multiple choice ×2, fill-in-the-blank, counterexample, proof ordering) |

Each problem has a full 4-step hint ladder, a worked solution, concept/prerequisite/misconception tags, and a deterministic `answerSpec`, per `docs/content-authoring-guide.md`. Adding a lesson only requires a new JSON file under `content/`; see `docs/architecture.md` for how the content loader discovers it automatically.

## Prerequisite structure across modules

Modules are linearly prerequisite for the MVP course (each module assumes the previous one). Later phases may relax this into a graph via `PrerequisiteEdge` once more than one path through the material is authored (see `ROADMAP.md` → Content system → Core entities).
