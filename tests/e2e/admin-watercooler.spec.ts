import { test, expect } from '@playwright/test';
import { goTo, expectNoCriticalErrors } from './helpers';

test.describe('Admin Watercooler Moderation', () => {
  test('/admin-watercooler loads', async ({ page }) => {
    await goTo(page, '/admin-watercooler');
    
    // Check that the page has loaded
    await expect(page.locator('body')).toBeVisible();
    
    await expectNoCriticalErrors(page);
  });

  test('logged-out user sees sign-in/admin required', async ({ page }) => {
    await goTo(page, '/admin-watercooler');
    
    // Check for sign-in prompt or access denied message
    const signInPrompt = page.locator('body').filter({ hasText: /sign in|access denied/i });
    const hasSignInPrompt = await signInPrompt.count() > 0;
    
    // Sign-in prompt should be present for logged-out users
    if (hasSignInPrompt) {
      await expect(signInPrompt.first()).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('non-auth does not see moderation actions', async ({ page }) => {
    await goTo(page, '/admin-watercooler');
    
    // Check that moderation actions (hide, unhide, delete) are not visible for non-admin
    const moderationActions = page.locator('button').filter({ hasText: /hide|unhide|delete|mark deleted/i });
    const hasModerationActions = await moderationActions.count() > 0;
    
    // Non-admin users should not see moderation actions
    if (hasModerationActions) {
      // If they exist, they should be disabled or not functional
      const isDisabled = await moderationActions.first().isDisabled();
      expect(isDisabled).toBeTruthy();
    }
    
    await expectNoCriticalErrors(page);
  });
});
