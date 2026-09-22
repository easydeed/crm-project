/**
 * Handlers must be safe to run twice. Check state before acting; never
 * assume this is the first attempt. Stubs only log and complete — the send
 * stub calls assertSendAllowed and never delivers mail.
 */
import { assertSendAllowed } from '@/jobs/send-guard'
import type { JobHandler, JobKind } from '@/jobs/types'
import { JOB_KINDS } from '@/jobs/types'

function stub(kind: JobKind): JobHandler {
  return async (payload, ctx) => {
    console.info(`[job:${kind}] attempt=${ctx.attempt} job=${ctx.jobId}`, payload)
  }
}

const sendStub: JobHandler = async (payload, ctx) => {
  assertSendAllowed({
    recipientEmail: String(payload.recipientEmail ?? ''),
    unsubscribed: Boolean(payload.unsubscribed),
    accountPaused: Boolean(payload.accountPaused),
  })
  console.info(`[job:send] attempt=${ctx.attempt} job=${ctx.jobId} (guard passed; no mail)`)
}

export const handlers: Record<JobKind, JobHandler> = {
  refresh_parcels: stub('refresh_parcels'),
  refresh_mls: stub('refresh_mls'),
  compose: stub('compose'),
  send: sendStub,
  build_call_lists: stub('build_call_lists'),
}

export function getHandler(kind: string): JobHandler | undefined {
  if ((JOB_KINDS as readonly string[]).includes(kind)) {
    return handlers[kind as JobKind]
  }
  return undefined
}
