import type { SignalKind } from '@/signals/types'

export type CallTag = { label: string; color: 'coral' | 'green' | 'blue' | 'grey'; className: string }

// Text on tint, as token pairs from the contrast test (tokens.test.ts PAIRS), light and dark.
export const CALL_TAGS: Record<SignalKind, CallTag> = {
  sold_nearby: {
    label: 'Big sale next door',
    color: 'coral',
    className: 'bg-coral-soft text-coral-text',
  },
  loan_paid_off: {
    label: 'Paid off their loan',
    color: 'green',
    className: 'bg-green-soft text-green-text',
  },
  tax_upside: {
    label: 'Taxes worth a talk',
    color: 'blue',
    className: 'bg-blue-soft text-foreground',
  },
  quiet_a_while: {
    label: 'Been a while',
    color: 'grey',
    className: 'bg-surface text-muted-ink',
  },
}
