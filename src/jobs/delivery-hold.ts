/** Only this current producer marker proves an identity hold preceded an attempt.
 * Older generic stale-content errors may have overwritten a provider refusal.
 */
export const CHANGED_BEFORE_ATTEMPT = 'Person or house changed after composition. No provider attempt was made. Review before sending.'

export function changedRecipientHold(row: {
  error: string | null
  composedFingerprint: string | null
  deliveryClaimedAt: Date | null
  providerId: string | null
}) {
  if (row.error !== null) return `${row.error || 'Previous delivery failure.'} Person or house also changed after composition.`
  if (!row.composedFingerprint) return 'Composition identity proof is missing. Reconcile delivery history before rebuilding.'
  if (row.deliveryClaimedAt !== null || row.providerId !== null) return 'Delivery outcome requires reconciliation. Person or house also changed after composition.'
  return CHANGED_BEFORE_ATTEMPT
}
