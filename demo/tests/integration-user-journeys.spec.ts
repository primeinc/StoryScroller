import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Comprehensive Integration Tests for StoryScroller Demo
 * Tests complete user journeys through all components working together
 */

test.describe('StoryScroller Integration Tests - User Journeys', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Monitor console errors throughout
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Attach console error check to page
    (page as any).consoleErrors = consoleErrors;
    
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => (window as any).storyScrollerAPI);
  });

  test.afterEach(async () => {
    // Check for console errors
    const errors = (page as any).consoleErrors;
    if (errors.length > 0) {
      console.error('Console errors detected:', errors);
    }
    expect(errors).toHaveLength(0);
    
    await context.close();
  });

  test.describe('Journey 1: New User Experience', () => {
    test('Complete new user journey from discovery to configuration', async () => {
      // Step 1: First visit - see minimal progress ring
      await expect(page.locator('.control-hub--minimal')).toBeVisible();
      const progressRing = page.locator('.progress-ring');
      await expect(progressRing).toBeVisible();
      // Progress ring is a visual element without explicit aria-label
      
      // Step 2: Discover the progress ring is interactive
      await progressRing.hover();
      await expect(page.locator('[aria-label="Expand controls"]')).toBeVisible();
      
      // Step 3: Expand to standard mode
      await page.locator('[aria-label="Expand controls"]').click();
      
      // Wait for smooth transition
      await expect(page.locator('.control-hub-overlay')).toBeVisible();
      await expect(page.locator('.control-hub-overlay')).not.toBeVisible({ timeout: 1000 });
      
      // Verify standard mode elements
      await expect(page.locator('.control-hub--standard')).toBeVisible();
      await expect(page.getByText('Section 1 of 5')).toBeVisible();
      
      // Step 4: Explore navigation methods
      // Method 1: Arrow buttons
      const nextButton = page.locator('[aria-label="Next section"]');
      await nextButton.click();
      await page.waitForTimeout(1500);
      await expect(page.getByText('Section 2 of 5')).toBeVisible();
      
      // Method 2: Dot navigation
      await page.locator('[aria-label="Go to section 4"]').click();
      await page.waitForTimeout(1500);
      await expect(page.getByText('Section 4 of 5')).toBeVisible();
      
      // Method 3: Keyboard navigation
      await page.keyboard.press('Home');
      await page.waitForTimeout(1500);
      await expect(page.getByText('Section 1 of 5')).toBeVisible();
      
      // Step 5: Discover advanced mode
      const advancedButton = page.locator('[aria-label="Advanced controls"]');
      await advancedButton.click();
      await expect(page.locator('.control-hub--advanced')).toBeVisible();
      await expect(page.getByRole('dialog')).toBeVisible();
      
      // Step 6: Explore tabs
      // Performance tab
      await page.getByRole('button', { name: 'Performance' }).click();
      await expect(page.getByText('Frame Time (ms)')).toBeVisible();
      const fpsDisplay = page.locator('.metric-value').first();
      const fps = await fpsDisplay.textContent();
      expect(parseInt(fps || '0')).toBeGreaterThan(0);
      
      // Configuration tab
      await page.getByRole('button', { name: 'Configuration' }).click();
      await expect(page.getByLabel('Animation duration')).toBeVisible();
      
      // Step 7: Make configuration changes
      const durationSlider = page.getByLabel('Animation duration');
      const originalDuration = await durationSlider.inputValue();
      await durationSlider.fill('0.8');
      
      const sensitivitySlider = page.getByLabel('Scroll sensitivity');
      await sensitivitySlider.fill('30');
      
      // Toggle magnetic snap
      const magneticToggle = page.getByRole('checkbox', { name: /Magnetic Snap/i });
      const wasChecked = await magneticToggle.isChecked();
      await magneticToggle.click();
      
      // Verify pending changes indicator
      await expect(page.locator('.config-change-indicator')).toBeVisible();
      await expect(page.getByText('Changes pending')).toBeVisible();
      
      // Apply changes
      const applyButton = page.getByRole('button', { name: 'Apply Changes' });
      await expect(applyButton).toBeEnabled();
      await applyButton.click();
      
      // Verify toast notification
      await expect(page.locator('.control-hub-toast')).toBeVisible();
      await expect(page.getByText('Configuration applied successfully!')).toBeVisible();
      await expect(page.locator('.control-hub-toast')).not.toBeVisible({ timeout: 4000 });
      
      // Step 8: Test that configuration was applied
      await page.getByLabel('Close advanced controls').click();
      
      // Navigate with new settings
      const startTime = Date.now();
      await page.locator('[aria-label="Next section"]').click();
      await expect(page.getByText('Section 2 of 5')).toBeVisible();
      const endTime = Date.now();
      
      // Animation should be around 800ms
      expect(endTime - startTime).toBeGreaterThan(600);
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Check that no errors occurred
      const errors = (page as any).consoleErrors;
      expect(errors).toHaveLength(0);
    });
  });

  test.describe('Journey 2: Power User Experience', () => {
    test('Power user journey with keyboard shortcuts and performance optimization', async () => {
      // Step 1: Quick expand with keyboard
      await page.locator('[aria-label="Expand controls"]').focus();
      await expect(page.locator('[aria-label="Expand controls"]')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('.control-hub--standard')).toBeVisible();
      
      // Step 2: Rapid keyboard navigation
      const navigationSequence = [
        { key: 'ArrowDown', expectedSection: '2' },
        { key: 'ArrowDown', expectedSection: '3' },
        { key: 'PageDown', expectedSection: '4' },
        { key: 'End', expectedSection: '5' },
        { key: 'Home', expectedSection: '1' },
        { key: 'PageDown', expectedSection: '2' },
        { key: 'ArrowUp', expectedSection: '1' }
      ];
      
      for (const nav of navigationSequence) {
        await page.keyboard.press(nav.key);
        await page.waitForTimeout(300); // Quick navigation
        await expect(page.getByText(`Section ${nav.expectedSection} of 5`)).toBeVisible();
      }
      
      // Step 3: Quick access to advanced mode
      // Use keyboard to navigate to advanced button
      let tabCount = 0;
      while (tabCount < 10 && !(await page.locator('[aria-label="Advanced controls"]').evaluate(el => el === document.activeElement))) {
        await page.keyboard.press('Tab');
        tabCount++;
      }
      await page.keyboard.press('Enter');
      
      // Step 4: Navigate to configuration with keyboard
      await page.keyboard.press('Tab'); // Navigation tab
      await page.keyboard.press('Tab'); // Performance tab
      await page.keyboard.press('Tab'); // Configuration tab
      await page.keyboard.press('Enter');
      
      // Step 5: Optimize for speed
      // Set fast animation
      const durationSlider = page.getByLabel('Animation duration');
      await durationSlider.focus();
      await page.keyboard.press('Home'); // Minimum value
      await page.keyboard.press('ArrowRight'); // 0.3s
      
      // High sensitivity
      await page.keyboard.press('Tab');
      const sensitivitySlider = page.getByLabel('Scroll sensitivity');
      await sensitivitySlider.focus();
      await page.keyboard.press('End'); // Maximum sensitivity
      
      // Apply with keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Apply button
      
      // Step 6: Test performance under stress
      await page.keyboard.press('Escape'); // Close advanced mode
      
      // Rapid navigation stress test
      const stressStart = Date.now();
      const stressOps = 20;
      
      for (let i = 0; i < stressOps; i++) {
        await page.keyboard.press(i % 2 === 0 ? 'ArrowDown' : 'ArrowUp');
        await page.waitForTimeout(50); // Very quick
      }
      
      const stressEnd = Date.now();
      const avgOpTime = (stressEnd - stressStart) / stressOps;
      
      // Should handle rapid input efficiently
      expect(avgOpTime).toBeLessThan(200);
      
      // Check performance metrics
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Advanced mode
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Performance tab
      await page.keyboard.press('Enter');
      
      // FPS should still be good
      const fpsText = await page.locator('.metric-value').first().textContent();
      const fps = parseInt(fpsText || '0');
      expect(fps).toBeGreaterThan(30);
      
      // Verify no errors during stress test
      const errors = (page as any).consoleErrors;
      expect(errors).toHaveLength(0);
    });
  });

  test.describe('Journey 3: Mobile User Experience', () => {
    test.use({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });

    test('Mobile user journey with touch interactions', async () => {
      // Step 1: Initial mobile view - minimal by default
      await expect(page.locator('.control-hub--minimal')).toBeVisible();
      
      // Step 2: Touch to expand
      const progressRing = page.locator('.progress-ring');
      // Tap the expand button inside progress ring
      await page.locator('[aria-label="Expand controls"]').tap();
      await expect(page.locator('.control-hub--standard')).toBeVisible();
      
      // Step 3: Verify touch-friendly sizing
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && await button.isVisible()) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
      
      // Step 4: Touch navigation
      // Tap dots
      const dot3 = page.locator('[aria-label="Go to section 3"]');
      await dot3.tap();
      await page.waitForTimeout(1500);
      await expect(page.locator('.current-section').filter({ hasText: 'Section 3 of 5' })).toBeVisible();
      
      // Step 5: Swipe gestures
      const container = page.locator('body');
      const box = await container.boundingBox();
      
      if (box) {
        // Swipe up to next section
        await page.touchscreen.swipe({
          startX: box.x + box.width / 2,
          startY: box.y + box.height * 0.7,
          endX: box.x + box.width / 2,
          endY: box.y + box.height * 0.3,
          steps: 10,
        });
        
        await page.waitForTimeout(1500);
        await expect(page.getByText('Section 4 of 5')).toBeVisible();
        
        // Swipe down to previous
        await page.touchscreen.swipe({
          startX: box.x + box.width / 2,
          startY: box.y + box.height * 0.3,
          endX: box.x + box.width / 2,
          endY: box.y + box.height * 0.7,
          steps: 10,
        });
        
        await page.waitForTimeout(1500);
        await expect(page.locator('.current-section').filter({ hasText: 'Section 3 of 5' })).toBeVisible();
      }
      
      // Step 6: Access advanced mode on mobile
      await page.locator('[aria-label="Advanced controls"]').tap();
      await expect(page.locator('.control-hub--advanced')).toBeVisible();
      
      // Step 7: Navigate tabs with touch
      await page.getByRole('button', { name: 'Configuration' }).tap();
      
      // Step 8: Adjust configuration on mobile
      const durationSlider = page.getByLabel('Animation duration');
      const sliderBox = await durationSlider.boundingBox();
      
      if (sliderBox) {
        // Touch and drag slider
        await page.touchscreen.tap(sliderBox.x + sliderBox.width * 0.3, sliderBox.y + sliderBox.height / 2);
      }
      
      // Apply changes
      await page.getByRole('button', { name: 'Apply Changes' }).tap();
      await expect(page.locator('.control-hub-toast')).toBeVisible();
      
      // Step 9: Close and test
      await page.locator('[aria-label="Close advanced controls"]').tap();
      
      // Minimize back
      await page.locator('[aria-label="Minimize controls"]').tap();
      await expect(page.locator('.control-hub--minimal')).toBeVisible();
      
      // Verify smooth performance on mobile
      const errors = (page as any).consoleErrors;
      expect(errors).toHaveLength(0);
    });
  });

  test.describe('Journey 4: Accessibility User Experience', () => {
    test('Accessibility journey with screen reader and keyboard navigation', async () => {
      // Step 1: Enable reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      // Step 2: Full keyboard navigation
      // Tab to expand button
      await page.locator('body').click();
      await page.keyboard.press('Tab');
      await expect(page.locator('[aria-label="Expand controls"]')).toBeFocused();
      
      // Check focus visible
      const focusedElement = page.locator(':focus');
      const outline = await focusedElement.evaluate(el => 
        window.getComputedStyle(el).outline
      );
      expect(outline).not.toBe('none');
      
      // Expand
      await page.keyboard.press('Enter');
      
      // Step 3: Navigate with screen reader shortcuts
      // Tab through all interactive elements
      const interactiveElements = [];
      let previousFocused = '';
      let tabPresses = 0;
      
      while (tabPresses < 20) {
        await page.keyboard.press('Tab');
        const currentFocused = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? el.getAttribute('aria-label') || el.textContent || el.tagName : '';
        });
        
        if (currentFocused && currentFocused !== previousFocused) {
          interactiveElements.push(currentFocused);
          previousFocused = currentFocused;
        }
        
        tabPresses++;
      }
      
      // Verify all elements have labels
      expect(interactiveElements.length).toBeGreaterThan(5);
      interactiveElements.forEach(label => {
        expect(label).not.toBe('BUTTON'); // Should have proper labels
        expect(label).not.toBe('DIV');
      });
      
      // Step 4: Test ARIA live regions
      // Live regions are created dynamically (e.g., toast notifications)
      await page.locator('[aria-label="Advanced controls"]').click();
      await page.getByRole('button', { name: 'Configuration' }).click();
      await page.getByLabel('Animation duration').fill('1.5');
      await page.getByRole('button', { name: 'Apply Changes' }).click();
      
      // Toast should have live region
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeVisible();
      await expect(liveRegion).toHaveText(/Configuration applied/);
      
      await page.waitForTimeout(4000); // Wait for toast to disappear
      await page.locator('[aria-label="Close advanced controls"]').click();
      
      // Step 5: High contrast mode simulation
      await page.emulateMedia({ colorScheme: 'dark' });
      
      // Verify contrast ratios (simplified check)
      const bgColor = await page.locator('.control-hub').evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      const textColor = await page.locator('.current-section').evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      expect(bgColor).not.toBe(textColor);
      
      // Step 6: Navigate advanced mode with keyboard
      // Find and activate advanced controls
      await page.keyboard.press('Home'); // Reset
      let found = false;
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => 
          document.activeElement?.getAttribute('aria-label')
        );
        if (focused === 'Advanced controls') {
          found = true;
          break;
        }
      }
      
      expect(found).toBe(true);
      await page.keyboard.press('Enter');
      
      // Step 7: Test focus trap in modal
      await expect(page.locator('[aria-label="Close advanced controls"]')).toBeFocused();
      
      // Tab through modal
      const modalElements = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => 
          document.activeElement?.getAttribute('aria-label') || 
          document.activeElement?.textContent?.trim()
        );
        if (focused) modalElements.push(focused);
      }
      
      // Should cycle within modal
      expect(modalElements).toContain('Close advanced controls');
      
      // Step 8: Escape to close
      await page.keyboard.press('Escape');
      await expect(page.locator('.control-hub--standard')).toBeVisible();
      
      // Step 9: Verify reduced motion is respected
      // Navigate and check timing
      const motionStart = Date.now();
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('.current-section').filter({ hasText: 'Section 3 of 5' })).toBeVisible();
      const motionEnd = Date.now();
      
      // With reduced motion, should be instant or very fast
      expect(motionEnd - motionStart).toBeLessThan(500);
    });
  });

  test.describe('Journey 5: Configuration Testing Experience', () => {
    test('Configuration testing journey with edge cases and persistence', async () => {
      // Step 1: Open configuration panel
      await page.locator('[aria-label="Expand controls"]').click();
      await page.locator('[aria-label="Advanced controls"]').click();
      await page.getByRole('button', { name: 'Configuration' }).click();
      
      // Step 2: Test all configuration options
      const configs = {
        duration: {
          slider: page.getByLabel('Animation duration'),
          min: '0.2',
          max: '2',
          testValues: ['0.2', '0.5', '1', '1.5', '2']
        },
        sensitivity: {
          slider: page.getByLabel('Scroll sensitivity'),
          min: '10',
          max: '100',
          testValues: ['10', '50', '75', '100']
        }
      };
      
      // Step 3: Test edge cases
      for (const [key, config] of Object.entries(configs)) {
        const { slider, min, max, testValues } = config;
        
        // Test minimum
        await slider.fill(min);
        await expect(slider).toHaveValue(min);
        
        // Test maximum
        await slider.fill(max);
        await expect(slider).toHaveValue(max);
        
        // Test intermediate values
        for (const value of testValues) {
          await slider.fill(value);
          await expect(slider).toHaveValue(value);
        }
      }
      
      // Step 4: Test toggle options
      const magneticSnap = page.getByRole('checkbox', { name: /Magnetic Snap/i });
      const initialState = await magneticSnap.isChecked();
      
      // Toggle multiple times
      for (let i = 0; i < 3; i++) {
        await magneticSnap.click();
        await expect(magneticSnap).toHaveChecked(!initialState === (i % 2 === 0));
      }
      
      // Step 5: Test real-time preview
      await configs.duration.slider.fill('0.3');
      await configs.sensitivity.slider.fill('150');
      
      // Apply changes
      await page.getByRole('button', { name: 'Apply Changes' }).click();
      await expect(page.locator('.control-hub-toast')).toBeVisible();
      await page.waitForTimeout(4000);
      
      // Step 6: Test applied configuration
      await page.locator('[aria-label="Close advanced controls"]').click();
      
      // Fast animation test
      const fastStart = Date.now();
      await page.locator('[aria-label="Next section"]').click();
      await expect(page.getByText('Section 2 of 5')).toBeVisible();
      const fastEnd = Date.now();
      expect(fastEnd - fastStart).toBeLessThan(500);
      
      // High sensitivity test
      await page.mouse.wheel(0, 30); // Small scroll
      await page.waitForTimeout(400);
      await expect(page.locator('.current-section').filter({ hasText: 'Section 3 of 5' })).toBeVisible();
      
      // Step 7: Test configuration persistence
      // Store current values
      await page.locator('[aria-label="Advanced controls"]').click();
      await page.getByRole('button', { name: 'Configuration' }).click();
      
      const storedDuration = await configs.duration.slider.inputValue();
      const storedSensitivity = await configs.sensitivity.slider.inputValue();
      const storedMagnetic = await magneticSnap.isChecked();
      
      // Close and reopen
      await page.locator('[aria-label="Close advanced controls"]').click();
      await page.waitForTimeout(500);
      await page.locator('[aria-label="Advanced controls"]').click();
      await page.getByRole('button', { name: 'Configuration' }).click();
      
      // Verify values persisted
      expect(await configs.duration.slider.inputValue()).toBe(storedDuration);
      expect(await configs.sensitivity.slider.inputValue()).toBe(storedSensitivity);
      expect(await magneticSnap.isChecked()).toBe(storedMagnetic);
      
      // Step 8: Test reset functionality (if available)
      // Look for reset button
      const resetButton = page.getByRole('button', { name: /Reset/i });
      if (await resetButton.isVisible()) {
        await resetButton.click();
        
        // Verify defaults restored
        expect(await configs.duration.slider.inputValue()).toBe('1');
        expect(await configs.sensitivity.slider.inputValue()).toBe('50');
      }
      
      // Step 9: Performance impact test
      // Set extreme values
      await configs.duration.slider.fill('0.2');
      await configs.sensitivity.slider.fill('200');
      await page.getByRole('button', { name: 'Apply Changes' }).click();
      await page.waitForTimeout(4000);
      
      // Navigate to Performance tab
      await page.getByRole('button', { name: 'Performance' }).click();
      
      // Check performance metrics
      const fpsValue = await page.locator('.metric-value').first().textContent();
      const fps = parseInt(fpsValue || '0');
      expect(fps).toBeGreaterThan(30); // Should still be smooth
      
      // Check memory
      const metrics = await page.metrics();
      expect(metrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024);
    });
  });

  test.describe('Long Session Stability', () => {
    test('Extended usage without performance degradation or memory leaks', async () => {
      // Track performance over time
      const performanceMarkers: number[] = [];
      
      // Step 1: Simulate 50 navigation cycles
      await page.locator('[aria-label="Expand controls"]').click();
      
      for (let cycle = 0; cycle < 50; cycle++) {
        // Navigate through all sections
        for (let section = 2; section <= 5; section++) {
          await page.locator(`[aria-label="Go to section ${section}"]`).click();
          await page.waitForTimeout(200); // Quick navigation
        }
        
        // Back to start
        await page.keyboard.press('Home');
        await page.waitForTimeout(200);
        
        // Every 10 cycles, check performance
        if (cycle % 10 === 9) {
          // Check FPS is still good
          const fpsText = await page.locator('.badge--fps').textContent();
          const fps = parseInt(fpsText?.replace(' FPS', '') || '0');
          performanceMarkers.push(fps);
          expect(fps).toBeGreaterThan(30);
        }
      }
      
      // Step 2: Mode transitions stress test
      for (let i = 0; i < 20; i++) {
        // Minimize
        await page.locator('[aria-label="Minimize controls"]').click();
        await page.waitForTimeout(100);
        
        // Expand
        await page.locator('[aria-label="Expand controls"]').click();
        await page.waitForTimeout(100);
        
        // Advanced
        await page.locator('[aria-label="Advanced controls"]').click();
        await page.waitForTimeout(100);
        
        // Close
        await page.locator('[aria-label="Close advanced controls"]').click();
        await page.waitForTimeout(100);
      }
      
      // Step 3: Configuration changes stress test
      await page.locator('[aria-label="Advanced controls"]').click();
      await page.getByRole('button', { name: 'Configuration' }).click();
      
      const durationSlider = page.getByLabel('Animation duration');
      
      for (let i = 0; i < 10; i++) {
        await durationSlider.fill(String(0.3 + (i * 0.15)));
        await page.getByRole('button', { name: 'Apply Changes' }).click();
        await page.waitForTimeout(500);
      }
      
      // Step 4: Final performance check
      await page.getByRole('button', { name: 'Performance' }).click();
      
      const finalFps = await page.locator('.metric-value').first().textContent();
      expect(parseInt(finalFps || '0')).toBeGreaterThan(30);
      
      // Performance should remain consistent
      const avgFps = performanceMarkers.reduce((a, b) => a + b, 0) / performanceMarkers.length;
      expect(avgFps).toBeGreaterThan(50);
      
      // No console errors throughout
      const errors = (page as any).consoleErrors;
      expect(errors).toHaveLength(0);
    });
  });

  test.describe('Cross-Component Integration', () => {
    test('All components work together seamlessly', async () => {
      // Step 1: StoryScroller and ControlHub sync
      await page.locator('[aria-label="Expand controls"]').click();
      
      // Use StoryScroller API directly
      await page.evaluate(() => {
        (window as any).storyScrollerAPI.gotoSection(2);
      });
      
      await page.waitForTimeout(1500);
      
      // ControlHub should reflect the change
      await expect(page.locator('.current-section').filter({ hasText: 'Section 3 of 5' })).toBeVisible();
      const dot3 = page.locator('[aria-label="Go to section 3"]');
      await expect(dot3).toHaveAttribute('aria-current', 'true');
      
      // Step 2: Scroll events update ControlHub
      await page.mouse.wheel(0, 100);
      
      // Should show animating state
      await expect(page.getByText('Animating')).toBeVisible();
      await expect(page.getByText('Animating')).not.toBeVisible({ timeout: 2000 });
      
      // Step 3: Configuration affects StoryScroller
      await page.locator('[aria-label="Advanced controls"]').click();
      await page.getByRole('button', { name: 'Configuration' }).click();
      
      // Set very slow animation
      await page.getByLabel('Animation duration').fill('2');
      await page.getByRole('button', { name: 'Apply Changes' }).click();
      await page.waitForTimeout(4000);
      
      // Test slow animation
      await page.locator('[aria-label="Close advanced controls"]').click();
      
      const slowStart = Date.now();
      await page.locator('[aria-label="Next section"]').click();
      
      // Should see animating state for longer
      await expect(page.getByText('Animating')).toBeVisible();
      await page.waitForTimeout(1000);
      await expect(page.getByText('Animating')).toBeVisible(); // Still animating
      
      await expect(page.getByText('Section 5 of 5')).toBeVisible({ timeout: 3000 });
      const slowEnd = Date.now();
      
      expect(slowEnd - slowStart).toBeGreaterThan(1800);
      
      // Step 4: Performance monitoring during navigation
      await page.locator('[aria-label="Advanced controls"]').click();
      await page.getByRole('button', { name: 'Performance' }).click();
      
      // Monitor while navigating
      const perfValues = [];
      
      // Start navigation in background
      page.locator('[aria-label="Go to section 1"]').click();
      
      // Collect performance data during animation
      for (let i = 0; i < 5; i++) {
        const fps = await page.locator('.metric-value').first().textContent();
        perfValues.push(parseInt(fps || '0'));
        await page.waitForTimeout(200);
      }
      
      // Should maintain good performance during animation
      perfValues.forEach(fps => {
        expect(fps).toBeGreaterThan(24); // Minimum acceptable FPS
      });
      
      // Step 5: All navigation methods work together
      await page.locator('[aria-label="Close advanced controls"]').click();
      
      // Mix navigation methods
      await page.keyboard.press('ArrowDown'); // Keyboard
      await page.waitForTimeout(2000);
      await expect(page.getByText('Section 2 of 5')).toBeVisible();
      
      await page.locator('[aria-label="Go to section 4"]').click(); // Dot
      await page.waitForTimeout(2000);
      await expect(page.getByText('Section 4 of 5')).toBeVisible();
      
      await page.mouse.wheel(0, -100); // Scroll
      await page.waitForTimeout(2000);
      await expect(page.locator('.current-section').filter({ hasText: 'Section 3 of 5' })).toBeVisible();
      
      await page.locator('[aria-label="Previous section"]').click(); // Button
      await page.waitForTimeout(2000);
      await expect(page.getByText('Section 2 of 5')).toBeVisible();
      
      // Final state consistency check
      const currentSection = await page.evaluate(() => {
        return (window as any).storyScrollerAPI.getCurrentSection();
      });
      expect(currentSection).toBe(1); // 0-indexed, so section 2
      
      // No errors throughout
      const errors = (page as any).consoleErrors;
      expect(errors).toHaveLength(0);
    });
  });
});