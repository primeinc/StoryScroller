import { test, expect } from '@playwright/test'

test.describe('StoryScroller Basic Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for app to be ready
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('renders and displays sections', async ({ page }) => {
    // Check that the component rendered
    const container = page.locator('.story-scroller-container')
    await expect(container).toBeVisible()
    
    // Check sections exist
    const sections = page.locator('[data-testid^="section-"]')
    await expect(sections).toHaveCount(5)
    
    // First section should be visible
    const firstSection = page.locator('[data-testid="section-0"]')
    await expect(firstSection).toBeVisible()
    
    // Check content
    await expect(page.locator('h1')).toContainText('StoryScroller')
  })

  test('keyboard navigation works', async ({ page }) => {
    // Press arrow down
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(1500) // Wait for animation
    
    // Check we moved to section 2
    const secondSection = page.locator('[data-testid="section-1"]')
    await expect(secondSection).toBeInViewport()
    
    // Press arrow up
    await page.keyboard.press('ArrowUp') 
    await page.waitForTimeout(1500)
    
    // Should be back at first section
    const firstSection = page.locator('[data-testid="section-0"]')
    await expect(firstSection).toBeInViewport()
  })

  test('navigation dots work', async ({ page }) => {
    // Click third dot
    const dots = page.locator('.demo-nav-dot')
    await dots.nth(2).click()
    await page.waitForTimeout(1500)
    
    // Third section should be visible
    const thirdSection = page.locator('[data-testid="section-2"]')
    await expect(thirdSection).toBeInViewport()
    
    // Third dot should be active
    await expect(dots.nth(2)).toHaveClass(/active/)
  })

  test('smooth scrolling is active', async ({ page }) => {
    // Get initial scroll position
    const initialScroll = await page.evaluate(() => window.scrollY)
    expect(initialScroll).toBe(0)
    
    // Navigate to next section
    await page.keyboard.press('ArrowDown')
    
    // Check that we're animating (scroll position changes over time)
    let scrollPositions: number[] = []
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(100)
      const scroll = await page.evaluate(() => window.scrollY)
      scrollPositions.push(scroll)
    }
    
    // Should have different positions during animation
    const uniquePositions = new Set(scrollPositions)
    expect(uniquePositions.size).toBeGreaterThan(1)
    
    // Wait for animation to complete
    await page.waitForTimeout(1000)
    
    // Final position should be around viewport height
    const finalScroll = await page.evaluate(() => window.scrollY)
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    expect(finalScroll).toBeCloseTo(viewportHeight, -1)
  })
})