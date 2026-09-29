'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wordmark } from '@/components/wordmark'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MatchFlow } from '@/components/match/match-flow'
import { candidatesFor } from '@/lib/candidates'
import type { Contact } from '@/lib/types'
import { toast } from 'sonner'

function queryToContact(query: string): Contact {
  const [addr, cityPart] = query.split(',')
  return {
    id: 'onboarding',
    name: 'New Homeowner',
    email: '',
    address: (addr || query).trim(),
    city: (cityPart || 'La Verne').trim(),
    closedDate: '2020-01-01',
    status: 'needs_review',
    engagement: 'quiet',
    groups: [],
  }
}

export default function MatchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const candidates = useMemo(
    () => (submitted ? candidatesFor(queryToContact(submitted)) : []),
    [submitted],
  )

  return (
    <main className="min-h-svh bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <Wordmark />
          <button
            type="button"
            onClick={() => router.push('/app')}
            className="text-[13px] text-muted-foreground hover:text-ink"
          >
            Skip
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 py-10">
        {!submitted ? (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-balance font-serif text-[26px] leading-tight text-ink">
                Which home should we watch?
              </h1>
              <p className="mt-2 text-pretty text-[15px] leading-relaxed text-muted-foreground">
                Type the address and we{'\u2019'}ll pin the exact parcel, then
                quietly track every deed recorded around it.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!query.trim()) {
                  toast.error('Enter an address first.')
                  return
                }
                setSubmitted(query.trim())
              }}
              className="flex flex-col gap-3"
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="1142 Oakdale Ave, La Verne"
                className="h-12 text-[15px]"
                autoFocus
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 bg-blue text-[15px] font-[620] text-white [&:hover]:bg-blue/90"
              >
                Find my parcel
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-serif text-[24px] leading-tight text-ink">
                Pick your parcel
              </h1>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Confirm the exact lot so every note points at the right record.
              </p>
            </div>
            <MatchFlow
              query={submitted}
              candidates={candidates}
              confirmLabel="This is my home"
              onNoneMatch={() => setSubmitted('')}
              onConfirm={() => {
                toast.success('Locked in. Your first note lands next month.')
                setTimeout(() => router.push('/app'), 700)
              }}
            />
          </div>
        )}
      </div>
    </main>
  )
}
