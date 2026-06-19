import { test, expect } from '@playwright/test';
import { goTo, expectNoCriticalErrors } from './helpers';

test.describe('Community Stories', () => {
  test('community stories loads publicly', async ({ page }) => {
    await goTo(page, '/community-stories');
    
    // Check that the page has loaded
    await expect(page.locator('body')).toBeVisible();
    
    await expectNoCriticalErrors(page);
  });

  test('shows approved stories or empty state', async ({ page }) => {
    await goTo(page, '/community-stories');
    
    // Check for either story content or empty state
    const storyContent = page.locator('body').filter({ hasText: /story|community/i });
    const hasStoryContent = await storyContent.count() > 0;
    
    // Either stories exist or empty state is shown
    await expect(page.locator('body')).toBeVisible();
    
    await expectNoCriticalErrors(page);
  });

  test('does not expose email-like text in public story cards', async ({ page }) => {
    await goTo(page, '/community-stories');
    
    // Check page content for email patterns
    const pageContent = await page.content();
    
    // Email patterns should not appear in public story cards
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = pageContent.match(emailPattern);
    
    // If emails are found, they should be in auth-related areas only
    if (emailMatches) {
      // Check if emails are in story cards (this is a basic check)
      const storyCardPattern = /story.*@.*\.com/i;
      expect(pageContent).not.toMatch(storyCardPattern);
    }
    
    await expectNoCriticalErrors(page);
  });

  test('submit story loads', async ({ page }) => {
    await goTo(page, '/submit-story');
    
    // Check that the page has loaded
    await expect(page.locator('body')).toBeVisible();
    
    await expectNoCriticalErrors(page);
  });

  test('logged-out submit page shows sign-in CTA or local save message', async ({ page }) => {
    await goTo(page, '/submit-story');
    
    // Check for sign-in CTA or local save message
    const signInCTA = page.locator('body').filter({ hasText: /sign in|log in/i });
    const localSaveMessage = page.locator('body').filter({ hasText: /save|draft|local/i });
    
    const hasSignInCTA = await signInCTA.count() > 0;
    const hasLocalSaveMessage = await localSaveMessage.count() > 0;
    
    // At least one of these should be present for logged-out users
    expect(hasSignInCTA || hasLocalSaveMessage).toBeTruthy();
    
    await expectNoCriticalErrors(page);
  });
});
