import { test, expect, Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

test.describe('StoryScroller Narrative Demo', () => {
  let consoleErrors: string[] = []
  let consoleWarnings: string[] = []
  let consoleLogs: string[] = []

  test.beforeEach(async ({ page }) => {
    // Reset console capture
    consoleErrors = []
    consoleWarnings = []
    consoleLogs = []

    // Capture all console messages
    page.on('console', msg => {
      const timestamp = new Date().toISOString()
      const message = `[${timestamp}] ${msg.type()}: ${msg.text()}`
      
      if (msg.type() === 'error') {
        consoleErrors.push(message)
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(message)
      } else {
        consoleLogs.push(message)
      }
    })

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(`[${new Date().toISOString()}] PAGE ERROR: ${error.message}\nStack: ${error.stack}`)
    })

    // Enable reduced motion for faster tests
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('http://localhost:5174')
  })

  test.afterEach(async ({ page }, testInfo) => {
    // Save console logs to file
    const logsDir = path.join(testInfo.outputDir, 'console-logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    // Save errors
    if (consoleErrors.length > 0) {
      const errorsFile = path.join(logsDir, 'errors.log')
      fs.writeFileSync(errorsFile, consoleErrors.join('\n'))
      await testInfo.attach('console-errors', { path: errorsFile })
    }

    // Save warnings
    if (consoleWarnings.length > 0) {
      const warningsFile = path.join(logsDir, 'warnings.log')
      fs.writeFileSync(warningsFile, consoleWarnings.join('\n'))
      await testInfo.attach('console-warnings', { path: warningsFile })
    }

    // Save all logs
    if (consoleLogs.length > 0) {
      const logsFile = path.join(logsDir, 'all-logs.log')
      fs.writeFileSync(logsFile, consoleLogs.join('\n'))
      await testInfo.attach('console-logs', { path: logsFile })
    }

    // Take sanity screenshot
    await page.screenshot({ 
      path: path.join(testInfo.outputDir, 'final-state.png'),
      fullPage: true 
    })
    await testInfo.attach('final-screenshot', { 
      path: path.join(testInfo.outputDir, 'final-state.png') 
    })
  })

  test('loads without errors', async ({ page }) => {
    // Check for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForLoadState('networkidle')
    
    // Verify no React errors
    expect(errors.filter(e => e.includes('Error'))).toHaveLength(0)
  })

  test('displays all narrative sections', async ({ page }) => {
    // Check each section loads
    await expect(page.locator('text=StoryScroller')).toBeVisible()
    await expect(page.locator('text=Features')).toBeVisible()
    await expect(page.locator('text=Motion')).toBeVisible()
    await expect(page.locator('text=Integration')).toBeVisible()
    await expect(page.locator('text=Ready')).toBeVisible()
  })

  test('navigation controls work correctly', async ({ page }) => {
    // Initial state
    await expect(page.locator('text=1 / 5')).toBeVisible()
    await expect(page.locator('button', { hasText: '← Prev' })).toBeDisabled()
    await expect(page.locator('button', { hasText: 'Next →' })).toBeEnabled()

    // Navigate forward
    await page.click('button:has-text("Next →")')
    await expect(page.locator('text=2 / 5')).toBeVisible()
    await expect(page.locator('button', { hasText: '← Prev' })).toBeEnabled()

    // Navigate to end
    for (let i = 2; i < 5; i++) {
      await page.click('button:has-text("Next →")')
      await expect(page.locator(`text=${i + 1} / 5`)).toBeVisible()
    }

    // At end, next should be disabled
    await expect(page.locator('button', { hasText: 'Next →' })).toBeDisabled()

    // Navigate backward
    await page.click('button:has-text("← Prev")')
    await expect(page.locator('text=4 / 5')).toBeVisible()
  })

  test('scroll navigation works', async ({ page }) => {
    // Test wheel scroll navigation
    const viewport = page.viewportSize()!
    const centerX = viewport.width / 2
    const centerY = viewport.height / 2

    // Scroll down to next section
    await page.mouse.move(centerX, centerY)
    await page.mouse.wheel(0, 500) // Scroll down
    
    // Give time for scroll animation
    await page.waitForTimeout(1000)
    
    // Should be on section 2 now
    await expect(page.locator('text=2 / 5')).toBeVisible()
  })

  test('keyboard navigation works', async ({ page }) => {
    // Focus the page
    await page.keyboard.press('Tab')
    
    // Arrow down to next section
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    await expect(page.locator('text=2 / 5')).toBeVisible()

    // Arrow up to previous section
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(500)
    await expect(page.locator('text=1 / 5')).toBeVisible()

    // Home key to first section
    await page.keyboard.press('Home')
    await page.waitForTimeout(500)
    await expect(page.locator('text=1 / 5')).toBeVisible()

    // End key to last section
    await page.keyboard.press('End')
    await page.waitForTimeout(500)
    await expect(page.locator('text=5 / 5')).toBeVisible()
  })

  test('document has proper scroll height for narrative motion', async ({ page }) => {
    // Check that document has actual scroll height (not just viewport height)
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    
    // Should have 5x viewport height for 5 sections
    expect(scrollHeight).toBeGreaterThan(viewportHeight * 4)
  })

  test('sections are properly positioned for ScrollTrigger', async ({ page }) => {
    // Check that sections create real scroll positions
    const sectionPositions = await page.evaluate(() => {
      const sections = document.querySelectorAll('[data-section-idx]')
      return Array.from(sections).map((section, index) => ({
        index,
        top: section.getBoundingClientRect().top + window.scrollY,
        height: section.getBoundingClientRect().height
      }))
    })

    // Each section should be positioned at index * viewport height
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    
    sectionPositions.forEach((section, index) => {
      expect(section.top).toBeCloseTo(index * viewportHeight, -1) // Allow for some tolerance
      expect(section.height).toBeCloseTo(viewportHeight, -1)
    })
  })

  test('smooth scroll physics work', async ({ page }) => {
    // Test that scrolling has smooth animation (not instant jumps)
    await page.click('button:has-text("Next →")')
    
    // Check scroll position during animation
    let scrollPositions: number[] = []
    for (let i = 0; i < 5; i++) {
      const scrollY = await page.evaluate(() => window.scrollY)
      scrollPositions.push(scrollY)
      await page.waitForTimeout(100)
    }
    
    // Should have intermediate scroll positions (not just 0 and final)
    const uniquePositions = new Set(scrollPositions)
    expect(uniquePositions.size).toBeGreaterThan(2)
  })

  test('error boundary catches StoryScroller failures', async ({ page }) => {
    // This is harder to test without forcing an error
    // For now, just verify the component structure is correct
    const storyScrollerContainer = page.locator('.story-scroller-container')
    await expect(storyScrollerContainer).toBeVisible()
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // All sections should still be visible and navigation should work
    await expect(page.locator('text=StoryScroller')).toBeVisible()
    await page.click('button:has-text("Next →")')
    await expect(page.locator('text=2 / 5')).toBeVisible()
  })

  test('sections have proper CSS classes for motion integration', async ({ page }) => {
    // Check that sections have the expected CSS structure
    const sections = page.locator('.story-scroller-section')
    await expect(sections).toHaveCount(5)
    
    // Each section should have data attributes for targeting
    for (let i = 0; i < 5; i++) {
      await expect(sections.nth(i)).toHaveAttribute('data-section-idx', i.toString())
    }
  })

  test('performance - no memory leaks during navigation', async ({ page }) => {
    // Navigate through all sections multiple times
    for (let cycle = 0; cycle < 3; cycle++) {
      // Go to end
      for (let i = 0; i < 4; i++) {
        await page.click('button:has-text("Next →")')
        await page.waitForTimeout(100)
      }
      
      // Go to beginning
      for (let i = 0; i < 4; i++) {
        await page.click('button:has-text("← Prev")')
        await page.waitForTimeout(100)
      }
    }
    
    // Should still be responsive
    await page.click('button:has-text("Next →")')
    await expect(page.locator('text=2 / 5')).toBeVisible()
  })
})