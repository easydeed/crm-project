import type { BillingInvoice } from '@/billing/gateway'
import { formatDollars } from '@/config/costs'
import { formatBillingDate } from '@/app/app/settings/billing/billing-copy'
import { linkClass, panelBodyClass } from '@/app/app/people/ui'

const INVOICE_STATUS: Record<string, string> = {
  paid: 'Paid',
  open: 'Not paid yet',
  void: 'Voided',
  uncollectible: 'Not collected',
  draft: 'Being prepared',
}

export function InvoiceList({ invoices, timezone }: { invoices: BillingInvoice[]; timezone: string | null }) {
  if (invoices.length === 0) {
    return <p className={`text-[15px] ${panelBodyClass}`}>No invoices yet. Your first one appears here after the first charge.</p>
  }
  return (
    <ul className="divide-y divide-rule text-[15px]">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3 sm:px-6">
          <span className="min-w-[180px]">{formatBillingDate(invoice.created, timezone)}</span>
          <span className="font-semibold">{formatDollars(invoice.amountCents)}</span>
          <span>{INVOICE_STATUS[invoice.status] ?? invoice.status}</span>
          {invoice.url ? (
            // Pushed right, it stands alone (OR-046): 44px on a phone.
            <a className={`tap ml-auto ${linkClass}`} href={invoice.url}>
              {invoice.status === 'open' ? 'Pay this invoice' : 'View invoice'}
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
