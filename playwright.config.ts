import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for BankOfMVP Automation Testing
 * Comprehensive setup with video recording, screenshots, error logging, and self-healing
 */
export default defineConfig({
  testDir: './e2e-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry for self-healing
  workers: process.env.CI ? 1 : 4, // Parallel workers
  reporter: [
    ['html', { outputFolder: 'e2e-results/html-report', open: 'never' }],
    ['json', { outputFile: 'e2e-results/test-results.json' }],
    ['junit', { outputFile: 'e2e-results/junit-results.xml' }],
    ['list']
  ],
  
  // Global setup and teardown
  globalSetup: './e2e-tests/global-setup.ts',
  globalTeardown: './e2e-tests/global-teardown.ts',

  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',
    
    // Browser context options
    trace: 'retain-on-failure', // Keep traces for failed tests
    screenshot: 'only-on-failure', // Screenshots on failure
    video: 'retain-on-failure', // Video recording on failure
    
    // Error logging
    ignoreHTTPSErrors: true,
    
    // Action timeout
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
    
    // Collect browser console logs
    contextOptions: {
      permissions: ['geolocation'],
      ignoreHTTPSErrors: true,
    },
  },

  // Projects for different browsers and devices
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
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Development server
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});