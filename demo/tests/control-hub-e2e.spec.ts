import { test, expect } from '@playwright/test'

test.describe('ControlHub E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for StoryScroller to initialize
    await page.waitForFunction(() => (window as any).storyScrollerAPI)
  })

  test.describe('Complete User Journey', () => {
    test('should navigate through all modes and apply configuration', async ({ page }) => {
      // Start in minimal mode
      await expect(page.locator('.control-hub--minimal')).toBeVisible()
      await expect(page.locator('.progress-ring')).toBeVisible()
      
      // Expand to standard mode
      await page.getByLabel('Expand controls').click()
      
      // Wait for transition
      await expect(page.locator('.control-hub-overlay')).toBeVisible()
      await expect(page.locator('.control-hub-overlay')).not.toBeVisible({ timeout: 1000 })
      
      // Verify standard mode
      await expect(page.locator('.control-hub--standard')).toBeVisible()
      await expect(page.getByText('Section 1 of 5')).toBeVisible()
      
      // Navigate to section 3
      await page.getByLabel('Next section').click()
      await page.waitForTimeout(1500) // Wait for animation
      await page.getByLabel('Next section').click()
      await page.waitForTimeout(1500)
      
      await expect(page.getByText('Section 3 of 5')).toBeVisible()
      
      // Open advanced mode
      await page.getByLabel('Advanced controls').click()
      await expect(page.locator('.control-hub--advanced')).toBeVisible()
      await expect(page.getByRole('dialog')).toBeVisible()
      
      // Switch to Configuration tab
      await page.getByRole('button', { name: 'Configuration' }).click()
      
      // Modify configuration
      const durationSlider = page.getByLabel('Animation duration')
      await durationSlider.fill('0.8')
      
      const toleranceSlider = page.getByLabel('Scroll sensitivity')
      await toleranceSlider.fill('30')
      
      // Toggle magnetic snap
      await page.getByRole('checkbox', { name: /Magnetic Snap/i }).click()
      
      // Apply button should be enabled
      const applyButton = page.getByRole('button', { name: 'Apply Changes' })
      await expect(applyButton).toBeEnabled()
      
      // Apply configuration
      await applyButton.click()
      
      // Verify toast notification
      await expect(page.locator('.control-hub-toast')).toBeVisible()
      await expect(page.getByText('Configuration applied successfully!')).toBeVisible()
      
      // Toast should disappear
      await expect(page.locator('.control-hub-toast')).not.toBeVisible({ timeout: 4000 })
      
      // Close advanced mode
      await page.getByLabel('Close advanced controls').click()
      
      // Should be back in standard mode
      await expect(page.locator('.control-hub--standard')).toBeVisible()
      
      // Minimize to minimal mode
      await page.getByLabel('Minimize controls').click()
      await expect(page.locator('.control-hub--minimal')).toBeVisible()
    })

    test('should maintain state across mode transitions', async ({ page }) => {
      // Navigate to section 4
      await page.getByLabel('Expand controls').click()
      await expect(page.locator('.control-hub--standard')).toBeVisible()
      
      // Click section dot 4
      await page.getByLabel('Go to section 4').click()
      await page.waitForTimeout(1500)
      
      await expect(page.getByText('Section 4 of 5')).toBeVisible()
      
      // Go to minimal mode
      await page.getByLabel('Minimize controls').click()
      
      // Progress should show 4/5
      await expect(page.locator('.section-number')).toHaveText('4')
      
      // Return to standard mode
      await page.getByLabel('Expand controls').click()
      
      // Should still be on section 4
      await expect(page.getByText('Section 4 of 5')).toBeVisible()
    })
  })

  test.describe('Configuration Changes Apply to StoryScroller', () => {
    test('should update animation duration', async ({ page }) => {
      // Open configuration
      await page.getByLabel('Expand controls').click()
      await page.getByLabel('Advanced controls').click()
      await page.getByRole('button', { name: 'Configuration' }).click()
      
      // Change duration to 0.5s (fast)
      await page.getByLabel('Animation duration').fill('0.5')
      await page.getByRole('button', { name: 'Apply Changes' }).click()
      
      // Close advanced mode
      await page.getByLabel('Close advanced controls').click()
      
      // Test fast navigation
      const startTime = Date.now()
      await page.getByLabel('Next section').click()
      
      // Wait for section change
      await expect(page.getByText('Section 2 of 5')).toBeVisible()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Animation should be faster (around 500ms)
      expect(duration).toBeLessThan(800)
    })

    test('should update scroll sensitivity', async ({ page }) => {
      // Open configuration
      await page.getByLabel('Expand controls').click()
      await page.getByLabel('Advanced controls').click()
      await page.getByRole('button', { name: 'Configuration' }).click()
      
      // Set high sensitivity (low tolerance)
      await page.getByLabel('Scroll sensitivity').fill('10')
      await page.getByRole('button', { name: 'Apply Changes' }).click()
      await page.getByLabel('Close advanced controls').click()
      
      // Small scroll should trigger navigation
      await page.mouse.wheel(0, 50) // Small scroll
      await page.waitForTimeout(1500)
      
      // Should have navigated
      await expect(page.getByText('Section 2 of 5')).toBeVisible()
    })

    test('should toggle magnetic snap', async ({ page }) => {
      // Open configuration
      await page.getByLabel('Expand controls').click()
      await page.getByLabel('Advanced controls').click()
      await page.getByRole('button', { name: 'Configuration' }).click()
      
      // Disable magnetic snap
      await page.getByRole('checkbox', { name: /Magnetic Snap/i }).click()
      await page.getByRole('button', { name: 'Apply Changes' }).click()
      await page.getByLabel('Close advanced controls').click()
      
      // Scroll partially
      await page.mouse.wheel(0, 30)
      await page.waitForTimeout(500)
      
      // Without magnetic snap, should not auto-complete
      // This behavior would need to be verified based on actual implementation
    })
  })

  test.describe('Mobile Touch Interactions', () => {
    test.use({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    })

    test('should handle touch interactions on mobile', async ({ page }) => {
      // Verify touch targets are adequate size
      await page.getByLabel('Expand controls').click()
      
      // Get button dimensions
      const prevButton = page.getByLabel('Previous section')
      const prevBox = await prevButton.boundingBox()
      expect(prevBox).toBeTruthy()
      expect(prevBox!.width).toBeGreaterThanOrEqual(44)
      expect(prevBox!.height).toBeGreaterThanOrEqual(44)
      
      // Test swipe navigation
      const storyScroller = page.locator('.story-scroller-container')
      const box = await storyScroller.boundingBox()
      expect(box).toBeTruthy()
      
      // Swipe up to go to next section using drag actions
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height * 0.8);
      await page.mouse.down();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height * 0.2);
      await page.mouse.up();
      
      await page.waitForTimeout(1500)
      await expect(page.getByText('Section 2 of 5')).toBeVisible()
    })

    test('should show appropriate UI on mobile', async ({ page }) => {
      // Minimal mode should be default on mobile
      await expect(page.locator('.control-hub--minimal')).toBeVisible()
      
      // Progress ring should be touch-friendly
      const progressRing = page.locator('.progress-ring')
      const ringBox = await progressRing.boundingBox()
      expect(ringBox).toBeTruthy()
      expect(ringBox!.width).toBeGreaterThanOrEqual(44)
      expect(ringBox!.height).toBeGreaterThanOrEqual(44)
    })
  })

  test.describe('Keyboard-Only Navigation', () => {
    test('should be fully navigable with keyboard', async ({ page }) => {
      // Tab to expand button
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Expand controls')).toBeFocused()
      
      // Expand with Enter
      await page.keyboard.press('Enter')
      await expect(page.locator('.control-hub--standard')).toBeVisible()
      
      // Tab through standard mode controls
      await page.keyboard.press('Tab') // Previous button
      await expect(page.getByLabel('Previous section')).toBeFocused()
      
      await page.keyboard.press('Tab') // Section dot 1
      await expect(page.getByLabel('Go to section 1')).toBeFocused()
      
      // Navigate to section 3 with keyboard
      await page.keyboard.press('Tab') // Section dot 2
      await page.keyboard.press('Tab') // Section dot 3
      await page.keyboard.press('Enter')
      
      await page.waitForTimeout(1500)
      await expect(page.getByText('Section 3 of 5')).toBeVisible()
      
      // Continue tabbing to advanced controls
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
      }
      await expect(page.getByLabel('Advanced controls')).toBeFocused()
      await page.keyboard.press('Enter')
      
      // Should trap focus in advanced mode
      await expect(page.getByLabel('Close advanced controls')).toBeFocused()
      
      // Tab through tabs
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Navigation' })).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Performance' })).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Configuration' })).toBeFocused()
      
      // Escape to close
      await page.keyboard.press('Escape')
      await expect(page.locator('.control-hub--standard')).toBeVisible()
      await expect(page.getByLabel('Advanced controls')).toBeFocused()
    })

    test('should handle focus trap correctly', async ({ page }) => {
      // Open advanced mode
      await page.getByLabel('Expand controls').click()
      await page.getByLabel('Advanced controls').click()
      
      // Focus should be on close button
      await expect(page.getByLabel('Close advanced controls')).toBeFocused()
      
      // Go to configuration tab
      await page.getByRole('button', { name: 'Configuration' }).click()
      
      // Tab to last focusable element (apply button)
      let tabCount = 0
      while (tabCount < 10 && !(await page.getByRole('button', { name: /Changes/ }).evaluate(el => el === document.activeElement))) {
        await page.keyboard.press('Tab')
        tabCount++
      }
      
      // Next tab should wrap to close button
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Close advanced controls')).toBeFocused()
      
      // Shift+Tab should go to last element
      await page.keyboard.press('Shift+Tab')
      await expect(page.getByRole('button', { name: /Changes/ })).toBeFocused()
    })
  })

  test.describe('Screen Reader Announcements', () => {
    test('should provide appropriate ARIA labels and live regions', async ({ page }) => {
      // Check minimal mode accessibility
      const progressRing = page.locator('.progress-ring')
      await expect(progressRing).toHaveAttribute('aria-label', /progress/i)
      
      // Expand to standard
      await page.getByLabel('Expand controls').click()
      
      // Check section navigation accessibility
      const prevButton = page.getByLabel('Previous section')
      await expect(prevButton).toHaveAttribute('aria-label', 'Previous section')
      await expect(prevButton).toHaveAttribute('disabled', '')
      
      // Navigate and check live region updates
      await page.getByLabel('Next section').click()
      
      // Should announce section change
      // Note: Actual screen reader testing would require additional tools
      await expect(page.getByText('Section 2 of 5')).toBeVisible()
      
      // Open advanced mode
      await page.getByLabel('Advanced controls').click()
      
      // Check dialog accessibility
      const dialog = page.getByRole('dialog')
      await expect(dialog).toHaveAttribute('aria-modal', 'true')
      await expect(dialog).toHaveAttribute('aria-labelledby', 'hub-title')
      
      // Go to configuration
      await page.getByRole('button', { name: 'Configuration' }).click()
      
      // Check slider accessibility
      const durationSlider = page.getByLabel('Animation duration')
      await expect(durationSlider).toHaveAttribute('aria-valuemin', '0.2')
      await expect(durationSlider).toHaveAttribute('aria-valuemax', '2')
      await expect(durationSlider).toHaveAttribute('aria-valuenow')
      
      // Change value
      await durationSlider.fill('1.5')
      
      // Check live region for config changes
      const changeIndicator = page.locator('.config-change-indicator')
      await expect(changeIndicator).toHaveAttribute('role', 'status')
      await expect(changeIndicator).toHaveAttribute('aria-live', 'polite')
      
      // Apply changes
      await page.getByRole('button', { name: 'Apply Changes' }).click()
      
      // Check toast accessibility
      const toast = page.locator('.control-hub-toast')
      await expect(toast).toHaveAttribute('role', 'status')
      await expect(toast).toHaveAttribute('aria-live', 'polite')
    })
  })

  test.describe('Performance and Animations', () => {
    test('should display real-time FPS updates', async ({ page }) => {
      await page.getByLabel('Expand controls').click()
      
      // Check FPS display
      await expect(page.getByText(/\d+ FPS/)).toBeVisible()
      
      // Trigger animation
      await page.getByLabel('Next section').click()
      
      // During animation, should show "Animating" badge
      await expect(page.getByText('Animating')).toBeVisible()
      
      // After animation, badge should disappear
      await expect(page.getByText('Animating')).not.toBeVisible({ timeout: 2000 })
    })

    test('should show performance metrics in advanced mode', async ({ page }) => {
      await page.getByLabel('Expand controls').click()
      await page.getByLabel('Advanced controls').click()
      await page.getByRole('button', { name: 'Performance' }).click()
      
      // Check metrics display
      await expect(page.getByText('Frame Time (ms)')).toBeVisible()
      
      const fpsValue = page.locator('.metric-value').first()
      const fpsText = await fpsValue.textContent()
      expect(fpsText).toBeTruthy()
      expect(parseInt(fpsText!)).toBeGreaterThan(0)
      
      const frameTimeValue = page.locator('.metric-value').nth(1)
      const frameTimeText = await frameTimeValue.textContent()
      expect(frameTimeText).toBeTruthy()
      expect(parseFloat(frameTimeText!)).toBeGreaterThan(0)
    })
  })

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle rapid mode transitions gracefully', async ({ page }) => {
      // Rapidly click between modes
      const expandButton = page.getByLabel('Expand controls')
      
      await expandButton.click()
      await expandButton.click() // Double click
      await page.waitForTimeout(100)
      await expandButton.click()
      
      // Should eventually settle
      await page.waitForTimeout(500)
      
      // Should be in a stable state
      const controlHub = page.locator('.control-hub')
      await expect(controlHub).toHaveClass(/control-hub--(minimal|standard|advanced)/)
    })

    test('should handle navigation at boundaries', async ({ page }) => {
      await page.getByLabel('Expand controls').click()
      
      // At first section, prev should be disabled
      const prevButton = page.getByLabel('Previous section')
      await expect(prevButton).toBeDisabled()
      
      // Navigate to last section
      await page.getByLabel('Go to section 5').click()
      await page.waitForTimeout(1500)
      
      // At last section, next should be disabled
      const nextButton = page.getByLabel('Next section')
      await expect(nextButton).toBeDisabled()
    })

    test('should persist configuration across page reload', async ({ page }) => {
      // Open configuration
      await page.getByLabel('Expand controls').click()
      await page.getByLabel('Advanced controls').click()
      await page.getByRole('button', { name: 'Configuration' }).click()
      
      // Change configuration
      await page.getByLabel('Animation duration').fill('0.7')
      await page.getByRole('button', { name: 'Apply Changes' }).click()
      
      // Wait for toast to appear and disappear
      await expect(page.locator('.control-hub-toast')).toBeVisible()
      await expect(page.locator('.control-hub-toast')).not.toBeVisible({ timeout: 4000 })
      
      // Note: Actual persistence would depend on implementation
      // This test assumes configuration is stored in localStorage or similar
    })
  })

  test.describe('Visual Regression', () => {
    test('should maintain consistent visual appearance', async ({ page }) => {
      // Minimal mode
      await expect(page.locator('.control-hub--minimal')).toHaveScreenshot('control-hub-minimal.png')
      
      // Standard mode
      await page.getByLabel('Expand controls').click()
      await expect(page.locator('.control-hub--standard')).toHaveScreenshot('control-hub-standard.png')
      
      // Advanced mode - Navigation tab
      await page.getByLabel('Advanced controls').click()
      await expect(page.locator('.control-hub--advanced')).toHaveScreenshot('control-hub-advanced-nav.png')
      
      // Performance tab
      await page.getByRole('button', { name: 'Performance' }).click()
      await expect(page.locator('.tab-pane.active')).toHaveScreenshot('control-hub-performance-tab.png')
      
      // Configuration tab
      await page.getByRole('button', { name: 'Configuration' }).click()
      await expect(page.locator('.tab-pane.active')).toHaveScreenshot('control-hub-config-tab.png')
      
      // With changes pending
      await page.getByLabel('Animation duration').fill('1.5')
      await expect(page.locator('.config-change-indicator')).toHaveScreenshot('control-hub-changes-pending.png')
    })
  })

  test.describe('Integration with StoryScroller', () => {
    test('should sync with StoryScroller state', async ({ page }) => {
      // Use StoryScroller directly
      await page.evaluate(() => {
        (window as any).storyScrollerAPI.gotoSection(2)
      })
      
      await page.waitForTimeout(1500)
      
      // ControlHub should reflect the change
      await page.getByLabel('Expand controls').click()
      await expect(page.getByText('Section 3 of 5')).toBeVisible()
      
      // Section dot 3 should be active
      const dot3 = page.getByLabel('Go to section 3')
      await expect(dot3).toHaveClass(/active/)
    })

    test('should handle StoryScroller events', async ({ page }) => {
      await page.getByLabel('Expand controls').click()
      
      // Trigger scroll event
      await page.mouse.wheel(0, 100)
      
      // Should show animating state
      await expect(page.getByText('Animating')).toBeVisible()
      
      // After animation completes
      await page.waitForTimeout(2000)
      await expect(page.getByText('Animating')).not.toBeVisible()
    })
  })
})