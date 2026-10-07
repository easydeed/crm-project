import Link from 'next/link'
import { NavLink } from '@/app/app/nav-link'

/** The bar (OR-043): navy on the bar pair in both themes. Its focus ring is --on-bar, which shows on it. */
export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-3 bg-bar px-4 py-2 text-on-bar">
      <Link
        className="tap whitespace-nowrap rounded-md text-[18px] font-bold text-on-bar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-bar"
        href="/app"
      >
        onrecord
      </Link>
      <nav className="flex flex-nowrap items-center gap-1" aria-label="App">
        <NavLink href="/app/people">People</NavLink>
        <NavLink href="/app/addons">Add-ons</NavLink>
        <NavLink href="/app/settings">Settings</NavLink>
      </nav>
    </header>
  )
}
