export const JOB_KINDS = [
  'refresh_parcels',
  'refresh_mls',
  'compose',
  'send',
  'build_call_lists',
] as const

export type JobKind = (typeof JOB_KINDS)[number]

export type JobHandlerContext = {
  jobId: string
  attempt: number
  now: Date
}

export type JobHandler = (
  payload: Record<string, unknown>,
  ctx: JobHandlerContext,
) => Promise<void>

/** Every code path that would send email must be listed and call assertSendAllowed. */
export const SEND_ENTRY_POINTS = ['deliverRecipient'] as const
