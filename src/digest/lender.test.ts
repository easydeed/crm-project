import { expect, test } from 'vitest'
import { computeBill } from '@/addons/bill'
import { getAddonRegistry } from '@/addons/registry'
import { priceLabel } from '@/app/app/addons/row-data'
import { PLAN } from '@/config/costs'
import { scenarios } from '@/digest/fixtures/scenarios'
import { renderDigest } from '@/digest/render'
import type { DigestLender } from '@/digest/types'

const lender: DigestLender = { name: 'Marcus Tran', nmls: '448120', email: 'marcus@cardinal.test', phone: null, company: 'Cardinal Home Loans' }
const base = scenarios.find((s) => s.send)!.input

function render(withLender: DigestLender | null) {
  const result = renderDigest({ ...base, lender: withLender })
  if (!result.send) throw new Error('expected a note')
  return result
}

test('the lender block renders only when the lender comes in through DigestInput', () => {
  expect(render(null).html).not.toContain('<!--block:lender-->')
  expect(render(null).text).not.toContain('NMLS')
  const note = render(lender)
  expect(note.html).toContain('<!--block:lender-->')
  expect(note.text).toContain('Marcus Tran · Cardinal Home Loans · NMLS 448120')
  expect(note.html).toContain('href="mailto:marcus@cardinal.test"')
})

test('the block sits below the reply button and above the footer, never above the content', () => {
  const { html, text } = render(lender)
  const reply = html.indexOf('Reply to ')
  const block = html.indexOf('<!--block:lender-->')
  const footer = html.indexOf('Numbers come from county recorded documents')
  const lastContent = Math.max(...[...html.matchAll(/<!--block:(record|four_doors|taxes|street_sales|loan)-->/g)].map((m) => m.index!))
  expect(lastContent).toBeLessThan(reply)
  expect(reply).toBeLessThan(block)
  expect(block).toBeLessThan(footer)
  expect(text.indexOf('Reply to ')).toBeLessThan(text.indexOf('NMLS 448120'))
  expect(text.indexOf('NMLS 448120')).toBeLessThan(text.indexOf('Numbers come from county'))
})

test("the agent's line appears exactly once, with or without a lender", () => {
  const agentLine = 'Dana Whitfield · Coastline Realty · DRE 01998432'
  for (const note of [render(null), render(lender)]) {
    expect(note.text.split(agentLine)).toHaveLength(2)
    expect(note.html.split(agentLine)).toHaveLength(2)
  }
})

/**
 * We ban phrases that solicit, not words that appear. "Apply now" and "rates from" sell
 * a loan; "paid off or refinanced" is a fact about a recorded document; a lender's legal
 * name is neither. So this runs on our copy: the lender's own fields are taken out first.
 */
const SOLICITATIONS = [/\brates?\b/i, /\bAPR\b/i, /pre-?approv/i, /pre-?qualif/i, /refinance offer/i, /apply now/i]

function ourCopy(text: string, withLender: DigestLender | null) {
  if (!withLender) return text
  const fields = [withLender.name, withLender.company, withLender.email].filter((field): field is string => Boolean(field))
  return fields.reduce((acc, field) => acc.split(field).join(''), text)
}

test('no rate, APR, or loan call to action anywhere in the note, on every scenario, with a lender on', () => {
  for (const scenario of scenarios.filter((s) => s.send)) {
    for (const withLender of [lender, { ...lender, company: 'Guaranteed Rate' }]) {
      const result = renderDigest({ ...scenario.input, lender: withLender })
      if (!result.send) continue
      for (const re of SOLICITATIONS) expect(ourCopy(result.text, withLender), `${scenario.name} ${re}`).not.toMatch(re)
    }
  }
  expect(render({ ...lender, company: 'Guaranteed Rate' }).text).toContain('Marcus Tran · Guaranteed Rate · NMLS 448120')
})

test('the bill shows $0 for the lender add-on', () => {
  const addon = getAddonRegistry().get('lender')!
  expect(addon.priceCents).toBe(0)
  expect(priceLabel(addon)).toBe('Free')
  const bill = computeBill(PLAN.priceCents, [{ ...addon, enabled: true }])
  expect(bill.lines).toContainEqual({ key: 'lender', label: 'Add my lender', cents: 0 })
  expect(bill.totalCents).toBe(1900)
})
