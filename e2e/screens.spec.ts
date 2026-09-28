import { expect, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { expectCleanLayout, layoutProblems } from './checks'
import { SCREENS } from './screens'

for (const screen of SCREENS) {
  test(screen.name, async ({ page }, info) => {
    const response = await page.goto(screen.path)
    expect(response?.status(), screen.path).toBeLessThan(400)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/couldn.t load|could not load/i)).toHaveCount(0)
    await screen.prepare?.(page)
    await page.screenshot({ path: `e2e/screenshots/${info.project.name}/${screen.name}.png`, fullPage: true })
    const tapTargets = info.project.name === 'mobile'
    // Findings beside the screenshot, for the report and the CI artifact.
    writeFileSync(`e2e/screenshots/${info.project.name}/${screen.name}.json`, JSON.stringify(await layoutProblems(page, { tapTargets }), null, 2))
    await expectCleanLayout(page, { tapTargets })
  })
}
