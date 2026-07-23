import { execSync } from "node:child_process";
import * as path from "node:path";
import { isRemote } from "./helpers/env";

/**
 * Local/hermetic runs start from the same wiped-and-seeded world every time:
 * `supabase db reset` drops the local database, re-applies every migration,
 * and loads supabase/seeds/*.sql.
 *
 * Never runs in integ mode (remote PLAYWRIGHT_BASE_URL) — the deployed dev
 * stage's database is not ours to wipe. Set E2E_SKIP_RESET=1 to skip locally
 * when iterating on a spec against an already-clean database.
 */
export default function globalSetup(): void {
  if (isRemote) return;
  if (process.env.E2E_SKIP_RESET === "1") {
    console.log("[e2e] E2E_SKIP_RESET=1 — reusing the current local database state");
    return;
  }

  const appDir = path.resolve(__dirname, "..", "..");
  console.log("[e2e] resetting local database (supabase db reset)...");
  try {
    execSync("pnpm exec supabase db reset", { cwd: appDir, stdio: "inherit" });
  } catch (error) {
    throw new Error(
      "supabase db reset failed. Is the local stack running? Start it with `pnpm db:start` " +
        "(requires Docker). Original error: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}
