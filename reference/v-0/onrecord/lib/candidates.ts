import type { Contact } from './types'

export type Candidate = {
  apn: string
  address: string
  owner: string
  lastDeed: string
}

/** Deterministic candidate parcels for a review row. */
export function candidatesFor(contact: Contact): Candidate[] {
  const [num, ...rest] = contact.address.replace(/ Apt.*| #.*/i, '').split(' ')
  const street = rest.join(' ')
  const base = Number.parseInt(num, 10) || 100
  const last = contact.name.split(' ').slice(-1)[0]

  return [
    {
      apn: `8${String(371000 + base).slice(0, 3)}-0${String(10 + (base % 40))}-0${String(1 + (base % 9))}`,
      address: `${base} ${street}, ${contact.city}`,
      owner: `${last}, ${contact.name.split(' ')[0]}`,
      lastDeed: 'Grant deed 2020-2021',
    },
    {
      apn: `8${String(371000 + base + 2).slice(0, 3)}-0${String(12 + (base % 38))}-0${String(2 + (base % 7))}`,
      address: `${base + 2} ${street}, ${contact.city}`,
      owner: 'Occupant of record',
      lastDeed: 'Grant deed 2018',
    },
    {
      apn: `8${String(371000 + base + 4).slice(0, 3)}-0${String(9 + (base % 30))}-0${String(3 + (base % 5))}`,
      address: `${base} ${street} Unit B, ${contact.city}`,
      owner: 'Occupant of record',
      lastDeed: 'Grant deed 2015',
    },
  ]
}
