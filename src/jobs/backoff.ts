/**
 * Attempt counting: claim increments attempts, then the handler runs.
 * Failure after attempt 1 → retry in 1m
 * Failure after attempt 2 → retry in 5m
 * Failure after attempt 3 → retry in 30m
 * Failure after attempt 4 → dead (no further run)
 *
 * Prose listed a 2h delay before "then dead"; acceptance says dead after
 * four attempts, so only three gaps exist and 2h is unused.
 */
export const MAX_ATTEMPTS = 4

const BACKOFF_MS = [
  60_000,
  5 * 60_000,
  30 * 60_000,
] as const

/** Delay before the next run after this many attempts failed. null = dead. */
export function retryDelayMs(attempts: number): number | null {
  if (attempts >= MAX_ATTEMPTS) return null
  if (attempts < 1) return null
  return BACKOFF_MS[attempts - 1] ?? null
}

export const ABANDONED_LOCK_MS = 15 * 60_000
