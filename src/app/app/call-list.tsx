import Link from 'next/link'
import { CALL_TAGS } from '@/app/app/call-tags'
import type { CallEntry, CallList } from '@/app/app/call-list-view'
import { buttonClass, linkClass, mutedClass } from '@/app/app/people/ui'

function Entry({ entry }: { entry: CallEntry }) {
  const tag = CALL_TAGS[entry.kind]
  return (
    <li className="flex flex-wrap items-start justify-between gap-4 border-t border-foreground/15 py-5">
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold">{entry.name}</p>
        <p className="mt-2">
          <span
            className={`inline-block rounded-full px-3 py-0.5 text-[15px] ${tag.className}`}
            data-tag-color={tag.color}
          >
            {tag.label}
          </span>
        </p>
        <p className="mt-2 text-[15px]">{entry.sentence}</p>
        <p className={`mt-1 ${mutedClass}`}>
          {entry.address}
          {entry.closeDate ? ` · Closed ${entry.closeDate}` : null}
        </p>
      </div>
      {/* OR-017b wires Call. Until then it renders disabled with no handler. */}
      <button className={`${buttonClass} min-h-11`} disabled type="button">
        Call
      </button>
    </li>
  )
}

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

export function CallListSection({ list }: { list: CallList }) {
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
                <Entry entry={entry} key={entry.contactId} />
              ))}
            </ul>
          ) : null}
          {list.quiet ? <p className={`mt-4 ${mutedClass}`}>Quiet month. That happens.</p> : null}
        </>
      ) : null}
    </section>
  )
}
