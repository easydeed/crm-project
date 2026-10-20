import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { E2E_AGENTS, e2eAgent } from '@/db/fixtures/e2e-agents'

const root = path.resolve(__dirname, '../../..')
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8')
/** Every file that defines a capture: the aggregator and its area modules. */
const CAPTURE_FILES = ['e2e/screens.ts', ...readdirSync(path.join(root, 'e2e/screens')).map((name) => `e2e/screens/${name}`)]
const captures = CAPTURE_FILES.map((file) => ({ file, text: read(file) }))

/**
 * OR-044a. An agent exists to be captured: one no capture signs in as is a state nobody looks at,
 * which is the gap this packet closes. Both ways: every agent is used, and every `as:` names one.
 */
test('every e2e agent is used by a capture, and every capture signs in as a listed agent', () => {
  const used = new Set(captures.flatMap(({ text }) => [...text.matchAll(/\bas: '(\w+)'/g)].map((m) => m[1]!)))
  const keys = E2E_AGENTS.map((row) => row.key as string)
  // One row per key: a duplicate would share Stripe ids and hide behind e2eAgent's first match.
  expect(new Set(keys).size).toBe(keys.length)
  for (const key of used) expect(keys, `as: '${key}'`).toContain(key)
  // The seeded agent is every capture's default; the taken address is typed, not signed in as.
  const signedInAs = keys.filter((key) => key !== 'dana' && key !== 'taken')
  expect(signedInAs.filter((key) => !used.has(key)), 'agents no capture signs in as').toEqual([])
  const prepare = read('e2e/screens/prepare.ts')
  expect(prepare).toContain(`export const TAKEN_EMAIL = '${e2eAgent('taken').email}'`)
  expect(captures.some(({ text }) => text.includes('TAKEN_EMAIL'))).toBe(true)
})

/**
 * "Never show a credential on any page, mocks included." A capture is a picture of a page: none may
 * type a working login. auth.setup signs in, and is not a capture.
 */
test('no capture types an e2e login: no signed-in agent email, and never the e2e password', () => {
  const logins = E2E_AGENTS.filter((row) => row.login).map((row) => row.email)
  const password = read('scripts/e2e-password.ts').match(/E2E_PASSWORD = '([^']+)'/)?.[1]
  expect(password, 'the e2e password is read from scripts/e2e-password.ts').toBeTruthy()
  expect(logins.length).toBeGreaterThan(10)
  for (const { file, text } of captures) {
    for (const email of logins) expect(text, `${file} types ${email}`).not.toContain(email)
    expect(text, file).not.toContain(password!)
    expect(text, file).not.toMatch(/state\.password|E2E_PASSWORD|\.email\b(?!:)/)
  }
})
