import Link from 'next/link'
import { NavLink } from '@/app/app/nav-link'

export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-rule bg-background px-4 py-2">
      <Link
        className="tap whitespace-nowrap rounded-md text-[15px] font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        href="/app"
      >
        onrecord
      </Link>
      <nav className="flex items-center gap-1" aria-label="App">
        <NavLink href="/app/people">People</NavLink>
        <NavLink href="/app/addons">Add-ons</NavLink>
        <NavLink href="/app/settings">Settings</NavLink>
      </nav>
    </header>
  )
}
