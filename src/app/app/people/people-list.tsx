import { contactStatusLabel, type ContactListRow } from '@/db/contacts'

export function PeopleList({ rows }: { rows: ContactListRow[] }) {
  return (
    <ul className="mt-6 flex flex-col gap-4">
      {rows.map((row) => (
        <li key={row.id} className="max-w-xl text-[15px]">
          <p className="font-medium">{row.name}</p>
          <p>{row.addressRaw}</p>
          <p>{contactStatusLabel(row.status)}</p>
          {row.candidates.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1">
              {row.candidates.map((candidate) => (
                <li key={`${row.id}-${candidate.rank}`}>{candidate.reason}</li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
