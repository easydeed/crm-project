import { expect, test } from 'vitest'
import { describePeriodText } from '@/text/admin-text'

const base = { providerId: null, error: null, permanentFailure: false, toPhone: '+19095550161', createdAt: new Date('2026-10-01T17:00:00Z') }

test('each state of this period’s call-list text reads plainly, with the error when there is one', () => {
  expect(describePeriodText(null)).toEqual({ state: 'No text this period', detail: null })
  expect(describePeriodText({ ...base, providerId: 'SM123' })).toEqual({ state: 'Sent', detail: 'Provider id SM123' })
  expect(describePeriodText({ ...base, error: 'Text blocked: TEXTING_ENABLED is not true' })).toEqual({
    state: 'Not sent (not retried this period)',
    detail: 'Text blocked: TEXTING_ENABLED is not true',
  })
  expect(describePeriodText({ ...base, error: 'Unsubscribed recipient', permanentFailure: true }).state).toBe('Not sent (permanent)')
  expect(describePeriodText(base).state).toBe('Claimed, not sent')
})
