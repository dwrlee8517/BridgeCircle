import { expect, test } from "@playwright/test";
import { TestScenario, type SeededMember } from "./helpers/factory";
import { signIn } from "./helpers/auth";

const scenario = new TestScenario("admin");
let orgAdmin: SeededMember;
let plainMember: SeededMember;

test.beforeAll(async () => {
  orgAdmin = await scenario.createMember("orgadmin", { adminRole: "admin" });
  plainMember = await scenario.createMember("plain");
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("the Admin nav tab appears for admins and not for plain members", async ({ page }) => {
  await signIn(page, orgAdmin);
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Admin" }),
  ).toHaveAttribute("href", "/admin/invite");

  await signIn(page, plainMember);
  await expect(page.getByRole("navigation").getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("a plain member requesting /admin/invite is bounced back to the Help hub", async ({ page }) => {
  await signIn(page, plainMember);
  await page.goto("/admin/invite");
  await page.waitForURL((url) => url.pathname === "/");
});

test("sending a single invite reports success, fills the recent-invites table, and writes a pending invites row", async ({ page }) => {
  const inviteeEmail = scenario.emailFor("form-invitee");

  await signIn(page, orgAdmin);
  await page.goto("/admin/invite");
  await expect(page.getByText("Invite alumni")).toBeVisible();

  await page.locator("#email").fill(inviteeEmail);
  await page.locator("#graduationYear").fill("2019");
  await page.locator("#fullName").fill("Form Invitee");
  await page.getByRole("button", { name: "Send invite" }).click();

  await expect(page.getByText(`Invite sent to ${inviteeEmail}.`)).toBeVisible();
  await expect(page.getByText(inviteeEmail).first()).toBeVisible();

  const { data: invite } = await scenario.admin
    .from("invites")
    .select("status, full_name, graduation_year, token, sent_by, organization_id")
    .eq("email", inviteeEmail)
    .single();
  expect(invite).toMatchObject({
    status: "pending",
    full_name: "Form Invitee",
    graduation_year: 2019,
    sent_by: orgAdmin.userId,
    organization_id: scenario.orgId,
  });
  expect(invite?.token).toBeTruthy();
});

test("publishing an event through the admin form makes it visible on the member events page", async ({ page }) => {
  const eventTitle = `Admin Published Social ${scenario.runId}`;
  const startsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const localDatetime = new Date(startsAt.getTime() - startsAt.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);

  await signIn(page, orgAdmin);
  await page.goto("/admin/events");
  await page.locator("#title").fill(eventTitle);
  await page.locator("#startsAt").fill(localDatetime);
  await page.locator("#location").fill("Courtyard");
  await page.getByRole("button", { name: "Publish event" }).click();
  await expect(page.getByText("Event published.")).toBeVisible();

  const { data: event } = await scenario.admin
    .from("events")
    .select("title, location, published_at, organization_id, created_by")
    .eq("title", eventTitle)
    .single();
  expect(event).toMatchObject({
    location: "Courtyard",
    organization_id: scenario.orgId,
    created_by: orgAdmin.userId,
  });
  expect(event?.published_at).not.toBeNull();

  await page.goto("/events");
  await expect(page.getByText(eventTitle).first()).toBeVisible();
});
