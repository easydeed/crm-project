import type { BillingInvoice } from '@/billing/gateway'
import { formatDollars } from '@/config/costs'
import { formatBillingDate } from '@/app/app/settings/billing/billing-copy'

const linkClass =
  'underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

const INVOICE_STATUS: Record<string, string> = {
  paid: 'Paid',
  open: 'Not paid yet',
  void: 'Voided',
  uncollectible: 'Not collected',
  draft: 'Being prepared',
}

export function InvoiceList({ invoices, timezone }: { invoices: BillingInvoice[]; timezone: string | null }) {
  if (invoices.length === 0) {
    return <p className="mt-3 text-[15px]">No invoices yet. Your first one appears here after the first charge.</p>
  }
  return (
    <ul className="mt-3 flex flex-col gap-2 text-[15px]">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="flex flex-wrap gap-x-4">
          <span>{formatBillingDate(invoice.created, timezone)}</span>
          <span>{formatDollars(invoice.amountCents)}</span>
          <span>{INVOICE_STATUS[invoice.status] ?? invoice.status}</span>
          {invoice.url ? (
            <a className={linkClass} href={invoice.url}>
              {invoice.status === 'open' ? 'Pay this invoice' : 'View invoice'}
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
