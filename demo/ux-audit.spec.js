import { test, expect } from '@playwright/test';

test.describe('ControlHub UX Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5184');
    await page.waitForLoadState('networkidle');
  });

  test('Minimal Mode - Initial State and Interactions', async ({ page }) => {
    // Check initial minimal mode
    const minimalHub = page.locator('.control-hub--minimal');
    await expect(minimalHub).toBeVisible();
    
    // Progress ring visibility
    const progressRing = page.locator('.progress-ring');
    await expect(progressRing).toBeVisible();
    
    // Section numbers
    const sectionNumber = page.locator('.section-number');
    await expect(sectionNumber).toHaveText('1');
    
    // Expand button
    const expandBtn = page.locator('.hub-expand');
    await expect(expandBtn).toBeVisible();
    
    // Test keyboard focus
    await expandBtn.focus();
    await expect(expandBtn).toBeFocused();
    
    // Screenshot minimal mode
    await page.screenshot({ path: 'audit-minimal-mode.png' });
  });

  test('Standard Mode - Navigation and Features', async ({ page }) => {
    // Expand to standard mode
    await page.locator('.hub-expand').click();
    await page.waitForTimeout(500);
    
    const standardHub = page.locator('.control-hub--standard');
    await expect(standardHub).toBeVisible();
    
    // Navigation controls
    const prevBtn = page.locator('.nav-btn--prev');
    const nextBtn = page.locator('.nav-btn--next');
    
    // Check initial state
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).toBeEnabled();
    
    // Test navigation
    await nextBtn.click();
    await page.waitForTimeout(1500);
    
    // Verify section changed
    const currentSection = page.locator('.current-section');
    await expect(currentSection).toContainText('Section 2');
    
    // Test section dots
    const sectionDots = page.locator('.section-dot');
    const dotCount = await sectionDots.count();
    console.log('Section dots count:', dotCount);
    
    // Test direct navigation via dots
    await sectionDots.nth(3).click();
    await page.waitForTimeout(1500);
    
    // Screenshot standard mode
    await page.screenshot({ path: 'audit-standard-mode.png' });
  });

  test('Advanced Mode - Configuration and Tabs', async ({ page }) => {
    // Navigate to advanced mode
    await page.locator('.hub-expand').click();
    await page.waitForTimeout(300);
    await page.locator('.hub-action[aria-label="Advanced controls"]').click();
    await page.waitForTimeout(500);
    
    const advancedHub = page.locator('.control-hub--advanced');
    await expect(advancedHub).toBeVisible();
    
    // Test tabs
    const navTab = page.locator('.tab-btn:has-text("Navigation")');
    const perfTab = page.locator('.tab-btn:has-text("Performance")');
    const configTab = page.locator('.tab-btn:has-text("Configuration")');
    
    // Performance tab
    await perfTab.click();
    await expect(perfTab).toHaveClass(/active/);
    const fpsMetric = page.locator('.metric-value').first();
    await expect(fpsMetric).toBeVisible();
    
    // Configuration tab
    await configTab.click();
    await expect(configTab).toHaveClass(/active/);
    
    // Test slider interaction
    const durationSlider = page.locator('input[type="range"]').first();
    const initialValue = await durationSlider.inputValue();
    await durationSlider.fill('1.5');
    const newValue = await durationSlider.inputValue();
    expect(newValue).not.toBe(initialValue);
    
    // Screenshot advanced mode
    await page.screenshot({ path: 'audit-advanced-mode.png' });
  });

  test('Mobile Responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check layout adaptation
    const controlHub = page.locator('.control-hub');
    const box = await controlHub.boundingBox();
    
    // Should span most of mobile width
    expect(box.width).toBeGreaterThan(300);
    
    // Expand to standard mode
    await page.locator('.hub-expand').click();
    await page.waitForTimeout(500);
    
    // Check mobile layout
    await page.screenshot({ path: 'audit-mobile-standard.png' });
    
    // Test advanced mode on mobile
    await page.locator('.hub-action[aria-label="Advanced controls"]').click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'audit-mobile-advanced.png' });
  });

  test('Keyboard Navigation', async ({ page }) => {
    // Tab through interface
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should reach expand button
    const expandBtn = page.locator('.hub-expand');
    await expect(expandBtn).toBeFocused();
    
    // Enter to activate
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check focus indicators
    const focusedElement = page.locator(':focus');
    const focusVisible = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    expect(focusVisible).toBeTruthy();
  });

  test('Performance and Transitions', async ({ page }) => {
    // Measure mode switching performance
    const startTime = Date.now();
    
    // Rapid mode switches
    for (let i = 0; i < 5; i++) {
      await page.locator('.hub-expand').click();
      await page.waitForTimeout(100);
      await page.locator('.hub-action').first().click();
      await page.waitForTimeout(100);
    }
    
    const duration = Date.now() - startTime;
    console.log('5 mode switches took:', duration, 'ms');
    expect(duration).toBeLessThan(3000); // Should be responsive
    
    // Check for visual glitches during transitions
    await page.screenshot({ path: 'audit-transition-test.png' });
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    // Try to navigate beyond boundaries
    await page.locator('.hub-expand').click();
    await page.waitForTimeout(300);
    
    // Click disabled previous button
    await page.locator('.nav-btn--prev').click({ force: true });
    
    // Component should still be functional
    const hub = page.locator('.control-hub');
    await expect(hub).toBeVisible();
    
    // Navigate to last section
    const sectionDots = page.locator('.section-dot');
    const lastDot = sectionDots.last();
    await lastDot.click();
    await page.waitForTimeout(1500);
    
    // Try to go beyond last section
    const nextBtn = page.locator('.nav-btn--next');
    await expect(nextBtn).toBeDisabled();
    await nextBtn.click({ force: true });
    
    // Should remain stable
    await expect(hub).toBeVisible();
  });

  test('Accessibility Features', async ({ page }) => {
    // Check ARIA labels
    const expandBtn = page.locator('.hub-expand');
    await expect(expandBtn).toHaveAttribute('aria-label', 'Expand controls');
    
    // Expand to standard mode
    await expandBtn.click();
    await page.waitForTimeout(300);
    
    // Check navigation ARIA labels
    const prevBtn = page.locator('.nav-btn--prev');
    await expect(prevBtn).toHaveAttribute('aria-label', 'Previous section');
    
    const nextBtn = page.locator('.nav-btn--next');
    await expect(nextBtn).toHaveAttribute('aria-label', 'Next section');
    
    // Check section dot labels
    const firstDot = page.locator('.section-dot').first();
    await expect(firstDot).toHaveAttribute('aria-label', 'Go to section 1');
    
    // Test with screen reader (check for role attributes)
    const standardHub = page.locator('.hub-standard');
    const hasSemanticStructure = await standardHub.evaluate(el => {
      // Check for proper heading structure and semantic HTML
      const buttons = el.querySelectorAll('button');
      return buttons.length > 0 && Array.from(buttons).every(btn => 
        btn.hasAttribute('aria-label') || btn.textContent.trim().length > 0
      );
    });
    expect(hasSemanticStructure).toBeTruthy();
  });
});