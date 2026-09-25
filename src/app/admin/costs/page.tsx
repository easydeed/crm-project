import { redirect } from 'next/navigation'
import { AdminNav } from '@/app/admin/admin-nav'
import { CostTable, money } from '@/app/admin/costs/cost-table'
import { readRequestSession } from '@/auth/current-session'
import { COST_RATES, formatDollars } from '@/config/costs'
import { loadCostsForAdmin } from '@/db/admin-costs'

function unsetRates() {
  const names = Object.entries(COST_RATES.providerCallCents).filter(([, rate]) => rate === null).map(([key]) => key)
  if (COST_RATES.sendCents === null) names.push('send')
  if (COST_RATES.fixedMonthlyCents.email === null) names.push('email (monthly)')
  if (COST_RATES.fixedMonthlyCents.hosting === null) names.push('hosting (monthly)')
  return names
}

export default async function CostsPage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/costs')
  const report = await loadCostsForAdmin(session.accountId)
  if (!report) redirect('/login?returnTo=/admin/costs')
  const unset = unsetRates()
  const { totals } = report

  return (
    <main className="px-4 py-10">
      <AdminNav />
      <h1 className="mt-6 text-[22px] font-semibold">Costs</h1>
      <p className="mt-3 text-[15px]">
        This month, Pacific time. Rates from src/config/costs.ts, effective {COST_RATES.effectiveDate}.
      </p>
      <dl className="mt-6 grid max-w-3xl grid-cols-1 gap-4 text-[15px] sm:grid-cols-3">
        <div>
          <dt>MRR</dt>
          <dd className="text-[28px] font-semibold">{formatDollars(totals.mrrCents)}</dd>
        </div>
        <div>
          <dt>Total COGS</dt>
          <dd className="text-[28px] font-semibold">{money(totals.cogsCents)}</dd>
        </div>
        <div>
          <dt>Blended margin</dt>
          <dd className="text-[28px] font-semibold">
            {totals.mrrCents === 0 ? 'no revenue' : totals.marginPct === null ? money(null) : `${totals.marginPct}%`}
          </dd>
        </div>
      </dl>
      {unset.length > 0 ? (
        <p className="mt-6 max-w-3xl text-[15px]">
          Rates not set yet: {unset.join(', ')}. Lines that need them show &ldquo;rate not set&rdquo;, and so do the
          totals they feed. Set them in src/config/costs.ts.
        </p>
      ) : null}
      {report.providerCallCount === 0 ? (
        <p className="mt-3 max-w-3xl text-[15px]">
          No billable lookups yet. Parcel and MLS calls are counted here once a real data provider is connected.
        </p>
      ) : null}
      {report.rows.length === 0 ? (
        <p className="mt-8 text-[15px]">No agent accounts yet. Costs appear here once an agent signs up.</p>
      ) : (
        <CostTable report={report} />
      )}
    </main>
  )
}
