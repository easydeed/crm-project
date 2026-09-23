import { defineConfig } from 'drizzle-kit'
import { assertSafeDatabaseUrl, loadEnvFiles } from './src/config/database-url'

// generate never connects, so it runs without DATABASE_URL. Anything that does connect
// still gets the crm-dev guard.
function credentials() {
  loadEnvFiles()
  const url = process.env.DATABASE_URL
  if (!url) return undefined
  assertSafeDatabaseUrl(url)
  return { url }
}

const dbCredentials = credentials()

export default defineConfig({
  schema: [
    './src/db/schema.ts',
    './src/db/schema-jobs.ts',
    './src/db/schema-mail.ts',
    './src/db/schema-call-lists.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  ...(dbCredentials ? { dbCredentials } : {}),
})
