'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Trash2,
  FolderPlus,
  X,
  Plus,
  Pencil,
  Check,
  SlidersHorizontal,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageHeader } from '@/components/app/page-header'
import { AddPeopleDialog } from '@/components/app/add-people-dialog'
import { Tag } from '@/components/tag'
import { STATUS_META, ENGAGEMENT_META } from '@/components/app/contact-meta'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function PeopleList() {
  const {
    contacts,
    farmContacts,
    farmStreet,
    groups,
    deleteContacts,
    addContactsToGroup,
    addGroup,
    renameGroup,
    deleteGroup,
  } = useStore()
  const searchParams = useSearchParams()
  const initialGroup = searchParams.get('group') ?? 'all'

  const [scope, setScope] = useState<'people' | 'farm'>('people')
  const [q, setQ] = useState('')
  const [group, setGroup] = useState(initialGroup)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const isFarm = scope === 'farm'

  // group management
  const [managing, setManaging] = useState(false)
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const countIn = (g: string) =>
    contacts.filter((c) => c.groups.includes(g)).length

  const filtered = useMemo(() => {
    const source = isFarm ? farmContacts : contacts
    return source.filter((c) => {
      if (!isFarm && group !== 'all' && !c.groups.includes(group)) return false
      if (!isFarm && statusFilter === 'review' && c.status === 'matched')
        return false
      if (!isFarm && statusFilter === 'matched' && c.status !== 'matched')
        return false
      if (q) {
        const hay = `${c.name} ${c.email} ${c.address} ${c.city}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [isFarm, farmContacts, contacts, group, statusFilter, q])

  const allSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id))

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map((c) => c.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function createGroup() {
    const n = newName.trim()
    if (!n) return
    if (groups.includes(n)) {
      toast.error('That group already exists.')
      return
    }
    addGroup(n)
    setNewName('')
    toast.success(`Created "${n}".`)
  }

  function commitRename(from: string) {
    const to = draft.trim()
    if (!to || to === from) {
      setEditing(null)
      return
    }
    if (groups.includes(to)) {
      toast.error('A group with that name already exists.')
      return
    }
    renameGroup(from, to)
    if (group === from) setGroup(to)
    setEditing(null)
    toast.success('Group renamed.')
  }

  const selectedIds = [...selected]

  return (
    <>
      <PageHeader
        title="People"
        subtitle={
          isFarm
            ? `${farmContacts.length} homes on ${farmStreet}.`
            : `${contacts.length} homeowners on your monthly note.`
        }
        action={isFarm ? undefined : <AddPeopleDialog />}
      />

      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
        {/* Scope: your people vs. farm */}
        <div
          className="mb-3 flex gap-2"
          role="group"
          aria-label="Choose which list to view"
        >
          <GroupChip
            label="Your people"
            count={contacts.length}
            active={!isFarm}
            onClick={() => {
              setScope('people')
              setSelected(new Set())
            }}
          />
          <GroupChip
            label="Farm"
            count={farmContacts.length}
            active={isFarm}
            onClick={() => {
              setScope('farm')
              setSelected(new Set())
            }}
          />
        </div>

        {/* Group filter strip — sphere only */}
        {!isFarm && (
        <div className="rounded-2xl border border-line bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by group"
            >
              <GroupChip
                label="All groups"
                count={contacts.length}
                active={group === 'all'}
                onClick={() => setGroup('all')}
              />
              {groups.map((g) => (
                <GroupChip
                  key={g}
                  label={g}
                  count={countIn(g)}
                  active={group === g}
                  onClick={() => setGroup(g)}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => setManaging((m) => !m)}
              aria-expanded={managing}
              className="h-8 shrink-0 gap-1.5 px-2.5 text-[13px] font-[560] text-muted-foreground hover:text-ink"
            >
              <SlidersHorizontal className="size-3.5" aria-hidden />
              {managing ? 'Done' : 'Manage'}
            </Button>
          </div>

          {managing && (
            <div className="mt-3 border-t border-line pt-3">
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing)
                      createGroup()
                  }}
                  placeholder="New group name"
                  className="h-9"
                  aria-label="New group name"
                />
                <Button
                  onClick={createGroup}
                  className="h-9 shrink-0 gap-1.5 bg-blue px-4 font-[560] text-white hover:bg-blue/90"
                >
                  <Plus className="size-4" aria-hidden />
                  Add
                </Button>
              </div>
              <ul className="mt-2 flex flex-col">
                {groups.map((g) => {
                  const isEditing = editing === g
                  return (
                    <li
                      key={g}
                      className="flex items-center gap-2 border-t border-line py-2 first:border-t-0"
                    >
                      {isEditing ? (
                        <>
                          <Input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.nativeEvent.isComposing)
                                commitRename(g)
                              if (e.key === 'Escape') setEditing(null)
                            }}
                            className="h-8"
                            aria-label={`Rename ${g}`}
                            autoFocus
                          />
                          <button
                            onClick={() => commitRename(g)}
                            className="grid size-8 shrink-0 place-items-center rounded-md text-green hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                            aria-label="Save group name"
                          >
                            <Check className="size-4" aria-hidden />
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                            aria-label="Cancel rename"
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1 truncate text-[14px] font-[540] text-ink">
                            {g}
                            <span className="ml-2 text-[13px] font-[400] text-muted-foreground">
                              {countIn(g)}
                            </span>
                          </span>
                          <button
                            onClick={() => {
                              setEditing(g)
                              setDraft(g)
                            }}
                            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                            aria-label={`Rename ${g}`}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            onClick={() => {
                              deleteGroup(g)
                              if (group === g) setGroup('all')
                              toast.success(`Deleted "${g}".`)
                            }}
                            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-coral-soft hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                            aria-label={`Delete ${g}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </>
                      )}
                    </li>
                  )
                })}
                {groups.length === 0 && (
                  <li className="py-3 text-center text-[13px] text-muted-foreground">
                    No groups yet. Create one above.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        )}

        {isFarm && (
          <div className="rounded-2xl border border-line bg-blue-soft/50 px-4 py-3">
            <p className="text-[13.5px] leading-relaxed text-ink">
              <span className="font-[600]">
                Everyone on {farmStreet}
              </span>{' '}
              {'\u2014'} whether or not they know you yet. They get the same
              monthly note. They are not in your sphere and don&apos;t count
              toward your groups.
            </p>
          </div>
        )}

        {/* Search + status */}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, or address"
              className="h-10 pl-9"
              aria-label="Search people"
            />
          </div>
          {!isFarm && (
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? 'all')}
          >
            <SelectTrigger className="h-10 w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="matched">On the map</SelectItem>
              <SelectItem value="review">Needs review</SelectItem>
            </SelectContent>
          </Select>
          )}
        </div>

        {/* Bulk bar — sphere only */}
        {!isFarm && selectedIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue/30 bg-blue-soft px-4 py-2.5">
            <span className="text-[13px] font-[560] text-blue">
              {selectedIds.length} selected
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Select
                onValueChange={(value) => {
                  const g = value as string | null
                  if (!g) return
                  addContactsToGroup(selectedIds, g)
                  toast.success(`Added ${selectedIds.length} to ${g}.`)
                  setSelected(new Set())
                }}
              >
                <SelectTrigger className="h-8 w-40 bg-white text-[13px]">
                  <FolderPlus className="size-3.5" aria-hidden />
                  <SelectValue placeholder="Add to group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-8 border-coral/40 bg-white text-[13px] text-coral [&:hover]:bg-coral-soft"
                onClick={() => {
                  deleteContacts(selectedIds)
                  toast.success(`Removed ${selectedIds.length} homeowners.`)
                  setSelected(new Set())
                }}
              >
                <Trash2 className="size-3.5" aria-hidden />
                Remove
              </Button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="grid size-8 place-items-center rounded-md text-muted-foreground hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                aria-label="Clear selection"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
            {!isFarm && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all shown"
              />
            )}
            <span className="text-[12px] font-[560] uppercase tracking-[0.08em] text-muted-foreground">
              {filtered.length} shown
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <p className="text-[15px] font-[560] text-ink">No matches</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Try a different search or filter.
              </p>
            </div>
          ) : (
            <ul>
              {filtered.map((c) => {
                const isSel = selected.has(c.id)
                return (
                  <li
                    key={c.id}
                    className={cn(
                      'flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0',
                      isSel && 'bg-blue-soft/40',
                    )}
                  >
                    {!isFarm && (
                      <Checkbox
                        checked={isSel}
                        onCheckedChange={() => toggleOne(c.id)}
                        aria-label={`Select ${c.name}`}
                      />
                    )}
                    <Link
                      href={`/app/people/${c.id}`}
                      className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-[560] text-ink">
                          {c.name}
                        </p>
                        <p className="truncate text-[13px] text-muted-foreground">
                          {c.address}, {c.city}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {!isFarm && (
                          <Tag
                            tone={ENGAGEMENT_META[c.engagement].tone}
                            className="hidden sm:inline-flex"
                          >
                            {ENGAGEMENT_META[c.engagement].label}
                          </Tag>
                        )}
                        <Tag tone={STATUS_META[c.status].tone} dot>
                          {STATUS_META[c.status].label}
                        </Tag>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}

function GroupChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
        active
          ? 'border-blue bg-blue text-white'
          : 'border-line bg-white text-ink hover:border-blue/40',
      )}
    >
      {label}
      <span
        className={cn(
          'tabular-nums',
          active ? 'text-white/70' : 'text-muted-foreground',
        )}
      >
        {count}
      </span>
    </button>
  )
}
