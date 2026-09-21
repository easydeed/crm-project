import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { contacts, groupMembers, groups } from '@/db/schema'

export type GroupListRow = {
  id: string
  name: string
  count: number
}

function uniqueViolation(error: unknown) {
  return typeof error === 'object' && error && 'code' in error && error.code === '23505'
}

export async function listGroupsForAccount(accountId: string): Promise<GroupListRow[]> {
  const { db } = getRuntimeDb()
  return db
    .select({
      id: groups.id,
      name: groups.name,
      count: sql<number>`count(${groupMembers.contactId})::int`,
    })
    .from(groups)
    .leftJoin(groupMembers, eq(groupMembers.groupId, groups.id))
    .where(eq(groups.accountId, accountId))
    .groupBy(groups.id, groups.name)
    .orderBy(asc(groups.name))
}

export async function createGroupForAccount(accountId: string, name: string) {
  const { db } = getRuntimeDb()
  try {
    const [row] = await db
      .insert(groups)
      .values({ accountId, name })
      .returning({ id: groups.id, name: groups.name })
    if (!row) return { ok: false as const, error: 'We could not make that group.' }
    return { ok: true as const, group: { ...row, count: 0 } }
  } catch (error) {
    if (uniqueViolation(error)) {
      return { ok: false as const, error: 'You already have a group with that name.' }
    }
    throw error
  }
}

export async function renameGroupForAccount(
  accountId: string,
  groupId: string,
  name: string,
) {
  const { db } = getRuntimeDb()
  try {
    const [row] = await db
      .update(groups)
      .set({ name })
      .where(and(eq(groups.id, groupId), eq(groups.accountId, accountId)))
      .returning({ id: groups.id })
    if (!row) return { ok: false as const, error: 'We could not find that group.' }
    return { ok: true as const }
  } catch (error) {
    if (uniqueViolation(error)) {
      return { ok: false as const, error: 'You already have a group with that name.' }
    }
    throw error
  }
}

export async function deleteGroupForAccount(accountId: string, groupId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db
    .delete(groups)
    .where(and(eq(groups.id, groupId), eq(groups.accountId, accountId)))
    .returning({ id: groups.id })
  if (!row) return { ok: false as const, error: 'We could not find that group.' }
  return { ok: true as const }
}

async function ownedGroupAndContacts(
  accountId: string,
  groupId: string,
  contactIds: string[],
) {
  const { db } = getRuntimeDb()
  const [group] = await db
    .select({ id: groups.id })
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.accountId, accountId)))
    .limit(1)
  if (!group) return { ok: false as const, error: 'We could not find that group.' }
  if (!contactIds.length) return { ok: true as const, ids: [] as string[] }
  const owned = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.accountId, accountId), inArray(contacts.id, contactIds)))
  if (owned.length !== contactIds.length) {
    return { ok: false as const, error: 'Some of those people are not on your list.' }
  }
  return { ok: true as const, ids: owned.map((row) => row.id) }
}

export async function addContactsToGroup(
  accountId: string,
  groupId: string,
  contactIds: string[],
) {
  const owned = await ownedGroupAndContacts(accountId, groupId, contactIds)
  if (!owned.ok) return owned
  if (!owned.ids.length) return { ok: true as const }
  const { db } = getRuntimeDb()
  await db
    .insert(groupMembers)
    .values(owned.ids.map((contactId) => ({ groupId, contactId })))
    .onConflictDoNothing()
  return { ok: true as const }
}

export async function removeContactsFromGroup(
  accountId: string,
  groupId: string,
  contactIds: string[],
) {
  const owned = await ownedGroupAndContacts(accountId, groupId, contactIds)
  if (!owned.ok) return owned
  if (!owned.ids.length) return { ok: true as const }
  const { db } = getRuntimeDb()
  await db
    .delete(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), inArray(groupMembers.contactId, owned.ids)),
    )
  return { ok: true as const }
}
