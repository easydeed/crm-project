import { assertWritable } from '@/auth/write-guard'
import type { SessionPayload } from '@/auth/session'
import { parseOptionalUsPhone } from '@/config/phone'
import {
  deleteContactsForAccount,
  updateContactForAccount,
} from '@/db/contact-write'
import {
  parseCloseDate,
  parseContactAddress,
  parseContactEmail,
  parseContactName,
  parseNotes,
} from '@/people/parse-fields'

export type ContactFormState = {
  error?: string
  name?: string
  email?: string
  phone?: string
  address?: string
  closeDate?: string
  savedAt?: number
  rematched?: boolean
  deleted?: boolean
}

export type BulkContactState = {
  error?: string
  savedAt?: number
}

export async function saveContact(
  session: SessionPayload,
  formData: FormData,
): Promise<ContactFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }

  const contactId = String(formData.get('contactId') ?? '')
  const name = parseContactName(String(formData.get('name') ?? ''))
  const email = parseContactEmail(String(formData.get('email') ?? ''))
  const phone = parseOptionalUsPhone(String(formData.get('phone') ?? ''))
  const address = parseContactAddress(String(formData.get('address') ?? ''))
  const closeDate = parseCloseDate(String(formData.get('closeDate') ?? ''))
  const notes = parseNotes(String(formData.get('notes') ?? ''))

  const errors: ContactFormState = {}
  if (!name.ok) errors.name = name.message
  if (!email.ok) errors.email = email.message
  if (!phone.ok) errors.phone = phone.message
  if (!address.ok) errors.address = address.message
  if (!closeDate.ok) errors.closeDate = closeDate.message
  if (!name.ok || !email.ok || !phone.ok || !address.ok || !closeDate.ok) {
    return errors
  }

  const result = await updateContactForAccount(session.accountId, contactId, {
    name: name.name,
    email: email.email,
    phone: phone.phone,
    addressRaw: address.address,
    closeDate: closeDate.closeDate,
    notes: notes.notes,
  })
  if (!result.ok) return { error: result.error }
  return { savedAt: Date.now(), rematched: result.rematched }
}

export async function deleteContact(
  session: SessionPayload,
  formData: FormData,
): Promise<ContactFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const contactId = String(formData.get('contactId') ?? '')
  const deleted = await deleteContactsForAccount(session.accountId, [contactId])
  if (!deleted) return { error: 'We could not find that person.' }
  return { deleted: true }
}

export async function deleteSelectedContacts(
  session: SessionPayload,
  formData: FormData,
): Promise<BulkContactState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const ids = formData.getAll('contactId').map(String).filter(Boolean)
  await deleteContactsForAccount(session.accountId, ids)
  return { savedAt: Date.now() }
}
