import { test, expect } from "@playwright/test";

test.describe("Safety & Privacy", () => {
  test("account page shows Privacy & Safety card", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    const privacyCard = page.locator("text=Privacy & Safety");
    await expect(privacyCard).toBeVisible({ timeout: 10000 });
  });

  test("account page does not expose raw email in profile", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    // The page should not display a raw email address in a visible text node
    // (emails may appear in input fields, but not as display text)
    const bodyText = await page.locator("body").innerText();
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const matches = bodyText.match(emailPattern);
    // Filter out emails that are inside input placeholders or value attributes
    // We only care about visible display text
    expect(matches === null || matches.every((m) => m.includes("•••"))).toBeTruthy();
  });

  test("watercooler wall has character counter", async ({ page }) => {
    await page.goto("/watercooler");
    await page.waitForLoadState("networkidle");

    // Look for the character counter pattern (e.g. "0/180")
    const counter = page.locator("text=/\\d+\\/180/");
    await expect(counter).toBeVisible({ timeout: 10000 });
  });

  test("watercooler wall textarea has maxLength", async ({ page }) => {
    await page.goto("/watercooler");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea").first();
    await expect(textarea).toHaveAttribute("maxlength", "180");
  });

  test("submit-story page has character counter for story idea", async ({ page }) => {
    await page.goto("/submit-story");
    await page.waitForLoadState("networkidle");

    // Look for the character counter pattern (e.g. "0/2000")
    const counter = page.locator("text=/\\d+\\/2000/");
    await expect(counter).toBeVisible({ timeout: 10000 });
  });

  test("submit-story nickname has maxLength", async ({ page }) => {
    await page.goto("/submit-story");
    await page.waitForLoadState("networkidle");

    const nicknameInput = page.locator("#nickname");
    await expect(nicknameInput).toHaveAttribute("maxlength", "50");
  });

  test("auth page does not show raw Supabase error messages", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    // Try to sign in with invalid credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    if (await emailInput.count() > 0) {
      await emailInput.fill("nonexistent@test.com");
      await passwordInput.fill("wrongpassword123");

      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("sign in")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Check that no raw Supabase error text appears
        const bodyText = await page.locator("body").innerText();
        expect(bodyText).not.toContain("invalid login credentials");
        expect(bodyText).not.toContain("Invalid login credentials");
      }
    }
  });

  test("admin routes redirect non-admin users", async ({ page }) => {
    // Visit admin-submissions without being logged in
    await page.goto("/admin-submissions");
    await page.waitForLoadState("networkidle");

    // Should not see admin content - look for access denied or sign-in prompt
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // The page should not show submission data
    const submissionData = page.locator("text=Email:");
    expect(await submissionData.count()).toBe(0);
  });

  test("admin-watercooler route blocks non-admin users", async ({ page }) => {
    await page.goto("/admin-watercooler");
    await page.waitForLoadState("networkidle");

    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Should not see moderation controls
    const hideButton = page.locator('button:has-text("Hide"), button:has-text("hide")');
    expect(await hideButton.count()).toBe(0);
  });

  test("messages input has maxLength", async ({ page }) => {
    await page.goto("/messages");
    await page.waitForLoadState("networkidle");

    // Even if not logged in, check if message input exists and has maxLength
    const messageInput = page.locator('input[placeholder*="message" i], input[placeholder*="write" i]').first();
    if (await messageInput.count() > 0) {
      await expect(messageInput).toHaveAttribute("maxlength", "500");
    }
  });
});
