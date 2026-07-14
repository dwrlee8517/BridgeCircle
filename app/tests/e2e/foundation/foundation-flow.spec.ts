import { expect, test, type Page } from "@playwright/test";
import { isRemote } from "../helpers/env";
import { FoundationScenario } from "../helpers/foundation";

const browserErrors = new WeakMap<Page, string[]>();
const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.describe("database v2 Foundation", () => {
  test.skip(isRemote, "Foundation reset tests are local-only");
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    browserErrors.set(page, errors);
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  });

  test.afterEach(async ({ page }) => {
    expect(browserErrors.get(page), "browser console and page errors").toEqual([]);
  });

  test("invite → password signup → onboarding → redesigned shell", async ({ page }) => {
    const scenario = new FoundationScenario();
    try {
      const organization = await scenario.createOrganization(false, "Auto Circle");
      const invite = await scenario.createInvite(organization.id, { fullName: "Invited Ivy" });

      await page.goto(`/join?token=${invite.token}`);
      await expect(page.getByText("You're invited to")).toBeVisible();
      await expect(page.getByRole("heading", { name: organization.name })).toBeVisible();
      await page.locator("#password").fill("foundation-join-password-9");
      await page.getByRole("button", { name: "Create account" }).click();

      await page.waitForURL(/\/onboarding\?step=1/);
      await expect(page.locator("#name")).toHaveValue("Invited Ivy");
      await expect(page.locator("#graduationYear")).toHaveValue("2018");
      await page.getByRole("button", { name: "Save and continue" }).click();
      for (const step of [2, 3, 4]) {
        await page.waitForURL(new RegExp(`/onboarding\\?step=${step}`));
        await page.getByRole("button", { name: "Skip for now" }).click();
      }
      await page.waitForURL(/\/onboarding\?step=5/);
      await page.locator('input[type="file"]').setInputFiles({
        name: "avatar.png",
        mimeType: "image/png",
        buffer: transparentPng,
      });
      await expect(page.locator('img[alt="Invited Ivy"]')).toHaveAttribute(
        "src",
        /\/storage\/v1\/object\/public\/avatars\//,
      );
      await page.getByRole("button", { name: "Skip for now" }).click();
      await page.waitForURL((url) => url.pathname === "/");

      await expect(page.getByText(organization.name)).toBeVisible();
      await expect(page.getByRole("heading", { name: "Welcome, Invited." })).toBeVisible();
      await expect(page.getByLabel("Account menu")).toBeVisible();
      await expect(page.getByLabel("Account menu").locator("img")).toHaveAttribute(
        "src",
        /\/storage\/v1\/object\/public\/avatars\//,
      );

      const membership = await scenario.membershipForEmail(invite.email, organization.id);
      expect(membership.status).toBe("active");
      const { data: profile } = await scenario.admin
        .from("profiles")
        .select("avatar_path")
        .eq("user_id", membership.userId)
        .single();
      expect(profile?.avatar_path).toMatch(new RegExp(`^${membership.userId}/`));
      if (profile?.avatar_path) scenario.trackAvatarPath(profile.avatar_path);

      const { data: notification, error: notificationError } = await scenario.admin
        .from("notifications")
        .insert({
          recipient_user_id: membership.userId,
          organization_id: organization.id,
          type: "profile_update_ready",
          payload: {},
          dedupe_key: `foundation-profile-ready:${membership.userId}`,
        })
        .select("id")
        .single();
      expect(notificationError).toBeNull();
      expect(notification).not.toBeNull();

      await page.reload();
      await page.getByRole("button", { name: "Notifications (1 unread)" }).click();
      await expect(page.getByText("Your profile update is ready to review")).toBeVisible();
      await page.getByRole("button", { name: "Mark all as read" }).click();
      await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();
      await expect
        .poll(async () => {
          const { data } = await scenario.admin
            .from("notifications")
            .select("read_at")
            .eq("id", notification?.id ?? -1)
            .single();
          return data?.read_at ?? null;
        })
        .not.toBeNull();

      const { data: inviteRow } = await scenario.admin
        .from("invites")
        .select("status, accepted_by_user_id, accepted_at")
        .eq("email_normalized", invite.email.toLowerCase())
        .single();
      expect(inviteRow?.status).toBe("accepted");
      expect(inviteRow?.accepted_by_user_id).toBe(membership.userId);
      expect(inviteRow?.accepted_at).toBeTruthy();
    } finally {
      await scenario.destroy();
    }
  });

  test("a pending member finishes setup, waits safely, then enters after approval", async ({ page }) => {
    const scenario = new FoundationScenario();
    try {
      const organization = await scenario.createOrganization(true, "Approval Circle");
      const invite = await scenario.createInvite(organization.id, { fullName: "Pending Priya" });
      const admin = await scenario.createAdministrator(organization.id);

      await page.goto(`/join?token=${invite.token}`);
      await page.locator("#password").fill("foundation-pending-password-9");
      await page.getByRole("button", { name: "Create account" }).click();
      await page.getByRole("button", { name: "Save and continue" }).click();
      for (const step of [2, 3, 4, 5]) {
        await page.waitForURL(new RegExp(`/onboarding\\?step=${step}`));
        await page.getByRole("button", { name: "Skip for now" }).click();
      }

      await expect(page.getByRole("heading", { name: `Your ${organization.name} profile is ready.` })).toBeVisible();
      const membership = await scenario.membershipForEmail(invite.email, organization.id);
      expect(membership.status).toBe("pending");

      await scenario.approveMembership(admin.email, scenario.password, membership.id);
      await page.reload();
      await page.waitForURL((url) => url.pathname === "/");
      await expect(page.getByLabel("Account menu")).toBeVisible();
    } finally {
      await scenario.destroy();
    }
  });

  test("multiple circles require an explicit persisted choice", async ({ page }) => {
    const scenario = new FoundationScenario();
    try {
      const organization = await scenario.createOrganization(false, "Second Circle");
      await scenario.addMembershipForSeededUser(
        "10000000-0000-4000-8000-000000000002",
        organization.id,
      );

      await page.goto("/sign-in");
      await page.locator("#email").fill("richard@example.com");
      await page.locator("#password").fill("devseed-password-richard");
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await page.waitForURL(/\/select-circle/);
      await page.getByRole("button", { name: new RegExp(organization.name) }).click();
      await page.waitForURL((url) => url.pathname === "/");
      await expect(page.getByText(organization.name)).toBeVisible();
    } finally {
      await scenario.destroy();
    }
  });

  test("a foreign membership cookie is ignored by the database", async ({ page, context }) => {
    await page.goto("/sign-in");
    await page.locator("#email").fill("richard@example.com");
    await page.locator("#password").fill("devseed-password-richard");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL((url) => url.pathname === "/");

    await context.addCookies([
      {
        name: "bc_membership_id",
        value: "20000000-0000-4000-8000-000000000001",
        url: "http://localhost:3002",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/");
    await expect(page.getByText("Chadwick School (Local)")).toBeVisible();
    await expect(page.getByLabel("Account menu")).toBeVisible();
  });
});
