import type { ReactNode } from 'react'

/**
 * A label-and-value table (OR-044, shared in OR-045): labels in a --surface column in muted ink
 * (4.56:1, the tightest pair the contrast test allows), values on the page. The call panel and the
 * person page's details both use it. `labels` sets the label column's width.
 */
export function DetailsTable({ id, className = '', children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <dl className={`overflow-hidden rounded-lg border border-rule ${className}`} id={id}>
      {children}
    </dl>
  )
}

export function DetailsRow({
  label,
  labels,
  tall = false,
  children,
}: {
  label: string
  labels: string
  tall?: boolean
  children: ReactNode
}) {
  return (
    <div className={`grid ${labels} border-t border-rule first:border-t-0`}>
      <dt className="bg-surface px-3.5 py-3 font-medium text-muted-ink">{label}</dt>
      <dd className={`min-w-0 bg-background px-3.5 py-3 ${tall ? 'flex min-h-12 items-center' : ''}`}>{children}</dd>
    </div>
  )
}
