import Link from 'next/link'
import type { AccountListDir, AccountListRow, AccountListSort } from '@/db/admin-accounts'
import { formatAdminDate } from '@/app/admin/accounts/format'

const headerClass =
  'px-3 py-2 text-left text-[15px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

function sortHref(args: {
  q: string
  sort: AccountListSort
  currentSort: AccountListSort
  currentDir: AccountListDir
}) {
  const dir =
    args.currentSort === args.sort && args.currentDir === 'desc' ? 'asc' : 'desc'
  const params = new URLSearchParams()
  if (args.q) params.set('q', args.q)
  params.set('sort', args.sort)
  params.set('dir', dir)
  return `/admin/accounts?${params.toString()}`
}

export function AccountsTable({
  rows,
  q,
  sort,
  dir,
}: {
  rows: AccountListRow[]
  q: string
  sort: AccountListSort
  dir: AccountListDir
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[48rem] border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-foreground/20">
            <th className={headerClass}>Name</th>
            <th className={headerClass}>Email</th>
            <th className={headerClass}>Brokerage</th>
            <th className={headerClass}>
              <Link
                className="underline underline-offset-4"
                href={sortHref({ q, sort: 'signup', currentSort: sort, currentDir: dir })}
              >
                Signup date
              </Link>
            </th>
            <th className={headerClass}>
              <Link
                className="underline underline-offset-4"
                href={sortHref({ q, sort: 'contacts', currentSort: sort, currentDir: dir })}
              >
                Contact count
              </Link>
            </th>
            <th className={headerClass}>Role</th>
            <th className={headerClass}>Last login</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-foreground/10">
              <td className="px-3 py-2">
                <Link
                  className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  href={`/admin/accounts/${row.id}`}
                >
                  {row.name}
                </Link>
              </td>
              <td className="px-3 py-2">{row.email}</td>
              <td className="px-3 py-2">{row.brokerage ?? '—'}</td>
              <td className="px-3 py-2">{formatAdminDate(row.createdAt)}</td>
              <td className="px-3 py-2">{row.contactCount}</td>
              <td className="px-3 py-2">{row.role}</td>
              <td className="px-3 py-2">{formatAdminDate(row.lastLoggedInAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
