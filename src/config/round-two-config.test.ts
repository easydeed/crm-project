import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
test('OR-056 leaves no branch-only Vercel deployment rule', () => {
  expect(JSON.parse(readFileSync('vercel.json', 'utf8')).git).toBeUndefined()
})
test('OR-056 desktop evidence is not restricted to its own branch', () => {
  expect(readFileSync('.github/workflows/review-evidence.yml', 'utf8')).not.toContain('github.head_ref')
})
