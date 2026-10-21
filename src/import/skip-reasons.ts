export const CONTACT_LIMIT = 250

export const SKIP = {
  invalidPhone: 'Use a valid US phone number',
  invalidDate: 'Use a real close date',
  noEmail: "No email — we can't send without one",
  alreadyInList: 'Already in your list',
  missingAddress: 'Missing an address',
  overLimit: 'Over your 250-person limit',
} as const

export type SkipReason = (typeof SKIP)[keyof typeof SKIP]
