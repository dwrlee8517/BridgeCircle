import { expect, test } from "@playwright/test";
import { signInAs } from "../helpers/auth";
import { FoundationScenario, type FoundationMember } from "../helpers/foundation";

const scenario = new FoundationScenario();
let member: FoundationMember;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const organization = await scenario.createOrganization(false, "Help Settings");
  member = await scenario.createMember(organization.id, "Volunteer");
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("a member without saved preferences starts default-open, and saving writes v2 availability and normalized topics", async ({ page }) => {
  await signInAs(page, member);
  await page.goto("/help/settings");

  const availabilityToggle = page.getByRole("checkbox", { name: "Open to helping" });
  await expect(availabilityToggle).toBeChecked();
  await expect(page.getByText("Visible").filter({ visible: true })).toBeVisible();

  await page
    .locator("#topics")
    .filter({ visible: true })
    .fill("careers, product management");
  await page.getByRole("button", { name: "Save settings" }).click();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("helper_preferences")
        .select("open_to_help, paused_at, pause_reason")
        .eq("organization_membership_id", member.membershipId)
        .maybeSingle();
      const { data: topics } = await scenario.admin
        .from("helper_topics")
        .select("name, sort_order")
        .eq("organization_membership_id", member.membershipId)
        .order("sort_order");
      return { preferences: data, topics };
    })
    .toEqual({
      preferences: {
        open_to_help: true,
        paused_at: null,
        pause_reason: null,
      },
      topics: [
        { name: "careers", sort_order: 0 },
        { name: "product management", sort_order: 1 },
      ],
    });
});

test("turning availability off records a manual pause and removes disabled topics", async ({ page }) => {
  await signInAs(page, member);
  await page.goto("/help/settings");

  await page.getByRole("checkbox", { name: "Open to helping" }).uncheck();
  await expect(page.getByText("Off").filter({ visible: true })).toBeVisible();
  await expect(page.locator("#topics").filter({ visible: true })).toBeDisabled();
  await page.getByRole("button", { name: "Save settings" }).click();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("helper_preferences")
        .select("open_to_help, paused_at, pause_reason")
        .eq("organization_membership_id", member.membershipId)
        .maybeSingle();
      const { count } = await scenario.admin
        .from("helper_topics")
        .select("*", { count: "exact", head: true })
        .eq("organization_membership_id", member.membershipId);
      return {
        openToHelp: data?.open_to_help,
        paused: Boolean(data?.paused_at),
        pauseReason: data?.pause_reason,
        topicCount: count,
      };
    })
    .toEqual({
      openToHelp: false,
      paused: true,
      pauseReason: "manual",
      topicCount: 0,
    });
});
