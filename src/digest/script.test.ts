import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('digest:preview script writes fixture html without touching the renderer clock', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  expect(pkg.scripts['digest:preview']).toBe('tsx scripts/digest-preview.ts')
  const script = readFileSync(new URL('../../scripts/digest-preview.ts', import.meta.url), 'utf8')
  expect(script).toContain("'preview', 'digest'")
  expect(script).toContain('previewIndexHtml')
  expect(script).toContain('scenarioFileName')
  expect(script).not.toMatch(/Date\.now\s*\(/)
  expect(script).not.toMatch(/getRuntimeDb|drizzle/)
  const ignore = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8')
  expect(ignore).toMatch(/^\/preview\/$/m)
})
