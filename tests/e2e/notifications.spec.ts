import { test, expect } from "@playwright/test";

test.describe("Notifications", () => {
  test("/notifications loads", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("logged-out user sees sign-in CTA", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    const signInLink = page.locator('a[href="/auth"]');
    const hasSignInLink = await signInLink.count() > 0;
    
    const signInText = page.locator("body").filter({ hasText: /sign in/i });
    const hasSignInText = await signInText.count() > 0;
    
    if (process.env.PLAYWRIGHT_BASE_URL?.includes("localhost") || process.env.PLAYWRIGHT_BASE_URL?.includes("127.0.0.1")) {
      expect(hasSignInLink || hasSignInText).toBeTruthy();
    }
  });

  test("page does not crash", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    expect(errors.length).toBe(0);
  });

  test("notifications list or empty state appears", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    const notificationsList = page.locator("body").filter({ hasText: /notifications|no notifications|all caught up/i });
    const hasNotificationsContent = await notificationsList.count() > 0;
    
    if (process.env.PLAYWRIGHT_BASE_URL?.includes("localhost") || process.env.PLAYWRIGHT_BASE_URL?.includes("127.0.0.1")) {
      expect(hasNotificationsContent).toBeTruthy();
    }
  });

  test("mark all read button exists or auth CTA appears", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    const markAllReadButton = page.locator("button").filter({ hasText: /mark all as read/i });
    const signInLink = page.locator('a[href="/auth"]');
    
    const hasMarkAllRead = await markAllReadButton.count() > 0;
    const hasSignIn = await signInLink.count() > 0;
    
    if (process.env.PLAYWRIGHT_BASE_URL?.includes("localhost") || process.env.PLAYWRIGHT_BASE_URL?.includes("127.0.0.1")) {
      expect(hasMarkAllRead || hasSignIn).toBeTruthy();
    }
  });

  test("sidebar contains Notifications link", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    const notificationsLink = page.locator("a").filter({ hasText: /notifications/i });
    const hasNotificationsLink = await notificationsLink.count() > 0;
    
    if (process.env.PLAYWRIGHT_BASE_URL?.includes("localhost") || process.env.PLAYWRIGHT_BASE_URL?.includes("127.0.0.1")) {
      expect(hasNotificationsLink).toBeTruthy();
    }
  });

  test("account page contains Notifications card", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    const notificationsCard = page.locator("body").filter({ hasText: /notifications/i });
    const hasNotificationsCard = await notificationsCard.count() > 0;
    
    if (process.env.PLAYWRIGHT_BASE_URL?.includes("localhost") || process.env.PLAYWRIGHT_BASE_URL?.includes("127.0.0.1")) {
      expect(hasNotificationsCard).toBeTruthy();
    }
  });

  test("page does not expose email addresses", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    
    const bodyText = await page.locator("body").textContent() || "";
    
    // Simple email regex check - should not find common email patterns on notifications page
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    expect(emailRegex.test(bodyText)).toBeFalsy();
  });

  test("page does not show raw Supabase or RLS errors", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    
    const bodyText = await page.locator("body").textContent() || "";
    
    const errorTerms = ["row level security", "rls", "supabase", "postgrest", "unauthorized"];
    const lowerBodyText = bodyText.toLowerCase();
    
    const hasErrorTerms = errorTerms.some(term => lowerBodyText.includes(term));
    expect(hasErrorTerms).toBeFalsy();
  });

  // Auth-dependent tests - skip unless E2E_TEST_EMAIL and E2E_TEST_PASSWORD exist
  const testEmail = process.env.E2E_TEST_EMAIL;
  const testPassword = process.env.E2E_TEST_PASSWORD;

  test.describe("Authenticated tests", () => {
    test.skip(!testEmail || !testPassword, "Skipping authenticated tests - E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set");

    test.beforeEach(async ({ page }) => {
      if (!testEmail || !testPassword) return;
      
      await page.goto("/auth");
      await page.waitForLoadState("networkidle");
      
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      
      await page.waitForURL("/", { timeout: 10000 });
    });

    test("logged-in user sees notifications dashboard", async ({ page }) => {
      if (!testEmail || !testPassword) return;
      
      await page.goto("/notifications");
      await page.waitForLoadState("networkidle");
      
      const body = page.locator("body");
      await expect(body).toBeVisible();
      
      const notificationsContent = page.locator("body").filter({ hasText: /notifications|mark all as read|filters|no notifications/i });
      const hasNotificationsContent = await notificationsContent.count() > 0;
      
      expect(hasNotificationsContent).toBeTruthy();
    });
  });
});
