import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'https://techdome.io',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.RECORD_VIDEO ? 'off' : 'off',
    headless: process.env.CI ? true : false,
  },

  projects: [
    {
      name: 'chromium',
      testIgnore: '**/load/**',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: '**/load/**',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: '**/load/**',
      use: { ...devices['Desktop Safari'] },
    },
    // // Load tests run on chromium only — workers capped at 5 via npm script
    {
      name: 'load',
      testMatch: '**/load/**',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
