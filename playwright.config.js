import { defineConfig, devices } from '@playwright/test';

// Tests open dist/index.html over file:// (no web server), matching how viewers use the site.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Software-rendered WebGL is CPU-heavy; too many parallel workers starve each other.
  workers: process.env.CI ? 2 : 3,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure'
  },
  projects: [
    // The explainer is presented in Chrome and Edge (both Chromium), so only Chromium is tested.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
