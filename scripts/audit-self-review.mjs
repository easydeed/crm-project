#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

// Mutate only this checkout, restore the exact bytes (never git checkout), and require
// a real failed assertion. A compiler error does not count as catching a regression.
const database = new URL(process.env.DATABASE_URL ?? 'file:///missing')
if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) throw new Error('Self-review requires an explicitly selected local scratch database')
const output = mkdtempSync(path.join(tmpdir(), 'onrecord-self-review-'))
const unit = 'src/config/audit-validation.test.ts'
const integration = 'src/jobs/audit-safety.integration.test.ts'
const people = 'src/people/audit-repairs.integration.test.ts'
const texting = 'src/text/text.integration.test.ts'
const probes = [
  { name: 'send before compose', file: 'src/jobs/send-job.ts', from: "if (send.state !== 'ready')", to: 'if (false)', suite: integration, match: 'a send before compose' },
  { name: 'stale recipient content', file: 'src/jobs/send-job.ts', from: 'if (!row.composedFingerprint || row.composedFingerprint !== recipientFingerprint(contact))', to: 'if (false)', suite: integration, match: 'an edit after compose' },
  { name: 'uncertain delivery retry', file: 'src/mail/delivery-error.ts', from: 'export function definitelyRejected(error: unknown): boolean {', to: 'export function definitelyRejected(error: unknown): boolean { return true;', suite: integration, match: 'a provider refusal can retry' },
  { name: 'forged signed proof', file: 'src/auth/signed-token.ts', from: 'if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)))', to: 'if (false)', suite: unit, match: 'signed proofs cannot be edited' },
  { name: 'impossible calendar dates', file: 'src/config/calendar-date.ts', from: 'export function isCalendarDate(value: string): boolean {', to: 'export function isCalendarDate(value: string): boolean { return true;', suite: unit, match: 'rejects impossible calendar date' },
  { name: 'incomplete import mapping', file: 'src/import/detect-columns.ts', from: 'export function mappingIsComplete(mapping: FieldRole[]): boolean {', to: 'export function mappingIsComplete(mapping: FieldRole[]): boolean { return true;', suite: unit, match: 'mapping needs a house location' },
  { name: 'future MLS listing', file: 'src/signals/listed.ts', from: 'withinTrailingDays(row.listDate, input.asOf, 45)', to: 'true', suite: unit, match: 'an active own-house listing wins' },
  { name: 'spent Undo replay', file: 'src/db/review-write.ts', from: 'version: row.reviewVersion,', to: 'version: 0,', suite: people, match: 'only server-issued Undo' },
  { name: 'temporary text failure recovery', file: 'src/text/call-list-text.ts', from: 'if (!prior || prior.providerId || prior.permanentFailure || !prior.error)', to: 'if (true)', suite: texting, match: 'a failed text never fails the job' },
  { name: 'low-similarity address fallback', file: 'src/matching/candidates.ts', from: 'or similarity(name, ${name}) >= ${FUZZY_MIN}', to: '', suite: 'src/matching/candidates.integration.test.ts', match: 'never returns a ZIP-only set' },
]

function run(suite, label, filter) {
  const report = path.join(output, `${label}.json`)
  const args = ['node_modules/vitest/vitest.mjs', 'run', '--project', suite === unit ? 'unit' : 'integration', suite, '--reporter=json', `--outputFile=${report}`]
  if (filter) args.push('-t', filter)
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 180_000, env: process.env })
  if (result.error || result.status === null) throw result.error ?? new Error('Test process did not finish')
  const json = JSON.parse(readFileSync(report, 'utf8'))
  return { exit: result.status, failed: json.testResults.flatMap((suite) => suite.assertionResults).filter((assertion) => assertion.status === 'failed') }
}

for (const [index, suite] of [...new Set(probes.map((probe) => probe.suite))].entries()) {
  if (run(suite, `baseline-${index}`).exit !== 0) throw new Error(`Baseline is red: ${suite}. Repair it before mutation review.`)
}
const results = []
for (const [index, probe] of probes.entries()) {
  const original = readFileSync(probe.file)
  const source = original.toString('utf8')
  if (source.split(probe.from).length !== 2) throw new Error(`Probe no longer applies exactly once: ${probe.name}`)
  const mutated = source.replace(probe.from, probe.to)
  try {
    writeFileSync(probe.file, mutated)
    const result = run(probe.suite, `probe-${index}`, probe.match)
    if (result.exit === 0 || !result.failed.some((assertion) => assertion.fullName.includes(probe.match))) throw new Error(`Regression escaped or failed without the expected assertion: ${probe.name}`)
    results.push({ probe: probe.name, result: 'caught', failedAssertions: result.failed.length })
    console.log(`CAUGHT: ${probe.name}`)
  } finally {
    if (readFileSync(probe.file, 'utf8') !== mutated) throw new Error(`Another editor changed ${probe.file}; stopped without overwriting their work`)
    writeFileSync(probe.file, original)
  }
}
writeFileSync(path.join(output, 'summary.json'), JSON.stringify(results, null, 2))
console.log(`${results.length}/${probes.length} deliberately introduced regressions caught. Exact sources restored. Evidence: ${output}`)
