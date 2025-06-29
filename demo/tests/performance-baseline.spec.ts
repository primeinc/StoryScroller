import { test, expect } from '@playwright/test'

/**
 * Performance baseline test for StoryScroller v2 architecture
 * Captures metrics before useDebouncing refactor for regression testing
 */

test.describe('StoryScroller Performance Baseline', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo with performance monitoring
    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle')
    
    // Wait for StoryScroller to initialize
    await page.waitForSelector('.story-scroller-container')
    await page.waitForTimeout(1000) // Allow systems to stabilize
  })

  test('baseline performance metrics', async ({ page }) => {
    console.log('=== STORYSCROLLER V2 PERFORMANCE BASELINE ===')
    console.log('Date:', new Date().toISOString())
    console.log('Purpose: Pre-refactor baseline for regression testing')
    
    // Capture initial metrics
    const initialMetrics = await page.evaluate(() => {
      return {
        timestamp: Date.now(),
        memoryUsage: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null,
        navigationTiming: {
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
        }
      }
    })
    
    console.log('📊 Initial Metrics:', JSON.stringify(initialMetrics, null, 2))
    
    // Test scroll performance with event counting
    let scrollEventCount = 0
    let lenisEventCount = 0
    let observerEventCount = 0
    
    // Monitor console events
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('📜 Lenis scroll')) lenisEventCount++
      if (text.includes('Observer on')) observerEventCount++
      if (text.includes('scroll')) scrollEventCount++
    })
    
    // Perform standardized scroll test
    console.log('🔄 Starting scroll performance test...')
    const startTime = Date.now()
    
    // Single scroll down
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(2000) // Wait for animation
    
    // Single scroll up  
    await page.mouse.wheel(0, -120)
    await page.waitForTimeout(2000) // Wait for animation
    
    const endTime = Date.now()
    const testDuration = endTime - startTime
    
    // Capture final metrics
    const finalMetrics = await page.evaluate(() => {
      return {
        timestamp: Date.now(),
        memoryUsage: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null,
        scrollPosition: window.scrollY
      }
    })
    
    // Calculate performance metrics
    const memoryDelta = finalMetrics.memoryUsage && initialMetrics.memoryUsage ? 
      finalMetrics.memoryUsage.usedJSHeapSize - initialMetrics.memoryUsage.usedJSHeapSize : 0
    
    const performanceBaseline = {
      testDuration,
      scrollEventCount,
      lenisEventCount, 
      observerEventCount,
      memoryDelta,
      eventsPerSecond: scrollEventCount / (testDuration / 1000),
      lenisEventsPerSecond: lenisEventCount / (testDuration / 1000),
      observerEventsPerSecond: observerEventCount / (testDuration / 1000)
    }
    
    console.log('📈 Performance Baseline Results:')
    console.log('  Test Duration:', testDuration, 'ms')
    console.log('  Total Scroll Events:', scrollEventCount)
    console.log('  Lenis Events:', lenisEventCount)  
    console.log('  Observer Events:', observerEventCount)
    console.log('  Memory Delta:', memoryDelta, 'bytes')
    console.log('  Events/Second:', performanceBaseline.eventsPerSecond.toFixed(2))
    console.log('  Lenis Events/Second:', performanceBaseline.lenisEventsPerSecond.toFixed(2))
    console.log('  Observer Events/Second:', performanceBaseline.observerEventsPerSecond.toFixed(2))
    
    // Save baseline to file for regression testing
    await page.evaluate((baseline) => {
      console.log('💾 PERFORMANCE_BASELINE_V2:', JSON.stringify(baseline, null, 2))
    }, performanceBaseline)
    
    // Assertions for reasonable performance
    expect(performanceBaseline.testDuration).toBeLessThan(10000) // Should complete in <10s
    expect(performanceBaseline.eventsPerSecond).toBeLessThan(1000) // Not more than 1000 events/sec
    expect(memoryDelta).toBeLessThan(10000000) // Memory increase <10MB during test
    
    console.log('✅ Performance baseline captured successfully')
  })

  test('stress test - rapid scroll events', async ({ page }) => {
    console.log('🔥 Starting stress test...')
    
    let totalEvents = 0
    page.on('console', (msg) => {
      if (msg.text().includes('scroll') || msg.text().includes('Observer') || msg.text().includes('Lenis')) {
        totalEvents++
      }
    })
    
    const startTime = Date.now()
    
    // Rapid scroll events to test debouncing
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 60)
      await page.waitForTimeout(50) // Rapid succession
    }
    
    await page.waitForTimeout(3000) // Wait for animations to settle
    
    const duration = Date.now() - startTime
    const eventsPerSecond = totalEvents / (duration / 1000)
    
    console.log('🔥 Stress Test Results:')
    console.log('  Duration:', duration, 'ms')
    console.log('  Total Events:', totalEvents)
    console.log('  Events/Second:', eventsPerSecond.toFixed(2))
    
    // Stress test should not overwhelm the system
    expect(eventsPerSecond).toBeLessThan(500) // Reasonable event rate even under stress
    expect(totalEvents).toBeGreaterThan(0) // System should respond
    
    console.log('✅ Stress test completed')
  })

  test('memory leak detection', async ({ page }) => {
    console.log('🔍 Memory leak detection test...')
    
    const iterations = 5
    const memorySnapshots: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      // Navigate and interact
      await page.mouse.wheel(0, 120)
      await page.waitForTimeout(1000)
      await page.mouse.wheel(0, -120) 
      await page.waitForTimeout(1000)
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc()
        }
      })
      
      // Capture memory usage
      const memory = await page.evaluate(() => {
        return (performance as any).memory ? 
          (performance as any).memory.usedJSHeapSize : 0
      })
      
      memorySnapshots.push(memory)
      console.log(`Memory snapshot ${i + 1}:`, memory, 'bytes')
    }
    
    // Check for memory growth trend
    const firstSnapshot = memorySnapshots[0]
    const lastSnapshot = memorySnapshots[memorySnapshots.length - 1]
    const memoryGrowth = lastSnapshot - firstSnapshot
    const growthPercentage = (memoryGrowth / firstSnapshot) * 100
    
    console.log('📊 Memory Analysis:')
    console.log('  Initial Memory:', firstSnapshot, 'bytes')
    console.log('  Final Memory:', lastSnapshot, 'bytes')
    console.log('  Total Growth:', memoryGrowth, 'bytes')
    console.log('  Growth Percentage:', growthPercentage.toFixed(2), '%')
    
    // Memory growth should be reasonable
    expect(growthPercentage).toBeLessThan(50) // Less than 50% growth during test
    
    console.log('✅ Memory leak test completed')
  })
})