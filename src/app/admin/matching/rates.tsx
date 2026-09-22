import { formatRate, type MatchingRate } from '@/admin/matching-rates'
import type { AccountMatchingRate } from '@/db/admin-matching'

export function MatchingSummary({ overall }: { overall: MatchingRate }) {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2">
      <div>
        <h2 className="text-[15px] font-semibold">AUTO-MATCH RATE</h2>
        <p className="mt-1 text-[22px] font-semibold">
          {formatRate(overall.autoMatchRate, overall.autoMatched, overall.street)}
        </p>
      </div>
      <div>
        <h2 className="text-[15px] font-semibold">FINAL COVERAGE</h2>
        <p className="mt-1 text-[22px] font-semibold">
          {formatRate(overall.finalCoverage, overall.matched, overall.street)}
        </p>
      </div>
    </section>
  )
}

export function AccountRatesTable({ rows }: { rows: AccountMatchingRate[] }) {
  if (!rows.length) {
    return (
      <p className="mt-6 text-[15px]">
        Import people on an account to score matching.
      </p>
    )
  }
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-foreground/20">
            <th className="px-3 py-2 text-left font-semibold">Account</th>
            <th className="px-3 py-2 text-left font-semibold">AUTO-MATCH RATE</th>
            <th className="px-3 py-2 text-left font-semibold">FINAL COVERAGE</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.accountId} className="border-b border-foreground/10">
              <td className="px-3 py-2">{row.accountName}</td>
              <td className="px-3 py-2">
                {formatRate(row.autoMatchRate, row.autoMatched, row.street)}
              </td>
              <td className="px-3 py-2">
                {formatRate(row.finalCoverage, row.matched, row.street)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
