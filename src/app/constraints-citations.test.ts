import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

/**
 * OR-048. docs/ui-spec/01-constraints.md says which test holds each rule. It cited them by line,
 * and 35 of its 56 line numbers had drifted: 14 pointed at blank lines. A citation nothing checks
 * is a rule that only describes. It now cites by file and test name, and this test fails both
 * ways: a cited name that no longer exists is red, and so is a rule that names no test.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DOC = 'docs/ui-spec/01-constraints.md'
const doc = readFileSync(path.join(root, DOC), 'utf8')
/** The findings register cites the test that holds each finding now: the same rule applies. */
const REGISTER = 'docs/audits/check-findings.md'
const register = readFileSync(path.join(root, REGISTER), 'utf8')
const collapse = (text: string) => text.replace(/\s+/g, ' ').trim()

/** `path` “name”: a test by its title, or any other file by a string in it. Names may wrap lines. */
function citations(text: string) {
  return [...text.matchAll(/`([^`\s]+\.(?:ts|tsx|css|mjs))`\s*“([^”]+)”/g)].map((m) => ({ file: m[1]!, name: collapse(m[2]!) }))
}

/** Every title a test file declares: test(…), it(…), describe(…), and their .each(…)(…) forms. */
function titles(source: string) {
  const found: string[] = []
  const unescape = (raw: string) => raw.replace(/\\(.)/g, '$1')
  for (const m of source.matchAll(/\b(?:test|it|describe)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) found.push(unescape(m[2]!))
  for (const m of source.matchAll(/\b(?:test|it|describe)\.each\([\s\S]*?\)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) found.push(unescape(m[2]!))
  return found.map(collapse)
}

function missing(text: string) {
  return citations(text).flatMap(({ file, name }) => {
    const full = path.join(root, file)
    if (!existsSync(full)) return [`${file}: no such file`]
    const source = readFileSync(full, 'utf8')
    if (/\.test\.ts$/.test(file)) return titles(source).includes(name) ? [] : [`${file}: no test named “${name}”`]
    return collapse(source).includes(name) ? [] : [`${file}: does not contain “${name}”`]
  })
}

test('every test the constraints document cites exists, by file and by name', () => {
  const cited = citations(doc)
  expect(cited.length, 'the document cites its tests').toBeGreaterThan(50)
  expect(missing(doc)).toEqual([])
  // No line numbers: they drift with every edit above them, and nothing notices.
  expect(doc.match(/\.(?:ts|tsx|css|mjs):\d|`:\d/g) ?? []).toEqual([])
  // Bare paths to code must exist too.
  const bare = [...doc.matchAll(/`((?:src|e2e|scripts)\/[^`\s]+\.(?:ts|tsx|css|mjs))`/g)].map((m) => m[1]!)
  expect(bare.filter((file) => !existsSync(path.join(root, file)))).toEqual([])
})

test('every finding in the register names the test that holds it now, and each exists', () => {
  const findings = register.split(/\n(?=\d+\. \*\*)/).slice(1)
  expect(findings).toHaveLength(16)
  for (const finding of findings) expect(citations(finding.split('## Near misses')[0]!).length, finding.slice(0, 60)).toBeGreaterThan(0)
  expect(missing(register)).toEqual([])
  expect(register.match(/\.(?:ts|tsx|css|mjs):\d/g) ?? []).toEqual([])
})

test('every "Enforced by" names a test, or says plainly that nothing enforces it', () => {
  const rules = doc.slice(doc.indexOf('## 1.'))
  const blocks = rules.split('**Enforced by.**').slice(1).map((after) => after.split(/\n(?:- \*\*|#{2,3} )/)[0]!)
  expect(blocks.length).toBeGreaterThan(20)
  const silent = blocks.filter((block) => citations(block).length === 0 && !/Not enforced|nothing (?:else )?is tested|no test/i.test(block))
  expect(silent.map((block) => collapse(block).slice(0, 80))).toEqual([])
})

test('the checker catches what it is for: a renamed test, a missing file, a line number', () => {
  const sample = 'a `src/app/tokens.test.ts` “every colour token has a light and a dark value”'
  expect(missing(sample)).toEqual([])
  expect(missing(sample.replace('a dark value', 'a darker value'))).toHaveLength(1)
  expect(missing('`src/app/no-such.test.ts` “anything”')).toEqual(['src/app/no-such.test.ts: no such file'])
  expect(missing('`e2e/checks.ts` “rule: \'tap-44\'”')).toEqual([])
  expect(missing('`e2e/checks.ts` “rule: \'tap-45\'”')).toHaveLength(1)
  // A title spread over two lines in the document still matches.
  expect(missing('`src/app/tokens.test.ts` “every colour token has a light\n  and a dark value”')).toEqual([])
})
