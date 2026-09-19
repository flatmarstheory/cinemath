# Phase 6: Performance and Mobile UX Pass

ROADMAP.md Phase 6 calls for a "performance and mobile UX pass." This document records what was reviewed and changed, and what's already covered by earlier phases.

## Already in place (Phases 1-2)

- `playwright.config.ts` runs every e2e test under both a 1440×1000 `desktop` project and a 360×800 touch-emulated `mobile` project, and `e2e/lesson.spec.ts`'s `audit()` helper asserts no horizontal overflow at either width. Phase 6 extends this same check to every new page (`e2e/accessibility.spec.ts`).
- `globals.css` already has responsive breakpoints at `1000px` and `700px`, plus a `prefers-reduced-motion: reduce` override.
- Course content (`src/lib/content.ts`) is loaded and validated once, server-side, at module load — no client-side fetch or waterfall for lesson content; the client only fetches per-learner progress (`/api/learner`).
- The lesson player, dashboard, and admin pages are the only `"use client"` components; static marketing/content pages (course landing, glossary, prerequisite map) stay server components with no client JS beyond `LessonLink`'s small hydration for the resume/start label.

## Phase 6 review and changes

- **New pages stay server components by default.** `/glossary`, `/course/prerequisites`, and the outer `/search` page are plain server components; only the small interactive pieces (`SearchClient`, `Certificate`) are client components, following the existing `Dashboard`/`LessonPlayer` pattern rather than making a whole new page client-rendered.
- **Search has no new dependency or index.** `SearchClient` filters the already-loaded lesson/glossary arrays in memory with `useMemo`; for a single course of this size, a client-side substring filter is faster to load and simpler to maintain than shipping a search library or building a server search index (CLAUDE.md: prefer simple, testable components over abstraction-heavy frameworks).
- **The certificate avoids a rendering dependency.** Rather than generating a PDF or image server-side (a new dependency and a new failure mode), the certificate is a plain, print-styled page (`@media print` in `globals.css`) that uses the browser's own print-to-PDF — zero added bundle weight.
- **Module-grouped landing page.** Grouping the (now ~25) lessons by module (`src/app/page.tsx`) keeps each module's section small and scannable instead of one long flat list of cards, which matters more on mobile viewports where users scroll through significantly more content now than in the one-lesson Phase 1 slice.
- **No new client-side dependencies were added.** Phase 6 introduces no new npm packages; every new page reuses `react-markdown`/`rehype-katex` (already loaded wherever math renders) and the existing CSS system.
- **Table markup for admin pages.** `/admin/content` and the pre-existing `/admin/metrics` both use plain `<table>` elements; Phase 6 added baseline `table`/`th`/`td` styling (`globals.css`) so these operator pages are legible without relying on unstyled browser defaults, at negligible CSS cost.

## Not done, and why

- No bundle-size budget or Lighthouse CI was added. The app has no images, no client-side routing libraries beyond Next.js itself, and no large third-party scripts, so the highest-risk performance regression for this project is authored-content growth (more KaTeX per page), not JS bundle size. `e2e/accessibility.spec.ts`'s overflow check plus manual review of the module-grouped landing page were judged sufficient for this phase's scope; a dedicated performance budget is worth revisiting if/when the course adds media or a second course multiplies page count (see ROADMAP.md "What not to build yet").
