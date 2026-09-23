import type { CallPanel as CallPanelData } from '@/app/app/call-list-view'
import { linkClass } from '@/app/app/people/ui'
import { formatUsPhone, normalizeUsPhone } from '@/config/phone'

function Phone({ phone }: { phone: string | null }) {
  const digits = phone ? normalizeUsPhone(phone) : null
  if (!phone) return <dd>No phone on file</dd>
  if (!digits) return <dd>{phone}</dd>
  return (
    <dd>
      <a className={linkClass} href={`tel:+1${digits}`}>
        {formatUsPhone(digits)}
      </a>
    </dd>
  )
}

/** Everything the agent needs on the phone, without opening another screen. */
export function CallPanel({ id, panel, address }: { id: string; panel: CallPanelData; address: string }) {
  const empty = !panel.record.length && !panel.loan.length
  return (
    <div className="mt-4 rounded-md border border-foreground/20 p-4 text-[15px]" id={id}>
      <dl className="flex flex-col gap-3">
        <div>
          <dt className="font-medium">Phone</dt>
          <Phone phone={panel.phone} />
        </div>
        <div>
          <dt className="font-medium">Email</dt>
          <dd className="break-all">
            <a className={linkClass} href={`mailto:${panel.email}`}>
              {panel.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-medium">House</dt>
          <dd>{address}</dd>
        </div>
      </dl>
      {panel.record.length ? (
        <section className="mt-4" aria-label="On the record">
          <h3 className="font-medium">On the record</h3>
          {panel.record.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      ) : null}
      {panel.loan.length ? (
        <section className="mt-4" aria-label="Recorded against the property">
          <h3 className="font-medium">Recorded against the property</h3>
          {panel.loan.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      ) : null}
      {empty ? <p className="mt-4">Nothing recorded on this house yet.</p> : null}
    </div>
  )
}
