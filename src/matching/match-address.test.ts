import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { CA_TAX } from '@/config/ca-tax'
import {
  ADDRESS_FIXTURES,
  EXTRA_NO_PARCEL,
} from '@/matching/fixtures/addresses'
import { MATCH_PARCELS } from '@/matching/fixtures/parcels'
import { matchAddress } from '@/matching/match-address'
import type { AddressFixture } from '@/matching/types'

const MATCHING_DIR = path.join(process.cwd(), 'src', 'matching')
const REASON_FIELD =
  /\b(streetNumber|street_name|streetName|zipCode|zip_code|houseNumber|house_number|confidence)\b/i
const REASON_SCORE = /\b0\.\d+\b/

type CorpusReport = {
  corpus: number
  matchable: number
  matchedCorrectly: number
  ambiguous: number
  ambiguousCorrect: number
  rejected: number
  rejectedCorrect: number
  mismatches: { raw: string; actual: string }[]
  matchRate: number
}

function evaluateCorpus(fixtures: AddressFixture[]): CorpusReport {
  const mismatches: { raw: string; actual: string }[] = []
  let matchable = 0
  let matchedCorrectly = 0
  let ambiguous = 0
  let ambiguousCorrect = 0
  let rejected = 0
  let rejectedCorrect = 0

  for (const fixture of fixtures) {
    const actual = matchAddress(fixture.raw, MATCH_PARCELS).status
    if (actual !== fixture.expect) {
      mismatches.push({ raw: fixture.raw, actual })
    }
    if (fixture.expect === 'matched') {
      matchable += 1
      if (actual === 'matched') matchedCorrectly += 1
    } else if (fixture.expect === 'needs_review') {
      ambiguous += 1
      if (actual === 'needs_review') ambiguousCorrect += 1
    } else {
      rejected += 1
      if (actual === 'no_parcel') rejectedCorrect += 1
    }
  }

  return {
    corpus: fixtures.length,
    matchable,
    matchedCorrectly,
    ambiguous,
    ambiguousCorrect,
    rejected,
    rejectedCorrect,
    mismatches,
    matchRate: matchable === 0 ? 0 : matchedCorrectly / matchable,
  }
}

function printMatchReport(report: CorpusReport) {
  console.log(`Corpus: ${report.corpus} rows`)
  console.log(`  Matchable (expect 'matched'):   ${report.matchable}`)
  console.log(
    `    matched correctly:            ${report.matchedCorrectly}  (this is the match rate)`,
  )
  console.log(
    `  Ambiguous (expect 'needs_review'): ${report.ambiguousCorrect} correct / ${report.ambiguous}`,
  )
  console.log(
    `  Rejected (expect 'no_parcel'):     ${report.rejectedCorrect} correct / ${report.rejected}`,
  )
  console.log(`MATCH RATE: ${report.matchRate.toFixed(2)}`)
  for (const row of report.mismatches) {
    console.log(`WRONG: ${JSON.stringify(row.raw)} -> ${row.actual}`)
  }
}

test('matcher modules do not import db, fetch, or Date', () => {
  const files = readdirSync(MATCHING_DIR).filter(
    (name) =>
      name.endsWith('.ts') &&
      !name.endsWith('.test.ts') &&
      name !== 'candidates.ts',
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
  const report = evaluateCorpus(ADDRESS_FIXTURES)
  printMatchReport(report)
  expect(report.mismatches, JSON.stringify(report.mismatches)).toEqual([])
})

test('adding a no_parcel case does not change MATCH RATE', () => {
  expect(EXTRA_NO_PARCEL.expect).toBe('no_parcel')
  const onCorpus = evaluateCorpus(ADDRESS_FIXTURES)
  const onCorpusPlusExtra = evaluateCorpus([
    ...ADDRESS_FIXTURES,
    EXTRA_NO_PARCEL,
  ])
  expect(onCorpusPlusExtra.matchRate).toBe(onCorpus.matchRate)
  expect(onCorpusPlusExtra.matchable).toBe(onCorpus.matchable)
  expect(onCorpusPlusExtra.matchedCorrectly).toBe(onCorpus.matchedCorrectly)
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
