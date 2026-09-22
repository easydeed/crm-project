import { notFound, redirect } from 'next/navigation'
import { fixturesToJson } from '@/admin/matching-export'
import { parseFailureStatus } from '@/admin/matching-labels'
import { readRequestSession } from '@/auth/current-session'
import { listMatchingFailuresForAdmin } from '@/db/admin-matching'

export async function GET(request: Request) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/matching')
  if (session.role !== 'admin' || session.viewingAsAccountId) notFound()

  const url = new URL(request.url)
  const status = parseFailureStatus(url.searchParams.get('status') ?? undefined)
  const account = url.searchParams.get('account')?.trim() || undefined
  const rows = await listMatchingFailuresForAdmin(session.accountId, {
    status,
    accountId: account,
  })
  const body = fixturesToJson(rows)

  return new Response(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'attachment; filename="matching-fixtures.json"',
    },
  })
}
