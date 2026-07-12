import { execSync } from "node:child_process";

/**
 * E2E mode detection + env loading, shared by playwright.config.ts, the
 * global setup, and any spec that needs the admin client.
 *
 * Two modes (see docs/runbooks/e2e-testing.md):
 *  - Local/hermetic (default): baseURL is localhost, the suite owns a dev
 *    server on port 3002 and talks to the local Supabase stack. Env comes
 *    from the Doppler `bridgecircle/dev_local` config — a branch of `dev`
 *    that overrides the Supabase values to the local stack and dummies out
 *    outbound services (Resend, Anthropic). `supabase db reset` guarantees
 *    the seeded world.
 *  - Integ (CD pipeline): PLAYWRIGHT_BASE_URL points at the deployed dev
 *    stage; env comes from the outer `doppler run` (dev config), so the
 *    admin client targets the dev database and dev_local is never touched.
 */

export const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3002";

export const isRemote = !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(baseURL);

const DOPPLER_PROJECT = "bridgecircle";
const DOPPLER_CONFIG = "dev_local";

let cached: Record<string, string> | null = null;

/**
 * The local-stack env from Doppler. Empty object in integ mode. Locally this
 * uses your personal `doppler login`; in CI the DOPPLER_TOKEN secret (scoped
 * to dev_local) authenticates the same call.
 */
export function e2eEnv(): Record<string, string> {
  if (isRemote) return {};
  if (cached) return cached;

  let json: string;
  try {
    json = execSync(
      `doppler secrets download --no-file --format json -p ${DOPPLER_PROJECT} -c ${DOPPLER_CONFIG}`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    throw new Error(
      `Failed to load the ${DOPPLER_PROJECT}/${DOPPLER_CONFIG} Doppler config. ` +
        "Local E2E needs the Doppler CLI authenticated (`doppler login`) or a " +
        "DOPPLER_TOKEN scoped to dev_local. Original error: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  const env = JSON.parse(json) as Record<string, string>;

  // Belt and braces: dev_local must point at the local stack. If someone
  // edits the config to a remote URL, fail before any test touches it —
  // hermetic runs assume the database is disposable.
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(url)) {
    throw new Error(
      `Doppler ${DOPPLER_CONFIG} has NEXT_PUBLIC_SUPABASE_URL=${url || "<unset>"} — ` +
        "local E2E refuses to run against a non-local Supabase.",
    );
  }

  cached = env;
  return env;
}

/**
 * Populate the Playwright runner's process.env for local runs (admin client
 * in specs). Existing values win so an explicitly exported override — or the
 * Doppler-provided env in integ mode — is never clobbered.
 */
export function loadE2eEnv(): void {
  for (const [key, value] of Object.entries(e2eEnv())) {
    process.env[key] ??= value;
  }
}
