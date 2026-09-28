import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, test } from 'vitest'
import { computeBill } from '@/addons/bill'
import { getAddonRegistry } from '@/addons/registry'
import { PLAN } from '@/config/costs'
import { callListText, MAX_TEXT_LENGTH } from '@/text/call-list-text'
import { assertTextAllowed, type TextGuardContext } from '@/text/text-guard'
import { twilioSignature, verifyTwilioSignature } from '@/text/twilio-signature'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = { ...process.env }
afterEach(() => {
  process.env = { ...env }
})

const ME = '+19095550161'
const callList: TextGuardContext = { purpose: 'call_list', to: ME, verifiedPhone: ME, billingActive: true, addonEnabled: true }
const verify: TextGuardContext = { purpose: 'verify', to: ME, accountPhone: ME, codePhone: ME, billingActive: true, codesSentLastHour: 0 }

test('assertTextAllowed throws under default env, for every purpose', () => {
  delete process.env.TEXTING_ENABLED
  expect(() => assertTextAllowed(callList)).toThrow(/TEXTING_ENABLED/)
  expect(() => assertTextAllowed(verify)).toThrow(/TEXTING_ENABLED/)
  process.env.TEXTING_ENABLED = 'false'
  expect(() => assertTextAllowed(callList)).toThrow(/TEXTING_ENABLED/)
})

test("it throws for any destination that is not the account's own phone", () => {
  process.env.TEXTING_ENABLED = 'true'
  expect(() => assertTextAllowed(callList)).not.toThrow()
  expect(() => assertTextAllowed(verify)).not.toThrow()
  for (const to of ['+19095550162', '+14155550161', '9095550161', '']) {
    expect(() => assertTextAllowed({ ...callList, to })).toThrow(/not the account's verified phone/)
    expect(() => assertTextAllowed({ ...verify, to })).toThrow(/not the account's own phone/)
  }
  expect(() => assertTextAllowed({ ...callList, verifiedPhone: null })).toThrow(/verified phone/)
  expect(() => assertTextAllowed({ ...verify, codePhone: '+19095550199' })).toThrow(/phone changed since the code was issued/)
  expect(() => assertTextAllowed({ ...callList, addonEnabled: false })).toThrow(/add-on is off/)
  expect(() => assertTextAllowed({ ...callList, billingActive: false })).toThrow(/no active subscription/)
  expect(() => assertTextAllowed({ ...verify, codesSentLastHour: 3 })).toThrow(/too many codes/)
})

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full) : /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

test('only deliverText calls texter.send, and it calls the guard first', () => {
  const production = files(path.join(root, 'src'))
    .filter((file) => !/\.test\.ts$/.test(file))
    .map((file) => ({ rel: path.relative(root, file), src: readFileSync(file, 'utf8') }))
  expect(production.filter(({ src }) => /texter\.send\(/i.test(src)).map(({ rel }) => rel)).toEqual(['src/text/deliver-text.ts'])
  expect(production.filter(({ src }) => /getTexter\(\)/.test(src)).map(({ rel }) => rel).sort()).toEqual(['src/text/current.ts', 'src/text/deliver-text.ts'])
  expect(production.filter(({ src }) => /from '@\/text\/twilio-texter'/.test(src) && /TwilioTexter/.test(src)).map(({ rel }) => rel)).toEqual(['src/text/current.ts'])
  const deliver = production.find(({ rel }) => rel === 'src/text/deliver-text.ts')!.src
  const body = deliver.slice(deliver.indexOf('export async function deliverText'))
  expect(body.indexOf('assertTextAllowed(guard)')).toBeGreaterThan(-1)
  expect(body.indexOf('assertTextAllowed(guard)')).toBeLessThan(body.indexOf('texter.send('))
  expect(body).toContain("withMetering(getTexter(), 'text', { accountId })")
})

test('the text lists the names in order, says less when there are fewer, and nothing when there are none', () => {
  const three = callListText(
    [
      { name: 'Marilyn Okafor', kind: 'sold_nearby' },
      { name: 'Ray & Teresa Villanueva', kind: 'loan_paid_off' },
      { name: 'Glenn Sato', kind: 'quiet_a_while' },
    ],
    'https://onrecord.test',
  )
  expect(three).toBe(
    'onrecord — 3 to call this month.\nMarilyn Okafor: big sale next door.\nRay & Teresa Villanueva: paid off their loan.\nGlenn Sato: been a while.\nhttps://onrecord.test/app',
  )
  expect(callListText([{ name: 'Glenn Sato', kind: 'quiet_a_while' }], 'https://onrecord.test')).toBe(
    'onrecord — 1 to call this month.\nGlenn Sato: been a while.\nhttps://onrecord.test/app',
  )
  expect(callListText([], 'https://onrecord.test')).toBeNull()
  const long = callListText(Array(3).fill({ name: 'A'.repeat(200), kind: 'tax_upside' }), 'https://onrecord.test')!
  expect(long.length).toBeLessThanOrEqual(MAX_TEXT_LENGTH)
  expect(long).not.toMatch(/bit\.ly|tinyurl/)
})

test('a Twilio signature verifies only for the exact URL, params, and token', () => {
  const url = 'https://onrecord.test/api/webhooks/twilio'
  const params = { From: ME, Body: 'STOP', OptOutType: 'STOP' }
  const header = twilioSignature(url, params, 'token')
  expect(verifyTwilioSignature(url, params, header, 'token')).toBe(true)
  expect(verifyTwilioSignature(url, { ...params, Body: 'START' }, header, 'token')).toBe(false)
  expect(verifyTwilioSignature(`${url}?x=1`, params, header, 'token')).toBe(false)
  expect(verifyTwilioSignature(url, params, header, 'other')).toBe(false)
  expect(verifyTwilioSignature(url, params, null, 'token')).toBe(false)
  expect(verifyTwilioSignature(url, params, header, '')).toBe(false)
})

test('the bill shows $2 when the call list text is on', () => {
  const addon = getAddonRegistry().get('text_call_list')!
  expect(addon.priceCents).toBe(200)
  expect(addon.fields).toEqual([])
  expect(computeBill(PLAN.priceCents, [{ ...addon, enabled: true }])).toEqual({
    lines: [{ key: 'base', label: 'Base plan', cents: 1900 }, { key: 'text_call_list', label: 'Text me the call list', cents: 200 }],
    totalCents: 2100,
  })
  expect(computeBill(PLAN.priceCents, [{ ...addon, enabled: false }]).totalCents).toBe(1900)
})
