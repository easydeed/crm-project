import Link from 'next/link'
import { CallEntryItem } from '@/app/app/call-entry'
import type { CallList } from '@/app/app/call-list-view'
import { TextNoticeLine } from '@/app/app/text-notice'
import type { TextNotice } from '@/text/text-notice'
import { linkClass, mutedClass, panelBodyClass, panelClass, panelHeaderClass } from '@/app/app/people/ui'

function Empty({ href, label, text }: { href: string; label: string; text: string }) {
  return (
    <div className={panelBodyClass}>
      <p className="max-w-xl text-[17px]">{text}</p>
      <Link className={`mt-3 inline-block ${linkClass}`} href={href}>
        {label}
      </Link>
    </div>
  )
}

export function CallListSection({ list, readOnly, textNotice = null }: { list: CallList; readOnly: boolean; textNotice?: TextNotice }) {
  return (
    <section aria-labelledby="call-list-heading" className={panelClass}>
      <h2 className={panelHeaderClass} id="call-list-heading">
        Worth a call this month
      </h2>
      {/* Every state sits in the one panel, each block divided by the rule. */}
      <div className="divide-y divide-rule">
        {textNotice ? (
          <div className={panelBodyClass}>
            <TextNoticeLine notice={textNotice} />
          </div>
        ) : null}
        {list.kind === 'no-people' ? (
          <Empty
            href="/app/people/import"
            label="Add your people"
            text="Names show up here once your people are in and matched to a house."
          />
        ) : null}
        {list.kind === 'no-matches' ? (
          <Empty
            href="/app/people/review"
            label="Open the review queue"
            text="No one is matched to a house yet, so there is nothing to call about."
          />
        ) : null}
        {list.kind === 'list' && list.entries.length ? (
          // Ranked: an <ol>, so a screen reader counts the rows the numerals show.
          <ol className="divide-y divide-rule">
            {list.entries.map((entry, index) => (
              <CallEntryItem entry={entry} key={entry.contactId} rank={index + 1} readOnly={readOnly} />
            ))}
          </ol>
        ) : null}
        {list.kind === 'list' && list.quiet ? (
          <p className={`${panelBodyClass} ${mutedClass}`}>Quiet month. That happens.</p>
        ) : null}
      </div>
    </section>
  )
}
