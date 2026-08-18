import { expect, test } from "@playwright/test";
import { signIn } from "../helpers/auth";
import { loadE2eEnv } from "../helpers/env";

/**
 * The GraphQL endpoint over real HTTP.
 *
 * `app/tests/integration/graphql/` diffs the graph against the repository
 * layer, but it calls the route handler in-process — which skips everything
 * between the network and Yoga. Two things only a real request can prove:
 *
 * 1. **The proxy lets the endpoint through.** `src/proxy.ts` bounces any
 *    unauthenticated request that is not a public prefix to /sign-in. When
 *    /api/graphql was not on that list, every anonymous *and* every bearer
 *    request 307'd before reaching a resolver — while the in-process suite
 *    stayed green, because it never passes through middleware.
 * 2. **Bearer auth works at all.** The proxy reads cookies only, so a bearer
 *    caller looks anonymous to it. `createClientWithToken` and the parity
 *    protocol both exist for that caller; this is the only test that proves
 *    the path is reachable end to end.
 */

const RICHARD = { email: "richard@example.com", password: "devseed-password-richard" };

const ME = JSON.stringify({ query: "query { me { id userId displayName } }" });

// The runner's process.env is not the dev server's: Doppler values are passed
// to the webServer, not to Playwright itself. The bearer test mints its token
// straight from Supabase, so it needs them here too.
test.beforeAll(() => loadE2eEnv());

test.describe("POST /api/graphql — reachability", () => {
  test("is not redirected away by the auth proxy when unauthenticated", async ({ request }) => {
    const response = await request.post("/api/graphql", {
      headers: { "content-type": "application/json" },
      data: ME,
      maxRedirects: 0,
    });

    // The endpoint authenticates itself: anonymous reads resolve to null. A
    // 307 here means the proxy is gating it, which also breaks bearer auth.
    expect(
      response.status(),
      "expected the endpoint to answer; a 307 means src/proxy.ts is gating /api/graphql",
    ).toBe(200);
    expect((await response.json()).data.me).toBeNull();
  });

  test("commands reach their NOT_AVAILABLE terminal rather than a redirect", async ({ request }) => {
    const response = await request.post("/api/graphql", {
      headers: { "content-type": "application/json" },
      data: JSON.stringify({
        query:
          "mutation { saveNotificationPreference(type: ASK_ACCEPTED, inAppEnabled: true, emailEnabled: true) }",
      }),
      maxRedirects: 0,
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).data.saveNotificationPreference).toBe("NOT_AVAILABLE");
  });
});

test.describe("POST /api/graphql — the exemption stays narrow", () => {
  test("other API routes are still gated by the proxy", async ({ request }) => {
    // Guards the PUBLIC_PREFIXES entry against widening: prefix matching is
    // exact-or-followed-by-slash, so only /api/graphql itself is exempt.
    const gated = await request.post("/api/help/asks/circle", {
      headers: { "content-type": "application/json" },
      data: JSON.stringify({}),
      maxRedirects: 0,
    });
    expect(gated.status()).toBe(307);
    expect(gated.headers().location).toContain("/sign-in");
  });

  test("a lookalike path is not exempted", async ({ request }) => {
    const response = await request.post("/api/graphqlx", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
  });
});

test.describe("POST /api/graphql — bearer identity", () => {
  test("resolves the signed-in member for a valid access token", async ({ request }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;

    const tokenResponse = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: { apikey: apiKey, "content-type": "application/json" },
      data: JSON.stringify(RICHARD),
    });
    expect(tokenResponse.ok(), await tokenResponse.text()).toBe(true);
    const accessToken = (await tokenResponse.json()).access_token as string;

    const response = await request.post("/api/graphql", {
      headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
      data: ME,
      maxRedirects: 0,
    });

    expect(response.status()).toBe(200);
    const me = (await response.json()).data.me;
    expect(me, "a valid bearer token must resolve a member, not null").not.toBeNull();
    expect(me.displayName).toBe("Richard Lee");
  });

  test("an unverifiable token is anonymous, not an error", async ({ request }) => {
    const response = await request.post("/api/graphql", {
      headers: { "content-type": "application/json", authorization: "Bearer not-a-jwt" },
      data: ME,
      maxRedirects: 0,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.errors).toBeUndefined();
    expect(body.data.me).toBeNull();
  });
});

test.describe("POST /api/graphql — browser session", () => {
  test("resolves the member from session cookies, as a client component would", async ({ page }) => {
    await signIn(page, RICHARD.email, RICHARD.password);

    // Issued from the page so the browser attaches its own session cookies —
    // the path a client component takes, distinct from the bearer path above.
    const body = await page.evaluate(async (query) => {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      return { status: response.status, json: await response.json() };
    }, "query { me { id displayName } }");

    expect(body.status).toBe(200);
    expect(body.json.data.me?.displayName).toBe("Richard Lee");
  });
});
