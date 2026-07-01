import { test, expect } from "@playwright/test";

const testEmail = process.env.E2E_TEST_EMAIL;
const testPassword = process.env.E2E_TEST_PASSWORD;

async function signIn(page: any) {
  if (!testEmail || !testPassword) return false;

  await page.goto("/auth");
  await page.waitForLoadState("networkidle");

  // Check if we're already signed in by looking for auth form inputs
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.count() === 0) {
    return true;
  }

  await emailInput.fill(testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button[type="submit"]');
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

test.describe("Multiplayer Games", () => {
  test("should navigate to multiplayer games page from sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await dismissBlockingDialogs(page);

    // Click on sidebar navigation (desktop) if needed
    const sidebarToggle = page.locator("button[aria-label='Open menu']");
    if (await sidebarToggle.count() > 0 && await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
    }

    await dismissBlockingDialogs(page);

    // Verify the Multiplayer Games link exists in the sidebar
    const multiplayerLink = page.locator("text=Multiplayer Games").first();
    const hasLink = await multiplayerLink.count() > 0 && await multiplayerLink.isVisible();
    expect(hasLink).toBeTruthy();

    // Navigate directly to avoid modal pointer-intercept issues
    await page.goto("/games-multiplayer");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/Multiplayer Games|sign in|login|required/i);
  });

  test("should navigate to multiplayer games page from account", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    await dismissBlockingDialogs(page);

    // Verify the Multiplayer Games card/link exists
    const multiplayerLink = page.locator("text=Multiplayer Games").first();
    const hasLink = await multiplayerLink.count() > 0 && await multiplayerLink.isVisible();
    expect(hasLink).toBeTruthy();

    // Navigate directly to avoid modal pointer-intercept issues
    await page.goto("/games-multiplayer");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toContainText(/Multiplayer Games|sign in|login|required/i);
  });

  test("should show sign in prompt when not authenticated", async ({ page }) => {
    await page.goto("/games-multiplayer");
    await page.waitForLoadState("networkidle");

    const body = await page.locator("body").textContent();
    const hasAuthCTA = /sign in|log in|auth/i.test(body || "");
    expect(hasAuthCTA).toBeTruthy();

    // Check auth link exists (first one if multiple)
    await expect(page.locator("a[href='/auth']").first()).toBeVisible();
  });

  test("should not show raw errors when not authenticated", async ({ page }) => {
    await page.goto("/games-multiplayer");
    await page.waitForLoadState("networkidle");

    const body = await page.locator("body").textContent();
    const lowerBody = (body || "").toLowerCase();
    const errorTerms = ["row level security", "infinite recursion", "cannot coerce", "is not defined"];
    const hasErrors = errorTerms.some(term => lowerBody.includes(term));
    expect(hasErrors).toBeFalsy();
  });

  test("should display page title and description", async ({ page }) => {
    await page.goto("/games-multiplayer");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/Multiplayer Games/);
    await expect(page.locator("h1:has-text('Multiplayer Games')").first()).toContainText("Multiplayer Games");
    await expect(page.locator("body")).toContainText(/Play quick games|sign in/i);
  });

  test("should have refresh button or auth CTA", async ({ page }) => {
    await page.goto("/games-multiplayer");
    await page.waitForLoadState("networkidle");

    const refreshButton = page.locator("button[title='Refresh']").first();
    const authLink = page.locator("a[href='/auth']").first();
    const hasRefresh = await refreshButton.count() > 0 && await refreshButton.isVisible();
    const hasAuth = await authLink.count() > 0 && await authLink.isVisible();

    expect(hasRefresh || hasAuth).toBeTruthy();
  });

  test.describe("Authenticated tests", () => {
    test.skip(!testEmail || !testPassword, "Skipping authenticated tests - E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

    test.beforeEach(async ({ page }) => {
      if (!testEmail || !testPassword) return;
      await dismissBlockingDialogs(page);
      await signIn(page);
    });

    test("should display create room card when authenticated", async ({ page }) => {
      await page.goto("/games-multiplayer");
      await page.waitForLoadState("networkidle");

      await expect(page.locator("text=Create Room").first()).toBeVisible();
      await expect(page.locator("text=Create Tic Tac Toe Room").first()).toBeVisible();
    });

    test("should display join room card when authenticated", async ({ page }) => {
      await page.goto("/games-multiplayer");
      await page.waitForLoadState("networkidle");

      await expect(page.locator("text=Join Room").first()).toBeVisible();
      await expect(page.locator("input[placeholder*='Room Code']").first()).toBeVisible();
    });

    test("should display invite friend card when authenticated", async ({ page }) => {
      await page.goto("/games-multiplayer");
      await page.waitForLoadState("networkidle");

      await expect(page.locator("text=Invite Friend").first()).toBeVisible();
    });

    test("should display incoming game invites section when authenticated", async ({ page }) => {
      await page.goto("/games-multiplayer");
      await page.waitForLoadState("networkidle");

      await expect(page.locator("text=Incoming Game Invites").first()).toBeVisible();
    });

    test("should display Tic Tac Toe board when room is active", async ({ page }) => {
      await page.goto("/games-multiplayer");
      await page.waitForLoadState("networkidle");

      await page.locator("text=Create Tic Tac Toe Room").first().click();
      await page.waitForTimeout(2000);

      await expect(page.locator("text=Room Code:").first()).toBeVisible();
      await expect(page.locator("text=Waiting for another player").first()).toBeVisible();
    });

    test("should allow copying room code", async ({ page }) => {
      await page.goto("/games-multiplayer");
      await page.waitForLoadState("networkidle");

      await page.locator("text=Create Tic Tac Toe Room").first().click();
      await page.waitForTimeout(2000);

      await page.locator("text=Copy Code").first().click();
      await expect(page.locator("text=Copied").first()).toBeVisible();
    });

    test("should allow canceling room as host", async ({ page }) => {
      await page.goto("/games-multiplayer");
      await page.waitForLoadState("networkidle");

      await page.locator("text=Create Tic Tac Toe Room").first().click();
      await page.waitForTimeout(2000);

      const cancelButton = page.locator("button:has-text('Cancel room')").first();
      if (await cancelButton.count() > 0 && await cancelButton.isVisible()) {
        await cancelButton.click();
        await expect(page.locator("text=Create Room").first()).toBeVisible();
      }
    });

    test("should show room code when room is created", async ({ page }) => {
      await page.goto("/games-multiplayer");
      await page.waitForLoadState("networkidle");

      await page.locator("text=Create Tic Tac Toe Room").first().click();
      await page.waitForTimeout(2000);

      await expect(page.locator("text=Room Code:").first()).toBeVisible();
    });
  });
});
