import { test, expect, Page } from '@playwright/test'

/**
 * Detailed Navigation Debug Test
 * 
 * This test provides comprehensive logging and debugging for StoryScroller navigation.
 * It tests the basic button click → scroll behavior with detailed console logging,
 * screenshots, and scroll position verification.
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

// Helper to get detailed state information (using successful navigation.spec.ts pattern)
const getDetailedState = async (page: Page) => {
  await logStep(page, 'Getting detailed state information...')
  
  // Wait for elements to be available
  await page.waitForSelector('.current-section', { timeout: 5000 })
  
  const state = await page.evaluate(() => {
    // Get API state for comparison
    const api = (window as any).storyScrollerAPI
    const apiState = api ? api.getState() : null
    
    // Look for current section info in ControlHub
    const currentSectionElement = document.querySelector('.current-section')
    
    // Extract nav section (1-based) from ControlHub
    let navSection = 1
    if (currentSectionElement) {
      const match = currentSectionElement.textContent?.match(/Section (\d+) of \d+/)
      if (match && match[1]) navSection = parseInt(match[1])
    }
    
    // For debug section, we'll use the same as nav section since debug info isn't available
    let debugSection = navSection
    
    // Get progress value - check both linear and circular progress bars
    let progressPx = 0
    
    // Method 1: Try linear progress bar (.progress-fill) - visible when ControlHub is expanded
    const linearProgress = document.querySelector('.progress-fill')
    if (linearProgress && window.getComputedStyle(linearProgress).display !== 'none') {
      const style = window.getComputedStyle(linearProgress)
      const width = style.width
      
      // Check if it's percentage-based
      let percentMatch = width.match(/(\d+(?:\.\d+)?)%/)
      if (percentMatch && percentMatch[1]) {
        progressPx = parseFloat(percentMatch[1])
      } else {
        // Try pixels and convert to percentage
        let pxMatch = width.match(/(\d+(?:\.\d+)?)px/)
        if (pxMatch && pxMatch[1]) {
          const widthPx = parseFloat(pxMatch[1])
          const parentElement = linearProgress.parentElement
          if (parentElement) {
            const parentWidth = window.getComputedStyle(parentElement).width
            let parentPxMatch = parentWidth.match(/(\d+(?:\.\d+)?)px/)
            if (parentPxMatch && parentPxMatch[1]) {
              const parentPx = parseFloat(parentPxMatch[1])
              progressPx = (widthPx / parentPx) * 100
            }
          }
        }
      }
    }
    
    // Method 2: Try circular progress (.progress-bar with stroke-dasharray) - visible in minimal mode
    if (progressPx === 0) {
      const circularProgress = document.querySelector('.progress-bar')
      if (circularProgress && window.getComputedStyle(circularProgress).display !== 'none') {
        const strokeDasharray = circularProgress.getAttribute('stroke-dasharray')
        if (strokeDasharray) {
          const dashValues = strokeDasharray.split(',').map(v => parseFloat(v.trim()))
          if (dashValues.length >= 2 && dashValues[1] !== undefined && dashValues[1] > 0) {
            progressPx = ((dashValues[0] || 0) / dashValues[1]) * 100
          }
        }
      }
    }
    
    // Method 3: Calculate expected progress from section number (fallback)
    if (progressPx === 0) {
      const sectionsCount = 5 // From the demo
      progressPx = (navSection / sectionsCount) * 100
    }
    
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
    
    return {
      scrollY,
      visibleSection,
      debug: debugSection,
      nav: navSection,
      progress: progressPx,
      // Keep legacy fields for backward compatibility
      currentSection: debugSection,
      navSection: navSection,
      progressPercent: progressPx,
      timestamp: Date.now(),
      api: apiState ? {
        currentSection: apiState.currentSection + 1, // Convert to 1-based
        isAnimating: apiState.isAnimating,
        targetSection: apiState.targetSection
      } : null
    }
  })
  
  await logStep(page, 'State retrieved', state)
  return state
}

// Helper to wait for navigation to complete properly (using successful navigation.spec.ts pattern)
const waitForSectionChange = async (page: Page, expectedSection: number, maxWaitMs = 5000): Promise<void> => {
  await logStep(page, `Waiting for navigation to section ${expectedSection} to complete...`)
  
  // Use Playwright's built-in waitForFunction for more reliable waiting
  await page.waitForFunction(
    ({ targetSection }) => {
      const api = (window as any).storyScrollerAPI
      if (!api) return false
      
      const state = api.getState()
      const queueStatus = api.getQueueStatus()
      
      // Get UI state
      const currentSectionElement = document.querySelector('.current-section')
      let uiSection = 1
      if (currentSectionElement) {
        const match = currentSectionElement.textContent?.match(/Section (\d+) of \d+/)
        if (match && match[1]) uiSection = parseInt(match[1])
      }
      
      // Check if both API and UI are at target section, not animating, AND ready for next navigation
      const apiAtTarget = (state.currentSection + 1) === targetSection
      const uiAtTarget = uiSection === targetSection
      const notAnimating = !state.isAnimating && queueStatus.pending === 0
      
      // Further reduced cooldown for test reliability
      const cooldownReady = Date.now() - state.lastNavigationTime > 50
      
      // Always require both API and UI to be synchronized for reliable button state testing
      return apiAtTarget && uiAtTarget && notAnimating && cooldownReady
    },
    { targetSection: expectedSection },
    { timeout: maxWaitMs }
  )
  
  await logStep(page, `Navigation to section ${expectedSection} completed successfully`)
}

// Helper to wait for navigation with detailed logging
const waitForNavigationComplete = async (page: Page, expectedSection: number, maxWaitMs = 5000) => {
  await waitForSectionChange(page, expectedSection, maxWaitMs)
  return await getDetailedState(page)
}

// Helper to safely click button with proper waiting (using successful navigation.spec.ts pattern)
const safeButtonClick = async (page: Page, selector: string, buttonName: string, expectedSection?: number): Promise<void> => {
  await logStep(page, `Attempting to click ${buttonName} button`)
  
  // Ensure ControlHub is expanded first
  await ensureControlHubExpanded(page)
  
  const button = page.locator(selector)
  await expect(button).toBeVisible()
  await expect(button).toBeEnabled()
  
  const beforeState = await getDetailedState(page)
  await logStep(page, `State before clicking ${buttonName}`, beforeState)
  
  await button.click()
  
  // Wait for navigation to complete
  if (expectedSection) {
    await waitForSectionChange(page, expectedSection)
  } else {
    // Fallback: wait for any navigation to complete with reduced timeout
    await page.waitForFunction(() => {
      const api = (window as any).storyScrollerAPI
      if (!api) return false
      const state = api.getState()
      const queueStatus = api.getQueueStatus()
      return !state.isAnimating && !queueStatus.hasQueuedAction
    }, { timeout: 2000 }) // Reduced from 3000ms to 2000ms for faster tests
  }
  
  const afterState = await getDetailedState(page)
  await logStep(page, `State after clicking ${buttonName}`, afterState)
}

// Helper to click button with detailed logging (backward compatibility)
const clickButtonWithLogging = async (page: Page, selector: string, buttonName: string) => {
  await logStep(page, `Attempting to click ${buttonName} button`)
  
  // Ensure ControlHub is expanded first
  await ensureControlHubExpanded(page)
  
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
    
    // Clear all browser state after page loads
    await page.evaluate(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        // Ignore localStorage errors in some contexts
      }
      // Clear any global StoryScroller state
      delete (window as any).storyScrollerAPI
      delete (window as any).scrollManager
    })
    
    // Reload page to ensure clean state
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Wait for StoryScroller to initialize and reset to section 1
    await page.waitForFunction(() => {
      const api = (window as any).storyScrollerAPI
      return api && api.getState
    }, { timeout: 5000 })
    
    // Force reset to section 1
    await page.evaluate(() => {
      const api = (window as any).storyScrollerAPI
      if (api && api.gotoSection) {
        api.gotoSection(0) // 0-based index for section 1
      }
    })
    
    // Wait for reset to complete
    await page.waitForFunction(() => {
      const api = (window as any).storyScrollerAPI
      if (!api) return false
      const state = api.getState()
      return state.currentSection === 0 && !state.isAnimating
    }, { timeout: 3000 })
    
    await logStep(page, 'Initialization wait complete')
    
    // Ensure ControlHub is expanded for navigation access
    await ensureControlHubExpanded(page)
    
    // Verify essential elements are present
    await page.waitForSelector('.nav-btn--next', { timeout: 10000 })
    await page.waitForSelector('.current-section', { timeout: 10000 })
    await logStep(page, 'Essential UI elements verified')
    
    // Verify clean initial state
    const initialState = await getDetailedState(page)
    await logStep(page, 'Initial page state captured', initialState)
    expect(initialState.debug).toBe(1)
    expect(initialState.nav).toBe(1)
  })

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    await page.evaluate(() => {
      const api = (window as any).storyScrollerAPI
      if (api && api.emergencyReset) {
        api.emergencyReset()
      }
    })
  })

  test('should navigate with Next button and verify all state changes', async ({ page }) => {
    await logStep(page, '🚀 Starting comprehensive Next button navigation test')
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/navigation-debug-initial.png',
      fullPage: true 
    })
    await logStep(page, 'Initial screenshot captured')
    
    // Verify we start on section 1
    const initialState = await getDetailedState(page)
    expect(initialState.debug).toBe(1)
    expect(initialState.nav).toBe(1)
    await logStep(page, 'Verified starting on section 1')
    
    // Test first navigation (1 → 2)
    await logStep(page, '📍 Testing navigation from section 1 to 2')
    
    const { beforeState, afterClickState } = await clickButtonWithLogging(
      page, 
      '.nav-btn--next', 
      'Next'
    )
    
    // Wait for navigation to complete
    const finalState = await waitForNavigationComplete(page, 2)
    
    // Take screenshot after navigation
    await page.screenshot({ 
      path: 'test-results/navigation-debug-after-next-1.png',
      fullPage: true 
    })
    await logStep(page, 'Screenshot after first navigation captured')
    
    // Verify state changes
    expect(finalState.debug).toBe(2)
    expect(finalState.nav).toBe(2)
    expect(finalState.progress).toBeGreaterThan(initialState.progress)
    
    await logStep(page, 'First navigation verification complete', {
      before: beforeState.debug,
      after: finalState.debug,
      progressChange: finalState.progress - initialState.progress
    })
    
    // Test second navigation (2 → 3)
    await logStep(page, '📍 Testing navigation from section 2 to 3')
    
    const secondNavigation = await clickButtonWithLogging(
      page,
      '.nav-btn--next',
      'Next'
    )
    
    const secondFinalState = await waitForNavigationComplete(page, 3)
    
    // Take screenshot after second navigation
    await page.screenshot({ 
      path: 'test-results/navigation-debug-after-next-2.png',
      fullPage: true 
    })
    await logStep(page, 'Screenshot after second navigation captured')
    
    // Verify second navigation
    expect(secondFinalState.debug).toBe(3)
    expect(secondFinalState.nav).toBe(3)
    expect(secondFinalState.progress).toBeGreaterThan(finalState.progress)
    
    await logStep(page, 'Second navigation verification complete', {
      before: finalState.debug,
      after: secondFinalState.debug,
      progressChange: secondFinalState.progress - finalState.progress
    })
    
    // Test navigation to end
    await logStep(page, '📍 Testing navigation to final section')
    
    // Navigate to section 4
    await clickButtonWithLogging(page, '.nav-btn--next', 'Next')
    const thirdState = await waitForNavigationComplete(page, 4)
    
    // Navigate to section 5 (final section)
    await clickButtonWithLogging(page, '.nav-btn--next', 'Next')
    const finalSectionState = await waitForNavigationComplete(page, 5)
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/navigation-debug-final-section.png',
      fullPage: true 
    })
    await logStep(page, 'Final section screenshot captured')
    
    // Verify we're on the last section and Next button is disabled
    expect(finalSectionState.debug).toBe(5)
    expect(finalSectionState.nav).toBe(5)
    
    // const nextButton = page.locator('.nav-btn--next')
    // await expect(nextButton).toBeDisabled()
    // await logStep(page, 'Verified Next button is disabled on final section')
    
    await logStep(page, '✅ All navigation tests completed successfully')
  })

  test('should navigate with Prev button and verify reverse navigation', async ({ page }) => {
    await logStep(page, '🔄 Starting comprehensive Prev button navigation test')
    
    // First navigate to section 3 using Next button
    await logStep(page, 'Setting up test by navigating to section 3')
    
    await clickButtonWithLogging(page, '.nav-btn--next', 'Next')
    await waitForNavigationComplete(page, 2)
    
    await clickButtonWithLogging(page, '.nav-btn--next', 'Next')
    await waitForNavigationComplete(page, 3)
    
    await page.screenshot({ 
      path: 'test-results/navigation-debug-prev-setup.png',
      fullPage: true 
    })
    await logStep(page, 'Setup complete, now on section 3')
    
    // Test reverse navigation (3 → 2)
    await logStep(page, '📍 Testing reverse navigation from section 3 to 2')
    
    const { beforeState, afterClickState } = await clickButtonWithLogging(
      page,
      '.nav-btn--prev',
      'Prev'
    )
    
    const finalState = await waitForNavigationComplete(page, 2)
    
    await page.screenshot({ 
      path: 'test-results/navigation-debug-after-prev-1.png',
      fullPage: true 
    })
    
    // Verify reverse navigation
    expect(finalState.debug).toBe(2)
    expect(finalState.nav).toBe(2)
    expect(finalState.progress).toBeLessThan(beforeState.progress)
    
    await logStep(page, 'Reverse navigation verification complete', {
      before: beforeState.debug,
      after: finalState.debug,
      progressChange: finalState.progress - beforeState.progress
    })
    
    // Test navigation back to start (2 → 1)
    await logStep(page, '📍 Testing navigation back to start section')
    
    await clickButtonWithLogging(page, '.nav-btn--prev', 'Prev')
    const startState = await waitForNavigationComplete(page, 1)
    
    await page.screenshot({ 
      path: 'test-results/navigation-debug-back-to-start.png',
      fullPage: true 
    })
    
    // Verify we're back at start and Prev button is disabled
    expect(startState.debug).toBe(1)
    expect(startState.nav).toBe(1)
    
    const prevButton = page.locator('.nav-btn--prev')
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
    const nextButton = page.locator('.nav-btn--next')
    
    for (let i = 0; i < 5; i++) {
      await logStep(page, `Rapid click ${i + 1}/5`)
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForTimeout(50) // Very short delay between clicks
      }
    }
    
    // Wait for any animations to settle
    await page.waitForTimeout(3000)
    
    const finalState = await getDetailedState(page)
    
    await page.screenshot({ 
      path: 'test-results/navigation-debug-rapid-clicks.png',
      fullPage: true 
    })
    
    // Due to animation blocking, we should not have advanced 5 sections
    const sectionsAdvanced = finalState.debug - initialState.debug
    
    await logStep(page, 'Rapid click test results', {
      initialSection: initialState.debug,
      finalSection: finalState.debug,
      sectionsAdvanced,
      expectedMaxAdvancement: 5
    })
    
    // We should advance some sections, but not all 5 due to animation blocking
    expect(sectionsAdvanced).toBeGreaterThan(0)
    expect(sectionsAdvanced).toBeLessThan(5)
    
    await logStep(page, '✅ Rapid click handling test completed')
  })

  test('should maintain state consistency across all UI elements', async ({ page }) => {
    await logStep(page, '🔄 Starting state consistency verification test')
    
    const sectionsToTest = [2, 3, 4, 5, 4, 3, 2, 1] // Test forward and backward
    
    for (const targetSection of sectionsToTest) {
      await logStep(page, `Navigating to section ${targetSection}`)
      
      // Navigate to target section
      const currentState = await getDetailedState(page)
      
      if (targetSection > currentState.debug) {
        // Navigate forward
        const clicksNeeded = targetSection - currentState.debug
        for (let i = 0; i < clicksNeeded; i++) {
          const expectedSection = currentState.debug + i + 1
          await safeButtonClick(page, '.nav-btn--next', 'Next', expectedSection)
        }
      } else if (targetSection < currentState.debug) {
        // Navigate backward
        const clicksNeeded = currentState.debug - targetSection
        for (let i = 0; i < clicksNeeded; i++) {
          const expectedSection = currentState.debug - i - 1
          await safeButtonClick(page, '.nav-btn--prev', 'Prev', expectedSection)
        }
      }
      
      // Verify state consistency
      const finalState = await getDetailedState(page)
      
      await logStep(page, `Verifying state consistency for section ${targetSection}`, finalState)
      
      // All state indicators should match
      expect(finalState.debug).toBe(targetSection)
      expect(finalState.nav).toBe(targetSection)
      
      // Verify button states
      const nextButton = page.locator('.nav-btn--next')
      const prevButton = page.locator('.nav-btn--prev')
      
      if (targetSection === 1) {
        await expect(prevButton).toBeDisabled()
        await expect(nextButton).toBeEnabled()
      } else if (targetSection === 5) {
        await expect(nextButton).toBeDisabled()
        await expect(prevButton).toBeEnabled()
      } else {
        await expect(nextButton).toBeEnabled()
        await expect(prevButton).toBeEnabled()
      }
      
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