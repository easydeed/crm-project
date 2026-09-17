#!/usr/bin/env node
// Catches the domain violations that are cheap to detect and expensive to ship.
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const RULES = [
  {
    id: 'no-payoff-balance',
    re: /\b(payoff|payoff_balance|remainingBalance|loanBalance|currentBalance)\b/i,
    msg: 'The record cannot know a loan payoff balance. Show the recorded deed of trust and reconveyance status only.',
    scope: /\.(ts|tsx)$/,
  },
  {
    id: 'no-avm',
    re: /\b(estimatedValue|homeValue|avmValue|zestimate|valuation_estimate)\b/i,
    msg: 'No home value estimates. The product compares a real listing instead.',
    scope: /\.(ts|tsx)$/,
  },
  {
    id: 'no-eligibility-assertion',
    re: /you (are|may be|qualify|could qualify)[^.]{0,40}(prop(osition)?\s*19|eligible)/i,
    msg: 'Never assert Prop 19 eligibility to a consumer. State facts; scoring is agent-facing.',
    scope: /\.(ts|tsx|md)$/,
  },
  {
    id: 'no-leads-table',
    re: /\b(from|join|into|table)\s+["'`]?leads["'`]?\b/i,
    msg: 'One people table. There is no leads table.',
    scope: /\.(ts|sql)$/,
  },
  {
    id: 'no-inline-tax-rates',
    re: /\b(0\.0125|1\.25%|500_?000|\$500,000)\b/,
    msg: 'Statutory figures live in config/ca-tax.ts with an effective date.',
    scope: /\.(ts|tsx)$/,
    allow: /config\/ca-tax\.ts$/,
  },
]

const files = execSync('git ls-files "*.ts" "*.tsx" "*.sql" "*.md"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => !/\.test\.|\.spec\.|fixtures\/|PROJECT_STATE\.md|CLAUDE\.md|docs\//.test(f))

let failed = 0
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const rule of RULES) {
    if (!rule.scope.test(f)) continue
    if (rule.allow?.test(f)) continue
    src.split('\n').forEach((line, i) => {
      if (line.includes('invariant-ok')) return
      if (rule.re.test(line)) {
        console.error(`${f}:${i + 1}  [${rule.id}]  ${rule.msg}`)
        console.error(`    ${line.trim()}\n`)
        failed++
      }
    })
  }
}

if (failed) {
  console.error(`${failed} invariant violation(s). Append // invariant-ok to override with justification.`)
  process.exit(1)
}
console.log('Invariants clean.')
