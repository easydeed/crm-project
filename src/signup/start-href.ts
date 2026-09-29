/** Step 2 of signup, and "find my closings again" from Settings, prefilled with the saved id. */
export function startHref(mlsAgentId?: string | null) {
  return mlsAgentId ? `/app/start?agent=${encodeURIComponent(mlsAgentId)}` : '/app/start'
}
