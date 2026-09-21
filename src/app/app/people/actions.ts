'use server'

import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import {
  deleteContact,
  deleteSelectedContacts,
  saveContact,
  type BulkContactState,
  type ContactFormState,
} from '@/people/save-contact'
import {
  addToGroup,
  createGroup,
  deleteGroup,
  removeFromGroup,
  renameGroup,
  type GroupFormState,
} from '@/people/save-groups'

export type { BulkContactState, ContactFormState, GroupFormState }

async function requireSession(returnTo: string) {
  const session = await readRequestSession()
  if (!session) redirect(`/login?returnTo=${returnTo}`)
  return session
}

export async function saveContactAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  return saveContact(await requireSession('/app/people'), formData)
}

export async function deleteContactAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const result = await deleteContact(await requireSession('/app/people'), formData)
  if (result.deleted) redirect('/app/people')
  return result
}

export async function deleteSelectedAction(
  _prev: BulkContactState,
  formData: FormData,
): Promise<BulkContactState> {
  return deleteSelectedContacts(await requireSession('/app/people'), formData)
}

export async function createGroupAction(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  return createGroup(await requireSession('/app/people'), formData)
}

export async function renameGroupAction(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  return renameGroup(await requireSession('/app/people'), formData)
}

export async function deleteGroupAction(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  return deleteGroup(await requireSession('/app/people'), formData)
}

export async function addToGroupAction(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  return addToGroup(await requireSession('/app/people'), formData)
}

export async function removeFromGroupAction(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  return removeFromGroup(await requireSession('/app/people'), formData)
}
