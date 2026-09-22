import { expect, test } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CA_TAX } from '@/config/ca-tax'
import { streetMedianSale } from '@/digest/blocks/taxes'
import { scenarios } from '@/digest/fixtures/scenarios'
import { formatAboutMoney, formatMoney, roundToHundred } from '@/digest/format'
import { renderDigest } from '@/digest/render'

test('tax block follows the street-median rule on each scenario', () => {
  for (const scenario of scenarios) {
    const result = renderDigest(scenario.input)
    const hasTax = scenario.blocks.includes('taxes')
    if (!result.send) {
      expect(hasTax).toBe(false)
      continue
    }
    expect(result.blocks.includes('taxes')).toBe(hasTax)
    if (!hasTax) {
      expect(result.text).not.toMatch(/have recently sold for/)
      continue
    }
    const median = streetMedianSale(
      scenario.input.parcel,
      scenario.input.streetSales,
      scenario.input.asOf,
    )
    const assessed = scenario.input.parcel.assessedValue
    expect(median).toBeTruthy()
    expect(assessed).toBeTruthy()
    if (median == null || assessed == null) continue
    expect(assessed).toBeLessThan(median)
    const benefit = roundToHundred((median - assessed) * CA_TAX.defaultTaxRatePct)
    expect(result.text).toContain(formatAboutMoney(median))
    expect(result.text).toContain(formatMoney(assessed))
    expect(result.text).toContain(formatAboutMoney(benefit))
    expect(result.text).toContain(
      'California lets some homeowners carry this to their next home.',
    )
    expect(result.text).not.toMatch(/you (are|may be|qualify)/i)
  }
})

test('the full Oakdale example produces about $2,600', () => {
  const full = scenarios.find((row) => row.name === 'full')
  if (!full) throw new Error('missing full')
  const median = streetMedianSale(
    full.input.parcel,
    full.input.streetSales,
    full.input.asOf,
  )
  const assessed = full.input.parcel.assessedValue
  expect(median).toBe(1_040_000)
  expect(assessed).toBe(817_800)
  const benefit = roundToHundred((median! - assessed!) * CA_TAX.defaultTaxRatePct)
  expect(benefit).toBe(2600)
  expect(formatAboutMoney(benefit)).toBe('about $2,600')
  const result = renderDigest(full.input)
  expect(result.send).toBe(true)
  if (!result.send) return
  expect(result.text).toContain('about $2,600')
})

test('1187 Oakdale is the listing, never a recorded sale', () => {
  const full = scenarios.find((row) => row.name === 'full')
  if (!full) throw new Error('missing full')
  expect(full.input.nearbyListing?.address).toBe('1187 Oakdale Ave')
  expect(full.input.streetSales.map((sale) => sale.address)).toEqual([
    '1108 Oakdale Ave',
    '1162 Oakdale Ave',
    '2334 Bonita Ave',
  ])
  const result = renderDigest(full.input)
  expect(result.send).toBe(true)
  if (!result.send) return
  expect(result.text).toContain('A house at 1187 Oakdale Ave is active')
  const saleLines = result.text
    .split('\n')
    .filter((line) => /recorded .+ · document /.test(line))
  expect(saleLines.length).toBe(3)
  expect(saleLines.join('\n')).not.toContain('1187 Oakdale Ave')
})

test('no statutory number is copied into digest source', () => {
  const root = path.dirname(fileURLToPath(import.meta.url))
  const forbidden = [/0\.0115/, /0\.0125/, /1\.15%/, /1\.25%/]
  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name)
      if (statSync(full).isDirectory()) {
        return name === 'fixtures' ? [] : walk(full)
      }
      if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) return []
      return /\.(ts|tsx)$/.test(name) ? [full] : []
    })
  }
  for (const file of walk(root)) {
    const src = readFileSync(file, 'utf8')
    for (const re of forbidden) {
      expect(src.search(re), path.basename(file)).toBe(-1)
    }
  }
})
