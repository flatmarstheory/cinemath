import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const slug = "linear-algebra-beyond-computation";
test("course selection, lesson completion, persistence, search, and certificate isolation", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", {
      name: "Linear Algebra Beyond Computation",
      exact: true,
    })
    .click();
  await expect(page.locator("#course")).toContainText("13 available lessons");
  await page.locator(".lesson-card").first().getByRole("link").click();
  await expect(page).toHaveURL(/labc-m1-vectors-as-objects/);
  await page.getByRole("button", { name: "Start problem 1" }).click();
  await page.locator('input[value="b"]').check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Next problem" }).click();
  await page.getByLabel("Number", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Correct ✓" })).toBeVisible();
  await page.getByRole("button", { name: "Next problem" }).click();
  await page.locator('input[value="c"]').check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Next problem" }).click();
  await page.getByLabel("First scalar", { exact: true }).fill("a");
  await page.getByLabel("Second scalar", { exact: true }).fill("b");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Next problem" }).click();
  for (const step of [4, 3, 2, 4, 3, 4])
    await page
      .getByRole("button", { name: `Move step ${step} up`, exact: true })
      .click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Correct ✓" })).toBeVisible();
  await page.getByRole("button", { name: "See your summary" }).click();
  await expect(page.locator(".summary-grid")).toContainText("5 / 5");
  await page.getByRole("link", { name: "Back to course" }).click();
  await expect(page).toHaveURL(new RegExp(`course=${slug}`));
  await page.goto(`/certificate?course=${slug}`);
  await expect(page.getByText(/finished 1 of 13/)).toBeVisible();
  await page
    .getByRole("link", { name: "Proofs for Modern Mathematics", exact: true })
    .click();
  await expect(page.getByText(/finished 0 of 28/)).toBeVisible();
  await page.goto(`/course/prerequisites?course=${slug}`);
  await expect(
    page.getByRole("link", { name: "Capstone: recognize the structure" }),
  ).toBeVisible();
  await page.goto("/search");
  await page.getByLabel("Search term").fill("eigen");
  await expect(
    page.getByRole("heading", {
      name: "Directions a transformation preserves",
    }),
  ).toBeVisible();
});

test("account modes, password visibility, failed login, and accessibility", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "autocomplete",
    "new-password",
  );
  await expect(
    page.getByText(/password recovery isn’t available/),
  ).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("test-password-long");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Hide password" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.locator(".account-card").screenshot({
    path: `test-results/account-register-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByLabel("Username", { exact: true })
    .fill("missing_account_123");
  await page.getByLabel("Password", { exact: true }).press("Enter");
  await expect(page.locator(".account-error")).toHaveText(
    "Invalid username or password.",
  );
  await expect(
    page.getByRole("button", { name: "Sign in to continue" }),
  ).toBeEnabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.locator(".account-card").screenshot({
    path: `test-results/account-login-${test.info().project.name}.png`,
  });
});
