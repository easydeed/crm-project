import { expect, test } from '@playwright/test'
import { SCREENS } from './screens'

/**
 * Desktop must not change in a responsive pass. Pixel comparison across machines is a
 * flaky-test generator, so this runs only on demand (PW_DESKTOP_COMPARE=1), on one machine:
 * capture on the unchanged code with --update-snapshots, then compare after the changes.
 * Snapshots are local and not committed.
 */
test.skip(process.env.PW_DESKTOP_COMPARE !== '1', 'on-demand, same-machine comparison')

for (const screen of SCREENS) {
  test(`desktop unchanged: ${screen.name}`, async ({ page }) => {
    await page.goto(screen.path)
    await page.waitForLoadState('networkidle')
    await screen.prepare?.(page)
    await expect(page).toHaveScreenshot(`${screen.name}.png`, { fullPage: true, animations: 'disabled' })
  })
}
