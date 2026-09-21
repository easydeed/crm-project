import { normalizeUsPhone } from '@/config/phone'
import {
  DIRECTIONALS,
  STREET_SUFFIXES,
  SUFFIX_LABEL,
  resolveCity,
} from './dictionaries'
import { collapse, titleCase } from './text'
import type { NormalizedAddress } from './types'

const UNIT_RE =
  /\b(?:apt|apartment|unit|ste|suite|bldg|building|fl|floor)\.?\s*#?\s*[a-z0-9-]+\b|#\s*[a-z0-9-]+/gi
const UNIT_CAPTURE =
  /\b(?:apt|apartment|unit|ste|suite|bldg|building|fl|floor)\s*#?\s*([a-z0-9-]+)\b|#\s*([a-z0-9-]+)/i

export function nonAddressReason(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return 'No address was given'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'This looks like an email, not a street address'
  }
  if (looksLikePhone(trimmed)) {
    return 'This looks like a phone number, not a street address'
  }
  const folded = collapse(trimmed)
  if (/\b(p o box|po box|pobox|post office box)\b/.test(folded)) {
    return 'This looks like a PO Box, not a house'
  }
  if (/\bgeneral delivery\b/.test(folded)) {
    return 'This looks like general delivery, not a house'
  }
  return null
}

function looksLikePhone(raw: string): boolean {
  const letters = raw.replace(/[^a-zA-Z]/g, '')
  if (letters.length >= 3) return false
  return Boolean(normalizeUsPhone(raw))
}

export function looksLikeBareCity(raw: string): boolean {
  const work = collapse(raw)
    .replace(/\b(ca|california)\b/g, '')
    .replace(/\b\d{5}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return Boolean(work && resolveCity(work))
}

export function parseAddress(raw: string): NormalizedAddress | null {
  const stripped = stripZipAndState(raw.trim())
  const { rest, unit } = takeUnit(stripped.rest)
  const parts = rest
    .split(',')
    .map((part) => collapse(part))
    .filter(Boolean)

  let streetPart = ''
  let city: string | null = null

  if (parts.length >= 2) {
    streetPart = parts[0]
    const cityRaw = parts.slice(1).join(' ')
    city = resolveCity(cityRaw) ?? (cityRaw ? titleCase(cityRaw) : null)
  } else {
    const tokens = collapse(rest).split(' ').filter(Boolean)
    streetPart = tokens.join(' ')
    for (let n = Math.min(3, tokens.length); n >= 1; n--) {
      const resolved = resolveCity(tokens.slice(-n).join(' '))
      if (resolved) {
        city = resolved
        streetPart = tokens.slice(0, -n).join(' ')
        break
      }
    }
  }

  const street = parseStreet(streetPart)
  if (!street.number || !street.name) return null

  return {
    number: street.number,
    name: street.name,
    street: formatStreet(street.name, street.suffix, street.directional),
    directional: street.directional,
    suffix: street.suffix,
    unit,
    city,
    zip: stripped.zip,
  }
}

function stripZipAndState(raw: string): { rest: string; zip: string | null } {
  let rest = raw
  let zip: string | null = null
  const zipAtEnd = rest.match(/[,\s]*(\d{5})(?:-\d{4})?\s*$/)
  if (zipAtEnd) {
    zip = zipAtEnd[1]
    rest = rest.slice(0, rest.length - zipAtEnd[0].length)
  }
  rest = rest.replace(/[,\s]*\b(ca|california)\s*$/i, '').trim()
  return { rest, zip }
}

function takeUnit(raw: string): { rest: string; unit: string | null } {
  const captured = collapse(raw).match(UNIT_CAPTURE)
  const unit = captured ? (captured[1] || captured[2] || '').toLowerCase() : null
  UNIT_RE.lastIndex = 0
  return { rest: raw.replace(UNIT_RE, ' '), unit }
}

function parseStreet(streetPart: string) {
  const tokens = collapse(streetPart).split(' ').filter(Boolean)
  let number: string | null = null
  let directional: string | null = null
  let suffix: string | null = null

  if (tokens[0] && /^\d+[a-z]?$/.test(tokens[0])) {
    number = tokens.shift() ?? null
  }
  if (tokens[0] && DIRECTIONALS[tokens[0]]) {
    directional = DIRECTIONALS[tokens.shift() as string]
  }
  if (tokens.length && DIRECTIONALS[tokens[tokens.length - 1]]) {
    const trailing = DIRECTIONALS[tokens[tokens.length - 1]]
    tokens.pop()
    directional = directional ?? trailing
  }
  if (tokens.length && STREET_SUFFIXES[tokens[tokens.length - 1]]) {
    suffix = STREET_SUFFIXES[tokens.pop() as string]
  }

  return { number, directional, suffix, name: tokens.join(' ') }
}

export function streetNameNorm(address: string): string {
  const parsed = parseAddress(address)
  if (parsed?.name) return parsed.name
  return parseStreet(address.split(',')[0] ?? '').name
}

function formatStreet(
  name: string,
  suffix: string | null,
  directional: string | null,
): string {
  const parts: string[] = []
  if (directional) parts.push(directional.toUpperCase())
  if (name) parts.push(titleCase(name))
  if (suffix) parts.push(SUFFIX_LABEL[suffix] ?? suffix)
  return parts.join(' ')
}
