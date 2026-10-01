import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { fieldClass as sharedFieldClass, linkClass } from '@/app/app/people/ui'
import { fieldClass as settingsFieldClass } from '@/app/app/settings/field'

/** OR-034. Settings and billing on the shared classes. */
const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8')

test('settings inputs use the shared fieldClass, and helper lines use mutedClass', () => {
  expect(settingsFieldClass).toBe(sharedFieldClass)
  const field = src('./field.tsx')
  expect(field).not.toMatch(/export const fieldClass\s*=/)
  expect(field).toContain('className={`mt-1 ${mutedClass}`}>{children}')
})

test('the cancel screen carries out the decision with the primary button; keeping the plan is a plain link', () => {
  const page = src('./billing/cancel/page.tsx')
  expect(page).toContain('<button className={buttonClass} type="submit">\n            Cancel my plan')
  expect(page).not.toContain('destructiveButtonClass')
  expect(page).toContain('<Link className={linkClass} href="/app/settings/billing">\n          Keep my plan')
})

test('phone verification uses buttonClass, so its buttons look disabled while a code is sending', () => {
  const phone = src('./phone-verification.tsx')
  expect(phone).not.toMatch(/const buttonClass\s*=/)
  expect(phone).toContain('className={`${buttonClass} self-start`}')
  expect(phone).toContain('<button className={buttonClass} disabled={pending} type="submit">')
})

test('settings and billing links use linkClass, not a copy of its string', () => {
  for (const file of ['./error.tsx', './page.tsx', './billing/error.tsx', './billing/page.tsx', './billing/cancel/page.tsx', './billing/invoice-list.tsx']) {
    const text = src(file)
    expect(text, file).toContain('linkClass')
    expect(text, file).not.toContain('underline underline-offset-4')
    expect(text, file).not.toContain(linkClass)
  }
})
