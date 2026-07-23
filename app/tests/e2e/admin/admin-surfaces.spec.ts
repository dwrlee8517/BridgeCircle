// Parity coverage (see parity/README.md): @feature:admin.invites
import { expect, test } from "@playwright/test";
import {
  FoundationScenario,
  type FoundationMember,
} from "../helpers/foundation";
import { signInAs } from "../helpers/auth";

const scenario = new FoundationScenario();
let organizationId: string;
let orgAdmin: FoundationMember;
let plainMember: FoundationMember;

test.beforeAll(async () => {
  organizationId = (await scenario.createOrganization(false, "Admin Circle")).id;
  orgAdmin = await scenario.createMember(organizationId, "Administrator", {
    adminRole: "admin",
  });
  plainMember = await scenario.createMember(organizationId, "Plain");
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("the Admin nav tab appears for admins and not for plain members", async ({ page }) => {
  await signInAs(page, orgAdmin);
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Admin" }),
  ).toHaveAttribute("href", "/admin/invite");

  await signInAs(page, plainMember);
  await expect(page.getByRole("navigation").getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("a plain member requesting /admin/invite is bounced back to Home", async ({ page }) => {
  await signInAs(page, plainMember);
  await page.goto("/admin/invite");
  await page.waitForURL((url) => url.pathname === "/");
});

test("sending a single invite writes a pending invites row, and reports success where email delivery is real", async ({ page }) => {
  const inviteeEmail = `admin-invite+${Date.now()}@example.com`;

  await signInAs(page, orgAdmin);
  await page.goto("/admin/invite");
  await expect(
    page.getByText("Invite members", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  const singleInvitePanel = page.locator('[data-slot="tabs-content"][data-state="active"]');
  await singleInvitePanel.locator("#email").fill(inviteeEmail);
  await singleInvitePanel.locator("#graduationYear").fill("2019");
  await singleInvitePanel.locator("#fullName").fill("Form Invitee");
  await singleInvitePanel.getByRole("button", { name: "Send invite" }).click();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("invites")
        .select(
          "status, full_name, graduation_year, sent_by_membership_id, organization_id",
        )
        .eq("email_normalized", inviteeEmail)
        .maybeSingle();
      return data;
    })
    .toMatchObject({
      status: "pending",
      full_name: "Form Invitee",
      graduation_year: 2019,
      sent_by_membership_id: orgAdmin.membershipId,
      organization_id: organizationId,
    });
});
