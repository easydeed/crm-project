import { ACCENT_COLORS, SEND_DAYS } from '@/config/settings'
import { formatUsPhone } from '@/config/phone'
import type { AccountRecord } from '@/db/accounts'
import { Muted } from '@/app/app/settings/field'

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[15px] font-semibold">{label}</p>
      <p className="mt-1 text-[15px]">{value}</p>
    </div>
  )
}

export function SettingsReadout({ account }: { account: AccountRecord }) {
  const accent =
    ACCENT_COLORS.find((color) => color.value === account.accentColor)?.name ??
    account.accentColor ??
    '—'
  const sendDay =
    SEND_DAYS.find((day) => day.value === account.sendDay)?.label ?? '—'

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold">Your details</h2>
        <Value label="Full name" value={account.name} />
        <Value label="Email" value={account.email} />
        <Muted>Contact us to change your email.</Muted>
        <Value label="Brokerage" value={account.brokerage ?? '—'} />
        <Value label="DRE number" value={account.dre ?? '—'} />
        <Value
          label="Phone"
          value={account.phone ? formatUsPhone(account.phone) : '—'}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold">How the email looks</h2>
        <Value label="Sender name" value={account.senderName ?? '—'} />
        <Value label="Reply-to email" value={account.replyTo ?? '—'} />
        <Value label="Accent color" value={accent} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold">Sending</h2>
        <Value label="Send day" value={sendDay} />
        <Value label="Time of day" value={account.sendTime ?? '—'} />
        <Value label="Timezone" value={account.timezone ?? '—'} />
        <Value
          label="Pause my monthly note"
          value={account.paused ? 'On' : 'Off'}
        />
      </section>
    </div>
  )
}
