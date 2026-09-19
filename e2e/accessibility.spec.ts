import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Phase 6 accessibility audit (ROADMAP.md): every new page added in this
// phase gets the same automated check e2e/lesson.spec.ts already runs for
// the course and lesson pages — axe-core violations, no horizontal
// overflow at the current viewport (desktop and mobile projects both run
// this file), and no KaTeX render failures.
async function audit(page: Page) {
  expect
    .soft((await new AxeBuilder({ page }).analyze()).violations)
    .toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".katex-error")).toHaveCount(0);
}

test("glossary page is accessible", async ({ page }) => {
  await page.goto("/glossary");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await audit(page);
});

test("search page is accessible and filters results", async ({ page }) => {
  await page.goto("/search");
  await audit(page);
  await page.getByLabel("Search term").fill("induction");
  await expect(page.getByText(/\d+ matches?/i).first()).toBeVisible();
  await audit(page);
});

test("prerequisite map page is accessible", async ({ page }) => {
  await page.goto("/course/prerequisites");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await audit(page);
});

test("certificate page is accessible before completion", async ({ page }) => {
  await page.goto("/certificate");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await audit(page);
});
