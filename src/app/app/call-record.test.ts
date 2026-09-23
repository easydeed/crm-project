import { expect, test } from 'vitest'
import { callRecordLines } from '@/app/app/call-record'
import { DEED_OF_TRUST, GRANT_DEED, RECONVEYANCE } from '@/digest/types'

test('the call panel names the recorded price, the close, and the loan in plain words', () => {
  const lines = callRecordLines('2019-03-14', [
    {
      kind: GRANT_DEED,
      docNumber: '2019-100',
      recordedAt: '2019-04-15',
      amount: 720000,
      party: 'Elena Park',
    },
    {
      kind: DEED_OF_TRUST,
      docNumber: '2019-101',
      recordedAt: '2019-04-20',
      amount: 500000,
      party: 'Hill Lending',
    },
    {
      kind: RECONVEYANCE,
      docNumber: '2026-9',
      recordedAt: '2026-06-01',
      amount: null,
      party: null,
    },
  ])
  expect(lines[0]).toBe('Closed March 14, 2019.')
  expect(lines[1]).toContain('$720,000')
  expect(lines[2]).toContain('$500,000')
  expect(lines[2]).toContain('Hill Lending')
  expect(lines[3]).toBe('Paid off or refinanced — recorded June 1, 2026.')
  expect(lines.join(' ')).not.toMatch(/reconveyance|balance|grant deed/i)
})
