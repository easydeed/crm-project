import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { cancelSentence, PLAN_LINE } from '@/app/app/settings/billing/billing-copy'
import { InvoiceList } from '@/app/app/settings/billing/invoice-list'

const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8')

test('invoice history renders what Stripe returned, with a pay link on an open invoice', () => {
  const html = renderToStaticMarkup(
    createElement(InvoiceList, {
      timezone: 'America/Los_Angeles',
      invoices: [
        { id: 'in_2', created: new Date('2026-10-01T19:00:00Z'), amountCents: 1900, status: 'open', url: 'https://invoice.stripe.test/2' },
        { id: 'in_1', created: new Date('2026-09-01T19:00:00Z'), amountCents: 1900, status: 'paid', url: 'https://invoice.stripe.test/1' },
      ],
    }),
  )
  expect(html).toContain('October 1, 2026')
  expect(html).toContain('$19')
  expect(html).toContain('Not paid yet')
  expect(html).toContain('href="https://invoice.stripe.test/2">Pay this invoice')
  expect(html).toContain('href="https://invoice.stripe.test/1">View invoice')
  const empty = renderToStaticMarkup(createElement(InvoiceList, { timezone: null, invoices: [] }))
  expect(empty).toContain('No invoices yet')
})

test('the cancel screen says exactly what happens and offers nothing else', () => {
  expect(cancelSentence('October 20, 2026')).toBe(
    'Your homeowners stop getting the monthly note after October 20, 2026. Your people and their matches stay here. Come back any time.',
  )
  const page = src('./cancel/page.tsx')
  expect(page).toContain('cancelSentence(')
  expect(page).not.toMatch(/discount|offer|coupon|survey|reason|feedback|% off/i)
  expect(page.match(/<form/g)).toHaveLength(1)
  expect(page).not.toMatch(/billing_portal|customer_portal/i)
})

test('billing has four states and never uses the Stripe customer portal', () => {
  expect(src('./loading.tsx')).toContain('Loading your billing')
  expect(src('./error.tsx')).toContain('Try again')
  expect(src('./page.tsx')).toContain('You don&apos;t have a plan yet.')
  expect(src('./page.tsx')).toContain('InvoiceList')
  expect(src('../../../../billing/stripe-gateway.ts')).not.toMatch(/billing_portal/)
  expect(PLAN_LINE).toBe('$19 a month, up to 250 homeowners')
})
