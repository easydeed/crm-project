'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ArrowLeft, Mail, Phone, Pause, Play, Trash2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { RecordBlock } from '@/components/record-block'
import { MatchFlow } from '@/components/match/match-flow'
import { Tag } from '@/components/tag'
import { STATUS_META, ENGAGEMENT_META } from '@/components/app/contact-meta'
import { candidatesFor } from '@/lib/candidates'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { shortDate, ownedFor } from '@/lib/format'
import { toast } from 'sonner'

export function ContactDetail({ id }: { id: string }) {
  const router = useRouter()
  const { contacts, groups, updateContact, deleteContact, signals } = useStore()
  const contact = contacts.find((c) => c.id === id)

  const candidates = useMemo(
    () => (contact ? candidatesFor(contact) : []),
    [contact],
  )
  const [notes, setNotes] = useState(contact?.notes ?? '')

  if (!contact) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p className="text-[16px] font-[560] text-ink">Homeowner not found</p>
        <Link
          href="/app/people"
          className="mt-3 inline-block text-[14px] text-blue hover:underline"
        >
          Back to people
        </Link>
      </div>
    )
  }

  const signal = signals.find((s) => s.contactId === contact.id)
  const needsReview = contact.status !== 'matched'

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 sm:px-8">
      <Link
        href="/app/people"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        People
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
          <a
            href={`mailto:${contact.email}`}
            className="grid size-9 place-items-center rounded-lg border border-line bg-white text-muted-foreground hover:text-ink"
            aria-label="Email"
          >
            <Mail className="size-4" />
          </a>
          {contact.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="grid size-9 place-items-center rounded-lg border border-line bg-white text-muted-foreground hover:text-ink"
              aria-label="Call"
            >
              <Phone className="size-4" />
            </a>
          ) : null}
        </div>
      </div>

      {/* Call signal */}
      {signal ? (
        <div className="mt-5 rounded-2xl border border-blue/30 bg-blue-soft px-4 py-3">
          <p className="text-[12px] font-[620] uppercase tracking-[0.1em] text-blue">
            Worth a call
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink">
            {signal.detail}
          </p>
        </div>
      ) : null}

      {/* Review flow OR record */}
      {needsReview ? (
        <section className="mt-6">
          <h2 className="mb-1 text-[15px] font-[620] text-ink">
            Match this homeowner to a parcel
          </h2>
          <p className="mb-3 text-[13px] text-muted-foreground">
            We couldn{'\u2019'}t confirm the exact lot. Pick the right one so
            their note pulls the correct record.
          </p>
          <MatchFlow
            query={`${contact.address}, ${contact.city}`}
            candidates={candidates}
            confirmLabel="Confirm this parcel"
            onConfirm={(cand) => {
              updateContact(contact.id, {
                status: 'matched',
                address: cand.address.split(',')[0],
                record: {
                  deedRecorded: '2020-06-15',
                  docNumber: `2020-${cand.apn.replace(/\D/g, '').slice(0, 7)}`,
                  recordedPrice: 720000,
                  vesting: 'A married couple as community property',
                  loanAmount: 576000,
                  loanRecorded: '2020-06-15',
                  lender: 'Cardinal Home Loans',
                  reconveyed: false,
                  assessedValue: 792000,
                  streetMedian: 915000,
                },
              })
              toast.success('Parcel confirmed. This homeowner is on the map.')
            }}
          />
        </section>
      ) : contact.record ? (
        <section className="mt-6 flex flex-col gap-3">
          <RecordBlock record={contact.record} address={contact.address} />
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Closed {shortDate(contact.closedDate)}. Per the grant deed, owned for{' '}
            <span className="font-[560] text-ink">
              {ownedFor(contact.closedDate)}
            </span>
            .
          </p>
        </section>
      ) : null}

      {/* Groups */}
      <section className="mt-6">
        <h2 className="mb-2 text-[15px] font-[620] text-ink">Groups</h2>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => {
            const on = contact.groups.includes(g)
            return (
              <button
                key={g}
                type="button"
                onClick={() =>
                  updateContact(contact.id, {
                    groups: on
                      ? contact.groups.filter((x) => x !== g)
                      : [...contact.groups, g],
                  })
                }
                className={
                  on
                    ? 'rounded-full border border-blue bg-blue-soft px-3 py-1 text-[13px] font-[540] text-blue'
                    : 'rounded-full border border-line bg-white px-3 py-1 text-[13px] text-muted-foreground hover:border-blue/40'
                }
              >
                {g}
              </button>
            )
          })}
        </div>
      </section>

      {/* Notes */}
      <section className="mt-6">
        <h2 className="mb-2 text-[15px] font-[620] text-ink">Private notes</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            updateContact(contact.id, { notes })
            if (notes !== (contact.notes ?? '')) toast.success('Note saved.')
          }}
          rows={3}
          placeholder="Only you see this. Referrals, birthdays, what they care about…"
        />
      </section>

      {/* Danger */}
      <section className="mt-8 flex items-center gap-3 border-t border-line pt-6">
        <Button
          variant="outline"
          className="h-9 border-line"
          onClick={() => {
            const next =
              contact.engagement === 'moved' ? 'quiet' : 'moved'
            updateContact(contact.id, { engagement: next })
            toast.success(
              next === 'moved'
                ? 'Flagged as possibly moved.'
                : 'Cleared the moved flag.',
            )
          }}
        >
          {contact.engagement === 'moved' ? (
            <>
              <Play className="size-4" />
              Clear moved flag
            </>
          ) : (
            <>
              <Pause className="size-4" />
              Flag as moved
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="ml-auto h-9 border-coral/40 text-coral [&:hover]:bg-coral-soft"
          onClick={() => {
            deleteContact(contact.id)
            toast.success(`${contact.name} removed.`)
            router.push('/app/people')
          }}
        >
          <Trash2 className="size-4" />
          Remove
        </Button>
      </section>
    </div>
  )
}
