import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { expect, test } from 'vitest'
import { linkClass } from '@/app/app/people/ui'

/**
 * OR-035. The MLS framing sentences are what stop an agent mailing a stranger as if they were a
 * past client. They render at full contrast: checked by parsing the JSX and walking from each
 * sentence up through every element that contains it, not by listing forbidden colours.
 */
const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8')

/** The className of every JSX element around `expression`, innermost first. */
function classesAround(file: string, expression: string): string[] {
  const text = src(file)
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let found: ts.Node | undefined
  const visit = (node: ts.Node) => {
    if (!found && ts.isJsxExpression(node) && node.getText(source) === `{${expression}}`) found = node
    else ts.forEachChild(node, visit)
  }
  visit(source)
  expect(found, `${file} renders {${expression}}`).toBeDefined()
  const classes: string[] = []
  for (let node = found!.parent; node; node = node.parent) {
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null
    if (!opening) continue
    const attribute = opening.attributes.properties.find(
      (prop): prop is ts.JsxAttribute => ts.isJsxAttribute(prop) && prop.name.getText(source) === 'className',
    )
    classes.push(attribute?.initializer?.getText(source) ?? '')
  }
  return classes
}

const FRAMING: Array<[file: string, expression: string]> = [
  ['./page.tsx', 'START_COPY.intro'],
  ['./closings-results.tsx', 'START_COPY.listingSideNote'],
  ['./closings-results.tsx', 'START_COPY.fewNote'],
  ['./start-flow.tsx', 'START_COPY.nothing'],
  ['./closings-results.tsx', 'addedLine(added)'],
]

test.each(FRAMING)('%s renders %s at full contrast: no muted ink, no colour, no fill, on it or around it', (file, expression) => {
  const classes = classesAround(file, expression)
  expect(classes.length).toBeGreaterThan(0)
  for (const className of classes) {
    expect(className, `${expression} inside ${className}`).not.toMatch(/muted/i)
    expect(className, `${expression} inside ${className}`).not.toMatch(/(?<![\w-])text-(?!\[|foreground\b)[a-z]/)
    expect(className, `${expression} inside ${className}`).not.toMatch(/(?<![\w-])(?:bg|opacity)-/)
  }
})

test('the skeleton rows fill with --rule and the drop zone edge is --border (a swap may not make either fainter)', () => {
  expect(src('./start-flow.tsx')).toContain('<li key={row} className="h-12 rounded-md bg-rule" />')
  expect(src('../people/import/import-form.tsx')).toContain('border border-dashed border-border p-6')
})

test('start and import links use linkClass, not a copy of its string', () => {
  for (const file of ['./error.tsx', '../people/import/import-result.tsx']) {
    const text = src(file)
    expect(text, file).toContain('linkClass')
    expect(text, file).not.toContain('underline underline-offset-4')
    expect(text, file).not.toContain(linkClass)
  }
})
