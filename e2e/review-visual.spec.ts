import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { eq, sql } from 'drizzle-orm'
import { createDb } from '../src/db/client'
import { accounts, accountAddons, adminActions, jobs, sends } from '../src/db/schema'
import { isLocalDatabaseUrl } from '../src/config/database-url'
import { TEXT_CALL_LIST_KEY } from '../src/addons/text-call-list'
import { normalizeUsPhone } from '../src/config/phone'

if (!isLocalDatabaseUrl(process.env.DATABASE_URL)) throw new Error('Review captures require an explicit local scratch database')
const handle = createDb(process.env.DATABASE_URL!)
const state = JSON.parse(readFileSync('e2e/.state.json', 'utf8')) as { password: string; agents: Record<string, { id: string; email: string }> }
const output = process.env.OR056_CAPTURE_DIR
if (!output) throw new Error('Select a review capture output directory')
const createdSends: string[] = []

async function login(page: Page, agent: string, destination: string) {
  await page.context().clearCookies()
  await page.goto(`/login?returnTo=${encodeURIComponent(destination)}`)
  await page.getByLabel('Email', { exact: true }).fill(state.agents[agent].email)
  await page.getByLabel('Password', { exact: true }).fill(state.password)
  await page.getByRole('button', { name: /log in|sign in/i }).click()
  await expect(page).toHaveURL(new RegExp(destination.replace(/[?]/g, '\\?') + '$'))
}

async function capture(page: Page, name: string) {
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: path.join(output!, `${name}.png`), fullPage: true, animations: 'disabled' })
}

test.afterAll(async () => {
  for (const id of createdSends) {
    await handle.db.delete(jobs).where(sql`${jobs.payload}->>'sendId' = ${id}`)
    await handle.db.delete(adminActions).where(sql`${adminActions.detail}->>'sendId' = ${id}`)
    await handle.db.delete(sends).where(eq(sends.id, id))
  }
  await handle.client.end({ timeout: 2 })
})

test('review capture: admin recomposition states', async ({ page }) => {
  const [send] = await handle.db.insert(sends).values({ accountId: state.agents.dana.id, scheduledFor: new Date('2030-01-01T18:00:00Z'), state: 'ready' }).returning({ id: sends.id })
  createdSends.push(send.id)
  const destination = `/admin/sends/${send.id}`
  await login(page, 'admin', destination)
  await expect(page.getByRole('heading', { name: 'Dana Whitfield', exact: true })).toBeVisible()
  await expect(page.getByText(/2030 · ready ·/)).toBeVisible()
  await capture(page, 'admin-send-ready')
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST' && response.url().includes(destination)),
    page.getByRole('button', { name: 'Recompose changed people who were never sent' }).click(),
  ])
  if (process.env.OR056_BASELINE !== '1') {
    await expect(page).toHaveURL(/recompose=unavailable$/)
    await expect(page.getByRole('status')).toContainText('Nothing was recomposed')
  }
  // Main's old same-URL redirect does not refresh its receipt; read persisted state.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dana Whitfield', exact: true })).toBeVisible()
  await expect(page.getByText(process.env.OR056_BASELINE === '1' ? /2030 · scheduled ·/ : /2030 · ready ·/)).toBeVisible()
  await capture(page, 'admin-recompose-refusal')
  await handle.db.update(sends).set({ state: 'done' }).where(eq(sends.id, send.id))
  await page.goto(destination)
  await expect(page.getByRole('heading', { name: 'Dana Whitfield', exact: true })).toBeVisible()
  await expect(page.getByText(/2030 · done ·/)).toBeVisible()
  await capture(page, 'admin-send-done')
  // As with the existing billing notice captures, prepare a receipt-message state.
  await page.goto(`${destination}?recompose=done`)
  await expect(page.getByRole('heading', { name: 'Dana Whitfield', exact: true })).toBeVisible()
  if (process.env.OR056_BASELINE !== '1') await expect(page.getByRole('status')).toContainText('Recomposed the changed')
  await capture(page, 'admin-recompose-success-notice')
})

test('review capture: demo checkout', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto('/register')
  await page.getByLabel('Name', { exact: true }).fill('Visual Review Agent')
  await page.getByLabel('Email', { exact: true }).fill(`review-visual-${randomUUID()}@example.com`)
  await page.getByLabel('Password', { exact: true }).fill('review-visual-password')
  await page.getByLabel('Phone', { exact: true }).fill('9095550176')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Demo checkout', exact: true })).toBeVisible()
  await capture(page, 'demo-checkout')
})

test('review capture: Settings after failed phone-change billing switch-off', async ({ page }) => {
  const id = state.agents.unreachable.id
  await handle.db.update(accounts).set({ phone: '9095550176', phoneVerifiedAt: new Date('2030-01-01T18:00:00Z') }).where(eq(accounts.id, id))
  await handle.db.insert(accountAddons).values({ accountId: id, addonKey: TEXT_CALL_LIST_KEY, enabled: true, config: {} }).onConflictDoUpdate({ target: [accountAddons.accountId, accountAddons.addonKey], set: { enabled: true } })
  await login(page, 'unreachable', '/app/settings')
  const details = page.locator('section[aria-labelledby="details-heading"]')
  await details.getByLabel('Phone', { exact: true }).fill('9095550177')
  await details.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(details.getByText(/turned off Text me the call list|paid add-on could not be turned off/)).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(details.getByRole('button', { name: 'Save', exact: true })).toBeVisible()
  if (process.env.OR056_BASELINE !== '1') {
    await expect(details.getByRole('alert')).toContainText('paid add-on could not be turned off')
    await expect.poll(async () => normalizeUsPhone(await details.getByLabel('Phone', { exact: true }).inputValue())).toBe('9095550177')
  }
  await details.screenshot({ path: path.join(output!, 'settings-phone-change-billing-failure.png'), animations: 'disabled' })
  await page.goto('/app')
  if (process.env.OR056_BASELINE !== '1') await expect(page.getByRole('status')).toContainText('paid add-on switch-off is still pending')
  await capture(page, 'dashboard-text-billing-pending')
})
