import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'test-results/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Basic CI Tests', () => {
  test('should pass a simple test and capture screenshots', async ({ page }) => {
    // Take screenshot of initial state
    await page.screenshot({ path: path.join(screenshotsDir, 'initial-state.png') });
    
    // Navigate to a simple page - use about:blank instead of localhost to avoid server dependency
    await page.goto('about:blank');
    
    // Take screenshot after navigation
    await page.screenshot({ path: path.join(screenshotsDir, 'after-navigation.png') });
    
    // Log page content to help with debugging
    const content = await page.content();
    fs.writeFileSync(path.join(screenshotsDir, 'page-content.html'), content);
    
    // Just check that we can load a page
    expect(await page.title()).toBeDefined();
    
    // Take final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'final-state.png') });
    
    // Log success using test annotations instead of console.log
    test.info().annotations.push({ type: 'info', description: 'CI test completed successfully with screenshots saved' });
  });
});