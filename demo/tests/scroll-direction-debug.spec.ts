import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

test.describe('Scroll Direction Debug', () => {
  let consoleMessages: string[] = []

  test('single scroll down - capture everything', async ({ page }) => {
    // Reset console capture
    consoleMessages = []

    // Capture ALL console messages
    page.on('console', msg => {
      const timestamp = new Date().toISOString()
      const message = `[${timestamp}] ${msg.type()}: ${msg.text()}`
      consoleMessages.push(message)
    })

    // Capture page errors
    page.on('pageerror', error => {
      consoleMessages.push(`[${new Date().toISOString()}] PAGE ERROR: ${error.message}\nStack: ${error.stack}`)
    })

    // Go to page
    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle')
    
    // Wait for StoryScroller to initialize
    await page.waitForTimeout(2000)
    
    // Take BEFORE screenshot
    await page.screenshot({ 
      path: 'test-results/before-scroll.png',
      fullPage: true 
    })
    
    // Get initial state
    const initialScrollY = await page.evaluate(() => window.scrollY)
    const initialSection = await page.locator('text=1 / 5').isVisible()
    
    console.log('=== INITIAL STATE ===')
    console.log('ScrollY:', initialScrollY)
    console.log('On section 1:', initialSection)
    
    // Clear console log array to focus on scroll event
    consoleMessages = []
    
    // ===== THE CRITICAL TEST: SINGLE SCROLL DOWN =====
    console.log('=== PERFORMING SINGLE SCROLL DOWN ===')
    
    // Focus the center of the page
    const viewport = page.viewportSize()!
    const centerX = viewport.width / 2
    const centerY = viewport.height / 2
    await page.mouse.move(centerX, centerY)
    
    // Single scroll wheel down (positive deltaY = scroll down)
    await page.mouse.wheel(0, 120) // Positive deltaY = scroll DOWN
    
    // Wait for any scroll animation
    await page.waitForTimeout(2000)
    
    // Take AFTER screenshot
    await page.screenshot({ 
      path: 'test-results/after-scroll.png',
      fullPage: true 
    })
    
    // Get final state
    const finalScrollY = await page.evaluate(() => window.scrollY)
    const finalSection1 = await page.locator('text=1 / 5').isVisible()
    const finalSection2 = await page.locator('text=2 / 5').isVisible()
    
    console.log('=== FINAL STATE ===')
    console.log('ScrollY:', finalScrollY)
    console.log('Still on section 1:', finalSection1)
    console.log('Now on section 2:', finalSection2)
    
    // Get document scroll height to verify structure
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    
    console.log('=== DOCUMENT STRUCTURE ===')
    console.log('Total scroll height:', scrollHeight)
    console.log('Viewport height:', viewportHeight)
    console.log('Expected sections:', scrollHeight / viewportHeight)
    
    // Save all console logs to file
    const logsContent = [
      '=== SCROLL DIRECTION DEBUG TEST ===',
      `Test: Single mouse wheel scroll DOWN (deltaY: +120)`,
      `Expected: Observer onDown triggered, navigate to section 2`,
      `Time: ${new Date().toISOString()}`,
      '',
      '=== INITIAL STATE ===',
      `ScrollY: ${initialScrollY}`,
      `On section 1: ${initialSection}`,
      '',
      '=== FINAL STATE ===',
      `ScrollY: ${finalScrollY}`,
      `Still on section 1: ${finalSection1}`,
      `Now on section 2: ${finalSection2}`,
      '',
      '=== DOCUMENT STRUCTURE ===',
      `Total scroll height: ${scrollHeight}px`,
      `Viewport height: ${viewportHeight}px`,
      `Expected sections: ${Math.round(scrollHeight / viewportHeight)}`,
      '',
      '=== CONSOLE MESSAGES DURING SCROLL ===',
      ...consoleMessages,
      '',
      '=== ANALYSIS ===',
      `Did scroll position change? ${finalScrollY !== initialScrollY}`,
      `Did section change? ${finalSection2 && !finalSection1}`,
      `Was navigation successful? ${finalSection2}`,
    ].join('\n')
    
    // Write comprehensive log file
    fs.writeFileSync('test-results/scroll-debug-full.log', logsContent)
    
    // Extract just Observer events for easy analysis
    const observerEvents = consoleMessages.filter(msg => 
      msg.includes('Observer on') || msg.includes('gotoSection called')
    )
    
    const observerLog = [
      '=== OBSERVER EVENTS ONLY ===',
      `Action: Mouse wheel scroll DOWN (deltaY: +120)`,
      `Expected: ⬇️ Observer onDown triggered`,
      '',
      ...observerEvents,
      '',
      observerEvents.length === 0 ? 'NO OBSERVER EVENTS DETECTED!' : `${observerEvents.length} Observer events captured`
    ].join('\n')
    
    fs.writeFileSync('test-results/observer-events.log', observerLog)
    
    // Attach files to test report
    await test.info().attach('full-debug-log', { path: 'test-results/scroll-debug-full.log' })
    await test.info().attach('observer-events', { path: 'test-results/observer-events.log' })
    await test.info().attach('before-screenshot', { path: 'test-results/before-scroll.png' })
    await test.info().attach('after-screenshot', { path: 'test-results/after-scroll.png' })
    
    // The test expectation
    console.log('=== TEST ASSERTION ===')
    if (finalSection2) {
      console.log('✅ SUCCESS: Navigation worked!')
    } else {
      console.log('❌ FAILURE: Still on section 1 after scroll down')
      console.log('Check observer-events.log for direction mapping issue')
    }
    
    // Fail test if navigation didn't work so we can examine the logs
    expect(finalSection2).toBe(true)
  })
})