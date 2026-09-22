import Link from 'next/link'
import type { AccountPreviewRow } from '@/digest/account-preview'

export function AccountPreviewTable({
  accountId,
  rows,
}: {
  accountId: string
  rows: AccountPreviewRow[]
}) {
  if (!rows.length) {
    return (
      <p className="mt-6 text-[15px]">
        This account has no people yet.{' '}
        <Link
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href={`/admin/accounts/${accountId}`}
        >
          Open the account
        </Link>{' '}
        to add a list.
      </p>
    )
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-foreground/20">
            <th className="px-3 py-2 text-left font-semibold">Name</th>
            <th className="px-3 py-2 text-left font-semibold">Send</th>
            <th className="px-3 py-2 text-left font-semibold">Blocks</th>
            <th className="px-3 py-2 text-left font-semibold">Skip reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-foreground/10">
              <td className="px-3 py-2">
                <Link
                  className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  href={`/admin/preview?contact=${row.id}`}
                >
                  {row.name}
                </Link>
              </td>
              <td className="px-3 py-2">{row.send ? 'Send' : 'Skip'}</td>
              <td className="px-3 py-2">{row.blocks.length ? row.blocks.join(', ') : '—'}</td>
              <td className="px-3 py-2">{row.reason || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
