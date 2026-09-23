'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { isTimezone } from '@/config/settings'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { assertWritable } from '@/auth/write-guard'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contacts } from '@/db/schema'
import { callListEntries, callLog } from '@/db/schema-call-lists'
import { localDate } from '@/jobs/schedule-time'

async function writablePeriod(contactId: string) {
  const session = await readRequestSession()
  if (!session) return null
  if (!assertWritable(session).ok) return null
  const accountId = effectiveAccountId(session)
  const { db } = getRuntimeDb()
  const [account] = await db
    .select({ timezone: accounts.timezone })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  const zone = account?.timezone && isTimezone(account.timezone) ? account.timezone : 'UTC'
  const day = localDate(new Date(), zone)
  const period = `${day.year}-${String(day.month).padStart(2, '0')}`
  const [contact] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)))
    .limit(1)
  if (!contact) return null
  return { db, accountId, contactId, period }
}

function refresh(contactId: string) {
  revalidatePath('/app')
  revalidatePath(`/app/people/${contactId}`)
}

export async function markCalledAction(contactId: string) {
  const scope = await writablePeriod(contactId)
  if (!scope) return false
  const [entry] = await scope.db
    .select({ kind: callListEntries.kind })
    .from(callListEntries)
    .where(
      and(
        eq(callListEntries.accountId, scope.accountId),
        eq(callListEntries.contactId, scope.contactId),
        eq(callListEntries.period, scope.period),
      ),
    )
    .limit(1)
  if (!entry) return false
  await scope.db
    .insert(callLog)
    .values({
      accountId: scope.accountId,
      contactId: scope.contactId,
      kind: entry.kind,
      period: scope.period,
      outcome: 'called',
    })
    .onConflictDoUpdate({
      target: [callLog.accountId, callLog.contactId, callLog.period],
      set: { outcome: 'called', kind: entry.kind, createdAt: new Date() },
    })
  refresh(contactId)
  return true
}

export async function dismissCallAction(contactId: string) {
  const scope = await writablePeriod(contactId)
  if (!scope) return false
  const [entry] = await scope.db
    .select({ kind: callListEntries.kind })
    .from(callListEntries)
    .where(
      and(
        eq(callListEntries.accountId, scope.accountId),
        eq(callListEntries.contactId, scope.contactId),
        eq(callListEntries.period, scope.period),
      ),
    )
    .limit(1)
  if (!entry) return false
  await scope.db
    .insert(callLog)
    .values({
      accountId: scope.accountId,
      contactId: scope.contactId,
      kind: entry.kind,
      period: scope.period,
      outcome: 'dismissed',
    })
    .onConflictDoUpdate({
      target: [callLog.accountId, callLog.contactId, callLog.period],
      set: { outcome: 'dismissed', kind: entry.kind, createdAt: new Date() },
    })
  refresh(contactId)
  return true
}

export async function undoCallAction(contactId: string) {
  const scope = await writablePeriod(contactId)
  if (!scope) return
  await scope.db
    .delete(callLog)
    .where(
      and(
        eq(callLog.accountId, scope.accountId),
        eq(callLog.contactId, scope.contactId),
        eq(callLog.period, scope.period),
      ),
    )
  refresh(contactId)
}
