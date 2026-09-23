import Link from 'next/link'
import { linkClass } from '@/app/app/people/ui'
import type { ContactListRow } from '@/db/contacts'
import { contactStatusLabel } from '@/people/status'

export function PeopleList({
  rows,
  selected,
  onToggle,
  onToggleAll,
}: {
  rows: ContactListRow[]
  selected: string[]
  onToggle: (id: string) => void
  onToggleAll: () => void
}) {
  const selectedSet = new Set(selected)
  const allSelected = rows.length > 0 && rows.every((row) => selectedSet.has(row.id))

  return (
    <div className="mt-6">
      <label className="flex items-center gap-2 text-[15px]">
        <input
          className="size-4 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          aria-label="Select all"
        />
        Select all
      </label>
      <ul className="mt-4 flex flex-col gap-4">
        {rows.map((row) => (
          <li
            key={row.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 text-[15px]"
          >
            <input
              className="mt-1 size-4 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              type="checkbox"
              checked={selectedSet.has(row.id)}
              onChange={() => onToggle(row.id)}
              aria-label={`Select ${row.name}`}
            />
            <div className="min-w-0">
              <Link className={`${linkClass} font-medium no-underline hover:underline`} href={`/app/people/${row.id}`}>
                {row.name}
              </Link>
              <p className="break-words">{row.addressRaw}</p>
              <Link className={linkClass} href={`/app/people/${row.id}/edit`}>
                Edit
              </Link>
            </div>
            <p className="text-right">
              {contactStatusLabel(row.status)}
              {row.unsubscribed ? <span className="block">Unsubscribed</span> : null}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
