import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { expect, test } from 'vitest'
import { classTokens, elements, parseJsx, type Element, type Jsx } from '@/test/jsx'

/**
 * OR-047. Three link sizes: linkClass (17px) stands on its own line or row; inlineLinkClass has no
 * size, so a link in a sentence is never bigger than its words; metaLinkClass (15px) is for the two
 * meta links the design keeps small. "In a sentence" is the tap check's rule (e2e/checks.ts): the
 * parent has text of its own beside the link. Here that text can also come from an expression, e.g.
 * {START_COPY.fewNote}, since the source can't see the words a constant holds.
 */
const appRoot = path.dirname(fileURLToPath(import.meta.url))

function sourceFiles(dir = ''): string[] {
  return readdirSync(path.join(appRoot, dir)).flatMap((name) => {
    const rel = path.join(dir, name)
    if (statSync(path.join(appRoot, rel)).isDirectory()) return rel === 'admin' ? [] : sourceFiles(rel)
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [rel] : []
  })
}

function hasText(jsx: Jsx, container: ts.JsxElement | ts.JsxFragment) {
  return container.children.some((child) => {
    if (ts.isJsxText(child)) return /\p{L}/u.test(child.getText(jsx.source))
    if (!ts.isJsxExpression(child) || !child.expression) return false
    const expression = child.expression
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return /\p{L}/u.test(expression.text)
    return ts.isIdentifier(expression) || ts.isPropertyAccessExpression(expression) || ts.isTemplateExpression(expression) || ts.isCallExpression(expression)
  })
}

/**
 * Whether the link sits in a sentence: its container (as the DOM sees it) has words beside it. A
 * fragment isn't a DOM node, so a link in a fragment with no words of its own belongs to whatever
 * element holds the fragment ({message} {' '}<Link> in add-on rows).
 */
function textBeside(jsx: Jsx, element: Element) {
  for (let node: ts.Node | undefined = element.parent; node; node = node.parent) {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      if (hasText(jsx, node)) return true
      if (ts.isJsxElement(node)) return false
    }
  }
  return false
}

const links = sourceFiles().flatMap((file) => {
  const jsx = parseJsx(`app/${file}`)
  return elements(jsx).flatMap((element) => {
    // A blue underlined link, sorted by the size its classes resolve to (shared and local names alike).
    const tokens = classTokens(jsx, element)
    if (!tokens.includes('text-blue') || !tokens.includes('underline')) return []
    const size = tokens.includes('text-[17px]') ? 'body' : tokens.includes('text-[15px]') ? 'meta' : tokens.some((token) => /^text-\[\d/.test(token)) ? 'other' : 'inline'
    return [{ file, jsx, element, size }]
  })
})

test('a 17px link never sits inside a sentence; a link in a sentence takes its sentence size', () => {
  const inSentence = (entry: (typeof links)[number]) => textBeside(entry.jsx, entry.element)
  const wrong = links.filter((entry) => entry.size === 'body' && inSentence(entry)).map((entry) => `${entry.file}:${entry.element.getStart(entry.jsx.source)}`)
  expect(wrong).toEqual([])
  const inline = links.filter((entry) => entry.size === 'inline')
  expect(inline.length).toBeGreaterThanOrEqual(5)
  for (const entry of inline) expect(inSentence(entry), entry.file).toBe(true)
})

test('the 15px meta link is only "Log out" and a People row\'s "Edit"', () => {
  const files = links.filter((entry) => entry.size === 'meta').map((entry) => entry.file).sort()
  expect(links.filter((entry) => entry.size === 'other')).toEqual([])
  expect(files).toEqual(['app/layout.tsx', 'app/people/people-list.tsx'])
})
