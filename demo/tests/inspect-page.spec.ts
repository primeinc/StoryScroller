import { test } from '@playwright/test';

test('Inspect page structure', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: 'page-structure.png', fullPage: true });
  
  // Log all sections
  const sections = await page.locator('section').all();
  console.log(`Found ${sections.length} section elements`);
  
  // Log elements with specific data attributes
  const dataTestId = await page.locator('[data-testid]').all();
  console.log(`Found ${dataTestId.length} elements with data-testid`);
  
  const dataSectionId = await page.locator('[data-section-id]').all();
  console.log(`Found ${dataSectionId.length} elements with data-section-id`);
  
  // Log the HTML of the body (first 2000 chars)
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('Body HTML preview:', bodyHTML.substring(0, 2000));
  
  // Log all visible text
  const visibleText = await page.locator('body').innerText();
  console.log('Visible text:', visibleText.substring(0, 1000));
});