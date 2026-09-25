import { computeBill } from '@/addons/bill'
import { NEXT_BILL, type AddonRowData } from '@/app/app/addons/row-data'
import { formatDollars } from '@/config/costs'

/** Base plan, each add-on that is on, and the total. Display only: Stripe does not bill add-ons yet. */
export function BillBar({ baseCents, rows, enabled }: { baseCents: number; rows: AddonRowData[]; enabled: Record<string, boolean> }) {
  const bill = computeBill(baseCents, rows.map((row) => ({ ...row, enabled: enabled[row.key] === true })))
  return (
    <section aria-label="Your monthly bill" className="mt-10 rounded-md bg-foreground px-5 py-5 text-background">
      <ul className="flex flex-col gap-2 text-[15px]">
        {bill.lines.map((line) => (
          <li key={line.key} className="flex justify-between gap-6">
            <span>{line.label}</span>
            <span>{formatDollars(line.cents)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between gap-6 border-t border-background/40 pt-4 text-[17px] font-semibold">
        <span>Total a month</span>
        <span data-testid="bill-total">{formatDollars(bill.totalCents)}</span>
      </p>
      <p className="mt-2 text-[15px] text-background/80">{NEXT_BILL}</p>
    </section>
  )
}
