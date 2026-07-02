import { test, expect } from "@playwright/test";

const testEmail = process.env.E2E_TEST_EMAIL;
const testPassword = process.env.E2E_TEST_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;

const AUTH_PROMPT_REGEX = /Admin sign in required|workspace admin|Sign In|Sign in|admin only|access denied/i;

async function signIn(page: any, email: string, password: string) {
  await page.goto("/auth");
  await page.waitForLoadState("networkidle");

  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.count() === 0) {
    return true;
  }

  await emailInput.fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL("/", { timeout: 10000 });
  return true;
}

async function dismissBlockingDialogs(page: any) {
  await page.keyboard.press('Escape').catch(() => {});
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible().catch(() => false)) {
    const closeButton = dialog.getByRole('button', { name: /close|dismiss|×/i }).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  }
}

test.describe("Admin Analytics", () => {
  test("/admin-analytics loads", async ({ page }) => {
    await page.goto("/admin-analytics");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("logged-out user sees sign-in or admin required message", async ({ page }) => {
    await page.goto("/admin-analytics");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(AUTH_PROMPT_REGEX, { timeout: 10000 });
  });

  test("non-auth state does not expose analytics data", async ({ page }) => {
    await page.goto("/admin-analytics");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(AUTH_PROMPT_REGEX, { timeout: 10000 });

    const bodyText = await page.locator("body").textContent();
    const lowerBody = (bodyText || "").toLowerCase();
    const errorTerms = [
      "row level security",
      "infinite recursion",
      "cannot coerce",
      "is not defined",
      "permission denied",
      "database error",
    ];
    const hasErrors = errorTerms.some((term) => lowerBody.includes(term));
    expect(hasErrors).toBeFalsy();
  });

  test("page does not crash", async ({ page }) => {
    await page.goto("/admin-analytics");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("page does not show raw Supabase or RLS errors", async ({ page }) => {
    await page.goto("/admin-analytics");
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").textContent();
    const lowerBody = (bodyText || "").toLowerCase();
    const errorTerms = [
      "row level security",
      "infinite recursion",
      "cannot coerce",
      "is not defined",
      "permission denied",
      "database error",
    ];
    const hasErrors = errorTerms.some((term) => lowerBody.includes(term));
    expect(hasErrors).toBeFalsy();
  });

  test("account page contains Admin Analytics card if admin is available", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    await dismissBlockingDialogs(page);

    await expect(page.locator("body")).toContainText(/Admin Analytics|Sign In|Sign in/i, { timeout: 10000 });
  });

  test("sidebar contains Admin Analytics link if admin is available", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await dismissBlockingDialogs(page);

    const sidebarToggle = page.locator("button[aria-label='Open menu']").first();
    if (await sidebarToggle.count() > 0 && await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
    }

    await expect(page.locator("body")).toContainText(/Admin Analytics|Sign In|Sign in/i, { timeout: 10000 });
  });

  test.describe("Authenticated admin tests", () => {
    test.skip(
      !testEmail || !testPassword || !adminEmail,
      "Skipping admin analytics tests - E2E_TEST_EMAIL, E2E_TEST_PASSWORD, and E2E_ADMIN_EMAIL not set"
    );

    test.beforeEach(async ({ page }) => {
      if (!testEmail || !testPassword || !adminEmail) return;
      await dismissBlockingDialogs(page);
      await signIn(page, testEmail, testPassword);
    });

    test("admin sees analytics sections", async ({ page }) => {
      await page.goto("/admin-analytics");
      await page.waitForLoadState("networkidle");

      await expect(page.locator("body")).toContainText(/Admin Analytics/i, { timeout: 10000 });
      await expect(page.locator("body")).toContainText(/Overview|Engagement|Content|Games|Rewards|Top Users|Recent Activity/i, { timeout: 10000 });
    });
  });
});
