import { FIELD_OPTIONS } from '@/import/detect-columns'
import type { FieldRole } from '@/import/types'

export function ColumnMapping({
  headers,
  mapping,
  onChange,
}: {
  headers: string[]
  mapping: FieldRole[]
  onChange: (index: number, role: FieldRole) => void
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="text-[15px]">Tell us what each column is.</p>
      {headers.map((header, index) => (
        <label key={`${header}-${index}`} className="flex flex-wrap items-center gap-3 text-[15px]">
          <span className="min-w-[8rem] font-medium">{header || `Column ${index + 1}`}</span>
          <select
            className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            value={mapping[index] ?? 'skip'}
            onChange={(event) => onChange(index, event.target.value as FieldRole)}
            aria-label={`This is the ${header || `column ${index + 1}`}`}
          >
            {FIELD_OPTIONS.map((option) => (
              <option key={option.role} value={option.role}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}
