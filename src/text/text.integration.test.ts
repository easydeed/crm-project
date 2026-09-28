import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { POST } from '@/app/api/webhooks/twilio/route'
import { TextNoticeLine } from '@/app/app/text-notice'
import { saveDetails } from '@/app/app/settings/save'
import { isAddonEnabled, switchAddonOn } from '@/addons/state'
import { TEXT_CALL_LIST_KEY, VERIFY_FIRST } from '@/addons/text-call-list'
import { registerAccount } from '@/auth/register-account'
import { giveActiveSubscription } from '@/billing/subscription-fixture'
import { withStreetNameNorm } from '@/db/parcel-write'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contacts, parcelEvents, parcels, subscriptions } from '@/db/schema'
import { providerCalls } from '@/db/schema-billing'
import { callListEntries } from '@/db/schema-call-lists'
import { textMessages } from '@/db/schema-text'
import { GRANT_DEED } from '@/digest/types'
import { buildCallLists } from '@/jobs/build-call-lists'
import { setTexter } from '@/text/current'
import { FakeTexter } from '@/text/fake-texter'
import { loadTextNotice } from '@/text/text-notice'
import { TextSendError } from '@/text/texter'
import { twilioSignature } from '@/text/twilio-signature'
import { confirmPhoneCode, requestPhoneCode } from '@/text/verification'
import { publicOrigin } from '@/unsubscribe/links'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const ME = '+19095550161'
const AS_OF = '2026-06-15T16:00:00.000Z'
const ctx = { jobId: 'or022', attempt: 1, now: new Date(AS_OF) }

describe.skipIf(!databaseUrl)('OR-022 text me the call list against the database', () => {
  const accountIds: string[] = []
  const parcelIds: string[] = []
  let texter = new FakeTexter(true)

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    process.env.TWILIO_AUTH_TOKEN = 'twilio-test-token'
    await resetRuntimeDb()
  })
  afterEach(() => {
    delete process.env.TEXTING_ENABLED
    texter = new FakeTexter(true)
    setTexter(texter)
  })
  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    await db.delete(providerCalls).where(inArray(providerCalls.accountId, accountIds))
    await db.delete(subscriptions).where(inArray(subscriptions.accountId, accountIds))
    await db.delete(accounts).where(inArray(accounts.id, accountIds))
    await db.delete(parcelEvents).where(inArray(parcelEvents.parcelId, parcelIds))
    await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    delete process.env.TWILIO_AUTH_TOKEN
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  /** An agent whose June list has one name: a big sale next door. */
  async function agent({ verified = false, addon = false, withName = true } = {}) {
    setTexter(texter)
    const created = await registerAccount({
      name: 'OR022 Agent', email: `or022-${randomUUID()}@example.com`, password: 'long-enough-password',
      brokerage: 'Hill Realty', dre: '02001616', phone: '909-555-0161',
    })
    if (!created.ok) throw new Error('register failed')
    const id = created.accountId
    accountIds.push(id)
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles', phoneVerifiedAt: verified ? new Date() : null }).where(eq(accounts.id, id))
    await giveActiveSubscription(id)
    if (withName) {
      const street = `Text ${id.slice(0, 8)} Ave`
      const [home, sale] = [randomUUID(), randomUUID()]
      await db.insert(parcels).values([
        withStreetNameNorm({ id: home, apn: `OR022-H-${home.slice(0, 8)}`, county: 'Los Angeles', address: `1100 ${street}`, city: 'La Verne', zip: '91750', assessedValue: null }),
        withStreetNameNorm({ id: sale, apn: `OR022-S-${sale.slice(0, 8)}`, county: 'Los Angeles', address: `1104 ${street}`, city: 'La Verne', zip: '91750' }),
      ])
      parcelIds.push(home, sale)
      await db.insert(parcelEvents).values({ parcelId: sale, county: 'Los Angeles', kind: GRANT_DEED, docNumber: `OR022-${sale.slice(0, 8)}`, recordedAt: '2026-06-05', amount: 1_120_000, party: 'Neighbor' })
      await db.insert(contacts).values({ accountId: id, name: 'Marilyn Okafor', email: `or022-m-${home.slice(0, 8)}@example.com`, addressRaw: `1100 ${street}, La Verne, CA 91750`, parcelId: home, closeDate: '2016-06-15', status: 'matched' })
    }
    if (addon) expect(await switchAddonOn(id, TEXT_CALL_LIST_KEY, null)).toEqual({ ok: true })
    return id
  }

  const texts = (id: string) => getRuntimeDb().db.select().from(textMessages).where(eq(textMessages.accountId, id))
  const verifiedAt = async (id: string) => (await getRuntimeDb().db.select({ at: accounts.phoneVerifiedAt }).from(accounts).where(eq(accounts.id, id)))[0]?.at

  test('the add-on cannot switch on without a verified phone, whatever is submitted', async () => {
    const id = await agent()
    expect(await switchAddonOn(id, TEXT_CALL_LIST_KEY, null)).toMatchObject({ ok: false, reason: 'config', message: VERIFY_FIRST })
    expect(await switchAddonOn(id, TEXT_CALL_LIST_KEY, { phone: ME })).toMatchObject({ ok: false, message: VERIFY_FIRST })
    expect(await isAddonEnabled(id, TEXT_CALL_LIST_KEY)).toBe(false)
  })

  test('a texted code verifies the phone; a wrong, stale, or re-pointed code does not', async () => {
    const id = await agent()
    process.env.TEXTING_ENABLED = 'true'
    expect(await requestPhoneCode(id, new Date(), '123456')).toEqual({ ok: true })
    expect(texter.calls).toHaveLength(1)
    expect(texter.calls[0]).toMatchObject({ to: ME, body: 'onrecord code: 123456. It expires in 10 minutes.' })
    expect(await confirmPhoneCode(id, '654321')).toMatchObject({ ok: false, message: 'That code does not match.' })
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ phone: '9095550199' }).where(eq(accounts.id, id))
    expect(await confirmPhoneCode(id, '123456')).toMatchObject({ ok: false, message: /phone changed since we sent the code/ })
    await db.update(accounts).set({ phone: '9095550161' }).where(eq(accounts.id, id))
    expect(await confirmPhoneCode(id, '123456', new Date(Date.now() + 11 * 60_000))).toMatchObject({ ok: false, message: /expired/ })
    expect(await confirmPhoneCode(id, '123456')).toEqual({ ok: true })
    expect(await verifiedAt(id)).toBeInstanceOf(Date)
    expect(await switchAddonOn(id, TEXT_CALL_LIST_KEY, null)).toEqual({ ok: true })
    await requestPhoneCode(id, new Date(), '111111')
    await requestPhoneCode(id, new Date(), '222222')
    expect(await requestPhoneCode(id, new Date(), '333333')).toMatchObject({ ok: false, message: /three codes this hour/ })
    expect(texter.calls).toHaveLength(3)
  })

  test('changing the phone clears verification and switches the add-on off, and says so', async () => {
    const id = await agent({ verified: true, addon: true })
    const form = new FormData()
    for (const [k, v] of Object.entries({ name: 'OR022 Agent', dre: '02001616', brokerage: 'Hill Realty', phone: '909-555-0199' })) form.set(k, v)
    const saved = await saveDetails({ accountId: id, role: 'agent', exp: Date.now() + 60_000 }, form)
    expect(saved.notice).toMatch(/Your phone changed, so we turned off Text me the call list/)
    expect(await verifiedAt(id)).toBeNull()
    expect(await isAddonEnabled(id, TEXT_CALL_LIST_KEY)).toBe(false)
  })

  test('one text per account per period: a re-run sends nothing further, and each text is metered', async () => {
    const id = await agent({ verified: true, addon: true })
    process.env.TEXTING_ENABLED = 'true'
    await buildCallLists({ accountId: id, asOf: AS_OF }, ctx)
    await buildCallLists({ accountId: id, asOf: AS_OF }, ctx)
    expect(texter.calls).toHaveLength(1)
    expect(texter.calls[0]).toMatchObject({ to: ME, idempotencyKey: `${id}:2026-06` })
    expect(texter.calls[0]!.body).toBe(`onrecord — 1 to call this month.\nMarilyn Okafor: big sale next door.\n${publicOrigin()}/app`)
    expect((await texts(id)).map((t) => [t.kind, t.period, t.providerId])).toEqual([['call_list', '2026-06', expect.stringMatching(/^SMfake1-/)]])
    const metered = await getRuntimeDb().db.select().from(providerCalls).where(eq(providerCalls.accountId, id))
    expect(metered.map((row) => [row.provider, row.operation, row.costCents])).toEqual([['text', 'send', null]])
  })

  test('an account with no names on its list gets no text', async () => {
    const id = await agent({ verified: true, addon: true, withName: false })
    process.env.TEXTING_ENABLED = 'true'
    await buildCallLists({ accountId: id, asOf: AS_OF }, ctx)
    expect(texter.calls).toHaveLength(0)
    expect(await texts(id)).toEqual([])
  })

  test('a failed text never fails the job; the error is recorded; a hard failure turns texting off', async () => {
    process.env.TEXTING_ENABLED = 'true'
    const blip = await agent({ verified: true, addon: true })
    texter.failWith = () => new TextSendError('Twilio refused the text (500): busy', 20500)
    await expect(buildCallLists({ accountId: blip, asOf: AS_OF }, ctx)).resolves.toBeUndefined()
    expect(await getRuntimeDb().db.select().from(callListEntries).where(eq(callListEntries.accountId, blip))).toHaveLength(1)
    expect((await texts(blip))[0]).toMatchObject({ error: expect.stringMatching(/busy/), permanentFailure: false })
    expect(await isAddonEnabled(blip, TEXT_CALL_LIST_KEY)).toBe(true)

    const dead = await agent({ verified: true, addon: true })
    texter.failWith = () => new TextSendError('Twilio refused the text (400): unreachable', 30003)
    await buildCallLists({ accountId: dead, asOf: AS_OF }, ctx)
    expect((await texts(dead))[0]).toMatchObject({ permanentFailure: true })
    expect(await isAddonEnabled(dead, TEXT_CALL_LIST_KEY)).toBe(false)
    expect(await loadTextNotice(dead)).toBe('unreachable')
  })

  async function twilio(params: Record<string, string>, token = 'twilio-test-token') {
    const body = new URLSearchParams(params)
    const signature = twilioSignature(`${publicOrigin()}/api/webhooks/twilio`, params, token)
    return POST(new Request('http://localhost/api/webhooks/twilio', { method: 'POST', body, headers: { 'x-twilio-signature': signature, 'content-type': 'application/x-www-form-urlencoded' } }))
  }

  test('a STOP reply turns the add-on off, clears verification, and says so plainly; a bad signature is a 404', async () => {
    const id = await agent({ verified: true, addon: true })
    const forged = await twilio({ From: ME, Body: 'STOP' }, 'wrong-token')
    expect(forged.status).toBe(404)
    expect(await isAddonEnabled(id, TEXT_CALL_LIST_KEY)).toBe(true)
    const stop = await twilio({ From: ME, Body: 'stop', MessageSid: 'SMin1' })
    expect(stop.status).toBe(200)
    expect(await stop.text()).toBe('<Response></Response>')
    expect(await isAddonEnabled(id, TEXT_CALL_LIST_KEY)).toBe(false)
    expect(await verifiedAt(id)).toBeNull()
    expect(await loadTextNotice(id)).toBe('stopped')
    const line = renderToStaticMarkup(TextNoticeLine({ notice: 'stopped' })).replace(/<[^>]+>/g, '')
    expect(line).toBe('You replied STOP, so we stopped texting you. Turn it back on here and confirm your number again.')
  })

  test('a 21610 status on a sent text is treated as STOP', async () => {
    const id = await agent({ verified: true, addon: true })
    process.env.TEXTING_ENABLED = 'true'
    await buildCallLists({ accountId: id, asOf: AS_OF }, ctx)
    const [sent] = await texts(id)
    await twilio({ MessageSid: sent!.providerId!, MessageStatus: 'undelivered', ErrorCode: '21610' })
    expect(await isAddonEnabled(id, TEXT_CALL_LIST_KEY)).toBe(false)
    expect(await loadTextNotice(id)).toBe('stopped')
  })

  test('with default env, a full job run writes the call list and sends no text', async () => {
    const id = await agent({ verified: true, addon: true })
    await buildCallLists({ accountId: id, asOf: AS_OF }, ctx)
    expect(await getRuntimeDb().db.select().from(callListEntries).where(and(eq(callListEntries.accountId, id), eq(callListEntries.period, '2026-06')))).toHaveLength(1)
    expect(texter.calls).toHaveLength(0)
    expect((await texts(id))[0]?.error).toMatch(/TEXTING_ENABLED/)
  })
})
