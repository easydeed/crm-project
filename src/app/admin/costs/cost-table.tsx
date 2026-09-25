import type { AccountCost, CostReport, LineCost } from '@/admin/cost-math'
import { formatDollars } from '@/config/costs'

export const RATE_NOT_SET = 'rate not set'

export function money(cents: number | null) {
  return cents === null ? RATE_NOT_SET : formatDollars(cents)
}

function line(value: LineCost) {
  return `${value.count} · ${money(value.costCents)}`
}

function pct(value: number | null, revenueCents: number) {
  if (revenueCents === 0) return 'no revenue'
  return value === null ? RATE_NOT_SET : `${value}%`
}

const th = 'py-2 pr-4 font-semibold'
const td = 'py-2 pr-4 align-top'

function Row({ row }: { row: AccountCost }) {
  return (
    <tr className="border-b border-black/10">
      <td className={td}>
        {row.name}
        <span className="block">{row.email}</span>
      </td>
      <td className={td}>{formatDollars(row.revenueCents)}</td>
      <td className={td}>{line(row.parcel)}</td>
      <td className={td}>{line(row.mls)}</td>
      <td className={td}>{line(row.sends)}</td>
      <td className={td}>{money(row.otherCents)}</td>
      <td className={td}>{money(row.cogsCents)}</td>
      <td className={td}>{money(row.marginCents)}</td>
      <td className={td}>{pct(row.marginPct, row.revenueCents)}</td>
    </tr>
  )
}

export function CostTable({ report }: { report: CostReport }) {
  const { unattributed } = report
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-black/20">
            <th className={th}>Account</th>
            <th className={th}>Revenue</th>
            <th className={th}>Parcel lookups</th>
            <th className={th}>MLS calls</th>
            <th className={th}>Sends</th>
            <th className={th}>Other (email, hosting)</th>
            <th className={th}>COGS</th>
            <th className={th}>Margin</th>
            <th className={th}>Margin %</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <Row key={row.id} row={row} />
          ))}
          {unattributed.parcel.count + unattributed.mls.count > 0 ? (
            <tr className="border-b border-black/10">
              <td className={td}>Not tied to an account</td>
              <td className={td}>{formatDollars(0)}</td>
              <td className={td}>{line(unattributed.parcel)}</td>
              <td className={td}>{line(unattributed.mls)}</td>
              <td className={td} colSpan={5} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
