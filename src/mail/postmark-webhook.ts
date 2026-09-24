import { sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { contactSubscriptions, mailEvents } from '@/db/schema'
import { contactsIncludingDeleted } from '@/db/live-contacts'
import { suppress } from '@/suppression/suppressions'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function bounceKind(payload: Record<string, unknown>): 'hard_bounce' | 'spam_complaint' | null {
  const recordType = String(payload.RecordType ?? '')
  if (recordType === 'SpamComplaint') return 'spam_complaint'
  if (recordType !== 'Bounce') return null
  const type = String(payload.Type ?? '')
  const typeCode = payload.TypeCode
  if (type === 'HardBounce' || typeCode === 1) return 'hard_bounce'
  return null
}

export function webhookSecretOk(request: Request): boolean {
  const expected = process.env.POSTMARK_WEBHOOK_SECRET
  if (!expected) return false
  if (request.headers.get('x-postmark-webhook-secret') === expected) return true
  return request.headers.get('authorization') === `Bearer ${expected}`
}

export async function recordPostmarkEvent(body: unknown, now = new Date()) {
  const payload = asRecord(body)
  if (!payload) return
  const kind = bounceKind(payload) ?? (String(payload.RecordType ?? '') || 'unknown')
  const email = typeof payload.Email === 'string' ? payload.Email.trim() : ''
  const { db } = getRuntimeDb()
  await db.insert(mailEvents).values({
    kind,
    email: email || null,
    payload,
  })
  const stop = bounceKind(payload)
  if (!stop || !email) return
  // Recorded by address, so it holds even when no contact matches or the contact is later deleted.
  await suppress(db, email, stop === 'spam_complaint' ? 'complained' : 'bounced', 'all', 'postmark_webhook', now)
  const matches = await db
    .select({ id: contactsIncludingDeleted.id })
    .from(contactsIncludingDeleted)
    .where(sql`lower(${contactsIncludingDeleted.email}) = ${email.toLowerCase()}`)
  for (const contact of matches) {
    await db
      .insert(contactSubscriptions)
      .values({ contactId: contact.id, scope: 'monthly', unsubscribedAt: now })
      .onConflictDoUpdate({
        target: [contactSubscriptions.contactId, contactSubscriptions.scope],
        set: { unsubscribedAt: now },
      })
  }
}
