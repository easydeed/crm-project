'use client'

import { X } from 'lucide-react'
import type { Draft } from './types'
import { useAudience } from './use-audience'

export function AudienceDrawer({
  open,
  onClose,
  draft,
}: {
  open: boolean
  onClose: () => void
  draft: Draft
}) {
  const { list } = useAudience(draft)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Audience preview"
    >
      <button
        className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[16px] font-[640] text-ink">Who&apos;s included</h2>
            <p className="text-[13px] text-muted-foreground tabular-nums">
              {list.length} {list.length === 1 ? 'person' : 'people'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <p className="px-5 py-10 text-center text-[14px] text-muted-foreground">
              No one matches these filters yet. Loosen one to see people.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {list.slice(0, 60).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-[540] text-ink">{c.name}</p>
                    <p className="truncate text-[12.5px] text-muted-foreground">
                      {c.address}, {c.city}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {list.length > 60 && (
            <p className="px-5 py-3 text-center text-[12.5px] text-muted-foreground">
              and {list.length - 60} more
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
