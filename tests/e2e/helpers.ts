import { Page, expect } from '@playwright/test';

export async function expectPageReady(page: Page) {
  // Wait for the page to be in a stable state
  await page.waitForLoadState('networkidle');
  
  // Check that the page has loaded some content
  const body = page.locator('body');
  await expect(body).toBeVisible();
}

export async function goTo(page: Page, path: string) {
  await page.goto(path);
  await expectPageReady(page);
}

export async function expectNoCriticalErrors(page: Page) {
  // Listen for console errors
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore harmless errors
      if (!text.includes('ResizeObserver') && 
          !text.includes('Warning:') &&
          !text.includes('Not implemented')) {
        errors.push(text);
      }
    }
  });
  
  // Wait a bit to catch any errors
  await page.waitForTimeout(1000);
  
  // Fail if there are critical errors
  if (errors.length > 0) {
    throw new Error(`Critical console errors found:\n${errors.join('\n')}`);
  }
}
