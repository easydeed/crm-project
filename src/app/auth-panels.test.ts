import { expect, test } from 'vitest'
import { attribute, byTag, classTokens, descendants, elements, only, ownText, parseJsx } from '@/test/jsx'

/** OR-047. Sign in and create account: the navy wordmark bar, panels, and no credential anywhere. */
const value = (jsx: ReturnType<typeof parseJsx>, element: Parameters<typeof attribute>[1], name: string) =>
  attribute(jsx, element, name)?.initializer?.getText(jsx.source)

test('the auth bar is the bar pair with the wordmark as words, not a control', () => {
  const jsx = parseJsx('app/auth-bar.tsx')
  const bar = only(byTag(jsx, 'header'), 'auth bar')
  expect(classTokens(jsx, bar)).toEqual(expect.arrayContaining(['bg-bar', 'text-on-bar']))
  const inside = descendants(bar)
  expect(byTag(jsx, 'a').length + byTag(jsx, 'Link').length + byTag(jsx, 'button').length).toBe(0)
  expect(inside.flatMap((element) => classTokens(jsx, element)).filter((token) => token.includes('blue'))).toEqual([])
  for (const page of ['app/login/page.tsx', 'app/register/page.tsx']) {
    const pageJsx = parseJsx(page)
    expect(byTag(pageJsx, 'AuthBar'), page).toHaveLength(1)
    const form = only(byTag(pageJsx, 'section'), `${page} panel`)
    expect(classTokens(pageJsx, form), page).toEqual(expect.arrayContaining(['border', 'border-rule', 'rounded-xl']))
  }
})

test('no auth field is ever filled in: no value or defaultValue, mocks included', () => {
  for (const file of ['app/login/login-form.tsx', 'app/register/register-form.tsx']) {
    const jsx = parseJsx(file)
    const inputs = byTag(jsx, 'input').filter((input) => value(jsx, input, 'type') !== '"hidden"')
    expect(inputs.length, file).toBeGreaterThan(0)
    for (const input of inputs) {
      expect(attribute(jsx, input, 'value'), file).toBeUndefined()
      expect(attribute(jsx, input, 'defaultValue'), file).toBeUndefined()
    }
  }
})

test('register: the password is labelled "Password" and described by its rule', () => {
  const jsx = parseJsx('app/register/register-form.tsx')
  const input = only(byTag(jsx, 'input').filter((element) => value(jsx, element, 'name') === '"password"'), 'password input')
  const id = value(jsx, input, 'id')
  const label = only(byTag(jsx, 'label').filter((element) => value(jsx, element, 'htmlFor') === id), 'password label')
  expect(ownText(jsx, label)).toBe('Password')
  const described = value(jsx, input, 'aria-describedby')
  expect(elements(jsx).filter((element) => value(jsx, element, 'id') === described)).toHaveLength(1)
})
