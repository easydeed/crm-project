import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { buttonClass, fieldClass, linkClass, secondaryButtonClass } from '@/app/app/people/ui'
import { ancestors, classTokens, elements, parseJsx, tagOf, type Jsx } from '@/test/jsx'

/** OR-042. The system's shared classes, by property. */
const appRoot = path.dirname(fileURLToPath(import.meta.url))

function tsxFiles(dir = ''): string[] {
  return readdirSync(path.join(appRoot, dir)).flatMap((name) => {
    const rel = path.join(dir, name)
    if (statSync(path.join(appRoot, rel)).isDirectory()) return rel === 'admin' ? [] : tsxFiles(rel)
    return name.endsWith('.tsx') ? [rel] : []
  })
}

test('every control is 48px and 17px: the primary and secondary buttons and the field', () => {
  for (const [name, value] of Object.entries({ buttonClass, secondaryButtonClass, fieldClass })) {
    const tokens = value.split(' ')
    expect(tokens, name).toContain('min-h-12')
    expect(tokens, name).toContain('text-[17px]')
  }
})

test('a text link is blue, and blue words only ever sit on the page or on --surface', () => {
  expect(linkClass.split(' ')).toContain('text-blue')
  // Every element in src/app (outside /admin) whose classes can carry text-blue, by any route:
  // linkClass, a local constant or a literal. Neither it nor anything around it in its file may fill
  // with a colour that is not a checked text pair for --blue (4.42:1 on --blue-soft fails).
  const allowed = new Set(['bg-background', 'bg-surface'])
  const offenders: string[] = []
  let blue = 0
  for (const file of tsxFiles()) {
    const jsx: Jsx = parseJsx(path.join('app', file))
    for (const element of elements(jsx)) {
      if (!classTokens(jsx, element).includes('text-blue')) continue
      blue++
      for (const around of [element, ...ancestors(element)]) {
        for (const token of classTokens(jsx, around).filter((t) => /^(?:[a-z]+:)*bg-/.test(t) && !/^hover:/.test(t))) {
          if (!allowed.has(token)) offenders.push(`${file} <${tagOf(jsx, element)}>: text-blue inside ${token}`)
        }
      }
    }
  }
  expect(blue).toBeGreaterThan(20)
  expect(offenders).toEqual([])
})
