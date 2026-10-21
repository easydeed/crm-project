import { createHash } from 'node:crypto'

type Identity = {
  email: string | null
  name: string
  addressRaw: string
  parcelId: string | null
  closeDate: string | null
  status: string
}

/** Identity and house must still match the version used to compose the note. */
export function recipientFingerprint(person: Identity): string {
  return createHash('sha256').update(JSON.stringify([
    person.email?.trim().toLowerCase() ?? null, person.name, person.addressRaw,
    person.parcelId, person.closeDate, person.status,
  ])).digest('hex')
}
