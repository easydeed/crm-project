'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { logCallAction, undoCallAction } from '@/app/app/call-actions'
import type { CallEntry } from '@/app/app/call-list-view'
import { CallPanel } from '@/app/app/call-panel'
import { CALL_TAGS } from '@/app/app/call-tags'
import { buttonClass, linkClass, mutedClass } from '@/app/app/people/ui'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'

export const UNDO_SECONDS = 5

type Status = 'open' | 'called' | 'dismissed'

const secondaryClass =
  'min-h-11 rounded-md border border-foreground/40 px-4 py-2 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60'

export function CallEntryItem({ entry, readOnly }: { entry: CallEntry; readOnly: boolean }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState<Status>(entry.called ? 'called' : 'open')
  const [undoable, setUndoable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tag = CALL_TAGS[entry.kind]
  const panelId = `call-panel-${entry.contactId}`

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function act(outcome: 'called' | 'dismissed') {
    setError(null)
    startTransition(async () => {
      const result = await logCallAction(entry.contactId, outcome)
      if (!result.ok) return setError(result.error)
      setStatus(outcome)
      setUndoable(true)
      timer.current = setTimeout(() => {
        setUndoable(false)
        router.refresh()
      }, UNDO_SECONDS * 1000)
    })
  }

  function undo() {
    setError(null)
    if (timer.current) clearTimeout(timer.current)
    startTransition(async () => {
      const result = await undoCallAction(entry.contactId)
      setUndoable(false)
      if (!result.ok) return setError(result.error)
      setStatus('open')
    })
  }

  const undoButton = undoable ? (
    <button className={`${linkClass} min-h-11`} disabled={pending} onClick={undo} type="button">
      Undo
    </button>
  ) : null

  if (status === 'dismissed') {
    return (
      <li className="flex flex-wrap items-center gap-4 border-t border-foreground/15 py-5" aria-live="polite">
        <p className={mutedClass}>{entry.name} is off the list until next month.</p>
        {undoButton}
        {error ? <p className="text-[15px]" role="alert">{error}</p> : null}
      </li>
    )
  }

  const called = status === 'called'
  return (
    <li className={`border-t border-foreground/15 py-5 ${called ? 'bg-foreground/5 px-3' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`text-[17px] font-semibold ${called ? 'text-[#3d3d3d] dark:text-[#c8c8c8]' : ''}`}>
            {entry.name}
          </p>
          <p className="mt-2">
            <span className={`inline-block rounded-full px-3 py-0.5 text-[15px] ${tag.className}`} data-tag-color={tag.color}>
              {tag.label}
            </span>
          </p>
          <p className={`mt-2 ${called ? mutedClass : 'text-[15px]'}`}>{entry.sentence}</p>
          <p className={`mt-1 ${mutedClass}`}>
            {entry.address}
            {entry.closeDate ? ` · Closed ${entry.closeDate}` : null}
          </p>
          {called ? <p className="mt-2 text-[15px] font-medium">Called this month.</p> : null}
        </div>
        <button
          aria-controls={panelId}
          aria-expanded={expanded}
          className={`${buttonClass} min-h-11`}
          onClick={() => setExpanded((open) => !open)}
          type="button"
        >
          {expanded ? 'Close' : 'Call'}
        </button>
      </div>
      {expanded && entry.panel ? <CallPanel address={entry.address} id={panelId} panel={entry.panel} /> : null}
      {expanded && !called && !readOnly ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <button className={`${buttonClass} min-h-11`} disabled={pending} onClick={() => act('called')} type="button">
            Mark as called
          </button>
          <button className={secondaryClass} disabled={pending} onClick={() => act('dismissed')} type="button">
            Not now
          </button>
        </div>
      ) : null}
      {expanded && readOnly ? <p className="mt-4 text-[15px]">{VIEW_AS_READ_ONLY}</p> : null}
      <div aria-live="polite" className="mt-2 flex flex-wrap items-center gap-4">
        {called && undoable ? <p className="text-[15px]">Marked as called.</p> : null}
        {called ? undoButton : null}
        {error ? <p className="text-[15px]" role="alert">{error}</p> : null}
      </div>
    </li>
  )
}
