'use client'

import { buttonClass, linkClass } from '@/app/app/people/ui'
import { dismissCallAction, markCalledAction } from '@/app/app/call-actions'
import type { DashboardCall } from '@/app/app/load-call-list'

const UNDO_KEY = 'onrecord-call-undo'

const outlineButton =
  'w-full rounded-md border border-foreground bg-background px-4 py-2 text-[15px] text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

export function CallPanel({
  entry,
  readOnly,
  onAct,
}: {
  entry: DashboardCall
  readOnly: boolean
  onAct: () => void
}) {
  const digits = entry.phone?.replace(/\D/g, '') ?? ''
  return (
    <div className="mt-4 border border-foreground/20 p-4">
      <p className="text-[15px]">
        {digits.length >= 10 ? (
          <a className={linkClass} href={`tel:${digits}`}>
            {entry.phone}
          </a>
        ) : (
          'No phone on file'
        )}
      </p>
      <p className="mt-2 text-[15px]">
        <a className={linkClass} href={`mailto:${entry.email}`}>
          {entry.email}
        </a>
      </p>
      <p className="mt-2 text-[15px]">{entry.address}</p>
      <div className="mt-4">
        <p className="text-[15px] font-medium">On the record</p>
        {entry.recordLines.map((line) => (
          <p key={line} className="mt-2 text-[15px]">
            {line}
          </p>
        ))}
      </div>
      {readOnly ? null : (
        <div className="mt-4 flex flex-col gap-3">
          {entry.outcome === 'called' ? null : (
            <form
              action={async () => {
                onAct()
                const saved = await markCalledAction(entry.contactId)
                if (!saved) {
                  sessionStorage.removeItem(UNDO_KEY)
                  window.dispatchEvent(new Event('call-undo'))
                }
              }}
            >
              <button className={`${buttonClass} w-full`} type="submit">
                Mark as called
              </button>
            </form>
          )}
          <form
            action={async () => {
              onAct()
              const saved = await dismissCallAction(entry.contactId)
              if (!saved) {
                sessionStorage.removeItem(UNDO_KEY)
                window.dispatchEvent(new Event('call-undo'))
              }
            }}
          >
            <button className={outlineButton} type="submit">
              Not now
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
