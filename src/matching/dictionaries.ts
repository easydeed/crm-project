import { levenshtein } from './edit-distance'
import { collapse } from './text'

export const STREET_SUFFIXES: Record<string, string> = {
  st: 'st',
  street: 'st',
  ave: 'ave',
  avenue: 'ave',
  dr: 'dr',
  drive: 'dr',
  rd: 'rd',
  road: 'rd',
  ln: 'ln',
  lane: 'ln',
  ct: 'ct',
  court: 'ct',
  pl: 'pl',
  place: 'pl',
  blvd: 'blvd',
  boulevard: 'blvd',
  way: 'way',
  ter: 'ter',
  terrace: 'ter',
  cir: 'cir',
  circle: 'cir',
  pkwy: 'pkwy',
  parkway: 'pkwy',
}

export const SUFFIX_LABEL: Record<string, string> = {
  st: 'St',
  ave: 'Ave',
  dr: 'Dr',
  rd: 'Rd',
  ln: 'Ln',
  ct: 'Ct',
  pl: 'Pl',
  blvd: 'Blvd',
  way: 'Way',
  ter: 'Ter',
  cir: 'Cir',
  pkwy: 'Pkwy',
}

export const DIRECTIONALS: Record<string, string> = {
  n: 'n',
  north: 'n',
  s: 's',
  south: 's',
  e: 'e',
  east: 'e',
  w: 'w',
  west: 'w',
  ne: 'ne',
  northeast: 'ne',
  nw: 'nw',
  northwest: 'nw',
  se: 'se',
  southeast: 'se',
  sw: 'sw',
  southwest: 'sw',
}

const CITY_ROWS: Array<[string, string]> = [
  ['anaheim', 'Anaheim'],
  ['burbank', 'Burbank'],
  ['camarillo', 'Camarillo'],
  ['carlsbad', 'Carlsbad'],
  ['chula vista', 'Chula Vista'],
  ['corona', 'Corona'],
  ['costa mesa', 'Costa Mesa'],
  ['escondido', 'Escondido'],
  ['fontana', 'Fontana'],
  ['fullerton', 'Fullerton'],
  ['huntington beach', 'Huntington Beach'],
  ['irvine', 'Irvine'],
  ['la verne', 'La Verne'],
  ['long beach', 'Long Beach'],
  ['los angeles', 'Los Angeles'],
  ['moorpark', 'Moorpark'],
  ['moreno valley', 'Moreno Valley'],
  ['oceanside', 'Oceanside'],
  ['ojai', 'Ojai'],
  ['ontario', 'Ontario'],
  ['orange', 'Orange'],
  ['oxnard', 'Oxnard'],
  ['palm springs', 'Palm Springs'],
  ['pasadena', 'Pasadena'],
  ['pomona', 'Pomona'],
  ['rancho cucamonga', 'Rancho Cucamonga'],
  ['redlands', 'Redlands'],
  ['riverside', 'Riverside'],
  ['san bernardino', 'San Bernardino'],
  ['san diego', 'San Diego'],
  ['santa ana', 'Santa Ana'],
  ['simi valley', 'Simi Valley'],
  ['temecula', 'Temecula'],
  ['thousand oaks', 'Thousand Oaks'],
  ['upland', 'Upland'],
  ['ventura', 'Ventura'],
]

export function resolveCity(raw: string): string | null {
  const key = collapse(raw)
  if (!key) return null
  const exact = CITY_ROWS.find((row) => row[0] === key)
  if (exact) return exact[1]

  const maxDist = key.length <= 4 ? 1 : 2
  let best: { label: string; distance: number } | null = null
  for (const [cityKey, label] of CITY_ROWS) {
    const distance = levenshtein(key, cityKey)
    if (distance > maxDist) continue
    if (!best || distance < best.distance) best = { label, distance }
  }
  return best?.label ?? null
}
