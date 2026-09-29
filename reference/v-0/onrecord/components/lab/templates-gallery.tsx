'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/app/page-header'
import { MlsAttribution } from '@/components/lab/mls-attribution'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CHANNEL_META, renderTemplate } from '@/lib/lab-data'
import {
  SEED_TEMPLATES,
  TEMPLATE_CATEGORIES,
  CATEGORY_ICON,
  type Template,
  type TemplateCategory,
} from '@/lib/lab-templates'
import { Lock, Sparkles, Mail, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

type CatFilter = TemplateCategory | 'All'
type ChanFilter = 'all' | 'email' | 'sms'

export function TemplatesGallery() {
  const router = useRouter()
  const [cat, setCat] = useState<CatFilter>('All')
  const [chan, setChan] = useState<ChanFilter>('all')

  const filtered = useMemo(
    () =>
      SEED_TEMPLATES.filter(
        (t) =>
          (cat === 'All' || t.category === cat) &&
          (chan === 'all' || t.channel === chan),
      ),
    [cat, chan],
  )

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="Start from something written by people who send these for a living. Every one is editable."
      />

      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
            <FilterChip active={cat === 'All'} onClick={() => setCat('All')}>
              All
            </FilterChip>
            {TEMPLATE_CATEGORIES.map((c) => (
              <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>
                {c}
              </FilterChip>
            ))}
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Channel">
            <FilterChip active={chan === 'all'} onClick={() => setChan('all')}>
              Any channel
            </FilterChip>
            <FilterChip active={chan === 'email'} onClick={() => setChan('email')}>
              <Mail className="size-3.5" aria-hidden /> Email
            </FilterChip>
            <FilterChip active={chan === 'sms'} onClick={() => setChan('sms')}>
              <MessageSquare className="size-3.5" aria-hidden /> Text
            </FilterChip>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TemplateCard key={t.id} tpl={t} onUse={() => router.push('/lab/campaigns/new')} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-10 text-center text-[14px] text-muted-foreground">
            No templates match those filters.
          </p>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-[560] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
        active
          ? 'border-blue bg-blue text-white'
          : 'border-line bg-white text-ink hover:border-blue/40',
      )}
    >
      {children}
    </button>
  )
}

function TemplateCard({ tpl, onUse }: { tpl: Template; onUse: () => void }) {
  const Icon = CATEGORY_ICON[tpl.category]
  const Chan = CHANNEL_META[tpl.channel].icon
  return (
    <Dialog>
      <div className="flex flex-col rounded-2xl border border-line bg-white p-4">
        <div className="flex items-start justify-between">
          <div className="grid size-9 place-items-center rounded-lg bg-blue-soft text-blue">
            <Icon className="size-4" aria-hidden />
          </div>
          <div className="flex items-center gap-1.5">
            {tpl.premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral-soft px-2 py-0.5 text-[11px] font-[620] text-coral">
                <Sparkles className="size-3" aria-hidden /> Pro
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-[560] text-muted-foreground">
              <Chan className="size-3" aria-hidden />
              {CHANNEL_META[tpl.channel].label}
            </span>
          </div>
        </div>
        <h3 className="mt-3 text-[15px] font-[620] leading-snug text-ink text-pretty">
          {tpl.name}
        </h3>
        <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted-foreground">
          {tpl.description}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <DialogTrigger
            render={
              <Button
                variant="outline"
                className="h-8 flex-1 border-line text-[13px] font-[560] text-ink"
              />
            }
          >
            Preview
          </DialogTrigger>
          <Button
            onClick={onUse}
            className="h-8 flex-1 bg-blue text-[13px] font-[600] text-white hover:bg-blue/90"
          >
            Use
          </Button>
        </div>
      </div>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[16px]">
            {tpl.premium && <Lock className="size-4 text-coral" aria-hidden />}
            {tpl.name}
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink">
            {renderTemplate(tpl.body)}
          </p>
          {tpl.mls && (
            <div className="mt-3">
              <MlsAttribution />
            </div>
          )}
        </div>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          Sample values shown. Real sends pull each client{'\u2019'}s own record.
        </p>
        <Button
          onClick={onUse}
          className="h-10 w-full bg-blue text-[14px] font-[620] text-white hover:bg-blue/90"
        >
          Use this template
        </Button>
      </DialogContent>
    </Dialog>
  )
}
