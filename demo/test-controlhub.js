import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('Starting ControlHub UX Audit...\n');

  // Navigate to demo
  await page.goto('http://localhost:5184');
  await page.waitForLoadState('networkidle');

  // Test 1: Minimal Mode
  console.log('1. TESTING MINIMAL MODE');
  
  // Check initial state
  const minimalHub = await page.locator('.control-hub--minimal');
  const isMinimalVisible = await minimalHub.isVisible();
  console.log('✓ Minimal mode visible:', isMinimalVisible);

  // Check progress ring
  const progressRing = await page.locator('.progress-ring');
  const progressVisible = await progressRing.isVisible();
  console.log('✓ Progress ring visible:', progressVisible);

  // Check section numbers
  const sectionNumber = await page.locator('.section-number').textContent();
  console.log('✓ Current section:', sectionNumber);

  // Test expand button
  const expandBtn = await page.locator('.hub-expand');
  const expandBtnVisible = await expandBtn.isVisible();
  console.log('✓ Expand button visible:', expandBtnVisible);
  
  // Test keyboard accessibility
  await expandBtn.focus();
  const isFocused = await expandBtn.evaluate(el => document.activeElement === el);
  console.log('✓ Expand button keyboard focusable:', isFocused);

  // Click to expand
  await expandBtn.click();
  await page.waitForTimeout(500);

  // Test 2: Standard Mode
  console.log('\n2. TESTING STANDARD MODE');
  
  const standardHub = await page.locator('.control-hub--standard');
  const isStandardVisible = await standardHub.isVisible();
  console.log('✓ Standard mode visible:', isStandardVisible);

  // Check navigation buttons
  const prevBtn = await page.locator('.nav-btn--prev');
  const nextBtn = await page.locator('.nav-btn--next');
  const prevDisabled = await prevBtn.isDisabled();
  console.log('✓ Previous button disabled (at start):', prevDisabled);

  // Test navigation
  await nextBtn.click();
  await page.waitForTimeout(1500);
  const newSection = await page.locator('.section-number').textContent();
  console.log('✓ Navigation working, new section:', newSection);

  // Test section dots
  const sectionDots = await page.locator('.section-dot').count();
  console.log('✓ Section dots count:', sectionDots);

  // Test FPS badge
  const fpsBadge = await page.locator('.badge--fps');
  const fpsText = await fpsBadge.textContent();
  console.log('✓ FPS badge shows:', fpsText);

  // Open advanced mode
  const advancedBtn = await page.locator('.hub-action[aria-label="Advanced controls"]');
  await advancedBtn.click();
  await page.waitForTimeout(500);

  // Test 3: Advanced Mode
  console.log('\n3. TESTING ADVANCED MODE');
  
  const advancedHub = await page.locator('.control-hub--advanced');
  const isAdvancedVisible = await advancedHub.isVisible();
  console.log('✓ Advanced mode visible:', isAdvancedVisible);

  // Test tabs
  const tabs = ['Navigation', 'Performance', 'Configuration'];
  for (const tabName of tabs) {
    const tabBtn = await page.locator(`.tab-btn:has-text("${tabName}")`);
    await tabBtn.click();
    await page.waitForTimeout(300);
    const isActive = await tabBtn.evaluate(el => el.classList.contains('active'));
    console.log(`✓ ${tabName} tab works:`, isActive);
  }

  // Test configuration controls
  const durationSlider = await page.locator('input[type="range"]').first();
  const originalValue = await durationSlider.inputValue();
  await durationSlider.fill('1.5');
  const newValue = await durationSlider.inputValue();
  console.log('✓ Slider interaction works:', originalValue !== newValue);

  // Test apply button
  const applyBtn = await page.locator('.apply-btn');
  const applyVisible = await applyBtn.isVisible();
  console.log('✓ Apply button visible:', applyVisible);

  // Test 4: Mobile Experience
  console.log('\n4. TESTING MOBILE EXPERIENCE');
  
  await context.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  
  const mobileLayout = await page.locator('.control-hub').boundingBox();
  console.log('✓ Mobile layout width:', mobileLayout?.width);
  
  // Test 5: Keyboard Navigation
  console.log('\n5. TESTING KEYBOARD NAVIGATION');
  
  // Close advanced mode
  const closeBtn = await page.locator('.hub-close');
  await closeBtn.click();
  await page.waitForTimeout(300);
  
  // Tab through controls
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.className);
  console.log('✓ Tab navigation reaches:', focusedElement);

  // Test 6: Visual Glitches
  console.log('\n6. CHECKING VISUAL ISSUES');
  
  // Take screenshots for visual inspection
  await page.screenshot({ path: 'controlhub-standard.png', fullPage: false });
  console.log('✓ Screenshot saved: controlhub-standard.png');

  // Test 7: Performance
  console.log('\n7. TESTING PERFORMANCE');
  
  // Rapid mode switching
  const startTime = Date.now();
  for (let i = 0; i < 5; i++) {
    await page.locator('.hub-action').first().click();
    await page.waitForTimeout(100);
  }
  const switchTime = Date.now() - startTime;
  console.log('✓ 5 mode switches took:', switchTime + 'ms');

  // Test 8: Error States
  console.log('\n8. TESTING ERROR HANDLING');
  
  // Try to navigate past boundaries
  await page.locator('.nav-btn--prev').click({ force: true });
  const stillWorking = await page.locator('.control-hub').isVisible();
  console.log('✓ Component survives boundary navigation:', stillWorking);

  await browser.close();
  console.log('\n✨ Audit complete!');
})();