import { listContactsForAccount } from '@/db/contacts'
import type { DigestDb } from '@/digest/build-input'
import { buildDigestInput } from '@/digest/build-input'
import { sortPreviewRows } from '@/digest/preview-sort'
import { renderDigest } from '@/digest/render'
import { UNMATCHED_REASON } from '@/digest/skip-copy'
import type { ContentBlockName } from '@/digest/types'

export type AccountPreviewRow = {
  id: string
  name: string
  send: boolean
  blocks: ContentBlockName[]
  reason: string
}

export async function listAccountDigestPreviews(
  db: DigestDb,
  accountId: string,
  asOf: Date,
): Promise<AccountPreviewRow[]> {
  const people = await listContactsForAccount(accountId)
  const rows = await Promise.all(
    people.map(async (person) => {
      const input = await buildDigestInput(db, accountId, person.id, asOf)
      const result = input
        ? renderDigest(input)
        : { send: false as const, reason: UNMATCHED_REASON }
      return {
        id: person.id,
        name: person.name,
        send: result.send,
        blocks: result.send ? result.blocks : [],
        reason: result.send ? '' : result.reason,
      }
    }),
  )
  return sortPreviewRows(rows)
}
