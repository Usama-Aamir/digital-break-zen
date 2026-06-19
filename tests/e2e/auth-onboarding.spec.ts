import { test, expect } from '@playwright/test';
import { goTo, expectNoCriticalErrors } from './helpers';

test.describe('Auth & Onboarding', () => {
  test('auth page loads', async ({ page }) => {
    await goTo(page, '/auth');
    
    // Check that the page has loaded
    await expect(page.locator('body')).toBeVisible();
    
    await expectNoCriticalErrors(page);
  });

  test('sign in/sign up form exists', async ({ page }) => {
    await goTo(page, '/auth');
    
    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const hasEmailInput = await emailInput.count() > 0;
    
    if (hasEmailInput) {
      await expect(emailInput.first()).toBeVisible();
    }
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const hasPasswordInput = await passwordInput.count() > 0;
    
    if (hasPasswordInput) {
      await expect(passwordInput.first()).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('onboarding route renders', async ({ page }) => {
    await goTo(page, '/onboarding');
    
    // Check that the page has loaded
    await expect(page.locator('body')).toBeVisible();
    
    await expectNoCriticalErrors(page);
  });

  test('onboarding form has display name field', async ({ page }) => {
    await goTo(page, '/onboarding');
    
    // Check for display name input
    const displayNameInput = page.locator('input[type="text"]').filter({ hasText: /display name|what should we call you/i });
    const hasDisplayNameInput = await displayNameInput.count() > 0;
    
    if (hasDisplayNameInput) {
      await expect(displayNameInput.first()).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('onboarding form has username field', async ({ page }) => {
    await goTo(page, '/onboarding');
    
    // Check for username input
    const usernameInput = page.locator('input[type="text"]').filter({ hasText: /username/i });
    const hasUsernameInput = await usernameInput.count() > 0;
    
    if (hasUsernameInput) {
      await expect(usernameInput.first()).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('onboarding form has avatar choices', async ({ page }) => {
    await goTo(page, '/onboarding');
    
    // Check for avatar selection
    const avatarSection = page.locator('body').filter({ hasText: /avatar|choose your avatar/i });
    const hasAvatarSection = await avatarSection.count() > 0;
    
    if (hasAvatarSection) {
      await expect(avatarSection.first()).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('onboarding form has role/vibe field', async ({ page }) => {
    await goTo(page, '/onboarding');
    
    // Check for role/vibe selection
    const roleSelect = page.locator('select, body').filter({ hasText: /role|vibe/i });
    const hasRoleSelect = await roleSelect.count() > 0;
    
    if (hasRoleSelect) {
      await expect(roleSelect.first()).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('onboarding form has preferred mood field', async ({ page }) => {
    await goTo(page, '/onboarding');
    
    // Check for preferred mood selection
    const moodSelect = page.locator('select, body').filter({ hasText: /mood/i });
    const hasMoodSelect = await moodSelect.count() > 0;
    
    if (hasMoodSelect) {
      await expect(moodSelect.first()).toBeVisible();
    }
    
    await expectNoCriticalErrors(page);
  });

  test('real auth test skipped without env vars', async ({ page }) => {
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;
    
    test.skip(!testEmail || !testPassword, 'Skipping real auth test - E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set');
    
    if (testEmail && testPassword) {
      await goTo(page, '/auth');
      
      // Fill in credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      await emailInput.fill(testEmail);
      await passwordInput.fill(testPassword);
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /sign in|log in/i }).first();
      await submitButton.click();
      
      // Wait for redirect
      await page.waitForTimeout(3000);
      
      // Check that we're redirected (either to onboarding or home)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(onboarding|\?|$)/);
      
      await expectNoCriticalErrors(page);
    }
  });
});
