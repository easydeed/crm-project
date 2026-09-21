import { expect, test } from 'vitest'
import { detectDelimiter, parseDelimited } from '@/import/parse-csv'

test('parses comma and quoted fields', () => {
  const rows = parseDelimited('Name,Email,Address\n"Chen, Maya",a@b.com,"1840 Oakdale Ave, La Verne, CA 91750"')
  expect(rows).toEqual([
    ['Name', 'Email', 'Address'],
    ['Chen, Maya', 'a@b.com', '1840 Oakdale Ave, La Verne, CA 91750'],
  ])
})

test('parses tab paste lines', () => {
  const text = 'Maya Chen\tmaya.chen@example.com\t1840 Oakdale Ave, La Verne, CA 91750'
  expect(detectDelimiter(text)).toBe('\t')
  expect(parseDelimited(text)[0]).toEqual([
    'Maya Chen',
    'maya.chen@example.com',
    '1840 Oakdale Ave, La Verne, CA 91750',
  ])
})

test('skips a blank line', () => {
  const rows = parseDelimited('a,b,c\n\nd,e,f\n')
  expect(rows).toHaveLength(2)
})
