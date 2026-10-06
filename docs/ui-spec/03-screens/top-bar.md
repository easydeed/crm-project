# App chrome: top bar, Log out, view-as banner — every `/app/*` route
**Capture:** appears in every signed-in capture: dashboard, dashboard-call-open, people,
people-bulk-bar, person-detail, review-queue, import, settings, billing, billing-cancel, addons,
addons-lender-form, start, start-found, start-few, start-nothing, start-malformed. The view-as
banner is in no capture.

Source: `src/app/app/layout.tsx` (wraps every `/app` route), `top-bar.tsx`, `nav-link.tsx`,
`view-as-banner.tsx`. Not on the marketing pages, `/login`, `/register`, `/sample`, or the
homeowner's unsubscribe page `/u/...` (none of those are under `/app`). `/admin` has its own layout.

## What the agent came here to do
Get to one of four places in one tap, from any screen, on a phone: home (`/app`), People, Add-ons,
Settings. And sign out. The bar is redesigned once and every `/app` screen inherits it.

For a support admin, the chrome also carries the **view-as banner**: an admin can open an agent's
account read-only from `/admin/accounts` (`admin/actions.ts:13-26`, `viewAsAction`, which sets a
session flag and redirects to `/app`). While that flag is set, every `/app` screen is the agent's
data, and every write is refused (`auth/write-guard.ts:5-8`).

## Layout
Top to bottom (`layout.tsx:24-36`), identical at 1440 and 390 apart from tap-target heights:

1. **View-as banner** (only when an admin is viewing as an agent): fixed to the top of the window
   (`fixed inset-x-0 top-0 z-20`), full width, `px-4 py-3`, 15px white text on `INK_COLOR`
   `#0E1729` (`config/settings.ts:1`). Left: `Viewing as {name} — read only`. Right: `Exit`, an
   underlined button. The page under it is pushed down by `pt-14` (56px) on the wrapper
   (`layout.tsx:24`) so the banner does not cover the bar.
2. **Top bar** (`top-bar.tsx:6`): a `<header>`, `flex items-center justify-between`, `px-4 py-2`,
   page background, a faint `--rule` line underneath. Left: the wordmark `onrecord` (15px
   semibold), a link to `/app`. Right: `<nav aria-label="App">` with three links, `People`,
   `Add-ons`, `Settings`, in one row that never wraps (`flex-nowrap`, `gap-1`). Each link is 15px,
   `px-3 py-2`, rounded, `--surface` on hover. The current section is marked: `--blue-soft` fill,
   semibold, `aria-current="page"` (`nav-link.tsx:16-21`). "Current" means the path equals the link
   or sits under it, so `/app/people/review` marks People and `/app/settings/billing` marks Settings.
   The dashboard itself marks nothing: the wordmark is not a NavLink.
3. **Log out** (`layout.tsx:27-34`): a form below the bar, `px-4 pt-2`, holding one button styled as
   a text link (`linkClass`: 15px, underlined). It sits on its own line, left-aligned, above the page
   content. It is not inside the bar.
4. The page.

**1440** (capture: dashboard, desktop): the wordmark at the far left and the three links at the far
right, across the full window width. Content columns below are left-aligned, not centered.

**390** (capture: dashboard, mobile): the same single row; the three links fit beside the wordmark
with no wrap and no menu. Phone rules (`globals.css:101-120`): `.tap` on the wordmark and the nav
links makes each at least 44px tall; every `<button>` (Log out, Exit) gets `min-height: 44px`.

There is no hamburger, drawer, sticky header or backdrop blur. The bar scrolls away with the page.

## Controls
| Label (quoted) | What it does | Disabled look / when disabled | Where focus goes after |
|---|---|---|---|
| `onrecord` (`top-bar.tsx:11`) | Link to `/app` | — | Navigates |
| `People` (`top-bar.tsx:14`) | Link to `/app/people` | — | Navigates |
| `Add-ons` (`top-bar.tsx:15`) | Link to `/app/addons` | — | Navigates |
| `Settings` (`top-bar.tsx:16`) | Link to `/app/settings` | — | Navigates |
| `Log out` (`layout.tsx:32`) | Server action `logoutAction` (`login/actions.ts:39-43`): deletes the session cookie, redirects to `/login` | Never disabled | Navigates to `/login` |
| `Exit` (`view-as-banner.tsx:16`) | Server action `exitViewAsAction` (`admin/actions.ts:28-38`): clears the view-as flag, keeps the admin signed in, redirects to `/admin/accounts` | Never disabled | Navigates to the admin account list |

Focus rings: the wordmark and nav links draw a 2px `--foreground` outline offset 2px on keyboard
focus; Log out uses linkClass's 2px outline in the text colour; Exit draws a 2px white outline on
the ink banner (`view-as-banner.tsx:13`).

## States
- **Signed in, normal** (captured on every `/app` screen): bar + Log out.
- **Current section**: People / Add-ons / Settings tinted `--blue-soft` (captured: people,
  addons, settings, billing and their variants). On `/app` and `/app/start` no link is tinted.
- **Signed out**: the layout redirects to `/login?returnTo=/app` (`layout.tsx:16-18`). The return
  path is always `/app`, whichever `/app` page was requested. Not captured.
- **View-as**: banner on top, page offset 56px. The banner's name comes from the viewed account
  (`layout.tsx:20-21`). Nav and Log out are unchanged. Each screen hides or refuses its own writes;
  the shared refusal sentence is `Viewing as another agent is read only.` (`auth/write-guard.ts:3`).
  `/admin` cannot be opened while viewing as (`admin/layout.tsx:14-16` redirects to `/app`), so
  Exit is the only way back. Log out also ends it, by ending the session. Not producible from the
  seed (`scripts/seed.ts` writes one account, role `agent`); described from the code.
- **View-as with the viewed account gone**: `getAccountById` returns nothing, so no banner renders,
  though the session is still view-as and writes are still refused. Described from the code
  (`layout.tsx:19-25`); not producible.
- **Loading**: the chrome stays; each section's own `loading.tsx` renders under it (`/app`:
  `Loading…`). Not captured.
- **Error**: a section's `error.tsx` renders under the chrome. An error in the layout itself (the
  session read or the viewed-account lookup) falls through to the root `src/app/error.tsx`, with no
  bar. Described from the code.

**Risk found in the code, not verified in a capture:** on a phone, Exit is at least 44px tall, so
the banner is at least 44 + 24 (py-3) = 68px, but the page is offset by only 56px (`pt-14`). The
banner would then cover about 12px of the top bar. A long agent name that wraps makes it taller.
No capture shows view-as, so this is unmeasured.

## Fixed copy
- The three hrefs `/app/people`, `/app/addons`, `/app/settings`, `flex-nowrap`, and no
  `hamburger|menu-icon|aria-expanded` **Fixed** — `src/app/app/top-bar.test.ts:4`
- `aria-current={current ? 'page' : undefined}`, `bg-blue-soft`, `text-foreground`, and never
  `text-blue` on the current link **Fixed** — `top-bar.test.ts:24`
- `Viewing as {name} — read only` — no test holds it. Product rule: it is the only on-screen sign
  that support is reading an agent's account and cannot change it.
- `Viewing as another agent is read only.` — the constant is held by `auth/write-guard.test.ts:4`.
- `Log out`, `Exit`, `onrecord` — no test holds the wording.

## Tests that assert on this screen
- `src/app/app/top-bar.test.ts:4` — three visible links, `flex-nowrap`, no hamburger or menu toggle.
- `top-bar.test.ts:13` — the bar is a server component; only `nav-link.tsx` is a client component,
  and it reads only the pathname (no session, account or fetch), so no account data reaches the
  browser through the bar.
- `top-bar.test.ts:24` — current page marked with `aria-current`, dark text on `--blue-soft`.
- `src/app/design-debt.test.ts:49-55` — the banner is exempt from the tokens-only rule "by
  decision": "deliberately loud and outside the app's visual system: it exists to be impossible to
  miss while an admin views as an agent." Do not bring it into the token palette.
- `src/app/shared-classes.test.ts:16-18` — the banner's link styling is the one allowed copy of
  linkClass's string, for the same reason.
- `src/app/admin/actions.integration.test.ts:65` — Exit clears view-as, lands on `/admin/accounts`,
  and restores admin writes.
- `src/auth/write-guard.test.ts:4, 15` — view-as sessions cannot write; normal sessions can.
- `src/app/admin/sends-ui.test.ts:8` — agents get a 404 on the admin layout.
- Browser pass (`e2e/screens.spec.ts`, rules in `e2e/checks.ts`) on every signed-in screen at 390
  and 1440: no horizontal scroll, no clipped text, no text under 15px, and on the phone every tap
  target at least 44px (the nav links and wordmark are why they carry `.tap`).
- `docs/audits/reskin-screen-log.md:20` — the OR-029 re-skin changed 17 of 18 desktop captures,
  "every screen but unsubscribe": the bar is on all of them, so any bar change moves every capture.

## What the v0 export did, and why we did not take it
The export's bar is `reference/v0-export/components/app/app-nav.tsx`, mounted by
`reference/v0-export/app/app/layout.tsx`. It has the same three links and the same "current"
rule (`app-nav.tsx:17-19`), which we kept. What we did not take:
- **No `flex-nowrap`** (`:25`, `flex items-center gap-1 sm:gap-2`): the audit marks the top-bar test
  as BREAKS (`docs/audits/OR-027-v0-audit.md:283-287`). Wrapping links on a phone is how a menu
  creeps back in.
- **14px links, 36px tall** (`:29, :34`), and a wordmark about 25px tall (audit `:219`): under the
  15px text floor and the 44px tap rule.
- **Blue text on blue-soft for the current page** (`:36`), 4.42:1 (audit `:243`), under the 4.5:1
  floor. Ours is `--foreground` on `--blue-soft` (15.30:1, OR-029 commit e34215d).
- **Sticky, translucent `bg-white/95 backdrop-blur-md`** (`:22`), centered in `max-w-4xl`: an opacity
  colour (none are allowed in `src/app`, `disabled-state.test.ts:19`) and a fixed white that ignores
  dark mode.
- **Focus ring** `ring-blue` at `ring-offset-2` (`:34`); the audit found the export's focus halo
  under contrast generally (`:242`). Ours is a 2px `--foreground` outline.
- **No Log out and no view-as banner**: the export has neither (its layout is
  `app-nav` + children only). Both are ours; the export is a visual reference with no auth.
