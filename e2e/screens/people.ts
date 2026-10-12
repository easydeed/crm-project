import { expect } from '@playwright/test'
import { showNote, state } from './prepare'
import type { Screen } from './types'

/** People, the person page and review: the states the seed's one agent could not show (OR-044a). */
export const PEOPLE_SCREENS: Screen[] = [
  {
    name: 'people-empty',
    path: '/app/people',
    as: 'empty',
    prepare: async (page) => {
      await expect(page.getByText('No people yet. Add a list to get started.')).toBeVisible()
    },
  },
  {
    name: 'people-no-results',
    path: '/app/people',
    prepare: async (page) => {
      await page.getByLabel('Search').fill('zzzz')
      await expect(page.getByText('No people match that search.')).toBeVisible()
    },
  },
  {
    name: 'people-filtered',
    path: '/app/people?status=no_parcel',
    prepare: async (page) => {
      await expect(page.locator('a[aria-current="page"]', { hasText: "Couldn't find" })).toBeVisible()
    },
  },
  {
    // Groups exist: group chips, the populated Groups panel, the Email chips, and an Unsubscribed tag.
    name: 'people-groups',
    path: '/app/people',
    as: 'groups',
    prepare: async (page) => {
      await expect(page.getByRole('link', { name: /^Past clients \(3\)/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /^Missing an email \(1\)/ })).toBeVisible()
      await expect(page.getByText('Unsubscribed', { exact: true })).toHaveCount(1)
      await expect(page.getByText('Make a group first')).toHaveCount(0)
    },
  },
  {
    // The bulk bar with groups to add to: two selected, both group actions live.
    name: 'people-groups-bulk',
    path: '/app/people',
    as: 'groups',
    prepare: async (page) => {
      const boxes = page.getByRole('checkbox', { name: /^Select (?!all)/ })
      await boxes.nth(0).check()
      await boxes.nth(1).check()
      await expect(page.getByText('2 people selected')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Add to group' })).toBeEnabled()
    },
  },
  {
    name: 'people-view-as',
    path: '/app/people',
    as: 'admin',
    prepare: async (page) => {
      await page.getByRole('checkbox', { name: /^Select (?!all)/ }).first().check()
      await expect(page.getByText('Viewing as another agent is read only.').first()).toBeVisible()
    },
  },
  {
    name: 'person-needs-review',
    path: `/app/people/${state.needsReviewId}`,
    prepare: async (page) => {
      await expect(page.getByRole('link', { name: 'Review this match' })).toBeVisible()
    },
  },
  {
    name: 'person-no-parcel',
    path: `/app/people/${state.noParcelId}`,
    prepare: async (page) => {
      await expect(page.getByRole('link', { name: 'Fix the address' })).toBeVisible()
    },
  },
  {
    // person-detail captures the plain text; this is the email itself, the default mode.
    name: 'person-preview-html',
    path: `/app/people/${state.personId}`,
    prepare: (page) => showNote(page, { measure: false }),
  },
  {
    name: 'person-edit',
    path: `/app/people/${state.personId}/edit`,
    prepare: async (page) => {
      await expect(page.getByRole('heading', { name: /^Edit / })).toBeVisible()
    },
  },
  {
    name: 'person-groups',
    path: `/app/people/${state.groupsPersonId}`,
    as: 'groups',
    prepare: async (page) => {
      await expect(page.getByText('Past clients').first()).toBeVisible()
    },
  },
  {
    name: 'review-couldnt-find',
    path: `/app/people/review?contact=${state.noParcelId}`,
    prepare: async (page) => {
      await expect(page.getByText("We couldn't find this address.")).toBeVisible()
    },
  },
]
