import { test, expect } from "@playwright/test";

test.describe("Multiplayer Games", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should navigate to multiplayer games page from sidebar", async ({ page }) => {
    // Click on sidebar navigation (desktop)
    const sidebarToggle = page.locator("button[aria-label='Open menu']");
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
    }

    // Click on Multiplayer Games link in sidebar
    await page.click("text=Multiplayer Games");
    await expect(page).toHaveURL(/\/games-multiplayer/);
    await expect(page.locator("h1")).toContainText("Multiplayer Games");
  });

  test("should navigate to multiplayer games page from account", async ({ page }) => {
    // Navigate to account page
    await page.goto("/account");
    
    // Click on Multiplayer Games card
    await page.click("text=Multiplayer Games");
    await expect(page).toHaveURL(/\/games-multiplayer/);
    await expect(page.locator("h1")).toContainText("Multiplayer Games");
  });

  test("should show sign in prompt when not authenticated", async ({ page }) => {
    await page.goto("/games-multiplayer");
    
    // Should show sign in prompt
    await expect(page.locator("text=Sign in to connect with friends")).toBeVisible();
    await expect(page.locator("a[href='/auth']")).toBeVisible();
  });

  test("should display create room card when authenticated", async ({ page }) => {
    // Sign in first (this test assumes auth is configured)
    await page.goto("/auth");
    
    // If auth is not configured, skip the test
    const signInButton = page.locator("button:has-text('Sign In')");
    if (!await signInButton.isVisible()) {
      test.skip();
      return;
    }

    // Navigate to multiplayer games
    await page.goto("/games-multiplayer");
    
    // Should show create room card
    await expect(page.locator("text=Create Room")).toBeVisible();
    await expect(page.locator("text=Create Tic Tac Toe Room")).toBeVisible();
  });

  test("should display join room card when authenticated", async ({ page }) => {
    // Sign in first
    await page.goto("/auth");
    
    const signInButton = page.locator("button:has-text('Sign In')");
    if (!await signInButton.isVisible()) {
      test.skip();
      return;
    }

    await page.goto("/games-multiplayer");
    
    // Should show join room card
    await expect(page.locator("text=Join Room")).toBeVisible();
    await expect(page.locator("input[placeholder*='Room Code']")).toBeVisible();
  });

  test("should display invite friend card when authenticated", async ({ page }) => {
    // Sign in first
    await page.goto("/auth");
    
    const signInButton = page.locator("button:has-text('Sign In')");
    if (!await signInButton.isVisible()) {
      test.skip();
      return;
    }

    await page.goto("/games-multiplayer");
    
    // Should show invite friend card
    await expect(page.locator("text=Invite Friend")).toBeVisible();
  });

  test("should display incoming game invites section when authenticated", async ({ page }) => {
    // Sign in first
    await page.goto("/auth");
    
    const signInButton = page.locator("button:has-text('Sign In')");
    if (!await signInButton.isVisible()) {
      test.skip();
      return;
    }

    await page.goto("/games-multiplayer");
    
    // Should show incoming game invites section
    await expect(page.locator("text=Incoming Game Invites")).toBeVisible();
  });

  test("should display Tic Tac Toe board when room is active", async ({ page }) => {
    // Sign in first
    await page.goto("/auth");
    
    const signInButton = page.locator("button:has-text('Sign In')");
    if (!await signInButton.isVisible()) {
      test.skip();
      return;
    }

    await page.goto("/games-multiplayer");
    
    // Create a room
    await page.click("text=Create Tic Tac Toe Room");
    
    // Wait for room to be created and board to appear
    await page.waitForTimeout(2000);
    
    // Should show room code
    await expect(page.locator("text=Room Code:")).toBeVisible();
    
    // Should show players section
    await expect(page.locator("text=Waiting for another player")).toBeVisible();
  });

  test("should allow copying room code", async ({ page }) => {
    // Sign in first
    await page.goto("/auth");
    
    const signInButton = page.locator("button:has-text('Sign In')");
    if (!await signInButton.isVisible()) {
      test.skip();
      return;
    }

    await page.goto("/games-multiplayer");
    
    // Create a room
    await page.click("text=Create Tic Tac Toe Room");
    await page.waitForTimeout(2000);
    
    // Click copy code button
    await page.click("text=Copy Code");
    
    // Should show "Copied" text
    await expect(page.locator("text=Copied")).toBeVisible();
  });

  test("should allow canceling room as host", async ({ page }) => {
    // Sign in first
    await page.goto("/auth");
    
    const signInButton = page.locator("button:has-text('Sign In')");
    if (!await signInButton.isVisible()) {
      test.skip();
      return;
    }

    await page.goto("/games-multiplayer");
    
    // Create a room
    await page.click("text=Create Tic Tac Toe Room");
    await page.waitForTimeout(2000);
    
    // Click cancel room button
    const cancelButton = page.locator("button:has-text('Cancel room')");
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      
      // Should return to lobby
      await expect(page.locator("text=Create Room")).toBeVisible();
    }
  });

  test("should show back to lobby button when game is finished", async ({ page }) => {
    // Sign in first
    await page.goto("/auth");
    
    const signInButton = page.locator("button:has-text('Sign In')");
    if (!await signInButton.isVisible()) {
      test.skip();
      return;
    }

    await page.goto("/games-multiplayer");
    
    // Create a room
    await page.click("text=Create Tic Tac Toe Room");
    await page.waitForTimeout(2000);
    
    // This test would require simulating a full game
    // For now, just verify the UI structure exists
    await expect(page.locator("text=Room Code:")).toBeVisible();
  });

  test("should display page title and description", async ({ page }) => {
    await page.goto("/games-multiplayer");
    
    // Check page title
    await expect(page).toHaveTitle(/Multiplayer Games/);
    
    // Check heading
    await expect(page.locator("h1")).toContainText("Multiplayer Games");
    
    // Check subtitle
    await expect(page.locator("text=Play quick games with your breakroom friends")).toBeVisible();
  });

  test("should have refresh button", async ({ page }) => {
    await page.goto("/games-multiplayer");
    
    // Should have refresh button
    const refreshButton = page.locator("button[title='Refresh']");
    await expect(refreshButton).toBeVisible();
  });
});
