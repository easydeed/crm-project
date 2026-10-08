import Link from 'next/link'
import { linkClass } from '@/app/app/people/ui'
import { STATUS_TAG_CLASS, UNSUBSCRIBED_TAG_CLASS } from '@/app/app/people/status-tag'
import type { ContactListRow } from '@/db/contacts'
import { contactStatusLabel } from '@/people/status'

const checkboxClass =
  'size-5.5 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

/** The name is the row's title (OR-045): ink, 17px semibold, underlined on hover. 44px tall at 390. */
const nameClass =
  'tap text-[17px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

/** Edit: a blue link 44px tall at 390 and never under 44px wide (it was 27px). */
const editClass = `tap ${linkClass} col-start-2 inline-flex min-w-11 items-center justify-center justify-self-start sm:col-start-auto sm:justify-self-auto`

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
    <div>
      <label className="flex min-h-12 items-center gap-3 border-b border-rule px-5 text-[15px] font-medium sm:px-6">
        <input className={checkboxClass} type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Select all" />
        Select all
      </label>
      <ul className="divide-y divide-rule">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 px-5 py-3.5 text-[15px] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-5 sm:px-6 ${
              selectedSet.has(row.id) ? 'bg-surface' : ''
            }`}
          >
            {/* 44x44 at 390: the label reaches past the 22px box on every side. */}
            <label className="row-span-2 flex max-sm:-m-[11px] max-sm:p-[11px] sm:row-span-1">
              <input
                className={checkboxClass}
                type="checkbox"
                checked={selectedSet.has(row.id)}
                onChange={() => onToggle(row.id)}
                aria-label={`Select ${row.name}`}
              />
            </label>
            <div className="min-w-0">
              <Link className={nameClass} href={`/app/people/${row.id}`}>
                {row.name}
              </Link>
              <p className="break-words text-muted-ink">{row.addressRaw}</p>
            </div>
            {/* Under the address at 390, its own column from sm. 44px both ways. */}
            <Link className={editClass} href={`/app/people/${row.id}/edit`}>
              Edit
            </Link>
            <p className="col-start-3 row-start-1 text-right sm:col-start-auto sm:row-start-auto sm:min-w-[124px] sm:text-center">
              <span className={STATUS_TAG_CLASS[row.status]}>{contactStatusLabel(row.status)}</span>
              {row.unsubscribed ? (
                <span className="mt-1 block">
                  <span className={UNSUBSCRIBED_TAG_CLASS}>Unsubscribed</span>
                </span>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
