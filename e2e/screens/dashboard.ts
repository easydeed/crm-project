import { expect } from '@playwright/test'
import { holdRequests, isNavigation } from './prepare'
import type { Screen } from './types'

/**
 * Dashboard states no capture had shown (OR-044a). Each needs its own agent, built in e2e setup,
 * because each is a row in the database; the prepare checks the state's own words.
 */
export const DASHBOARD_SCREENS: Screen[] = [
  {
    name: 'dashboard-paused',
    path: '/app',
    as: 'paused',
    prepare: async (page) => {
      await expect(page.getByRole('heading', { name: 'Your monthly note is paused.' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Unpause' })).toBeVisible()
    },
  },
  {
    name: 'dashboard-system-paused',
    path: '/app',
    as: 'systemPaused',
    prepare: async (page) => {
      await expect(page.getByRole('heading', { name: 'We paused your monthly note.' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Unpause' })).toHaveCount(0)
    },
  },
  {
    name: 'dashboard-past-due',
    path: '/app',
    as: 'pastDue',
    prepare: async (page) => {
      await expect(page.getByText('Your last payment did not go through.')).toBeVisible()
    },
  },
  {
    name: 'dashboard-no-plan',
    path: '/app',
    as: 'noPlan',
    prepare: async (page) => {
      await expect(page.getByText('Start your plan to send the monthly note.')).toBeVisible()
    },
  },
  {
    name: 'dashboard-empty',
    path: '/app',
    as: 'empty',
    prepare: async (page) => {
      await expect(page.getByRole('heading', { name: "Let's get your people in." })).toBeVisible()
    },
  },
  {
    // Decision B: an admin, signed in, who clicked View as. Every action is hidden; Exit is the way out.
    name: 'dashboard-view-as',
    path: '/app',
    as: 'admin',
    prepare: async (page) => {
      await expect(page.getByText('Viewing as Dana Whitfield — read only')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible()
      // Preview stays: it reads, it writes nothing. Skip would write, so it is gone.
      await expect(page.getByRole('link', { name: 'Preview it' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Skip this month' })).toHaveCount(0)
    },
  },
  {
    // Decision C: the /app loading boundary, held on screen by holding the navigation's fetch.
    name: 'loading-app',
    path: '/app/settings',
    prepare: async (page) => {
      await holdRequests(page, isNavigation)
      await page.getByRole('link', { name: 'onrecord' }).click()
      await expect(page.getByText('Loading…', { exact: true })).toBeVisible()
    },
  },
  {
    name: 'loading-people',
    path: '/app/settings',
    prepare: async (page) => {
      await holdRequests(page, isNavigation)
      await page.getByRole('link', { name: 'People', exact: true }).click()
      await expect(page.getByText('Loading your people…')).toBeVisible()
    },
  },
]
