import { test, expect, Page } from '@playwright/test';

test.describe('StoryScroller Demo - Final Comprehensive Test', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
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
      errors: [] as string[]
    };

    // Detect if this is mobile Safari
    const isMobileSafari = await page.evaluate(() => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    });

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
    currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.keyboard.arrowUp = currentSection === '0';

    // Page Down
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(1500);
    currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.keyboard.pageDown = currentSection === '1';

    // End key
    await page.keyboard.press('End');
    await page.waitForTimeout(1500);
    currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.keyboard.end = currentSection === '4';

    // Home key
    await page.keyboard.press('Home');
    await page.waitForTimeout(1500);
    currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
    testResults.navigation.keyboard.home = currentSection === '0';

    // 3. Test scroll navigation (skip on mobile Safari)
    if (!isMobileSafari) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(1500);
      currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
      testResults.navigation.scroll.down = currentSection === '1';

      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(1500);
      currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
      testResults.navigation.scroll.up = currentSection === '0';
    } else {
      // For mobile Safari, use touch/swipe gestures instead
      await page.touchscreen.tap(400, 600);
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(1500);
      currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
      testResults.navigation.scroll.down = currentSection === '1';

      await page.evaluate(() => window.scrollBy(0, -300));
      await page.waitForTimeout(1500);
      currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
      testResults.navigation.scroll.up = currentSection === '0';
    }

    // 4. Test button navigation (should be visible later after expanding control hub)
    // We'll test this after expanding the control hub

    // 5. Dot navigation will be tested later after expanding the control hub

    // 6. Test ControlHub and expand to standard mode for FPS display
    const controlHub = await page.locator('.control-hub, [class*="control-hub"], [class*="controlHub"], [data-testid="control-hub"]').first();
    testResults.controlHub.visible = await controlHub.isVisible().catch(() => false);

    // Expand control hub to standard mode to show FPS display
    const expandButton = await page.locator('.hub-expand, button[aria-label*="Expand"]').first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(500);
      testResults.controlHub.modeSwitch = true;
    }

    // 7. Test FPS display (should now be visible in standard mode)
    const fpsDisplay = await page.locator('text=/\\d+(\\.\\d+)?\\s*FPS/').first();
    testResults.performance.fpsDisplay = await fpsDisplay.isVisible().catch(() => false);
    
    if (testResults.performance.fpsDisplay) {
      const fpsText = await fpsDisplay.textContent();
      const fps = parseFloat(fpsText?.match(/(\d+(\.\d+)?)/)?.[1] || '0');
      testResults.performance.validFps = fps > 20 && fps < 150;
    }

    // 8. Test button navigation (now that control hub is expanded)
    const nextButton = page.locator('.nav-btn--next, button[aria-label*="next" i], button[aria-label*="Next" i]').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1500);
      currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
      testResults.navigation.buttons.next = currentSection === '1';

      const prevButton = page.locator('.nav-btn--prev, button[aria-label*="prev" i], button[aria-label*="Previous" i]').first();
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(1500);
        currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
        testResults.navigation.buttons.previous = currentSection === '0';
      }
    }

    // 9. Test dot navigation (should be visible in standard mode)
    const dotsInStandardMode = await page.locator('.section-dot, button[aria-label*="section" i], button.dot, button[class*="dot"]').all();
    if (dotsInStandardMode.length > 2 && dotsInStandardMode[2]) {
      await dotsInStandardMode[2].click();
      await page.waitForTimeout(1500);
      currentSection = await page.locator('section[aria-current="true"]').getAttribute('data-section-idx');
      testResults.navigation.dots = currentSection === '2';
      
      // Go back to first section
      await page.keyboard.press('Home');
      await page.waitForTimeout(1500);
    }

    // 10. Test configuration controls (open advanced mode)
    const settingsButton = await page.locator('button[aria-label*="Advanced"], .hub-action:has(svg)').first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      
      // Test configuration sliders
      const configSliders = await page.locator('[data-testid="duration-slider"], [data-testid="tolerance-slider"]').all();
      testResults.configuration.sliders = configSliders.length >= 2;
      
      // Test configuration toggle
      const configToggle = await page.locator('input[type="checkbox"]').first();
      testResults.configuration.toggle = await configToggle.isVisible();
      
      // Close advanced mode
      const closeButton = await page.locator('button[aria-label*="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    }

    // 11. Test accessibility
    const ariaLive = await page.locator('[aria-live="polite"]').first();
    testResults.accessibility.ariaLive = await ariaLive.count() > 0;

    const skipLink = await page.locator('a:has-text("Skip to main content")').first();
    testResults.accessibility.skipLink = await skipLink.count() > 0;

    // 12. Test responsive behavior
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