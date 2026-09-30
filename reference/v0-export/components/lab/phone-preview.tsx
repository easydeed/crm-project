'use client'

import { Signal, Wifi, BatteryFull } from 'lucide-react'

/**
 * A lightweight phone facsimile showing an SMS thread. Decorative chrome is
 * aria-hidden; the message bubble is real text so it reads to a screen reader.
 */
export function PhonePreview({
  sender,
  body,
  time = 'now',
}: {
  sender: string
  body: string
  time?: string
}) {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="overflow-hidden rounded-[2.2rem] border-[7px] border-ink bg-white shadow-xl">
        {/* status bar */}
        <div
          aria-hidden
          className="flex items-center justify-between bg-white px-6 pt-2.5 text-[11px] font-[620] text-ink"
        >
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <Signal className="size-3" />
            <Wifi className="size-3" />
            <BatteryFull className="size-3.5" />
          </span>
        </div>

        {/* contact header */}
        <div className="flex flex-col items-center gap-1 border-b border-line px-4 pb-3 pt-2">
          <div className="grid size-10 place-items-center rounded-full bg-blue-soft text-[15px] font-[680] text-blue">
            {sender.charAt(0)}
          </div>
          <p className="text-[12px] font-[600] text-ink">{sender}</p>
        </div>

        {/* thread */}
        <div className="flex min-h-[220px] flex-col gap-2 bg-surface px-3 py-4">
          <p className="text-center text-[10px] font-[560] text-muted-foreground">
            Text Message {'\u00b7'} {time}
          </p>
          {body.trim() ? (
            <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-[13px] leading-relaxed text-ink shadow-sm">
              {body}
            </div>
          ) : (
            <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-dashed border-line px-3.5 py-2 text-[13px] italic leading-relaxed text-muted-foreground">
              Your message shows up here as they{'\u2019'}ll see it.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
