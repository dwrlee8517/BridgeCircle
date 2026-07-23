import { expect, test } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { createAdminClient } from "../../src/db/admin";

// Manually load environment variables from .env.local for the Playwright test runner environment
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] ??= val;
      }
    }
  }
}

// Feature tags map this suite into parity/features.json coverage — the
// core loop exercises each of these surfaces end-to-end.
test.describe(
  "Core User Loop",
  {
    tag: [
      "@feature:auth.join-invite",
      "@feature:auth.sign-in",
      "@feature:onboarding",
      "@feature:help.hub",
      "@feature:ask.matching",
      "@feature:ask.compose",
      "@feature:ask.detail",
      "@feature:ask.thread",
      "@feature:people.directory",
      "@feature:profile.view",
      "@feature:inbox.unified",
      "@feature:shell.navigation",
    ],
  },
  () => {
  let inviteToken = "";

  test.beforeAll(async () => {
    loadEnv();

    const supabase = createAdminClient();

    // 1. Clean up existing student-sam@example.com from auth.users (cascades to public schema)
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.warn("Warning listing users:", listError);
    }
    const samUser = usersData?.users.find((u) => u.email === "student-sam@example.com");
    if (samUser) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(samUser.id);
      if (deleteError) {
        console.warn(`Warning deleting user ${samUser.id}:`, deleteError);
      }
    }

    // 2. Clean up any existing invite for student-sam@example.com in the invites table
    const { error: deleteInviteError } = await supabase
      .from("invites")
      .delete()
      .eq("email", "student-sam@example.com");
    if (deleteInviteError) {
      console.warn("Warning deleting existing invites:", deleteInviteError);
    }

    // 3. Retrieve first organization to dynamically bind to invite
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    if (orgsError || !orgs || orgs.length === 0) {
      throw new Error(`Failed to find an organization in database: ${orgsError?.message}`);
    }
    const orgId = orgs[0].id;

    // 4. Insert a fresh invite row for student-sam@example.com
    inviteToken = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const { error: insertErr } = await supabase
      .from("invites")
      .insert({
        organization_id: orgId,
        email: "student-sam@example.com",
        token: inviteToken,
        status: "pending",
        full_name: "Student Sam",
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
    await page.locator("#password").fill("devseed-password-6");
    await page.getByRole("button", { name: /create account/i }).click();

    // Phase 2: Onboarding (Step 1 -> Steps 2-5 -> Dashboard)
    await page.waitForURL(/\/onboarding/);
    await expect(page.locator("#name")).toHaveValue("Student Sam");
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
    await expect(page.getByRole("heading", { name: /Hi Student/i })).toBeVisible();

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

    // Phase 4: Sign out as Sam, Sign in as Mark Mentor
    await page.getByLabel("Account menu").click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await page.waitForURL(/\/sign-in/);

    // Log in as Mark Mentor
    await page.locator("#email").fill("mentor-mark@example.com");
    await page.locator("#password").fill("devseed-password-2");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL(/\/$/);

    // Phase 5: Inbox, Accept request & send chat message
    await page.goto("/inbox");
    await page.getByRole("button", { name: /^Requests\b/ }).click();
    await page.getByRole("button", { name: /Student Sam/i }).first().click();

    // Accept request from the redesigned inline request detail panel
    await page.getByRole("button", { name: /accept & reply/i }).click();
    await page.waitForURL(/\/ask\/thread\/[a-f0-9-]+/);

    // Send chat message in thread
    await page.locator('textarea[name="body"]').fill("Hello Sam, happy to connect.");
    await page.getByRole("button", { name: /^send$/i }).click();

    // Assert message appears
    await expect(page.getByText("Hello Sam, happy to connect.")).toBeVisible();
  });
});
