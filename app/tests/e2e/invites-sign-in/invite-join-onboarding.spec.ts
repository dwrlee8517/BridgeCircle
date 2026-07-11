import { expect, test } from "@playwright/test";
import { TestScenario } from "../helpers/factory";

const scenario = new TestScenario("invite");

test.beforeAll(async () => {
  await scenario.createOrg();
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("a fresh invitee travels join link → account → onboarding → Help hub, and the database records every hop", async ({ page }) => {
  test.setTimeout(90_000);
  const invite = await scenario.createInvite({
    fullName: "Invited Ivy",
    graduationYear: 2018,
  });

  await page.goto(`/join?token=${invite.token}`);
  await expect(page.getByText("You're invited to")).toBeVisible();
  await expect(page.getByRole("heading", { name: scenario.orgName })).toBeVisible();
  await expect(page.locator("#email")).toHaveValue(invite.email);
  await expect(page.locator("#email")).toBeDisabled();

  await page.locator("#password").fill("integ-join-password-9");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL(/\/onboarding\?step=1/);
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
  await expect(page.locator("#name")).toHaveValue("Invited Ivy");
  await expect(page.locator("#graduationYear")).toHaveValue("2018");
  await page.getByRole("button", { name: "Save and continue" }).click();

  for (const step of [2, 3, 4]) {
    await page.waitForURL(new RegExp(`/onboarding\\?step=${step}`));
    await page.getByRole("button", { name: "Skip for now" }).click();
  }

  await page.waitForURL(/\/onboarding\?step=5/);
  await page.getByRole("button", { name: "Save and finish" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading", { name: /Hi Invited/ })).toBeVisible();

  const { data: inviteRow } = await scenario.admin
    .from("invites")
    .select("status, accepted_by, accepted_at")
    .eq("token", invite.token)
    .single();
  expect(inviteRow?.status).toBe("accepted");
  expect(inviteRow?.accepted_by).toBeTruthy();
  expect(inviteRow?.accepted_at).toBeTruthy();
  const newUserId = inviteRow?.accepted_by as string;
  scenario.trackUser(newUserId);

  const { data: membership } = await scenario.admin
    .from("organization_memberships")
    .select("status, joined_at")
    .eq("user_id", newUserId)
    .eq("organization_id", scenario.orgId)
    .single();
  expect(membership?.status).toBe("active");

  const { data: userRow } = await scenario.admin
    .from("users")
    .select("onboarding_completed_at")
    .eq("id", newUserId)
    .single();
  expect(userRow?.onboarding_completed_at).not.toBeNull();

  const { data: profile } = await scenario.admin
    .from("base_profiles")
    .select("name")
    .eq("user_id", newUserId)
    .single();
  expect(profile?.name).toBe("Invited Ivy");
});

test("visiting /join without a token explains the problem", async ({ page }) => {
  await page.goto("/join");
  await expect(page.getByText("No invite token")).toBeVisible();
});

test("a made-up token is rejected as unavailable", async ({ page }) => {
  await page.goto("/join?token=this-token-does-not-exist");
  await expect(page.getByText("Invite unavailable")).toBeVisible();
  await expect(page.getByText(/This invite link is not valid/)).toBeVisible();
});

test("an expired invite tells the invitee to ask for a new one", async ({ page }) => {
  const expired = await scenario.createInvite({ expiresInDays: -1 });
  await page.goto(`/join?token=${expired.token}`);
  await expect(page.getByText("Invite unavailable")).toBeVisible();
  await expect(page.getByText(/This invite has expired/)).toBeVisible();
});

test("a revoked invite says so plainly", async ({ page }) => {
  const revoked = await scenario.createInvite({ status: "revoked" });
  await page.goto(`/join?token=${revoked.token}`);
  await expect(page.getByText("This invite has been revoked.")).toBeVisible();
});

test("an already-used invite points at sign-in instead", async ({ page }) => {
  const used = await scenario.createInvite({ status: "accepted" });
  await page.goto(`/join?token=${used.token}`);
  await expect(page.getByText(/This invite has already been used/)).toBeVisible();
});
