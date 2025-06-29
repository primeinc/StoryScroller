import { test as base, expect, Page } from '@playwright/test';
import { TestLogger } from './utils/test-logger';
import { ScreenshotManager } from './utils/screenshot-manager';

interface TestFixtures {
  logger: TestLogger;
  screenshots: ScreenshotManager;
  setupPage: Page;
}

/**
 * Extended Playwright test with logging and screenshot management
 * 
 * Usage:
 * import { test, expect } from './base-test';
 * 
 * test('my test', async ({ page, logger, screenshots }) => {
 *   logger.logStep('Starting test');
 *   await screenshots.takeBaseline(page);
 *   // ... test code
 * });
 */
export const test = base.extend<TestFixtures>({
  logger: async ({ }, use, testInfo) => {
    const logger = new TestLogger(testInfo.title);
    
    // Log test start
    logger.logEntry('TEST_START', `Test: ${testInfo.title}`);
    logger.logEntry('TEST_INFO', `Project: ${testInfo.project.name}`);
    logger.logEntry('TEST_INFO', `Browser: ${testInfo.project.use.browserName}`);
    
    await use(logger);
    
    // Log test end and finalize
    logger.logEntry('TEST_END', `Status: ${testInfo.status}`);
    if (testInfo.error) {
      logger.logEntry('TEST_ERROR', testInfo.error.message, { stack: testInfo.error.stack });
    }
    
    logger.finalize();
  },

  screenshots: async ({ }, use, testInfo) => {
    const screenshots = new ScreenshotManager(testInfo.title);
    await use(screenshots);
  },

  setupPage: async ({ page, logger, screenshots }, use, testInfo) => {
    // Setup comprehensive page logging
    logger.setupPageLogging(page);
    
    // Set up error handling
    page.on('crash', () => {
      logger.logEntry('PAGE_CRASH', 'Page crashed');
    });
    
    // Log navigation
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        logger.logEntry('NAVIGATION', `Navigated to: ${frame.url()}`);
      }
    });
    
    // Set default timeouts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
    
    // Take baseline screenshot before any actions
    try {
      await screenshots.takeBaseline(page, 'initial-state');
    } catch (error) {
      logger.logEntry('SCREENSHOT_ERROR', `Failed to take baseline: ${error}`);
    }
    
    await use(page);
    
    // Take final screenshot if test failed
    if (testInfo.status !== 'passed') {
      try {
        await screenshots.takeFailure(page, testInfo.error?.message);
      } catch (error) {
        logger.logEntry('SCREENSHOT_ERROR', `Failed to take failure screenshot: ${error}`);
      }
    }
  }
});

// Re-export expect for convenience
export { expect };

/**
 * Test helper functions
 */
export class TestHelpers {
  /**
   * Wait for element with logging
   */
  static async waitForElement(page: Page, selector: string, logger: TestLogger, timeout = 10000) {
    logger.logStep('Wait for element', selector);
    
    try {
      const element = await page.waitForSelector(selector, { timeout });
      logger.logEntry('ELEMENT_FOUND', `Element found: ${selector}`);
      return element;
    } catch (error) {
      logger.logEntry('ELEMENT_NOT_FOUND', `Element not found: ${selector} after ${timeout}ms`);
      throw error;
    }
  }

  /**
   * Click with logging and screenshot
   */
  static async clickWithLogging(page: Page, selector: string, logger: TestLogger, screenshots?: ScreenshotManager) {
    logger.logStep('Click element', selector);
    
    // Screenshot before click
    if (screenshots) {
      await screenshots.takeStep(page, `before-click-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
    }
    
    await page.click(selector);
    
    // Wait for any animations
    await page.waitForTimeout(500);
    
    // Screenshot after click
    if (screenshots) {
      await screenshots.takeStep(page, `after-click-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`);
    }
    
    logger.logEntry('CLICK_COMPLETED', `Clicked: ${selector}`);
  }

  /**
   * Type with logging
   */
  static async typeWithLogging(page: Page, selector: string, text: string, logger: TestLogger) {
    logger.logStep('Type text', `${selector} = "${text}"`);
    
    await page.fill(selector, text);
    
    logger.logEntry('TEXT_ENTERED', `Entered text in ${selector}: "${text}"`);
  }

  /**
   * Navigate with logging and screenshot
   */
  static async navigateWithLogging(page: Page, url: string, logger: TestLogger, screenshots?: ScreenshotManager) {
    logger.logStep('Navigate to URL', url);
    
    const response = await page.goto(url);
    
    if (response) {
      logger.logEntry('NAVIGATION_RESPONSE', `Status: ${response.status()}, URL: ${response.url()}`);
    }
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot after navigation
    if (screenshots) {
      await screenshots.takeStep(page, 'after-navigation');
    }
    
    logger.logEntry('NAVIGATION_COMPLETED', `Successfully navigated to: ${url}`);
  }

  /**
   * Assert with logging
   */
  static async assertWithLogging(condition: boolean, message: string, logger: TestLogger) {
    logger.logStep('Assert condition', message);
    
    if (condition) {
      logger.logEntry('ASSERTION_PASSED', message);
    } else {
      logger.logEntry('ASSERTION_FAILED', message);
    }
    
    expect(condition).toBeTruthy();
  }

  /**
   * Measure performance with logging
   */
  static async measurePerformance(page: Page, actionName: string, action: () => Promise<void>, logger: TestLogger) {
    logger.logStep('Performance measurement start', actionName);
    
    const startTime = Date.now();
    
    await action();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.logEntry('PERFORMANCE_MEASUREMENT', `${actionName} took ${duration}ms`);
    
    return duration;
  }

  /**
   * Check accessibility and log issues
   */
  static async checkAccessibility(page: Page, logger: TestLogger) {
    logger.logStep('Accessibility check', 'Running accessibility scan');
    
    // Basic accessibility checks
    const missingAltImages = await page.$$eval('img:not([alt])', images => images.length);
    const missingLabels = await page.$$eval('input:not([aria-label]):not([aria-labelledby])', inputs => 
      inputs.filter(input => !input.labels?.length).length
    );
    
    if (missingAltImages > 0) {
      logger.logEntry('ACCESSIBILITY_ISSUE', `${missingAltImages} images missing alt text`);
    }
    
    if (missingLabels > 0) {
      logger.logEntry('ACCESSIBILITY_ISSUE', `${missingLabels} inputs missing labels`);
    }
    
    logger.logEntry('ACCESSIBILITY_COMPLETE', `Check completed. Alt issues: ${missingAltImages}, Label issues: ${missingLabels}`);
  }
}