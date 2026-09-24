import { redirect } from 'next/navigation'
import { AdminNav, formatWhen } from '@/app/admin/admin-nav'
import { adminUnpauseAction } from '@/app/admin/send-actions'
import { readRequestSession } from '@/auth/current-session'
import { formatRate } from '@/admin/delivery-math'
import { loadDeliverabilityForAdmin } from '@/db/admin-deliverability'

export default async function DeliverabilityPage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/deliverability')
  const view = await loadDeliverabilityForAdmin(session.accountId)
  if (!view) redirect('/login?returnTo=/admin/deliverability')
  const { totals } = view

  return (
    <main className="px-4 py-10">
      <AdminNav />
      <h1 className="mt-6 text-[22px] font-semibold">Deliverability</h1>
      <p className="mt-3 text-[15px]">Trailing 30 days, all accounts.</p>
      <dl className="mt-6 grid max-w-3xl grid-cols-2 gap-4 text-[15px] sm:grid-cols-5">
        <Stat label="Sent" value={String(totals.sent)} />
        <Stat label="Delivered" value={String(totals.delivered)} />
        <Stat label="Bounced" value={String(totals.bounced)} />
        <Stat label="Complained" value={String(totals.complained)} />
        <Stat label="Unsubscribed" value={String(totals.unsubscribed)} />
      </dl>
      <div className="mt-8 flex flex-wrap gap-10">
        <p>
          <span className="block text-[15px]">Bounce rate</span>
          <span className="text-[28px] font-semibold">{formatRate(totals.bounceRate)}</span>
        </p>
        <p>
          <span className="block text-[15px]">Complaint rate</span>
          <span className="text-[28px] font-semibold">{formatRate(totals.complaintRate)}</span>
        </p>
      </div>
      {totals.domains.length === 0 ? (
        <p className="mt-8 text-[15px]">No mail has gone out in the last 30 days.</p>
      ) : (
        <table className="mt-8 w-full border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b border-black/20">
              <th className="py-2 pr-4 font-semibold">Domain</th>
              <th className="py-2 pr-4 font-semibold">Sent</th>
              <th className="py-2 pr-4 font-semibold">Bounce rate</th>
              <th className="py-2 font-semibold">Complaint rate</th>
            </tr>
          </thead>
          <tbody>
            {totals.domains.map((row) => (
              <tr key={row.domain} className="border-b border-black/10">
                <td className="py-2 pr-4">{row.domain}</td>
                <td className="py-2 pr-4">{row.sent}</td>
                <td className="py-2 pr-4">{formatRate(row.bounceRate)}</td>
                <td className="py-2">{formatRate(row.complaintRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h2 className="mt-10 text-[18px] font-semibold">Paused by complaint rate</h2>
      {view.paused.length === 0 ? (
        <p className="mt-3 text-[15px]">No account is paused for complaints.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {view.paused.map((account) => (
            <li key={account.id}>
              <form action={adminUnpauseAction}>
                <input name="accountId" type="hidden" value={account.id} />
                <span className="mr-4 text-[15px]">{account.name}</span>
                <button
                  className="text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  type="submit"
                >
                  Unpause account
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-10 text-[18px] font-semibold">Suppression list</h2>
      {view.suppressed.length === 0 ? (
        <p className="mt-3 text-[15px]">No one has opted out.</p>
      ) : (
        <table className="mt-4 w-full border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b border-black/20">
              <th className="py-2 pr-4 font-semibold">Address</th>
              <th className="py-2 pr-4 font-semibold">Reason</th>
              <th className="py-2 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {view.suppressed.map((row) => (
              <tr key={row.id} className="border-b border-black/10">
                <td className="py-2 pr-4">
                  {row.email ?? <span className="sr-only">No contact has this address</span>}
                </td>
                <td className="py-2 pr-4">{row.reason}</td>
                <td className="py-2">{formatWhen(row.at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className="text-[22px] font-semibold">{value}</dd>
    </div>
  )
}
