import { test, expect } from "@playwright/test";

const testEmail = process.env.E2E_TEST_EMAIL;
const testPassword = process.env.E2E_TEST_PASSWORD;

const PUBLIC_ROUTES = [
  "/",
  "/watercooler",
  "/community-stories",
  "/submit-story",
  "/friends",
  "/messages",
  "/games-multiplayer",
  "/rewards",
  "/notifications",
  "/my-breakroom",
  "/account",
];

const ADMIN_ROUTES = ["/admin-analytics", "/admin-submissions", "/admin-watercooler"];

const ERROR_TERMS = [
  "row level security",
  "infinite recursion",
  "cannot coerce",
  "is not defined",
  "permission denied",
  "database error",
  "supabase error",
  "PGRST",
  "RLS",
];

async function dismissBlockingDialogs(page: any) {
  await page.keyboard.press("Escape").catch(() => {});
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    const closeButton = dialog.getByRole("button", { name: /close|dismiss|×/i }).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  }
}

test.describe("Polish & Mobile UX", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const route of PUBLIC_ROUTES) {
    test(`mobile viewport: ${route} loads`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
    });

    test(`mobile viewport: ${route} does not show raw errors`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await dismissBlockingDialogs(page);
      const bodyText = await page.locator("body").textContent();
      const lowerBody = (bodyText || "").toLowerCase();
      const hasErrors = ERROR_TERMS.some((term) => lowerBody.includes(term));
      expect(hasErrors).toBeFalsy();
    });
  }

  test("admin routes block logged-out state on mobile", async ({ page }) => {
    for (const route of ADMIN_ROUTES) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toContainText(
        /Admin sign in required|workspace admin|Sign In|admin only|access denied/i,
        { timeout: 10000 }
      );
    }
  });

  test("mobile bottom nav is visible and accessible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const mobileNav = page.locator("nav.fixed.bottom-0, nav[aria-label='Mobile navigation']").first();
    await expect(mobileNav).toBeVisible();
    const items = mobileNav.locator("a");
    await expect(await items.count()).toBeGreaterThanOrEqual(4);
  });

  test.describe("Authenticated polish tests", () => {
    test.skip(
      !testEmail || !testPassword,
      "Skipping authenticated polish tests - E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set"
    );

    test.beforeEach(async ({ page }) => {
      if (!testEmail || !testPassword) return;
      await page.goto("/auth");
      await page.waitForLoadState("networkidle");
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.count() === 0) return;
      await emailInput.fill(testEmail);
      await page.locator('input[type="password"]').first().fill(testPassword);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL("/", { timeout: 10000 });
    });

    test("authenticated mobile pages load without raw errors", async ({ page }) => {
      for (const route of ["/friends", "/messages", "/notifications", "/rewards"]) {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await dismissBlockingDialogs(page);
        const bodyText = await page.locator("body").textContent();
        const lowerBody = (bodyText || "").toLowerCase();
        const hasErrors = ERROR_TERMS.some((term) => lowerBody.includes(term));
        expect(hasErrors).toBeFalsy();
      }
    });
  });
});
