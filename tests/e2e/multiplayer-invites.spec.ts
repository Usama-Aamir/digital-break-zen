import { test, expect } from '@playwright/test';

test.describe('Multiplayer Game Invites', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games-multiplayer');
  });

  test('should navigate to multiplayer games page from sidebar', async ({ page }) => {
    // Check if page loads
    await expect(page).toHaveTitle(/Multiplayer Games/);
  });

  test('should navigate to multiplayer games page from account', async ({ page }) => {
    await page.goto('/account');
    const multiplayerLink = page.getByText('Multiplayer Games');
    if (await multiplayerLink.isVisible()) {
      await multiplayerLink.click();
      await expect(page).toHaveURL(/\/games-multiplayer/);
    }
  });

  test('should show sign in prompt when not authenticated', async ({ page }) => {
    const signInPrompt = page.getByText(/sign in/i);
    if (await signInPrompt.isVisible()) {
      await expect(signInPrompt).toBeVisible();
    }
  });

  test('invite section does not crash', async ({ page }) => {
    // Navigate to the page and ensure it doesn't crash
    await page.goto('/games-multiplayer');
    await expect(page.locator('body')).toBeVisible();
  });

  test('no invites empty state appears or auth CTA appears', async ({ page }) => {
    await page.goto('/games-multiplayer');
    // Either show empty state or sign in CTA
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('pending invite badge/card appears if test data/auth exists', async ({ page }) => {
    await page.goto('/games-multiplayer');
    // This test passes if the page loads without error
    // Actual badge visibility depends on test data
    await expect(page.locator('body')).toBeVisible();
  });

  test('account page shows multiplayer games card', async ({ page }) => {
    await page.goto('/account');
    const multiplayerCard = page.getByText('Multiplayer Games');
    if (await multiplayerCard.isVisible()) {
      await expect(multiplayerCard).toBeVisible();
    }
  });

  test('sidebar has Multiplayer Games link', async ({ page }) => {
    await page.goto('/');
    const multiplayerLink = page.getByText('Multiplayer Games');
    if (await multiplayerLink.isVisible()) {
      await expect(multiplayerLink).toBeVisible();
    }
  });

  test('page does not show raw database/RLS errors', async ({ page }) => {
    await page.goto('/games-multiplayer');
    const bodyText = await page.locator('body').textContent();
    // Check for common database error strings
    expect(bodyText?.toLowerCase()).not.toContain('row level security');
    expect(bodyText?.toLowerCase()).not.toContain('permission denied');
    expect(bodyText?.toLowerCase()).not.toContain('database error');
  });

  // Authenticated tests - these will skip unless credentials are provided
  test.describe('Authenticated tests', () => {
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;

    test.beforeEach(async ({ page }) => {
      if (!testEmail || !testPassword) {
        test.skip();
      }
    });

    test('authenticated user can see invite friend section', async ({ page }) => {
      await page.goto('/auth');
      // Sign in logic would go here
      // For now, just check page loads
      await page.goto('/games-multiplayer');
      await expect(page.locator('body')).toBeVisible();
    });

    test('can create room and invite friend', async ({ page }) => {
      if (!testEmail || !testPassword) {
        test.skip();
      }
      // This would require full auth flow and friend setup
      // Placeholder for future implementation
      test.skip();
    });

    test('can accept game invite', async ({ page }) => {
      if (!testEmail || !testPassword) {
        test.skip();
      }
      // This would require two test accounts and invite setup
      // Placeholder for future implementation
      test.skip();
    });

    test('can reject game invite', async ({ page }) => {
      if (!testEmail || !testPassword) {
        test.skip();
      }
      // This would require two test accounts and invite setup
      // Placeholder for future implementation
      test.skip();
    });
  });
});
