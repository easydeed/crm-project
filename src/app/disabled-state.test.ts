import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { buttonClass, destructiveButtonClass, disabledClass } from '@/app/app/people/ui'

/** OR-033a. A disabled control looks unavailable in checked pairs; nothing in the app uses opacity. */
const appRoot = path.dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(path.join(appRoot, rel), 'utf8')

function sourceFiles(dir = ''): string[] {
  return readdirSync(path.join(appRoot, dir)).flatMap((name) => {
    const rel = path.join(dir, name)
    if (statSync(path.join(appRoot, rel)).isDirectory()) return sourceFiles(rel)
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [rel] : []
  })
}

test('no source file under src/app uses an opacity utility, for any state', () => {
  const files = sourceFiles()
  expect(files.length).toBeGreaterThan(100)
  const offenders = files.flatMap((file) =>
    [...read(file).matchAll(/(?<![\w-])(?:[\w-]+:)*opacity-(?:\d+|\[[^\]]*\])/g)].map((m) => `${file}: ${m[0]}`),
  )
  expect(offenders).toEqual([])
})

test('disabled is --surface, --muted-ink and a --border ring: pairs the contrast test checks', () => {
  expect(disabledClass).toContain('disabled:cursor-not-allowed')
  expect(disabledClass).toContain('disabled:ring-1 disabled:ring-inset')
  // Read the pair from the class itself, so any fill, ink or ring it moves to must be a checked pair.
  const token = (utility: string) => new RegExp(`disabled:${utility}-(?!inset\\b)([a-z-]+)(?:\\s|$)`).exec(disabledClass)?.[1]
  const [fill, ink, ring] = [token('bg'), token('text'), token('ring')]
  expect(fill && ink && ring, 'disabledClass names a fill, an ink and a ring').toBeTruthy()
  const pairs = read('tokens.test.ts')
  expect(pairs, `${ink} on ${fill}`).toContain(`['${ink}', '${fill}', TEXT]`)
  expect(pairs, `${ring} on ${fill}`).toContain(`['${ring}', '${fill}', NON_TEXT]`)
  expect(buttonClass.endsWith(` ${disabledClass}`)).toBe(true)
  expect(destructiveButtonClass.endsWith(` ${disabledClass}`)).toBe(true)
  expect(read('app/call-entry.tsx')).toMatch(/const secondaryClass = `[^`]* \$\{disabledClass\}`/)
})

test('primary buttons use buttonClass, not a copy of its string', () => {
  const copy = buttonClass.slice(0, buttonClass.indexOf(' disabled:'))
  for (const file of [
    'app/settings/save-button.tsx',
    'app/people/import/import-form.tsx',
    'login/login-form.tsx',
    'register/register-form.tsx',
    'app/addons/addon-config-form.tsx',
  ]) {
    const text = read(file)
    expect(text, file).toMatch(/className=\{(?:buttonClass|`\$\{buttonClass\} [\w-]+`)\}/)
    expect(text, file).not.toContain('bg-foreground px-4 py-2')
    expect(text, file).not.toContain(copy)
  }
})

test('every control marked disabled is a native one that honours it; nothing uses aria-disabled', () => {
  const native = new Set(['button', 'input', 'select', 'textarea', 'fieldset', 'option'])
  const offenders = sourceFiles()
    .filter((file) => file.endsWith('.tsx'))
    .flatMap((file) => {
      const text = read(file)
      const found = /aria-disabled/.test(text) ? [`${file}: aria-disabled`] : []
      // JSX attributes only: disabled={…}, or bare disabled before > or the next attribute.
      for (const m of text.matchAll(/\sdisabled(?==\{|\s*\/?>|\n\s*[\w{])/g)) {
        const tag = /^<([A-Za-z][\w.]*)/.exec(text.slice(text.lastIndexOf('<', m.index)))?.[1] ?? '?'
        if (tag[0] === tag[0]!.toLowerCase() && !native.has(tag)) found.push(`${file}: disabled on <${tag}>`)
      }
      return found
    })
  expect(offenders).toEqual([])
})
