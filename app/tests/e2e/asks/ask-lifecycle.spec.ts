import { expect, test } from "@playwright/test";
import { TestScenario, type SeededMember } from "../helpers/factory";
import { sendComposerMessage, signInAs } from "../helpers/auth";

const scenario = new TestScenario("ask");
let asker: SeededMember;
let helper: SeededMember;
let decliningHelper: SeededMember;
let fullHelper: SeededMember;
let pausedHelper: SeededMember;
let otherAsker: SeededMember;
let askId = "";
let threadId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  asker = await scenario.createMember("asker");
  helper = await scenario.createMember("helper", { openToHelp: true });
  decliningHelper = await scenario.createMember("decliner", { openToHelp: true });
  fullHelper = await scenario.createMember("fullhelper", {
    openToHelp: true,
    maxPendingRequests: 1,
  });
  pausedHelper = await scenario.createMember("pausedhelper", {
    openToHelp: true,
    pausedAt: new Date().toISOString(),
  });
  otherAsker = await scenario.createMember("otherasker");
  await scenario.createAsk({
    askerId: otherAsker.userId,
    helperId: fullHelper.userId,
    helpNeeded: "This pending ask occupies the only slot the full helper has.",
  });
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("submitting the plain ask form lands on the ask detail page with a pending badge and a fully-populated asks row", async ({ page }) => {
  const helpNeeded = `I would like advice on moving into product management. ${scenario.runId}`;
  const helperFirstName = helper.name.split(" ")[0];

  await signInAs(page, asker);
  await page.goto(`/ask/new?to=${helper.userId}&skip=1`);
  await expect(
    page.getByRole("heading", { name: `Ask ${helperFirstName} for help` }),
  ).toBeVisible();

  await page.locator("#helpNeeded").fill(helpNeeded);
  await page.getByRole("button", { name: `Send ask to ${helperFirstName}` }).click();

  await page.waitForURL(/\/ask\/[a-f0-9-]+/);
  askId = page.url().split("/ask/")[1].split("?")[0];
  await expect(page.getByText("pending")).toBeVisible();
  await expect(page.getByText(`Your ask to ${helper.name}`)).toBeVisible();

  const { data: ask } = await scenario.admin
    .from("asks")
    .select("asker_id, helper_id, organization_id, ask_type, status, help_needed, responded_at")
    .eq("id", askId)
    .single();
  expect(ask).toMatchObject({
    asker_id: asker.userId,
    helper_id: helper.userId,
    organization_id: scenario.orgId,
    ask_type: "advice",
    status: "pending",
    help_needed: helpNeeded,
    responded_at: null,
  });

  await expect
    .poll(async () => {
      const { count } = await scenario.admin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", helper.userId)
        .eq("type", "ask_received");
      return count;
    })
    .toBe(1);
});

test("a second ask to the same helper is rejected as a duplicate", async ({ page }) => {
  const helperFirstName = helper.name.split(" ")[0];
  await signInAs(page, asker);
  await page.goto(`/ask/new?to=${helper.userId}&skip=1`);
  await page.locator("#helpNeeded").fill("Trying to send a second ask while one is already pending.");
  await page.getByRole("button", { name: `Send ask to ${helperFirstName}` }).click();

  await expect(page.getByText("You already have a pending ask to this person.")).toBeVisible();
  await expect(page).toHaveURL(/\/ask\/new/);
});

test("the helper accepts from the ask detail page, which opens a thread and stamps the ask accepted", async ({ page }) => {
  await signInAs(page, helper);
  await page.goto(`/ask/${askId}`);
  await expect(page.getByText(`Ask from ${asker.name}`)).toBeVisible();

  await page.getByRole("button", { name: "Accept & reply" }).click();
  await page.waitForURL(/\/ask\/thread\/[a-f0-9-]+/);
  threadId = page.url().split("/ask/thread/")[1].split("?")[0];

  const { data: ask } = await scenario.admin
    .from("asks")
    .select("status, responded_at")
    .eq("id", askId)
    .single();
  expect(ask?.status).toBe("accepted");
  expect(ask?.responded_at).not.toBeNull();

  const { data: thread } = await scenario.admin
    .from("ask_threads")
    .select("ask_id, helper_id, asker_id, status")
    .eq("id", threadId)
    .single();
  expect(thread).toMatchObject({
    ask_id: askId,
    helper_id: helper.userId,
    asker_id: asker.userId,
    status: "active",
  });

  await expect
    .poll(async () => {
      const { count } = await scenario.admin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", asker.userId)
        .eq("type", "ask_accepted");
      return count;
    })
    .toBe(1);
});

test("helper and asker exchange thread messages that persist as ask-typed rows and bump last_message_at", async ({ page }) => {
  const helperMessage = `Happy to help — here is my perspective. ${scenario.runId}`;
  const askerReply = `Thank you, that is exactly what I needed. ${scenario.runId}`;

  await signInAs(page, helper);
  await page.goto(`/ask/thread/${threadId}`);
  await sendComposerMessage(page, helperMessage);

  await signInAs(page, asker);
  await page.goto(`/ask/thread/${threadId}`);
  await expect(page.getByText(helperMessage)).toBeVisible();
  await sendComposerMessage(page, askerReply);

  const { data: messages } = await scenario.admin
    .from("messages")
    .select("sender_id, body, thread_type")
    .eq("thread_id", threadId)
    .order("created_at");
  expect(messages).toHaveLength(2);
  expect(messages?.every((m) => m.thread_type === "ask")).toBe(true);
  expect(messages?.[0].sender_id).toBe(helper.userId);
  expect(messages?.[1].sender_id).toBe(asker.userId);

  const { data: thread } = await scenario.admin
    .from("ask_threads")
    .select("last_message_at")
    .eq("id", threadId)
    .single();
  expect(thread?.last_message_at).not.toBeNull();
});

test("declining from the inbox marks the ask declined and notifies the asker", async ({ page }) => {
  const declinedAskId = await scenario.createAsk({
    askerId: asker.userId,
    helperId: decliningHelper.userId,
    helpNeeded: "An ask that is about to be declined by its helper.",
  });

  await signInAs(page, decliningHelper);
  await page.goto("/inbox");
  await page.getByRole("button", { name: "Requests" }).click();
  await page.getByRole("button", { name: new RegExp(asker.name) }).first().click();
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.waitForURL(/\/inbox/);

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("asks")
        .select("status, responded_at")
        .eq("id", declinedAskId)
        .single();
      return data;
    })
    .toMatchObject({ status: "declined" });

  const { count } = await scenario.admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", asker.userId)
    .eq("type", "ask_declined");
  expect(count).toBe(1);

  await signInAs(page, asker);
  await page.goto(`/ask/${declinedAskId}`);
  await expect(page.getByText("declined")).toBeVisible();
});

test("a helper already holding their max pending asks rejects new ones with the capacity message", async ({ page }) => {
  const firstName = fullHelper.name.split(" ")[0];
  await signInAs(page, asker);
  await page.goto(`/ask/new?to=${fullHelper.userId}&skip=1`);
  await page.locator("#helpNeeded").fill("One more ask for a helper whose pending queue is already full.");
  await page.getByRole("button", { name: `Send ask to ${firstName}` }).click();

  await expect(
    page.getByText("This person has as many pending asks as they can hold right now."),
  ).toBeVisible();

  const { count } = await scenario.admin
    .from("asks")
    .select("id", { count: "exact", head: true })
    .eq("helper_id", fullHelper.userId);
  expect(count).toBe(1);
});

test("a paused helper's compose page short-circuits instead of offering the form", async ({ page }) => {
  await signInAs(page, asker);
  await page.goto(`/ask/new?to=${pausedHelper.userId}&skip=1`);
  await expect(page.getByText("Not taking asks right now")).toBeVisible();
  await expect(page.locator("#helpNeeded")).toHaveCount(0);
});
