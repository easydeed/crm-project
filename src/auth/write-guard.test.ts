import { expect, test } from 'vitest'
import { assertWritable, VIEW_AS_READ_ONLY } from '@/auth/write-guard'

test('view-as sessions cannot write', () => {
  expect(
    assertWritable({
      accountId: 'admin-1',
      role: 'admin',
      viewingAsAccountId: 'agent-1',
      exp: 1,
    }),
  ).toEqual({ ok: false, error: VIEW_AS_READ_ONLY })
})

test('normal sessions can write', () => {
  expect(assertWritable({ accountId: 'agent-1', role: 'agent', exp: 1 })).toEqual({
    ok: true,
  })
})
