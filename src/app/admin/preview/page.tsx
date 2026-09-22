import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DigestPreviewPanel } from '@/app/digest/preview-panel'
import { AccountPreviewTable } from '@/app/admin/preview/account-table'
import { readRequestSession } from '@/auth/current-session'
import { getAccountById } from '@/db/accounts'
import { findContactForAdminPreview } from '@/db/admin-preview'
import { getRuntimeDb } from '@/db/runtime'
import { listAccountDigestPreviews } from '@/digest/account-preview'
import { buildDigestInput } from '@/digest/build-input'
import { renderDigest } from '@/digest/render'
import { MISSING_ACCOUNT, MISSING_PERSON, UNMATCHED_REASON } from '@/digest/skip-copy'

const linkClass =
  'underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export default async function AdminPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ contact?: string; account?: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/preview')

  const params = await searchParams
  const contactId = params.contact?.trim()
  const accountId = params.account?.trim()

  if (contactId) return <ContactPreview contactId={contactId} />
  if (accountId) return <AccountPreview accountId={accountId} />

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">Preview</h1>
      <p className="mt-6 max-w-xl text-[15px]">
        Choose an account to preview every person&apos;s note. This screen is read only.
      </p>
      <p className="mt-4">
        <Link className={linkClass} href="/admin/accounts">
          Open accounts
        </Link>
      </p>
    </main>
  )
}

async function ContactPreview({ contactId }: { contactId: string }) {
  const person = await findContactForAdminPreview(contactId)
  if (!person) {
    return (
      <PreviewShell title="Preview">
        <p className="mt-6 text-[15px]">{MISSING_PERSON}</p>
      </PreviewShell>
    )
  }
  const { db } = getRuntimeDb()
  const input = await buildDigestInput(db, person.accountId, person.id, new Date())
  const result = input
    ? renderDigest(input)
    : { send: false as const, reason: UNMATCHED_REASON }

  return (
    <PreviewShell title={person.name}>
      <p className="mt-3 text-[15px]">Read only.</p>
      <div className="mt-8">
        <DigestPreviewPanel title="Preview their email" result={result} />
      </div>
    </PreviewShell>
  )
}

async function AccountPreview({ accountId }: { accountId: string }) {
  const account = await getAccountById(accountId)
  if (!account) {
    return (
      <PreviewShell title="Preview">
        <p className="mt-6 text-[15px]">{MISSING_ACCOUNT}</p>
      </PreviewShell>
    )
  }
  const { db } = getRuntimeDb()
  const rows = await listAccountDigestPreviews(db, accountId, new Date())

  return (
    <PreviewShell title={account.name}>
      <p className="mt-3 text-[15px]">Read only. Skipped notes are listed first.</p>
      <AccountPreviewTable accountId={accountId} rows={rows} />
    </PreviewShell>
  )
}

function PreviewShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <main className="px-4 py-10">
      <p className="text-[15px]">
        <Link className={linkClass} href="/admin/accounts">
          Accounts
        </Link>
      </p>
      <h1 className="mt-6 text-[22px] font-semibold">{title}</h1>
      {children}
    </main>
  )
}
