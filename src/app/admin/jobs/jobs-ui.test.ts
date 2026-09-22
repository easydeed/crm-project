import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('admin jobs reuses the role gate and 404s agents', () => {
  const layout = src('../layout.tsx')
  expect(layout).toContain("session.role !== 'admin'")
  expect(layout).toContain('notFound()')
})

test('admin jobs page is read-only and lists recent jobs', () => {
  const page = src('./page.tsx')
  expect(page).toContain('listRecentJobsForAdmin()')
  expect(page).toContain('JobsTable')
  expect(page).toContain('No jobs yet')
  expect(page).not.toMatch(/\.update\(|\.insert\(|\.delete\(/)
  expect(page).not.toContain('payload')
})

test('jobs table shows kind, state, attempts, error, and timing', () => {
  const table = src('./jobs-table.tsx')
  expect(table).toContain('Kind')
  expect(table).toContain('State')
  expect(table).toContain('Attempts')
  expect(table).toContain('Error')
  expect(table).toContain('Run after')
  expect(table).toContain('Locked')
  expect(table).toContain('Completed')
  expect(table).not.toContain('row.payload')
})
