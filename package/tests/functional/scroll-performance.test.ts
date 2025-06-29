/**
 * SCROLL PERFORMANCE TESTS - Validates animation timing and responsiveness
 * Measures actual browser performance to ensure smooth user experience
 */

import { test, expect, TestHelpers } from '../base-test';

test.describe('StoryScroller Performance Validation', () => {
  test.beforeEach(async ({ setupPage, logger }) => {
    await TestHelpers.navigateWithLogging(setupPage, '/', logger);
    await TestHelpers.waitForElement(setupPage, 'body', logger);
  });

  test('should complete animations within performance target', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Test animation speed', 'Measuring actual animation duration');
    
    // Take before screenshot
    await screenshots.takeStep(page, 'before-navigation');
    
    // Trigger navigation and measure time
    const startTime = Date.now();
    
    // Simulate arrow key navigation
    await page.keyboard.press('ArrowDown');
    
    // Wait for animation to complete (should be fast, but currently isn't)
    await page.waitForTimeout(2000); // Current implementation is slow
    
    const totalTime = Date.now() - startTime;
    
    // Take after screenshot
    await screenshots.takeStep(page, 'after-navigation');
    
    logger.logEntry('ANIMATION_TIMING', `Navigation took ${totalTime}ms`);
    
    // Performance target: animations should complete within 800ms
    expect(totalTime).toBeLessThan(800); // Should be fast
  });

  test('should respond to user input quickly', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Test input responsiveness', 'Measuring response time to user input');
    
    let responseDetected = false;
    let responseTime = 0;
    
    // Listen for any scroll/animation events to detect response
    await page.evaluate(() => {
      window.addEventListener('scroll', () => {
        (window as any).scrollResponseTime = Date.now();
      });
      
      // Listen for any GSAP animations
      if ((window as any).gsap) {
        const originalTo = (window as any).gsap.to;
        (window as any).gsap.to = function(...args: any[]) {
          (window as any).gsapResponseTime = Date.now();
          return originalTo.apply(this, args);
        };
      }
    });
    
    const inputTime = Date.now();
    
    // Trigger input
    await page.keyboard.press('ArrowDown');
    
    // Check for response within reasonable time
    await page.waitForTimeout(200);
    
    // Get response timing
    const timings = await page.evaluate(() => ({
      scroll: (window as any).scrollResponseTime,
      gsap: (window as any).gsapResponseTime,
      input: (window as any).inputTime
    }));
    
    if (timings.scroll) {
      responseTime = timings.scroll - inputTime;
      responseDetected = true;
    } else if (timings.gsap) {
      responseTime = timings.gsap - inputTime;
      responseDetected = true;
    }
    
    await screenshots.takeStep(page, 'input-response-test');
    
    logger.logEntry('INPUT_RESPONSE', `Response detected: ${responseDetected}, Time: ${responseTime}ms`);
    
    // Target: User input should be acknowledged within 100ms
    expect(responseDetected).toBe(true);
    expect(responseTime).toBeLessThan(100);
  });

  test('should handle wheel events properly', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Test wheel event handling', 'Testing scroll wheel responsiveness');
    
    let wheelEventsBlocked = 0;
    let wheelEventsProcessed = 0;
    
    // Monitor wheel event handling
    await page.evaluate(() => {
      let wheelCount = 0;
      
      window.addEventListener('wheel', (e) => {
        wheelCount++;
        (window as any).wheelEventData = {
          count: wheelCount,
          deltaY: e.deltaY,
          timestamp: Date.now(),
          defaultPrevented: e.defaultPrevented
        };
      });
    });
    
    // Simulate wheel events
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
    
    const wheelData = await page.evaluate(() => (window as any).wheelEventData);
    
    await screenshots.takeStep(page, 'wheel-event-test');
    
    logger.logEntry('WHEEL_EVENT_DATA', 'Wheel event results', wheelData);
    
    // Target: Wheel events should be processed for responsive scrolling
    expect(wheelData).toBeTruthy();
    expect(wheelData.count).toBeGreaterThan(0);
  });

  test('should not have conflicting animation systems', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Test animation system conflicts', 'Checking for Lenis vs GSAP conflicts');
    
    // Check what animation systems are active
    const animationSystems = await page.evaluate(() => {
      const result = {
        lenis: !!(window as any).lenis,
        gsap: !!(window as any).gsap,
        scrollTrigger: !!(window as any).ScrollTrigger,
        lenisInstance: (window as any).lenis ? typeof (window as any).lenis : null,
        gsapVersion: (window as any).gsap ? (window as any).gsap.version : null
      };
      
      return result;
    });
    
    logger.logEntry('ANIMATION_SYSTEMS', 'Active animation systems', animationSystems);
    
    // Trigger navigation to see if systems conflict
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1000);
    
    await screenshots.takeStep(page, 'animation-systems-test');
    
    // Check console for conflicts
    const conflictLogs = logger.getLogEntries()
      .filter(entry => 
        entry.message.includes('conflict') || 
        entry.message.includes('already') ||
        entry.message.includes('duplicate')
      );
    
    logger.logEntry('CONFLICT_CHECK', `Found ${conflictLogs.length} potential conflicts`);
    
    // Should not have animation system conflicts
    expect(conflictLogs.length).toBe(0);
  });

  test('should have reasonable scroll physics', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Test scroll physics', 'Checking scroll speed and smoothness');
    
    // Get current physics configuration
    const physicsConfig = await page.evaluate(() => {
      // Try to access scroll physics constants
      return {
        lenisLerp: (window as any).lenis?.options?.lerp,
        lenisMultiplier: (window as any).lenis?.options?.wheelMultiplier,
        animationDuration: (window as any).STORY_SCROLLER_CONFIG?.animationDuration,
        url: window.location.href
      };
    });
    
    logger.logEntry('PHYSICS_CONFIG', 'Current scroll physics', physicsConfig);
    
    // Test actual scroll behavior
    const scrollStart = await page.evaluate(() => window.scrollY);
    
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500); // Half second to see if anything moved
    
    const scrollMid = await page.evaluate(() => window.scrollY);
    
    await page.waitForTimeout(1000); // Another second for full animation
    
    const scrollEnd = await page.evaluate(() => window.scrollY);
    
    await screenshots.takeStep(page, 'scroll-physics-test');
    
    logger.logEntry('SCROLL_POSITIONS', `Start: ${scrollStart}, Mid: ${scrollMid}, End: ${scrollEnd}`);
    
    // Should show movement within reasonable time
    const hasMovement = scrollEnd !== scrollStart;
    const hasMidMovement = scrollMid !== scrollStart;
    
    expect(hasMovement).toBe(true); // Should scroll at all
    
    // If lerp is too low (like 0.1), movement will be extremely slow
    if (physicsConfig.lenisLerp && physicsConfig.lenisLerp < 0.2) {
      logger.logEntry('PHYSICS_ISSUE', `Lenis lerp too low: ${physicsConfig.lenisLerp} (should be 0.3+)`);
    }
  });

  test('should not have excessive console errors (quality check)', async ({ setupPage: page, logger, screenshots }) => {
    logger.logStep('Console error check', 'Monitoring for JavaScript errors');
    
    // Load page and interact
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1000);
    
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(1000);
    
    await screenshots.takeStep(page, 'console-error-check');
    
    // Check for errors
    const allLogs = logger.getLogEntries();
    const errors = allLogs.filter(entry => entry.type.includes('ERROR'));
    const warnings = allLogs.filter(entry => entry.type.includes('WARN'));
    
    logger.logEntry('CONSOLE_SUMMARY', `Errors: ${errors.length}, Warnings: ${warnings.length}`);
    
    // Log specific errors for debugging
    errors.forEach(error => {
      logger.logEntry('ERROR_DETAIL', `${error.type}: ${error.message}`);
    });
    
    // Should not have critical errors during basic usage
    const criticalErrors = errors.filter(error => 
      error.message.includes('TypeError') ||
      error.message.includes('Cannot read property') ||
      error.message.includes('undefined is not a function')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});