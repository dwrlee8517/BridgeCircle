import { expect, test } from "@playwright/test";
import { signIn } from "../helpers/auth";

/**
 * Events & RSVP against the seeded world: the upcoming seeded events are
 * listed, and RSVPing to one flips the button state. Richard is seeded as
 * going to the Roundtable and the Mixer but NOT to Songdo Alumni Coffee —
 * that's the one this suite RSVPs to, so the mutation touches a
 * (richard, songdo-coffee) row no other suite reads.
 */
test.describe("events", () => {
  test("lists the seeded upcoming events", async ({ page }) => {
    await signIn(page, "richard@example.com", "devseed-password-richard");

    await page.goto("/events");
    await expect(page.getByText("Tech & Product Roundtable").first()).toBeVisible();
    await expect(page.getByText("Spring Alumni Mixer (Palos Verdes)").first()).toBeVisible();
    await expect(page.getByText("Songdo Alumni Coffee").first()).toBeVisible();
  });

  test("RSVPs to a seeded event", async ({ page }) => {
    await signIn(page, "richard@example.com", "devseed-password-richard");

    await page.goto("/events");
    await page.getByText("Songdo Alumni Coffee").first().click();

    // Not going yet (the seed leaves this one open for Richard).
    const rsvpButton = page.getByRole("button", { name: /RSVP - I'm going/i }).first();
    await expect(rsvpButton).toBeVisible();
    await rsvpButton.click();

    await expect(page.getByRole("button", { name: /You're going/i }).first()).toBeVisible();
  });
});
