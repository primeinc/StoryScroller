import { test, expect, Page } from '@playwright/test';

test.describe('StoryScroller Demo - Final Comprehensive Test', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Complete demo functionality verification', async () => {
    const testResults = {
      sections: { total: 0, allVisible: false },
      navigation: { 
        keyboard: { arrowDown: false, arrowUp: false, pageDown: false, pageUp: false, home: false, end: false },
        scroll: { down: false, up: false },
        buttons: { next: false, previous: false },
        dots: false
      },
      controlHub: { visible: false, modeSwitch: false },
      configuration: { sliders: false, toggle: false },
      performance: { fpsDisplay: false, validFps: false },
      accessibility: { ariaLive: false, skipLink: false, announcements: false },
      responsive: { desktop: false, tablet: false, mobile: false },
      errors: []
    };

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.errors.push(msg.text());
      }
    });

    // 1. Check all sections
    const sections = await page.locator('section.story-scroller-section').all();
    testResults.sections.total = sections.length;
    testResults.sections.allVisible = sections.length === 5;

    // 2. Test keyboard navigation
    // Arrow Down
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1500);
    let currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.keyboard.arrowDown = currentSection === '1';

    // Arrow Up
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(1500);
    currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.keyboard.arrowUp = currentSection === '0';

    // Page Down
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(1500);
    currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.keyboard.pageDown = currentSection === '1';

    // End key
    await page.keyboard.press('End');
    await page.waitForTimeout(1500);
    currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.keyboard.end = currentSection === '4';

    // Home key
    await page.keyboard.press('Home');
    await page.waitForTimeout(1500);
    currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.keyboard.home = currentSection === '0';

    // 3. Test scroll navigation
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1500);
    currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.scroll.down = currentSection === '1';

    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(1500);
    currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.scroll.up = currentSection === '0';

    // 4. Test button navigation (if visible)
    const nextButton = page.locator('button:has-text("→"), button[aria-label*="next" i], button[aria-label*="Next" i]').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1500);
      currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
      testResults.navigation.buttons.next = currentSection === '1';

      const prevButton = page.locator('button:has-text("←"), button[aria-label*="prev" i], button[aria-label*="Previous" i]').first();
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(1500);
        currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
        testResults.navigation.buttons.previous = currentSection === '0';
      }
    }

    // 5. Test dot navigation
    const dots = await page.locator('button[aria-label*="section" i], button.dot, button[class*="dot"]').all();
    if (dots.length > 0) {
      await dots[2].click();
      await page.waitForTimeout(1500);
      currentSection = await page.locator('[aria-current="true"]').getAttribute('data-section-idx');
      testResults.navigation.dots = currentSection === '2';
      
      // Go back to first section
      await page.keyboard.press('Home');
      await page.waitForTimeout(1500);
    }

    // 6. Test ControlHub
    const controlHub = await page.locator('.control-hub, [class*="control-hub"], [class*="controlHub"], [data-testid="control-hub"]').first();
    testResults.controlHub.visible = await controlHub.isVisible().catch(() => false);

    // 7. Test FPS display
    const fpsDisplay = await page.locator('text=/\\d+(\\.\\d+)?\\s*FPS/').first();
    testResults.performance.fpsDisplay = await fpsDisplay.isVisible().catch(() => false);
    
    if (testResults.performance.fpsDisplay) {
      const fpsText = await fpsDisplay.textContent();
      const fps = parseFloat(fpsText?.match(/(\d+(\.\d+)?)/)?.[1] || '0');
      testResults.performance.validFps = fps > 20 && fps < 150;
    }

    // 8. Test accessibility
    const ariaLive = await page.locator('[aria-live="polite"]').first();
    testResults.accessibility.ariaLive = await ariaLive.count() > 0;

    const skipLink = await page.locator('a:has-text("Skip to main content")').first();
    testResults.accessibility.skipLink = await skipLink.count() > 0;

    // 9. Test responsive behavior
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    testResults.responsive.desktop = await page.locator('section.story-scroller-section').first().isVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    testResults.responsive.tablet = await page.locator('section.story-scroller-section').first().isVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    testResults.responsive.mobile = await page.locator('section.story-scroller-section').first().isVisible();

    // Output results
    console.log('=== STORYSCROLLER DEMO TEST RESULTS ===');
    console.log(JSON.stringify(testResults, null, 2));

    // Assertions
    expect(testResults.sections.allVisible).toBe(true);
    expect(testResults.errors).toHaveLength(0);
    expect(testResults.navigation.keyboard.arrowDown).toBe(true);
    expect(testResults.navigation.keyboard.home).toBe(true);
    expect(testResults.performance.fpsDisplay).toBe(true);
    expect(testResults.accessibility.skipLink).toBe(true);
  });
});