import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("account progress resumes across browsers and targeted review preserves it", async ({
  page,
  browser,
}) => {
  const username = `learner_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const password = "a-unique-long-password";
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page.getByText(`Signed in as ${username}.`)).toBeVisible();
  await page.getByLabel("Display name (optional)").fill("Ada");
  await expect(page.getByText("Settings saved.")).toBeVisible();
  await page.getByRole("link", { name: "Start →" }).first().click();
  await page.getByRole("button", { name: "Start problem 1" }).click();
  await page.locator('input[value="a"]').check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByText("Progress saved to your account.")).toBeVisible();
  const route = new URL(page.url()).pathname;
  const second = await browser.newContext();
  const other = await second.newPage();
  try {
    await other.goto("http://127.0.0.1:3100/dashboard");
    await other.getByLabel("Username", { exact: true }).fill(username);
    await other.getByLabel("Password", { exact: true }).fill(password);
    await other.getByRole("button", { name: "Sign in to continue" }).click();
    await expect(
      other.getByRole("heading", { name: "Ada's dashboard" }),
    ).toBeVisible();
    await other.getByRole("link", { name: "Resume →" }).first().click();
    await expect(other.getByText("1 attempt · Take your time")).toBeVisible();
    await expect(other.locator('input[value="a"]')).toBeChecked();
    await other.goto("http://127.0.0.1:3100/dashboard");
    expect(
      (await new AxeBuilder({ page: other }).analyze()).violations,
    ).toEqual([]);
    await other.getByRole("link", { name: "Practice →" }).first().click();
    await expect(other.getByText("TARGETED REVIEW")).toBeVisible();
    await other.locator('input[value="b"]').check();
    await other
      .getByRole("button", { name: "Check answer", exact: true })
      .click();
    await expect(
      other.getByText("Progress saved to your account."),
    ).toBeVisible();
    const data = await (
      await other.request.get("http://127.0.0.1:3100/api/learner")
    ).json();
    const saved = JSON.parse(data.progress[0].value).progress;
    expect(saved.reviewAttempts).toHaveLength(1);
    expect(saved.records[0].attempts).toHaveLength(1);
    expect(saved.index).toBe(0);
    await other.goto(`http://127.0.0.1:3100${route}`);
    await expect(other.getByText("1 attempt · Take your time")).toBeVisible();
    await other.goto("http://127.0.0.1:3100/dashboard");
    const downloadPromise = other.waitForEvent("download");
    await other
      .getByRole("button", { name: "Download my learning data" })
      .click();
    expect((await downloadPromise).suggestedFilename()).toBe(
      "cinemath-learning-data.json",
    );
    other.on("dialog", (dialog) => dialog.accept());
    await other
      .getByRole("button", { name: "Delete account permanently" })
      .click();
    await expect(
      other.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Start problem 1" }),
    ).toBeVisible();
  } finally {
    await second.close();
  }
});
