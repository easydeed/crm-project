import type { MatchingFailureRow } from '@/db/admin-matching'

function candidateCell(row: MatchingFailureRow) {
  if (!row.candidates.length) return 'None'
  return row.candidates
    .map((item) => `${item.label} (${item.confidence.toFixed(2)})`)
    .join(' · ')
}

export function FailureTable({ rows }: { rows: MatchingFailureRow[] }) {
  if (!rows.length) {
    return <p className="mt-6 text-[15px]">No matching failures for this filter.</p>
  }
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[56rem] border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-foreground/20">
            <th className="px-3 py-2 text-left font-semibold">Raw input</th>
            <th className="px-3 py-2 text-left font-semibold">Matcher returned</th>
            <th className="px-3 py-2 text-left font-semibold">Candidates + confidence</th>
            <th className="px-3 py-2 text-left font-semibold">How resolved</th>
            <th className="px-3 py-2 text-left font-semibold">Account</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.contactId} className="border-b border-foreground/10">
              <td className="px-3 py-2">{row.addressRaw}</td>
              <td className="px-3 py-2">{row.matcherReturned}</td>
              <td className="px-3 py-2">{candidateCell(row)}</td>
              <td className="px-3 py-2">{row.howResolved}</td>
              <td className="px-3 py-2">{row.accountName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
