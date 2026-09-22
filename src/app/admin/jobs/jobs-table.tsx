import type { AdminJobRow } from '@/db/admin-jobs'

function fmt(value: Date | null): string {
  if (!value) return '—'
  return value.toISOString()
}

export function JobsTable({ rows }: { rows: AdminJobRow[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-black/20">
            <th className="py-2 pr-4 font-semibold">Kind</th>
            <th className="py-2 pr-4 font-semibold">State</th>
            <th className="py-2 pr-4 font-semibold">Attempts</th>
            <th className="py-2 pr-4 font-semibold">Error</th>
            <th className="py-2 pr-4 font-semibold">Run after</th>
            <th className="py-2 pr-4 font-semibold">Locked</th>
            <th className="py-2 font-semibold">Completed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-black/10">
              <td className="py-2 pr-4 align-top">{row.kind}</td>
              <td className="py-2 pr-4 align-top">{row.state}</td>
              <td className="py-2 pr-4 align-top">{row.attempts}</td>
              <td className="max-w-xs py-2 pr-4 align-top break-words">
                {row.error ?? '—'}
              </td>
              <td className="py-2 pr-4 align-top whitespace-nowrap">
                {fmt(row.runAfter)}
              </td>
              <td className="py-2 pr-4 align-top whitespace-nowrap">
                {fmt(row.lockedAt)}
              </td>
              <td className="py-2 align-top whitespace-nowrap">
                {fmt(row.completedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
