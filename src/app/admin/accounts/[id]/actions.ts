'use server'

import { redirect } from 'next/navigation'
import { forceEnableAddon } from '@/addons/state'
import { readRequestSession } from '@/auth/current-session'

/** Support switches an add-on on for an agent, through the same gate as the agent's own switch. */
export async function forceEnableAddonAction(formData: FormData) {
  const accountId = String(formData.get('accountId') ?? '')
  const key = String(formData.get('key') ?? '')
  const back = `/admin/accounts/${accountId}`
  const session = await readRequestSession()
  if (!session || session.role !== 'admin' || session.viewingAsAccountId) redirect(`/login?returnTo=${back}`)
  const result = await forceEnableAddon(accountId, key, session.accountId)
  const outcome = result.ok ? 'on' : result.reason
  redirect(`${back}?addon=${encodeURIComponent(key)}&result=${outcome}`)
}
