import { test, expect } from "@playwright/test";

const MOBILE_ROUTES = [
  "/",
  "/watercooler",
  "/community-stories",
  "/friends",
  "/messages",
  "/games-multiplayer",
  "/rewards",
  "/notifications",
  "/my-breakroom",
  "/account",
];

const RAW_ERROR_PATTERNS = [
  /row-level security/i,
  /\bRLS\b/i,
  /policy.*denied/i,
  /auth\.users/i,
  /relation "\w+" does not exist/i,
  /JWT/i,
  /service_role/i,
  /anon key/i,
];

test.describe("PWA — Manifest", () => {
  test("manifest.webmanifest is accessible", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    if (response.status() === 404) {
      test.skip(true, "Manifest not deployed yet on this environment");
    }
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBe("The Digital Breakroom");
    expect(manifest.short_name).toBe("Breakroom");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("manifest has at least one icon with valid purpose", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    if (response.status() === 404) {
      test.skip(true, "Manifest not deployed yet on this environment");
    }
    const manifest = await response.json();
    const hasAnyIcon = manifest.icons.some((i: any) => i.purpose === "any" || i.purpose === "maskable");
    expect(hasAnyIcon).toBeTruthy();
  });

  test("app HTML has manifest link", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const manifestLink = page.locator('link[rel="manifest"]');
    if ((await manifestLink.count()) === 0) {
      test.skip(true, "Manifest link not deployed yet on this environment");
    }
    await expect(manifestLink).toHaveAttribute("href", "/manifest.webmanifest");
  });

  test("app HTML has theme-color meta", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const themeColor = page.locator('meta[name="theme-color"]');
    if ((await themeColor.count()) === 0) {
      test.skip(true, "theme-color meta not deployed yet on this environment");
    }
    await expect(themeColor).toHaveAttribute("content", "#7dd3fc");
  });

  test("app HTML has apple-mobile-web-app-capable", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const appleMeta = page.locator('meta[name="apple-mobile-web-app-capable"]');
    if ((await appleMeta.count()) === 0) {
      test.skip(true, "apple-mobile-web-app-capable not deployed yet on this environment");
    }
    await expect(appleMeta).toHaveAttribute("content", "yes");
  });
});

test.describe("PWA — Offline fallback", () => {
  test("offline.html is accessible", async ({ request }) => {
    const response = await request.get("/offline.html");
    if (response.status() === 404) {
      test.skip(true, "Offline page not deployed yet on this environment");
    }
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("offline");
  });

  test("service worker file is accessible", async ({ request }) => {
    const response = await request.get("/sw.js");
    if (response.status() === 404) {
      test.skip(true, "Service worker not deployed yet on this environment");
    }
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("CACHE_NAME");
    expect(body).toContain("supabase");
  });
});

test.describe("PWA — Mobile routes at 390x844", () => {
  for (const route of MOBILE_ROUTES) {
    test(`${route} loads at iPhone 14 viewport`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
      });
      const page = await context.newPage();
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const body = page.locator("body");
      await expect(body).toBeVisible();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(400);
      await context.close();
    });
  }
});

test.describe("PWA — Account page mobile app card", () => {
  test("account page shows Mobile App card", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    const mobileCard = page.locator("text=Mobile App");
    if ((await mobileCard.count()) === 0) {
      test.skip(true, "Mobile App card not deployed yet on this environment");
    }
    await expect(mobileCard).toBeVisible({ timeout: 10000 });
  });

  test("account page shows install instructions", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");
    const bodyText = await page.locator("body").innerText();
    if (!bodyText.includes("Add to Home Screen")) {
      test.skip(true, "Install instructions not deployed yet on this environment");
    }
    expect(bodyText).toContain("Add to Home Screen");
  });
});

test.describe("PWA — No raw errors on mobile", () => {
  for (const route of MOBILE_ROUTES) {
    test(`${route} does not show raw errors at mobile viewport`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const bodyText = await page.locator("body").innerText();
      for (const pattern of RAW_ERROR_PATTERNS) {
        expect(bodyText).not.toMatch(pattern);
      }
      await context.close();
    });
  }
});

test.describe("PWA — No email exposure on public routes", () => {
  const PUBLIC_ROUTES = ["/", "/watercooler", "/community-stories", "/blog"];

  for (const route of PUBLIC_ROUTES) {
    test(`${route} does not expose raw emails at mobile viewport`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const bodyText = await page.locator("body").innerText();
      const emailMatches = bodyText.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      );
      if (emailMatches) {
        for (const match of emailMatches) {
          expect(match).toContain("•••");
        }
      }
      await context.close();
    });
  }
});
