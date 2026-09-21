const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseContactName(value: string) {
  const name = value.trim()
  if (!name) return { ok: false as const, message: 'Add a name.' }
  return { ok: true as const, name }
}

export function parseContactEmail(value: string) {
  const email = value.trim()
  if (!EMAIL_RE.test(email)) {
    return { ok: false as const, message: "We need an email we can send to." }
  }
  return { ok: true as const, email }
}

export function parseContactAddress(value: string) {
  const address = value.trim()
  if (!address) return { ok: false as const, message: 'Add an address.' }
  return { ok: true as const, address }
}

export function parseCloseDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return { ok: true as const, closeDate: null }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: false as const, message: 'Use a date like 2020-06-15.' }
  }
  if (Number.isNaN(Date.parse(`${trimmed}T00:00:00`))) {
    return { ok: false as const, message: 'Use a date like 2020-06-15.' }
  }
  return { ok: true as const, closeDate: trimmed }
}

export function parseNotes(value: string) {
  const notes = value.trim()
  return { ok: true as const, notes: notes || null }
}

export function parseGroupName(value: string) {
  const name = value.trim()
  if (!name) return { ok: false as const, message: 'Add a group name.' }
  return { ok: true as const, name }
}
