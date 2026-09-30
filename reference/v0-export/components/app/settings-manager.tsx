'use client'

import { useStore } from '@/lib/store'
import { PageHeader } from '@/components/app/page-header'
import { SampleDigest } from '@/components/digest/sample-digest'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const SWATCHES = ['#2F5BFF', '#0E7C66', '#B4462F', '#1A1A1A', '#7A4CC4']

export function SettingsManager() {
  const {
    profile,
    setProfile,
    emailLook,
    setEmailLook,
    sending,
    setSending,
  } = useStore()

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <PageHeader
        title="Settings"
        subtitle="Your details, how the email looks, and when it goes out."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* profile */}
          <Section
            title="Your details"
            note="Shown in the header and footer of every note."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                value={profile.name}
                onChange={(v) => setProfile({ name: v })}
              />
              <Field
                label="Brokerage"
                value={profile.brokerage}
                onChange={(v) => setProfile({ brokerage: v })}
              />
              <Field
                label="Email"
                value={profile.email}
                onChange={(v) => setProfile({ email: v })}
              />
              <Field
                label="Phone"
                value={profile.phone}
                onChange={(v) => setProfile({ phone: v })}
              />
              <Field
                label="DRE #"
                value={profile.dre}
                onChange={(v) => setProfile({ dre: v })}
              />
            </div>
          </Section>

          {/* email look */}
          <Section
            title="How the email looks"
            note="Changes show in the preview on the right as you type."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Sender name"
                value={emailLook.senderName}
                onChange={(v) => setEmailLook({ senderName: v })}
              />
              <Field
                label="Reply-to"
                value={emailLook.replyTo}
                onChange={(v) => setEmailLook({ replyTo: v })}
              />
            </div>
            <div className="mt-4">
              <Label className="text-[12.5px] font-[560] text-muted">
                Accent color
              </Label>
              <div className="mt-2 flex items-center gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEmailLook({ brandColor: c })}
                    aria-label={`Use ${c}`}
                    className={`size-8 rounded-full ring-offset-2 transition ${
                      emailLook.brandColor === c
                        ? 'ring-2 ring-ink'
                        : 'ring-1 ring-line'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </Section>

          {/* sending */}
          <Section
            title="When it goes out"
            note="One note a month. You approve nothing — it just sends."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[12.5px] font-[560] text-muted">
                  Send day
                </Label>
                <Select
                  value={sending.sendDay}
                  onValueChange={(v) =>
                    setSending({ sendDay: (v as '1' | '15') ?? '1' })
                  }
                >
                  <SelectTrigger className="h-9 bg-white text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st of the month</SelectItem>
                    <SelectItem value="15">15th of the month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field
                label="Time"
                value={sending.timeOfDay}
                onChange={(v) => setSending({ timeOfDay: v })}
              />
              <Field
                label="Timezone"
                value={sending.timezone}
                onChange={(v) => setSending({ timezone: v })}
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3">
              <div>
                <p className="text-[14px] font-[600] text-ink">
                  Pause all sending
                </p>
                <p className="text-[13px] text-muted">
                  Nobody gets a note until you switch this back on.
                </p>
              </div>
              <Switch
                checked={sending.paused}
                onCheckedChange={(v) => {
                  setSending({ paused: v })
                  toast.success(v ? 'Sending paused.' : 'Sending resumed.')
                }}
              />
            </div>

            <Button
              onClick={() => toast.success('Settings saved.')}
              className="mt-4 h-10 bg-blue px-5 text-[14px] font-[560] text-white hover:bg-blue/90"
            >
              Save settings
            </Button>
          </Section>
        </div>

        {/* live preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-[12px] font-[620] uppercase tracking-[0.08em] text-muted">
            Live preview
          </p>
          <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-line">
            <SampleDigest
              branding={{
                agentName: emailLook.senderName || profile.name,
                brokerage: profile.brokerage,
                dre: profile.dre,
                brandColor: emailLook.brandColor,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-[15px] font-[640] text-ink">{title}</h2>
      <p className="mt-0.5 text-[13px] text-muted">{note}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[12.5px] font-[560] text-muted">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 bg-white text-[14px]"
      />
    </div>
  )
}
