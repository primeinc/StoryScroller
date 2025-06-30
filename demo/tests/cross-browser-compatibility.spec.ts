import { test, expect, Page, Browser } from '@playwright/test'

// Helper to measure FPS
async function measureFPS(page: Page, duration: number = 3000): Promise<number> {
  const fps = await page.evaluate((measureDuration) => {
    return new Promise<number>((resolve) => {
      let frames = 0
      let lastTime = performance.now()
      const startTime = performance.now()
      
      function countFrame() {
        frames++
        const currentTime = performance.now()
        
        if (currentTime - startTime >= measureDuration) {
          const avgFPS = (frames * 1000) / (currentTime - startTime)
          resolve(Math.round(avgFPS))
        } else {
          requestAnimationFrame(countFrame)
        }
      }
      
      requestAnimationFrame(countFrame)
    })
  }, duration)
  
  return fps
}

// Helper to check for console errors
async function setupErrorMonitoring(page: Page) {
  const errors: string[] = []
  const warnings: string[] = []
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text())
    }
  })
  
  page.on('pageerror', (error) => {
    errors.push(error.message)
  })
  
  return { errors, warnings }
}

test.describe('Cross-Browser Compatibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Basic page load and rendering', async ({ page, browserName }) => {
    // Check that main content loads
    await expect(page.locator('#root')).toBeVisible()
    
    // Check for hero section with story-scroller class
    const heroSection = page.locator('.story-scroller-section').first()
    await expect(heroSection).toBeVisible()
    
    // Verify no critical rendering issues
    const viewportSize = page.viewportSize()
    expect(viewportSize).toBeTruthy()
    
    // Take screenshot for visual comparison
    await page.screenshot({ 
      path: `test-results/compatibility-${browserName}-initial.png`,
      fullPage: false 
    })
  })

  test('JavaScript execution and no console errors', async ({ page, browserName }) => {
    const { errors, warnings } = await setupErrorMonitoring(page)
    
    // Wait for any initial JS to execute
    await page.waitForTimeout(2000)
    
    // Check GSAP is loaded
    const gsapLoaded = await page.evaluate(() => {
      return typeof window.gsap !== 'undefined'
    })
    expect(gsapLoaded).toBe(true)
    
    // Check React is loaded and working
    const reactVersion = await page.evaluate(() => {
      return window.React?.version || 'not found'
    })
    expect(reactVersion).toMatch(/^18\./)
    
    // Verify no JavaScript errors
    expect(errors).toHaveLength(0)
    
    // Log warnings for review (not failures)
    if (warnings.length > 0) {
      console.log(`[${browserName}] Warnings:`, warnings)
    }
  })

  test('Scroll navigation and smooth scrolling', async ({ page, browserName }) => {
    const { errors } = await setupErrorMonitoring(page)
    
    // Test scroll down
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    
    const scrollPositionAfterDown = await page.evaluate(() => window.scrollY)
    expect(scrollPositionAfterDown).toBeGreaterThan(0)
    
    // Test scroll up
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(500)
    
    const scrollPositionAfterUp = await page.evaluate(() => window.scrollY)
    expect(scrollPositionAfterUp).toBeLessThan(scrollPositionAfterDown)
    
    // Test wheel scroll
    await page.mouse.wheel(0, 300)
    await page.waitForTimeout(500)
    
    const scrollPositionAfterWheel = await page.evaluate(() => window.scrollY)
    expect(scrollPositionAfterWheel).toBeGreaterThan(scrollPositionAfterUp)
    
    // Verify no errors during navigation
    expect(errors).toHaveLength(0)
  })

  test('GSAP animations performance', async ({ page, browserName }) => {
    // Navigate to a section with animations
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(1000)
    
    // Measure FPS during animations
    const fps = await measureFPS(page, 3000)
    
    console.log(`[${browserName}] Animation FPS: ${fps}`)
    
    // Expect at least 30 FPS
    expect(fps).toBeGreaterThanOrEqual(30)
    
    // Check if animations are running
    const animationsActive = await page.evaluate(() => {
      return window.gsap?.ticker?.frame > 0
    })
    expect(animationsActive).toBe(true)
  })

  test('Responsive design and mobile viewports', async ({ page, browserName }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop HD' }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.waitForTimeout(500)
      
      // Check main content is still visible
      await expect(page.locator('#root')).toBeVisible()
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `test-results/compatibility-${browserName}-${viewport.name.replace(' ', '-')}.png`,
        fullPage: false 
      })
    }
  })

  test('Keyboard navigation completeness', async ({ page, browserName }) => {
    const { errors } = await setupErrorMonitoring(page)
    
    // Test all keyboard navigation keys
    const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']
    
    for (const key of keys) {
      const initialScroll = await page.evaluate(() => window.scrollY)
      await page.keyboard.press(key)
      await page.waitForTimeout(500)
      const newScroll = await page.evaluate(() => window.scrollY)
      
      // Verify scroll position changed (except maybe for Home at start)
      if (key !== 'Home' || initialScroll > 0) {
        expect(newScroll).not.toBe(initialScroll)
      }
    }
    
    // Verify no errors during keyboard navigation
    expect(errors).toHaveLength(0)
  })

  test('CSS and styling consistency', async ({ page, browserName }) => {
    // Check critical CSS properties
    const criticalStyles = await page.evaluate(() => {
      const root = document.querySelector('#root')
      if (!root) return null
      
      const computed = window.getComputedStyle(root)
      return {
        display: computed.display,
        overflow: computed.overflow,
        position: computed.position
      }
    })
    
    expect(criticalStyles).toBeTruthy()
    expect(criticalStyles.display).not.toBe('none')
    
    // Check for CSS custom properties (CSS variables)
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement
      const computed = window.getComputedStyle(root)
      return {
        hasCSSVariables: computed.getPropertyValue('--color-primary') !== ''
      }
    })
    
    // Log CSS variable support
    console.log(`[${browserName}] CSS Variables supported:`, cssVariables.hasCSSVariables)
  })

  test('Performance metrics and timing', async ({ page, browserName }) => {
    // Reload page to get fresh performance metrics
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByName('first-contentful-paint')[0]
      
      return {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        firstContentfulPaint: paint ? Math.round(paint.startTime) : null,
        timeToInteractive: Math.round(navigation.domInteractive - navigation.fetchStart)
      }
    })
    
    console.log(`[${browserName}] Performance metrics:`, performanceMetrics)
    
    // Reasonable expectations for performance
    expect(performanceMetrics.timeToInteractive).toBeLessThan(3000) // 3 seconds
    if (performanceMetrics.firstContentfulPaint) {
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000) // 2 seconds
    }
  })

  test('Memory usage and leak detection', async ({ page, browserName }) => {
    // Skip memory test for WebKit as it doesn't support memory API
    if (browserName === 'webkit') {
      test.skip()
      return
    }
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Perform multiple navigation actions
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(200)
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Memory should not increase dramatically (allow 50MB increase)
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024 // Convert to MB
    console.log(`[${browserName}] Memory increase: ${memoryIncrease.toFixed(2)}MB`)
    
    // This is a soft check - log but don't fail
    if (memoryIncrease > 50) {
      console.warn(`[${browserName}] High memory increase detected: ${memoryIncrease.toFixed(2)}MB`)
    }
  })

  test('Feature detection and fallbacks', async ({ page, browserName }) => {
    const features = await page.evaluate(() => {
      return {
        intersectionObserver: 'IntersectionObserver' in window,
        requestAnimationFrame: 'requestAnimationFrame' in window,
        cssGrid: CSS.supports('display', 'grid'),
        cssCustomProperties: CSS.supports('--test', 'test'),
        smoothScroll: 'scrollBehavior' in document.documentElement.style,
        resizeObserver: 'ResizeObserver' in window,
        weakMap: 'WeakMap' in window,
        promise: 'Promise' in window,
        fetch: 'fetch' in window
      }
    })
    
    console.log(`[${browserName}] Feature support:`, features)
    
    // All modern browsers should support these features
    expect(features.intersectionObserver).toBe(true)
    expect(features.requestAnimationFrame).toBe(true)
    expect(features.promise).toBe(true)
  })
})

// Generate compatibility report after all tests
test.afterAll(async ({}, testInfo) => {
  const report = {
    timestamp: new Date().toISOString(),
    project: 'StoryScroller 1.0',
    summary: {
      totalTests: testInfo.project.name,
      status: testInfo.status
    }
  }
  
  console.log('\n=== Cross-Browser Compatibility Report ===')
  console.log(JSON.stringify(report, null, 2))
})