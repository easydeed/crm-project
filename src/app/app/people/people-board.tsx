'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { GroupManager } from '@/app/app/people/group-manager'
import { PeopleBulkBar } from '@/app/app/people/people-bulk-bar'
import { PeopleFilters } from '@/app/app/people/people-filters'
import { PeopleList } from '@/app/app/people/people-list'
import { fieldClass, linkClass } from '@/app/app/people/ui'
import type { ContactListRow } from '@/db/contacts'
import type { GroupListRow } from '@/db/groups'
import { contactsToCsv, downloadCsv, peopleExportFilename } from '@/people/export'
import { filterPeople } from '@/people/filter'
import type { ContactMatchStatus } from '@/people/status'
import { parseStatusParam } from '@/people/url'

export function PeopleBoard({
  rows,
  groups,
  readOnly,
  statusFromUrl,
  groupFromUrl,
}: {
  rows: ContactListRow[]
  groups: GroupListRow[]
  readOnly: boolean
  statusFromUrl?: ContactMatchStatus
  groupFromUrl?: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const status = parseStatusParam(params.get('status')) ?? statusFromUrl
  const groupId =
    (params.get('group') ?? groupFromUrl ?? undefined) &&
    groups.some((group) => group.id === (params.get('group') ?? groupFromUrl))
      ? (params.get('group') ?? groupFromUrl)
      : undefined
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const visible = useMemo(
    () => filterPeople(rows, { status, groupId, q: query }),
    [rows, status, groupId, query],
  )
  const selectedSet = new Set(selected)
  const selectedRows = rows.filter((row) => selectedSet.has(row.id))

  const refresh = useCallback(() => {
    setSelected([])
    router.refresh()
  }, [router])

  return (
    <div>
      <p className="mt-3 text-[15px]">
        {rows.length === 1 ? '1 person' : `${rows.length} people`}
      </p>
      <p className="mt-3">
        <Link className={linkClass} href="/app/people/import">
          Add people
        </Link>
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 max-w-xl text-[15px]">
          No people yet. Add a list to get started.
        </p>
      ) : (
        <>
          <label className="mt-6 block max-w-xl text-[15px]">
            Search
            <input
              className={fieldClass}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email, or address"
            />
          </label>
          <PeopleFilters rows={rows} groups={groups} status={status} groupId={groupId} />
          {visible.length === 0 ? (
            <p className="mt-6 max-w-xl text-[15px]">
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
          <p className="mt-4">
            <button
              className={linkClass}
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
