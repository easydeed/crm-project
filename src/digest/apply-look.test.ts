import { expect, test } from 'vitest'
import { applyPreviewLook, senderFrom } from '@/digest/apply-look'

test('applyPreviewLook swaps sender and accent in html and text', () => {
  const html =
    '<p>From Dana at Coastline</p><a style="background:#1f4d3a">Reply to Dana at Coastline</a>'
  const text = 'From Dana at Coastline\nReply to Dana at Coastline'
  const next = applyPreviewLook(
    html,
    text,
    { sender: 'Dana at Coastline', accent: '#1f4d3a' },
    { sender: 'Dana W.', accent: '#2F5BFF' },
  )
  expect(next.html).toContain('Dana W.')
  expect(next.html).toContain('#2F5BFF')
  expect(next.html).not.toContain('Dana at Coastline')
  expect(next.html).not.toContain('#1f4d3a')
  expect(next.text).toContain('Dana W.')
  expect(next.text).not.toContain('Dana at Coastline')
})

test('senderFrom prefers a trimmed sender name', () => {
  expect(senderFrom({ name: 'Dana Whitfield', senderName: ' Dana at Coastline ' })).toBe(
    'Dana at Coastline',
  )
  expect(senderFrom({ name: 'Dana Whitfield', senderName: null })).toBe('Dana Whitfield')
})
