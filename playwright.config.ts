import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env (credentials, base URLs, etc.)
dotenv.config();

/**
 * Central Playwright configuration.
 * Two projects are defined so UI and API suites can run together or separately:
 *   - "ui"  -> browser-driven tests (uses baseURL for demoqa.com)
 *   - "api" -> HTTP tests against the Book Store REST API
 */
export default defineConfig({
  testDir: './tests',
  // Fail the build on CI if test.only is accidentally committed.
  forbidOnly: !!process.env.CI,
  // Retry flaky tests to reduce false negatives (DemoQA is a public demo site).
  retries: process.env.CI ? 2 : 1,
  // Limit workers on CI for stable, reproducible runs.
  workers: process.env.CI ? 1 : undefined,
  // Give each test enough time (DemoQA can be slow).
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    // Capture debugging artifacts only when something fails.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.UI_BASE_URL ?? 'https://demoqa.com',
        // DemoQA serves third-party ads that can slow tests; block them.
        headless: true,
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_BASE_URL ?? 'https://demoqa.com',
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    },
  ],
});
