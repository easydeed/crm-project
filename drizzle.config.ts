import { defineConfig } from 'drizzle-kit'
import { loadDatabaseUrl } from './src/config/database-url'

export default defineConfig({
  schema: [
    './src/db/schema.ts',
    './src/db/schema-jobs.ts',
    './src/db/schema-mail.ts',
    './src/db/schema-call-lists.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: loadDatabaseUrl(),
  },
})
