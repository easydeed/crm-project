export const CALL_TAGS = {
  sold_nearby: 'Big sale next door',
  loan_paid_off: 'Paid off their loan',
  tax_upside: 'Taxes worth a talk',
  quiet_a_while: 'Been a while',
} as const

export type CallKind = keyof typeof CALL_TAGS

export function callTag(kind: string) {
  if (kind in CALL_TAGS) return CALL_TAGS[kind as CallKind]
  return 'Worth a call'
}
