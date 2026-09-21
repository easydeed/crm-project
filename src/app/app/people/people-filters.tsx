import Link from 'next/link'
import { linkClass } from '@/app/app/people/ui'
import type { GroupListRow } from '@/db/groups'
import { countByStatus } from '@/people/filter'
import { STATUS_FILTERS, type ContactMatchStatus } from '@/people/status'
import { peopleListHref } from '@/people/url'

export function PeopleFilters({
  rows,
  groups,
  status,
  groupId,
}: {
  rows: Array<{ status: ContactMatchStatus; groupIds: string[] }>
  groups: GroupListRow[]
  status?: ContactMatchStatus
  groupId?: string
}) {
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
                : peopleListHref({ status: id, groupId })
            return (
              <Link
                key={item.id}
                className={`${linkClass} ${active ? 'font-semibold' : ''}`}
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
              className={`${linkClass} ${!groupId ? 'font-semibold' : ''}`}
              href={peopleListHref({ status })}
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
                  className={`${linkClass} ${active ? 'font-semibold' : ''}`}
                  href={peopleListHref({ status, groupId: group.id })}
                  aria-current={active ? 'page' : undefined}
                >
                  {group.name} ({count})
                </Link>
              )
            })}
          </p>
        </div>
      ) : null}
    </div>
  )
}
