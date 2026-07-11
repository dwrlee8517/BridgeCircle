import { expect, test } from "@playwright/test";
import { signIn } from "../helpers/auth";

/**
 * Sign-in flows: the unauthenticated redirect smoke test, and a real sign-in
 * with a seeded persona (supabase/seeds/seed.sql) landing on the home page.
 */
test.describe("sign-in", () => {
  test("redirects unauthenticated root visit to /sign-in", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page).toHaveTitle(/BridgeCircle/);

    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(
      page.getByText(/sign in to your verified alumni network/i),
    ).toBeVisible();

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
  });

  test("signs in a seeded member and lands on the home page", async ({ page }) => {
    await signIn(page, "richard@example.com", "devseed-password-richard");

    await expect(page.getByRole("heading", { name: /Hi Richard/i })).toBeVisible();
  });
});
