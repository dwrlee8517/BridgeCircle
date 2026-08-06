import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated, not authored. `pnpm test:int --coverage` writes an HTML
    // report here; linting it makes `pnpm lint` fail locally for anyone who
    // has run coverage, while CI (a clean checkout) passes.
    "coverage/**",
    // Supabase CLI scratch, written by `supabase start`. Same problem: it
    // only exists on a machine with the local stack up, so `pnpm lint` failed
    // there and passed in CI.
    "supabase/.temp/**",
  ]),
  {
    // Honor the underscore-prefix convention for intentionally-unused
    // params and variables. Server actions in particular take a `_prev`
    // formState arg required by useActionState's signature even when the
    // action ignores it; flagging those as warnings is noise.
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
