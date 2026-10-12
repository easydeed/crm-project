import type { Page } from '@playwright/test'
import type { AgentKey } from '../../src/db/fixtures/e2e-agents'

export type Screen = {
  name: string
  path: string
  loggedOut?: boolean
  colorScheme?: 'light' | 'dark'
  /** Signed in as another e2e agent (OR-044a's table) rather than the seeded one. */
  as?: Exclude<AgentKey, 'dana' | 'taken'>
  prepare?: (page: Page) => Promise<void>
}
