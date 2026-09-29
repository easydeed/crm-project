'use client'

import { useStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Addon } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ExtraRow({
  addon,
  icon: Icon,
  children,
}: {
  addon: Addon
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            addon.enabled ? 'bg-blue text-white' : 'bg-blue-soft text-blue',
          )}
        >
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <h3 className="text-[15px] font-[600] text-ink">{addon.title}</h3>
            <span className="text-[13px] font-[560] text-muted-foreground">
              {addon.price}
              {addon.unit}
            </span>
            {addon.id === 'text-call-list' && addon.enabled && (
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] font-[560] text-muted-foreground">
                Default on
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
            {addon.detail}
          </p>
          {addon.id === 'add-lender' && addon.enabled && <LenderSummary />}
        </div>
        {children}
      </div>
    </div>
  )
}

function LenderSummary() {
  const { lenderInfo } = useStore()
  if (!lenderInfo.name) return null
  return (
    <p className="mt-1 text-[13px] font-[560] text-ink">
      {lenderInfo.name} {'\u00b7'} NMLS {lenderInfo.nmls}
    </p>
  )
}

export function WeeklyThumb() {
  return (
    <div
      aria-hidden
      className="w-full shrink-0 rounded-lg border border-line bg-surface p-3 sm:w-40"
    >
      <div className="h-2 w-12 rounded-full bg-blue" />
      <div className="mt-2 h-1.5 w-full rounded-full bg-line" />
      <div className="mt-1 h-1.5 w-4/5 rounded-full bg-line" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-8 flex-1 rounded bg-white" />
        <div className="h-8 flex-1 rounded bg-white" />
      </div>
      <div className="mt-2 h-1.5 w-2/3 rounded-full bg-line" />
    </div>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12.5px] font-[560] text-muted-foreground">
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 bg-white text-[14px]"
      />
    </div>
  )
}
