import { expect, type Page } from '@playwright/test'
import { NOTICES } from '../../src/app/app/settings/billing/billing-copy'
import { settleFrame } from './prepare'
import type { Screen } from './types'

/** Every billing notice, by the query string that brings it up. Each is one line under the heading. */
const NOTICE_SCREENS: Screen[] = Object.entries(NOTICES).map(([query, words]) => ({
  name: `billing-notice-${query.replace('=', '-')}`,
  path: `/app/settings/billing?${query}`,
  prepare: async (page: Page) => {
    await expect(page.getByRole('status')).toHaveText(words)
  },
}))

/** Billing, add-ons and settings in the states only another agent's data can show (OR-044a). */
export const ACCOUNT_SCREENS: Screen[] = [
  {
    name: 'billing-set-to-end',
    path: '/app/settings/billing',
    as: 'setToEnd',
    prepare: async (page) => {
      await expect(page.getByText('Active until the end of this period')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Keep my plan' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'View invoice' })).toBeVisible()
    },
  },
  {
    name: 'billing-past-due',
    path: '/app/settings/billing',
    as: 'pastDue',
    prepare: async (page) => {
      await expect(page.getByText('Payment failed')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Pay this invoice' })).toBeVisible()
    },
  },
  {
    name: 'billing-ended',
    path: '/app/settings/billing',
    as: 'ended',
    prepare: async (page) => {
      await expect(page.getByText('Ended', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Restart your plan' })).toBeVisible()
    },
  },
  {
    name: 'billing-no-plan',
    path: '/app/settings/billing',
    as: 'noPlan',
    prepare: async (page) => {
      await expect(page.getByRole('heading', { name: "You don't have a plan yet." })).toBeVisible()
    },
  },
  {
    // Decision E: Stripe has no record of the plan. Said in the page, with nothing to buy.
    name: 'billing-missing',
    path: '/app/settings/billing',
    as: 'missing',
    prepare: async (page) => {
      await expect(page.getByRole('heading', { name: "We can't find your plan." })).toBeVisible()
      await expect(page.getByRole('link', { name: 'help@onrecord.com' })).toBeVisible()
      await expect(page.locator('main').getByRole('button')).toHaveCount(0)
    },
  },
  {
    // The error screen, on purpose: the stand-in fails this agent's lookup like an outage.
    name: 'billing-unreachable',
    path: '/app/settings/billing',
    as: 'unreachable',
    prepare: async (page) => {
      await expect(page.getByRole('heading', { name: "We couldn't reach Stripe for your billing." })).toBeVisible()
    },
  },
  ...NOTICE_SCREENS,
  {
    // The switch refuses until the phone is verified. The refusal writes nothing.
    name: 'addons-call-list-refused',
    path: '/app/addons',
    prepare: async (page) => {
      await page.getByRole('switch', { name: 'Text me the call list' }).click()
      await expect(page.getByText('Verify your phone in Settings first.')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Go to Settings' })).toBeVisible()
    },
  },
  {
    name: 'addons-extras-on',
    path: '/app/addons',
    as: 'extrasOn',
    prepare: async (page) => {
      await expect(page.getByText('Pat Rivera · NMLS 1234567')).toBeVisible()
      await expect(page.getByRole('switch', { name: 'Text me the call list' })).toHaveAttribute('aria-checked', 'true')
      await expect(page.getByRole('switch', { name: 'Add my lender' })).toHaveAttribute('aria-checked', 'true')
    },
  },
  {
    // No phone, and no people: the sample preview with its label.
    name: 'settings-empty',
    path: '/app/settings',
    as: 'empty',
    prepare: async (page) => {
      await expect(page.getByText('Add your phone above to verify it for texts.')).toBeVisible()
      await expect(page.getByText('Sample — add your people to see theirs.')).toBeVisible()
      await settleFrame(page)
    },
  },
  {
    name: 'settings-verified',
    path: '/app/settings',
    as: 'extrasOn',
    prepare: async (page) => {
      await expect(page.getByText('909-555-0193 is verified for texts.')).toBeVisible()
      await settleFrame(page)
    },
  },
  {
    name: 'settings-paused',
    path: '/app/settings',
    as: 'paused',
    prepare: async (page) => {
      await expect(page.getByRole('checkbox', { name: 'Pause my monthly note' })).toBeChecked()
      await expect(page.getByText('Nothing sends while this is on. Turn it back on any time.')).toBeVisible()
      await settleFrame(page)
    },
  },
  {
    name: 'settings-system-paused',
    path: '/app/settings',
    as: 'systemPaused',
    prepare: async (page) => {
      await expect(page.getByRole('checkbox', { name: 'Pause my monthly note' })).toBeDisabled()
      await expect(page.getByText('We paused your monthly note. Contact us to turn it back on.')).toBeVisible()
      await settleFrame(page)
    },
  },
]
