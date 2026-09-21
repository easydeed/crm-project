import { formatUsPhone } from '@/config/phone'
import { contactStatusLabel, type ContactMatchStatus } from '@/people/status'

export type ExportContact = {
  name: string
  email: string
  phone: string | null
  addressRaw: string
  closeDate: string | null
  notes: string | null
  status: ContactMatchStatus
  groupNames: string[]
  parcelAddress: string | null
  parcelApn: string | null
}

export const EXPORT_COLUMNS = [
  'Name',
  'Email',
  'Phone',
  'Address',
  'Close date',
  'Notes',
  'Status',
  'Groups',
  'Parcel address',
  'APN',
] as const

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function phoneOut(phone: string | null) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 ? formatUsPhone(digits) : phone
}

export function contactsToCsv(rows: ExportContact[]) {
  const lines = [
    EXPORT_COLUMNS.join(','),
    ...rows.map((row) =>
      [
        row.name,
        row.email,
        phoneOut(row.phone),
        row.addressRaw,
        row.closeDate ?? '',
        row.notes ?? '',
        contactStatusLabel(row.status),
        row.groupNames.join('; '),
        row.parcelAddress ?? '',
        row.parcelApn ?? '',
      ]
        .map((value) => csvCell(value))
        .join(','),
    ),
  ]
  return `${lines.join('\r\n')}\r\n`
}

export function peopleExportFilename(now = new Date()) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `people-${year}-${month}-${day}.csv`
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
