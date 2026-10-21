import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  isLocalDatabaseUrl,
  loadDatabasePoolerUrl,
  loadDatabaseUrl,
  usesTransactionPooler,
} from '../config/database-url'
import * as schema from './schema'

export function createPostgresClient(url: string) {
  return postgres(url, {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 20,
    prepare: !usesTransactionPooler(url),
    ssl: isLocalDatabaseUrl(url) ? false : 'require',
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
