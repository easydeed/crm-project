import type { DigestDb } from '@/digest/build-input'
import { buildDigestInput } from '@/digest/build-input'
import { scenarios } from '@/digest/fixtures/scenarios'
import type { SettingsPreviewPayload } from '@/digest/preview-types'
import { UNMATCHED_REASON } from '@/digest/skip-copy'
import { renderDigest } from '@/digest/render'
import { listContactsForAccount } from '@/db/contacts'

export type { SettingsPreviewPayload } from '@/digest/preview-types'

export async function loadSettingsPreview(
  db: DigestDb,
  accountId: string,
  asOf: Date,
): Promise<SettingsPreviewPayload> {
  const matched = await listContactsForAccount(accountId, { status: 'matched' })
  const first = matched[0]
  if (!first) {
    const full = scenarios.find((row) => row.name === 'full')
    if (!full) throw new Error('missing full scenario')
    return { sample: true, result: renderDigest(full.input) }
  }
  const input = await buildDigestInput(db, accountId, first.id, asOf)
  return {
    sample: false,
    result: input ? renderDigest(input) : { send: false, reason: UNMATCHED_REASON },
  }
}
