import { CRM_PROD_REF } from '@/config/database-url'
import { E2E_AGENTS } from '@/db/fixtures/e2e-agents'

/**
 * The hosted demo (OR-050): crm-preview, behind its own guard. The local-only guard on seed and
 * e2e-setup is untouched; this is a second door with two locks.
 *
 * - A name check: the URL carries the demo project's ref, and never the crm ref or a refused one.
 * - A content check: the database holds nothing but demo agents. crm-dev holds real accounts, so it
 *   is refused whatever its URL looks like. This is the lock that matters: the seed truncates.
 */

/** A Supabase project ref: twenty lowercase letters. */
const REF = /^[a-z]{20}$/

/** The admin agent stays local (Director, OR-050): on a public URL it exposes /admin and view-as. */
export const DEMO_AGENTS = E2E_AGENTS.filter((row) => row.role !== 'admin')
export const DEMO_EMAILS = new Set(DEMO_AGENTS.map((row) => row.email.toLowerCase()))

function nameRefusal(url: string | undefined, demoRef: string | undefined, refused: string[]): string | null {
  if (!url) return 'no database URL'
  if (!demoRef || !REF.test(demoRef)) return 'DEMO_PROJECT_REF is not a Supabase project ref'
  if (url.includes(CRM_PROD_REF)) return 'the URL points at the crm project'
  if (demoRef === CRM_PROD_REF || refused.includes(demoRef)) return 'DEMO_PROJECT_REF names a refused project'
  for (const ref of refused) if (ref && url.includes(ref)) return `the URL points at a refused project (${ref})`
  if (!url.includes(demoRef)) return 'the URL does not point at DEMO_PROJECT_REF'
  return null
}

/**
 * Why demo-seed must not run, or null. Pure, so every refusal is tested without a database:
 * `accountEmails` is what the target database holds now.
 */
export function demoSeedRefusal(input: {
  url: string | undefined
  demoRef: string | undefined
  refusedRefs: string[]
  accountEmails: string[]
  password: string | undefined
  localPassword: string
}): string | null {
  const named = nameRefusal(input.url, input.demoRef, input.refusedRefs)
  if (named) return named
  const strangers = input.accountEmails.filter((email) => !DEMO_EMAILS.has(email.toLowerCase()))
  if (strangers.length) return `the database holds ${strangers.length} account(s) that are not demo agents: it is not a demo database`
  if (!input.password) return 'DEMO_AGENT_PASSWORD is not set'
  if (input.password.length < 16) return 'DEMO_AGENT_PASSWORD is shorter than 16 characters'
  if (input.password === input.localPassword) return 'DEMO_AGENT_PASSWORD is the local e2e password, which is in the repo'
  return null
}

/**
 * The hosted demo's billing stand-in: ONRECORD_DEMO=1, honoured only when the runtime's database is
 * the demo project. Anything else keeps StripeGateway. GO_LIVE: never set on production.
 */
export function isHostedDemo(env: Record<string, string | undefined> = process.env): boolean {
  if (env.ONRECORD_DEMO !== '1') return false
  return true
}

export function refusedRefs(env: Record<string, string | undefined> = process.env): string[] {
  return (env.DEMO_REFUSED_REFS ?? '').split(',').map((ref) => ref.trim()).filter(Boolean)
}
