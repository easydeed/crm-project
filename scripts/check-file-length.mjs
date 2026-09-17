#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const MAX = 300
const IGNORE = [/\.test\./, /\.spec\./, /fixtures\//, /\.generated\./, /migrations\//]

const files = execSync('git ls-files "*.ts" "*.tsx" "*.js" "*.mjs"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => !IGNORE.some((re) => re.test(f)))

const over = []
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n').length
  if (lines > MAX) over.push({ f, lines })
}

if (over.length) {
  console.error(`\n${over.length} file(s) exceed ${MAX} lines:\n`)
  for (const { f, lines } of over) console.error(`  ${lines.toString().padStart(5)}  ${f}`)
  console.error('\nExtract components or modules. See CLAUDE.md invariant 6.\n')
  process.exit(1)
}

console.log(`All ${files.length} source files under ${MAX} lines.`)
