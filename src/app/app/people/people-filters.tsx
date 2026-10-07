import Link from 'next/link'
import { linkBaseClass } from '@/app/app/people/ui'

// The current filter, marked like the top bar: dark text on --blue-soft, never blue on blue-soft.
const currentClass = 'rounded-md bg-blue-soft px-2 font-semibold text-foreground'
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
    <div className="mt-6 flex flex-col gap-4 text-[15px]">
      <div>
        <p className="font-medium">Status</p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
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
                className={`tap ${linkBaseClass} text-foreground ${active ? currentClass : ''}`}
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
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
            <Link
              className={`tap ${linkBaseClass} text-foreground ${!groupId ? currentClass : ''}`}
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
                  className={`tap ${linkBaseClass} text-foreground ${active ? currentClass : ''}`}
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
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
            <Link
              className={`tap ${linkBaseClass} text-foreground ${!noEmail ? currentClass : ''}`}
              href={peopleListHref({ status, groupId })}
              aria-current={!noEmail ? 'page' : undefined}
            >
              Everyone ({rows.length})
            </Link>
            <Link
              className={`tap ${linkBaseClass} text-foreground ${noEmail ? currentClass : ''}`}
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
