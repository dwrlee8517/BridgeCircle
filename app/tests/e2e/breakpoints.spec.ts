import { expect, test } from "@playwright/test";

/**
 * Window-class smoke coverage. Each test opts into a viewport project via its
 * @layout tag (see playwright.config.ts projects); the desktop/expanded case
 * is covered by the untagged sign-in spec. This is the seed of the layout
 * dimension of the parity ratchet: features whose manifest entry declares
 * compact/medium layouts need a spec tagged with both the feature and the
 * layout, asserting what that breakpoint actually changes.
 */
test.describe("sign-in across window classes", () => {
  test(
    "renders the sign-in card on a compact (phone) viewport",
    { tag: ["@feature:auth.sign-in", "@layout:compact"] },
    async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/sign-in/);
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
      // Nothing may force sideways scrolling on a phone.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    },
  );

  test(
    "renders the sign-in card on a medium (tablet) viewport",
    { tag: ["@feature:auth.sign-in", "@layout:medium"] },
    async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/sign-in/);
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
    },
  );
});
