import { nearbyHouse, sameHouse } from '@/matching/normalize'
import { expect, test } from 'vitest'
import { isCalendarDate } from '@/config/calendar-date'
import { parseCloseDate as parseFormDate, parseContactEmail } from '@/people/parse-fields'
import { mappingIsComplete, rowFromCells, parseCloseDate } from '@/import/detect-columns'
import { openToken, sealToken } from '@/auth/signed-token'
import { recipientFingerprint } from '@/jobs/recipient-fingerprint'
import { DeliveryRejectedError, definitelyRejected } from '@/mail/delivery-error'
import { listingSignal } from '@/signals/listed'
import type { SignalContact, SignalInput } from '@/signals/types'

test.each(['0000-01-01', '2026-02-31', '2025-02-29', '1900-02-29', '2026-04-31', '2026-00-01', '2026-13-01', '2026-01-00', '26-01-01', 'garbage'])('rejects impossible calendar date %s at both input boundaries', (date) => {
  expect(isCalendarDate(date)).toBe(false)
  expect(parseFormDate(date).ok).toBe(false)
  expect(parseCloseDate(date)).toBeNull()
})

test.each(['2000-02-29', '2024-02-29', '2026-02-28', '2026-12-31'])('accepts valid calendar date %s', (date) => {
  expect(parseFormDate(date)).toEqual({ ok: true, closeDate: date })
})

test('mapping needs a house location, not a city and ZIP, and cannot reuse roles', () => {
  expect(mappingIsComplete(['name', 'email', 'city', 'zip'])).toBe(false)
  expect(mappingIsComplete(['name', 'email', 'street'])).toBe(false)
  expect(mappingIsComplete(['name', 'email', 'address', 'email'])).toBe(false)
  expect(mappingIsComplete(['name', 'email', 'street', 'city'])).toBe(true)
  expect(mappingIsComplete(['name', 'email', 'address', 'skip', 'skip'])).toBe(true)
  expect(rowFromCells(['Agent', 'agent@example.com', '1142 Oakdale', '(909) 555-0123'], ['name', 'email', 'address', 'phone'], 1).phone).toBe('(909) 555-0123')
})

test('empty email is accepted only at the explicit optional edit boundary', () => {
  expect(parseContactEmail('')).toMatchObject({ ok: false })
  expect(parseContactEmail('   ', true)).toEqual({ ok: true, email: null })
  expect(parseContactEmail('invalid', true)).toMatchObject({ ok: false })
})

test('signed proofs cannot be edited, reused for another purpose, or used past expiry', () => {
  const token = sealToken('undo', { accountId: 'A', contactId: 'B' }, 2000)
  expect(openToken(token, 'undo', 1999)).toEqual({ accountId: 'A', contactId: 'B' })
  expect(openToken(token, 'password-reset', 1999)).toBeNull()
  expect(openToken(token, 'undo', 2000)).toBeNull()
  expect(openToken(`${token}x`, 'undo', 1000)).toBeNull()
  expect(openToken(`${token}.extra`, 'undo', 1000)).toBeNull()
})

test('delivery identity detects changes and normalizes equivalent email casing', () => {
  const person = { email: 'A@example.com', name: 'A', addressRaw: 'Home', parcelId: 'P', closeDate: '2020-01-01', status: 'matched' }
  expect(recipientFingerprint(person)).toBe(recipientFingerprint({ ...person, email: 'a@EXAMPLE.COM' }))
  for (const key of ['email', 'name', 'addressRaw', 'parcelId', 'closeDate', 'status'] as const) expect(recipientFingerprint({ ...person, [key]: 'changed' })).not.toBe(recipientFingerprint(person))
  expect(definitelyRejected(new Error('timeout'))).toBe(false)
  expect(definitelyRejected(new DeliveryRejectedError('refused'))).toBe(true)
})

test('an active own-house listing wins and future or unrelated listings do not invent a signal', () => {
  const contact: SignalContact = { id: 'A', name: 'A', status: 'matched', subscribed: true, closeDate: null, parcel: { id: 'P', address: '1142 Oakdale Ave', zip: '91750', streetNameNorm: 'oakdale', useCode: 'SFR', assessedValue: null }, events: [] }
  const input: SignalInput = { asOf: new Date('2026-10-21'), contacts: [contact], streetSales: [], priorCalls: [], listings: [{ id: 'L', address: '1142 Oakdale Avenue', zip: '91750', status: 'Active', listDate: '2026-10-01' }] }
  expect(listingSignal(contact, input)).toMatchObject({ kind: 'home_listed', listingId: 'L', score: 1000 })
  expect(listingSignal(contact, { ...input, listings: [{ ...input.listings![0], listDate: '2027-01-01' }] })).toBeNull()
  expect(listingSignal(contact, { ...input, listings: [{ ...input.listings![0], zip: '99999' }] })).toBeNull()
})

test('nearby listing matching preserves street type, direction, and distance', () => {
  expect(nearbyHouse('1142 Oakdale Ave', '1144 Oakdale Avenue')).toBe(true)
  expect(nearbyHouse('1142 Oakdale Ave', '9100 Oakdale Ave')).toBe(false)
  expect(nearbyHouse('1142 Oakdale Ave', '1144 Oakdale St')).toBe(false)
  expect(sameHouse('1142 N Oakdale Ave', '1142 S Oakdale Ave')).toBe(false)
  expect(sameHouse('1142 Oakdale Ave Apt 1', '1142 Oakdale Ave Apt 2')).toBe(false)
})
