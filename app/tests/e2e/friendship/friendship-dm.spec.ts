import { expect, test } from "@playwright/test";
import { TestScenario, type SeededMember } from "../helpers/factory";
import { sendComposerMessage, signInAs } from "../helpers/auth";

const scenario = new TestScenario("frienddm");
let requester: SeededMember;
let receiver: SeededMember;
let dmThreadId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  requester = await scenario.createMember("requester");
  receiver = await scenario.createMember("receiver");
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("a stranger's profile offers Add friend but no Message button", async ({ page }) => {
  await signInAs(page, requester);
  await page.goto(`/profile/${receiver.userId}`);

  await expect(page.getByRole("heading", { name: receiver.name })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add friend" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Message" })).toHaveCount(0);
});

test("sending a connect request flips the CTA to Request sent and writes a pending friend_requests row plus a notification", async ({ page }) => {
  await signInAs(page, requester);
  await page.goto(`/profile/${receiver.userId}`);
  await page.getByRole("button", { name: "Add friend" }).click();
  await expect(page.getByText("Request sent")).toBeVisible();

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("friend_requests")
        .select("status, message, responded_at")
        .eq("sender_id", requester.userId)
        .eq("receiver_id", receiver.userId)
        .maybeSingle();
      return data;
    })
    .toMatchObject({ status: "pending", responded_at: null });

  await expect
    .poll(async () => {
      const { count } = await scenario.admin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", receiver.userId)
        .eq("type", "friend_request_received");
      return count;
    })
    .toBe(1);
});

test("the receiver sees Wants to connect in inbox Requests and accepting creates exactly one canonical friendship row", async ({ page }) => {
  await signInAs(page, receiver);
  await page.goto("/inbox");
  await page.getByRole("button", { name: "Requests" }).click();
  await page.getByRole("button", { name: new RegExp(requester.name) }).first().click();

  await expect(page.getByText("Wants to connect").first()).toBeVisible();
  await page.getByRole("button", { name: "Accept", exact: true }).click();

  const [a, b] =
    requester.userId < receiver.userId
      ? [requester.userId, receiver.userId]
      : [receiver.userId, requester.userId];
  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("friendships")
        .select("user_a_id, user_b_id")
        .eq("user_a_id", a)
        .eq("user_b_id", b);
      return data?.length;
    })
    .toBe(1);

  await expect
    .poll(async () => {
      const { data } = await scenario.admin
        .from("friend_requests")
        .select("status, responded_at")
        .eq("sender_id", requester.userId)
        .eq("receiver_id", receiver.userId)
        .single();
      return data?.status === "accepted" && data.responded_at !== null;
    })
    .toBe(true);
});

test("friends see Friends ✓ and a Message button that opens a direct thread", async ({ page }) => {
  await signInAs(page, receiver);
  await page.goto(`/profile/${requester.userId}`);

  await expect(page.getByRole("button", { name: /Friends/ })).toBeDisabled();
  await page.getByRole("button", { name: "Message" }).click();
  await page.waitForURL(/\/messages\/[a-f0-9-]+/);
  dmThreadId = page.url().split("/messages/")[1].split("?")[0];

  await expect(page.getByText(/You.re connected/)).toBeVisible();

  const [a, b] =
    requester.userId < receiver.userId
      ? [requester.userId, receiver.userId]
      : [receiver.userId, requester.userId];
  const { data: thread } = await scenario.admin
    .from("direct_message_threads")
    .select("user_a_id, user_b_id")
    .eq("id", dmThreadId)
    .single();
  expect(thread).toMatchObject({ user_a_id: a, user_b_id: b });
});

test("messages flow both ways, each writing a direct-typed messages row and a direct_message notification", async ({ page }) => {
  const receiverGreeting = `Hello from the receiver side ${scenario.runId}`;
  const requesterReply = `Great to be connected ${scenario.runId}`;

  await signInAs(page, receiver);
  await page.goto(`/messages/${dmThreadId}`);
  await sendComposerMessage(page, receiverGreeting);

  await signInAs(page, requester);
  await page.goto(`/messages/${dmThreadId}`);
  await expect(page.getByText(receiverGreeting)).toBeVisible();
  await sendComposerMessage(page, requesterReply);

  const { data: messages } = await scenario.admin
    .from("messages")
    .select("sender_id, body, thread_type")
    .eq("thread_id", dmThreadId)
    .order("created_at");
  expect(messages).toHaveLength(2);
  expect(messages?.[0]).toMatchObject({
    sender_id: receiver.userId,
    body: receiverGreeting,
    thread_type: "direct",
  });
  expect(messages?.[1]).toMatchObject({
    sender_id: requester.userId,
    body: requesterReply,
    thread_type: "direct",
  });

  const { count: requesterNotifications } = await scenario.admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", requester.userId)
    .eq("type", "direct_message");
  expect(requesterNotifications).toBe(1);
});
