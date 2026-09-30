import type { PropertyRecord } from '@/lib/types'
import { currency, shortDate } from '@/lib/format'
import { cn } from '@/lib/utils'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[14px] font-[560] text-ink tabular-nums">
        {value}
      </dd>
    </div>
  )
}

export function RecordBlock({
  record,
  address,
  className,
  showLoan = true,
}: {
  record: PropertyRecord
  address: string
  className?: string
  showLoan?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-white p-4',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[13px] font-[620] text-ink">{address}</span>
        <span className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-[560] text-muted-foreground">
          County record
        </span>
      </div>
      <dl className="divide-y divide-line">
        <Row label="Grant deed recorded" value={shortDate(record.deedRecorded)} />
        <Row label="Document number" value={record.docNumber} />
        <Row label="Recorded price" value={currency(record.recordedPrice)} />
        <Row label="Vesting" value={record.vesting} />
        {showLoan && (
          <>
            <Row
              label="Deed of trust"
              value={`${currency(record.loanAmount)} \u00b7 ${record.lender}`}
            />
            <Row
              label="Reconveyance"
              value={
                record.reconveyed
                  ? 'Full reconveyance recorded'
                  : 'None recorded'
              }
            />
          </>
        )}
      </dl>
    </div>
  )
}
