import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Requires:
 *   1) the backend stack running  (cd Chat-server && docker compose up -d)
 *   2) browsers installed         (npm run test:e2e:install)
 *
 * The dev server is started automatically (reusing an already-running one).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5100',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
