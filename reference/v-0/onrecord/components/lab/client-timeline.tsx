'use client'

import type { Contact } from '@/lib/types'
import { seededHistory } from '@/lib/lab-history'
import { Mail, MessageSquare, MousePointerClick, Eye, PhoneCall } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON = {
  email_sent: Mail,
  email_opened: Eye,
  email_clicked: MousePointerClick,
  sms_sent: MessageSquare,
  call_logged: PhoneCall,
} as const

const TONE = {
  email_sent: 'text-muted-foreground',
  email_opened: 'text-blue',
  email_clicked: 'text-blue',
  sms_sent: 'text-muted-foreground',
  call_logged: 'text-coral',
} as const

export function ClientTimeline({ contact }: { contact: Contact }) {
  const events = seededHistory(contact)

  return (
    <ol className="relative flex flex-col gap-0">
      {events.map((e, i) => {
        const Icon = ICON[e.kind]
        const last = i === events.length - 1
        return (
          <li key={e.id} className="relative flex gap-3 pb-5">
            {!last && (
              <span
                aria-hidden
                className="absolute left-[15px] top-8 h-full w-px bg-line"
              />
            )}
            <span
              className={cn(
                'z-10 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-white',
                TONE[e.kind],
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-[13.5px] leading-snug text-ink">
                {e.label}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {e.when}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
