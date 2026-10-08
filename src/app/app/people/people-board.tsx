'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { GroupManager } from '@/app/app/people/group-manager'
import { PeopleBulkBar } from '@/app/app/people/people-bulk-bar'
import { PeopleFilters } from '@/app/app/people/people-filters'
import { PeopleList } from '@/app/app/people/people-list'
import { buttonClass, fieldClass, linkClass, panelBodyClass, panelClass, panelStripClass } from '@/app/app/people/ui'
import type { ContactListRow } from '@/db/contacts'
import type { GroupListRow } from '@/db/groups'
import { contactsToCsv, downloadCsv, peopleExportFilename } from '@/people/export'
import { filterPeople } from '@/people/filter'
import { isInReviewQueue } from '@/people/review-state'
import type { ContactMatchStatus } from '@/people/status'
import { parseLeftOutParam, parseNoEmailParam, parseStatusParam } from '@/people/url'

export function PeopleBoard({
  rows,
  groups,
  readOnly,
  statusFromUrl,
  groupFromUrl,
  leftOutFromUrl,
  noEmailFromUrl,
}: {
  rows: ContactListRow[]
  groups: GroupListRow[]
  readOnly: boolean
  statusFromUrl?: ContactMatchStatus
  groupFromUrl?: string
  leftOutFromUrl?: boolean
  noEmailFromUrl?: boolean
}) {
  const router = useRouter()
  const params = useSearchParams()
  const status = parseStatusParam(params.get('status')) ?? statusFromUrl
  const leftOut = parseLeftOutParam(params.get('leftOut')) || Boolean(leftOutFromUrl)
  const noEmail = parseNoEmailParam(params.get('noEmail')) || Boolean(noEmailFromUrl)
  const queueCount = rows.filter((row) => isInReviewQueue(row.status, row.reviewState)).length
  const groupId =
    (params.get('group') ?? groupFromUrl ?? undefined) &&
    groups.some((group) => group.id === (params.get('group') ?? groupFromUrl))
      ? (params.get('group') ?? groupFromUrl)
      : undefined
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const visible = useMemo(
    () => filterPeople(rows, { status, groupId, q: query, leftOut, noEmail }),
    [rows, status, groupId, query, leftOut, noEmail],
  )
  const selectedSet = new Set(selected)
  const selectedRows = rows.filter((row) => selectedSet.has(row.id))

  const refresh = useCallback(() => {
    setSelected([])
    router.refresh()
  }, [router])

  return (
    <div>
      {/* The title row's second line: the count, then the two ways to add to the list. */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="text-[17px] text-muted-ink">
          {rows.length === 1 ? '1 person' : `${rows.length} people`}
        </p>
        <p className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {queueCount > 0 ? (
            <Link className={`tap ${linkClass}`} href="/app/people/review">
              Review them
            </Link>
          ) : null}
          <Link className={`${buttonClass} tap inline-flex items-center`} href="/app/people/import">
            Add people
          </Link>
        </p>
      </div>
      {rows.length === 0 ? (
        <section className={`mt-5 ${panelClass}`}>
          <p className={`max-w-xl text-[17px] ${panelBodyClass}`}>
            No people yet. Add a list to get started.
          </p>
        </section>
      ) : (
        <>
          <section aria-label="Your people" className={`mt-5 ${panelClass}`}>
            <div className={panelStripClass}>
              <label className="block max-w-sm text-[15px] font-semibold">
                Search
                <input
                  className={fieldClass}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, email, or address"
                />
              </label>
              <PeopleFilters rows={rows} groups={groups} status={status} groupId={groupId} noEmail={noEmail} />
            </div>
            {visible.length === 0 ? (
              <p className={`max-w-xl text-[17px] ${panelBodyClass}`}>
                {query.trim()
                  ? 'No people match that search.'
                  : 'No people match that filter.'}
              </p>
            ) : (
              <PeopleList
                rows={visible}
                selected={selected}
                onToggle={(id) =>
                  setSelected((current) =>
                    current.includes(id)
                      ? current.filter((item) => item !== id)
                      : [...current, id],
                  )
                }
                onToggleAll={() =>
                  setSelected((current) => {
                    const visibleIds = visible.map((row) => row.id)
                    const allOn = visibleIds.every((id) => current.includes(id))
                    return allOn
                      ? current.filter((id) => !visibleIds.includes(id))
                      : Array.from(new Set([...current, ...visibleIds]))
                  })
                }
              />
            )}
          </section>
          <p className="mt-3">
            <button
              className={`${linkClass} min-h-11`}
              type="button"
              onClick={() =>
                downloadCsv(peopleExportFilename(), contactsToCsv(visible))
              }
            >
              Export this list
            </button>
          </p>
        </>
      )}
      <PeopleBulkBar
        selected={selected}
        groups={groups}
        names={selectedRows.map((row) => row.name)}
        readOnly={readOnly}
        onExport={() => downloadCsv(peopleExportFilename(), contactsToCsv(selectedRows))}
        onCleared={refresh}
      />
      <GroupManager groups={groups} readOnly={readOnly} onSaved={refresh} />
    </div>
  )
}
