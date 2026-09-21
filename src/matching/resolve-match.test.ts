import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('import, edit, and review persist share resolveAddressMatch', () => {
  const resolve = readFileSync(new URL('./resolve-match.ts', import.meta.url), 'utf8')
  expect(resolve).toContain('findCandidateParcels')
  expect(resolve).toContain('matchAddress')

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

  const persist = readFileSync(
    new URL('../db/persist-contact-candidates.ts', import.meta.url),
    'utf8',
  )
  expect(persist).toContain('candidateInsertRows')
  expect(persist).toContain('contactMatchCandidates')
})
