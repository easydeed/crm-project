import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { fieldClass } from '@/app/app/people/ui'

/** OR-037, the final sweep. */
const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8')

test('fieldClass is a block, so every label sits above its input rather than beside it', () => {
  expect(fieldClass.split(' ')).toContain('block')
})

test('each auth page has one <h1> that names it', () => {
  for (const [file, heading] of [['./login/page.tsx', 'Sign in'], ['./register/page.tsx', 'Create your account']]) {
    const h1s = [...src(file).matchAll(/<h1\b[^>]*>([^<]*)<\/h1>/g)].map((m) => m[1])
    expect(h1s, file).toEqual([heading])
  }
})

test('the email preview: plain text sits on the page background, and the toggles are outlined like controls', () => {
  const panel = src('./digest/preview-panel.tsx')
  expect(panel).toMatch(/<pre\s+className="[^"]*\bbg-background\b[^"]*"/)
  expect(panel).toContain("'bg-foreground text-background' : 'border border-border'")
})
