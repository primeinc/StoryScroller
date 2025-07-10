import { test, expect } from '@playwright/test';

test('Quick demo functionality check', async ({ page }) => {
  const results = {
    serverRunning: false,
    sectionsFound: 0,
    navigationWorks: false,
    controlsVisible: false,
    fpsDisplayed: false,
    consoleErrors: [] as string[]
  };

  // Check server is running
  await page.goto('/');
  results.serverRunning = true;

  // Count sections
  const sections = await page.locator('section.story-scroller-section').all();
  results.sectionsFound = sections.length;

  // Check navigation
  try {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1500);
    const currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
    results.navigationWorks = currentSection === '1';
  } catch (e) {
    results.navigationWorks = false;
  }

  // Check controls
  const controlHub = await page.locator('.control-hub, [class*="control"]').first();
  results.controlsVisible = await controlHub.isVisible().catch(() => false);

  // Check FPS display
  const fpsText = await page.locator('text=/\\d+(\\.\\d+)?\\s*FPS/').first();
  results.fpsDisplayed = await fpsText.isVisible().catch(() => false);

  // Check console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push(msg.text());
    }
  });

  console.log('Demo Check Results:', JSON.stringify(results, null, 2));
  
  // Take screenshot
  await page.screenshot({ path: 'demo-state.png', fullPage: true });
});