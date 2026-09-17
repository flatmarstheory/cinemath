# CineMath Roadmap

> **CineMath** is an interactive, proof-driven learning platform for advanced mathematics. It combines short cinematic explanations with adaptive problem-solving, rigorous feedback, and mastery-based review.

## Product vision

Build the place where motivated learners move from “I can follow the explanation” to “I can solve and prove it myself.”

CineMath will focus on advanced, university-level mathematics:

- Proof writing and mathematical reasoning
- Discrete mathematics
- Linear algebra beyond computation
- Real analysis
- Probability and statistics foundations
- Abstract algebra
- Optimization and mathematics for AI

The initial product is not a course marketplace, a video library, or a general-purpose AI tutor. It is a structured interactive learning system built around carefully authored problem sequences.

## Principles

1. **Mathematical correctness first.** Do not trade rigor for superficial engagement.
2. **Active work over passive watching.** Lessons require learners to predict, construct, derive, prove, and revise.
3. **Small learning units.** A lesson should usually take 10–25 minutes and teach one clear objective.
4. **Hints before solutions.** Give increasingly specific guidance without prematurely taking away productive struggle.
5. **Deterministic grading where possible.** Use explicit validators for objective answers; use AI as an educational coach, not a source of truth.
6. **AI feedback is not formal verification.** Clearly label it, ground it in a rubric, and never overclaim certainty.
7. **Content is the moat.** The quality and sequencing of problems matter more than feature volume.
8. **Ship vertical slices.** Every phase should leave CineMath more usable by real learners.
9. **Accessible by default.** Keyboard support, readable math, responsive layouts, and clear language are product requirements.
10. **Measure learning, not vanity.** Track lesson completion, retries, hint use, retention, and concept mastery.

## Initial audience

### Primary learner

A self-directed learner with high-school calculus or introductory university mathematics who wants to learn proof-based mathematics seriously.

They may be preparing for:

- Computer science, AI, data science, cryptography, or engineering foundations
- University mathematics courses
- Technical interviews or competitive examinations
- A transition from computational math to theoretical math
- Personal intellectual study

### Initial promise

> Learn difficult mathematical ideas by working through them—not by merely watching someone else solve them.

## MVP scope

### First course

**Proofs for Modern Mathematics**

This is the first course because proof literacy supports every later CineMath subject. It also lets the platform demonstrate its core interaction patterns without needing a full computer algebra system.

### Course modules

1. Mathematical language, statements, and quantifiers
2. Direct proofs and definitions
3. Contrapositive and proof by contradiction
4. Sets, functions, injections, and bijections
5. Induction and recursive reasoning
6. Counterexamples, edge cases, and proof debugging
7. Relations, equivalence, and invariants
8. Capstone proof workshop

### First vertical slice

The first deployable version contains exactly one lesson:

- A short introduction and learning objective
- KaTeX-rendered mathematical content
- Five authored problems
- Multiple-choice, numeric or structured-response grading
- A progressive hint ladder
- Gated full solutions
- Attempt persistence
- Lesson completion summary
- Basic concept-mastery update

### Explicit non-goals for the first vertical slice

- Authentication and billing
- AI-generated content publishing
- Free-form proof feedback
- Native mobile applications
- Social features, leaderboards, or public profiles
- Full spaced repetition system
- Formal theorem proving
- Multiple courses
- Complex recommendations or personalization models

## Technical direction

### Suggested stack

| Area | Initial choice |
|---|---|
| Web application | Next.js with TypeScript and App Router |
| Styling | Tailwind CSS |
| UI primitives | Accessible component library or lightweight internal components |
| Database | PostgreSQL |
| ORM | Prisma or Drizzle |
| Validation | Zod |
| Math rendering | KaTeX |
| Authentication | Auth.js, Clerk, or Supabase Auth after the demo stage |
| Hosting | Vercel plus managed PostgreSQL/Supabase/Neon |
| Analytics | PostHog or Plausible after basic lesson flow works |
| AI feedback | Claude API, server-side only, feature-flagged |

### Architecture requirements

- Use TypeScript strict mode; do not introduce `any`.
- Validate every API input with Zod.
- Store math content separately from UI implementation.
- Keep problem content portable as validated JSON, MDX front matter, or both.
- Version problems and solutions so learner attempts retain their original context.
- Keep API keys and AI-provider calls on the server.
- Prefer simple, testable components before abstraction-heavy frameworks.
- Make every learner-facing mathematical string compatible with KaTeX rendering.
- Treat accessibility and keyboard navigation as acceptance criteria.

### Repository shape

```text
cinemath/
├── CLAUDE.md
├── README.md
├── ROADMAP.md
├── apps/
│   └── web/
├── packages/
│   ├── content/
│   ├── db/
│   ├── math-engine/
│   ├── problem-schema/
│   └── ui/
├── docs/
│   ├── architecture.md
│   ├── content-authoring-guide.md
│   ├── course-map.md
│   ├── grading-policy.md
│   ├── pedagogical-principles.md
│   └── product-spec.md
├── .claude/
│   ├── agents/
│   └── skills/
└── turbo.json
```

## Learning model

### Lesson loop

Each CineMath lesson should follow this sequence:

1. **Retrieve**: Recall one or two relevant earlier concepts.
2. **Encounter**: Start with a puzzle, example, failure case, or concrete construction.
3. **Explain**: Present only the theory needed for the immediate objective.
4. **Practice**: Ask the learner to solve a purposeful, interactive problem.
5. **Hint**: Offer staged hints that preserve learner agency.
6. **Reflect**: Explain why the method works and identify common errors.
7. **Master**: Update concept-level mastery and schedule future review when applicable.

### Hint policy

Every significant problem should have a ladder of up to four hints:

1. Restate the goal in more precise mathematical language.
2. Point to a relevant definition, theorem, construction, or strategy.
3. Supply an important intermediate observation.
4. Reveal a worked solution after the configured threshold is met.

The UI must make the cost of using a hint clear, but it must never shame a learner for requesting help.

### Grading policy

Use deterministic grading for:

- Multiple choice
- Boolean answers
- Numeric answers with an explicit tolerance
- Ordered proof steps
- Fill-in-the-blank proof components
- Structured constructions with programmatically testable properties

Use AI-assisted feedback only for tasks where deterministic validation is inadequate, such as free-response proof attempts. AI feedback must:

- Be server-side only
- Be grounded in the exact problem, reference solution, and rubric
- Return validated structured output
- Be labeled as educational feedback
- Avoid claiming formal correctness or completeness
- Prefer a diagnosis and next step over revealing a complete solution
- Record model/grader version and confidence for auditing

## Content system

### Core entities

```text
User
Course
Module
Lesson
Concept
Problem
ProblemVersion
Hint
Solution
ProblemAttempt
MasteryRecord
ReviewQueueItem
MisconceptionTag
ProblemConcept
PrerequisiteEdge
```

### Minimum problem metadata

Every problem must declare:

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

### Required problem formats

The first course should use a mix of:

- Identify valid and invalid quantified statements
- Match a definition to an example or non-example
- Complete a proof skeleton
- Arrange a proof in valid logical order
- Find a flaw in a proposed proof
- Construct a counterexample
- Choose the correct proof strategy
- Write a short structured proof

### Content quality checklist

Before publishing a problem, confirm:

- The learning objective is singular and explicit.
- Prerequisites have been taught or are linked for review.
- The intended solution is mathematically correct.
- At least one plausible misconception has been identified.
- Hints are genuinely progressive rather than repeated solutions.
- The answer specification matches the chosen problem type.
- Notation is consistent with the course glossary.
- The problem is accessible without unnecessary trick wording.
- The solution explains strategy, not only the final derivation.
- The expected time and difficulty are realistic.

## Milestones

## Phase 0 — Define CineMath

**Goal:** Establish the product and instructional foundation before coding.

### Deliverables

- Product specification
- Brand/name decision: CineMath
- One-sentence value proposition
- Learner personas
- First-course syllabus
- Lesson template
- Content-authoring guide
- Grading and AI-feedback policy
- Low-fidelity wireframes for the course, lesson, problem, hint, and completion screens

### Exit criteria

- The first course has 6–8 modules.
- The first lesson has a written learning objective and five fully authored problems.
- Each initial problem has a solution, hint ladder, tags, and answer specification.
- A learner can be described end-to-end from landing on a lesson through completion.

## Phase 1 — Foundation and vertical slice

**Goal:** Build one polished lesson that works end-to-end for an anonymous learner.

### Build

- Monorepo or simple repository setup
- Next.js application scaffold
- Shared TypeScript and Zod configuration
- KaTeX math rendering
- Basic responsive lesson UI
- Seeded course, module, lesson, and problem content
- Multiple-choice problem component
- Numeric or structured-answer component
- Progressive hint UI
- Gated solution UI
- Local or database-backed attempt persistence
- Basic completion screen
- Linting, formatting, type checking, and test setup

### Acceptance criteria

- A learner can start, leave, and resume the first lesson.
- Every expression renders correctly on desktop and mobile widths.
- The learner can submit answers and receive deterministic results.
- Hint use is persisted.
- Full solutions obey the configured reveal rule.
- The completion screen summarizes accuracy, attempts, and hint usage.
- The full flow passes typecheck, lint, and automated tests.

### Exit criteria

- Deployable demo URL exists.
- Five real users can finish the lesson without developer assistance.
- No known blocker prevents adding another lesson through content data alone.

## Phase 2 — Authoring pipeline and problem engine

**Goal:** Make CineMath efficient to extend without changing application code for each lesson.

### Build

- Versioned Zod problem schema
- Content loader and validation command
- JSON or MDX-based lesson authoring workflow
- Proof-ordering interaction
- Proof fill-in-the-blank interaction
- Counterexample builder for constrained problem types
- Reusable feedback states
- Content preview mode for authors
- Problem-level analytics events
- Test fixtures for valid and invalid content

### Acceptance criteria

- Adding a new deterministic lesson requires content files and no new UI logic.
- Invalid content fails validation with useful errors.
- Each supported problem type has unit tests and at least one end-to-end example.
- Authors can preview the exact learner experience before publishing.

### Exit criteria

- The first course contains at least 20–30 authored problems.
- At least three interaction types are production-ready.
- Content validation runs in CI.

## Phase 3 — Accounts, progress, and mastery

**Goal:** Turn a demo into a persistent learning product.

### Build

- Authentication
- User profiles and learner settings
- Persistent course and lesson progress
- Concept-level mastery records
- Transparent deterministic mastery model
- Progress dashboard
- Resume-learning entry point
- Basic review queue
- Privacy controls and data-deletion path

### Initial mastery model

Maintain a mastery score from 0 to 1 per learner and concept.

\[
m_{new} = \operatorname{clamp}(0, 1, m_{old} + \alpha \cdot d \cdot q - \beta \cdot h)
\]

Where:

- \(m_{old}\) is existing mastery
- \(d\) is normalized problem difficulty
- \(q\) represents outcome quality, positive for correct work and negative for incorrect work
- \(h\) captures hint use
- \(\alpha\) and \(\beta\) are small tunable parameters

The exact algorithm must be documented, deterministic, unit-tested, and visible in plain language to the learner when useful.

### Acceptance criteria

- A returning user resumes at the correct point.
- Mastery changes are explainable and testable.
- Weak concepts produce relevant review prompts.
- A user can view and delete their learning data according to the product policy.

### Exit criteria

- A learner can complete several lessons over several days with persisted progress.
- The dashboard identifies completed work, current work, and suggested review.

## Phase 4 — AI proof feedback beta

**Goal:** Add carefully bounded feedback for short free-response proofs.

### Build

- Server-side AI integration behind a feature flag
- Rubric-based proof-feedback prompt format
- Strict structured-output validation
- Feedback categories: correct, mostly correct, needs revision, insufficient
- Constructive feedback and next-hint response
- Retry and revision workflow
- Grader confidence and model-version logging
- Fallback behavior when model output is malformed or unavailable
- Admin review queue for low-confidence feedback
- AI usage limits and cost monitoring

### Acceptance criteria

- No API key reaches client-side code.
- The model receives only data necessary for feedback.
- Feedback uses a known rubric and does not invent requirements.
- CineMath never calls AI feedback “formal verification.”
- A failed AI request does not block lesson completion.
- Mocked integration tests cover valid, malformed, unavailable, and low-confidence responses.

### Exit criteria

- 10–20 beta learners have used the feature.
- Feedback quality has been manually reviewed on a representative sample.
- There is a clear cost-per-active-learner estimate.
- The feature demonstrably improves revision attempts or learner satisfaction.

## Phase 5 — Closed beta and learning validation

**Goal:** Test whether learners actually return and gain confidence with hard mathematics.

### Recruit

- Self-directed math learners
- Computer science and AI students
- Learners transitioning into proof-based courses
- Technical peers who can provide detailed product feedback

### Measure

- Lesson-start to lesson-completion rate
- Median time per problem
- Retry count by problem
- Hint-use rate by hint level
- Solution-reveal rate
- Drop-off location within lessons
- Seven-day return rate
- Concept mastery progression
- Self-reported clarity and challenge
- Willingness to continue or pay for future courses

### Interview questions

- Where did you feel most engaged?
- Where did the lesson become confusing or frustrating?
- Did hints help you continue thinking, or did they give too much away?
- Did the feedback identify the real issue in your reasoning?
- What would make you return tomorrow?
- Which advanced topic would you want next?

### Exit criteria

- 10–30 active beta learners complete meaningful parts of the course.
- At least one module has strong completion and qualitative feedback.
- The team has a prioritized list of content and usability fixes.
- A second course is selected from evidence rather than intuition.

## Phase 6 — First complete course

**Goal:** Finish and polish Proofs for Modern Mathematics.

### Build

- Complete 6–8 module course
- Prerequisite map and course glossary
- Multiple checkpoints and capstone proof workshop
- Review scheduling improvements
- Content search and glossary linking
- Course completion certificate or shareable completion artifact, if useful
- Instructor/editor publishing workflow
- Accessibility audit
- Performance and mobile UX pass

### Exit criteria

- The course has coherent coverage, not merely a collection of problems.
- Every module has a defined outcome and assessment.
- A learner can complete the course entirely on CineMath.
- Content is peer-reviewed for mathematical correctness.

## Phase 7 — Monetization and expansion

**Goal:** Establish sustainable economics only after retention and instructional value are validated.

### Possible model

- Free first module or free foundational course
- Paid full-course access
- Subscription for all courses and adaptive review
- Student pricing
- Scholarships or sponsored access
- Institution/team plans later

### Next-course candidates

Select using user demand, completion data, authoring feasibility, and strategic fit:

1. Linear Algebra Beyond Computation
2. Real Analysis Foundations
3. Discrete Mathematics and Combinatorics
4. Probability for Mathematical Thinking
5. Mathematics for Machine Learning
6. Abstract Algebra: Structure and Symmetry

### Exit criteria

- Payment does not block early learner validation.
- Pricing is tested ethically and transparently.
- Expansion does not lower content quality or weaken the core lesson loop.

## What not to build yet

Avoid these until the core course has strong learner retention:

- A full computer algebra system
- A general natural-language theorem prover
- AI-authored courses without expert editorial review
- Social feeds, followers, or public rankings
- Excessive badges, currencies, streak mechanics, or gamification
- Live tutoring marketplace
- Native iOS/Android apps
- Large video-production pipelines
- An advanced recommendation system trained on too little data
- Broad curriculum expansion before one complete, excellent course

## Success metrics

### Early product metrics

| Metric | Early target |
|---|---|
| First-lesson completion | 60% or higher among committed testers |
| Full-solution reveal before final attempt | Low enough to show productive struggle, not hidden difficulty |
| Seven-day return rate | Establish baseline, then improve per cohort |
| Median lesson time | 10–25 minutes for standard lessons |
| User-reported clarity | Majority rate lessons clear or very clear |
| AI feedback helpfulness | Majority of beta users find it actionable |

### Learning-quality metrics

- Learners solve later transfer problems that require earlier concepts.
- Learners can identify and repair errors in flawed proofs.
- Learners use fewer hints on repeated concept types over time.
- Learners report increased confidence writing mathematical arguments.
- Expert reviewers find solutions, notation, rubrics, and feedback mathematically sound.

## Operating cadence

### Weekly

- Review analytics and learner feedback.
- Fix the largest lesson-flow or content-quality problem.
- Publish or improve one small, testable learning unit.
- Run automated tests and content validation before deployment.

### Biweekly

- Conduct 3–5 short learner interviews.
- Review problem difficulty and hint progression.
- Audit AI feedback samples if the beta feature is enabled.

### Monthly

- Reassess roadmap priorities using evidence.
- Review infrastructure costs and AI spend.
- Review privacy, security, dependency, and accessibility issues.
- Decide whether to deepen the current course or begin the next validated course.

## Definition of done

A CineMath feature is done only when:

- It solves a documented learner or author problem.
- It has explicit acceptance criteria.
- It works on relevant screen sizes.
- It meets accessibility expectations.
- It is type-safe and input-validated.
- It has appropriate automated tests.
- It does not weaken mathematical correctness or expose sensitive data.
- Its effect can be measured through user behavior or feedback.
- It is documented where future authors or engineers need guidance.

## First actions

1. Create the repository named `cinemath`.
2. Add this file as `ROADMAP.md`.
3. Write `docs/product-spec.md` with one target learner and one initial promise.
4. Write `docs/course-map.md` for Proofs for Modern Mathematics.
5. Fully author the first lesson and its five problems before building generalized tooling.
6. Create a concise root `CLAUDE.md` with engineering and pedagogical constraints.
7. Ask Claude Code to inspect the documents, propose the smallest vertical slice, and wait for approval before implementation.
8. Deploy the first lesson and put it in front of real learners as early as possible.
