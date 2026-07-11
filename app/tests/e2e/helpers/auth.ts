import { expect, type Page } from "@playwright/test";

/**
 * Sign in through the real form with a seeded persona (see
 * supabase/seeds/seed.sql for the cast and passwords) and wait for the
 * authenticated home page.
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/sign-in");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/$/);
  await expect(page.getByLabel("Account menu")).toBeVisible();
}
