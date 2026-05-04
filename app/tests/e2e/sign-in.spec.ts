import { expect, test } from "@playwright/test";

/**
 * Smoke test: an unauthenticated visitor hitting `/` should be redirected
 * to the sign-in page, and the sign-in page should render the expected UI.
 *
 * Asserts the auth middleware is wired up and the sign-in page itself
 * builds without errors. If this fails, something is wrong with either
 * the middleware redirect or the sign-in page render.
 */
test.describe("sign-in", () => {
  test("redirects unauthenticated root visit to /sign-in", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page).toHaveTitle(/BridgeCircle/);

    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByText(/sign in to bridgecircle/i)).toBeVisible();

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
  });
});
