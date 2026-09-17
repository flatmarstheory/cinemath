import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const route = "/lesson/pfmm-m1-l1-statements-and-quantifiers";
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
async function choose(page: Page, id: string) {
  await page.locator(`input[value="${id}"]`).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
}

test("complete the lesson with keyboard controls, reloads, hints, and a gated solution", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await audit(page);
  await page.screenshot({
    path: testInfo.outputPath("course.png"),
    fullPage: true,
  });
  await page
    .getByRole("article")
    .filter({ hasText: "Statements, Truth Values" })
    .getByRole("link", { name: "Start lesson" })
    .click();
  await expect(
    page.getByRole("button", { name: "Start problem 1" }),
  ).toBeVisible();
  await audit(page);
  await page.getByRole("button", { name: "Start problem 1" }).click();
  const reveal = page.getByRole("button", { name: "Reveal worked solution" });
  await expect(reveal).toBeDisabled();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByText("0 attempts · Take your time")).toBeVisible();
  await page
    .getByRole("button", { name: "Reveal hint 1", exact: true })
    .click();
  await choose(page, "a");
  await expect(reveal).toBeDisabled();
  await page.reload();
  await expect(page.getByText("1 attempt · Take your time")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reveal hint 2", exact: true }),
  ).toBeEnabled();
  await choose(page, "d");
  await expect(reveal).toBeEnabled();
  await reveal.click();
  await expect(
    page.getByRole("heading", { name: "Why it works" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Why it works" }),
  ).toBeVisible();
  await audit(page);
  await page.getByRole("button", { name: "Next problem" }).click();
  await audit(page);
  await choose(page, "c");
  await page.getByRole("button", { name: "Next problem" }).click();
  await page.getByLabel("Outer quantifier").selectOption("exists");
  await page.getByLabel("Inner quantifier").selectOption("forall");
  await page
    .getByRole("combobox", { name: "Relation", exact: true })
    .selectOption("neq");
  await page.reload();
  await expect(page.getByLabel("Outer quantifier")).toHaveValue("exists");
  await audit(page);
  await page.screenshot({
    path: testInfo.outputPath("structured-answer.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Next problem" }).click();
  for (const step of [4, 3, 2, 4, 3, 4]) {
    const up = page.getByRole("button", {
      name: `Move step ${step} up`,
      exact: true,
    });
    await up.focus();
    await page.keyboard.press("Enter");
  }
  await audit(page);
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Correct ✓" })).toBeVisible();
  await page.getByRole("button", { name: "Next problem" }).click();
  await page.getByLabel("Integer n").fill("0.5");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByText("0 attempts · Take your time")).toBeVisible();
  await page.getByLabel("Integer n").fill("0");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "See your summary" }).click();
  await expect(
    page.getByRole("heading", { name: "A clearer way to think." }),
  ).toBeFocused();
  await expect(page.locator(".summary-grid")).toContainText("4 / 5");
  await expect(page.locator(".summary-grid > div").nth(1)).toContainText("6");
  await expect(page.locator(".summary-grid > div").nth(2)).toContainText(
    "1 across 1 problem",
  );
  await expect(page.locator(".summary-grid > div").nth(3)).toContainText("1");
  await audit(page);
  await page.screenshot({
    path: testInfo.outputPath("completion.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A clearer way to think." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to course" }).click();
  await expect(
    page.getByRole("link", { name: "View your results" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("recovers from corrupt storage and reports unavailable persistence", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Start problem 1" }).click();
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) =>
      k.startsWith("cinemath:"),
    );
    if (key) localStorage.setItem(key, "not json");
  });
  await page.reload();
  await expect(
    page.getByText(/Your saved progress could not be restored/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start problem 1" }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await choose(page, "b");
  await expect(
    page.getByText(/Your latest work could not be saved/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next problem" }),
  ).toBeEnabled();
});
