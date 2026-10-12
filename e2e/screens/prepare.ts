import { readFileSync } from 'node:fs'
import { expect, type Page } from '@playwright/test'

export type State = {
  personId: string
  needsReviewId: string
  noParcelId: string
  groupsPersonId: string
  unsubscribeToken: string
  agents: Record<string, { id: string; email: string }>
}
export const state = JSON.parse(readFileSync('e2e/.state.json', 'utf8')) as State

/**
 * The one registered address a capture may type (Decision D). It is not a login: its account has no
 * usable password. No capture types a signed-in agent's email or the e2e password.
 */
export const TAKEN_EMAIL = 'taken@agents.example'

/** Agent ids in the OR-024 fixture corpus (src/providers/fixtures/closed-listings.ts). */
export const MLS = { many: 'CRMLS-P4700', thin: 'CRMLS-P0300', none: 'CRMLS-P0000' }

export async function findClosings(page: Page, agentId: string) {
  await page.getByLabel('Your MLS agent ID').fill(agentId)
  await page.getByRole('button', { name: 'Find my closings' }).click()
}

/**
 * Wait for the email preview's paint to settle (OR-045). A capture once caught the note laid out
 * about 60px wide, before the frame took its final width. Two identical frame shots in a row mean
 * the paint has settled.
 */
export async function settleFrame(page: Page) {
  const frame = page.locator('iframe[title="Email preview"]')
  await frame.scrollIntoViewIfNeeded()
  const outer = (await frame.boundingBox())!.width
  await expect
    .poll(async () => (await page.frameLocator('iframe[title="Email preview"]').locator('body').boundingBox())?.width ?? 0)
    .toBeGreaterThan(outer * 0.9)
  let last = await frame.screenshot()
  for (let tries = 0; tries < 20; tries++) {
    await page.waitForTimeout(100)
    const next = await frame.screenshot()
    if (next.equals(last)) return
    last = next
  }
  throw new Error('The email preview never stopped changing')
}

/**
 * The in-app email preview carrying a note (OR-043a). It had only ever shown a skipped note, and a
 * full-page capture leaves an iframe below the fold unpainted, so either fault looked like a blank
 * frame. Each step fails unless the note has its street sales.
 *
 * `measure`: where the column allows 600px, the Desktop/Phone toggle has to change something
 * (OR-046): 600 with Desktop and 380 with Phone. A squeezed preview would make the two identical.
 */
export async function showNote(page: Page, { measure = true } = {}) {
  const frame = page.locator('iframe[title="Email preview"]')
  await expect(page.frameLocator('iframe[title="Email preview"]').locator('body')).toContainText('What sold on your street')
  if (measure && (page.viewportSize()?.width ?? 0) >= 1024) {
    const width = async () => (await frame.boundingBox())?.width ?? 0
    await page.getByRole('button', { name: 'Phone', exact: true }).click()
    await expect.poll(width).toBe(380)
    await page.getByRole('button', { name: 'Desktop', exact: true }).click()
    await expect.poll(width).toBe(600)
  }
  await settleFrame(page)
}

/** person-detail captures the plain text, which shows the whole note, street sales included. */
export async function showNoteText(page: Page) {
  await page.getByRole('button', { name: 'Plain text' }).click()
  // Plain text has no block labels, so the street sales are found by their document numbers.
  const text = page.locator('pre')
  await expect(text).toContainText('document E2E-LIVE-B117')
  await expect(text).toContainText('document E2E-LIVE-B131')
}

/**
 * Hold a request so a transient state can be photographed (Decision C): the button stays
 * "Signing in…", or the loading boundary stays up, until the page closes. Held, not raced: the
 * request never reaches the server, so nothing is written. `when` picks the requests to hold.
 */
export async function holdRequests(page: Page, when: (headers: Record<string, string>, method: string) => boolean) {
  const held: Array<() => void> = []
  await page.route('**/*', async (route) => {
    const request = route.request()
    if (!when(request.headers(), request.method())) return route.fallback()
    await new Promise<void>((release) => held.push(release))
    await route.abort().catch(() => {})
  })
  return held
}

/** A server action: Next posts it with a next-action header. */
export const isServerAction = (headers: Record<string, string>, method: string) => method === 'POST' && 'next-action' in headers

/** A client navigation's RSC fetch, but not a prefetch: the prefetch is what puts the loading boundary on screen. */
export const isNavigation = (headers: Record<string, string>) => headers.rsc === '1' && !('next-router-prefetch' in headers)
