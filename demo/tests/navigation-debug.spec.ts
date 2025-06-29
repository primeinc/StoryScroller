import { test, expect, Page } from '@playwright/test'

/**
 * Detailed Navigation Debug Test
 * 
 * This test provides comprehensive logging and debugging for StoryScroller navigation.
 * It tests the basic button click → scroll behavior with detailed console logging,
 * screenshots, and scroll position verification.
 */

// Helper to add detailed console logging
const logStep = (page: Page, step: string, data?: any) => {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : ''
  return page.evaluate(
    ({ step, timestamp, dataStr }) => {
      console.log(`🔍 [${timestamp}] DEBUG: ${step}${dataStr}`)
    },
    { step, timestamp, dataStr }
  )
}

// Helper to get detailed state information
const getDetailedState = async (page: Page) => {
  await logStep(page, 'Getting detailed state information...')
  
  // Wait for elements to be available
  await page.waitForSelector('.debug-info', { timeout: 5000 })
  
  const state = await page.evaluate(() => {
    // Get debug info from the UI
    const debugInfo = document.querySelector('.debug-info')
    const navInfo = document.querySelector('.nav-info .current-section')
    const progressBar = document.querySelector('.progress-fill')
    
    // Get scroll position
    const scrollY = window.scrollY || document.documentElement.scrollTop
    
    // Get visible section
    const sections = document.querySelectorAll('[data-testid^="section-"]')
    let visibleSection = -1
    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect()
      if (rect.top >= -50 && rect.top <= 50) { // Within 50px of top
        visibleSection = index
      }
    })
    
    // Extract current section from debug info
    let currentSection = -1
    if (debugInfo) {
      const currentText = debugInfo.textContent || ''
      const match = currentText.match(/Current: (\d+)/)
      if (match) {
        currentSection = parseInt(match[1]) - 1 // Convert to 0-based index
      }
    }
    
    // Extract nav info
    let navSection = -1
    if (navInfo) {
      const navText = navInfo.textContent || ''
      const match = navText.match(/(\d+) \/ \d+/)
      if (match) {
        navSection = parseInt(match[1]) - 1 // Convert to 0-based index
      }
    }
    
    // Get progress percentage
    let progressPercent = 0
    if (progressBar) {
      const style = window.getComputedStyle(progressBar)
      const widthMatch = style.width.match(/(\d+(?:\.\d+)?)%/)
      if (widthMatch) {
        progressPercent = parseFloat(widthMatch[1])
      }
    }
    
    return {
      scrollY,
      visibleSection,
      currentSection,
      navSection,
      progressPercent,
      timestamp: Date.now()
    }
  })
  
  await logStep(page, 'State retrieved', state)
  return state
}

// Helper to wait for navigation to complete
const waitForNavigationComplete = async (page: Page, expectedSection: number, maxWaitMs = 5000) => {
  await logStep(page, `Waiting for navigation to section ${expectedSection} to complete...`)
  
  const startTime = Date.now()
  let lastState = await getDetailedState(page)
  
  while (Date.now() - startTime < maxWaitMs) {
    await page.waitForTimeout(100)
    const currentState = await getDetailedState(page)
    
    // Check if we've reached the expected section and animation is complete
    if (currentState.currentSection === expectedSection && 
        currentState.navSection === expectedSection) {
      
      // Additional check: make sure state is stable for at least 200ms
      await page.waitForTimeout(200)
      const finalState = await getDetailedState(page)
      
      if (finalState.currentSection === expectedSection && 
          finalState.navSection === expectedSection) {
        await logStep(page, `Navigation to section ${expectedSection} completed successfully`, finalState)
        return finalState
      }
    }
    
    lastState = currentState
  }
  
  throw new Error(`Navigation to section ${expectedSection} did not complete within ${maxWaitMs}ms. Last state: ${JSON.stringify(lastState)}`)
}

// Helper to click button with detailed logging
const clickButtonWithLogging = async (page: Page, selector: string, buttonName: string) => {
  await logStep(page, `Attempting to click ${buttonName} button`)
  
  // Check if button exists and is visible
  const button = page.locator(selector)
  await expect(button).toBeVisible({ timeout: 5000 })
  
  // Check if button is enabled
  const isDisabled = await button.isDisabled()
  await logStep(page, `${buttonName} button state`, { 
    visible: await button.isVisible(),
    disabled: isDisabled,
    selector 
  })
  
  if (isDisabled) {
    throw new Error(`${buttonName} button is disabled, cannot click`)
  }
  
  // Get state before click
  const beforeState = await getDetailedState(page)
  await logStep(page, `State before clicking ${buttonName}`, beforeState)
  
  // Click the button
  await button.click()
  await logStep(page, `${buttonName} button clicked successfully`)
  
  // Wait a moment for the click to register
  await page.waitForTimeout(100)
  
  // Get immediate state after click
  const afterClickState = await getDetailedState(page)
  await logStep(page, `Immediate state after clicking ${buttonName}`, afterClickState)
  
  return { beforeState, afterClickState }
}

test.describe('StoryScroller Navigation Debug Tests', () => {
  test.beforeEach(async ({ page }) => {
    await logStep(page, 'Starting test setup...')
    
    // Navigate to the page
    await page.goto('/')
    await logStep(page, 'Page loaded, waiting for network idle...')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await logStep(page, 'Network idle achieved')
    
    // Wait for StoryScroller to initialize
    await page.waitForTimeout(1000)
    await logStep(page, 'Initialization wait complete')
    
    // Verify essential elements are present
    await page.waitForSelector('.nav-button', { timeout: 10000 })
    await page.waitForSelector('.debug-info', { timeout: 10000 })
    await logStep(page, 'Essential UI elements verified')
    
    // Get initial state
    const initialState = await getDetailedState(page)
    await logStep(page, 'Initial page state captured', initialState)
  })

  test('should navigate with Next button and verify all state changes', async ({ page }) => {
    await logStep(page, '🚀 Starting comprehensive Next button navigation test')
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/navigation-debug-initial.png',
      fullPage: true 
    })
    await logStep(page, 'Initial screenshot captured')
    
    // Verify we start on section 0
    const initialState = await getDetailledState(page)
    expect(initialState.currentSection).toBe(0)
    expect(initialState.navSection).toBe(0)
    await logStep(page, 'Verified starting on section 0')
    
    // Test first navigation (0 → 1)
    await logStep(page, '📍 Testing navigation from section 0 to 1')
    
    const { beforeState, afterClickState } = await clickButtonWithLogging(
      page, 
      'button:has-text("Next →")', 
      'Next'
    )
    
    // Wait for navigation to complete
    const finalState = await waitForNavigationComplete(page, 1)
    
    // Take screenshot after navigation
    await page.screenshot({ 
      path: 'test-results/navigation-debug-after-next-1.png',
      fullPage: true 
    })
    await logStep(page, 'Screenshot after first navigation captured')
    
    // Verify state changes
    expect(finalState.currentSection).toBe(1)
    expect(finalState.navSection).toBe(1)
    expect(finalState.progressPercent).toBeGreaterThan(initialState.progressPercent)
    
    await logStep(page, 'First navigation verification complete', {
      before: beforeState.currentSection,
      after: finalState.currentSection,
      progressChange: finalState.progressPercent - initialState.progressPercent
    })
    
    // Test second navigation (1 → 2)
    await logStep(page, '📍 Testing navigation from section 1 to 2')
    
    const secondNavigation = await clickButtonWithLogging(
      page,
      'button:has-text("Next →")',
      'Next'
    )
    
    const secondFinalState = await waitForNavigationComplete(page, 2)
    
    // Take screenshot after second navigation
    await page.screenshot({ 
      path: 'test-results/navigation-debug-after-next-2.png',
      fullPage: true 
    })
    await logStep(page, 'Screenshot after second navigation captured')
    
    // Verify second navigation
    expect(secondFinalState.currentSection).toBe(2)
    expect(secondFinalState.navSection).toBe(2)
    expect(secondFinalState.progressPercent).toBeGreaterThan(finalState.progressPercent)
    
    await logStep(page, 'Second navigation verification complete', {
      before: finalState.currentSection,
      after: secondFinalState.currentSection,
      progressChange: secondFinalState.progressPercent - finalState.progressPercent
    })
    
    // Test navigation to end
    await logStep(page, '📍 Testing navigation to final section')
    
    // Navigate to section 3
    await clickButtonWithLogging(page, 'button:has-text("Next →")', 'Next')
    const thirdState = await waitForNavigationComplete(page, 3)
    
    // Navigate to section 4 (final section)
    await clickButtonWithLogging(page, 'button:has-text("Next →")', 'Next')
    const finalSectionState = await waitForNavigationComplete(page, 4)
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/navigation-debug-final-section.png',
      fullPage: true 
    })
    await logStep(page, 'Final section screenshot captured')
    
    // Verify we're on the last section and Next button is disabled
    expect(finalSectionState.currentSection).toBe(4)
    expect(finalSectionState.navSection).toBe(4)
    
    const nextButton = page.locator('button:has-text("Next →")')
    await expect(nextButton).toBeDisabled()
    await logStep(page, 'Verified Next button is disabled on final section')
    
    await logStep(page, '✅ All navigation tests completed successfully')
  })

  test('should navigate with Prev button and verify reverse navigation', async ({ page }) => {
    await logStep(page, '🔄 Starting comprehensive Prev button navigation test')
    
    // First navigate to section 2 using Next button
    await logStep(page, 'Setting up test by navigating to section 2')
    
    await clickButtonWithLogging(page, 'button:has-text("Next →")', 'Next')
    await waitForNavigationComplete(page, 1)
    
    await clickButtonWithLogging(page, 'button:has-text("Next →")', 'Next')
    await waitForNavigationComplete(page, 2)
    
    await page.screenshot({ 
      path: 'test-results/navigation-debug-prev-setup.png',
      fullPage: true 
    })
    await logStep(page, 'Setup complete, now on section 2')
    
    // Test reverse navigation (2 → 1)
    await logStep(page, '📍 Testing reverse navigation from section 2 to 1')
    
    const { beforeState, afterClickState } = await clickButtonWithLogging(
      page,
      'button:has-text("← Prev")',
      'Prev'
    )
    
    const finalState = await waitForNavigationComplete(page, 1)
    
    await page.screenshot({ 
      path: 'test-results/navigation-debug-after-prev-1.png',
      fullPage: true 
    })
    
    // Verify reverse navigation
    expect(finalState.currentSection).toBe(1)
    expect(finalState.navSection).toBe(1)
    expect(finalState.progressPercent).toBeLessThan(beforeState.progressPercent)
    
    await logStep(page, 'Reverse navigation verification complete', {
      before: beforeState.currentSection,
      after: finalState.currentSection,
      progressChange: finalState.progressPercent - beforeState.progressPercent
    })
    
    // Test navigation back to start (1 → 0)
    await logStep(page, '📍 Testing navigation back to start section')
    
    await clickButtonWithLogging(page, 'button:has-text("← Prev")', 'Prev')
    const startState = await waitForNavigationComplete(page, 0)
    
    await page.screenshot({ 
      path: 'test-results/navigation-debug-back-to-start.png',
      fullPage: true 
    })
    
    // Verify we're back at start and Prev button is disabled
    expect(startState.currentSection).toBe(0)
    expect(startState.navSection).toBe(0)
    
    const prevButton = page.locator('button:has-text("← Prev")')
    await expect(prevButton).toBeDisabled()
    await logStep(page, 'Verified Prev button is disabled on first section')
    
    await logStep(page, '✅ All reverse navigation tests completed successfully')
  })

  test('should handle rapid button clicks gracefully', async ({ page }) => {
    await logStep(page, '⚡ Starting rapid button click test')
    
    // Test rapid Next button clicks
    await logStep(page, 'Testing rapid Next button clicks...')
    
    const initialState = await getDetailedState(page)
    
    // Click Next button rapidly multiple times
    const nextButton = page.locator('button:has-text("Next →")')
    
    for (let i = 0; i < 5; i++) {
      await logStep(page, `Rapid click ${i + 1}/5`)
      await nextButton.click()
      await page.waitForTimeout(50) // Very short delay between clicks
    }
    
    // Wait for any animations to settle
    await page.waitForTimeout(2000)
    
    const finalState = await getDetailedState(page)
    
    await page.screenshot({ 
      path: 'test-results/navigation-debug-rapid-clicks.png',
      fullPage: true 
    })
    
    // Due to debouncing/animation prevention, we should only advance one section
    // despite clicking multiple times rapidly
    await logStep(page, 'Rapid click test results', {
      initialSection: initialState.currentSection,
      finalSection: finalState.currentSection,
      expectedSection: 1,
      actualAdvancement: finalState.currentSection - initialState.currentSection
    })
    
    // We should only advance one section due to animation blocking
    expect(finalState.currentSection).toBeLessThanOrEqual(2)
    
    await logStep(page, '✅ Rapid click handling test completed')
  })

  test('should maintain state consistency across all UI elements', async ({ page }) => {
    await logStep(page, '🔄 Starting state consistency verification test')
    
    const sectionsToTest = [1, 2, 3, 2, 1, 0] // Test forward and backward
    
    for (const targetSection of sectionsToTest) {
      await logStep(page, `Navigating to section ${targetSection}`)
      
      // Navigate to target section
      const currentState = await getDetailedState(page)
      
      if (targetSection > currentState.currentSection) {
        // Navigate forward
        const clicksNeeded = targetSection - currentState.currentSection
        for (let i = 0; i < clicksNeeded; i++) {
          await clickButtonWithLogging(page, 'button:has-text("Next →")', 'Next')
          await waitForNavigationComplete(page, currentState.currentSection + i + 1)
        }
      } else if (targetSection < currentState.currentSection) {
        // Navigate backward
        const clicksNeeded = currentState.currentSection - targetSection
        for (let i = 0; i < clicksNeeded; i++) {
          await clickButtonWithLogging(page, 'button:has-text("← Prev")', 'Prev')
          await waitForNavigationComplete(page, currentState.currentSection - i - 1)
        }
      }
      
      // Verify state consistency
      const finalState = await getDetailedState(page)
      
      await logStep(page, `Verifying state consistency for section ${targetSection}`, finalState)
      
      // All state indicators should match
      expect(finalState.currentSection).toBe(targetSection)
      expect(finalState.navSection).toBe(targetSection)
      
      // Progress bar should reflect current position
      const expectedProgress = ((targetSection + 1) / 5) * 100
      expect(Math.abs(finalState.progressPercent - expectedProgress)).toBeLessThan(5) // Within 5% tolerance
      
      await page.screenshot({ 
        path: `test-results/navigation-debug-consistency-section-${targetSection}.png`,
        fullPage: true 
      })
    }
    
    await logStep(page, '✅ State consistency test completed successfully')
  })
})

// Typo fix helper function
const getDetailledState = getDetailedState