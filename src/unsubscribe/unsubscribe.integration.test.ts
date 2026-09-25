import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { GET, POST } from '@/app/u/[token]/route'
import { registerAccount } from '@/auth/register-account'
import { getContactForAccount, listContactsForAccount } from '@/db/contacts'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { withStreetNameNorm } from '@/db/parcel-write'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import {
  accounts,
  contactSubscriptions,
  contacts,
  mailEvents,
  parcels,
  sendRecipients,
  sends,
  subscriptions,
} from '@/db/schema'
import { giveActiveSubscription } from '@/billing/subscription-fixture'
import { loadHomeSend } from '@/app/app/home-send'
import { composeSend } from '@/jobs/compose'
import { signUnsubscribeToken } from '@/unsubscribe/token'

const sessionUrl = tryLoadIntegrationDatabaseUrl()
const accountIds: string[] = []
const parcelIds: string[] = []
const sendIds: string[] = []
const emails: string[] = []

async function newAccount() {
  const created = await registerAccount({
    name: 'OR014 Agent',
    email: `or014-${randomUUID()}@example.com`,
    password: 'long-enough-password',
    brokerage: 'Coastline Realty',
    dre: '01998432',
    phone: '909-555-0147',
  })
  expect(created.ok).toBe(true)
  if (!created.ok) throw new Error('register failed')
  accountIds.push(created.accountId)
  const { db } = getRuntimeDb()
  await db
    .update(accounts)
    .set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' })
    .where(eq(accounts.id, created.accountId))
  await giveActiveSubscription(created.accountId)
  return created.accountId
}

async function insertParcel(address: string) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(parcels).values(
    withStreetNameNorm({
      id,
      apn: `OR014-${id.slice(0, 8)}`,
      county: 'Los Angeles',
      address,
      city: 'La Verne',
      zip: '91750',
      beds: 3,
      baths: '2.0',
      sqft: 1680,
      useCode: 'SFR',
    }),
  )
  parcelIds.push(id)
  return id
}

async function insertPerson(accountId: string, addressRaw: string) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  const email = `home-${id.slice(0, 8)}@example.com`
  emails.push(email)
  await db.insert(contacts).values({
    id,
    accountId,
    name: 'Marilyn Okafor',
    email,
    addressRaw,
    closeDate: '2019-03-14',
    status: 'matched',
    parcelId: await insertParcel(addressRaw.split(',')[0] ?? addressRaw),
  })
  return { id, email }
}

function post(token: string, body: string) {
  return POST(
    new Request(`http://localhost:3000/u/${token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    }),
    { params: Promise.resolve({ token }) },
  )
}

describe.skipIf(!sessionUrl)('homeowner unsubscribe', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = sessionUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    if (!sessionUrl) return
    const { db } = getRuntimeDb()
    if (sendIds.length) {
      await db.delete(sendRecipients).where(inArray(sendRecipients.sendId, sendIds))
      await db.delete(sends).where(inArray(sends.id, sendIds))
    }
    if (accountIds.length) {
      const people = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(inArray(contacts.accountId, accountIds))
      const ids = people.map((person) => person.id)
      if (ids.length) {
        await db.delete(contactSubscriptions).where(inArray(contactSubscriptions.contactId, ids))
        await db.delete(contacts).where(inArray(contacts.id, ids))
      }
      await db.delete(subscriptions).where(inArray(subscriptions.accountId, accountIds))
      await db.delete(accounts).where(inArray(accounts.id, accountIds))
    }
    if (parcelIds.length) await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    if (emails.length) await db.delete(mailEvents).where(inArray(mailEvents.email, emails))
    await resetRuntimeDb()
  })

  test('one click leaves, undo restores, and a later token is the same', async () => {
    const accountId = await newAccount()
    const street = `Leave ${randomUUID().slice(0, 8)} Ave`
    const person = await insertPerson(accountId, `1142 ${street}, La Verne, CA 91750`)
    const first = signUnsubscribeToken(person.id, 'monthly')
    const later = signUnsubscribeToken(person.id, 'monthly')
    expect(later).toBe(first)

    const page = await GET(new Request(`http://localhost:3000/u/${first}`), {
      params: Promise.resolve({ token: first }),
    })
    const html = await page.text()
    expect(html).toContain(`1142 ${street}`)
    expect(html).toContain('Stop these emails')
    expect(html).not.toContain('weekly')

    const formStop = await post(first, 'intent=stop')
    const stopped = await formStop.text()
    expect(stopped).toContain('These emails have stopped.')
    // OR-014b: the homeowner's own unsubscribe is the one stop they can undo.
    expect(stopped).toContain('Actually, keep them coming')
    expect(stopped).not.toMatch(/are you sure|miss out|before you go/i)

    const response = await post(first, 'List-Unsubscribe=One-Click')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(await response.text()).toBe('Unsubscribed')

    const { db } = getRuntimeDb()
    const [sub] = await db
      .select()
      .from(contactSubscriptions)
      .where(eq(contactSubscriptions.contactId, person.id))
    expect(sub?.unsubscribedAt).toBeTruthy()

    const home = await loadHomeSend(accountId, new Date('2026-09-14T20:00:00.000Z'))
    expect(home.kind).toBe('none-subscribed')
    const listed = await listContactsForAccount(accountId)
    expect(listed.find((row) => row.id === person.id)?.unsubscribed).toBe(true)

    const [send] = await db
      .insert(sends)
      .values({
        accountId,
        scheduledFor: new Date('2026-06-15T16:00:00.000Z'),
        state: 'scheduled',
      })
      .returning()
    sendIds.push(send.id)
    await composeSend({ accountId, sendId: send.id }, { jobId: 'or014', attempt: 1, now: new Date() })
    const rows = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, send.id))
    expect(rows.map((row) => row.contactId)).not.toContain(person.id)

    const undo = await post(first, 'intent=keep')
    expect(await undo.text()).toContain('These emails will keep coming.')
    const [restored] = await db
      .select()
      .from(contactSubscriptions)
      .where(eq(contactSubscriptions.contactId, person.id))
    expect(restored?.unsubscribedAt).toBeNull()
  })

  test('a failed rematch stays subscribed and a match confirms the new house', async () => {
    const accountId = await newAccount()
    const street = `Move ${randomUUID().slice(0, 8)} Ave`
    const person = await insertPerson(accountId, `1142 ${street}, La Verne, CA 91750`)
    const token = signUnsubscribeToken(person.id, 'monthly')

    const missed = await post(token, 'intent=update&address=' + encodeURIComponent('PO Box 14, La Verne, CA 91750'))
    const missedHtml = await missed.text()
    expect(missedHtml).toContain("We couldn't find that house on the record.")
    expect(missedHtml).toContain("You're still getting these emails.")
    const { db } = getRuntimeDb()
    const [still] = await db
      .select()
      .from(contactSubscriptions)
      .where(eq(contactSubscriptions.contactId, person.id))
    expect(still?.unsubscribedAt).toBeNull()

    const twin = `220 Twin ${randomUUID().slice(0, 8)} Ave`
    await insertParcel(twin)
    await insertParcel(twin)
    const review = await post(token, 'intent=update&address=' + encodeURIComponent(`${twin}, La Verne, CA 91750`))
    expect(await review.text()).toContain("We couldn't match that to one house.")
    const [stillReview] = await db
      .select()
      .from(contactSubscriptions)
      .where(eq(contactSubscriptions.contactId, person.id))
    expect(stillReview?.unsubscribedAt).toBeNull()

    const next = `880 Found ${randomUUID().slice(0, 8)} Ave`
    await insertParcel(next)
    const matched = await post(
      token,
      'intent=update&address=' + encodeURIComponent(`${next}, La Verne, CA 91750`),
    )
    expect(await matched.text()).toContain(`We'll use ${next}, La Verne, 91750.`)
    const detail = await getContactForAccount(accountId, person.id)
    expect(detail?.homeownerAddressAt).toBeTruthy()
    expect(detail?.status).toBe('matched')
  })

  test('a bounce cannot be undone from the public page', async () => {
    const accountId = await newAccount()
    const street = `Bounce ${randomUUID().slice(0, 8)} Ave`
    const person = await insertPerson(accountId, `1142 ${street}, La Verne, CA 91750`)
    const { db } = getRuntimeDb()
    await db.insert(mailEvents).values({
      kind: 'hard_bounce',
      email: person.email,
      payload: { source: 'or014' },
    })
    await db
      .update(contactSubscriptions)
      .set({ unsubscribedAt: new Date() })
      .where(eq(contactSubscriptions.contactId, person.id))
    const token = signUnsubscribeToken(person.id, 'monthly')
    const kept = await post(token, 'intent=keep')
    expect(await kept.text()).toContain('Ask OR014 Agent to add a different one.')
    const [sub] = await db
      .select()
      .from(contactSubscriptions)
      .where(
        and(eq(contactSubscriptions.contactId, person.id), eq(contactSubscriptions.scope, 'monthly')),
      )
    expect(sub?.unsubscribedAt).toBeTruthy()
    const before = await getContactForAccount(accountId, person.id)
    await post(token, 'intent=update&address=' + encodeURIComponent('900 Newhouse Ave, La Verne, CA 91750'))
    const after = await getContactForAccount(accountId, person.id)
    expect(after?.addressRaw).toBe(before?.addressRaw)
  })
})
