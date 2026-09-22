import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { canonicalFacts, fullDigest } from '@/digest/canonical-facts'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('marketing, sample, and the fixture share one Oakdale story', () => {
  const facts = canonicalFacts()
  expect(facts.address).toBe('1142 Oakdale Ave')
  expect(facts.firstName).toBe('Marilyn')
  expect(facts.owner).toBe('Marilyn Okafor')
  expect(facts.streetMedian).toBe('about $1,040,000')
  expect(facts.taxedOn).toBe('$817,800')
  expect(facts.benefit).toBe('about $2,600')
  expect(facts.listingAddress).toBe('1187 Oakdale Ave')

  const result = fullDigest()
  expect(result.send).toBe(true)
  if (!result.send) return
  expect(result.text).toContain(facts.benefit)
  expect(result.text).toContain('Hi Marilyn,')

  expect(src('./page.tsx')).toContain('canonicalFacts')
  expect(src('./home-story.tsx')).toContain('facts.benefit')
  expect(src('./sample/page.tsx')).toContain('fullDigest')
})
