import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('admin matching reuses the role gate and 404s agents', () => {
  const layout = src('../layout.tsx')
  expect(layout).toContain("session.role !== 'admin'")
  expect(layout).toContain('notFound()')
  const route = src('./export/route.ts')
  expect(route).toContain("session.role !== 'admin'")
  expect(route).toContain('notFound()')
})

test('matching page shows both rates, failures, filters, and export', () => {
  const page = src('./page.tsx')
  expect(page).toContain('listMatchingOverviewForAdmin(session.accountId)')
  expect(page).toContain('listMatchingFailuresForAdmin')
  expect(page).toContain('MatchingSummary')
  expect(page).toContain('AccountRatesTable')
  expect(page).toContain('FailureTable')
  expect(page).toContain('Export fixtures')
  expect(page).not.toMatch(/\.update\(|\.insert\(|\.delete\(/)
})

test('failure table has the five required columns', () => {
  const table = src('./failure-table.tsx')
  expect(table).toContain('Raw input')
  expect(table).toContain('Matcher returned')
  expect(table).toContain('Candidates + confidence')
  expect(table).toContain('How resolved')
  expect(table).toContain('Account')
  expect(table).not.toContain('row.name')
  expect(table).not.toContain('row.email')
})

test('admin matching has no contact write path', () => {
  const files = [
    './page.tsx',
    './export/route.ts',
    './filters.tsx',
    './rates.tsx',
    './failure-table.tsx',
  ]
  for (const file of files) {
    const text = src(file)
    expect(text, file).not.toMatch(/insert\(contacts\)|update\(contacts\)|delete\(contacts\)/)
    expect(text, file).not.toMatch(/assertWritable/)
  }
})
