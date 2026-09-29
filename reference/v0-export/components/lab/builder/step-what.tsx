'use client'

import { useRef } from 'react'
import { Mail, MessageSquare, Sparkles } from 'lucide-react'
import type { StepProps } from './types'
import { MERGE_FIELDS, renderTemplate, type Channel } from '@/lib/lab-data'
import { SEED_TEMPLATES } from '@/lib/lab-templates'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export function StepWhat({ draft, set }: StepProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const templates = SEED_TEMPLATES.filter((t) => t.channel === draft.channel)

  function insertToken(token: string) {
    const el = ref.current
    const insert = `{{${token}}}`
    if (!el) {
      set({ body: `${draft.body}${insert}` })
      return
    }
    const start = el.selectionStart ?? draft.body.length
    const end = el.selectionEnd ?? draft.body.length
    const next = draft.body.slice(0, start) + insert + draft.body.slice(end)
    set({ body: next })
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + insert.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-[640] text-ink">What does it say?</h2>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          Choose a channel, start from a template or blank, then make it yours.
        </p>
      </div>

      {/* channel */}
      <div role="group" aria-label="Channel" className="inline-flex w-fit rounded-lg border border-line bg-white p-0.5">
        {(['email', 'sms'] as Channel[]).map((ch) => {
          const active = draft.channel === ch
          const Icon = ch === 'email' ? Mail : MessageSquare
          return (
            <button
              key={ch}
              onClick={() => set({ channel: ch, templateId: null })}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13.5px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                active ? 'bg-ink text-white' : 'text-muted-foreground hover:text-ink',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {ch === 'email' ? 'Email' : 'Text'}
            </button>
          )
        })}
      </div>

      {/* template picker */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => set({ templateId: null, body: '' })}
          className={cn(
            'rounded-lg border px-3 py-2 text-[13px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
            draft.templateId === null ? 'border-blue bg-blue-soft text-blue' : 'border-line bg-white text-ink hover:border-blue/40',
          )}
        >
          Start blank
        </button>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => set({ templateId: t.id, body: t.body })}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
              draft.templateId === t.id ? 'border-blue bg-blue-soft text-blue' : 'border-line bg-white text-ink hover:border-blue/40',
            )}
          >
            {t.premium && <Sparkles className="size-3.5 text-coral" aria-hidden />}
            {t.name}
          </button>
        ))}
      </div>

      {/* editor + merge fields + preview */}
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-3">
          <Textarea
            ref={ref}
            value={draft.body}
            onChange={(e) => set({ body: e.target.value })}
            placeholder="Write your message, or pick a template above."
            className="min-h-40 resize-y bg-white text-[14.5px] leading-relaxed"
            aria-label="Message body"
          />

          {/* live preview */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-2 text-[11px] font-[620] uppercase tracking-[0.1em] text-muted-foreground">
              Preview, with real data
            </p>
            <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink">
              {draft.body ? renderTemplate(draft.body) : 'Your message will render here.'}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-[560] text-muted-foreground">Insert a field</p>
          <div className="flex flex-wrap gap-1.5 lg:flex-col lg:items-start">
            {MERGE_FIELDS.map((mf) => (
              <button
                key={mf.token}
                onClick={() => insertToken(mf.token)}
                className="rounded-md border border-line bg-white px-2 py-1 text-left text-[12.5px] font-[540] text-ink transition-colors hover:border-blue hover:text-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                {`{{${mf.token}}}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
