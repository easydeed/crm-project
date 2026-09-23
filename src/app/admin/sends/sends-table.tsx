import Link from 'next/link'
import type { SendListRow } from '@/db/admin-sends'
import { formatWhen } from '@/app/admin/admin-nav'

export function SendsTable({ rows }: { rows: SendListRow[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[48rem] border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-black/20">
            <th className="py-2 pr-4 font-semibold">Account</th>
            <th className="py-2 pr-4 font-semibold">Scheduled</th>
            <th className="py-2 pr-4 font-semibold">State</th>
            <th className="py-2 pr-4 font-semibold">Composed</th>
            <th className="py-2 pr-4 font-semibold">Skipped</th>
            <th className="py-2 pr-4 font-semibold">Sent</th>
            <th className="py-2 pr-4 font-semibold">Failed</th>
            <th className="py-2 pr-4 font-semibold">Bounced</th>
            <th className="py-2 font-semibold">Complained</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const trouble = row.failed > 0 || row.bounced > 0 || row.complained > 0
            return (
              <tr
                key={row.id}
                className={trouble ? 'border-b border-black/10 bg-[#f4e4e1]' : 'border-b border-black/10'}
              >
                <td className="py-2 pr-4 align-top">
                  <Link
                    className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    href={`/admin/sends/${row.id}`}
                  >
                    {row.accountName}
                  </Link>
                  {trouble ? <span className="mt-1 block font-semibold">Needs a look</span> : null}
                </td>
                <td className="py-2 pr-4 align-top whitespace-nowrap">{formatWhen(row.scheduledFor)}</td>
                <td className="py-2 pr-4 align-top">{row.state}</td>
                <td className="py-2 pr-4 align-top">{row.composed}</td>
                <td className="py-2 pr-4 align-top">{row.skipped}</td>
                <td className="py-2 pr-4 align-top">{row.sent}</td>
                <td className="py-2 pr-4 align-top">{row.failed}</td>
                <td className="py-2 pr-4 align-top">{row.bounced}</td>
                <td className="py-2 align-top">{row.complained}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
