import Link from 'next/link'

const linkClass =
  'underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export function AdminNav() {
  return (
    <p className="flex flex-wrap gap-4 text-[15px]">
      <Link className={linkClass} href="/admin/accounts">
        Accounts
      </Link>
      <Link className={linkClass} href="/admin/sends">
        Sends
      </Link>
      <Link className={linkClass} href="/admin/deliverability">
        Deliverability
      </Link>
      <Link className={linkClass} href="/admin/costs">
        Costs
      </Link>
    </p>
  )
}

export function formatWhen(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value)
}
