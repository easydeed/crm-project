import { expect, test } from 'vitest'
import { TAP_DEBT } from '../../../../e2e/tap-allowlist'
import { attribute, byTag, byText, classNames, classTokens, classVariants, descendants, only, parseJsx, tagOf } from '@/test/jsx'

/** OR-045. People and the person page on panels, asked as properties. */
const PANEL = ['border', 'border-rule', 'rounded-xl']

test('the People list is one panel, with Search and the filters in its --surface strip', () => {
  const jsx = parseJsx('app/app/people/people-board.tsx')
  const panel = only(byTag(jsx, 'section').filter((element) => attribute(jsx, element, 'aria-label')), 'list panel')
  expect(classTokens(jsx, panel)).toEqual(expect.arrayContaining(PANEL))
  const strip = descendants(panel).find((element) => classTokens(jsx, element).includes('bg-surface'))!
  expect(strip).toBeDefined()
  const inStrip = descendants(strip).map((element) => tagOf(jsx, element))
  expect(inStrip).toEqual(expect.arrayContaining(['label', 'input', 'PeopleFilters']))
})

test('every filter chip takes exactly one fill: --blue-soft when current, the page otherwise, never blue words', () => {
  const jsx = parseJsx('app/app/people/people-filters.tsx')
  const chips = byTag(jsx, 'Link')
  expect(chips).toHaveLength(5)
  for (const chip of chips) {
    for (const variant of classVariants(jsx, chip)) {
      expect(variant.filter((token) => token.startsWith('bg-'))).toHaveLength(1)
      expect(variant).not.toContain('text-blue')
      expect(variant).toContain('min-h-11')
    }
  }
})

test('a row: the name is ink, and Edit is a blue link 44px both ways', () => {
  const jsx = parseJsx('app/app/people/people-list.tsx')
  const [name, edit] = byTag(jsx, 'Link')
  const nameTokens = classTokens(jsx, name!)
  expect(nameTokens).toContain('text-foreground')
  expect(nameTokens.some((token) => token.startsWith('text-blue'))).toBe(false)
  expect(nameTokens).toContain('tap')
  const editTokens = classTokens(jsx, edit!)
  expect(editTokens).toEqual(expect.arrayContaining(['tap', 'text-blue', 'min-w-11']))
  // Not stretched across its grid cell (it measured 163px wide before it was pinned).
  expect(editTokens).toContain('justify-self-start')
})

test('the bulk bar is navy, its controls are the bar pill, and every group control stays', () => {
  const jsx = parseJsx('app/app/people/people-bulk-bar.tsx')
  const bar = byTag(jsx, 'div').find((element) => classTokens(jsx, element).includes('bottom-0'))!
  expect(classTokens(jsx, bar)).toEqual(expect.arrayContaining(['bg-bar', 'text-on-bar']))
  const controls = [...byTag(jsx, 'button'), ...byTag(jsx, 'select')]
  expect(controls.length).toBeGreaterThan(0)
  for (const control of controls) {
    expect(classNames(jsx, control).some((name) => /^bar\w*Class$/.test(name))).toBe(true)
  }
  // "Add to group" and "Remove from group" each keep a submit button at every width.
  for (const label of ['Add to group', 'Remove from group']) {
    const button = only(byText(jsx, label).filter((element) => tagOf(jsx, element) === 'button'), `${label} button`)
    expect(attribute(jsx, button, 'type')?.initializer?.getText(jsx.source)).toBe('"submit"')
    expect(classTokens(jsx, button).some((token) => /(^|:)hidden$/.test(token))).toBe(false)
  }
})

test('the person page: details in the shared table, the record in a panel, Manage groups kept', () => {
  const detail = parseJsx('app/app/people/[id]/person-detail.tsx')
  expect(byTag(detail, 'dt')).toHaveLength(0)
  expect(byTag(detail, 'DetailsRow').length).toBeGreaterThanOrEqual(8)
  const record = only(byTag(detail, 'section').filter((element) => attribute(detail, element, 'aria-labelledby')), 'record panel')
  expect(classTokens(detail, record)).toEqual(expect.arrayContaining(PANEL))
  const group = parseJsx('app/app/people/[id]/add-to-group.tsx')
  const manage = only(byText(group, 'Manage groups'), 'Manage groups')
  expect(attribute(group, manage, 'href')?.initializer?.getText(group.source)).toBe('"/app/people"')
  const page = parseJsx('app/app/people/[id]/page.tsx')
  expect(attribute(page, only(byTag(page, 'DigestPreviewPanel'), 'preview'), 'framed')).toBeDefined()
})

test('OR-045 owes no tap debt', () => {
  expect(TAP_DEBT.filter((entry) => entry.owner === 'OR-045')).toEqual([])
})
