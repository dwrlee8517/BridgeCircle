import { expect, test } from "@playwright/test";
import { TestScenario, type SeededMember } from "../helpers/factory";
import { signInAs } from "../helpers/auth";

const scenario = new TestScenario("events");
let memberA: SeededMember;
let memberB: SeededMember;
let openEventId = "";
let capacityOneEventId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  memberA = await scenario.createMember("membera");
  memberB = await scenario.createMember("memberb");
  openEventId = await scenario.createEvent({
    title: `Open Reunion Mixer ${scenario.runId}`,
    startsInDays: 7,
    location: "Alumni Hall",
  });
  capacityOneEventId = await scenario.createEvent({
    title: `Tiny Dinner ${scenario.runId}`,
    startsInDays: 10,
    capacity: 1,
  });
  await scenario.createEvent({
    title: `Finished Gala ${scenario.runId}`,
    startsInDays: -3,
  });
  await scenario.createAnnouncement({
    title: `Published Notice ${scenario.runId}`,
    body: "The library reopens next month with extended hours.",
    createdBy: memberA.userId,
  });
  await scenario.createAnnouncement({
    title: `Draft Notice ${scenario.runId}`,
    published: false,
  });
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("upcoming and past tabs split the seeded events correctly", async ({ page }) => {
  await signInAs(page, memberA);
  await page.goto("/events");
  await expect(page.getByText(`Open Reunion Mixer ${scenario.runId}`).first()).toBeVisible();
  await expect(page.getByText(`Finished Gala ${scenario.runId}`)).toHaveCount(0);

  await page.goto("/events?view=past");
  await expect(page.getByText(`Finished Gala ${scenario.runId}`).first()).toBeVisible();
  await expect(page.getByText(`Open Reunion Mixer ${scenario.runId}`)).toHaveCount(0);
});

test("RSVP toggles to going and back, and every flip is written to event_rsvps", async ({ page }) => {
  await signInAs(page, memberA);
  await page.goto(`/events/${openEventId}`);
  await expect(page.getByRole("heading", { name: `Open Reunion Mixer ${scenario.runId}` })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your RSVP" })).toBeVisible();

  await page.getByRole("button", { name: /RSVP - I.m going/ }).click();
  await expect(page.getByRole("button", { name: /You.re going/ })).toBeVisible();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("event_rsvps")
        .select("status")
        .eq("event_id", openEventId)
        .eq("user_id", memberA.userId)
        .maybeSingle();
      return data?.status;
    })
    .toBe("going");

  await page.getByRole("button", { name: /You.re going/ }).click();
  await expect(page.getByRole("button", { name: /RSVP - I.m going/ })).toBeVisible();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("event_rsvps")
        .select("status")
        .eq("event_id", openEventId)
        .eq("user_id", memberA.userId)
        .maybeSingle();
      return data?.status;
    })
    .toBe("not_going");
});

test("a full event waitlists the next member and promotes them when the going member backs out", async ({ page }) => {
  await signInAs(page, memberA);
  await page.goto(`/events/${capacityOneEventId}`);
  await page.getByRole("button", { name: /RSVP - I.m going/ }).click();
  await expect(page.getByRole("button", { name: /You.re going/ })).toBeVisible();

  await signInAs(page, memberB);
  await page.goto(`/events/${capacityOneEventId}`);
  await page.getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.getByRole("button", { name: "On waitlist" })).toBeVisible();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("event_rsvps")
        .select("status")
        .eq("event_id", capacityOneEventId)
        .eq("user_id", memberB.userId)
        .maybeSingle();
      return data?.status;
    })
    .toBe("waitlisted");

  await signInAs(page, memberA);
  await page.goto(`/events/${capacityOneEventId}`);
  await page.getByRole("button", { name: /You.re going/ }).click();
  await expect(page.getByRole("button", { name: /RSVP|Join waitlist/ })).toBeVisible();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("event_rsvps")
        .select("user_id, status")
        .eq("event_id", capacityOneEventId)
        .order("user_id");
      return Object.fromEntries((data ?? []).map((r) => [r.user_id, r.status]));
    })
    .toEqual({
      [memberA.userId]: "not_going",
      [memberB.userId]: "going",
    });
});

test("the announcements board shows published notices with their author and hides drafts", async ({ page }) => {
  await signInAs(page, memberB);
  await page.goto("/announcements");
  await expect(page.getByRole("heading", { name: "Announcements" })).toBeVisible();
  await expect(page.getByText(`Published Notice ${scenario.runId}`)).toBeVisible();
  await expect(page.getByText("The library reopens next month with extended hours.")).toBeVisible();
  await expect(page.getByText(`Posted by ${memberA.name}`)).toBeVisible();
  await expect(page.getByText(`Draft Notice ${scenario.runId}`)).toHaveCount(0);
});
