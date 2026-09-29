'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { RecordBlock } from '@/components/record-block'
import { ParcelMap } from '@/components/parcel-map'
import { Tag } from '@/components/tag'
import { STATUS_META, ENGAGEMENT_META } from '@/components/app/contact-meta'
import { SIGNAL_META } from '@/components/app/signal-meta'
import { ClientTimeline } from '@/components/lab/client-timeline'
import { clientLots } from '@/lib/lab-lots'
import { shortDate, ownedFor } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function ClientDetail({ id }: { id: string }) {
  const { contacts, signals, updateContact } = useStore()
  const contact = contacts.find((c) => c.id === id)
  const lots = useMemo(() => (contact ? clientLots(contact) : []), [contact])
  const [paused, setPaused] = useState(false)

  if (!contact) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p className="text-[16px] font-[560] text-ink">Client not found</p>
        <Link
          href="/lab/audiences"
          className="mt-3 inline-block text-[14px] text-blue hover:underline"
        >
          Back
        </Link>
      </div>
    )
  }

  const signal = signals.find((s) => s.contactId === contact.id)
  const sigMeta = signal ? SIGNAL_META[signal.kind] : null
  const streetName = contact.address.split(' ').slice(1).join(' ')

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
      <Link
        href="/lab/audiences"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to audiences
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-[680] tracking-[-0.02em] text-ink">
            {contact.name}
          </h1>
          <p className="mt-0.5 text-[14px] text-muted-foreground">
            {contact.address}, {contact.city}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Tag tone={STATUS_META[contact.status].tone} dot>
              {STATUS_META[contact.status].label}
            </Tag>
            <Tag tone={ENGAGEMENT_META[contact.engagement].tone}>
              {ENGAGEMENT_META[contact.engagement].label}
            </Tag>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ActionIcon href={`mailto:${contact.email}`} label="Email">
            <Mail className="size-4" aria-hidden />
          </ActionIcon>
          {contact.phone && (
            <>
              <ActionIcon href={`tel:${contact.phone}`} label="Call">
                <Phone className="size-4" aria-hidden />
              </ActionIcon>
              <ActionIcon href={`sms:${contact.phone}`} label="Text">
                <MessageSquare className="size-4" aria-hidden />
              </ActionIcon>
            </>
          )}
        </div>
      </div>

      {/* Signal */}
      {signal && sigMeta && (
        <div
          className="mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3"
          style={{
            borderColor: 'color-mix(in oklch, var(--blue) 30%, transparent)',
            background: 'var(--blue-soft)',
          }}
        >
          <sigMeta.icon
            className="mt-0.5 size-5 shrink-0"
            style={{ color: sigMeta.fg }}
            aria-hidden
          />
          <div>
            <p className="text-[12px] font-[620] uppercase tracking-[0.1em] text-blue">
              Worth a call {'\u00b7'} {sigMeta.label}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink">
              {signal.detail}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: record + street */}
        <div className="flex flex-col gap-6">
          {contact.record && (
            <section className="flex flex-col gap-3">
              <SectionLabel>The county record</SectionLabel>
              <RecordBlock
                record={contact.record}
                address={contact.address}
              />
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                Closed {shortDate(contact.closedDate)}. Per the grant deed, owned
                for{' '}
                <span className="font-[560] text-ink">
                  {ownedFor(contact.closedDate)}
                </span>
                .
              </p>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <SectionLabel>Their street</SectionLabel>
            <div className="rounded-2xl border border-line bg-white p-4">
              <ParcelMap
                lots={lots}
                streetName={streetName}
                ariaLabel={`${contact.name}'s home and recent sales on ${streetName}`}
              />
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                Their lot in blue, recent recorded sales in coral. This is the
                picture their monthly note is built from.
              </p>
            </div>
          </section>
        </div>

        {/* Right: sending + timeline */}
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <SectionLabel>Their monthly note</SectionLabel>
            <div className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-[600] text-ink">
                    {paused ? 'Paused' : 'Sending on the 1st'}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {paused
                      ? 'They won\u2019t get the next one.'
                      : 'Next send September 1'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaused((p) => !p)
                    toast.success(
                      paused
                        ? `${contact.name} back on the note.`
                        : `Paused ${contact.name}.`,
                    )
                  }}
                  className="h-9 gap-1.5 border-line text-[13px] font-[560]"
                >
                  {paused ? (
                    <>
                      <Play className="size-3.5" aria-hidden /> Resume
                    </>
                  ) : (
                    <>
                      <Pause className="size-3.5" aria-hidden /> Pause
                    </>
                  )}
                </Button>
              </div>
              <button
                onClick={() =>
                  toast('Prototype', {
                    description: 'A one-off send would open the composer here.',
                  })
                }
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-soft py-2 text-[13px] font-[600] text-blue transition-colors hover:bg-blue/15"
              >
                <Sparkles className="size-3.5" aria-hidden />
                Send something one-off
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <SectionLabel>Everything they{'\u2019'}ve gotten</SectionLabel>
            <div className="rounded-2xl border border-line bg-white p-4">
              <ClientTimeline contact={contact} />
            </div>
          </section>
        </div>
      </div>

      {/* Engagement footer */}
      <section className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Button
          variant="outline"
          className="h-9 border-line text-[13px] font-[560]"
          onClick={() => {
            const next = contact.engagement === 'moved' ? 'quiet' : 'moved'
            updateContact(contact.id, { engagement: next })
            toast.success(
              next === 'moved'
                ? 'Flagged as possibly moved.'
                : 'Cleared the moved flag.',
            )
          }}
        >
          {contact.engagement === 'moved'
            ? 'Clear moved flag'
            : 'Flag as moved'}
        </Button>
        <span className="text-[12.5px] text-muted-foreground">
          Changes here reflect back on the People list.
        </span>
      </section>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12px] font-[620] uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </h2>
  )
}

function ActionIcon({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="grid size-9 place-items-center rounded-lg border border-line bg-white text-muted-foreground transition-colors hover:text-ink"
      aria-label={label}
    >
      {children}
    </a>
  )
}
