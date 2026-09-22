import { assertWritable } from '@/auth/write-guard'
import type { SessionPayload } from '@/auth/session'
import {
  chooseCandidateForAccount,
  fixReviewAddressForAccount,
  leaveOutContactForAccount,
  undoReviewChangeForAccount,
} from '@/db/review-write'
import type {
  ContactMatchSource,
  ReviewQueueItem,
  ReviewSnapshot,
} from '@/db/review-types'
import type { NoParcelKind } from '@/matching/no-parcel-kind'
import { parseContactAddress } from '@/people/parse-fields'
import type { ContactReviewState } from '@/people/review-state'
import type { ContactMatchStatus } from '@/people/status'

export type ReviewFormState = {
  error?: string
  snapshot?: ReviewSnapshot
  item?: ReviewQueueItem | null
  advanced?: boolean
  undone?: boolean
}

function isStatus(value: string): value is ContactMatchStatus {
  return value === 'matched' || value === 'needs_review' || value === 'no_parcel'
}

function isReviewState(value: string): value is ContactReviewState {
  return value === 'pending' || value === 'reviewed'
}

function isMatchSource(value: unknown): value is ContactMatchSource {
  return value === 'auto' || value === 'review' || value === 'corrected'
}

function isNoParcelKind(value: unknown): value is NoParcelKind | null {
  return value === null || value === 'non_address' || value === 'unmatched'
}

export function parseReviewSnapshot(raw: string): ReviewSnapshot | null {
  try {
    const value = JSON.parse(raw) as ReviewSnapshot
    if (!value?.contactId || !isStatus(value.status) || !isReviewState(value.reviewState)) {
      return null
    }
    if (typeof value.addressRaw !== 'string') return null
    if (value.parcelId !== null && typeof value.parcelId !== 'string') return null
    if (!Array.isArray(value.candidates)) return null
    return {
      ...value,
      matchSource: isMatchSource(value.matchSource) ? value.matchSource : 'auto',
      noParcelKind: isNoParcelKind(value.noParcelKind) ? value.noParcelKind : null,
    }
  } catch {
    return null
  }
}

export async function chooseReviewCandidate(
  session: SessionPayload,
  formData: FormData,
): Promise<ReviewFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const result = await chooseCandidateForAccount(
    session.accountId,
    String(formData.get('contactId') ?? ''),
    String(formData.get('parcelId') ?? ''),
  )
  if (!result.ok) return { error: result.error }
  return { snapshot: result.snapshot, item: result.item, advanced: true }
}

export async function leaveOutReviewContact(
  session: SessionPayload,
  formData: FormData,
): Promise<ReviewFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const result = await leaveOutContactForAccount(
    session.accountId,
    String(formData.get('contactId') ?? ''),
  )
  if (!result.ok) return { error: result.error }
  return { snapshot: result.snapshot, item: result.item, advanced: true }
}

export async function fixReviewAddress(
  session: SessionPayload,
  formData: FormData,
): Promise<ReviewFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const address = parseContactAddress(String(formData.get('address') ?? ''))
  if (!address.ok) return { error: address.message }
  const result = await fixReviewAddressForAccount(
    session.accountId,
    String(formData.get('contactId') ?? ''),
    address.address,
  )
  if (!result.ok) return { error: result.error }
  return {
    snapshot: result.snapshot,
    item: result.item,
    advanced: result.item === null,
  }
}

export async function undoReviewDecision(
  session: SessionPayload,
  formData: FormData,
): Promise<ReviewFormState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }
  const snapshot = parseReviewSnapshot(String(formData.get('snapshot') ?? ''))
  if (!snapshot) return { error: 'Nothing to undo.' }
  const result = await undoReviewChangeForAccount(session.accountId, snapshot)
  if (!result.ok) return { error: result.error }
  return { item: result.item, undone: true }
}
