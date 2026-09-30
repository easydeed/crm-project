'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PhoneCall, AlertTriangle, ArrowUpRight, Check, Phone } from 'lucide-react'
import { useStore } from '@/lib/store'
import { PageHeader } from '@/components/app/page-header'
import { Tag } from '@/components/tag'
import { Button } from '@/components/ui/button'
import { RecordBlock } from '@/components/record-block'
import { SIGNAL_META } from '@/components/app/signal-meta'
import type { Contact, CallSignal } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { contacts, groups, profile, signals } = useStore()

  const matched = contacts.filter((c) => c.status === 'matched')
  const needsReview = contacts.filter((c) => c.status !== 'matched')

  const byId = (id: string) => contacts.find((c) => c.id === id)

  return (
    <>
      <PageHeader
        title={`Here's your month, ${profile.name.split(' ')[0]}`}
        subtitle="Your next batch goes out on the 1st. Here's who might be worth a call before then."
      />

      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
        {/* Needs-a-parcel alert — only when there is something to fix */}
        {needsReview.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-coral/30 bg-coral-soft px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="size-[18px] shrink-0 text-coral" aria-hidden />
              <p className="text-[14px] font-[560] text-ink">
                {needsReview.length} people need a look before the 1st
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/match" />}
              className="h-9 shrink-0 self-start bg-coral px-4 text-[13.5px] font-[560] text-white [a]:hover:bg-coral/90 sm:self-auto"
            >
              Fix these
            </Button>
          </div>
        )}

        {/* Worth a call */}
        <section className={cn(needsReview.length > 0 ? 'mt-7' : '')}>
          <div className="mb-3 flex items-center gap-2">
            <PhoneCall className="size-[18px] text-blue" aria-hidden />
            <h2 className="text-[15px] font-[620] text-ink">
              Worth a call this month
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {signals.map((s) => {
              const c = byId(s.contactId)
              if (!c) return null
              return <CallRow key={s.contactId} contact={c} signal={s} />
            })}
          </div>
        </section>

        {/* Groups + next send */}
        <div className="mt-7 grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-[620] text-ink">Your groups</h2>
              <Link
                href="/app/people"
                className="rounded text-[13px] text-muted-foreground hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                Manage
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {groups.map((g) => (
                <Link
                  key={g}
                  href={`/app/people?group=${encodeURIComponent(g)}`}
                  className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 hover:border-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
                >
                  <span className="text-[14px] font-[540] text-ink">{g}</span>
                  <span className="text-[13px] tabular-nums text-muted-foreground">
                    {contacts.filter((c) => c.groups.includes(g)).length}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-[620] text-ink">Next send</h2>
              <Link
                href="/app/settings"
                className="inline-flex items-center gap-1 rounded text-[13px] text-muted-foreground hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              >
                Preview email
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line px-5 py-4">
                <p className="text-[13px] font-[620] uppercase tracking-[0.1em] text-blue">
                  The 1st {'\u00b7'} 6:00am local
                </p>
                <p className="mt-1 text-[17px] font-[620] text-ink">
                  {matched.length} homeowners
                </p>
              </div>
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
                <MiniFact label="Built from" value="Deeds + tax rolls" />
                <MiniFact label="Per homeowner" value="Their exact parcel" />
                <MiniFact label="Your effort" value="None" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function CallRow({ contact, signal }: { contact: Contact; signal: CallSignal }) {
  const { calledIds, markCalled } = useStore()
  const [open, setOpen] = useState(false)
  const meta = SIGNAL_META[signal.kind]
  const called = calledIds.includes(contact.id)
  const panelId = `call-panel-${contact.id}`

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-4 transition-colors',
        called ? 'border-line bg-surface' : 'border-line',
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
            called && 'opacity-50',
          )}
          style={{ backgroundColor: meta.bg, color: meta.fg }}
          aria-hidden
        >
          <meta.icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/people/${contact.id}`}
              className={cn(
                'rounded text-[15px] font-[620] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
                called ? 'text-muted-foreground' : 'text-ink hover:text-blue',
              )}
            >
              {contact.name}
            </Link>
            <Tag tone={called ? 'grey' : meta.tone}>{meta.label}</Tag>
            {called && (
              <span className="inline-flex items-center gap-1 text-[12.5px] font-[560] text-green">
                <Check className="size-3.5" aria-hidden />
                Called
              </span>
            )}
          </div>
          <p
            className={cn(
              'mt-0.5 text-pretty text-[14px] leading-relaxed',
              called ? 'text-muted-foreground' : 'text-muted-foreground',
            )}
          >
            {signal.detail}
          </p>
        </div>
        {!called && (
          <Button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            className="h-9 shrink-0 gap-1.5 bg-blue px-4 text-[13.5px] font-[560] text-white hover:bg-blue/90"
          >
            <Phone className="size-4" aria-hidden />
            Call
          </Button>
        )}
      </div>

      {open && !called && (
        <div id={panelId} className="mt-4 border-t border-line pt-4">
          <a
            href={`tel:${contact.phone?.replace(/[^0-9+]/g, '')}`}
            className="inline-flex items-center gap-2 rounded-lg text-[17px] font-[620] text-ink hover:text-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            <Phone className="size-4 text-blue" aria-hidden />
            {contact.phone ?? 'No number on file'}
          </a>
          {contact.record && (
            <RecordBlock
              record={contact.record}
              address={`${contact.address}, ${contact.city}`}
              className="mt-3"
            />
          )}
          <Button
            onClick={() => markCalled(contact.id)}
            variant="outline"
            className="mt-3 h-9 gap-1.5 border-green/40 bg-white px-4 text-[13.5px] font-[560] text-green [&:hover]:bg-[#e7f6ef]"
          >
            <Check className="size-4" aria-hidden />
            Mark as called
          </Button>
        </div>
      )}
    </div>
  )
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-[14px] font-[560] text-ink">{value}</p>
    </div>
  )
}
