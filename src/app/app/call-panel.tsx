import type { ReactNode } from 'react'
import type { CallPanel as CallPanelData } from '@/app/app/call-list-view'
import { linkClass } from '@/app/app/people/ui'
import { formatUsPhone, normalizeUsPhone } from '@/config/phone'

/**
 * One row of the panel's table (OR-044): the label in a --surface cell in muted ink (4.56:1, the
 * tightest pair the contrast test allows), the value on the page. `tall` rows hold a tel: or
 * mailto: link, so the row is 48px; the link keeps .tap for its own 44px at 390.
 */
function Row({ label, tall = false, children }: { label: string; tall?: boolean; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] border-t border-rule first:border-t-0">
      <dt className="bg-surface px-3.5 py-3 font-medium text-muted-ink">{label}</dt>
      <dd className={`min-w-0 bg-background px-3.5 py-3 ${tall ? 'flex min-h-12 items-center' : ''}`}>{children}</dd>
    </div>
  )
}

function Phone({ phone }: { phone: string | null }) {
  const digits = phone ? normalizeUsPhone(phone) : null
  if (!phone) return <>No phone on file</>
  if (!digits) return <>{phone}</>
  return (
    <a className={linkClass} href={`tel:+1${digits}`}>
      {formatUsPhone(digits)}
    </a>
  )
}

/** Everything the agent needs on the phone, without opening another screen. */
export function CallPanel({ id, panel, address }: { id: string; panel: CallPanelData; address: string }) {
  const empty = !panel.record.length && !panel.loan.length
  return (
    <dl className="mt-4 overflow-hidden rounded-lg border border-rule text-[17px]" id={id}>
      <Row label="Phone" tall>
        <Phone phone={panel.phone} />
      </Row>
      <Row label="Email" tall>
        {panel.email ? (
          <a className={`tap break-all ${linkClass}`} href={`mailto:${panel.email}`}>
            {panel.email}
          </a>
        ) : (
          <>No email on file</>
        )}
      </Row>
      <Row label="House">{address}</Row>
      {panel.record.length ? (
        <Row label="On the record">
          {panel.record.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Row>
      ) : null}
      {panel.loan.length ? (
        <Row label="Recorded against the property">
          {panel.loan.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Row>
      ) : null}
      {empty ? <Row label="On the record">Nothing recorded on this house yet.</Row> : null}
    </dl>
  )
}
