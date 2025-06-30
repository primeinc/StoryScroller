import { test, expect } from '@playwright/test'

test('Debug page structure', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Wait a bit for any dynamic content
  await page.waitForTimeout(2000)
  
  // Get page title
  const title = await page.title()
  console.log('Page title:', title)
  
  // Check for main containers
  const bodyHTML = await page.evaluate(() => {
    const body = document.body
    return {
      hasChildren: body.children.length > 0,
      firstChildTag: body.children[0]?.tagName,
      firstChildId: body.children[0]?.id,
      firstChildClass: body.children[0]?.className
    }
  })
  console.log('Body structure:', bodyHTML)
  
  // Look for React root
  const reactRoot = await page.evaluate(() => {
    const root = document.getElementById('root') || document.querySelector('[id*="root"]')
    return {
      found: !!root,
      id: root?.id,
      className: root?.className,
      childrenCount: root?.children.length || 0
    }
  })
  console.log('React root:', reactRoot)
  
  // Look for sections
  const sections = await page.evaluate(() => {
    const sectionElements = document.querySelectorAll('section')
    return Array.from(sectionElements).map((section, index) => ({
      index,
      id: section.id,
      className: section.className,
      hasText: section.textContent?.substring(0, 50)
    }))
  })
  console.log('Sections found:', sections)
  
  // Look for StoryScroller specific elements
  const storyScrollerElements = await page.evaluate(() => {
    // Try various selectors
    const selectors = [
      '[data-storyscroller]',
      '[class*="story"]',
      '[class*="scroller"]',
      '.story-scroller',
      '#story-scroller'
    ]
    
    const results = {}
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        results[selector] = elements.length
      }
    })
    
    return results
  })
  console.log('StoryScroller elements:', storyScrollerElements)
  
  // Take a screenshot for manual inspection
  await page.screenshot({ path: 'test-results/debug-page-structure.png', fullPage: true })
})