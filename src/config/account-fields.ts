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
