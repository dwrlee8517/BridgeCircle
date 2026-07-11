import { expect, test } from "@playwright/test";
import { TestScenario, type SeededMember } from "../helpers/factory";
import { signInAs } from "../helpers/auth";

const scenario = new TestScenario("helpset");
let member: SeededMember;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  member = await scenario.createMember("volunteer");
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("a member without saved preferences starts default-open, and saving writes both legacy flags plus topics", async ({ page }) => {
  await signInAs(page, member);
  await page.goto("/help/settings");

  const availabilityToggle = page.getByRole("checkbox", { name: "Open to helping" });
  await expect(availabilityToggle).toBeChecked();
  await expect(page.getByText("Visible")).toBeVisible();

  await page.locator("#topics").fill("careers, product management");
  await page.getByRole("button", { name: "Save settings" }).click();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("helper_preferences")
        .select("open_to_advice, open_to_mentorship, topics")
        .eq("organization_membership_id", member.membershipId)
        .maybeSingle();
      return data;
    })
    .toEqual({
      open_to_advice: true,
      open_to_mentorship: true,
      topics: ["careers", "product management"],
    });
});

test("the profile now advertises Open to help", async ({ page }) => {
  await signInAs(page, member);
  await page.goto(`/profile/${member.userId}`);
  await expect(page.getByText("Open to help").first()).toBeVisible();
});

test("turning availability off writes both flags off together and disables the topics field", async ({ page }) => {
  await signInAs(page, member);
  await page.goto("/help/settings");

  await page.getByRole("checkbox", { name: "Open to helping" }).uncheck();
  await expect(page.getByText("Off")).toBeVisible();
  await expect(page.locator("#topics")).toBeDisabled();
  await page.getByRole("button", { name: "Save settings" }).click();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("helper_preferences")
        .select("open_to_advice, open_to_mentorship")
        .eq("organization_membership_id", member.membershipId)
        .maybeSingle();
      return data;
    })
    .toEqual({
      open_to_advice: false,
      open_to_mentorship: false,
    });
});
