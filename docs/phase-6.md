# Phase 6: First Complete Course

## What this is

ROADMAP.md's Phase 6 goal is to finish and polish *Proofs for Modern Mathematics*: complete the 6–8 module course, add a prerequisite map and glossary, add checkpoints and a capstone workshop, improve review scheduling, add content search and glossary linking, add a completion certificate, add an instructor/editor publishing workflow, and run an accessibility and performance/mobile pass.

## Content: the course is now complete

The course went from 1 of 8 modules (4 lessons, 21 problems, Phase 1–2) to all 8 modules: **28 lesson files, 127 problems**. See `docs/course-map.md` for the full lesson-by-lesson breakdown. Modules 2–7 each close with a `checkpoint` lesson (a shorter, 3-problem mixed-review lesson); module 8 is two `capstone` lessons instead of a checkpoint. Both are the same `Lesson`/`Problem` shape as an ordinary lesson — `lessonSchema` gained an optional `kind: "lesson" | "checkpoint" | "capstone"` field (default `"lesson"`) purely for UI framing and course-page grouping (`src/lib/schema.ts`), not a new content model. The capstone's problems deliberately never name a proof technique in their prompts, testing the technique-selection skill the rest of the course built.

Every new lesson was authored against the exact `docs/lesson-template.md`/`docs/content-authoring-guide.md` format Phase 1–2 established — no changes to the authoring format itself were needed to scale from 1 module to 8. Every mathematical claim and derivation was independently verified (see the git history / authoring notes for corrections made along the way, e.g. tightening an induction inequality's valid range and simplifying an over-complicated set-cardinality claim to one that's cleanly provable).

## Content system additions

- **Glossary** (`content/proofs-for-modern-mathematics/glossary.json`, `src/lib/schema.ts`'s `glossarySchema`, loaded by `src/lib/content-loader.ts` alongside `catalog.json`): one definition per concept id, covering every concept introduced by every published lesson. Rendered at `/glossary`; linked from the dashboard's mastery list, the lesson completion summary, search results, and the prerequisite map — this is what `docs/content-authoring-guide.md`'s "consistent with the course glossary (until a glossary exists...)" caveat was waiting on.
- **Prerequisite map** (`/course/prerequisites`): a structured, linked list (not a node/arrow diagram — see `docs/accessibility-audit.md`) of exactly what each lesson requires and introduces, module by module.
- **Content search** (`/search`, `src/components/search-client.tsx`): client-side filter over lesson titles/objectives/concepts and glossary terms/definitions. No new dependency or search index — the course is small enough that this is simpler and just as fast (`docs/performance-audit.md`).
- **Completion certificate** (`/certificate`, `src/components/certificate.tsx`): unlocks once every published lesson is complete; a plain, print-styled page rather than a generated image/PDF, so it needed no new rendering dependency.
- **Instructor/editor publishing workflow**: `lessonSchema` gained an optional `status: "draft" | "published"` field (default `"published"`). `src/lib/content.ts` now exports both `lessons` (published only, what the public app renders and statically generates) and `allLessons` (including drafts). `/admin/content` (token-gated, same pattern as `/admin/metrics`) lists every authored lesson's status and links to a `?preview=1` view of it. This intentionally stays a thin visibility layer on top of the existing file-based authoring model, not a CMS — `docs/content-authoring-guide.md`'s "no import to register, no UI or grading code to change" still holds for adding a lesson.
- **Review scheduling improvements**: `src/lib/mastery.ts`'s `reviewQueue` now also resurfaces a concept once it hasn't been practiced in a while, with the gap scaling with mastery (`reviewIntervalDays`: 1/3/7/14 days for score bands below 0.4/0.6/0.8/above). This is a deliberately small, deterministic tier on top of the Phase 3 mastery score — not a full spaced-repetition system, which `ROADMAP.md` names as an explicit non-goal for this slice.

## Landing page

The course landing page (`src/app/page.tsx`) now groups lessons by module instead of one flat list, matching the exit criterion that the course have "coherent coverage, not merely a collection of problems." The site header gained a small `<nav aria-label="Course tools">` linking Map/Glossary/Search/Certificate alongside the existing dashboard link.

## Accessibility and performance

See `docs/accessibility-audit.md` and `docs/performance-audit.md` for the full pass. In short: every new page runs through the same axe-core + no-horizontal-overflow + no-KaTeX-error check Phase 1 established (`e2e/accessibility.spec.ts`), the prerequisite map is deliberately a linked list rather than a graph diagram for accessibility reasons, and no new client-side dependencies were added.

## Verification

`tests/phase6.test.ts` covers the new schema fields (`kind`, `status`, defaults), the glossary schema and loader behavior (drafts excluded from `lessons`, glossary/catalog reserved filenames never treated as lessons), and whole-course structural checks (all 8 modules have published content, module 8 is all-capstone, modules 2–7 each have a checkpoint, every concept id is kebab-case, every introduced concept has a glossary entry, no lesson id collisions).

**Validation caveat:** this environment has no Node.js/npm installed, so `npm run check` / `npx tsx scripts/validate-content.ts` could not actually be executed while authoring. Every authored file was instead checked against a standalone script re-implementing `src/lib/schema.ts`'s rules field-for-field (run from Python, since Python was available where Node was not), covering required fields, hint ordering, per-type `answerSpec` shape, id uniqueness, and checkpoint/capstone problem counts. **Run `npm run check` in a real Node environment before deploying** to get the actual TypeScript/Zod/ESLint/Prettier/Playwright verification this substitute could not provide.

## What's deliberately out of scope here

- A full graph-shaped prerequisite system (`PrerequisiteEdge`) — the course is still one linear path, so a graph would add complexity without adding information (see `docs/course-map.md`).
- A full spaced-repetition scheduler — the review-queue improvement here is a small, explainable tier, not an SRS algorithm (`ROADMAP.md` non-goal).
- A real content-authoring/editing UI — `/admin/content` is read-only visibility into publish status, not a CMS; content is still authored as JSON files per `docs/content-authoring-guide.md`.
- Author-role accounts — the admin surfaces (`/admin/content`, `/admin/metrics`, the AI-feedback review queue) all still share one operator bearer token; this product has no per-editor identity yet, consistent with accounts/auth being scoped to learners only per `ROADMAP.md` Phase 3.
