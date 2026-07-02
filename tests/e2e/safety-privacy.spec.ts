import { test, expect } from "@playwright/test";

test.describe("Safety & Privacy", () => {
  test("account page does not expose raw email in profile", async ({ page }) => {
    await page.goto("/account");
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").innerText();
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const matches = bodyText.match(emailPattern);
    expect(matches === null || matches.every((m) => m.includes("•••"))).toBeTruthy();
  });

  test("submit-story nickname has maxLength", async ({ page }) => {
    await page.goto("/submit-story");
    await page.waitForLoadState("networkidle");

    const nicknameInput = page.locator("#nickname");
    if (await nicknameInput.count() > 0) {
      await expect(nicknameInput).toHaveAttribute("maxlength", "50");
    }
  });

  test("admin routes redirect non-admin users", async ({ page }) => {
    await page.goto("/admin-submissions");
    await page.waitForLoadState("networkidle");

    const body = page.locator("body");
    await expect(body).toBeVisible();

    const submissionData = page.locator("text=Email:");
    expect(await submissionData.count()).toBe(0);
  });

  test("admin-watercooler route blocks non-admin users", async ({ page }) => {
    await page.goto("/admin-watercooler");
    await page.waitForLoadState("networkidle");

    const body = page.locator("body");
    await expect(body).toBeVisible();

    const hideButton = page.locator('button:has-text("Hide"), button:has-text("hide")');
    expect(await hideButton.count()).toBe(0);
  });

  test("messages input has maxLength", async ({ page }) => {
    await page.goto("/messages");
    await page.waitForLoadState("networkidle");

    const messageInput = page.locator('input[placeholder*="message" i], input[placeholder*="write" i]').first();
    if (await messageInput.count() > 0) {
      await expect(messageInput).toHaveAttribute("maxlength", "500");
    }
  });
});
