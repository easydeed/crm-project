import { expect, test } from 'vitest'
import { parseOptionalDre, parseOptionalReplyTo } from '@/config/account-fields'

test('DRE accepts 7 or 8 digits and rejects everything else', () => {
  expect(parseOptionalDre('01998432')).toEqual({ ok: true, dre: '01998432' })
  expect(parseOptionalDre('1234567')).toEqual({ ok: true, dre: '1234567' })
  expect(parseOptionalDre('')).toEqual({ ok: true, dre: null })
  expect(parseOptionalDre('12-34567').ok).toBe(false)
  expect(parseOptionalDre('123456').ok).toBe(false)
})

test('reply-to accepts a real email and allows blank', () => {
  expect(parseOptionalReplyTo('Dana@Coastline.example')).toEqual({
    ok: true,
    replyTo: 'dana@coastline.example',
  })
  expect(parseOptionalReplyTo('')).toEqual({ ok: true, replyTo: null })
  expect(parseOptionalReplyTo('not-an-email').ok).toBe(false)
})
