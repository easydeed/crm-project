'use client'

import { useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/app/page-header'
import { PhonePreview } from '@/components/lab/phone-preview'
import { Button } from '@/components/ui/button'
import { analyzeSms } from '@/lib/lab-sms'
import { MERGE_FIELDS, renderTemplate } from '@/lib/lab-data'
import { useStore } from '@/lib/store'
import { AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const OPT_OUT = '\n\nReply STOP to opt out.'

export function SmsComposer() {
  const { profile } = useStore()
  const [raw, setRaw] = useState(
    'Hi {{first_name}}, it\u2019s {{agent_first_name}}. A home on {{street}} just sold for {{last_sale_on_street}}. Want the number?',
  )
  const [includeOptOut, setIncludeOptOut] = useState(true)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const fullRaw = includeOptOut ? raw + OPT_OUT : raw

  // What the recipient actually sees, with merge fields resolved to samples.
  const rendered = useMemo(() => renderTemplate(fullRaw), [fullRaw])
  const info = useMemo(() => analyzeSms(rendered), [rendered])

  function insert(token: string) {
    const ta = taRef.current
    if (!ta) {
      setRaw((r) => r + token)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    setRaw((r) => r.slice(0, start) + token + r.slice(end))
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + token.length
      ta.setSelectionRange(pos, pos)
    })
  }

  const overLimit = info.segments > 3

  return (
    <div>
      <PageHeader
        title="Text composer"
        subtitle="Write once, see exactly what lands on their phone — and what it costs to send."
      />

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_320px]">
        {/* Editor column */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12.5px] font-[560] text-muted-foreground">
                Insert:
              </span>
              {MERGE_FIELDS.map((f) => (
                <button
                  key={f.token}
                  onClick={() => insert(`{{${f.token}}}`)}
                  className="rounded-md bg-blue-soft px-2 py-1 text-[12px] font-[560] text-blue transition-colors hover:bg-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                >
                  {f.label}
                </button>
              ))}
            </div>
            <textarea
              ref={taRef}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-line bg-white p-3.5 text-[14px] leading-relaxed text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              aria-label="Message body"
            />
          </div>

          {/* Opt-out */}
          <label className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5">
            <input
              type="checkbox"
              checked={includeOptOut}
              onChange={(e) => setIncludeOptOut(e.target.checked)}
              className="mt-0.5 size-4 accent-blue"
            />
            <span className="text-[13px] leading-relaxed text-ink">
              <span className="font-[600]">Append {'\u201c'}Reply STOP to opt
              out.{'\u201d'}</span>{' '}
              <span className="text-muted-foreground">
                Required for the first text of a campaign. We keep it on by
                default so you don{'\u2019'}t get your number flagged.
              </span>
            </span>
          </label>

          {/* Segment meter */}
          <div
            className={cn(
              'rounded-xl border p-4',
              overLimit
                ? 'border-coral/40 bg-coral-soft/50'
                : 'border-line bg-white',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-[680] tabular-nums text-ink">
                  {info.segments}
                </span>
                <span className="text-[13px] font-[560] text-muted-foreground">
                  {info.segments === 1 ? 'segment' : 'segments'} {'\u00b7'}{' '}
                  {info.chars} chars
                </span>
              </div>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11.5px] font-[620]',
                  info.encoding === 'UCS-2'
                    ? 'bg-coral-soft text-coral'
                    : 'bg-surface text-muted-foreground',
                )}
              >
                {info.encoding}
              </span>
            </div>

            {/* segment ticks */}
            <div
              aria-hidden
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  overLimit ? 'bg-coral' : 'bg-blue',
                )}
                style={{
                  width: `${Math.min(
                    ((info.chars % info.perSegment || info.perSegment) /
                      info.perSegment) *
                      100,
                    100,
                  )}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              Each segment is billed separately. {info.perSegment} characters
              per segment at this encoding.
            </p>

            {info.encoding === 'UCS-2' && (
              <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-coral">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  A special character ({info.nonGsmChars.slice(0, 3).join(' ')})
                  switched this to Unicode, cutting the per-text budget from 160
                  to 70. Swap curly quotes and emoji for plain text to fit more.
                </span>
              </p>
            )}
            {overLimit && (
              <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-coral">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  Over 3 segments. Long texts read as spam and cost 4x — trim it
                  down.
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button className="h-10 bg-blue px-5 text-[14px] font-[620] text-white hover:bg-blue/90">
              Use this text
            </Button>
            <span className="text-[13px] text-muted-foreground">
              Prototype — nothing sends.
            </span>
          </div>
        </div>

        {/* Preview column */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PhonePreview sender={profile.name} body={rendered} />
          <p className="mt-3 text-center text-[12.5px] leading-relaxed text-muted-foreground">
            Merge fields filled with a real client so you catch an empty{' '}
            {'{{first_name}}'} before it goes out.
          </p>
        </div>
      </div>
    </div>
  )
}
