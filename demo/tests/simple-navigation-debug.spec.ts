import { test, expect, Page } from '@playwright/test'

/**
 * Simple Navigation Debug Test
 * 
 * A simplified version that captures console output and provides detailed debugging
 * to understand what's happening with button navigation.
 */

// Helper to ensure ControlHub is expanded for navigation access
const ensureControlHubExpanded = async (page: Page): Promise<void> => {
  const controlHub = page.locator('[data-testid="control-hub"]')
  await expect(controlHub).toBeVisible()
  
  // Check if already in standard mode
  const isStandardMode = await controlHub.locator('.hub-standard').isVisible().catch(() => false)
  
  if (!isStandardMode) {
    // Click expand button to go from minimal to standard mode
    const expandButton = controlHub.locator('.hub-expand')
    if (await expandButton.isVisible()) {
      await expandButton.click()
      await page.waitForTimeout(200) // Wait for transition
    }
  }
  
  // Verify we can see navigation buttons
  await expect(controlHub.locator('.nav-btn--next')).toBeVisible()
  await expect(controlHub.locator('.nav-btn--prev')).toBeVisible()
}

test.describe('Simple Navigation Debug', () => {
  test('debug button navigation step by step', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
    })

    console.log('🚀 Starting simple navigation debug test')

    // Navigate to the page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Ensure ControlHub is expanded for navigation access
    await ensureControlHubExpanded(page)

    console.log('📄 Page loaded, capturing initial state...')

    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/simple-debug-initial.png',
      fullPage: true 
    })

    // Get initial state
    const initialState = await page.evaluate(() => {
      const navInfo = document.querySelector('.current-section')
      const progressBar = document.querySelector('.progress-fill')
      
      return {
        navText: navInfo?.textContent || 'Not found',
        progressWidth: progressBar ? window.getComputedStyle(progressBar).width : 'Not found',
        scrollY: window.scrollY,
        timestamp: Date.now()
      }
    })

    console.log('📊 Initial State:', JSON.stringify(initialState, null, 2))

    // Check if Next button is available and enabled
    const nextButton = page.locator('.nav-btn--next')
    const isNextVisible = await nextButton.isVisible()
    const isNextEnabled = await nextButton.isEnabled()

    console.log('🔘 Next Button State:', { visible: isNextVisible, enabled: isNextEnabled })

    if (!isNextEnabled) {
      console.log('❌ Next button is disabled, cannot proceed')
      return
    }

    // Click the Next button
    console.log('👆 Clicking Next button...')
    await nextButton.click()

    // Wait a moment and capture immediate state
    await page.waitForTimeout(500)

    const immediateState = await page.evaluate(() => {
      const navInfo = document.querySelector('.current-section')
      const progressBar = document.querySelector('.progress-fill')
      
      return {
        navText: navInfo?.textContent || 'Not found',
        progressWidth: progressBar ? window.getComputedStyle(progressBar).width : 'Not found',
        scrollY: window.scrollY,
        timestamp: Date.now()
      }
    })

    console.log('⚡ Immediate State (500ms after click):', JSON.stringify(immediateState, null, 2))

    // Wait for animation to complete
    await page.waitForTimeout(2000)

    const finalState = await page.evaluate(() => {
      const navInfo = document.querySelector('.current-section')
      const progressBar = document.querySelector('.progress-fill')
      
      return {
        navText: navInfo?.textContent || 'Not found',
        progressWidth: progressBar ? window.getComputedStyle(progressBar).width : 'Not found',
        scrollY: window.scrollY,
        timestamp: Date.now()
      }
    })

    console.log('🏁 Final State (after animation):', JSON.stringify(finalState, null, 2))

    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/simple-debug-final.png',
      fullPage: true 
    })

    // Log all console messages from the page
    console.log('📝 Console logs from page:')
    consoleLogs.forEach(log => console.log(`  ${log}`))

    // Simple verification - just check if state changed
    const stateChanged = initialState.navText !== finalState.navText ||
                        initialState.scrollY !== finalState.scrollY

    console.log('🔄 State Changed:', stateChanged)

    if (!stateChanged) {
      console.log('❌ No state change detected - navigation may have failed')
    } else {
      console.log('✅ State change detected - navigation appears to have worked')
    }

    // Try to understand the exact section parsing
    const navSectionMatch = finalState.navText.match(/(\d+) \/ \d+/)

    if (navSectionMatch) {
      const navSection = parseInt(navSectionMatch[1] || '0')
      
      console.log('📍 Section Analysis:')
      console.log(`  Nav shows: ${navSection} (1-based)`)
      console.log(`  Expected after 1 click: 2 (1-based)`)
    }

    // Don't fail the test, just report findings
    expect(true).toBe(true) // Always pass, we're just debugging
  })

  test('debug multiple button clicks', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
    })

    console.log('🚀 Starting multiple clicks debug test')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Ensure ControlHub is expanded for navigation access
    await ensureControlHubExpanded(page)

    const nextButton = page.locator('.nav-btn--next')

    // Click Next multiple times and track each state
    for (let i = 0; i < 3; i++) {
      console.log(`\n🔄 Click ${i + 1}:`)

      const beforeClick = await page.evaluate(() => {
        const navInfo = document.querySelector('.current-section')
        return {
          nav: navInfo?.textContent || 'Not found'
        }
      })

      console.log(`  Before: ${JSON.stringify(beforeClick)}`)

      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForTimeout(1500) // Wait for animation

        const afterClick = await page.evaluate(() => {
          const navInfo = document.querySelector('.current-section')
          return {
            nav: navInfo?.textContent || 'Not found'
          }
        })

        console.log(`  After:  ${JSON.stringify(afterClick)}`)

        // Take screenshot
        await page.screenshot({ 
          path: `test-results/multi-click-${i + 1}.png`,
          fullPage: true 
        })
      } else {
        console.log('  Button disabled, stopping')
        break
      }
    }

    // Log all console messages
    console.log('\n📝 All console logs:')
    consoleLogs.forEach(log => console.log(`  ${log}`))

    expect(true).toBe(true) // Always pass
  })
})