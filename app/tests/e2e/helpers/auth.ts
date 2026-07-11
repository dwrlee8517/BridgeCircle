import { expect, type Page } from "@playwright/test";
import type { SeededMember } from "./factory";

export async function signIn(page: Page, member: Pick<SeededMember, "email" | "password">) {
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.locator("#email").fill(member.email);
  await page.locator("#password").fill(member.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
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
