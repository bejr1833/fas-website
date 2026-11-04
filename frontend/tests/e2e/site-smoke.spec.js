import { test, expect } from "@playwright/test";

test("homepage renders its main content without a React crash", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("main")).toBeVisible();

  // A backend cold start must not leave the page stuck in a loading shell.
  await expect(page.locator("body")).not.toContainText("Loading homepage...", { timeout: 12_000 });
  expect(pageErrors, "Unexpected uncaught browser errors").toEqual([]);
});

test("homepage clearly identifies Faith Alone Saves as FAS Fellowship", async ({ page }) => {
  await page.goto("/");
  const identityIntro = page.getByText(
    "Faith Alone Saves (FAS Fellowship) is a Christ-centered",
    { exact: false }
  );

  // Verify the rendered copy independently of the scroll-reveal animation state.
  await expect(identityIntro).toHaveCount(1);
  await expect(identityIntro).toContainText(
    "Faith Alone Saves (FAS Fellowship) is a Christ-centered student community"
  );
  await expect(page.getByRole("heading", { name: /A fellowship for students who want to know, grow and serve/i })).toBeVisible();
});

