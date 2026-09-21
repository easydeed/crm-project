import { buildLaVerneFixtures } from '@/db/fixtures/la-verne'
import { csvEscape } from '@/import/parse-csv'
import type { ImportRow } from '@/import/types'

export function laVerneImportRows(): ImportRow[] {
  return buildLaVerneFixtures().contacts.map((contact, index) => ({
    line: index + 2,
    name: contact.name,
    email: contact.email,
    address: contact.addressRaw,
    closeDate: contact.closeDate,
  }))
}

export function laVerneCsv(headers = 'Name,Email,Address,Close Date'): string {
  const lines = [headers]
  for (const row of laVerneImportRows()) {
    lines.push(
      [row.name, row.email, row.address, row.closeDate ?? ''].map(csvEscape).join(','),
    )
  }
  return lines.join('\n')
}

export function laVernePaste(): string {
  return laVerneImportRows()
    .map((row) => [row.name, row.email, row.address, row.closeDate ?? ''].join('\t'))
    .join('\n')
}
