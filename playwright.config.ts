import { defineConfig } from '@playwright/test'

const PORT = 3100
const baseURL = `http://localhost:${PORT}`

/**
 * Browser checks against a local scratch database (see scripts/e2e-setup.ts).
 * In CI the runner's preinstalled Google Chrome is used, so no browser is ever downloaded;
 * here, PW_CHROMIUM (or the preinstalled /opt/pw-browsers Chromium) is used.
 */
const browser = process.env.CI
  ? { channel: 'chrome' as const }
  : { launchOptions: { executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' } }

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [['list']],
  snapshotPathTemplate: 'e2e/__snapshots-local__/{arg}{ext}',
  use: { baseURL, ...browser },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'mobile',
      testMatch: /screens\.spec\.ts/,
      dependencies: ['setup'],
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, storageState: 'test-results/auth.json' },
    },
    {
      name: 'desktop',
      testMatch: /(screens|desktop-unchanged)\.spec\.ts/,
      dependencies: ['setup'],
      use: { viewport: { width: 1440, height: 900 }, storageState: 'test-results/auth.json' },
    },
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ONRECORD_E2E: '1', APP_ORIGIN: baseURL },
  },
})
