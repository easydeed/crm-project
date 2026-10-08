import type { ReactNode } from 'react'
import { DetailsRow, DetailsTable } from '@/app/app/details-table'
import type { CallPanel as CallPanelData } from '@/app/app/call-list-view'
import { linkClass } from '@/app/app/people/ui'
import { formatUsPhone, normalizeUsPhone } from '@/config/phone'

/** The call panel's label column: 88px, as drawn (OR-044). */
const LABELS = 'grid-cols-[88px_1fr]'

function Row({ label, tall, children }: { label: string; tall?: boolean; children: ReactNode }) {
  return (
    <DetailsRow label={label} labels={LABELS} tall={tall}>
      {children}
    </DetailsRow>
  )
}

function Phone({ phone }: { phone: string | null }) {
  const digits = phone ? normalizeUsPhone(phone) : null
  if (!phone) return <>No phone on file</>
  if (!digits) return <>{phone}</>
  return (
    <a className={`tap ${linkClass}`} href={`tel:+1${digits}`}>
      {formatUsPhone(digits)}
    </a>
  )
}

/** Everything the agent needs on the phone, without opening another screen. */
export function CallPanel({ id, panel, address }: { id: string; panel: CallPanelData; address: string }) {
  const empty = !panel.record.length && !panel.loan.length
  return (
    <DetailsTable className="mt-4 text-[17px]" id={id}>
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
    </DetailsTable>
  )
}
