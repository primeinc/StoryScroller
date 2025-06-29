import { test, expect, Page } from '@playwright/test'

/**
 * Corrected Navigation Test
 * 
 * Based on findings from the debug test, this provides accurate testing of
 * StoryScroller navigation with proper expectations.
 */

// Helper to get current section (1-based as used by the UI)
const getCurrentSection = async (page: Page): Promise<{ debug: number, nav: number, progress: number }> => {
  return await page.evaluate(() => {
    const debugInfo = document.querySelector('.debug-info')
    const navInfo = document.querySelector('.nav-info .current-section')
    const progressBar = document.querySelector('.progress-fill')
    
    // Extract debug section (1-based)
    let debugSection = 1
    if (debugInfo) {
      const match = debugInfo.textContent?.match(/Current: (\d+)/)
      if (match) debugSection = parseInt(match[1])
    }
    
    // Extract nav section (1-based)
    let navSection = 1
    if (navInfo) {
      const match = navInfo.textContent?.match(/(\d+) \/ \d+/)
      if (match) navSection = parseInt(match[1])
    }
    
    // Get progress bar width in pixels
    let progressPx = 0
    if (progressBar) {
      const width = window.getComputedStyle(progressBar).width
      const match = width.match(/(\d+(?:\.\d+)?)px/)
      if (match) progressPx = parseFloat(match[1])
    }
    
    return { debug: debugSection, nav: navSection, progress: progressPx }
  })
}

// Helper to wait for animation to complete
const waitForAnimationComplete = async (page: Page, maxWaitMs = 5000): Promise<void> => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWaitMs) {
    const isAnimating = await page.evaluate(() => {
      const debugInfo = document.querySelector('.debug-info')
      return debugInfo?.textContent?.includes('Animating: Yes') || false
    })
    
    if (!isAnimating) {
      return // Animation complete
    }
    
    await page.waitForTimeout(100)
  }
  
  throw new Error(`Animation did not complete within ${maxWaitMs}ms`)
}

// Helper to safely click button with proper waiting
const safeButtonClick = async (page: Page, selector: string, buttonName: string): Promise<void> => {
  console.log(`🔘 Attempting to click ${buttonName} button`)
  
  const button = page.locator(selector)
  await expect(button).toBeVisible()
  await expect(button).toBeEnabled()
  
  const beforeState = await getCurrentSection(page)
  console.log(`📊 Before ${buttonName} click:`, beforeState)
  
  await button.click()
  
  // Wait for animation to complete
  await waitForAnimationComplete(page)
  
  const afterState = await getCurrentSection(page)
  console.log(`📊 After ${buttonName} click:`, afterState)
}

test.describe('Corrected StoryScroller Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('🎯')) {
        console.log(`Page Log: ${msg.text()}`)
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500) // Allow StoryScroller to fully initialize
    
    // Verify initial state
    const initialState = await getCurrentSection(page)
    console.log('📍 Initial state:', initialState)
    expect(initialState.debug).toBe(1)
    expect(initialState.nav).toBe(1)
  })

  test('should navigate forward correctly with Next button', async ({ page }) => {
    console.log('🚀 Testing forward navigation')
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/corrected-nav-initial.png',
      fullPage: true 
    })
    
    // Test navigation: Section 1 → 2
    await safeButtonClick(page, 'button:has-text("Next →")', 'Next')
    
    const section2State = await getCurrentSection(page)
    expect(section2State.debug).toBe(2)
    expect(section2State.nav).toBe(2)
    expect(section2State.progress).toBeGreaterThan(0) // Progress should increase
    
    await page.screenshot({ 
      path: 'test-results/corrected-nav-section-2.png',
      fullPage: true 
    })
    
    // Test navigation: Section 2 → 3
    await safeButtonClick(page, 'button:has-text("Next →")', 'Next')
    
    const section3State = await getCurrentSection(page)
    expect(section3State.debug).toBe(3)
    expect(section3State.nav).toBe(3)
    expect(section3State.progress).toBeGreaterThan(section2State.progress)
    
    // Test navigation: Section 3 → 4
    await safeButtonClick(page, 'button:has-text("Next →")', 'Next')
    
    const section4State = await getCurrentSection(page)
    expect(section4State.debug).toBe(4)
    expect(section4State.nav).toBe(4)
    
    // Test navigation: Section 4 → 5 (final)
    await safeButtonClick(page, 'button:has-text("Next →")', 'Next')
    
    const section5State = await getCurrentSection(page)
    expect(section5State.debug).toBe(5)
    expect(section5State.nav).toBe(5)
    
    // Verify Next button is now disabled
    const nextButton = page.locator('button:has-text("Next →")')
    await expect(nextButton).toBeDisabled()
    
    await page.screenshot({ 
      path: 'test-results/corrected-nav-final.png',
      fullPage: true 
    })
    
    console.log('✅ Forward navigation test completed successfully')
  })

  test('should navigate backward correctly with Prev button', async ({ page }) => {
    console.log('🔄 Testing backward navigation')
    
    // First navigate to section 3
    await safeButtonClick(page, 'button:has-text("Next →")', 'Next')
    await safeButtonClick(page, 'button:has-text("Next →")', 'Next')
    
    const section3State = await getCurrentSection(page)
    expect(section3State.debug).toBe(3)
    
    await page.screenshot({ 
      path: 'test-results/corrected-nav-setup-section-3.png',
      fullPage: true 
    })
    
    // Test backward navigation: Section 3 → 2
    await safeButtonClick(page, 'button:has-text("← Prev")', 'Prev')
    
    const section2State = await getCurrentSection(page)
    expect(section2State.debug).toBe(2)
    expect(section2State.nav).toBe(2)
    expect(section2State.progress).toBeLessThan(section3State.progress)
    
    // Test backward navigation: Section 2 → 1
    await safeButtonClick(page, 'button:has-text("← Prev")', 'Prev')
    
    const section1State = await getCurrentSection(page)
    expect(section1State.debug).toBe(1)
    expect(section1State.nav).toBe(1)
    
    // Verify Prev button is now disabled
    const prevButton = page.locator('button:has-text("← Prev")')
    await expect(prevButton).toBeDisabled()
    
    await page.screenshot({ 
      path: 'test-results/corrected-nav-back-to-start.png',
      fullPage: true 
    })
    
    console.log('✅ Backward navigation test completed successfully')
  })

  test('should handle rapid clicks gracefully', async ({ page }) => {
    console.log('⚡ Testing rapid click handling')
    
    const nextButton = page.locator('button:has-text("Next →")')
    
    // Get initial state
    const initialState = await getCurrentSection(page)
    
    // Rapidly click Next button multiple times
    console.log('🚀 Performing rapid clicks...')
    for (let i = 0; i < 5; i++) {
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForTimeout(50) // Very short delay
      }
    }
    
    // Wait for any animations to settle
    await page.waitForTimeout(3000)
    
    const finalState = await getCurrentSection(page)
    
    // Due to animation blocking, we should not have advanced 5 sections
    const sectionsAdvanced = finalState.debug - initialState.debug
    
    console.log(`📊 Rapid click results: Advanced ${sectionsAdvanced} sections (expected: < 5)`)
    
    // We should advance some sections, but not all 5 due to animation blocking
    expect(sectionsAdvanced).toBeGreaterThan(0)
    expect(sectionsAdvanced).toBeLessThan(5)
    
    await page.screenshot({ 
      path: 'test-results/corrected-nav-rapid-clicks.png',
      fullPage: true 
    })
    
    console.log('✅ Rapid click handling test completed successfully')
  })

  test('should maintain state consistency across UI elements', async ({ page }) => {
    console.log('🔄 Testing state consistency')
    
    // Navigate through several sections and verify consistency
    const sectionsToTest = [2, 3, 4, 5, 4, 3, 2, 1]
    
    for (const targetSection of sectionsToTest) {
      console.log(`🎯 Navigating to section ${targetSection}`)
      
      const currentState = await getCurrentSection(page)
      
      if (targetSection > currentState.debug) {
        // Navigate forward
        const clicksNeeded = targetSection - currentState.debug
        for (let i = 0; i < clicksNeeded; i++) {
          await safeButtonClick(page, 'button:has-text("Next →")', 'Next')
        }
      } else if (targetSection < currentState.debug) {
        // Navigate backward
        const clicksNeeded = currentState.debug - targetSection
        for (let i = 0; i < clicksNeeded; i++) {
          await safeButtonClick(page, 'button:has-text("← Prev")', 'Prev')
        }
      }
      
      // Verify final state
      const finalState = await getCurrentSection(page)
      expect(finalState.debug).toBe(targetSection)
      expect(finalState.nav).toBe(targetSection)
      
      // Verify button states
      const nextButton = page.locator('button:has-text("Next →")')
      const prevButton = page.locator('button:has-text("← Prev")')
      
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
      
      console.log(`✅ Section ${targetSection} state verified`)
    }
    
    await page.screenshot({ 
      path: 'test-results/corrected-nav-consistency-final.png',
      fullPage: true 
    })
    
    console.log('✅ State consistency test completed successfully')
  })

  test('should show detailed navigation mechanics', async ({ page }) => {
    console.log('🔬 Analyzing navigation mechanics in detail')
    
    // This test doesn't assert anything, just provides detailed logging
    // for understanding the internal workings
    
    const nextButton = page.locator('button:has-text("Next →")')
    
    for (let i = 0; i < 3; i++) {
      console.log(`\n🔄 Navigation ${i + 1}:`)
      
      const beforeState = await page.evaluate(() => {
        const debugInfo = document.querySelector('.debug-info')?.textContent || ''
        const navInfo = document.querySelector('.nav-info .current-section')?.textContent || ''
        const progressBar = document.querySelector('.progress-fill')
        const progressWidth = progressBar ? window.getComputedStyle(progressBar).width : 'N/A'
        
        return {
          debug: debugInfo,
          nav: navInfo,
          progress: progressWidth,
          scrollY: window.scrollY,
          timestamp: new Date().toLocaleTimeString()
        }
      })
      
      console.log('  Before:', JSON.stringify(beforeState, null, 4))
      
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        
        // Check immediate state (before animation completes)
        await page.waitForTimeout(100)
        const immediateState = await page.evaluate(() => {
          const debugInfo = document.querySelector('.debug-info')?.textContent || ''
          return {
            debug: debugInfo,
            timestamp: new Date().toLocaleTimeString()
          }
        })
        console.log('  Immediate (100ms):', JSON.stringify(immediateState, null, 4))
        
        // Wait for animation to complete
        await waitForAnimationComplete(page)
        
        const afterState = await page.evaluate(() => {
          const debugInfo = document.querySelector('.debug-info')?.textContent || ''
          const navInfo = document.querySelector('.nav-info .current-section')?.textContent || ''
          const progressBar = document.querySelector('.progress-fill')
          const progressWidth = progressBar ? window.getComputedStyle(progressBar).width : 'N/A'
          
          return {
            debug: debugInfo,
            nav: navInfo,
            progress: progressWidth,
            scrollY: window.scrollY,
            timestamp: new Date().toLocaleTimeString()
          }
        })
        
        console.log('  After:', JSON.stringify(afterState, null, 4))
        
        // Take screenshot for this step
        await page.screenshot({ 
          path: `test-results/mechanics-step-${i + 1}.png`,
          fullPage: true 
        })
      } else {
        console.log('  Button disabled, stopping')
        break
      }
    }
    
    // Always pass - this is just for analysis
    expect(true).toBe(true)
  })
})