import { readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import * as statusTag from '@/app/app/people/status-tag'
import * as ui from '@/app/app/people/ui'

/**
 * Read a component's JSX and answer questions about one element's classes (OR-041).
 *
 * Tests that pinned an exact class string went red on a restyle that kept the property, and
 * stayed green on a change that broke it so long as the string survived. These helpers let a
 * test find the element that matters and ask about its tokens instead.
 *
 * Shared class names resolve by importing ui.ts and status-tag.ts, never from a second copy of
 * their strings. Local constants resolve from the same file. A conditional yields both branches.
 */
const SHARED: Record<string, unknown> = { ...ui, ...statusTag }

const srcRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

export type Jsx = { source: ts.SourceFile; file: string }
export type Element = ts.JsxElement | ts.JsxSelfClosingElement

/** Parse a .tsx file, by path relative to src/. */
export function parseJsx(relativeToSrc: string): Jsx {
  const file = path.join(srcRoot, relativeToSrc)
  const text = readFileSync(file, 'utf8')
  return { source: ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), file }
}

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}

function opening(element: Element) {
  return ts.isJsxElement(element) ? element.openingElement : element
}

export function tagOf(jsx: Jsx, element: Element) {
  return opening(element).tagName.getText(jsx.source)
}

/** Every JSX element in the file. */
export function elements(jsx: Jsx): Element[] {
  const found: Element[] = []
  walk(jsx.source, (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) found.push(node)
  })
  return found
}

/** The visible words directly inside an element: its JSX text, without the {expressions}. */
export function ownText(jsx: Jsx, element: Element) {
  if (!ts.isJsxElement(element)) return ''
  return element.children
    .filter(ts.isJsxText)
    .map((child) => child.getText(jsx.source))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Every element with this tag name, e.g. 'button' or 'Link'. */
export function byTag(jsx: Jsx, tag: string): Element[] {
  return elements(jsx).filter((element) => tagOf(jsx, element) === tag)
}

/** Every element whose own words are exactly `text`. */
export function byText(jsx: Jsx, text: string): Element[] {
  return elements(jsx).filter((element) => ownText(jsx, element) === text)
}

/** Every element with a direct child `{expression}`, written exactly as in the source. */
export function byExpression(jsx: Jsx, expression: string): Element[] {
  return elements(jsx).filter(
    (element) =>
      ts.isJsxElement(element) &&
      element.children.some((child) => ts.isJsxExpression(child) && child.getText(jsx.source) === `{${expression}}`),
  )
}

/** Every element with attribute `name` whose source text is `value` (quotes included for strings). */
export function byAttribute(jsx: Jsx, name: string, value: string): Element[] {
  return elements(jsx).filter((element) => attribute(jsx, element, name)?.initializer?.getText(jsx.source) === value)
}

/** Every element that carries attribute `name`, whatever its value. */
export function withAttribute(jsx: Jsx, name: string): Element[] {
  return elements(jsx).filter((element) => attribute(jsx, element, name) !== undefined)
}

export function attribute(jsx: Jsx, element: Element, name: string) {
  return opening(element).attributes.properties.find(
    (prop): prop is ts.JsxAttribute => ts.isJsxAttribute(prop) && prop.name.getText(jsx.source) === name,
  )
}

/** The JSX elements enclosing `element`, innermost first. */
export function ancestors(element: Element): Element[] {
  const found: Element[] = []
  for (let node = element.parent; node; node = node.parent) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) found.push(node)
  }
  return found
}

/** The JSX elements inside `element`, not including it. */
export function descendants(element: Element): Element[] {
  const found: Element[] = []
  if (!ts.isJsxElement(element)) return found
  for (const child of element.children) {
    walk(child, (node) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) found.push(node)
    })
  }
  return found
}

function localConstant(jsx: Jsx, name: string): ts.Expression | undefined {
  let found: ts.Expression | undefined
  walk(jsx.source, (node) => {
    if (!found && ts.isVariableDeclaration(node) && node.name.getText(jsx.source) === name && node.initializer) {
      found = node.initializer
    }
  })
  return found
}

/** Every string an expression can produce. Unknown parts become `{?}` so a test can see them. */
function strings(jsx: Jsx, expression: ts.Expression): string[] {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return [expression.text]
  if (ts.isParenthesizedExpression(expression)) return strings(jsx, expression.expression)
  if (ts.isConditionalExpression(expression)) {
    return [...strings(jsx, expression.whenTrue), ...strings(jsx, expression.whenFalse)]
  }
  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return combine(strings(jsx, expression.left), strings(jsx, expression.right))
  }
  if (ts.isTemplateExpression(expression)) {
    let parts = [expression.head.text]
    for (const span of expression.templateSpans) {
      parts = combine(combine(parts, strings(jsx, span.expression)), [span.literal.text])
    }
    return parts
  }
  if (ts.isIdentifier(expression)) {
    // A constant declared in the file wins over a shared one of the same name, as it does in the
    // module: nav-link.tsx has its own `linkClass`, which is not ui.ts's.
    const name = expression.getText(jsx.source)
    const local = localConstant(jsx, name)
    if (local) return strings(jsx, local)
    if (typeof SHARED[name] === 'string') return [SHARED[name] as string]
  }
  return ['{?}']
}

function combine(left: string[], right: string[]) {
  return left.flatMap((a) => right.map((b) => a + b))
}

/** Each way the element's className can come out, as a list of tokens. Empty when it has none. */
export function classVariants(jsx: Jsx, element: Element): string[][] {
  const initializer = attribute(jsx, element, 'className')?.initializer
  if (!initializer) return [[]]
  const expression = ts.isJsxExpression(initializer) ? initializer.expression : initializer
  if (!expression) return [[]]
  return strings(jsx, expression as ts.Expression).map((value) => value.split(/\s+/).filter(Boolean))
}

/** Every token the element's className can carry, in any branch. */
export function classTokens(jsx: Jsx, element: Element): string[] {
  return [...new Set(classVariants(jsx, element).flat())]
}

/** The identifiers a className expression names directly, e.g. ['buttonClass'] for {`${buttonClass} mt-4`}. */
export function classNames(jsx: Jsx, element: Element): string[] {
  const initializer = attribute(jsx, element, 'className')?.initializer
  const names: string[] = []
  if (initializer) walk(initializer, (node) => { if (ts.isIdentifier(node)) names.push(node.getText(jsx.source)) })
  return names
}

/** A token's colour role: `border-border` from a border colour, ignoring width and style. */
export function borderColours(tokens: string[]): string[] {
  return tokens.filter((token) => /^(?:[a-z]+:)*border(?:-[trblxy])?-(?![trblxy]$|\d|\[|dashed\b|solid\b|dotted\b|double\b|none\b)[a-z-]+$/.test(token))
}

/** Exactly one match, or a failure that says what was looked for. */
export function only(found: Element[], what: string): Element {
  if (found.length !== 1) throw new Error(`expected exactly one ${what}, found ${found.length}`)
  return found[0]!
}
