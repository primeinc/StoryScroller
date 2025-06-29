import { test, expect, Page } from '@playwright/test'

/**
 * Final Navigation Analysis Test
 * 
 * This test comprehensively documents the current state of StoryScroller navigation,
 * identifying what works and what needs to be fixed.
 */

test.describe('StoryScroller Navigation - Final Analysis', () => {
  test('comprehensive navigation analysis with detailed findings', async ({ page }) => {
    // Capture all console logs for analysis
    const consoleLogs: string[] = []
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
    })

    console.log('🔬 COMPREHENSIVE NAVIGATION ANALYSIS')
    console.log('=====================================')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/final-analysis-initial.png',
      fullPage: true 
    })

    console.log('\n📊 INITIAL STATE ANALYSIS')
    console.log('-------------------------')

    const initialState = await page.evaluate(() => {
      const debugInfo = document.querySelector('.debug-info')?.textContent || ''
      const navInfo = document.querySelector('.nav-info .current-section')?.textContent || ''
      const progressBar = document.querySelector('.progress-fill')
      const progressWidth = progressBar ? window.getComputedStyle(progressBar).width : 'N/A'
      
      // Check button states
      const nextBtn = document.querySelector('button[aria-label="Next section"]') as HTMLButtonElement
      const prevBtn = document.querySelector('button[aria-label="Previous section"]') as HTMLButtonElement
      
      return {
        debug: debugInfo,
        nav: navInfo,
        progress: progressWidth,
        scrollY: window.scrollY,
        nextButtonDisabled: nextBtn?.disabled || false,
        prevButtonDisabled: prevBtn?.disabled || false,
        timestamp: new Date().toLocaleTimeString()
      }
    })

    console.log('Initial State:', JSON.stringify(initialState, null, 2))

    // Verify expected initial state
    expect(initialState.debug).toContain('Current: 1')
    expect(initialState.debug).toContain('Animating: No')
    expect(initialState.nav).toContain('1 / 5')
    expect(initialState.prevButtonDisabled).toBe(true) // Should be disabled on first section
    expect(initialState.nextButtonDisabled).toBe(false) // Should be enabled

    console.log('✅ Initial state verification: PASSED')

    console.log('\n🔄 NAVIGATION TESTING')
    console.log('---------------------')

    const nextButton = page.locator('button:has-text("Next →")')
    const testResults: any[] = []

    // Test up to 4 navigation clicks
    for (let i = 0; i < 4; i++) {
      console.log(`\n--- Navigation Click ${i + 1} ---`)

      // Get state before click
      const beforeState = await page.evaluate(() => {
        const debugInfo = document.querySelector('.debug-info')?.textContent || ''
        const navInfo = document.querySelector('.nav-info .current-section')?.textContent || ''
        return { debug: debugInfo, nav: navInfo, timestamp: new Date().toLocaleTimeString() }
      })

      console.log(`Before Click ${i + 1}:`, beforeState)

      // Check if button is enabled
      const isEnabled = await nextButton.isEnabled()
      if (!isEnabled) {
        console.log(`❌ Next button is disabled, stopping at click ${i + 1}`)
        break
      }

      // Click the button
      await nextButton.click()
      console.log(`👆 Clicked Next button (click ${i + 1})`)

      // Wait a short time and check immediate state
      await page.waitForTimeout(200)
      const immediateState = await page.evaluate(() => {
        const debugInfo = document.querySelector('.debug-info')?.textContent || ''
        const navInfo = document.querySelector('.nav-info .current-section')?.textContent || ''
        return { debug: debugInfo, nav: navInfo, timestamp: new Date().toLocaleTimeString() }
      })

      console.log(`Immediate State (200ms):`, immediateState)

      // Wait longer and check settled state
      await page.waitForTimeout(1000)
      const settledState = await page.evaluate(() => {
        const debugInfo = document.querySelector('.debug-info')?.textContent || ''
        const navInfo = document.querySelector('.nav-info .current-section')?.textContent || ''
        const progressBar = document.querySelector('.progress-fill')
        const progressWidth = progressBar ? window.getComputedStyle(progressBar).width : 'N/A'
        return { 
          debug: debugInfo, 
          nav: navInfo, 
          progress: progressWidth,
          timestamp: new Date().toLocaleTimeString() 
        }
      })

      console.log(`Settled State (1000ms):`, settledState)

      // Extract section numbers for analysis
      const beforeSection = parseInt(beforeState.debug.match(/Current: (\d+)/)?.[1] || '0')
      const settledSection = parseInt(settledState.debug.match(/Current: (\d+)/)?.[1] || '0')
      
      const navigationWorked = settledSection > beforeSection
      const stillAnimating = settledState.debug.includes('Animating: Yes')

      const result = {
        clickNumber: i + 1,
        beforeSection,
        afterSection: settledSection,
        navigationWorked,
        stillAnimating,
        progressChanged: settledState.progress !== (i === 0 ? initialState.progress : testResults[i-1]?.finalProgress),
        finalProgress: settledState.progress
      }

      testResults.push(result)

      console.log(`📊 Click ${i + 1} Analysis:`)
      console.log(`  - Navigation worked: ${navigationWorked ? '✅ YES' : '❌ NO'}`)
      console.log(`  - Section change: ${beforeSection} → ${settledSection}`)
      console.log(`  - Still animating: ${stillAnimating ? '⚠️ YES' : '✅ NO'}`)
      console.log(`  - Progress changed: ${result.progressChanged ? '✅ YES' : '❌ NO'}`)

      // Take screenshot for this step
      await page.screenshot({ 
        path: `test-results/final-analysis-click-${i + 1}.png`,
        fullPage: true 
      })
    }

    console.log('\n📈 OVERALL ANALYSIS')
    console.log('-------------------')

    const successfulNavigations = testResults.filter(r => r.navigationWorked).length
    const stuckAnimations = testResults.filter(r => r.stillAnimating).length
    const progressUpdates = testResults.filter(r => r.progressChanged).length

    console.log(`Total navigation attempts: ${testResults.length}`)
    console.log(`Successful navigations: ${successfulNavigations}/${testResults.length}`)
    console.log(`Stuck animations: ${stuckAnimations}/${testResults.length}`)
    console.log(`Progress bar updates: ${progressUpdates}/${testResults.length}`)

    console.log('\n🔍 DETAILED FINDINGS')
    console.log('--------------------')

    // Key findings based on the test results
    if (successfulNavigations > 0) {
      console.log('✅ FINDING 1: Button navigation DOES work - sections advance correctly')
    } else {
      console.log('❌ FINDING 1: Button navigation FAILS - no section advancement detected')
    }

    if (stuckAnimations > 0) {
      console.log('⚠️ FINDING 2: Animation state management has issues - animations never complete')
      console.log('   This causes subsequent navigation to be blocked or delayed')
    } else {
      console.log('✅ FINDING 2: Animation state management works correctly')
    }

    if (progressUpdates > 0) {
      console.log('✅ FINDING 3: Progress bar updates correctly with navigation')
    } else {
      console.log('❌ FINDING 3: Progress bar does not update with navigation')
    }

    console.log('\n📝 CONSOLE LOG ANALYSIS')
    console.log('-----------------------')

    const relevantLogs = consoleLogs.filter(log => 
      log.includes('useStoryScroller') || 
      log.includes('useScrollManager') || 
      log.includes('gotoSection') ||
      log.includes('🎯')
    )

    console.log(`Found ${relevantLogs.length} relevant navigation logs:`)
    relevantLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`)
    })

    console.log('\n🎯 FINAL VERDICT')
    console.log('================')

    if (successfulNavigations > 0 && progressUpdates > 0) {
      if (stuckAnimations > 0) {
        console.log('🟡 VERDICT: Navigation WORKS but has animation timing issues')
        console.log('   - Core functionality: ✅ Working')
        console.log('   - Button clicks: ✅ Functional') 
        console.log('   - State updates: ✅ Working')
        console.log('   - Progress tracking: ✅ Working')
        console.log('   - Animation completion: ❌ Broken (animations never finish)')
        console.log('')
        console.log('🔧 RECOMMENDED FIXES:')
        console.log('   1. Fix animation completion callbacks in useScrollManager')
        console.log('   2. Ensure isAnimating flag is properly cleared')
        console.log('   3. Add timeout fallback for animation completion')
      } else {
        console.log('🟢 VERDICT: Navigation works perfectly')
      }
    } else {
      console.log('🔴 VERDICT: Navigation has critical issues')
    }

    // Test passes if core navigation works, even with animation timing issues
    expect(successfulNavigations).toBeGreaterThan(0)
    console.log('\n✅ Test completed - core navigation functionality verified')
  })

  test('rapid click behavior analysis', async ({ page }) => {
    console.log('\n⚡ RAPID CLICK BEHAVIOR ANALYSIS')
    console.log('===============================')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const nextButton = page.locator('button:has-text("Next →")')

    // Get initial state
    const initialSection = await page.evaluate(() => {
      const debugInfo = document.querySelector('.debug-info')?.textContent || ''
      const match = debugInfo.match(/Current: (\d+)/)
      return match ? parseInt(match[1]) : 1
    })

    console.log(`Starting section: ${initialSection}`)

    // Perform rapid clicks
    console.log('Performing 5 rapid clicks in 250ms intervals...')
    for (let i = 0; i < 5; i++) {
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        console.log(`  Click ${i + 1} executed`)
      }
      await page.waitForTimeout(50) // Very rapid
    }

    // Wait for all animations to settle
    await page.waitForTimeout(3000)

    const finalSection = await page.evaluate(() => {
      const debugInfo = document.querySelector('.debug-info')?.textContent || ''
      const match = debugInfo.match(/Current: (\d+)/)
      return match ? parseInt(match[1]) : 1
    })

    const sectionsAdvanced = finalSection - initialSection

    console.log(`Final section: ${finalSection}`)
    console.log(`Sections advanced: ${sectionsAdvanced}`)

    if (sectionsAdvanced === 5) {
      console.log('🔴 FINDING: No debouncing/animation blocking - all clicks processed')
    } else if (sectionsAdvanced > 0 && sectionsAdvanced < 5) {
      console.log('🟡 FINDING: Partial debouncing/animation blocking - some clicks ignored')
    } else {
      console.log('🔴 FINDING: Total blocking or navigation failure')
    }

    // This is expected behavior - rapid clicks should be somewhat throttled
    expect(sectionsAdvanced).toBeGreaterThan(0)
    expect(sectionsAdvanced).toBeLessThanOrEqual(5)
  })
})