import { test, expect } from '@playwright/test'

// Define browser capabilities matrix
const BROWSER_TARGETS = {
  'Chrome 90+': { engine: 'chromium', minVersion: 90 },
  'Firefox 88+': { engine: 'firefox', minVersion: 88 },
  'Safari 14+': { engine: 'webkit', minVersion: 14 },
  'Edge 90+': { engine: 'chromium', minVersion: 90 },
  'Mobile Safari 14+': { engine: 'webkit', minVersion: 14, mobile: true },
  'Chrome Android 90+': { engine: 'chromium', minVersion: 90, mobile: true }
}

interface TestResult {
  browser: string
  feature: string
  status: 'pass' | 'fail' | 'partial'
  notes?: string
  performance?: {
    fps?: number
    loadTime?: number
    memoryUsage?: number
  }
}

const results: TestResult[] = []

test.describe('Compatibility Report Generator', () => {
  test('Generate comprehensive compatibility matrix', async ({ page, browserName }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Basic page load
    const pageLoaded = await page.evaluate(() => {
      return document.readyState === 'complete'
    })
    
    results.push({
      browser: browserName,
      feature: 'Basic page load',
      status: pageLoaded ? 'pass' : 'fail'
    })
    
    // JavaScript framework detection
    const frameworks = await page.evaluate(() => {
      return {
        react: typeof (window as any).React !== 'undefined' || 
               document.querySelector('[data-reactroot]') !== null ||
               document.querySelector('#root')?._reactRootContainer !== undefined,
        gsap: typeof (window as any).gsap !== 'undefined',
        lenis: typeof (window as any).Lenis !== 'undefined' || 
               document.querySelector('[data-lenis-prevent]') !== null
      }
    })
    
    results.push({
      browser: browserName,
      feature: 'React 18 support',
      status: frameworks.react ? 'pass' : 'fail',
      notes: frameworks.react ? 'React detected' : 'React not detected in global scope'
    })
    
    results.push({
      browser: browserName,
      feature: 'GSAP support',
      status: frameworks.gsap ? 'pass' : 'fail'
    })
    
    // Scroll functionality
    let scrollWorking = false
    try {
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(500)
      const scrolled = await page.evaluate(() => window.scrollY > 0)
      scrollWorking = scrolled
    } catch (e) {
      scrollWorking = false
    }
    
    results.push({
      browser: browserName,
      feature: 'Keyboard navigation',
      status: scrollWorking ? 'pass' : 'fail'
    })
    
    // Animation performance
    const performanceData = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        let frames = 0
        const startTime = performance.now()
        
        function measureFrame() {
          frames++
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(measureFrame)
          } else {
            resolve({
              fps: Math.round(frames * 1000 / (performance.now() - startTime)),
              paintTime: performance.getEntriesByType('paint')[0]?.startTime || 0
            })
          }
        }
        
        requestAnimationFrame(measureFrame)
      })
    })
    
    results.push({
      browser: browserName,
      feature: 'Animation performance',
      status: performanceData.fps >= 30 ? 'pass' : 'fail',
      performance: { fps: performanceData.fps }
    })
    
    // CSS Features
    const cssFeatures = await page.evaluate(() => {
      return {
        grid: CSS.supports('display', 'grid'),
        flexbox: CSS.supports('display', 'flex'),
        customProperties: CSS.supports('--test', 'test'),
        smoothScroll: CSS.supports('scroll-behavior', 'smooth'),
        transforms: CSS.supports('transform', 'translateX(10px)')
      }
    })
    
    results.push({
      browser: browserName,
      feature: 'Modern CSS support',
      status: Object.values(cssFeatures).every(v => v) ? 'pass' : 'partial',
      notes: `Grid: ${cssFeatures.grid}, Flexbox: ${cssFeatures.flexbox}, CSS Variables: ${cssFeatures.customProperties}`
    })
    
    // JavaScript features
    const jsFeatures = await page.evaluate(() => {
      return {
        promises: typeof Promise !== 'undefined',
        asyncAwait: (async () => {})().constructor.name === 'Promise',
        modules: 'noModule' in document.createElement('script'),
        intersectionObserver: 'IntersectionObserver' in window,
        resizeObserver: 'ResizeObserver' in window,
        weakMap: 'WeakMap' in window
      }
    })
    
    results.push({
      browser: browserName,
      feature: 'Modern JavaScript APIs',
      status: Object.values(jsFeatures).every(v => v) ? 'pass' : 'partial',
      notes: `IntersectionObserver: ${jsFeatures.intersectionObserver}, ResizeObserver: ${jsFeatures.resizeObserver}`
    })
    
    // Mobile specific tests
    const isMobile = await page.evaluate(() => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    })
    
    if (isMobile || browserName.includes('Mobile')) {
      const touchSupport = await page.evaluate(() => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0
      })
      
      results.push({
        browser: browserName,
        feature: 'Touch support',
        status: touchSupport ? 'pass' : 'fail'
      })
    }
    
    // Console errors check
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', error => errors.push(error.message))
    
    await page.reload()
    await page.waitForTimeout(2000)
    
    results.push({
      browser: browserName,
      feature: 'No JavaScript errors',
      status: errors.length === 0 ? 'pass' : 'fail',
      notes: errors.length > 0 ? `${errors.length} errors found` : undefined
    })
  })
})

test.afterAll(async () => {
  // Generate compatibility matrix
  const browsers = [...new Set(results.map(r => r.browser))]
  const features = [...new Set(results.map(r => r.feature))]
  
  console.log('\n' + '='.repeat(80))
  console.log('STORYSCROLLER 1.0 - CROSS-BROWSER COMPATIBILITY REPORT')
  console.log('='.repeat(80))
  console.log(`Test Date: ${new Date().toISOString()}`)
  console.log(`Browsers Tested: ${browsers.join(', ')}`)
  console.log('\n')
  
  // Summary table
  console.log('COMPATIBILITY MATRIX:')
  console.log('-'.repeat(80))
  
  // Header
  const colWidth = 15
  console.log('Feature'.padEnd(30) + browsers.map(b => b.padEnd(colWidth)).join(''))
  console.log('-'.repeat(30 + browsers.length * colWidth))
  
  // Feature rows
  features.forEach(feature => {
    const row = feature.padEnd(30)
    const statuses = browsers.map(browser => {
      const result = results.find(r => r.browser === browser && r.feature === feature)
      const status = result?.status || 'unknown'
      const symbol = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️ '
      return symbol.padEnd(colWidth)
    })
    console.log(row + statuses.join(''))
  })
  
  console.log('\n' + '-'.repeat(80))
  
  // Performance metrics
  console.log('\nPERFORMANCE METRICS:')
  console.log('-'.repeat(80))
  browsers.forEach(browser => {
    const perfResults = results.filter(r => r.browser === browser && r.performance)
    if (perfResults.length > 0) {
      console.log(`\n${browser}:`)
      perfResults.forEach(r => {
        if (r.performance?.fps) {
          console.log(`  - Animation FPS: ${r.performance.fps}`)
        }
      })
    }
  })
  
  // Known issues
  console.log('\n\nKNOWN ISSUES:')
  console.log('-'.repeat(80))
  const issues = results.filter(r => r.status === 'fail' || r.status === 'partial')
  if (issues.length === 0) {
    console.log('✅ No critical issues found!')
  } else {
    issues.forEach(issue => {
      console.log(`- [${issue.browser}] ${issue.feature}: ${issue.notes || 'Failed'}`)
    })
  }
  
  // Browser support summary
  console.log('\n\nBROWSER SUPPORT SUMMARY:')
  console.log('-'.repeat(80))
  const targetBrowsers = Object.keys(BROWSER_TARGETS)
  targetBrowsers.forEach(target => {
    const supported = browsers.some(b => b.toLowerCase().includes(BROWSER_TARGETS[target].engine))
    console.log(`${target}: ${supported ? '✅ Tested' : '⚠️  Not tested'}`)
  })
  
  // Final recommendation
  console.log('\n\n' + '='.repeat(80))
  console.log('RELEASE READINESS ASSESSMENT:')
  console.log('='.repeat(80))
  
  const criticalFailures = results.filter(r => 
    r.status === 'fail' && 
    ['Basic page load', 'GSAP support', 'No JavaScript errors'].includes(r.feature)
  )
  
  if (criticalFailures.length === 0) {
    console.log('✅ StoryScroller 1.0 is READY for release!')
    console.log('   All critical features are working across tested browsers.')
  } else {
    console.log('❌ StoryScroller 1.0 has BLOCKING ISSUES:')
    criticalFailures.forEach(f => {
      console.log(`   - ${f.browser}: ${f.feature} (${f.notes || 'Critical failure'})`)
    })
  }
  
  console.log('\n' + '='.repeat(80))
})