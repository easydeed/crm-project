'use server'

import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import {
  chooseReviewCandidate,
  fixReviewAddress,
  leaveOutReviewContact,
  undoReviewDecision,
  type ReviewFormState,
} from '@/people/save-review'

export type { ReviewFormState }

async function requireSession() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people/review')
  return session
}

export async function chooseReviewCandidateAction(
  formData: FormData,
): Promise<ReviewFormState> {
  return chooseReviewCandidate(await requireSession(), formData)
}

export async function leaveOutReviewContactAction(
  formData: FormData,
): Promise<ReviewFormState> {
  return leaveOutReviewContact(await requireSession(), formData)
}

export async function fixReviewAddressAction(
  formData: FormData,
): Promise<ReviewFormState> {
  return fixReviewAddress(await requireSession(), formData)
}

export async function undoReviewDecisionAction(
  formData: FormData,
): Promise<ReviewFormState> {
  return undoReviewDecision(await requireSession(), formData)
}
