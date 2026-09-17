import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  loadDatabasePoolerUrl,
  loadDatabaseUrl,
  usesTransactionPooler,
} from '../config/database-url'
import * as schema from './schema'

export function createPostgresClient(url: string) {
  return postgres(url, {
    max: 1,
    prepare: !usesTransactionPooler(url),
    ssl: 'require',
  })
}

export function createDb(url: string) {
  const client = createPostgresClient(url)
  return { client, db: drizzle(client, { schema }) }
}

export function createSessionDb() {
  return createDb(loadDatabaseUrl())
}

export function createRuntimeDb() {
  return createDb(loadDatabasePoolerUrl())
}
