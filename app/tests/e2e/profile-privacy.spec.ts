import { expect, test } from "@playwright/test";
import { TestScenario, type SeededMember } from "./helpers/factory";
import { signIn } from "./helpers/auth";

const scenario = new TestScenario("privacy");
let owner: SeededMember;
let friendViewer: SeededMember;
let strangerViewer: SeededMember;
const linkedinUrl = "https://www.linkedin.com/in/integ-test-owner";

test.beforeAll(async () => {
  owner = await scenario.createMember("owner", {
    linkedinUrl,
    currentEmployer: "Meridian Capital",
    currentTitle: "Portfolio Manager",
    city: "Seoul",
    university: "Yonsei University",
    major: "Economics",
    graduationYear: 2011,
    educationHistory: [
      {
        school: "Yonsei University",
        degree: "BA",
        field: "Economics",
        start_date: "2011",
        end_date: "2015",
      },
    ],
  });
  friendViewer = await scenario.createMember("friend");
  strangerViewer = await scenario.createMember("stranger");
  await scenario.createFriendship(owner.userId, friendViewer.userId);
});

test.afterAll(async () => {
  await scenario.destroy();
});

test("a non-friend sees every org-visible field but no contact links", async ({ page }) => {
  await signIn(page, strangerViewer);
  await page.goto(`/profile/${owner.userId}`);

  await expect(page.getByRole("heading", { name: owner.name })).toBeVisible();
  await expect(page.getByText("Meridian Capital")).toBeVisible();
  await expect(page.getByText("Portfolio Manager")).toBeVisible();
  await expect(page.getByText("Seoul")).toBeVisible();
  await expect(page.getByText("Yonsei University").first()).toBeVisible();
  await expect(page.getByText(/Verified '11/)).toBeVisible();

  await expect(page.locator(`a[href="${linkedinUrl}"]`)).toHaveCount(0);
});

test("a friend sees the contact links card with the LinkedIn URL", async ({ page }) => {
  await signIn(page, friendViewer);
  await page.goto(`/profile/${owner.userId}`);

  await expect(page.getByRole("heading", { name: owner.name })).toBeVisible();
  await expect(page.locator(`a[href="${linkedinUrl}"]`)).toBeVisible();
});

test("your own profile shows an Edit profile action instead of connect CTAs", async ({ page }) => {
  await signIn(page, owner);
  await page.goto(`/profile/${owner.userId}`);

  await expect(page.getByRole("link", { name: "Edit profile" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Add friend" })).toHaveCount(0);
});

test("the People I know filter narrows the directory to friends only", async ({ page }) => {
  await signIn(page, friendViewer);
  await page.goto("/people?peopleIKnow=on");

  await expect(page.getByText(owner.name).first()).toBeVisible();
  await expect(page.getByText(strangerViewer.name)).toHaveCount(0);
});
