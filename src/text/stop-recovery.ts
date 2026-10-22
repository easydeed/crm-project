import { finishStopRecovery } from '@/text/stop-state'
export { queueStopRecovery, finishStopRecovery } from '@/text/stop-state'
import { switchAddonOff } from '@/addons/state'
import { TEXT_CALL_LIST_KEY } from '@/addons/text-call-list'
import type { JobHandler } from '@/jobs/types'

export class TextBillingFailure extends Error {}

export const retryStopTexting: JobHandler = async (payload) => {
  const accountId = String(payload.accountId)
  const result = await switchAddonOff(accountId, TEXT_CALL_LIST_KEY)
  if (!result.ok) throw new TextBillingFailure(result.message)
  await finishStopRecovery(accountId)
}
