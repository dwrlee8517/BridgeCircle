import { expect, test } from "@playwright/test";
import { TestScenario, type SeededMember } from "./helpers/factory";
import { signIn } from "./helpers/auth";

const scenario = new TestScenario("api");
let member: SeededMember;

test.beforeAll(async () => {
  member = await scenario.createMember("caller");
});

test.afterAll(async () => {
  await scenario.destroy();
});

test.describe("GET /api/health", () => {
  test("returns exactly status, sha, and env — and never reports the prod tier", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["env", "sha", "status"]);
    expect(body.status).toBe("ok");
    expect(body.sha).toMatch(/^([0-9a-f]{40}|unknown)$/);
    expect(["local", "dev"]).toContain(body.env);
  });

  test("is reachable without a session because the proxy matcher excludes it", async ({ request }) => {
    const response = await request.get("/api/health", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });
});

test.describe("POST /api/asks/draft", () => {
  test("redirects unauthenticated callers to sign-in instead of returning JSON", async ({ request }) => {
    const response = await request.post("/api/asks/draft", {
      data: { helperId: "00000000-0000-0000-0000-000000000000" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/sign-in");
  });

  test("rejects an unparseable body with 400 invalid_body", async ({ page }) => {
    await signIn(page, member);
    const response = await page.request.post("/api/asks/draft", {
      headers: { "content-type": "application/json" },
      data: Buffer.from("this is not json {"),
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_body" });
  });

  test("rejects a non-uuid helperId with 400 invalid_input and zod detail", async ({ page }) => {
    await signIn(page, member);
    const response = await page.request.post("/api/asks/draft", {
      data: { helperId: "not-a-uuid" },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("invalid_input");
    expect(body.detail).toBeDefined();
  });

  test("rejects drafting an ask to yourself with 400 self_request", async ({ page }) => {
    await signIn(page, member);
    const response = await page.request.post("/api/asks/draft", {
      data: { helperId: member.userId },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "self_request" });
  });

  test("returns 404 not_found for a helper that does not exist", async ({ page }) => {
    await signIn(page, member);
    const response = await page.request.post("/api/asks/draft", {
      data: { helperId: "99999999-9999-4999-8999-999999999999" },
    });
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });
});

test.describe("cron endpoints never run unauthenticated", () => {
  // The proxy matcher currently intercepts /api/cron/* with a 307 before the
  // bearer check runs (tracked separately); once excluded, the route's own
  // guard answers 401. Either way the sweep must not execute.
  const rejectionStatuses = [401, 307];

  for (const path of ["/api/cron/enrichment-sweep-start", "/api/cron/enrichment-sweep-poll"]) {
    test(`POST ${path} without a token is rejected`, async ({ request }) => {
      const response = await request.post(path, { maxRedirects: 0 });
      expect(rejectionStatuses).toContain(response.status());
      if (response.status() === 401) {
        expect(await response.json()).toEqual({ error: "unauthorized" });
      }
    });

    test(`POST ${path} with a wrong bearer token is rejected`, async ({ request }) => {
      const response = await request.post(path, {
        headers: { authorization: "Bearer definitely-not-the-real-token" },
        maxRedirects: 0,
      });
      expect(rejectionStatuses).toContain(response.status());
      if (response.status() === 401) {
        expect(await response.json()).toEqual({ error: "unauthorized" });
      }
    });
  }
});

test.describe("auth proxy", () => {
  test("redirects an unauthenticated member-page request to /sign-in with the original path in ?next=", async ({ request }) => {
    const response = await request.get("/inbox", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/sign-in?next=%2Finbox");
  });

  test("preserves query strings in the ?next= parameter", async ({ request }) => {
    const response = await request.get("/people?peopleIKnow=on", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain(
      `/sign-in?next=${encodeURIComponent("/people?peopleIKnow=on")}`,
    );
  });

  test("leaves the sign-in page reachable without a session", async ({ request }) => {
    const response = await request.get("/sign-in", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });
});

test.describe("legacy URL redirects (308 permanent)", () => {
  const redirects: Array<[string, string]> = [
    ["/search", "/people"],
    ["/discover", "/people"],
    ["/friends", "/people?peopleIKnow=on"],
    ["/messages", "/inbox"],
    ["/mentorship/request/new", "/ask/new"],
    ["/mentorship/settings", "/help/settings"],
  ];

  for (const [source, destination] of redirects) {
    test(`${source} permanently redirects to ${destination}`, async ({ request }) => {
      const response = await request.get(source, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      const location = response.headers().location;
      const path = location.startsWith("http") ? new URL(location).pathname + new URL(location).search : location;
      expect(path).toBe(destination);
    });
  }

  test("/mentorship/request/:id carries the id through to /ask/:id", async ({ request }) => {
    const response = await request.get("/mentorship/request/abc-123", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toContain("/ask/abc-123");
  });

  test("/mentorship/thread/:id carries the id through to /ask/thread/:id", async ({ request }) => {
    const response = await request.get("/mentorship/thread/abc-123", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toContain("/ask/thread/abc-123");
  });
});
