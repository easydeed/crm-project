import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { fieldClass } from '@/app/app/people/ui'
import { borderColours, classVariants, only, parseJsx, withAttribute } from '@/test/jsx'

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
  // OR-041: of the toggle's two looks, the pressed one is the filled pair and the other is
  // outlined in --border like a control. Spacing, radius and border width are free.
  const jsx = parseJsx('app/digest/preview-panel.tsx')
  const toggle = only(withAttribute(jsx, 'aria-pressed'), 'preview toggle')
  const variants = classVariants(jsx, toggle)
  const pressed = variants.filter((tokens) => tokens.includes('bg-foreground'))
  const unpressed = variants.filter((tokens) => !tokens.includes('bg-foreground'))
  expect(pressed.length).toBeGreaterThan(0)
  for (const tokens of pressed) expect(tokens).toContain('text-background')
  expect(unpressed.length).toBeGreaterThan(0)
  for (const tokens of unpressed) {
    expect(borderColours(tokens)).toEqual(['border-border'])
    expect(tokens.some((token) => /^border(-\d)?$/.test(token))).toBe(true)
    expect(tokens.filter((token) => /^bg-/.test(token))).toEqual([])
  }
})
