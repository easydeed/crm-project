export function formatAdminDate(value: Date | null) {
  if (!value) return '—'
  return value.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
