import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { expect, test } from 'vitest'
import { canonicalFacts, fullDigest } from '@/digest/canonical-facts'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('marketing, sample, and the fixture share one Oakdale story', () => {
  const facts = canonicalFacts()
  expect(facts.address).toBe('1142 Oakdale Ave')
  expect(facts.firstName).toBe('Marilyn')
  expect(facts.owner).toBe('Marilyn Okafor')
  expect(facts.streetMedian).toBe('about $1,040,000')
  expect(facts.taxedOn).toBe('$817,800')
  expect(facts.benefit).toBe('about $2,600')
  expect(facts.listingAddress).toBe('1187 Oakdale Ave')

  const result = fullDigest()
  expect(result.send).toBe(true)
  if (!result.send) return
  expect(result.text).toContain(facts.benefit)
  expect(result.text).toContain('Hi Marilyn,')

  expect(src('./page.tsx')).toContain('canonicalFacts')
  expect(src('./home-story.tsx')).toContain('facts.benefit')
  expect(src('./sample/page.tsx')).toContain('fullDigest')
})

test('Fraunces is the home <h1> and nothing else on the page (OR-038)', () => {
  const file = 'home-story.tsx'
  const source = ts.createSourceFile(file, src(`./${file}`), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const serif: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const className = node.attributes.properties.find(
        (prop): prop is ts.JsxAttribute => ts.isJsxAttribute(prop) && prop.name.getText(source) === 'className',
      )
      if (/font-serif/.test(className?.initializer?.getText(source) ?? '')) serif.push(node.tagName.getText(source))
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  expect(serif).toEqual(['h1'])
  // Only on JSX: a class string held in a constant would hide from the walk above.
  expect(src(`./${file}`).match(/font-serif/g)).toHaveLength(1)
})
