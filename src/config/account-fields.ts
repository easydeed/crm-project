export function parseOptionalDre(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return { ok: true as const, dre: null }
  if (!/^\d{7,8}$/.test(trimmed)) {
    return { ok: false as const, message: 'DRE number must be 7 or 8 digits.' }
  }
  return { ok: true as const, dre: trimmed }
}

export function parseOptionalReplyTo(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return { ok: true as const, replyTo: null }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false as const, message: 'Reply-to must be a valid email.' }
  }
  return { ok: true as const, replyTo: trimmed.toLowerCase() }
}

export function parseRequiredName(value: string) {
  const name = value.trim()
  if (!name) return { ok: false as const, message: 'Full name is required.' }
  return { ok: true as const, name }
}

/**
 * An MLS agent handle: letters and digits, with dots, dashes or underscores. The feed answers
 * an empty list for any id it doesn't know, so this shape check is the only "wrong id" we can
 * tell apart from an agent with no closings.
 */
const MLS_AGENT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/
export const MLS_AGENT_ID_MESSAGE = "That doesn't look like an MLS agent ID. It's letters and numbers, with no spaces."

export function parseOptionalMlsAgentId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return { ok: true as const, mlsAgentId: null }
  if (!MLS_AGENT_ID.test(trimmed)) return { ok: false as const, message: MLS_AGENT_ID_MESSAGE }
  return { ok: true as const, mlsAgentId: trimmed }
}
