import { readFileSync } from 'node:fs'
import { expect, type BrowserContext, type Page } from '@playwright/test'
import { findClosings, MLS, showNote, showNoteText, state } from './screens/prepare'
import type { Screen } from './screens/types'
import { ACCOUNT_SCREENS } from './screens/account'
import { AUTH_SCREENS } from './screens/auth'
import { DASHBOARD_SCREENS } from './screens/dashboard'
import { PEOPLE_SCREENS } from './screens/people'

export type { Screen }

/** Visit a screen as its viewer sees it: a logged-out screen gets no session cookie, a dark one dark mode. */
export async function openScreen(page: Page, screen: Screen) {
  if (screen.loggedOut || screen.as) await page.context().clearCookies()
  if (screen.as) {
    const signedIn = JSON.parse(readFileSync(`test-results/auth-${screen.as}.json`, 'utf8')) as { cookies: Parameters<BrowserContext['addCookies']>[0] }
    await page.context().addCookies(signedIn.cookies)
  }
  if (screen.colorScheme) await page.emulateMedia({ colorScheme: screen.colorScheme })
  return page.goto(screen.path)
}

/**
 * Every agent-facing screen, signed out and in, the marketing pages, and the homeowner's unsubscribe
 * page. /admin is desktop only by design. The first list is the 27 captured before OR-044a; the
 * states nobody had looked at follow, by area.
 */
const CAPTURED: Screen[] = [
  // What a prospect sees (OR-038).
  { name: 'home', path: '/', loggedOut: true },
  { name: 'sample', path: '/sample', loggedOut: true },
  {
    // The plain-text preview drew #ededed on white in dark mode until OR-037. This keeps it in a capture.
    name: 'sample-text-dark',
    path: '/sample',
    loggedOut: true,
    colorScheme: 'dark',
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Plain text' }).click()
      await expect(page.getByRole('button', { name: 'Plain text' })).toHaveAttribute('aria-pressed', 'true')
      const text = page.locator('pre')
      await expect(text).toContainText('Hi Marilyn,')
      await expect(text).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')
    },
  },
  { name: 'login', path: '/login', loggedOut: true },
  { name: 'register', path: '/register', loggedOut: true },
  { name: 'dashboard', path: '/app' },
  // Dark mode was captured on one screen until OR-042; the bill bar's inversion went unseen for
  // three packets. The dashboard is where the bar tokens, the call tags and the send card meet.
  { name: 'dashboard-dark', path: '/app', colorScheme: 'dark' },
  // "Been a while" is muted ink on --surface, 4.56:1, the tightest pair in the system. The seeded
  // agent's list now shows the three live kinds, so the quiet agent keeps this one captured.
  { name: 'dashboard-quiet', path: '/app', as: 'quiet' },
  { name: 'dashboard-quiet-dark', path: '/app', as: 'quiet', colorScheme: 'dark' },
  {
    name: 'dashboard-call-open',
    path: '/app',
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Call', exact: true }).first().click()
    },
  },
  { name: 'people', path: '/app/people' },
  {
    name: 'people-bulk-bar',
    path: '/app/people',
    prepare: async (page) => {
      await page.getByRole('checkbox', { name: /^Select (?!all)/ }).first().check()
      await expect(page.getByRole('button', { name: /delete/i }).first()).toBeVisible()
    },
  },
  { name: 'person-detail', path: `/app/people/${state.personId}`, prepare: showNoteText },
  { name: 'review-queue', path: '/app/people/review' },
  { name: 'import', path: '/app/people/import' },
  { name: 'settings', path: '/app/settings', prepare: showNote },
  { name: 'billing', path: '/app/settings/billing' },
  { name: 'billing-cancel', path: '/app/settings/billing/cancel' },
  { name: 'addons', path: '/app/addons' },
  { name: 'addons-dark', path: '/app/addons', colorScheme: 'dark' },
  {
    name: 'addons-lender-form',
    path: '/app/addons',
    prepare: async (page) => {
      await page.getByRole('switch', { name: 'Add my lender' }).click()
      await expect(page.getByLabel(/NMLS number/)).toBeVisible()
    },
  },
  { name: 'unsubscribe', path: `/u/${state.unsubscribeToken}` },
  // Signup step 2, against the fixture corpus. Nothing is imported, so the screens above stay as they were.
  { name: 'start', path: '/app/start' },
  {
    name: 'start-found',
    path: '/app/start',
    prepare: async (page) => {
      await findClosings(page, MLS.many)
      await expect(page.getByText("We found 47 homes you've sold.", { exact: false })).toBeVisible()
      await expect(page.getByText('47 of 47 ticked')).toBeVisible()
      await expect(page.getByRole('checkbox')).toHaveCount(47)
      await expect(page.locator('[data-mls-attribution]')).toHaveCount(47)
      // Unticking updates the count and the button, and leaves that box out of the form.
      const first = page.getByRole('checkbox').first()
      await first.uncheck()
      await expect(first).not.toBeChecked()
      await expect(page.getByText('46 of 47 ticked')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Use these 46' })).toBeEnabled()
    },
  },
  {
    name: 'start-few',
    path: '/app/start',
    prepare: async (page) => {
      await findClosings(page, MLS.thin)
      await expect(page.getByText('3 of 3 ticked')).toBeVisible()
      await expect(page.getByText("That's fewer than we'd expect.", { exact: false })).toBeVisible()
    },
  },
  {
    name: 'start-nothing',
    path: '/app/start',
    prepare: async (page) => {
      await findClosings(page, MLS.none)
      const line = page.getByText("We couldn't find closings under that ID.", { exact: false })
      await expect(line).toBeVisible()
      await expect(line).toHaveAttribute('role', 'status')
      // The field still shows the id that was searched, not the one saved before.
      await expect(page.getByLabel('Your MLS agent ID')).toHaveValue(MLS.none)
      await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
      await expect(page.getByRole('heading', { name: 'Upload a list' })).toBeVisible()
    },
  },
  {
    name: 'start-malformed',
    path: '/app/start',
    prepare: async (page) => {
      await findClosings(page, 'dana whitfield')
      await expect(page.locator('main').getByRole('alert')).toContainText("doesn't look like an MLS agent ID")
      await expect(page.getByLabel('Your MLS agent ID')).toHaveAttribute('aria-invalid', 'true')
      await expect(page.getByText('Where do I find my agent ID?')).toBeVisible()
      await expect(page.getByText("We couldn't find closings", { exact: false })).toHaveCount(0)
    },
  },
]

export const SCREENS: Screen[] = [...CAPTURED, ...DASHBOARD_SCREENS, ...PEOPLE_SCREENS, ...ACCOUNT_SCREENS, ...AUTH_SCREENS]
