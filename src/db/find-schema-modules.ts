import { readdirSync } from 'node:fs'

/**
 * Every schema module in src/db, found by name rather than listed, so a new
 * schema-*.ts file is covered by the checks that read the schema the day it appears.
 */
export function schemaModuleFiles(dir = new URL('.', import.meta.url)): string[] {
  return readdirSync(dir)
    .filter((name) => /^schema(-[a-z0-9-]+)?\.ts$/.test(name))
    .sort()
}
