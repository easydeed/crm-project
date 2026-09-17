const US_DIGITS = /^(\d{10}|1\d{10})$/

export function digitsFromPhone(value: string) {
  return value.replace(/\D/g, '')
}

export function normalizeUsPhone(value: string): string | null {
  const digits = digitsFromPhone(value)
  if (!US_DIGITS.test(digits)) return null
  return digits.length === 11 ? digits.slice(1) : digits
}

export function formatUsPhone(digits: string) {
  if (digits.length !== 10) return digits
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function parseOptionalUsPhone(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return { ok: true as const, phone: null }
  const normalized = normalizeUsPhone(trimmed)
  if (!normalized) {
    return { ok: false as const, message: 'Use a US phone number, like 909-555-0147.' }
  }
  return { ok: true as const, phone: normalized }
}
