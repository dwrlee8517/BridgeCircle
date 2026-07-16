import { expect, test } from "@playwright/test";
import {
  FoundationScenario,
  type FoundationMember,
} from "../helpers/foundation";
import { signInAs, signOut } from "../helpers/auth";

const scenario = new FoundationScenario();
let organizationId: string;
let activeMember: FoundationMember;
let unonboardedMember: FoundationMember;

test.beforeAll(async () => {
  organizationId = (await scenario.createOrganization(false, "Auth Circle")).id;
  activeMember = await scenario.createMember(organizationId, "Active");
  unonboardedMember = await scenario.createMember(organizationId, "Unonboarded", {
    onboardingCompleted: false,
  });
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("wrong password shows 'Invalid email or password.' and stays on the sign-in page", async ({ page }) => {
  await page.goto("/sign-in");
  await page.locator("#email").fill(activeMember.email);
  await page.locator("#password").fill("definitely-the-wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByText("Invalid email or password.")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in/);
});

test("a signed-in member lands on Home greeted by first name with all five nav sections", async ({ page }) => {
  await signInAs(page, activeMember);

  await expect(page).toHaveURL("/");
  const firstName = activeMember.name.split(" ")[0];
  await expect(
    page.getByRole("heading", { name: new RegExp(`Welcome, ${firstName}`) }),
  ).toBeVisible();

  const nav = page.getByRole("navigation");
  await expect(nav.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("href", "/");
  await expect(nav.getByRole("link", { name: "Help", exact: true })).toHaveAttribute("href", "/help");
  await expect(nav.getByRole("link", { name: "People", exact: true })).toHaveAttribute("href", "/people");
  await expect(nav.getByRole('link', { name: 'Messages', exact: true })).toHaveAttribute(
    'href',
    '/messages',
  )
  await expect(nav.getByRole("link", { name: "School", exact: true })).toHaveAttribute("href", "/school");
});

test("the ?next= target survives the sign-in round trip", async ({ page }) => {
  await page.goto("/school");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fschool/);

  await page.locator("#email").fill(activeMember.email);
  await page.locator("#password").fill(activeMember.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await page.waitForURL(/\/school/);
  await expect(
    page.getByRole("heading", { name: "Close to school, not buried in it." }),
  ).toBeVisible();
});

test("a member who never finished onboarding is routed into the wizard instead of Home", async ({ page }) => {
  await page.goto("/sign-in");
  await page.locator("#email").fill(unonboardedMember.email);
  await page.locator("#password").fill(unonboardedMember.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await page.waitForURL(/\/onboarding/);
  await expect(
    page.getByRole("heading", { name: /Welcome|Let's set up/ }),
  ).toBeVisible();
});

test("signing out returns to /sign-in and re-locks member pages", async ({ page }) => {
  await signInAs(page, activeMember);
  await signOut(page);

  await page.goto('/messages')
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmessages/)
});
