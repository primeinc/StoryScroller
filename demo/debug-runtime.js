import { chromium } from 'playwright-core';

async function debugRuntime() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capture uncaught errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  try {
    // Navigate to the demo
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    
    // Wait a bit for React to render
    await page.waitForTimeout(3000);
    
    // Check if root element exists and has content
    const rootElement = await page.$('#root');
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        innerHTML: root ? root.innerHTML.substring(0, 500) : 'ROOT NOT FOUND',
        hasChildren: root ? root.children.length : 0
      };
    });
    
    // Check for story scroller specific elements
    const storyScrollerElements = await page.evaluate(() => {
      const container = document.querySelector('.story-scroller-container');
      const sections = document.querySelectorAll('.story-scroller-section');
      const demoSections = document.querySelectorAll('.demo-section');
      
      return {
        containerExists: !!container,
        sectionsCount: sections.length,
        demoSectionsCount: demoSections.length,
        containerHTML: container ? container.outerHTML.substring(0, 300) : 'NO CONTAINER',
        firstSectionHTML: sections[0] ? sections[0].outerHTML.substring(0, 500) : 'NO SECTIONS'
      };
    });
    
    // Check computed styles for first section if it exists
    const firstSectionStyles = await page.evaluate(() => {
      const firstSection = document.querySelector('.story-scroller-section');
      if (!firstSection) return 'NO SECTION TO CHECK';
      
      const styles = window.getComputedStyle(firstSection);
      return {
        display: styles.display,
        height: styles.height,
        overflow: styles.overflow,
        visibility: styles.visibility,
        opacity: styles.opacity
      };
    });
    
    // Check if navigation elements exist
    const navElements = await page.evaluate(() => {
      const nav = document.querySelector('.demo-nav');
      const dots = document.querySelector('.demo-nav-dots');
      
      return {
        navExists: !!nav,
        dotsExist: !!dots,
        navHTML: nav ? nav.outerHTML.substring(0, 200) : 'NO NAV',
        dotsHTML: dots ? dots.outerHTML.substring(0, 200) : 'NO DOTS'
      };
    });
    
    console.log('=== RUNTIME DEBUG REPORT ===');
    console.log('\n1. PAGE ERRORS:');
    console.log(errors.length ? errors : 'No JavaScript errors');
    
    console.log('\n2. CONSOLE LOGS:');
    console.log(consoleLogs.length ? consoleLogs.slice(-10) : 'No console output');
    
    console.log('\n3. ROOT ELEMENT:');
    console.log(JSON.stringify(rootContent, null, 2));
    
    console.log('\n4. STORY SCROLLER ELEMENTS:');
    console.log(JSON.stringify(storyScrollerElements, null, 2));
    
    console.log('\n5. FIRST SECTION STYLES:');
    console.log(JSON.stringify(firstSectionStyles, null, 2));
    
    console.log('\n6. NAVIGATION ELEMENTS:');
    console.log(JSON.stringify(navElements, null, 2));
    
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugRuntime().catch(console.error);