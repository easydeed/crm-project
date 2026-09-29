'use client'

import { useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import type { BusinessInfo } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function BusinessForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: BusinessInfo
  onSubmit: (info: BusinessInfo) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<BusinessInfo>(initial)
  const [error, setError] = useState('')

  const complete = Boolean(
    form.legalName.trim() &&
      form.address.trim() &&
      form.website.trim() &&
      form.sampleMessage.trim() &&
      (form.taxKind === 'sole_prop' || form.ein.trim()),
  )

  return (
    <div className="mt-4 border-t border-line pt-4">
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-coral-soft px-3 py-2 text-[13px] font-[560] text-coral">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}
      <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
        The carriers need these before your first message. Nothing sends until
        they approve.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Legal business name"
          value={form.legalName}
          onChange={(v) => setForm({ ...form, legalName: v })}
          placeholder="Coastline Realty LLC"
        />
        <TextField
          label="Business address"
          value={form.address}
          onChange={(v) => setForm({ ...form, address: v })}
          placeholder="200 W 2nd St, San Dimas, CA"
        />
      </div>
      <div className="mt-3">
        <Label className="text-[12.5px] font-[560] text-muted-foreground">
          Business type
        </Label>
        <div className="mt-1.5 flex gap-2">
          <TaxToggle
            active={form.taxKind === 'ein'}
            onClick={() => setForm({ ...form, taxKind: 'ein' })}
          >
            Has an EIN
          </TaxToggle>
          <TaxToggle
            active={form.taxKind === 'sole_prop'}
            onClick={() => setForm({ ...form, taxKind: 'sole_prop', ein: '' })}
          >
            Sole proprietor
          </TaxToggle>
        </div>
      </div>
      {form.taxKind === 'ein' && (
        <div className="mt-3">
          <TextField
            label="EIN"
            value={form.ein}
            onChange={(v) => setForm({ ...form, ein: v })}
            placeholder="12-3456789"
          />
        </div>
      )}
      <div className="mt-3 grid gap-3">
        <TextField
          label="Website"
          value={form.website}
          onChange={(v) => setForm({ ...form, website: v })}
          placeholder="coastlinerealty.com"
        />
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] font-[560] text-muted-foreground">
            Sample message
          </Label>
          <textarea
            value={form.sampleMessage}
            onChange={(e) => setForm({ ...form, sampleMessage: e.target.value })}
            placeholder="Hi {name}, it's Dana. Your neighbor's home just sold..."
            rows={2}
            className="rounded-md border border-input bg-white px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-blue"
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          onClick={() => {
            if (!complete) {
              setError(
                'Fill in every field before we can register you with the carriers.',
              )
              return
            }
            onSubmit(form)
          }}
          className="h-9 gap-1.5 bg-ink px-4 text-[13.5px] font-[560] text-white hover:bg-ink/90"
        >
          <Check className="size-4" aria-hidden />
          Submit for registration
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="h-9 px-3 text-[13.5px] font-[560] text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

function TextField({
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

function TaxToggle({
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
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-[13px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
        active
          ? 'border-blue bg-blue-soft text-blue'
          : 'border-line bg-white text-ink hover:border-blue/40',
      )}
    >
      {children}
    </button>
  )
}
