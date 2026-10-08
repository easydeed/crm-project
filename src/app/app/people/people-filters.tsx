import Link from 'next/link'

/** A filter chip's shape (OR-045): 44px, ink words. Its fill comes from one of the two below, never both. */
const chipClass =
  'tap inline-flex min-h-11 items-center rounded-lg border px-3.5 text-[15px] text-foreground underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

/** A filter not in use: a --rule outline on the page. */
const restClass = 'border-rule bg-background'

// The current filter: ink words on --blue-soft, never blue on blue-soft (4.42:1).
const currentClass = 'border-blue-soft bg-blue-soft font-semibold'
import type { GroupListRow } from '@/db/groups'
import { countByStatus } from '@/people/filter'
import { STATUS_FILTERS, type ContactMatchStatus } from '@/people/status'
import { peopleListHref } from '@/people/url'

export function PeopleFilters({
  rows,
  groups,
  status,
  groupId,
  noEmail,
}: {
  rows: Array<{ status: ContactMatchStatus; groupIds: string[]; email: string | null }>
  groups: GroupListRow[]
  status?: ContactMatchStatus
  groupId?: string
  noEmail?: boolean
}) {
  const missingEmail = rows.filter((row) => !row.email).length
  const forStatus = groupId ? rows.filter((row) => row.groupIds.includes(groupId)) : rows
  const forGroups = status ? rows.filter((row) => row.status === status) : rows
  const statusCounts = countByStatus(forStatus)

  return (
    <div className="mt-4 flex flex-col gap-3 text-[15px]">
      <div>
        <p className="font-medium">Status</p>
        <p className="mt-2 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => {
            const id = item.id === 'all' ? undefined : item.id
            const count = item.id === 'all' ? statusCounts.all : statusCounts[item.id]
            const active = status === id
            const href =
              item.id === 'needs_review'
                ? '/app/people/review'
                : peopleListHref({ status: id, groupId, noEmail })
            return (
              <Link
                key={item.id}
                className={`${chipClass} ${active ? currentClass : restClass}`}
                href={href}
                aria-current={active ? 'page' : undefined}
              >
                {item.label} ({count})
              </Link>
            )
          })}
        </p>
      </div>
      {groups.length > 0 ? (
        <div>
          <p className="font-medium">Group</p>
          <p className="mt-2 flex flex-wrap gap-2">
            <Link
              className={`${chipClass} ${!groupId ? currentClass : restClass}`}
              href={peopleListHref({ status, noEmail })}
              aria-current={!groupId ? 'page' : undefined}
            >
              All people ({forGroups.length})
            </Link>
            {groups.map((group) => {
              const count = forGroups.filter((row) => row.groupIds.includes(group.id)).length
              const active = groupId === group.id
              return (
                <Link
                  key={group.id}
                  className={`${chipClass} ${active ? currentClass : restClass}`}
                  href={peopleListHref({ status, groupId: group.id, noEmail })}
                  aria-current={active ? 'page' : undefined}
                >
                  {group.name} ({count})
                </Link>
              )
            })}
          </p>
        </div>
      ) : null}
      {missingEmail > 0 || noEmail ? (
        <div>
          <p className="font-medium">Email</p>
          <p className="mt-2 flex flex-wrap gap-2">
            <Link
              className={`${chipClass} ${!noEmail ? currentClass : restClass}`}
              href={peopleListHref({ status, groupId })}
              aria-current={!noEmail ? 'page' : undefined}
            >
              Everyone ({rows.length})
            </Link>
            <Link
              className={`${chipClass} ${noEmail ? currentClass : restClass}`}
              href={peopleListHref({ status, groupId, noEmail: true })}
              aria-current={noEmail ? 'page' : undefined}
            >
              Missing an email ({missingEmail})
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  )
}
