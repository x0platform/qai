import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './features',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }],
    ['json', { outputFolder: 'reports/playwright-json', outputFile: 'results.json' }],
    ['junit', { outputFolder: 'reports/junit', outputFile: 'results.xml' }]
  ],
  use: {
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 0,
    navigationTimeout: 30000,
    baseURL: process.env.BASE_URL || 'http://localhost:3000'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run start:test-app',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
