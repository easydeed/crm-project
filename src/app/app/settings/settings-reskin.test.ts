import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { buttonClass, fieldClass as sharedFieldClass, linkClass } from '@/app/app/people/ui'
import { fieldClass as settingsFieldClass } from '@/app/app/settings/field'
import { attribute, byExpression, byTag, byText, classNames, classTokens, only, parseJsx, tagOf } from '@/test/jsx'

/** OR-034. Settings and billing on the shared classes. */
const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8')

test('settings inputs use the shared fieldClass, and helper lines use mutedClass', () => {
  expect(settingsFieldClass).toBe(sharedFieldClass)
  const field = src('./field.tsx')
  expect(field).not.toMatch(/export const fieldClass\s*=/)
  const jsx = parseJsx('app/app/settings/field.tsx')
  expect(classNames(jsx, only(byExpression(jsx, 'children'), '{children}'))).toContain('mutedClass')
})

test('the cancel screen carries out the decision with the primary button; keeping the plan is a plain link', () => {
  // OR-041: found by their words, so a wrapper or re-indent changes nothing.
  const page = src('./billing/cancel/page.tsx')
  expect(page).not.toContain('destructiveButtonClass')
  const jsx = parseJsx('app/app/settings/billing/cancel/page.tsx')
  const cancel = only(byText(jsx, 'Cancel my plan'), '"Cancel my plan"')
  expect(tagOf(jsx, cancel)).toBe('button')
  expect(classNames(jsx, cancel)).toContain('buttonClass')
  // Anything added beside buttonClass is layout, never a colour or a size of its own.
  const own = new Set(buttonClass.split(' '))
  for (const token of classTokens(jsx, cancel).filter((token) => !own.has(token))) {
    expect(token).not.toMatch(/^(?:[a-z]+:)*(?:bg|text|border|ring|outline|opacity)-/)
  }
  const keep = only(byText(jsx, 'Keep my plan'), '"Keep my plan"')
  expect(tagOf(jsx, keep)).toBe('Link')
  expect(classNames(jsx, keep)).toContain('linkClass')
  expect(attribute(jsx, keep, 'href')?.initializer?.getText(jsx.source)).toBe('"/app/settings/billing"')
})

test('phone verification uses buttonClass, so its buttons look disabled while a code is sending', () => {
  const phone = src('./phone-verification.tsx')
  expect(phone).not.toMatch(/const buttonClass\s*=/)
  // OR-041: every button in the file, however many and however laid out.
  const jsx = parseJsx('app/app/settings/phone-verification.tsx')
  const buttons = byTag(jsx, 'button')
  expect(buttons.length).toBeGreaterThanOrEqual(2)
  for (const button of buttons) expect(classNames(jsx, button)).toContain('buttonClass')
})

test('settings and billing links use linkClass, not a copy of its string', () => {
  for (const file of ['./error.tsx', './page.tsx', './billing/error.tsx', './billing/page.tsx', './billing/cancel/page.tsx', './billing/invoice-list.tsx']) {
    const text = src(file)
    expect(text, file).toContain('linkClass')
    expect(text, file).not.toContain('underline underline-offset-4')
    expect(text, file).not.toContain(linkClass)
  }
})
