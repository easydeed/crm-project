import type { SignalKind } from '@/signals/types'

export type CallTag = { label: string; color: 'coral' | 'green' | 'blue' | 'grey'; className: string }

// Text on tint, 5.6:1 or better in both color schemes.
export const CALL_TAGS: Record<SignalKind, CallTag> = {
  sold_nearby: {
    label: 'Big sale next door',
    color: 'coral',
    className: 'bg-[#ffe3d9] text-[#9c3a1f] dark:bg-[#4a1f12] dark:text-[#ffc9b8]',
  },
  loan_paid_off: {
    label: 'Paid off their loan',
    color: 'green',
    className: 'bg-[#dcf1e2] text-[#1d6336] dark:bg-[#10331d] dark:text-[#b6e6c4]',
  },
  tax_upside: {
    label: 'Taxes worth a talk',
    color: 'blue',
    className: 'bg-[#dde9f8] text-[#1c4a82] dark:bg-[#132a47] dark:text-[#bcd6f5]',
  },
  quiet_a_while: {
    label: 'Been a while',
    color: 'grey',
    className: 'bg-[#e6e6e6] text-[#3d3d3d] dark:bg-[#333333] dark:text-[#dedede]',
  },
}
