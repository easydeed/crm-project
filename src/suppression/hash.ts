import { createHash } from 'node:crypto'

/**
 * sha256 of the lowercased, trimmed address. Must match the SQL in
 * drizzle/0004_backfill_suppressions.sql: encode(sha256(convert_to(lower(btrim(email)), 'UTF8')), 'hex').
 */
export function emailHash(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex')
}

/** The same hash, computed in SQL, for joining suppressions to contacts. */
export const EMAIL_HASH_SQL = (column: string) =>
  `encode(sha256(convert_to(lower(btrim(${column})), 'UTF8')), 'hex')`
