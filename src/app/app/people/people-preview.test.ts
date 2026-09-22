import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('person page previews their email without a write guard', () => {
  const page = src('./[id]/page.tsx')
  expect(page).toContain('buildDigestInput(db, accountId, person.id')
  expect(page).toContain('effectiveAccountId')
  expect(page).toContain('Preview their email')
  expect(page).toContain('DigestPreviewPanel')
  expect(page).toContain('UNMATCHED_REASON')
  expect(page).not.toContain('assertWritable')
})
