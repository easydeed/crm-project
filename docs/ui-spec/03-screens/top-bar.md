# App chrome: top bar, identity line, view-as banner — every `/app/*` route
**Capture:** appears in every signed-in capture: dashboard, dashboard-dark, dashboard-quiet,
dashboard-quiet-dark, dashboard-call-open, people, people-bulk-bar, person-detail, review-queue,
import, settings, billing, billing-cancel, addons, addons-dark, addons-lender-form, start,
start-found, start-few, start-nothing, start-malformed. The view-as banner is in no capture (the
seed has no admin).

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
Top to bottom (`layout.tsx`), since OR-043:

1. **View-as banner** (only when an admin is viewing as an agent): sticky at the top of the page
   and in its flow (`sticky top-0 z-20`), so it takes its own height at every width and can't
   cover the bar. Coral `--alert` with navy `--on-alert` words, semibold, 5.34:1. Its edge against
   the bar is 5.34:1 in light and 4.12:1 in dark, so it never merges with it. Left:
   `Viewing as {name} — read only`. Right: `Exit`, an underlined button (`linkBaseClass`, 44px).
   Until OR-043 it was fixed, on `INK_COLOR` `#0E1729`: the same as the navy bar, and 68px tall on a
   phone against a 56px page offset.
2. **Top bar** (`top-bar.tsx`): a `<header>` on the bar pair, `--bar` (#0e1729 light, #202b4f
   dark) with `--on-bar` words. It stays navy in both themes rather than flipping with
   `--foreground`.
   - Left: the wordmark `onrecord`, 18px bold, a link to `/app`.
   - Right: `<nav aria-label="App">` with three links, `People`, `Add-ons` and `Settings`, in one
     row that never wraps (`flex-nowrap`). Each link is 16px, underlined on hover.
   - The current section is the light pill on the dark bar: `--bar-current` with
     `--on-bar-current` words, semibold, `aria-current="page"`. "Current" means the path equals the
     link or sits under it. The dashboard and `/app/start` mark nothing.
3. **Identity line** (`layout.tsx`): under the bar, a `--rule` line beneath it.
   - Left: the account's name and brokerage, joined by " · ", in `mutedClass`. In view-as it is the
     viewed account, whose data is on screen.
   - Right: `Log out`, a `<button>` in a `<form action={logoutAction}>`, styled as a link
     (`linkClass`), 44px. Never a link: logging out is a form action, and a link to it would be a
     dead control.
4. The page.

**390**: the same single row of the bar. `.tap` on the wordmark and nav links, and `min-h-11` on Log
out and Exit, make each at least 44px tall.

There is no hamburger, drawer, hover fill or translucency. The bar scrolls away with the page; the
banner stays.

## Controls
| Label (quoted) | What it does | Disabled look / when disabled | Where focus goes after |
|---|---|---|---|
| `onrecord` (`top-bar.tsx:11`) | Link to `/app` | — | Navigates |
| `People` (`top-bar.tsx:14`) | Link to `/app/people` | — | Navigates |
| `Add-ons` (`top-bar.tsx:15`) | Link to `/app/addons` | — | Navigates |
| `Settings` (`top-bar.tsx:16`) | Link to `/app/settings` | — | Navigates |
| `Log out` (`layout.tsx:32`) | Server action `logoutAction` (`login/actions.ts:39-43`): deletes the session cookie, redirects to `/login` | Never disabled | Navigates to `/login` |
| `Exit` (`view-as-banner.tsx:16`) | Server action `exitViewAsAction` (`admin/actions.ts:28-38`): clears the view-as flag, keeps the admin signed in, redirects to `/admin/accounts` | Never disabled | Navigates to the admin account list |

Focus rings: on the bar, the wordmark and nav links draw a 2px `--on-bar` outline offset 2px. A
`--foreground` ring would be navy on navy, invisible; `--on-bar` on `--bar` is 17.90:1 light and
11.80:1 dark. Log out uses linkClass's outline in its text colour. Exit's outline is its
`--on-alert` text colour on the coral banner.

## States
- **Signed in, normal** (captured on every `/app` screen): the navy bar and the identity line.
- **Current section**: People, Add-ons or Settings as the light pill (captured: people, addons,
  addons-dark, settings, billing and their variants). On `/app` and `/app/start` no link is marked.
- **Signed out**: the layout redirects to `/login?returnTo=/app` (`layout.tsx:16-18`). The return
  path is always `/app`, whichever `/app` page was requested. Not captured.
- **View-as**: the coral banner on top, in the page's flow; the identity line names the viewed
  account. The banner's name comes from the viewed account (`layout.tsx`). Nav and Log out are unchanged. Each screen hides or refuses its own writes;
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

**Closed in OR-043:** the banner was fixed at 68px on a phone against a 56px page offset, covering
part of the bar. It is sticky and in the flow now, so it takes its own height at any width.

## Fixed copy
- The three hrefs `/app/people`, `/app/addons`, `/app/settings`, `flex-nowrap`, and no
  `hamburger|menu-icon|aria-expanded` **Fixed** — `src/app/app/top-bar.test.ts:4`
- `aria-current={current ? 'page' : undefined}`; the current link on `bg-bar-current` with
  `text-on-bar-current`, the rest `text-on-bar`; one text colour per look; never blue; the focus
  outline `--on-bar` **Fixed** — `top-bar.test.ts:24` (rewritten in OR-043)
- `Viewing as {name} — read only` — no test holds it. Product rule: it is the only on-screen sign
  that support is reading an agent's account and cannot change it.
- `Viewing as another agent is read only.` — the constant is held by `auth/write-guard.test.ts:4`.
- `Log out`, `Exit`, `onrecord` — no test holds the wording. `chrome.test.ts` holds that Log out is
  a submit button in a form running `logoutAction`.

## Tests that assert on this screen
- `src/app/app/top-bar.test.ts:4` — three visible links, `flex-nowrap`, no hamburger or menu toggle.
- `top-bar.test.ts:13` — the bar is a server component; only `nav-link.tsx` is a client component,
  and it reads only the pathname (no session, account or fetch), so no account data reaches the
  browser through the bar.
- `top-bar.test.ts:24` — the current page is the light pill on the bar pair, with `aria-current`.
- `src/app/app/chrome.test.ts` (OR-043):
  - the bar is `--bar` with `--on-bar` words, and nothing on it uses another colour or focus ring
  - the banner is the alert pair, sticky not fixed, with no `style` colour and no `INK_COLOR`
  - Log out is a submit button in a form running `logoutAction`
- `src/app/tokens.test.ts` — the bar pair and the alert pair, light and dark. The banner was exempt
  from the colour scan until OR-043; it is scanned now, like everything else in `src/app`.
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
