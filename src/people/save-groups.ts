import { assertWritable } from '@/auth/write-guard'
import type { SessionPayload } from '@/auth/session'
import {
  addContactsToGroup,
  createGroupForAccount,
  deleteGroupForAccount,
  removeContactsFromGroup,
  renameGroupForAccount,
} from '@/db/groups'
import { parseGroupName } from '@/people/parse-fields'

export type GroupFormState = {
  error?: string
  savedAt?: number
}

function idsFrom(formData: FormData) {
  return formData.getAll('contactId').map(String).filter(Boolean)
}

export async function createGroup(
  session: SessionPayload,
  formData: FormData,
): Promise<GroupFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const name = parseGroupName(String(formData.get('name') ?? ''))
  if (!name.ok) return { error: name.message }
  const result = await createGroupForAccount(session.accountId, name.name)
  if (!result.ok) return { error: result.error }
  const contactIds = idsFrom(formData)
  if (contactIds.length) {
    const added = await addContactsToGroup(
      session.accountId,
      result.group.id,
      contactIds,
    )
    if (!added.ok) return { error: added.error }
  }
  return { savedAt: Date.now() }
}

export async function renameGroup(
  session: SessionPayload,
  formData: FormData,
): Promise<GroupFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const groupId = String(formData.get('groupId') ?? '')
  const name = parseGroupName(String(formData.get('name') ?? ''))
  if (!name.ok) return { error: name.message }
  const result = await renameGroupForAccount(session.accountId, groupId, name.name)
  if (!result.ok) return { error: result.error }
  return { savedAt: Date.now() }
}

export async function deleteGroup(
  session: SessionPayload,
  formData: FormData,
): Promise<GroupFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const groupId = String(formData.get('groupId') ?? '')
  const result = await deleteGroupForAccount(session.accountId, groupId)
  if (!result.ok) return { error: result.error }
  return { savedAt: Date.now() }
}

export async function addToGroup(
  session: SessionPayload,
  formData: FormData,
): Promise<GroupFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const groupId = String(formData.get('groupId') ?? '')
  const result = await addContactsToGroup(session.accountId, groupId, idsFrom(formData))
  if (!result.ok) return { error: result.error }
  return { savedAt: Date.now() }
}

export async function removeFromGroup(
  session: SessionPayload,
  formData: FormData,
): Promise<GroupFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const groupId = String(formData.get('groupId') ?? '')
  const result = await removeContactsFromGroup(
    session.accountId,
    groupId,
    idsFrom(formData),
  )
  if (!result.ok) return { error: result.error }
  return { savedAt: Date.now() }
}
