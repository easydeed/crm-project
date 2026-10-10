/**
 * The bar on /login and /register (OR-047): the navy bar pair with the wordmark only. The wordmark
 * is a <span>, not a link: on these screens it isn't a control, and the column already has its
 * cross-link. No nav, no identity line: nobody is signed in.
 */
export function AuthBar() {
  return (
    <header className="flex min-h-11 items-center justify-center bg-bar px-4 py-2 text-on-bar">
      <span className="text-[18px] font-bold">onrecord</span>
    </header>
  )
}
