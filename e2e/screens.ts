import { readFileSync } from 'node:fs'
import { expect, type Page } from '@playwright/test'

const state = JSON.parse(readFileSync('e2e/.state.json', 'utf8')) as { personId: string; unsubscribeToken: string }

type Screen = { name: string; path: string; prepare?: (page: Page) => Promise<void> }

/** Every agent-facing screen, and the homeowner's unsubscribe page. /admin is desktop only by design. */
export const SCREENS: Screen[] = [
  { name: 'dashboard', path: '/app' },
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
  { name: 'person-detail', path: `/app/people/${state.personId}` },
  { name: 'review-queue', path: '/app/people/review' },
  { name: 'import', path: '/app/people/import' },
  { name: 'settings', path: '/app/settings' },
  { name: 'billing', path: '/app/settings/billing' },
  { name: 'billing-cancel', path: '/app/settings/billing/cancel' },
  { name: 'addons', path: '/app/addons' },
  {
    name: 'addons-lender-form',
    path: '/app/addons',
    prepare: async (page) => {
      await page.getByRole('switch', { name: 'Add my lender' }).click()
      await expect(page.getByLabel(/NMLS number/)).toBeVisible()
    },
  },
  { name: 'unsubscribe', path: `/u/${state.unsubscribeToken}` },
]
