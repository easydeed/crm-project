import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('admin preview reuses the role gate and 404s agents', () => {
  const layout = src('../layout.tsx')
  expect(layout).toContain("session.role !== 'admin'")
  expect(layout).toContain('notFound()')
})

test('admin preview is read-only and covers contact and account views', () => {
  const page = src('./page.tsx')
  expect(page).toContain('readRequestSession')
  expect(page).toContain('buildDigestInput')
  expect(page).toContain('listAccountDigestPreviews')
  expect(page).toContain('DigestPreviewPanel')
  expect(page).toContain('Read only')
  expect(page).toContain('Open accounts')
  expect(page).not.toMatch(/assertWritable/)
  expect(page).not.toMatch(/\.insert\(|\.update\(|\.delete\(/)
})

test('account table lists name, send, blocks, and skip reason', () => {
  const table = src('./account-table.tsx')
  expect(table).toContain('row.name')
  expect(table).toContain("row.send ? 'Send' : 'Skip'")
  expect(table).toContain('row.blocks')
  expect(table).toContain('row.reason')
  expect(table).toContain('/admin/preview?contact=')
})

test('admin preview has four states', () => {
  expect(src('./loading.tsx')).toContain('Loading preview')
  expect(src('./error.tsx')).toContain('couldn&apos;t load this preview')
  expect(src('./page.tsx')).toContain('Choose an account')
})
