import { expect, type Page } from "@playwright/test";
import type { SeededMember } from "./factory";

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

// Factory-seeded members switch identity mid-test, so clear the previous
// session's cookies before signing in.
export async function signInAs(page: Page, member: Pick<SeededMember, "email" | "password">) {
  await page.context().clearCookies();
  await signIn(page, member.email, member.password);
}

export async function signOut(page: Page) {
  await page.getByLabel("Account menu").click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);
}

// Thread composers reset their form on hydration, so a fill that lands
// before hydration gets wiped and the required-field submit silently no-ops.
export async function sendComposerMessage(page: Page, body: string) {
  await page.waitForLoadState("networkidle");
  const composer = page.locator('textarea[name="body"]');
  await composer.fill(body);
  await expect(composer).toHaveValue(body);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(body)).toBeVisible();
}
