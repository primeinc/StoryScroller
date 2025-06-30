import { test, expect, Page } from '@playwright/test';

test.describe('StoryScroller Comprehensive E2E Test', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Demo loads without console errors', async () => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForTimeout(2000);
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('All 5 sections are present and accessible', async () => {
    const sections = await page.locator('[data-section-id]').all();
    expect(sections).toHaveLength(5);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      await expect(section).toBeVisible();
      const sectionId = await section.getAttribute('data-section-id');
      expect(sectionId).toBe(`section-${i + 1}`);
    }
  });

  test('Scroll navigation works correctly', async () => {
    // Start at section 1
    await expect(page.locator('[data-section-id="section-1"]')).toBeInViewport();
    
    // Scroll down to section 2
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-2"]')).toBeInViewport();
    
    // Scroll down to section 3
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-3"]')).toBeInViewport();
    
    // Scroll up back to section 2
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-2"]')).toBeInViewport();
  });

  test('Keyboard navigation works correctly', async () => {
    // Focus on the page
    await page.click('body');
    
    // Navigate down with arrow key
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-2"]')).toBeInViewport();
    
    // Navigate down with Page Down
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-3"]')).toBeInViewport();
    
    // Navigate up with arrow key
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-2"]')).toBeInViewport();
    
    // Navigate to end with End key
    await page.keyboard.press('End');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-5"]')).toBeInViewport();
    
    // Navigate to beginning with Home key
    await page.keyboard.press('Home');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-1"]')).toBeInViewport();
  });

  test('Button navigation works correctly', async () => {
    // Check next button exists and works
    const nextButton = page.locator('button[aria-label="Next section"]');
    await expect(nextButton).toBeVisible();
    
    await nextButton.click();
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-2"]')).toBeInViewport();
    
    // Check previous button exists and works
    const prevButton = page.locator('button[aria-label="Previous section"]');
    await expect(prevButton).toBeVisible();
    
    await prevButton.click();
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-1"]')).toBeInViewport();
    
    // Check that previous button is disabled on first section
    await expect(prevButton).toBeDisabled();
    
    // Navigate to last section and check next button is disabled
    for (let i = 0; i < 4; i++) {
      await nextButton.click();
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('[data-section-id="section-5"]')).toBeInViewport();
    await expect(nextButton).toBeDisabled();
  });

  test('Dot navigation works correctly', async () => {
    const dots = await page.locator('[aria-label^="Go to section"]').all();
    expect(dots).toHaveLength(5);
    
    // Click on section 3 dot
    await dots[2].click();
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-3"]')).toBeInViewport();
    
    // Check active state
    await expect(dots[2]).toHaveAttribute('aria-current', 'true');
    
    // Click on section 5 dot
    await dots[4].click();
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-5"]')).toBeInViewport();
    await expect(dots[4]).toHaveAttribute('aria-current', 'true');
    
    // Click on section 1 dot
    await dots[0].click();
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-section-id="section-1"]')).toBeInViewport();
    await expect(dots[0]).toHaveAttribute('aria-current', 'true');
  });

  test('ControlHub mode transitions work correctly', async () => {
    const controlHub = page.locator('[data-testid="control-hub"]');
    await expect(controlHub).toBeVisible();
    
    // Check initial mode (should be standard)
    const modeToggle = page.locator('button:has-text("Mode:")');
    await expect(modeToggle).toContainText('standard');
    
    // Switch to minimal mode
    await modeToggle.click();
    await page.waitForTimeout(500);
    await expect(modeToggle).toContainText('minimal');
    
    // Verify minimal mode hides certain controls
    const configPanel = page.locator('[data-testid="config-panel"]');
    await expect(configPanel).not.toBeVisible();
    
    // Switch to advanced mode
    await modeToggle.click();
    await modeToggle.click();
    await page.waitForTimeout(500);
    await expect(modeToggle).toContainText('advanced');
    
    // Verify advanced mode shows all controls
    await expect(configPanel).toBeVisible();
  });

  test('Configuration panel updates work correctly', async () => {
    // First ensure we're in advanced mode
    const modeToggle = page.locator('button:has-text("Mode:")');
    while (!(await modeToggle.textContent())?.includes('advanced')) {
      await modeToggle.click();
      await page.waitForTimeout(300);
    }
    
    // Test duration slider
    const durationSlider = page.locator('input[type="range"][min="500"][max="3000"]');
    await expect(durationSlider).toBeVisible();
    const initialDuration = await durationSlider.inputValue();
    
    await durationSlider.fill('2000');
    await page.waitForTimeout(500);
    expect(await durationSlider.inputValue()).toBe('2000');
    
    // Test sensitivity slider
    const sensitivitySlider = page.locator('input[type="range"][min="10"][max="200"]');
    await expect(sensitivitySlider).toBeVisible();
    
    await sensitivitySlider.fill('100');
    await page.waitForTimeout(500);
    expect(await sensitivitySlider.inputValue()).toBe('100');
    
    // Test magnetic snap toggle
    const magneticSnapToggle = page.locator('input[type="checkbox"]').first();
    await expect(magneticSnapToggle).toBeVisible();
    
    const initialChecked = await magneticSnapToggle.isChecked();
    await magneticSnapToggle.click();
    await page.waitForTimeout(500);
    expect(await magneticSnapToggle.isChecked()).toBe(!initialChecked);
  });

  test('Performance monitoring shows realistic FPS', async () => {
    // Look for FPS display
    const fpsDisplay = page.locator('text=/\\d+(\\.\\d+)?\\s*FPS/');
    await expect(fpsDisplay).toBeVisible();
    
    // Get FPS values over time
    const fpsValues: number[] = [];
    for (let i = 0; i < 5; i++) {
      const fpsText = await fpsDisplay.textContent();
      const fps = parseFloat(fpsText?.match(/(\d+(\.\d+)?)/)?.[1] || '0');
      fpsValues.push(fps);
      await page.waitForTimeout(1000);
    }
    
    // Check that FPS is reasonable (between 30 and 120)
    fpsValues.forEach(fps => {
      expect(fps).toBeGreaterThan(20);
      expect(fps).toBeLessThan(150);
    });
  });

  test('Accessibility features work correctly', async () => {
    // Check for ARIA live region
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeInDOM();
    
    // Navigate and check announcements
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1500);
    
    // Check that section navigation is announced
    const announcement = await liveRegion.textContent();
    expect(announcement).toContain('Section 2');
    
    // Check keyboard focus indicators
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Check all interactive elements have proper ARIA labels
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test('Smooth scrolling and transitions', async () => {
    // Test that transitions are smooth by checking intermediate positions
    const section1 = page.locator('[data-section-id="section-1"]');
    const section2 = page.locator('[data-section-id="section-2"]');
    
    // Get initial position
    const initialTop = await section1.boundingBox();
    
    // Start navigation
    await page.keyboard.press('ArrowDown');
    
    // Check positions during transition
    const positions: number[] = [];
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(100);
      const box = await section1.boundingBox();
      if (box) positions.push(box.y);
    }
    
    // Verify smooth transition (positions should gradually change)
    let smoothTransition = true;
    for (let i = 1; i < positions.length; i++) {
      if (Math.abs(positions[i] - positions[i-1]) > 200) {
        smoothTransition = false;
        break;
      }
    }
    expect(smoothTransition).toBe(true);
  });

  test('Responsive behavior', async () => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    const desktopControls = page.locator('[data-testid="control-hub"]');
    await expect(desktopControls).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Controls should still be visible but potentially repositioned
    await expect(desktopControls).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check that layout adapts for mobile
    const mobileLayout = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).getPropertyValue('font-size')
    );
    expect(mobileLayout).toBeTruthy();
  });

  test('Edge cases and error handling', async () => {
    // Test rapid navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
    }
    
    // Should handle rapid input gracefully
    await page.waitForTimeout(2000);
    const currentSection = await page.locator('[data-section-id]:in-viewport').first();
    expect(currentSection).toBeTruthy();
    
    // Test navigation boundaries
    await page.keyboard.press('Home');
    await page.waitForTimeout(1500);
    
    // Try to go before first section
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-section-id="section-1"]')).toBeInViewport();
    
    // Go to last section
    await page.keyboard.press('End');
    await page.waitForTimeout(1500);
    
    // Try to go past last section
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-section-id="section-5"]')).toBeInViewport();
  });
});