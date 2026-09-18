import { resolveCity } from './dictionaries'
import { levenshtein } from './edit-distance'
import { parseAddress } from './normalize'
import { collapse } from './text'
import type { MatchCandidate, NormalizedAddress, Parcel } from './types'

const WEIGHT = {
  number: 42,
  name: 28,
  suffix: 8,
  directional: 8,
  city: 9,
  zip: 5,
} as const

export function scoreParcel(
  input: NormalizedAddress,
  parcel: Parcel,
): MatchCandidate {
  const parsed = parseAddress(`${parcel.address}, ${parcel.city}, CA ${parcel.zip}`)
  if (!parsed) {
    return { parcel, confidence: 0, reason: 'This house does not match' }
  }

  const nameScore = nameSimilarity(input.name, parsed.name)
  if (nameScore < 0.55) {
    return {
      parcel,
      confidence: 0.2,
      reason: 'The street name does not match this house',
    }
  }

  const numberScore =
    input.number && parsed.number && input.number === parsed.number ? 1 : 0
  const suffixScore = pairScore(input.suffix, parsed.suffix)
  const dirScore = pairScore(input.directional, parsed.directional)
  const city = compareCity(input.city, parsed.city || parcel.city)
  const zipScore = compareZip(input.zip, parsed.zip || parcel.zip.slice(0, 5))

  let confidence =
    (numberScore * WEIGHT.number +
      nameScore * WEIGHT.name +
      suffixScore * WEIGHT.suffix +
      dirScore * WEIGHT.directional +
      city.score * WEIGHT.city +
      zipScore * WEIGHT.zip) /
    100

  if (
    input.directional &&
    parsed.directional &&
    input.directional !== parsed.directional
  ) {
    confidence -= 0.3
  }

  confidence = Math.max(0, Math.min(1, confidence))

  return {
    parcel,
    confidence,
    reason: buildReason({
      number: numberScore === 1,
      name: nameScore >= 0.85,
      zip: zipScore === 1,
      cityClose: city.close && !city.exact,
    }),
  }
}

function nameSimilarity(left: string, right: string): number {
  const a = collapse(left)
  const b = collapse(right)
  if (!a || !b) return 0
  if (a === b) return 1
  return Math.max(0, 1 - levenshtein(a, b) / Math.max(a.length, b.length))
}

function pairScore(left: string | null, right: string | null): number {
  if (left && right) return left === right ? 1 : 0
  if (!left && !right) return 1
  return 0.6
}

function compareCity(inputCity: string | null, parcelCity: string) {
  const input = inputCity ? collapse(resolveCity(inputCity) ?? inputCity) : ''
  const parcel = collapse(resolveCity(parcelCity) ?? parcelCity)
  if (!input || !parcel) return { score: 0.4, exact: false, close: false }
  if (input === parcel) return { score: 1, exact: true, close: false }
  const close = levenshtein(input, parcel) <= 2
  return { score: close ? 0.85 : 0, exact: false, close }
}

function compareZip(inputZip: string | null, parcelZip: string): number {
  if (inputZip && parcelZip) return inputZip === parcelZip ? 1 : 0
  return 0.4
}

function buildReason(flags: {
  number: boolean
  name: boolean
  zip: boolean
  cityClose: boolean
}): string {
  if (flags.number && flags.name && flags.zip) {
    if (flags.cityClose) return 'Same street and number, city spelled differently'
    return 'Exact match on street number, name, and ZIP'
  }
  if (flags.name && !flags.number) return 'Street number not found on this street'
  if (flags.number && flags.name) return 'Same street and number'
  return 'Some of the address lines up with this house'
}
