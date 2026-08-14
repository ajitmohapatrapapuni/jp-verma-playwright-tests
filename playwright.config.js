// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // ── Timeouts ──────────────────────────────────────────────────────────────
  timeout:        35_000,   // per test
  expect:         { timeout: 8_000 },
  globalTimeout:  10 * 60 * 1000, // 10 min hard limit for the full run

  // ── Parallelism ───────────────────────────────────────────────────────────
  fullyParallel: false,  // tests share a staging DB — run serially
  workers:       1,
  retries:       process.env.CI ? 2 : 1,  // retry once locally, twice in CI

  // ── Reporters ─────────────────────────────────────────────────────────────
  reporter: [
    // 1. Beautiful HTML report — open with: npm run report
    ['html', { outputFolder: 'playwright-report', open: 'never' }],

    // 2. Console output during run
    ['list'],

    // 3. JSON for CI / integrations
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // ── Global browser settings ───────────────────────────────────────────────
  use: {
    baseURL: 'https://jp-verma-fee-collection.klaimify.workers.dev',

    // ── Failure evidence (most important!) ──────────────────────────────────
    screenshot: 'only-on-failure',          // saved to test-results/
    video:      'retain-on-failure',        // video of the failing test only
    trace:      'on-first-retry',           // Playwright trace viewer on retry

    // ── Browser behaviour ────────────────────────────────────────────────────
    headless:           true,
    actionTimeout:      10_000,  // per click/fill/etc.
    navigationTimeout:  20_000,
    viewport:           { width: 1366, height: 768 },

    // ── Extras ───────────────────────────────────────────────────────────────
    locale:   'en-IN',
    timezoneId: 'Asia/Kolkata',
  },

  // ── Output folder for screenshots / videos ────────────────────────────────
  outputDir: 'test-results',

  // ── Projects (browsers) ───────────────────────────────────────────────────
  projects: [
    // --- Setup: save admin login session once, reused by all tests ---
    {
      name: 'setup',
      testMatch: /global\.setup\.js/,
    },

    // --- Main projects depend on the setup ---
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'fixtures/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'fixtures/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'fixtures/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],
});
