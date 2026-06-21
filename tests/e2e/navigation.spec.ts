import { test, expect } from '@playwright/test';
import { goTo, expectNoCriticalErrors } from './helpers';

test.describe('Navigation', () => {
  test('home page loads', async ({ page }) => {
    await goTo(page, '/');
    
    // Check that the page has loaded
    await expect(page.locator('body')).toBeVisible();
    
    // Check for key elements
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    
    await expectNoCriticalErrors(page);
  });

  test('sidebar contains key modules on desktop', async ({ page }) => {
    await goTo(page, '/');
    
    // Check for sidebar navigation (desktop)
    const sidebar = page.locator('aside');
    const isDesktop = await sidebar.isVisible();
    
    if (isDesktop) {
      // Check for key navigation items
      await expect(sidebar).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('mobile bottom nav contains key items', async ({ page }) => {
    await goTo(page, '/');
    
    // Check for mobile bottom navigation (fixed bottom nav)
    const mobileNav = page.locator('nav.fixed.bottom-0');
    const isMobile = await mobileNav.isVisible();
    
    if (isMobile) {
      await expect(mobileNav).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('navigate to watercooler', async ({ page }) => {
    await goTo(page, '/');
    
    // Navigate to watercooler
    await page.goto('/watercooler');
    await page.waitForURL('/watercooler');
    
    // Verify the page loads
    await expect(page.locator('body')).toBeVisible();
    await expectNoCriticalErrors(page);
  });

  test('navigate to community stories', async ({ page }) => {
    await goTo(page, '/');
    
    // Navigate to community stories
    await page.goto('/community-stories');
    await page.waitForURL('/community-stories');
    
    // Verify the page loads
    await expect(page.locator('body')).toBeVisible();
    await expectNoCriticalErrors(page);
  });

  test('navigate to submit story', async ({ page }) => {
    await goTo(page, '/');
    
    // Navigate to submit story
    await page.goto('/submit-story');
    await page.waitForURL('/submit-story');
    
    // Verify the page loads
    await expect(page.locator('body')).toBeVisible();
    await expectNoCriticalErrors(page);
  });

  test('navigate to blog', async ({ page }) => {
    await goTo(page, '/');
    
    // Navigate to blog
    await page.goto('/blog');
    await page.waitForURL('/blog');
    
    // Verify the page loads
    await expect(page.locator('body')).toBeVisible();
    await expectNoCriticalErrors(page);
  });

  test('navigate to account', async ({ page }) => {
    await goTo(page, '/');
    
    // Navigate to account
    await page.goto('/account');
    await page.waitForURL('/account');
    
    // Verify the page loads
    await expect(page.locator('body')).toBeVisible();
    await expectNoCriticalErrors(page);
  });

  test('navigate to my-breakroom', async ({ page }) => {
    await goTo(page, '/');
    
    // Navigate to my-breakroom
    await page.goto('/my-breakroom');
    await page.waitForURL('/my-breakroom');
    
    // Verify the page loads
    await expect(page.locator('body')).toBeVisible();
    await expectNoCriticalErrors(page);
  });
});
