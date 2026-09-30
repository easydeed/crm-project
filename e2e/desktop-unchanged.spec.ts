import { expect, test } from '@playwright/test'
import { SCREENS } from './screens'

/**
 * Desktop pixel comparison. Pixel comparison across machines is a flaky-test generator, so this
 * runs only on demand (PW_DESKTOP_COMPARE=1), on one machine: `pnpm e2e:baseline` on the
 * unchanged code, then `pnpm e2e:compare` after the changes. Snapshots are local, not committed.
 *
 * Exact on purpose (OR-030a). Playwright's default per-pixel threshold of 0.2 passed a muted-text
 * change from #3d3d3d to #63708a, because the shift on anti-aliased text sits under it. Captures
 * on one machine are byte-stable, so any differing pixel is a real change. The baseline script
 * rewrites every file (--update-snapshots=all); the default mode rewrites only failing screens,
 * which leaves baselines older than they look.
 */
test.skip(process.env.PW_DESKTOP_COMPARE !== '1', 'on-demand, same-machine comparison')

for (const screen of SCREENS) {
  test(`desktop unchanged: ${screen.name}`, async ({ page }) => {
    await page.goto(screen.path)
    await page.waitForLoadState('networkidle')
    await screen.prepare?.(page)
    await expect(page).toHaveScreenshot(`${screen.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      threshold: 0,
      maxDiffPixels: 0,
    })
  })
}
