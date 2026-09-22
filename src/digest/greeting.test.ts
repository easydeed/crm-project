import { expect, test } from 'vitest'
import { renderGreeting } from '@/digest/blocks/greeting'

test('greeting is Hi and has no time of day', () => {
  const result = renderGreeting('Marilyn', 'What sold on your street.')
  expect(result.text).toContain('Hi Marilyn,')
  expect(result.html).toContain('Hi Marilyn,')
  expect(result.text).not.toMatch(/Morning|Afternoon|Evening|Good (morning|afternoon|evening)/i)
  expect(result.html).not.toMatch(/Morning|Afternoon|Evening/)
})
