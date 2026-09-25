import { redirect } from 'next/navigation'
import { loadAddonStates } from '@/addons/state'
import { AddonsPanel } from '@/app/app/addons/addons-panel'
import type { AddonRowData } from '@/app/app/addons/row-data'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { PLAN } from '@/config/costs'

export default async function AddonsPage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/addons')
  const accountId = effectiveAccountId(session)
  // Rows for keys nothing registers are ignored here; admin sees them on the account page.
  const { states } = await loadAddonStates(accountId)
  const rows: AddonRowData[] = states.map(({ addon, enabled, config }) => ({
    key: addon.key,
    title: addon.title,
    blurb: addon.blurb,
    priceCents: addon.priceCents,
    priceNote: addon.priceNote,
    band: addon.band,
    requiresConfig: addon.requiresConfig,
    fields: addon.fields,
    enabled,
    config,
  }))

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">Add-ons</h1>
      <AddonsPanel baseCents={PLAN.priceCents} readOnly={Boolean(session.viewingAsAccountId)} rows={rows} />
    </main>
  )
}
