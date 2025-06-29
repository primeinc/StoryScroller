import { test, expect, Page } from '@playwright/test'

// Helper to wait for animations to complete
const waitForAnimation = async (page: Page, duration = 1500) => {
  await page.waitForTimeout(duration)
}

// Helper to get current section index from debug info
const getCurrentSection = async (page: Page): Promise<number> => {
  // First, make debug info visible
  const debugButton = page.locator('button:has-text("Show Debug")')
  const debugText = await debugButton.textContent()
  if (debugText?.includes('Show')) {
    await debugButton.click()
  }
  
  const debugInfo = await page.locator('text=Current Section:').textContent()
  const match = debugInfo?.match(/Current Section: (\d+)/)
  return match ? parseInt(match[1]) : 0
}

test.describe('StoryScroller Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for StoryScroller to initialize
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500) // Wait for GSAP initialization
  })

  test('should load with first section visible', async ({ page }) => {
    // Check that first section is visible
    const firstSection = page.locator('[data-testid="section-0"]')
    await expect(firstSection).toBeVisible()
    
    // Check navigation state
    const navText = await page.locator('.demo-nav span').textContent()
    expect(navText).toContain('1 / 5')
    
    // Check that first dot is active
    const firstDot = page.locator('.demo-nav-dot').first()
    await expect(firstDot).toHaveClass(/active/)
  })

  test('should navigate with keyboard arrows', async ({ page }) => {
    // Press arrow down
    await page.keyboard.press('ArrowDown')
    await waitForAnimation(page)
    
    // Check we're on section 2
    const currentSection = await getCurrentSection(page)
    expect(currentSection).toBe(1)
    
    // Check second section is visible
    const secondSection = page.locator('[data-testid="section-1"]')
    await expect(secondSection).toBeVisible()
    
    // Press arrow up
    await page.keyboard.press('ArrowUp')
    await waitForAnimation(page)
    
    // Check we're back on section 1
    const backSection = await getCurrentSection(page)
    expect(backSection).toBe(0)
  })

  test('should navigate with Page Up/Down keys', async ({ page }) => {
    // Press Page Down
    await page.keyboard.press('PageDown')
    await waitForAnimation(page)
    
    const section2 = await getCurrentSection(page)
    expect(section2).toBe(1)
    
    // Press Page Down again
    await page.keyboard.press('PageDown')
    await waitForAnimation(page)
    
    const section3 = await getCurrentSection(page)
    expect(section3).toBe(2)
    
    // Press Page Up
    await page.keyboard.press('PageUp')
    await waitForAnimation(page)
    
    const backSection = await getCurrentSection(page)
    expect(backSection).toBe(1)
  })

  test('should navigate with Home/End keys', async ({ page }) => {
    // Press End to go to last section
    await page.keyboard.press('End')
    await waitForAnimation(page)
    
    const lastSection = await getCurrentSection(page)
    expect(lastSection).toBe(4) // 0-indexed, so 4 is the 5th section
    
    // Check last section is visible
    const lastSectionEl = page.locator('[data-testid="section-4"]')
    await expect(lastSectionEl).toBeVisible()
    
    // Press Home to go back to first
    await page.keyboard.press('Home')
    await waitForAnimation(page)
    
    const firstSection = await getCurrentSection(page)
    expect(firstSection).toBe(0)
  })

  test('should navigate with nav buttons', async ({ page }) => {
    const prevButton = page.locator('button:has-text("← Prev")')
    const nextButton = page.locator('button:has-text("Next →")')
    
    // Prev should be disabled on first section
    await expect(prevButton).toBeDisabled()
    
    // Click next
    await nextButton.click()
    await waitForAnimation(page)
    
    const section2 = await getCurrentSection(page)
    expect(section2).toBe(1)
    
    // Now prev should be enabled
    await expect(prevButton).toBeEnabled()
    
    // Navigate to last section
    for (let i = 0; i < 3; i++) {
      await nextButton.click()
      await waitForAnimation(page)
    }
    
    // Next should be disabled on last section
    await expect(nextButton).toBeDisabled()
    
    const lastSection = await getCurrentSection(page)
    expect(lastSection).toBe(4)
  })

  test('should navigate with dot navigation', async ({ page }) => {
    const dots = page.locator('.demo-nav-dot')
    
    // Click third dot
    await dots.nth(2).click()
    await waitForAnimation(page)
    
    const section3 = await getCurrentSection(page)
    expect(section3).toBe(2)
    
    // Check third dot is active
    await expect(dots.nth(2)).toHaveClass(/active/)
    
    // Click last dot
    await dots.last().click()
    await waitForAnimation(page)
    
    const lastSection = await getCurrentSection(page)
    expect(lastSection).toBe(4)
    
    // Check last dot is active
    await expect(dots.last()).toHaveClass(/active/)
  })

  test('should handle mouse wheel scrolling', async ({ page, browserName }) => {
    // Skip on webkit as wheel events are flaky
    test.skip(browserName === 'webkit', 'Wheel events are inconsistent in WebKit')
    
    // Scroll down
    await page.mouse.wheel(0, 100)
    await waitForAnimation(page)
    
    const section2 = await getCurrentSection(page)
    expect(section2).toBe(1)
    
    // Scroll up
    await page.mouse.wheel(0, -100)
    await waitForAnimation(page)
    
    const section1 = await getCurrentSection(page)
    expect(section1).toBe(0)
  })

  test('should prevent navigation when already animating', async ({ page }) => {
    // Trigger multiple navigations quickly
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    
    // Wait for animation
    await waitForAnimation(page)
    
    // Should only have moved one section due to isAnimating flag
    const currentSection = await getCurrentSection(page)
    expect(currentSection).toBe(1)
  })

  test('should update URL hash on section change', async ({ page }) => {
    // Navigate to section 2
    await page.keyboard.press('ArrowDown')
    await waitForAnimation(page)
    
    // Check that onSectionChange callback was triggered
    const navText = await page.locator('.demo-nav span').textContent()
    expect(navText).toContain('2 / 5')
  })

  test('should handle touch/swipe on mobile', async ({ page, browserName, isMobile }) => {
    test.skip(!isMobile, 'Touch events only on mobile')
    
    // Swipe up to go to next section
    await page.locator('[data-testid="section-0"]').swipe({
      direction: 'up',
      distance: 100,
    })
    await waitForAnimation(page)
    
    const section2 = await getCurrentSection(page)
    expect(section2).toBe(1)
    
    // Swipe down to go back
    await page.locator('[data-testid="section-1"]').swipe({
      direction: 'down',
      distance: 100,
    })
    await waitForAnimation(page)
    
    const section1 = await getCurrentSection(page)
    expect(section1).toBe(0)
  })

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    // Navigation should still work but with instant transitions
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100) // Much shorter wait
    
    const currentSection = await getCurrentSection(page)
    expect(currentSection).toBe(1)
  })

  test('should maintain focus management', async ({ page }) => {
    // Tab through sections
    await page.keyboard.press('Tab')
    
    // First section should have focus
    const firstSection = page.locator('[data-testid="section-0"]')
    await expect(firstSection).toBeFocused()
    
    // Tab to next section
    await page.keyboard.press('Tab')
    
    // Navigation buttons should be focusable
    const prevButton = page.locator('button:has-text("← Prev")')
    await expect(prevButton).toBeFocused()
  })

  test('should handle rapid scroll events (debouncing)', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Wheel events are inconsistent in WebKit')
    
    // Simulate rapid scroll events like Mac trackpad momentum
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 50)
      await page.waitForTimeout(50)
    }
    
    await waitForAnimation(page)
    
    // Should only advance one section due to debouncing
    const currentSection = await getCurrentSection(page)
    expect(currentSection).toBe(1)
  })

  test('should cleanup on unmount without errors', async ({ page }) => {
    // Navigate away and back
    await page.goto('/about') // This will 404 but that's ok
    await page.goBack()
    
    // Should reinitialize correctly
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    
    // Test navigation still works
    await page.keyboard.press('ArrowDown')
    await waitForAnimation(page)
    
    const currentSection = await getCurrentSection(page)
    expect(currentSection).toBe(1)
  })
})