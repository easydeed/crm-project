'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CallPanel } from '@/app/app/call-panel'
import { undoCallAction } from '@/app/app/call-actions'
import type { DashboardCall } from '@/app/app/load-call-list'
import { buttonClass, linkClass, mutedClass } from '@/app/app/people/ui'

const UNDO_KEY = 'onrecord-call-undo'

type UndoState = { id: string; name: string; until: number }

function readUndo(): UndoState | null {
  const raw = sessionStorage.getItem(UNDO_KEY)
  if (!raw) return null
  try {
    const saved = JSON.parse(raw) as UndoState
    if (!saved.until || saved.until < Date.now()) {
      sessionStorage.removeItem(UNDO_KEY)
      return null
    }
    return saved
  } catch {
    sessionStorage.removeItem(UNDO_KEY)
    return null
  }
}

function publishUndo(entry: DashboardCall) {
  const saved = { id: entry.contactId, name: entry.name, until: Date.now() + 5000 }
  sessionStorage.setItem(UNDO_KEY, JSON.stringify(saved))
  window.dispatchEvent(new Event('call-undo'))
}

const TAG_TINT: Record<string, string> = {
  'Big sale next door': 'bg-[#e7eee4]',
  'Paid off their loan': 'bg-[#e4eaf2]',
  'Taxes worth a talk': 'bg-[#f3eee4]',
  'Been a while': 'bg-[#eeeeee]',
}

export function CallList({
  entries,
  note,
  readOnly,
}: {
  entries: DashboardCall[]
  note: { note: string; href?: string; linkLabel?: string } | null
  readOnly: boolean
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [undo, setUndo] = useState<UndoState | null>(null)

  useEffect(() => {
    function sync() {
      setUndo(readUndo())
    }
    sync()
    window.addEventListener('call-undo', sync)
    return () => window.removeEventListener('call-undo', sync)
  }, [])

  useEffect(() => {
    if (!undo) return
    const token = undo.until
    const timer = window.setTimeout(() => {
      setUndo((current) => (current?.until === token ? null : current))
      try {
        const saved = JSON.parse(sessionStorage.getItem(UNDO_KEY) ?? '') as UndoState
        if (saved.until === token) sessionStorage.removeItem(UNDO_KEY)
      } catch {
        // A newer undo replaced this one.
      }
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [undo])

  const visible = entries.filter((entry) => entry.outcome !== 'dismissed')

  return (
    <section className="mt-10" aria-labelledby="call-list-heading">
      <h2 id="call-list-heading" className="text-[22px] font-semibold">
        Worth a call this month
      </h2>
      {undo ? (
        <p className={`mt-4 ${mutedClass}`}>
          Changed {undo.name}.{' '}
          <button
            className={linkClass}
            type="button"
            onClick={() => {
              const id = undo.id
              sessionStorage.removeItem(UNDO_KEY)
              setUndo(null)
              void undoCallAction(id)
            }}
          >
            Undo
          </button>
        </p>
      ) : null}
      {visible.length ? (
        <ul className="mt-6 flex flex-col gap-8">
          {visible.map((entry) => (
            <li
              key={entry.contactId}
              className={entry.outcome === 'called' ? 'border border-foreground/30 p-4' : undefined}
            >
              <p
                className={`inline-block rounded-md px-2 py-1 text-[15px] font-medium text-foreground ${TAG_TINT[entry.tag] ?? 'bg-[#eeeeee]'}`}
              >
                {entry.tag}
              </p>
              <h3 className="mt-2 text-[18px] font-semibold">{entry.name}</h3>
              {entry.outcome === 'called' ? <p className="text-[15px]">Called</p> : null}
              <p className="mt-2 text-[15px]">{entry.detail}</p>
              <p className="mt-2 text-[15px]">{entry.address}</p>
              <p className="text-[15px]">{entry.closeLabel}</p>
              <button
                className={`${buttonClass} mt-4 w-full`}
                type="button"
                aria-expanded={openId === entry.contactId}
                onClick={() => setOpenId(openId === entry.contactId ? null : entry.contactId)}
              >
                Call
              </button>
              {openId === entry.contactId ? (
                <CallPanel
                  entry={entry}
                  readOnly={readOnly}
                  onAct={() => publishUndo(entry)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {note ? (
        <p className={`mt-4 max-w-xl ${mutedClass}`}>
          {note.note}{' '}
          {note.href && note.linkLabel ? (
            <Link className={linkClass} href={note.href}>
              {note.linkLabel}
            </Link>
          ) : null}
        </p>
      ) : null}
    </section>
  )
}
