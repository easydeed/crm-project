import Link from 'next/link'
import { CallEntryItem } from '@/app/app/call-entry'
import type { CallList } from '@/app/app/call-list-view'
import { linkClass, mutedClass } from '@/app/app/people/ui'

function Empty({ href, label, text }: { href: string; label: string; text: string }) {
  return (
    <>
      <p className="mt-3 max-w-xl text-[15px]">{text}</p>
      <Link className={`mt-3 inline-block ${linkClass}`} href={href}>
        {label}
      </Link>
    </>
  )
}

export function CallListSection({ list, readOnly }: { list: CallList; readOnly: boolean }) {
  return (
    <section aria-labelledby="call-list-heading" className="px-4 py-8">
      <h2 className="text-[19px] font-semibold" id="call-list-heading">
        Worth a call this month
      </h2>
      {list.kind === 'no-people' ? (
        <Empty
          href="/app/people/import"
          label="Add your people"
          text="Names show up here once your past clients are in and matched to a house."
        />
      ) : null}
      {list.kind === 'no-matches' ? (
        <Empty
          href="/app/people/review"
          label="Open the review queue"
          text="No one is matched to a house yet, so there is nothing to call about."
        />
      ) : null}
      {list.kind === 'list' ? (
        <>
          {list.entries.length ? (
            <ul className="mt-4 max-w-2xl">
              {list.entries.map((entry) => (
                <CallEntryItem entry={entry} key={entry.contactId} readOnly={readOnly} />
              ))}
            </ul>
          ) : null}
          {list.quiet ? <p className={`mt-4 ${mutedClass}`}>Quiet month. That happens.</p> : null}
        </>
      ) : null}
    </section>
  )
}
