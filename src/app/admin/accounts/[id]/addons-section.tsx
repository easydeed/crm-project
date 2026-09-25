import { loadAddonStates } from '@/addons/state'
import { forceEnableAddonAction } from '@/app/admin/accounts/[id]/actions'
import { AddonsList } from '@/app/admin/accounts/[id]/addons-list'

export async function AddonsSection({ accountId, flash }: { accountId: string; flash?: { key: string; result: string } }) {
  const { states, unknown } = await loadAddonStates(accountId)
  return <AddonsList accountId={accountId} flash={flash} forceEnable={forceEnableAddonAction} states={states} unknown={unknown} />
}
