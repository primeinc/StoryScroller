import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  // Only run .spec.ts files for E2E tests
  testMatch: '**/*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5184',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Essential tests - run on every commit
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-smooth-scrolling']
        }
      },
      testMatch: [
        '**/basic-integration.spec.ts',
        '**/quick-demo-check.spec.ts',
        '**/control-hub-e2e.spec.ts'
      ]
    },

    // Comprehensive tests - run on main branch only
    {
      name: 'chromium-comprehensive',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-smooth-scrolling']
        }
      },
      testMatch: [
        '**/comprehensive-e2e.spec.ts',
        '**/final-comprehensive-test.spec.ts',
        '**/integration-user-journeys.spec.ts',
        '**/narrative-flow.spec.ts'
      ]
    },

    // Debug tests - run manually or on special branches
    {
      name: 'chromium-debug',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-smooth-scrolling']
        }
      },
      testMatch: [
        '**/debug-*.spec.ts',
        '**/lenis-debug.spec.ts',
        '**/scroll-direction-debug.spec.ts',
        '**/simple-navigation-debug.spec.ts',
        '**/inspect-page.spec.ts'
      ]
    },

    // Performance tests - run weekly or on releases
    {
      name: 'chromium-performance',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-smooth-scrolling']
        }
      },
      testMatch: [
        '**/performance-baseline.spec.ts',
        '**/cross-browser-compatibility.spec.ts'
      ]
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI ? 'pnpm preview' : 'pnpm dev',
    url: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5184',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})