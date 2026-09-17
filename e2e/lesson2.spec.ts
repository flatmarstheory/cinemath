import { test, expect, type Page } from "@playwright/test";

const route = "/lesson/pfmm-m1-l2-compound-statements-and-connectives";

async function choose(page: Page, id: string) {
  await page.locator(`input[value="${id}"]`).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
}
async function next(page: Page) {
  await page.getByRole("button", { name: "Next problem" }).click();
}

test("completes a fill-in-the-blank problem and a numeric problem end to end", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByRole("button", { name: "Start problem 1" }).click();
  await choose(page, "d");
  await next(page);
  await choose(page, "b");
  await next(page);

  // proof_fill_blank: labeled inputs, graded case- and whitespace-insensitively.
  await page.getByLabel("P → Q", { exact: true }).fill("f");
  await page.getByLabel("P ∨ Q", { exact: true }).fill(" True ");
  await page.getByLabel("¬P", { exact: true }).fill("F");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Correct ✓" })).toBeVisible();
  await next(page);

  // numeric
  await page.getByLabel("Number", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Correct ✓" })).toBeVisible();
  await next(page);

  // proof_ordering: reverse the default (fully reversed) order back to s1..s4.
  for (const step of [4, 3, 2, 4, 3, 4]) {
    const up = page.getByRole("button", {
      name: `Move step ${step} up`,
      exact: true,
    });
    await up.focus();
    await page.keyboard.press("Enter");
  }
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Correct ✓" })).toBeVisible();
  await page.getByRole("button", { name: "See your summary" }).click();
  await expect(page.locator(".summary-grid")).toContainText("5 / 5");
});

test("preview mode shows a banner and does not persist across reloads", async ({
  page,
}) => {
  await page.goto(`${route}?preview=1`);
  await expect(page.getByText("PREVIEW", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start problem 1" }).click();
  await choose(page, "d");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Start problem 1" }),
  ).toBeVisible();
});
