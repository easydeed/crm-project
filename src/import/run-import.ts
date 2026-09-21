import { assertWritable } from '@/auth/write-guard'
import type { SessionPayload } from '@/auth/session'
import { getRuntimeDb } from '@/db/runtime'
import {
  applyMapping,
  looksLikeHeaderRow,
  mappingIsComplete,
  roleForHeader,
} from '@/import/detect-columns'
import { importContacts } from '@/import/import-contacts'
import { parseDelimited } from '@/import/parse-csv'
import type { FieldRole, ImportRow, ImportState } from '@/import/types'

export async function runImport(
  session: SessionPayload,
  formData: FormData,
): Promise<ImportState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }

  const rows = readRows(formData)
  if (!rows.ok) return { error: rows.error }
  if (!rows.rows.length) return { error: 'Add a file or paste a list first.' }

  const { db } = getRuntimeDb()
  const result = await importContacts(db, session.accountId, rows.rows)
  return { result }
}

function readRows(
  formData: FormData,
): { ok: true; rows: ImportRow[] } | { ok: false; error: string } {
  const rawRows = formData.get('rows')
  if (typeof rawRows === 'string' && rawRows.trim()) {
    return parsePostedRows(rawRows)
  }

  const csv = String(formData.get('csv') ?? formData.get('text') ?? '')
  const table = parseDelimited(csv)
  if (!table.length) return { ok: false, error: 'Add a file or paste a list first.' }

  const mappingField = formData.get('mapping')
  const hasHeader = looksLikeHeaderRow(table[0])
  const mapping = parseMapping(mappingField, table[0], hasHeader)
  if (!mappingIsComplete(mapping)) {
    return { ok: false, error: 'Tell us which column is the name, email, and address.' }
  }
  return { ok: true, rows: applyMapping(table, mapping, hasHeader) }
}

function parseMapping(
  raw: FormDataEntryValue | null,
  firstRow: string[],
  hasHeader: boolean,
): FieldRole[] {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) return parsed.map((role) => asRole(role))
    } catch {
      return firstRow.map(() => 'skip')
    }
  }
  return hasHeader ? firstRow.map(roleForHeader) : firstRow.map(() => 'skip')
}

function asRole(value: unknown): FieldRole {
  const roles: FieldRole[] = [
    'name',
    'first',
    'last',
    'email',
    'address',
    'street',
    'city',
    'zip',
    'closeDate',
    'skip',
  ]
  return roles.includes(value as FieldRole) ? (value as FieldRole) : 'skip'
}

function parsePostedRows(
  raw: string,
): { ok: true; rows: ImportRow[] } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return { ok: false, error: 'Add a file or paste a list first.' }
    const rows: ImportRow[] = parsed.map((row, index) => ({
      line: numberOr(row?.line, index + 1),
      name: stringOr(row?.name),
      email: stringOr(row?.email),
      address: stringOr(row?.address),
      closeDate: typeof row?.closeDate === 'string' ? row.closeDate : null,
    }))
    return { ok: true, rows }
  } catch {
    return { ok: false, error: 'Add a file or paste a list first.' }
  }
}

function stringOr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
