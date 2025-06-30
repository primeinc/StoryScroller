import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts', '**/functional/**/*.test.ts'],
  testIgnore: ['**/unit/**/*.test.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    // Non-interactive reporters by default
    ['list'], // Simple text output
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    // Only include HTML reporter when explicitly requested
    ...(process.env.PLAYWRIGHT_HTML_REPORT === 'true' ? [['html']] : [])
  ],
  outputDir: 'test-results',
  
  use: {
    baseURL: 'http://localhost:5184',
    headless: process.env.PLAYWRIGHT_HEADED !== 'true', // Headless by default
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'cd ../demo && pnpm dev',
    url: 'http://localhost:5184',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});