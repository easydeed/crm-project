import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { CA_TAX } from '@/config/ca-tax'
import { ADDRESS_FIXTURES } from '@/matching/fixtures/addresses'
import { MATCH_PARCELS } from '@/matching/fixtures/parcels'
import { matchAddress } from '@/matching/match-address'

const MATCHING_DIR = path.join(process.cwd(), 'src', 'matching')
const REASON_FIELD =
  /\b(streetNumber|street_name|streetName|zipCode|zip_code|houseNumber|house_number|confidence)\b/i
const REASON_SCORE = /\b0\.\d+\b/

test('matcher modules do not import db, fetch, or Date', () => {
  const files = readdirSync(MATCHING_DIR).filter(
    (name) => name.endsWith('.ts') && !name.endsWith('.test.ts'),
  )
  expect(files.length).toBeGreaterThan(0)

  for (const name of files) {
    const src = readFileSync(path.join(MATCHING_DIR, name), 'utf8')
    expect(src, name).not.toMatch(/from ['"]@\/db/)
    expect(src, name).not.toMatch(/from ['"]drizzle/)
    expect(src, name).not.toMatch(/\bfetch\s*\(/)
    expect(src, name).not.toMatch(/Date\.now/)
  }
})

test('every fixture returns its expected status', () => {
  let matched = 0
  for (const fixture of ADDRESS_FIXTURES) {
    const result = matchAddress(fixture.raw, MATCH_PARCELS)
    expect(result.status, fixture.raw).toBe(fixture.expect)
    if (result.status === 'matched') matched += 1
  }
  console.log((matched / ADDRESS_FIXTURES.length).toFixed(4))
})

test('expectApn cases return that parcel first', () => {
  for (const fixture of ADDRESS_FIXTURES) {
    if (!fixture.expectApn) continue
    const result = matchAddress(fixture.raw, MATCH_PARCELS)
    expect(result.candidates[0]?.parcel.apn, fixture.raw).toBe(fixture.expectApn)
  }
})

test('PO Box and non-address return no_parcel with no candidates', () => {
  for (const fixture of ADDRESS_FIXTURES) {
    if (fixture.expect !== 'no_parcel') continue
    const result = matchAddress(fixture.raw, MATCH_PARCELS)
    expect(result.status, fixture.raw).toBe('no_parcel')
    expect(result.candidates, fixture.raw).toEqual([])
  }
})

test('a unit number never appears in the normalized street field', () => {
  for (const fixture of ADDRESS_FIXTURES) {
    const result = matchAddress(fixture.raw, MATCH_PARCELS)
    if (!result.normalized) continue
    expect(result.normalized.street, fixture.raw).not.toMatch(
      /\b(apt|apartment|unit|ste|suite|bldg|building|fl|floor)\b|#/i,
    )
    if (result.normalized.unit) {
      const tokens = result.normalized.street.toLowerCase().split(/\s+/)
      expect(tokens, fixture.raw).not.toContain(result.normalized.unit)
    }
  }
})

test('candidates are ordered by confidence and capped at 3', () => {
  for (const fixture of ADDRESS_FIXTURES) {
    const result = matchAddress(fixture.raw, MATCH_PARCELS)
    expect(result.candidates.length, fixture.raw).toBeLessThanOrEqual(3)
    for (let i = 1; i < result.candidates.length; i++) {
      expect(
        result.candidates[i - 1].confidence,
        fixture.raw,
      ).toBeGreaterThanOrEqual(result.candidates[i].confidence)
    }
  }
})

test('reasons contain no confidence numbers or field names', () => {
  for (const fixture of ADDRESS_FIXTURES) {
    const result = matchAddress(fixture.raw, MATCH_PARCELS)
    const reasons = [result.reason, ...result.candidates.map((row) => row.reason)]
    for (const reason of reasons) {
      expect(reason, fixture.raw).toBeTruthy()
      expect(reason, fixture.raw).not.toMatch(REASON_FIELD)
      expect(reason, fixture.raw).not.toMatch(REASON_SCORE)
    }
  }
})

test('CA_TAX.counties lists the six counties including Ventura', () => {
  expect([...CA_TAX.counties]).toEqual([
    'Los Angeles',
    'Orange',
    'Ventura',
    'San Diego',
    'Riverside',
    'San Bernardino',
  ])
})

test('fixture corpus has at least 60 cases', () => {
  expect(ADDRESS_FIXTURES.length).toBeGreaterThanOrEqual(60)
})
