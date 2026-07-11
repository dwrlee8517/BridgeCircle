import { expect, test } from "@playwright/test";
import * as crypto from "node:crypto";
import { createAdminClient } from "../../../src/db/admin";
import { loadE2eEnv } from "../helpers/env";

/**
 * The core loop, end to end: invite → sign-up → onboarding → find a helper →
 * send an ask → helper accepts → first thread message.
 *
 * The invitee is a fresh email that is NOT in the seed, so this suite never
 * edits the seeded personas other suites rely on. The helper side uses the
 * seeded Mark Mentor. The beforeAll cleanup only matters for repeated local
 * runs with E2E_SKIP_RESET=1 — after a reset there is nothing to clean.
 */
const INVITEE_EMAIL = "e2e-invitee-ivan@example.com";
const INVITEE_NAME = "Ivan Invitee";
const INVITEE_PASSWORD = "e2e-invitee-password";

test.describe("Core User Loop", () => {
  let inviteToken = "";

  test.beforeAll(async () => {
    loadE2eEnv();

    const supabase = createAdminClient();

    // 1. Remove any invitee left over from a previous non-reset run
    //    (cascades from auth.users through the public schema).
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.warn("Warning listing users:", listError);
    }
    const existing = usersData?.users.find((u) => u.email === INVITEE_EMAIL);
    if (existing) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existing.id);
      if (deleteError) {
        console.warn(`Warning deleting user ${existing.id}:`, deleteError);
      }
    }

    const { error: deleteInviteError } = await supabase
      .from("invites")
      .delete()
      .eq("email", INVITEE_EMAIL);
    if (deleteInviteError) {
      console.warn("Warning deleting existing invites:", deleteInviteError);
    }

    // 2. Bind a fresh invite to the seeded organization.
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    if (orgsError || !orgs || orgs.length === 0) {
      throw new Error(`Failed to find an organization in database: ${orgsError?.message}`);
    }
    const orgId = orgs[0].id;

    inviteToken = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const { error: insertErr } = await supabase.from("invites").insert({
      organization_id: orgId,
      email: INVITEE_EMAIL,
      token: inviteToken,
      status: "pending",
      full_name: INVITEE_NAME,
      graduation_year: 2024,
      expires_at: expiresAt.toISOString(),
    });

    if (insertErr) {
      throw new Error(`Failed to insert fresh invite: ${insertErr.message}`);
    }
  });

  test("runs the full invite-signup-onboarding-request-accept-chat integration flow", async ({ page }) => {
    test.setTimeout(90000);
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // Phase 1: Join / Sign up
    await page.goto(`/join?token=${inviteToken}`);
    await expect(page.getByText(/You're invited to/i)).toBeVisible();
    await page.locator("#password").fill(INVITEE_PASSWORD);
    await page.getByRole("button", { name: /create account/i }).click();

    // Phase 2: Onboarding (Step 1 -> Steps 2-5 -> Dashboard)
    await page.waitForURL(/\/onboarding/);
    await expect(page.locator("#name")).toHaveValue(INVITEE_NAME);
    await expect(page.locator("#graduationYear")).toHaveValue("2024");
    await page.getByRole("button", { name: /save and continue/i }).click();

    // Step 2
    await page.waitForURL(/\/onboarding\?step=2/);
    await page.getByRole("button", { name: /skip for now/i }).click();

    // Step 3
    await page.waitForURL(/\/onboarding\?step=3/);
    await page.getByRole("button", { name: /skip for now/i }).click();

    // Step 4
    await page.waitForURL(/\/onboarding\?step=4/);
    await page.getByRole("button", { name: /skip for now/i }).click();

    // Step 5
    await page.waitForURL(/\/onboarding\?step=5/);
    await page.getByRole("button", { name: /skip for now/i }).click();

    // Redirect to the merged home/ask landing
    await page.waitForURL(/\/$/);
    await expect(page.getByRole("heading", { name: /Hi Ivan/i })).toBeVisible();

    // AskBar submissions stay inside Ask instead of redirecting into the People directory.
    await page.getByLabel(/find people who can help/i).fill("Mark Mentor");
    await page.getByRole("button", { name: /find people/i }).click();
    await page.waitForURL((url) => url.pathname === "/ask" && url.searchParams.get("nl") === "Mark Mentor");
    await expect(page.getByRole("heading", { name: /People who can help with this/i })).toBeVisible();
    await expect(page.getByText("People search")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Help$/ }).first()).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Mark Mentor").first()).toBeVisible();

    // Compose links live in the results (featured card "Ask {first}" or a
    // compact row's "Ask") — scope to main so the nav "Ask" link can't match.
    // Soft navigation intercepts /ask/new into the composer side sheet; the
    // URL still changes, and the guided advice flow renders inside the sheet
    // with the ask text carried into the situation field.
    await page.locator('main a[href*="/ask/new"]').first().click();
    await page.waitForURL(
      (url) => url.pathname === "/ask/new" && url.searchParams.get("intent") === "Mark Mentor",
    );
    await expect(page.locator("#situation")).toHaveValue("Mark Mentor");

    // Phase 3: Mentor Discovery & Request Mentorship
    await page.goto("/people");
    await page.locator("#nl").fill("Mark Mentor");
    await page.getByRole("button", { name: /search/i }).first().click();

    // Click on Mark Mentor's card
    await page.locator("a", { hasText: "Mark Mentor" }).first().click();
    await page.waitForURL(/\/profile\/[a-f0-9-]+/);

    // Ask for ongoing help
    const profileUrl = page.url();
    const mentorId = profileUrl.split("/").pop()?.split("?")[0];
    await page.goto(`/ask/new?to=${mentorId}&type=mentorship&skip=1`);
    await page.waitForURL(/\/ask\/new/);
    await page.locator("#helpNeeded").fill("I am looking for guidance on software engineering careers.");
    await page.getByRole("button", { name: /send ask/i }).click();

    // Verify request detailed page
    await page.waitForURL(/\/ask\/[a-f0-9-]+/);
    await expect(page.getByText(/pending/i)).toBeVisible();

    // Phase 4: Sign out as Ivan, Sign in as Mark Mentor
    await page.getByLabel("Account menu").click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await page.waitForURL(/\/sign-in/);

    // Log in as Mark Mentor (seeded persona)
    await page.locator("#email").fill("mentor-mark@example.com");
    await page.locator("#password").fill("devseed-password-2");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(/\/$/);

    // Phase 5: Inbox, Accept request & send chat message
    await page.goto("/inbox");
    await page.getByRole("button", { name: /^Requests\b/ }).click();
    await page.getByRole("button", { name: new RegExp(INVITEE_NAME, "i") }).first().click();

    // Accept request from the redesigned inline request detail panel
    await page.getByRole("button", { name: /accept & reply/i }).click();
    await page.waitForURL(/\/ask\/thread\/[a-f0-9-]+/);

    // Send chat message in thread
    await page.locator('textarea[name="body"]').fill("Hello Ivan, happy to connect.");
    await page.getByRole("button", { name: /^send$/i }).click();

    // Assert message appears
    await expect(page.getByText("Hello Ivan, happy to connect.")).toBeVisible();
  });
});
