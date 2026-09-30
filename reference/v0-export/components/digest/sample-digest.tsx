import { currency, ownedFor, shortDate } from '@/lib/format'
import { RecordBlock } from '@/components/record-block'
import { ParcelMap } from '@/components/parcel-map'
import type { Lot, PropertyRecord } from '@/lib/types'

export type DigestBranding = {
  agentName: string
  brokerage: string
  dre: string
  brandColor: string
}

const RECORD: PropertyRecord = {
  deedRecorded: '2019-03-14',
  docNumber: '2019-0248117',
  recordedPrice: 712000,
  vesting: 'A married couple as community property with right of survivorship',
  loanAmount: 569600,
  loanRecorded: '2019-03-14',
  lender: 'Cardinal Home Loans',
  reconveyed: false,
  assessedValue: 817800,
  streetMedian: 968000,
}

const STREET_SALES = [
  { address: '1108 Oakdale Ave', doc: '2025-1904820', date: '2025-11-02', price: 1120000 },
  { address: '1165 Oakdale Ave', doc: '2025-0994117', date: '2025-06-19', price: 968000 },
  { address: '1190 Oakdale Ave', doc: '2024-2210548', date: '2024-12-08', price: 902500 },
]

const LOTS: Lot[] = [
  { id: 'l1', col: 0, row: 0, kind: 'plain' },
  { id: 'l2', col: 1, row: 0, kind: 'client' },
  { id: 'l3', col: 2, row: 0, kind: 'sold', price: 968000 },
  { id: 'l4', col: 3, row: 0, kind: 'plain' },
  { id: 'l5', col: 0, row: 1, kind: 'sold', price: 1120000 },
  { id: 'l6', col: 1, row: 1, kind: 'plain' },
  { id: 'l7', col: 2, row: 1, kind: 'plain' },
  { id: 'l8', col: 3, row: 1, kind: 'sold', price: 902500 },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-[620] uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </p>
  )
}

function Est() {
  return (
    <span className="ml-1 rounded bg-surface px-1 py-0.5 text-[10px] font-[560] uppercase tracking-wide text-muted-foreground">
      estimate
    </span>
  )
}

export function SampleDigest({ branding }: { branding: DigestBranding }) {
  const { agentName, brokerage, dre, brandColor } = branding
  const taxedNow = 1040000

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      {/* header */}
      <header
        className="border-b border-line px-5 py-4"
        style={{ borderTop: `3px solid ${brandColor}` }}
      >
        <p className="text-[13px] font-[560] text-ink">
          {agentName} {'\u00b7'} {brokerage}
        </p>
        <p className="text-[12px] text-muted-foreground">DRE #{dre}</p>
      </header>

      <div className="flex flex-col gap-6 px-5 py-6">
        <div>
          <p className="text-[12px] text-muted-foreground">
            Your monthly note on 1142 Oakdale Ave
          </p>
          <h2 className="mt-1 text-pretty text-[22px] font-[680] leading-tight tracking-[-0.02em] text-ink">
            Three homes on Oakdale Ave changed hands this year. Here&apos;s where
            yours stands.
          </h2>
        </div>

        <div>
          <ParcelMap lots={LOTS} streetName="Oakdale Ave" />
        </div>

        <RecordBlock record={RECORD} address="1142 Oakdale Ave" showLoan={false} />

        <p className="text-[15px] leading-relaxed text-ink">
          Per the grant deed, you&apos;ve owned it{' '}
          <span className="font-[620]">{ownedFor('2019-03-14')}</span>.
        </p>

        {/* Prop 13 */}
        <section>
          <SectionLabel>What Prop 13 is saving you</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="text-[12px] text-muted-foreground">
                Your assessed value
              </p>
              <p className="mt-1 text-[20px] font-[680] text-ink tabular-nums">
                {currency(RECORD.assessedValue)}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                What you&apos;re taxed on today
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="text-[12px] text-muted-foreground">
                A buyer would be taxed on
              </p>
              <p className="mt-1 flex items-baseline text-[20px] font-[680] text-ink tabular-nums">
                {currency(taxedNow)}
                <Est />
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Roughly today&apos;s market
              </p>
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            If you move, Prop 19 may let you carry your lower assessment to your
            next California home. Whether it pencils out depends on your plans
            {' \u2014 '}happy to walk through it.
          </p>
        </section>

        {/* street sales */}
        <section>
          <SectionLabel>Recorded sales on your street</SectionLabel>
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-surface text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-[560]">Address</th>
                  <th className="px-3 py-2 font-[560]">Document</th>
                  <th className="px-3 py-2 font-[560]">Recorded</th>
                  <th className="px-3 py-2 text-right font-[560]">Price</th>
                </tr>
              </thead>
              <tbody>
                {STREET_SALES.map((s) => (
                  <tr key={s.doc} className="border-t border-line">
                    <td className="px-3 py-2 text-ink">{s.address}</td>
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">
                      {s.doc}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {shortDate(s.date)}
                    </td>
                    <td className="px-3 py-2 text-right font-[560] text-ink tabular-nums">
                      {currency(s.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* loan block */}
        <section>
          <SectionLabel>The loan on record</SectionLabel>
          <div className="rounded-2xl border border-line bg-white p-4 text-[14px] leading-relaxed text-ink">
            A deed of trust for{' '}
            <span className="font-[620] tabular-nums">
              {currency(RECORD.loanAmount)}
            </span>{' '}
            was recorded {shortDate(RECORD.loanRecorded)} with{' '}
            {RECORD.lender}. No reconveyance has been recorded since.
            <p className="mt-2 text-[13px] text-muted-foreground">
              The public record shows the original loan amount, not your current
              balance {'\u2014'} we never estimate a payoff.
            </p>
          </div>
        </section>

        {/* CTA */}
        <a
          href="#"
          className="inline-flex h-11 items-center justify-center rounded-lg px-5 text-[15px] font-[620] text-white"
          style={{ backgroundColor: brandColor }}
        >
          Ask {agentName.split(' ')[0]} about your Prop 19 options
        </a>
      </div>

      {/* footer links */}
      <div className="border-t border-line px-5 py-4 text-[12px] text-muted-foreground">
        <a href="/unsubscribe" className="underline underline-offset-2">
          Update my address
        </a>
        <span className="px-2">{'\u00b7'}</span>
        <a href="/unsubscribe" className="underline underline-offset-2">
          Unsubscribe
        </a>
        <p className="mt-2">
          Figures drawn from Los Angeles County recorded documents. Estimates
          are labeled. Not tax advice.
        </p>
      </div>
    </article>
  )
}
