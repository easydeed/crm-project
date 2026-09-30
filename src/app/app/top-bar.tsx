import Link from 'next/link'

const linkClass =
  'whitespace-nowrap text-[15px] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3">
      <Link className={`${linkClass} font-semibold no-underline`} href="/app">
        onrecord
      </Link>
      <nav className="flex flex-nowrap items-center gap-3" aria-label="App">
        <Link className={linkClass} href="/app/people">
          People
        </Link>
        <Link className={linkClass} href="/app/addons">
          Add-ons
        </Link>
        <Link className={linkClass} href="/app/settings">
          Settings
        </Link>
      </nav>
    </header>
  )
}
