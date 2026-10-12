import { readFileSync } from 'node:fs'
import { expect, test as setup, type Page } from '@playwright/test'

type Agent = { id: string; email: string }
const state = JSON.parse(readFileSync('e2e/.state.json', 'utf8')) as { email: string; password: string; agents: Record<string, Agent> }

async function logIn(page: Page, email: string, returnTo?: string) {
  await page.goto(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(state.password)
  await page.getByRole('button', { name: /log in|sign in/i }).click()
}

setup('log in as the seeded agent', async ({ page }) => {
  await logIn(page, state.email)
  await expect(page).toHaveURL(/\/app/)
  await page.context().storageState({ path: 'test-results/auth.json' })
})

// Every other agent the captures sign in as (OR-044a), each through the real form.
for (const [key, agent] of Object.entries(state.agents)) {
  if (key === 'dana' || key === 'admin') continue
  setup(`log in as the ${key} agent`, async ({ browser }) => {
    const page = await browser.newPage()
    await logIn(page, agent.email)
    await expect(page).toHaveURL(/\/app/)
    await page.context().storageState({ path: `test-results/auth-${key}.json` })
    await page.close()
  })
}

/**
 * View-as, the real way (Decision B): an admin signs in, opens the seeded agent's account and clicks
 * View as. That exercises the role gate, the audit row, the redirect and the banner. A minted
 * cookie would test the capture, not the feature.
 */
setup('view as the seeded agent, as an admin', async ({ browser }) => {
  const page = await browser.newPage()
  const dana = state.agents.dana
  await logIn(page, state.agents.admin.email, `/admin/accounts/${dana.id}`)
  await expect(page).toHaveURL(new RegExp(`/admin/accounts/${dana.id}`))
  await page.getByRole('button', { name: 'View as this agent' }).click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible()
  await page.context().storageState({ path: 'test-results/auth-admin.json' })
  await page.close()
})
