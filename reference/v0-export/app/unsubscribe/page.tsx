'use client'

import { useState } from 'react'
import { Check, Home, MailX, Mail, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wordmark } from '@/components/wordmark'

type View = 'choose' | 'address' | 'address-done' | 'stopped'
type Stopped = 'monthly' | 'weekly' | 'all'

export default function UnsubscribePage() {
  const [view, setView] = useState<View>('choose')
  const [newAddress, setNewAddress] = useState('')
  const [stopped, setStopped] = useState<Stopped>('all')
  const [subs, setSubs] = useState({ monthly: true, weekly: true })

  function stop(scope: Stopped) {
    setStopped(scope)
    if (scope === 'monthly') setSubs((s) => ({ ...s, monthly: false }))
    else if (scope === 'weekly') setSubs((s) => ({ ...s, weekly: false }))
    else setSubs({ monthly: false, weekly: false })
    setView('stopped')
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="px-5 py-5">
        <Wordmark />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-20 pt-6">
        <div className="w-full max-w-lg">
          {view === 'choose' && (
            <div>
              <h1 className="text-balance text-[24px] font-[680] tracking-[-0.02em] text-ink">
                What would you like to change?
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                You&apos;re signed up for two things. You can leave either one on
                its own, or update your address if you moved.
              </p>

              {/* Primary: update address */}
              <button
                onClick={() => setView('address')}
                className="mt-6 flex w-full items-center gap-4 rounded-2xl border border-blue bg-blue-soft p-5 text-left transition-colors hover:bg-blue-soft/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Home className="size-5 shrink-0 text-blue" aria-hidden />
                <div>
                  <p className="text-[16px] font-[620] text-ink">
                    Update my address instead
                  </p>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">
                    Most people who leave have simply moved. Keep the note,
                    pointed at your new home.
                  </p>
                </div>
              </button>

              {/* The two subscriptions */}
              <ul className="mt-4 flex flex-col gap-3">
                <SubRow
                  icon={Mail}
                  title="The monthly note about your home"
                  active={subs.monthly}
                  onStop={() => stop('monthly')}
                />
                <SubRow
                  icon={CalendarClock}
                  title="The weekly market update"
                  active={subs.weekly}
                  onStop={() => stop('weekly')}
                />
              </ul>

              <div className="mt-6 text-center">
                <button
                  onClick={() => stop('all')}
                  className="text-[13px] font-[540] text-muted-foreground underline-offset-2 hover:text-coral hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                >
                  Stop everything
                </button>
              </div>
            </div>
          )}

          {view === 'address' && (
            <div className="rounded-2xl border border-line bg-white p-6">
              <h1 className="text-[22px] font-[680] tracking-[-0.02em] text-ink">
                Where should it go now?
              </h1>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setView('address-done')
                }}
                className="mt-5 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="addr">New property address</Label>
                  <Input
                    id="addr"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="123 Main St, La Verne, CA"
                    required
                    className="h-10"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setView('choose')}
                    className="h-10 border-line"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 flex-1 bg-blue font-[620] text-white [a]:hover:bg-blue/90"
                  >
                    Save new address
                  </Button>
                </div>
              </form>
            </div>
          )}

          {view === 'address-done' && (
            <Confirmation
              tone="green"
              title={'Got it \u2014 we\u2019ll follow you.'}
              body={`Your monthly note will point at ${newAddress || 'your new home'} starting next month. Nothing else changes.`}
            />
          )}

          {view === 'stopped' && (
            <Confirmation
              tone="coral"
              title={
                stopped === 'monthly'
                  ? 'Stopped the monthly note.'
                  : stopped === 'weekly'
                    ? 'Stopped the weekly update.'
                    : 'You\u2019re unsubscribed.'
              }
              body={
                stopped === 'monthly'
                  ? 'You\u2019ll still get the weekly market update. Change your mind anytime.'
                  : stopped === 'weekly'
                    ? 'You\u2019ll still get the monthly note about your home. Change your mind anytime.'
                    : 'You won\u2019t get any more of these. If you change your mind, your agent can add you back anytime.'
              }
            />
          )}
        </div>
      </main>
    </div>
  )
}

function SubRow({
  icon: Icon,
  title,
  active,
  onStop,
}: {
  icon: typeof Home
  title: string
  active: boolean
  onStop: () => void
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 text-[14.5px] font-[540] text-ink">
        {title}
      </span>
      {active ? (
        <button
          onClick={onStop}
          className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[13px] font-[560] text-ink transition-colors hover:border-coral hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
        >
          Stop this
        </button>
      ) : (
        <span className="shrink-0 text-[13px] font-[540] text-muted-foreground">
          Stopped
        </span>
      )}
    </li>
  )
}

function Confirmation({
  tone,
  title,
  body,
}: {
  tone: 'green' | 'coral'
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 text-center">
      <span
        className={
          tone === 'green'
            ? 'mx-auto grid size-11 place-items-center rounded-full bg-[#e7f6ef] text-green'
            : 'mx-auto grid size-11 place-items-center rounded-full bg-coral-soft text-coral'
        }
      >
        {tone === 'green' ? (
          <Check className="size-5" />
        ) : (
          <MailX className="size-5" />
        )}
      </span>
      <h1 className="mt-4 text-[22px] font-[680] tracking-[-0.02em] text-ink">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
