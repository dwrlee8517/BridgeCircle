import { expect, test } from "@playwright/test";

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

test.describe("auth proxy", () => {
  test("redirects an unauthenticated member-page request to /sign-in with the original path in ?next=", async ({ request }) => {
    const response = await request.get("/messages", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/sign-in?next=%2Fmessages");
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
