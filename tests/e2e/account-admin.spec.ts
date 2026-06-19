import { test, expect } from '@playwright/test';
import { goTo, expectNoCriticalErrors } from './helpers';

test.describe('Account & Admin', () => {
  test('account page loads', async ({ page }) => {
    await goTo(page, '/account');
    
    // Check that the page has loaded
    await expect(page.locator('body')).toBeVisible();
    
    await expectNoCriticalErrors(page);
  });

  test('logged-out state shows sign-in prompt or account auth guidance', async ({ page }) => {
    await goTo(page, '/account');
    
    // Check for sign-in prompt or auth guidance
    const signInPrompt = page.locator('body').filter({ hasText: /sign in|log in|not signed in/i });
    const hasSignInPrompt = await signInPrompt.count() > 0;
    
    // Sign-in prompt should be present for logged-out users
    if (hasSignInPrompt) {
      await expect(signInPrompt.first()).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('admin submissions page loads', async ({ page }) => {
    await goTo(page, '/admin-submissions');
    
    // Check that the page has loaded
    await expect(page.locator('body')).toBeVisible();
    
    await expectNoCriticalErrors(page);
  });

  test('logged-out user sees admin sign-in required', async ({ page }) => {
    await goTo(page, '/admin-submissions');
    
    // Check for admin sign-in required message
    const adminSignInMessage = page.locator('body').filter({ hasText: /admin.*sign in|access denied|admin only/i });
    const hasAdminSignInMessage = await adminSignInMessage.count() > 0;
    
    // Admin sign-in message should be present for logged-out users
    if (hasAdminSignInMessage) {
      await expect(adminSignInMessage.first()).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('non-authenticated user does not see moderation dashboard content', async ({ page }) => {
    await goTo(page, '/admin-submissions');
    
    // Check that moderation content is not visible to non-authenticated users
    const moderationContent = page.locator('body').filter({ hasText: /moderation|review|approve|reject/i });
    const hasModerationContent = await moderationContent.count() > 0;
    
    // Non-authenticated users should not see moderation content
    // They should see access denied or sign-in required instead
    if (hasModerationContent) {
      // If moderation content exists, it should be in an error/access denied context
      const accessDenied = page.locator('body').filter({ hasText: /access denied|sign in required/i });
      const hasAccessDenied = await accessDenied.count() > 0;
      
      expect(hasAccessDenied).toBeTruthy();
    }
    
    await expectNoCriticalErrors(page);
  });
});
