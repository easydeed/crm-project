import { isLocalDatabaseUrl } from './database-url'

/**
 * A browser test against a scratch database on this machine: ONRECORD_E2E=1 and a
 * DATABASE_URL whose host is local. Any other host keeps production behavior, so the
 * flag alone can never switch a deployed app into test mode.
 */
export function isLocalE2E(): boolean {
  return process.env.ONRECORD_E2E === '1' && isLocalDatabaseUrl(process.env.DATABASE_URL)
}
