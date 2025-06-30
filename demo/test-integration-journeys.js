#!/usr/bin/env node

/**
 * Test runner for StoryScroller Integration User Journeys
 * Validates complete user experiences through all components
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n🧪 Running StoryScroller Integration Tests - User Journeys\n'));

// Test configuration
const testFile = 'tests/integration-user-journeys.spec.ts';
const browsers = ['chromium', 'firefox', 'webkit'];

// Function to run tests
function runTests(browser, headed = false) {
  console.log(chalk.yellow(`\n📱 Testing on ${browser}...`));
  
  const command = `npx playwright test ${testFile} --project=${browser} ${headed ? '--headed' : ''} --reporter=list`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(chalk.green(`✅ ${browser} tests passed!`));
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ ${browser} tests failed!`));
    return false;
  }
}

// Function to run specific journey
function runJourney(journeyName, browser = 'chromium') {
  console.log(chalk.cyan(`\n🚀 Running ${journeyName} journey on ${browser}...`));
  
  const command = `npx playwright test ${testFile} -g "${journeyName}" --project=${browser} --reporter=list`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(chalk.green(`✅ ${journeyName} journey passed!`));
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ ${journeyName} journey failed!`));
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const headed = args.includes('--headed');
  const journeyOnly = args.find(arg => arg.startsWith('--journey='));
  const browserOnly = args.find(arg => arg.startsWith('--browser='));
  
  if (journeyOnly) {
    // Run specific journey
    const journey = journeyOnly.split('=')[1];
    const browser = browserOnly ? browserOnly.split('=')[1] : 'chromium';
    runJourney(journey, browser);
    return;
  }
  
  if (browserOnly) {
    // Run all tests on specific browser
    const browser = browserOnly.split('=')[1];
    runTests(browser, headed);
    return;
  }
  
  // Run all tests on all browsers
  let allPassed = true;
  
  for (const browser of browsers) {
    const passed = runTests(browser, headed);
    if (!passed) allPassed = false;
  }
  
  // Summary
  console.log(chalk.blue.bold('\n📊 Integration Test Summary:'));
  console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  
  if (allPassed) {
    console.log(chalk.green.bold('✅ All integration tests passed!'));
    console.log(chalk.green('\n🎉 StoryScroller components work together seamlessly!'));
    console.log(chalk.green('✅ No console errors detected'));
    console.log(chalk.green('✅ Performance remains stable'));
    console.log(chalk.green('✅ Memory usage within limits'));
    console.log(chalk.green('✅ All user journeys complete successfully'));
  } else {
    console.log(chalk.red.bold('❌ Some integration tests failed!'));
    console.log(chalk.yellow('\nPlease check the test output above for details.'));
  }
  
  // List available journeys
  console.log(chalk.blue.bold('\n📚 Available User Journeys:'));
  console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan('1. New User Experience') + ' - First-time user discovery flow');
  console.log(chalk.cyan('2. Power User Experience') + ' - Keyboard shortcuts and optimization');
  console.log(chalk.cyan('3. Mobile User Experience') + ' - Touch interactions and gestures');
  console.log(chalk.cyan('4. Accessibility User Experience') + ' - Screen reader and keyboard');
  console.log(chalk.cyan('5. Configuration Testing Experience') + ' - All settings and edge cases');
  console.log(chalk.cyan('6. Long Session Stability') + ' - Extended usage and memory');
  console.log(chalk.cyan('7. Cross-Component Integration') + ' - All components together');
  
  console.log(chalk.gray('\nRun specific journey: node test-integration-journeys.js --journey="Journey Name"'));
  console.log(chalk.gray('Run on specific browser: node test-integration-journeys.js --browser=firefox'));
  console.log(chalk.gray('Run with UI: node test-integration-journeys.js --headed\n'));
}

// Execute
main().catch(console.error);