import { defineConfig } from 'drizzle-kit'
import { loadDatabaseUrl } from './src/config/database-url'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: loadDatabaseUrl(),
  },
})
