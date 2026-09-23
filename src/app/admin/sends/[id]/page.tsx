import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AdminNav, formatWhen } from '@/app/admin/admin-nav'
import { rerunSendAction } from '@/app/admin/send-actions'
import { readRequestSession } from '@/auth/current-session'
import { getSendForAdmin } from '@/db/admin-sends'

const linkClass =
  'underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

function tabHref(id: string, tab: string) {
  return tab === 'composed' ? `/admin/sends/${id}` : `/admin/sends/${id}?tab=${tab}`
}

export default async function AdminSendDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; read?: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/sends')
  const { id } = await params
  const query = await searchParams
  const send = await getSendForAdmin(session.accountId, id)
  if (!send) notFound()
  const tab = query.tab === 'skipped' || query.tab === 'failed' ? query.tab : 'composed'
  const reading = send.composed.find((row) => row.id === query.read)

  return (
    <main className="px-4 py-10">
      <AdminNav />
      <h1 className="mt-6 text-[22px] font-semibold">{send.accountName}</h1>
      <p className="mt-3 text-[15px]">
        {formatWhen(send.scheduledFor)} · {send.state} · {send.composedCount} composed ·{' '}
        {send.skippedCount} skipped · {send.sent} sent · {send.failed} failed
      </p>
      <form action={rerunSendAction} className="mt-6">
        <input name="sendId" type="hidden" value={send.id} />
        <button
          className="rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          type="submit"
        >
          Re-run this send
        </button>
      </form>
      <p className="mt-8 flex gap-4 text-[15px]">
        <Link className={linkClass} href={tabHref(send.id, 'composed')}>
          Composed
        </Link>
        <Link className={linkClass} href={tabHref(send.id, 'skipped')}>
          Skipped
        </Link>
        <Link className={linkClass} href={tabHref(send.id, 'failed')}>
          Failed
        </Link>
      </p>
      {tab === 'composed' ? (
        <Composed rows={send.composed} sendId={send.id} reading={reading} />
      ) : null}
      {tab === 'skipped' ? <Skipped rows={send.skipped} /> : null}
      {tab === 'failed' ? <Failed rows={send.failedRows} /> : null}
    </main>
  )
}

function Composed({
  rows,
  sendId,
  reading,
}: {
  rows: {
    id: string
    name: string
    email: string
    subject: string
    html: string
    blocks: string[]
  }[]
  sendId: string
  reading?: { html: string }
}) {
  if (!rows.length) {
    return <p className="mt-6 text-[15px]">Nobody was composed for this run.</p>
  }
  return (
    <div className="mt-6">
      <table className="w-full border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-black/20">
            <th className="py-2 pr-4 font-semibold">Name</th>
            <th className="py-2 pr-4 font-semibold">Email</th>
            <th className="py-2 pr-4 font-semibold">Subject</th>
            <th className="py-2 pr-4 font-semibold">Blocks</th>
            <th className="py-2 font-semibold">Read it</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-black/10">
              <td className="py-2 pr-4 align-top">{row.name}</td>
              <td className="py-2 pr-4 align-top">{row.email}</td>
              <td className="py-2 pr-4 align-top">{row.subject}</td>
              <td className="py-2 pr-4 align-top">{row.blocks.join(', ') || '—'}</td>
              <td className="py-2 align-top">
                <Link className={linkClass} href={`/admin/sends/${sendId}?read=${row.id}`}>
                  Read it
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reading ? (
        <iframe
          className="mt-6 h-[32rem] w-full border border-black/20"
          sandbox=""
          srcDoc={reading.html}
          title="Stored email"
        />
      ) : null}
    </div>
  )
}

function Skipped({ rows }: { rows: { reason: string; count: number }[] }) {
  if (!rows.length) return <p className="mt-6 text-[15px]">Nobody was skipped.</p>
  return (
    <ul className="mt-6 flex flex-col gap-3 text-[15px]">
      {rows.map((row) => (
        <li key={row.reason}>
          {row.count} · {row.reason}
        </li>
      ))}
    </ul>
  )
}

function Failed({
  rows,
}: {
  rows: { name: string; email: string; error: string; attempts: number; permanent: boolean }[]
}) {
  if (!rows.length) return <p className="mt-6 text-[15px]">No failures on this run.</p>
  return (
    <table className="mt-6 w-full border-collapse text-left text-[15px]">
      <thead>
        <tr className="border-b border-black/20">
          <th className="py-2 pr-4 font-semibold">Recipient</th>
          <th className="py-2 pr-4 font-semibold">Error</th>
          <th className="py-2 pr-4 font-semibold">Attempts</th>
          <th className="py-2 font-semibold">Failure</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.email} className="border-b border-black/10">
            <td className="py-2 pr-4 align-top">
              {row.name}
              <span className="block">{row.email}</span>
            </td>
            <td className="py-2 pr-4 align-top">{row.error}</td>
            <td className="py-2 pr-4 align-top">{row.attempts}</td>
            <td className="py-2 align-top">{row.permanent ? 'Permanent' : 'Retriable'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
