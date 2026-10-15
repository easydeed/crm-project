import { assertSafeDatabaseUrl } from './database-url'
import { PASSWORD_MIN_LENGTH, passwordMeetsRequirements } from '@/auth/password-rules'

export type DemoEnv = { url: string; password: string }

/**
 * The hosted demo's two secrets (OR-050). The seeder reads PREVIEW_DATABASE_URL and never
 * DATABASE_URL, so a dev database can't be filled by accident, and refuses the two being the same.
 * Every refusal names the variable to fix and never prints a value.
 */
export function readDemoEnv(env: Record<string, string | undefined>): DemoEnv {
  const url = env.PREVIEW_DATABASE_URL?.trim()
  const password = env.DEMO_AGENT_PASSWORD
  if (!url) throw new Error('PREVIEW_DATABASE_URL is not set.')
  try {
    assertSafeDatabaseUrl(url)
  } catch (err) {
    throw new Error(`PREVIEW_DATABASE_URL: ${(err as Error).message.replace(/^DATABASE_URL /, '')}`)
  }
  if (env.DATABASE_URL && env.DATABASE_URL.trim() === url) {
    throw new Error('PREVIEW_DATABASE_URL is the same as DATABASE_URL. The demo gets its own database.')
  }
  if (!password) throw new Error('DEMO_AGENT_PASSWORD is not set.')
  if (!passwordMeetsRequirements(password)) {
    throw new Error(`DEMO_AGENT_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} characters, the app's own rule.`)
  }
  return { url, password }
}
