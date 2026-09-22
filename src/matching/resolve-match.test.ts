import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('import, edit, and review persist share resolveAddressMatch', () => {
  const resolve = readFileSync(new URL('./resolve-match.ts', import.meta.url), 'utf8')
  expect(resolve).toContain('findCandidateParcels')
  expect(resolve).toContain('matchAddress')
  expect(resolve).toContain('excludeParcelId')
  expect(resolve).toContain('noParcelKind')

  const importer = readFileSync(new URL('../import/import-contacts.ts', import.meta.url), 'utf8')
  expect(importer).toContain("from '@/matching/resolve-match'")
  expect(importer).toContain('resolveAddressMatch')
  expect(importer).toContain('candidateInsertRows')
  expect(importer).not.toMatch(/findCandidateParcels\(/)

  const writer = readFileSync(new URL('../db/contact-write.ts', import.meta.url), 'utf8')
  expect(writer).toContain("from '@/matching/resolve-match'")
  expect(writer).toContain('resolveAddressMatch')
  expect(writer).toContain('persistContactCandidates')
  expect(writer).toContain("'replace'")
  expect(writer).toContain('reviewState')

  const review = readFileSync(new URL('../db/review-write.ts', import.meta.url), 'utf8')
  expect(review).toContain("from '@/matching/resolve-match'")
  expect(review).toContain('resolveAddressMatch')
  expect(review).toContain('persistContactCandidates')
  expect(review).not.toMatch(/findCandidateParcels\(/)
  expect(review).not.toMatch(/matchAddress\(/)

  const persist = readFileSync(
    new URL('../db/persist-contact-candidates.ts', import.meta.url),
    'utf8',
  )
  expect(persist).toContain('candidateInsertRows')
  expect(persist).toContain('contactMatchCandidates')
})
