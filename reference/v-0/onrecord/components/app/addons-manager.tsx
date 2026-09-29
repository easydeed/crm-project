'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { PageHeader } from '@/components/app/page-header'
import { AddonTexting } from '@/components/app/addon-texting'
import { AddonBill } from '@/components/app/addon-bill'
import { ExtraRow, WeeklyThumb, Field } from '@/components/app/addon-extra-row'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import type { Addon } from '@/lib/types'
import {
  MessageSquare,
  CalendarClock,
  MapPin,
  Handshake,
  AlertCircle,
  Check,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

const ICONS: Record<string, LucideIcon> = {
  'text-call-list': MessageSquare,
  'weekly-note': CalendarClock,
  'farm-street': MapPin,
  'add-lender': Handshake,
}

function homesOnStreet(street: string): number {
  const s = street.trim().toLowerCase()
  if (!s) return 0
  if (s === 'oakdale ave') return 140
  let n = 0
  for (let i = 0; i < s.length; i++) n += s.charCodeAt(i)
  return 70 + (n % 150)
}

export function AddonsManager() {
  const {
    addons,
    toggleAddon,
    lenderInfo,
    setLenderInfo,
    watchStreet,
    setWatchStreet,
  } = useStore()

  const [lender, setLender] = useState(lenderInfo)
  const [lenderError, setLenderError] = useState('')
  const [showLenderForm, setShowLenderForm] = useState(false)
  const [street, setStreet] = useState(watchStreet)

  const extras = addons.filter((a) => a.tier === 'extra')
  const texting = addons.find((a) => a.tier === 'texting')

  const lenderComplete = Boolean(
    lender.name.trim() && lender.nmls.trim() && lender.email.trim(),
  )

  function toggleLender(addon: Addon) {
    if (addon.enabled) {
      toggleAddon(addon.id)
      setShowLenderForm(false)
      setLenderError('')
      toast.success('Add my lender turned off.')
      return
    }
    if (!lenderComplete) {
      setShowLenderForm(true)
      setLenderError(
        'Add the lender\u2019s name, NMLS number, and email to turn this on.',
      )
      return
    }
    setLenderInfo(lender)
    toggleAddon(addon.id)
    setShowLenderForm(false)
    setLenderError('')
    toast.success('Add my lender turned on.')
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <PageHeader
        title="Add-ons"
        subtitle="Start at $19. Add what you need, turn it off the month you stop wanting it."
      />

      {/* Group one: Extras */}
      <div className="mt-6">
        <h2 className="text-[13px] font-[680] uppercase tracking-[0.08em] text-ink">
          Extras
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Small things that ride along with the monthly note. $2 to $4 each.
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {extras.map((addon) => {
          const Icon = ICONS[addon.id] ?? MessageSquare
          return (
            <ExtraRow key={addon.id} addon={addon} icon={Icon}>
              {/* text-call-list, weekly-note, farm-street, add-lender panels */}
              {addon.id === 'add-lender' ? (
                <Switch
                  checked={addon.enabled}
                  aria-label={`Turn ${addon.title} ${addon.enabled ? 'off' : 'on'}`}
                  onCheckedChange={() => toggleLender(addon)}
                />
              ) : (
                <Switch
                  checked={addon.enabled}
                  aria-label={`Turn ${addon.title} ${addon.enabled ? 'off' : 'on'}`}
                  onCheckedChange={() => {
                    toggleAddon(addon.id)
                    toast.success(addon.enabled ? 'Turned off.' : 'Turned on.')
                  }}
                />
              )}
            </ExtraRow>
          )
        })}

        {/* Lender form panel */}
        {(() => {
          const lenderAddon = extras.find((a) => a.id === 'add-lender')
          if (!lenderAddon) return null
          const open = lenderAddon.enabled || showLenderForm
          if (!open) return null
          return (
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-[13px] font-[600] text-ink">Your lender</p>
              {lenderError && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-coral-soft px-3 py-2 text-[13px] font-[560] text-coral">
                  <AlertCircle className="size-4 shrink-0" aria-hidden />
                  {lenderError}
                </div>
              )}
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Lender name" value={lender.name} onChange={(v) => setLender({ ...lender, name: v })} placeholder="Jordan Michaels" />
                <Field label="NMLS #" value={lender.nmls} onChange={(v) => setLender({ ...lender, nmls: v })} placeholder="1234567" />
                <Field label="Lender email" value={lender.email} onChange={(v) => setLender({ ...lender, email: v })} placeholder="jordan@lender.com" />
              </div>
              <Button
                onClick={() => {
                  if (!lenderComplete) {
                    setLenderError('All three fields are required before this can turn on.')
                    return
                  }
                  setLenderInfo(lender)
                  setLenderError('')
                  if (!lenderAddon.enabled) toggleAddon(lenderAddon.id)
                  setShowLenderForm(false)
                  toast.success('Lender details saved.')
                }}
                className="mt-3 h-9 gap-1.5 bg-ink px-4 text-[13.5px] font-[560] text-white hover:bg-ink/90"
              >
                <Check className="size-4" aria-hidden />
                {lenderAddon.enabled ? 'Save lender details' : 'Save and turn on'}
              </Button>
            </div>
          )
        })()}

        {/* Farm street panel */}
        {extras.find((a) => a.id === 'farm-street')?.enabled && (
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field
                  label="Street or area to farm"
                  value={street}
                  onChange={setStreet}
                  placeholder="Oakdale Ave"
                />
              </div>
              <Button
                onClick={() => {
                  setWatchStreet(street)
                  toast.success(street ? `Farming ${street}.` : 'Street cleared.')
                }}
                className="h-9 bg-ink px-4 text-[13.5px] font-[560] text-white hover:bg-ink/90"
              >
                Save street
              </Button>
            </div>
            <p className="mt-2 text-[13px] font-[540] text-muted-foreground">
              About{' '}
              <span className="font-[680] text-ink tabular-nums">
                {homesOnStreet(street)}
              </span>{' '}
              homes on this street.
            </p>
          </div>
        )}

        {/* Weekly note panel */}
        {extras.find((a) => a.id === 'weekly-note')?.enabled && (
          <div className="rounded-xl border border-line bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <p className="text-[13.5px] leading-relaxed text-ink">
                  Sends every Tuesday morning from{' '}
                  <span className="font-[600]">news.onrecord.com</span>. Your
                  clients can stop the weekly note without stopping the monthly
                  one.
                </p>
                <Link
                  href="/sample"
                  className="mt-2 inline-flex items-center gap-1 text-[13px] font-[560] text-blue underline-offset-2 hover:underline"
                >
                  See a sample
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <WeeklyThumb />
            </div>
          </div>
        )}
      </div>

      {/* Group two: Texting your clients */}
      <div className="mt-8">
        <h2 className="text-[13px] font-[680] uppercase tracking-[0.08em] text-ink">
          Texting your clients
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Phone carriers charge us to send text messages to consumers, and they
          require registration before the first one goes out. That{'\u2019'}s why
          this one costs more than the rest.
        </p>
      </div>

      <div className="mt-3">{texting && <AddonTexting addon={texting} />}</div>

      <AddonBill />
    </div>
  )
}
