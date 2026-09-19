# Phase 6: Accessibility Audit

CLAUDE.md treats accessibility and keyboard navigation as an acceptance criterion, not a follow-up pass. This audit covers every page added or materially changed in Phase 6, on top of the automated checks Phase 1 already established.

## What already existed (Phase 1)

`e2e/lesson.spec.ts` runs an `audit()` helper against the course and lesson pages on every test run: `@axe-core/playwright` (zero violations), a check that `document.documentElement.scrollWidth <= innerWidth` (no horizontal overflow), and a check for `.katex-error` elements (math that failed to render). It runs under both the `desktop` (1440×1000) and `mobile` (360×800, touch-emulated) Playwright projects.

## What Phase 6 added

`e2e/accessibility.spec.ts` runs the same `audit()` pattern against every new page:

- `/glossary`
- `/search` (both empty and with a query typed in, since the results list re-renders)
- `/course/prerequisites`
- `/certificate` (pre-completion state; the post-completion certificate view is exercised manually, see below, since reaching it requires completing every lesson)

## Manual review

- **Landing page module grouping** (`src/app/page.tsx`): module headings use `<h3>` inside a page that already has one `<h1>` and the hero's own headings; heading order was checked to stay logical (no skipped levels within a module group) and each lesson card's action link has a clear accessible name via `LessonLink`.
- **Glossary** (`src/app/glossary/page.tsx`): each term is a `<dl>` entry with an `id` anchor for direct linking (`scroll-margin-top` set in CSS so a jump doesn't hide the heading under the sticky-feeling header); "See also" links use the term's full name, not "click here."
- **Search** (`src/components/search-client.tsx`): the input has a visible, programmatically-associated `<label>`; result counts update in the DOM text itself (no separate `aria-live` region was judged necessary since the results are a normal re-rendered list a screen reader will read on next navigation, not a transient toast — this mirrors the existing pattern in `lesson-player.tsx`'s non-live summary sections, while `role="status"`/`aria-live="polite"` is reserved for the feedback/storage-message regions that genuinely need an announcement without a focus move).
- **Prerequisite map** (`src/app/course/prerequisites/page.tsx`): implemented as a nested, keyboard-navigable `<ol>`/`<dl>` list rather than an SVG or canvas graph, specifically so every dependency edge is available as real, linked text with no separate accessible-name effort — every concept name links to its glossary definition.
- **Certificate** (`src/components/certificate.tsx`): the pre-completion state shows a `<progress>` element with an `aria-label`; the earned certificate is plain text and headings (no image), so it's fully readable by assistive technology and legible when printed in black and white; the "Print / Save as PDF" button is hidden from print output via `.no-print` rather than relying on `window.print()`'s own UI.
- **Admin pages** (`/admin/content`): reuses the exact token-form pattern already audited for `/admin/metrics` in Phase 5 (a `<label>`-wrapped password input, a submit button with a loading state announced via its own text change). Not covered by automated axe checks because, like `/admin/metrics`, it requires a token and is operator-only, not learner-facing — this matches the existing precedent for that route.
- **Header navigation** (`src/app/layout.tsx`): the four new links (Map, Glossary, Search, Certificate) are grouped in a `<nav aria-label="Course tools">` so screen reader users can jump past them as a unit; on narrow viewports they collapse to keep the dashboard link (the one learners use most) reachable without horizontal scrolling (see the `max-width: 1000px` rule in `globals.css`).

## Known limitation

The post-completion certificate view and the `/admin/content` table are not exercised by the automated axe suite (the former needs a fully completed course to reach; the latter is operator-only and token-gated, consistent with `/admin/metrics`). Both were checked manually against the same criteria as the automated pages.
