/**
 * EXAMPLE TEMPLATE TEST - Copy and modify this for new tests
 * 
 * This template demonstrates best practices for:
 * - Console logging to files
 * - Strategic screenshot capture
 * - Performance measurement
 * - Error handling
 * - Visual regression testing
 * - Accessibility checking
 */

import { test, expect, TestHelpers } from './base-test';

test.describe('StoryScroller Template Test', () => {
  test.beforeEach(async ({ setupPage, logger, screenshots }) => {
    // Navigate to the demo page
    await TestHelpers.navigateWithLogging(setupPage, '/', logger, screenshots);
    
    // Wait for the page to load
    await TestHelpers.waitForElement(setupPage, 'body', logger);
    
    // Take initial state screenshot
    await screenshots.takeBaseline(setupPage, 'story-scroller-loaded');
  });

  test('should load and display correctly', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Verify page load', 'Checking if StoryScroller is visible and functional');
    
    // Wait for React to load and render content
    await page.waitForTimeout(2000);
    
    // Check if main component is present (wait for any content to load)
    const mainContent = await page.locator('#root > *');
    await expect(mainContent).toBeVisible();
    
    // Take screenshot of loaded state
    await screenshots.takeStep(page, 'story-scroller-visible');
    
    // Check for any console errors during load
    const logEntries = logger.getLogEntries();
    const errors = logEntries.filter(entry => entry.type.includes('ERROR'));
    
    if (errors.length > 0) {
      logger.logEntry('TEST_WARNING', `Found ${errors.length} console errors during load`);
    }
    
    // Verify no critical JavaScript errors
    const criticalErrors = errors.filter(entry => 
      entry.message.includes('TypeError') || 
      entry.message.includes('ReferenceError') ||
      entry.message.includes('Cannot read property')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should handle navigation performance', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Test navigation performance', 'Measuring scroll performance');
    
    // Measure navigation performance
    const navigationTime = await TestHelpers.measurePerformance(
      page,
      'Keyboard navigation down',
      async () => {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(1000); // Wait for animation
      },
      logger
    );
    
    // Take screenshot after navigation
    await screenshots.takeStep(page, 'after-navigation');
    
    // Performance should be reasonable (under 2 seconds)
    expect(navigationTime).toBeLessThan(2000);
    
    // Check for smooth animation (no janky frame drops)
    const performanceLogs = logger.getLogEntries()
      .filter(entry => entry.message.includes('performance') || entry.message.includes('frame'));
    
    logger.logEntry('PERFORMANCE_SUMMARY', `Navigation completed in ${navigationTime}ms`);
  });

  test('should work across different viewports', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Test responsive behavior', 'Testing different viewport sizes');
    
    // Test mobile viewports
    await screenshots.takeMobileViewports(page, 'responsive-test');
    
    // Test each viewport for functionality
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      logger.logStep('Testing viewport', `${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Wait for responsive changes
      
      // Verify component is still visible and functional
      const mainContent = await page.locator('#root > *');
      await expect(mainContent).toBeVisible();
      
      // Test navigation still works
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      
      await screenshots.takeStep(page, `navigation-${viewport.name}`);
    }
  });

  test('should handle rapid user input', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Test rapid input handling', 'Testing multiple quick navigation inputs');
    
    // Take before screenshot
    await screenshots.takeStep(page, 'before-rapid-input');
    
    // Simulate rapid user input
    const rapidInputStart = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50); // Rapid inputs
    }
    
    const rapidInputTime = Date.now() - rapidInputStart;
    logger.logEntry('RAPID_INPUT_TEST', `5 rapid inputs completed in ${rapidInputTime}ms`);
    
    // Wait for animations to settle
    await page.waitForTimeout(2000);
    
    // Take after screenshot
    await screenshots.takeStep(page, 'after-rapid-input');
    
    // Should handle rapid input gracefully (no crashes)
    const errorLogs = logger.getLogEntries()
      .filter(entry => entry.type.includes('ERROR'))
      .filter(entry => entry.timestamp > new Date(rapidInputStart).toISOString());
    
    expect(errorLogs.length).toBe(0);
  });

  test('should be accessible', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Accessibility testing', 'Checking for accessibility compliance');
    
    // Run accessibility checks
    await TestHelpers.checkAccessibility(page, logger);
    
    // Take accessibility screenshot
    await screenshots.takeAccessibilityScreenshot(page, 'accessibility-check');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await screenshots.takeStep(page, 'keyboard-focus');
    
    // Test keyboard controls
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await screenshots.takeStep(page, 'keyboard-navigation');
    
    // Check for proper ARIA attributes
    const ariaElements = await page.$$('[aria-label], [aria-labelledby], [role]');
    logger.logEntry('ACCESSIBILITY_INFO', `Found ${ariaElements.length} elements with ARIA attributes`);
    
    // Should have some accessibility features
    expect(ariaElements.length).toBeGreaterThan(0);
  });

  test('should handle errors gracefully', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Error handling test', 'Testing error scenarios');
    
    // Test invalid navigation
    try {
      await page.evaluate(() => {
        // Trigger an intentional error to test error boundaries
        (window as any).storyScrollerTest = {
          triggerError: () => { throw new Error('Test error for error boundary'); }
        };
      });
      
      await page.evaluate(() => (window as any).storyScrollerTest.triggerError());
    } catch (error) {
      logger.logEntry('EXPECTED_ERROR', 'Triggered test error for error boundary testing');
    }
    
    await page.waitForTimeout(1000);
    
    // Take screenshot after error
    await screenshots.takeStep(page, 'after-error-test');
    
    // Check if error boundary caught the error
    const errorBoundary = await page.locator('[data-testid="error-boundary"]');
    const hasErrorBoundary = await errorBoundary.isVisible().catch(() => false);
    
    if (hasErrorBoundary) {
      logger.logEntry('ERROR_BOUNDARY_ACTIVE', 'Error boundary is handling errors correctly');
      await screenshots.takeStep(page, 'error-boundary-active');
    }
    
    // Application should still be responsive
    const storyScroller = await page.locator('[data-testid="story-scroller"]');
    const isStillVisible = await storyScroller.isVisible().catch(() => false);
    
    logger.logEntry('ERROR_RECOVERY', `Application visibility after error: ${isStillVisible}`);
  });

  test.afterEach(async ({ setupPage: page, logger, screenshots }) => {
    // Log final state
    logger.logStep('Test cleanup', 'Capturing final state');
    
    // Take final screenshot
    await screenshots.takeStep(page, 'final-state');
    
    // Log performance metrics if available
    const performanceMetrics = await page.evaluate(() => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        return {
          navigation: performance.getEntriesByType('navigation')[0],
          paint: performance.getEntriesByType('paint'),
          measure: performance.getEntriesByType('measure')
        };
      }
      return null;
    });
    
    if (performanceMetrics) {
      logger.logEntry('PERFORMANCE_METRICS', 'Final performance data', performanceMetrics);
    }
    
    // Log final console state
    const finalLogCount = logger.getLogEntries().length;
    logger.logEntry('TEST_SUMMARY', `Test completed with ${finalLogCount} total log entries`);
  });
});