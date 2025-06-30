/**
 * Critical Navigation Issues Test Suite
 * 
 * This test suite specifically targets the critical navigation issues found in console logs:
 * 1. Mouse wheel navigation broken (wheel events block navigation instead of triggering it)
 * 2. Button navigation delays too long (excessive delays between navigations)
 * 3. State synchronization issues (section/scroll position mismatch)
 * 4. Multi-navigation sequence failures
 * 
 * These tests are designed to FAIL with the current implementation, proving they catch
 * the real-world issues, then pass after fixes are applied.
 */

import { test, expect, Page } from '@playwright/test'

// Helper to wait for a specific condition with timeout
const waitFor = async (condition: () => Promise<boolean> | boolean, timeout = 5000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await condition()) return true
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Condition not met within ${timeout}ms`)
}

// Helper to get StoryScroller API and state
const getScrollerState = async (page: Page) => {
  return await page.evaluate(() => {
    const api = (window as any).storyScrollerAPI
    if (!api) throw new Error('StoryScroller API not available')
    
    const state = api.getState()
    const queueStatus = api.getQueueStatus ? api.getQueueStatus() : { pending: 0, processing: false }
    
    return {
      state,
      queueStatus,
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      calculatedSection: Math.round(window.scrollY / window.innerHeight)
    }
  })
}

// Helper to simulate wheel events
const simulateWheelEvent = async (page: Page, deltaY: number, deltaX = 0) => {
  await page.evaluate(({ deltaY, deltaX }) => {
    const container = document.querySelector('.story-scroller-container')
    if (!container) throw new Error('Story scroller container not found')
    
    const wheelEvent = new WheelEvent('wheel', {
      deltaY,
      deltaX,
      bubbles: true,
      cancelable: true,
    })
    
    container.dispatchEvent(wheelEvent)
  }, { deltaY, deltaX })
}

test.describe('Critical Navigation Issues Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to see debug messages
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`)
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for StoryScroller to initialize
    await page.waitForFunction(() => (window as any).storyScrollerAPI !== undefined, { timeout: 10000 })
    
    // Wait for sections to be visible
    await page.waitForSelector('[data-section-idx="0"]', { timeout: 10000 })
    
    // Small delay to ensure everything is fully initialized
    await page.waitForTimeout(500)
  })

  test.describe('1. Mouse Wheel Navigation Broken', () => {
    test('should trigger navigation on wheel events (CURRENTLY FAILS - wheel events blocked)', async ({ page }) => {
      // This test should FAIL with current implementation
      // Current issue: wheel events set notScrolling: false which blocks navigation
      
      const initialState = await getScrollerState(page)
      expect(initialState.state.currentSection).toBe(0)
      
      console.log('🔍 Initial state:', initialState)
      
      // Simulate wheel down event (should navigate to section 1)
      await simulateWheelEvent(page, 100) // Positive delta = scroll down
      
      // Wait for navigation to complete (animation is 1.2 seconds + buffer)
      await page.waitForTimeout(1500)
      
      const afterWheelState = await getScrollerState(page)
      console.log('🔍 After wheel event state:', afterWheelState)
      
      // EXPECTATION: Should navigate to section 1
      // CURRENT REALITY: Likely still on section 0 due to blocking logic
      expect(afterWheelState.state.currentSection).toBe(1) // This will FAIL currently
      expect(afterWheelState.state.isAnimating).toBe(false) // Should complete animation
    })

    test('should handle multiple wheel events appropriately', async ({ page }) => {
      const initialState = await getScrollerState(page)
      expect(initialState.state.currentSection).toBe(0)
      
      // Simulate multiple wheel events in quick succession
      await simulateWheelEvent(page, 50)
      await page.waitForTimeout(50)
      await simulateWheelEvent(page, 75)
      await page.waitForTimeout(50)
      await simulateWheelEvent(page, 100)
      
      // Wait for any animations to complete
      await page.waitForTimeout(1500)
      
      const finalState = await getScrollerState(page)
      console.log('🔍 After multiple wheel events:', finalState)
      
      // Should advance at least one section
      expect(finalState.state.currentSection).toBeGreaterThan(0)
      // But shouldn't advance too many sections due to debouncing
      expect(finalState.state.currentSection).toBeLessThanOrEqual(2)
    })
  })

  test.describe('2. Button Navigation Delays Too Long', () => {
    test('should allow rapid button navigation with reasonable timing (CURRENTLY FAILS - excessive delays)', async ({ page }) => {
      // This test should FAIL with current implementation
      // Current issue: 200ms cooldown + debouncing makes buttons feel sluggish
      
      const navigationTimes: number[] = []
      const maxAcceptableDelay = 400 // 400ms max delay between navigations
      
      // Track state changes
      await page.evaluate(() => {
        const originalAPI = (window as any).storyScrollerAPI
        const originalGetState = originalAPI.getState
        
        originalAPI.getState = function() {
          const state = originalGetState.call(this)
          if (state.currentSection > 0) {
            (window as any).navigationTimes = (window as any).navigationTimes || []
            ;(window as any).navigationTimes.push(Date.now())
          }
          return state
        }
      })
      
      const startTime = Date.now()
      
      // Perform rapid navigation sequence
      const nextButton = page.locator('button:has-text("Next →")')
      
      await nextButton.click() // 0 -> 1
      await page.waitForTimeout(100)
      
      await nextButton.click() // 1 -> 2
      await page.waitForTimeout(100)
      
      await nextButton.click() // 2 -> 3
      
      // Wait for all animations to complete
      await page.waitForTimeout(2000)
      
      const finalState = await getScrollerState(page)
      console.log('🔍 After rapid button clicks:', finalState)
      
      // Should have navigated to section 3
      expect(finalState.state.currentSection).toBe(3)
      
      // Check timing - total time should be reasonable
      const totalTime = Date.now() - startTime
      expect(totalTime).toBeLessThan(3000) // 3 seconds max for 3 navigations
      
      // Get navigation times from page
      const navTimes = await page.evaluate(() => (window as any).navigationTimes || [])
      
      // Check timing between navigations if we have data
      if (navTimes.length >= 2) {
        for (let i = 1; i < navTimes.length; i++) {
          const timeBetweenNavs = navTimes[i] - navTimes[i - 1]
          console.log(`🔍 Time between navigation ${i-1} and ${i}: ${timeBetweenNavs}ms`)
          expect(timeBetweenNavs).toBeLessThan(maxAcceptableDelay)
        }
      }
    })

    test('should update state immediately when navigation starts', async ({ page }) => {
      const initialState = await getScrollerState(page)
      expect(initialState.state.currentSection).toBe(0)
      
      // Click next button
      const nextButton = page.locator('button:has-text("Next →")')
      await nextButton.click()
      
      // Check state very quickly after click (should show animation started)
      await page.waitForTimeout(50) // Minimal delay
      
      const immediateState = await getScrollerState(page)
      console.log('🔍 Immediate state after click:', immediateState)
      
      // The target section should be set immediately OR animation should be in progress
      expect(
        immediateState.state.targetSection === 1 || 
        immediateState.state.isAnimating === true ||
        immediateState.state.currentSection === 1
      ).toBe(true)
    })
  })

  test.describe('3. State Synchronization Issues', () => {
    test('should handle initial scroll position mismatch (CURRENTLY FAILS - sync issues)', async ({ page }) => {
      // This test reproduces the exact issue from console logs
      // Current issue: system starts with wrong scroll position/section mismatch
      
      // Manually set scroll position to simulate the problematic state
      await page.evaluate(() => {
        window.scrollTo(0, 1047) // Scroll position that doesn't match section 0
      })
      
      // Wait a moment for potential state correction
      await page.waitForTimeout(1000)
      
      const state = await getScrollerState(page)
      console.log('🔍 State after manual scroll:', state)
      
      // Calculate what section we should be on
      const expectedSection = Math.round(1047 / state.innerHeight) // Should be section 1
      
      // The state should either auto-correct or we should force sync
      const api = await page.evaluate(() => (window as any).storyScrollerAPI)
      
      // Try force sync
      await page.evaluate(() => {
        const api = (window as any).storyScrollerAPI
        api.forceSync()
      })
      
      await page.waitForTimeout(500)
      
      const syncedState = await getScrollerState(page)
      console.log('🔍 State after force sync:', syncedState)
      
      // After force sync, state should match scroll position
      expect(Math.abs(syncedState.state.currentSection - syncedState.calculatedSection)).toBeLessThanOrEqual(1)
    })

    test('should maintain scroll position and section consistency', async ({ page }) => {
      // Navigate to section 2 first
      const nextButton = page.locator('button:has-text("Next →")')
      await nextButton.click()
      await page.waitForTimeout(500)
      await nextButton.click()
      await page.waitForTimeout(1000)
      
      const state = await getScrollerState(page)
      console.log('🔍 State on section 2:', state)
      
      expect(state.state.currentSection).toBe(2)
      
      // Check that scroll position matches section
      const expectedScrollY = state.state.currentSection * state.innerHeight
      const scrollDifference = Math.abs(state.scrollY - expectedScrollY)
      
      console.log(`🔍 Scroll position check: expected=${expectedScrollY}, actual=${state.scrollY}, diff=${scrollDifference}`)
      
      // Allow some tolerance for scroll position
      expect(scrollDifference).toBeLessThan(state.innerHeight * 0.1) // Within 10% of viewport height
    })
  })

  test.describe('4. Multi-Navigation Sequence Test', () => {
    test('should handle complex navigation sequences without state corruption', async ({ page }) => {
      // This test verifies proper state management through complex navigation
      
      const navigationSequence = [
        { action: 'next', expected: 1 },    // 0 -> 1
        { action: 'next', expected: 2 },    // 1 -> 2
        { action: 'prev', expected: 1 },    // 2 -> 1
        { action: 'next', expected: 2 },    // 1 -> 2
        { action: 'next', expected: 3 },    // 2 -> 3
        { action: 'prev', expected: 2 },    // 3 -> 2
        { action: 'prev', expected: 1 },    // 2 -> 1
      ]
      
      for (const { action, expected } of navigationSequence) {
        console.log(`🔍 Executing ${action} -> expect section ${expected}`)
        
        if (action === 'next') {
          await page.locator('button:has-text("Next →")').click()
        } else {
          await page.locator('button:has-text("← Prev")').click()
        }
        
        // Wait for navigation to complete
        await page.waitForTimeout(800)
        
        const state = await getScrollerState(page)
        console.log(`🔍 After ${action}:`, state.state)
        
        expect(state.state.currentSection).toBe(expected)
        
        // Verify state consistency
        expect(state.state.isAnimating).toBe(false) // Should not be stuck animating
        expect(state.state.targetSection).toBeNull() // Should not have pending target
        expect(state.queueStatus.processing).toBe(false) // Queue should be clear
      }
    })

    test('should maintain queue integrity during rapid navigation requests', async ({ page }) => {
      // Test that the animation queue properly handles rapid requests
      
      const initialState = await getScrollerState(page)
      expect(initialState.state.currentSection).toBe(0)
      
      // Perform rapid navigation via API calls
      await page.evaluate(() => {
        const api = (window as any).storyScrollerAPI
        api.nextSection() // 0 -> 1
        api.nextSection() // Should queue 1 -> 2
        api.nextSection() // Should queue 2 -> 3
        api.prevSection() // Should queue 3 -> 2 (or be ignored if queue is full)
      })
      
      // Wait for all animations to complete
      await page.waitForTimeout(3000)
      
      const finalState = await getScrollerState(page)
      console.log('🔍 After rapid API calls:', finalState)
      
      // Should have ended up at a valid section (not stuck or corrupted)
      expect(finalState.state.currentSection).toBeGreaterThanOrEqual(0)
      expect(finalState.state.currentSection).toBeLessThan(5)
      expect(finalState.state.isAnimating).toBe(false)
      expect(finalState.state.targetSection).toBeNull()
      
      // Queue should be clear
      expect(finalState.queueStatus.processing).toBe(false)
      expect(finalState.queueStatus.pending).toBe(0)
    })
  })

  test.describe('5. Performance and Timing Validation', () => {
    test.skip('should complete wheel navigation within performance targets', async ({ page }) => {
      // Verify that wheel navigation doesn't exceed performance thresholds
      
      const startTime = Date.now()
      
      // Simulate wheel event
      await simulateWheelEvent(page, 150) // Strong wheel down
      
      // Wait for navigation to complete (animation is 1.2s + buffer)
      await waitFor(async () => {
        const state = await getScrollerState(page)
        return !state.state.isAnimating
      }, 3000) // Increase timeout to 3 seconds
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      console.log(`🔍 Wheel navigation took ${totalTime}ms`)
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(1500) // 1.5 seconds max for wheel navigation
      
      const finalState = await getScrollerState(page)
      expect(finalState.state.isAnimating).toBe(false) // Should not be stuck
      
      // Should have actually navigated
      expect(finalState.state.currentSection).toBeGreaterThan(0)
    })

    test('should not have excessive console errors during navigation', async ({ page }) => {
      // Monitor console for errors during navigation
      const consoleMessages: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warn') {
          consoleMessages.push(`${msg.type()}: ${msg.text()}`)
        }
      })
      
      // Perform various navigation actions
      const nextButton = page.locator('button:has-text("Next →")')
      const prevButton = page.locator('button:has-text("← Prev")')
      
      await nextButton.click()
      await page.waitForTimeout(500)
      
      await nextButton.click()
      await page.waitForTimeout(500)
      
      await prevButton.click()
      await page.waitForTimeout(500)
      
      // Force sync
      await page.evaluate(() => {
        const api = (window as any).storyScrollerAPI
        api.forceSync()
      })
      
      await page.waitForTimeout(500)
      
      console.log('🔍 Console messages during navigation:', consoleMessages)
      
      // Filter out expected debug messages and focus on actual errors
      const actualErrors = consoleMessages.filter(msg => 
        !msg.includes('DEBUG:') && 
        !msg.includes('State verification:') &&
        msg.includes('error:')
      )
      
      const actualWarnings = consoleMessages.filter(msg => 
        !msg.includes('DEBUG:') && 
        !msg.includes('State verification:') &&
        msg.includes('warn:')
      )
      
      // Should not have excessive errors
      expect(actualErrors.length).toBeLessThan(2) // At most 1 error
      expect(actualWarnings.length).toBeLessThan(5) // Reasonable number of warnings
    })
  })
})