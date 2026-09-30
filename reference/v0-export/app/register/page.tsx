'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MatchFlow } from '@/components/match/match-flow'
import { AuthShell } from '@/components/auth/auth-shell'
import { RecordArtifact } from '@/components/auth/record-artifact'
import { candidatesFor } from '@/lib/candidates'
import type { Contact } from '@/lib/types'
import { toast } from 'sonner'

type Step = 'account' | 'address' | 'match'

function queryToContact(name: string, address: string): Contact {
  const [addr, cityPart] = address.split(',')
  return {
    id: 'onboarding',
    name: name || 'New Homeowner',
    email: '',
    address: (addr || address).trim(),
    city: (cityPart || 'La Verne').trim(),
    closedDate: '2020-01-01',
    status: 'needs_review',
    engagement: 'quiet',
    groups: [],
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('account')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  const candidates = useMemo(
    () => (address ? candidatesFor(queryToContact(name, address)) : []),
    [address, name],
  )

  const stepIndex = step === 'account' ? 0 : step === 'address' ? 1 : 2

  return (
    <AuthShell artifact={<RecordArtifact />}>
      {/* Step progress */}
      <div className="flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= stepIndex ? 'bg-blue' : 'bg-line'
            }`}
          />
        ))}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Step {stepIndex + 1} of 3
      </p>

      {step === 'account' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim() || !email.trim()) {
              toast.error('Add your name and email to continue.')
              return
            }
            setStep('address')
          }}
          className="mt-4 flex flex-col gap-5"
        >
          <div>
            <h1 className="font-serif text-[28px] leading-[1.1] tracking-[-0.01em] text-ink text-balance">
              Start following your home
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground text-pretty">
              One quiet email a month about the place you already own. No app,
              no feed.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dana Whitfield"
              className="h-11"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 text-[15px] transition-transform active:scale-[0.99]"
          >
            Continue
          </Button>
        </form>
      )}

      {step === 'address' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!address.trim()) {
              toast.error('Enter the address of your home.')
              return
            }
            setStep('match')
          }}
          className="mt-4 flex flex-col gap-5"
        >
          <div>
            <h1 className="font-serif text-[28px] leading-[1.1] tracking-[-0.01em] text-ink text-balance">
              What{'\u2019'}s your address, {name.split(' ')[0] || 'friend'}?
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground text-pretty">
              We{'\u2019'}ll pin the exact lot on the county map. You can add
              more homes later.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Home address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Maple Street, Portland, OR"
              className="h-11"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 flex-1 bg-transparent"
              onClick={() => setStep('account')}
            >
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              className="h-12 flex-1 text-[15px] transition-transform active:scale-[0.99]"
            >
              Find my lot
            </Button>
          </div>
        </form>
      )}

      {step === 'match' && (
        <div className="mt-4 flex flex-col gap-5">
          <div>
            <h1 className="font-serif text-[26px] leading-[1.1] tracking-[-0.01em] text-ink">
              Is this your lot?
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Confirm the match so every note points at the right parcel.
            </p>
          </div>
          <MatchFlow
            query={address}
            candidates={candidates}
            confirmLabel="This is my home"
            onNoneMatch={() => setStep('address')}
            onConfirm={() => {
              toast.success('You\u2019re all set. First note next month.')
              setTimeout(() => router.push('/app'), 700)
            }}
          />
        </div>
      )}
    </AuthShell>
  )
}
