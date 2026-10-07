import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { linkClass } from '@/app/app/people/ui'
import { byTag, classNames, parseJsx } from '@/test/jsx'

/** OR-036. The sign-in and create-account screens on the shared classes. */
const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8')

test('both auth forms use the shared fieldClass and keep none of their own', () => {
  for (const file of ['./login-form.tsx', '../register/register-form.tsx']) {
    const text = src(file)
    expect(text, file).toMatch(/import \{[^}]*\bfieldClass\b[^}]*\} from '@\/app\/app\/people\/ui'/)
    expect(text, file).not.toMatch(/const fieldClass\s*=/)
  }
})

test('both auth pages link with linkClass, not a copy of its string', () => {
  // OR-041: every link on the page names linkClass, whatever else it adds (.tap on a phone).
  for (const file of ['./page.tsx', '../register/page.tsx']) {
    const text = src(file)
    const jsx = parseJsx(`app/${file === './page.tsx' ? 'login' : 'register'}/page.tsx`)
    const links = byTag(jsx, 'Link')
    expect(links.length, file).toBeGreaterThan(0)
    for (const link of links) expect(classNames(jsx, link), file).toContain('linkClass')
    expect(text, file).not.toContain('underline underline-offset-4')
    expect(text, file).not.toContain(linkClass)
  }
})
