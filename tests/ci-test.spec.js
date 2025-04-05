import { test, expect } from '@playwright/test';

test.describe('Basic CI Tests', () => {
  test('should pass a simple test', async ({ page }) => {
    // Navigate to a simple page
    await page.goto('http://localhost:12000');
    
    // Just check that we can load a page
    expect(await page.title()).toBeDefined();
  });
});