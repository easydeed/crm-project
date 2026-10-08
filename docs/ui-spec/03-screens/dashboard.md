# Dashboard — `/app`
**Capture:** dashboard, dashboard-dark, dashboard-quiet, dashboard-quiet-dark, dashboard-call-open. Shared chrome (top bar, identity line, Log out,
view-as banner) is specified once in `top-bar.md`.

## What the agent came here to do
Answer two questions between appointments: "is my monthly note going out, and if not, what do I do?"
and "who is worth a call this month?" Then call one of them without leaving the page. The page is the
agent's home: the wordmark in the top bar links here, and login returns here (`/login?returnTo=/app`,
`src/app/app/page.tsx:13`).

The "monthly note" is the email the agent's homeowners get each month, built from the county record
for their house. The "call list" is at most three of the agent's people, picked by a monthly job from
recorded events ("signals"). A "matched" person is one tied to a county parcel ("a house").

## Layout
Three blocks, in this order and nothing else (`page.tsx`: "Order is fixed: send status, then the
call list, then homeowners. Nothing else."; held by `call-list.test.ts:78`). Since OR-044 they sit in
a 760px column (`max-w-[760px]`, this screen only), 20px apart (24px from `sm`), with 16px page
margins (32px from `sm`). There is no grid and no sidebar.

1. **Send card** (`HomeSendCard`, `home-card.tsx`; or `HomeBillingCard`, `home-billing-card.tsx`). The
   plain panel, `sendCardClass`: a `--rule` border, `rounded-xl`, page background, no header strip.
   The class comment is the rule: "One message, at most one primary action. No figures, counts or
   tiles." It holds a 22px semibold `<h1>` (24px from `sm`, `sendCardHeadingClass`), a 15px body line,
   and one primary button. In the scheduled state, "Preview it" is the primary button and "Skip this
   month" a form button styled as a link (OR-044). An `<a>` can't post, so Skip is never a link.
2. **Call list** (`CallListSection`, `call-list.tsx`): a panel (`panelClass`) whose `<h2>` "Worth a
   call this month" is the `--surface` header strip (`panelHeaderClass`). Every state sits inside
   the one panel, each block divided by `--rule`:
   - the text-notice line
   - the empty states
   - up to three ranked rows in an `<ol>`
   - the quiet line
3. **Your homeowners** (`homeowners-section.tsx`): a panel with its header strip. The body holds one
   17px sentence and one "Open people" link.

**Call row** (`call-entry.tsx`): a grid, with a 36px rank column (40px from `sm`).
- **The rank:** the row's number, 26px bold, in ink. It is never blue, because blue means a link
  (OR-042). It is `aria-hidden`; the `<ol>` counts the rows for screen readers.
- **Then, top to bottom:**
  - the name (19px semibold)
  - the tag (`tagClass`), coloured by signal kind
  - the signal's own sentence (17px)
  - the address and close date in muted ink, joined by " · Closed "
  - "Called this month.", if already called
- **The Call button** is the secondary button (`secondaryButtonClass`), as the design draws it.
  OR-044 changed it from primary on purpose.
  - **1440:** it sits in a third column at its natural width (capture: dashboard).
  - **390:** it spans the row, full width, under the text.
- **Called rows** take the `--surface` fill.

**Call open** (capture: dashboard-call-open): the button label flips to "Close". An inline table
(`call-panel.tsx`) opens under the row: a `<dl>` with a `--rule` border, `rounded-lg`, 17px.
- **Labels** sit in an 88px `--surface` cell in muted ink (4.56:1, the tightest pair the contrast
  test allows). Values sit on the page.
- **Rows:**
  - Phone
  - Email
  - House
  - "On the record" (the note's own record block)
  - "Recorded against the property" (the note's loan block)
  - When neither record block has lines, an "On the record" row reads "Nothing recorded on this
    house yet."
- **Never an MLS listing under "On the record":** the design drew one there, and OR-044 refused it.
- **Under the table:** **Mark as called** (primary) and **Not now** (secondary) side by side,
  wrapping on a phone.
- **No modal, ever** (`call-list.test.ts:102`).

Phones (`max-width: 639.98px`): every button is at least 44px tall. The phone and email rows are
48px, and their links carry `.tap`, so they are 44px too.

## Controls
| Label (quoted) | What it does | Disabled look / when disabled | Where focus goes after |
|---|---|---|---|
| `Unpause` (`home-card.tsx:53`) | Server action `unpauseAction` (`send-actions.ts:33`): turns the agent's own pause off, redirects to `/app`. Not rendered in view-as. | Never disabled | Full page reload via redirect; focus returns to the document start |
| `Open settings` (`home-card.tsx:67`) | Link to `/app/settings` | — | Navigates |
| `Add your people` (`home-card.tsx:81`) | Link to `/app/people/import` | — | Navigates |
| `Open the review queue` (`home-card.tsx:95`) | Link to `/app/people/review` | — | Navigates |
| `Open people` (`home-card.tsx:109`) | Link to `/app/people` | — | Navigates |
| `Resume` (`home-card.tsx:122`) | `resumeMonthAction`: un-skips this month's send, redirects to `/app`. Not rendered in view-as. | Never disabled | Reload, as Unpause |
| `Preview it` (`home-card.tsx`) | The primary button (since OR-044), a link to the person page of the alphabetically first eligible person (`home-send.ts:89-95`), where the note preview lives | — | Navigates |
| `Skip this month` (`home-card.tsx`) | A form button styled as a link (since OR-044). `skipMonthAction`: skips the upcoming send, redirects to `/app`. Not rendered in view-as. | Never disabled | Reload |
| `Contact us` (`home-card.tsx:41`) | `mailto:help@onrecord.com?subject=Paused account - <account id>` (`config/support.ts:12`) | — | Opens the mail app |
| Billing card action: `Start your plan` / `Open billing` / `Restart your plan` (`home-billing-card.tsx:7-28`) | Link to `/app/settings/billing` | — | Navigates |
| `Add your people` (call list, `call-list.tsx:26-32`) | Link to `/app/people/import` | — | Navigates |
| `Open the review queue` (call list, `call-list.tsx:33-39`) | Link to `/app/people/review` | — | Navigates |
| `Call` / `Close` (`call-entry.tsx`) | The secondary button (since OR-044). Toggles the inline panel. `aria-expanded`, `aria-controls="call-panel-<id>"`. Shown on called rows too, and in view-as. | Never disabled | Focus stays on the button; the panel renders after it in reading order. No `focus()` call. |
| Phone number, e.g. `909-555-1200` (`call-panel.tsx:11`) | `tel:+1<10 digits>` | — | Starts a call |
| Email address (`call-panel.tsx:32`) | `mailto:` the person | — | Opens the mail app |
| `Mark as called` (`call-entry.tsx:108`) | `logCallAction(id, 'called')`. Row turns to the called look; 5-second Undo. | `disabledClass` (surface fill, muted words, inset border ring) while the action is pending. Not rendered in view-as or once called. | The button unmounts once the row is called, so focus falls to the document. Nothing moves it. |
| `Not now` (`call-entry.tsx:111`) | `logCallAction(id, 'dismissed')`. Row collapses to one muted line; 5-second Undo; after 5s the page refreshes and the name is gone until next month. | As above | The whole row is replaced; focus falls to the document |
| `Undo` (`call-entry.tsx:58-61`) | `undoCallAction`: reverses the last mark within 5 seconds (`UNDO_SECONDS = 5`, `:12`). A linkClass text button, 44px tall. | Disabled while pending | Row returns to open; the Undo button unmounts; focus falls to the document |
| `Open people` (homeowners, `homeowners-section.tsx:15`) | Link to `/app/people` | — | Navigates |
| `here` / `Settings` (text notice, `text-notice.tsx:13, 21`) | Inline links to `/app/addons` and `/app/settings#phone` | — | Navigates |

Results of Mark as called / Not now / Undo are announced: the row area is `aria-live="polite"`
(`call-entry.tsx:66, 116`); action errors are `role="alert"`.

## States
**Send card** — the first matching state wins, in this order (`home-send.ts:30-102`):

| State | Renders (quoted) | Source |
|---|---|---|
| missing-account | Whole page replaced: `We could not load your account.` / `Sign out and sign in again. If it keeps happening, the account may have been removed.` (`page.tsx:20-24`). No call list, no homeowners. | Not producible from the seed; described from the code |
| billing: no_subscription | `Start your plan to send the monthly note.` / `Everything you set up stays here. Nothing goes to your homeowners until the plan is active.` / `Start your plan` | Producible: `pnpm db:seed` alone writes no subscription; `scripts/e2e-setup.ts:32-35` adds an active one, so it is not captured |
| billing: past_due | `Your last payment did not go through.` / `The monthly note is on hold until the open invoice is paid. Your people and your call list are all still here.` / `Open billing` | Not producible from the seed; code at `home-billing-card.tsx:13-17` |
| billing: canceled | `Your plan has ended.` / `Your homeowners are not getting the monthly note. Your people and their matches are still here.` / `Restart your plan` | Not producible; `home-billing-card.tsx:18-22`. Also shown when a cancel-at-period-end plan passes its end date (`billing/status.ts:19`) |
| billing: inactive | `Your plan is not active.` / `The monthly note is on hold. Your people and your call list are all still here.` / `Open billing` | Not producible; `home-billing-card.tsx:23-27`. Any Stripe status other than active, past_due, canceled |
| system-paused | `We paused your monthly note.` / `A few people marked it as spam, so we stopped to protect everyone's delivery.` + `Contact us`. No Unpause: only an admin can lift it. | Not producible; `home-card.tsx:33-46`. Set when complaints cross a threshold; the latest admin action is `complaint_pause` (`db/system-pause.ts`) |
| paused | `Your monthly note is paused.` / `Nothing sends until you turn it back on.` / `Unpause` | Not producible (seed agent has `paused: false`, `db/fixtures/la-verne.ts:23`); `home-card.tsx:48-56` |
| settings | `Set when the note goes out.` / `Pick a send day, a time, and a timezone.` / `Open settings` | **Captured** (dashboard, dashboard-call-open): the seed agent has no send time (`db/fixtures/la-verne.ts:11-25` sets no `sendTime`); `home-card.tsx:58-70` |
| import (no people yet) | `Let's get your people in.` / `Add the folks you've closed with and we'll match each address to the county record. Takes about four minutes.` / `Add your people` | Not producible; `home-card.tsx:72-85` |
| review | `Some addresses still need a house.` / `The monthly note only goes to people matched to a county record.` / `Open the review queue` | Not producible as-is (seed lacks a send time, which wins first); `home-card.tsx:87-99` |
| none-subscribed | `No one is set to get the monthly note.` / `People need a matched house and an active monthly note.` / `Open people` | Not producible; `home-card.tsx:101-113` |
| skipped | `Skipped.` / `The {when} note will not go out.` (e.g. "October 1") / `Resume` | Not producible; `home-card.tsx:115-125` |
| scheduled | `<h1>` is `Your next email goes out {when} to {count} homeowner(s).` (`jobs/schedule-time.ts:111-114`), then `Preview it` and `Skip this month` | Not producible; `home-card.tsx:127-142` |

The order matters to a designer: billing outranks a pause, a pause outranks missing settings. The call
list renders under every send-card state, including paused and billing (`call-list-data.ts:28`: "The
pause does not hide it."; `call-list.test.ts:142`).

**Call list:**
- **Populated** (captured): three rows, all "Been a while" in the seed.
- **Call open** (capture: dashboard-call-open): panel as above. Panel empties: `No phone on file`,
  `No email on file`, `Nothing recorded on this house yet.` (`call-panel.tsx:7, 37, 61`). A phone that
  is not a US number shows as typed, unlinked (`:8`).
- **Called**: row on `--surface`, name in `--muted-ink`, `Called this month.`; just after marking,
  `Marked as called.` with Undo for 5 seconds. Not dimmed: OR-033a removed opacity from all of
  `src/app` (`disabled-state.test.ts:19`). Not producible from the seed.
- **Dismissed (Not now)**: `{name} is off the list until next month.` with Undo, then gone. Not
  producible from the seed.
- **Quiet month**: fewer than three valid names shows what exists, then `Quiet month. That happens.`
  (muted). With zero names, only the heading and that line (`call-list.tsx:49`). Never padded
  (`call-list-view.ts:47`). Not producible from the seed (it builds three).
- **No people**: `Names show up here once your people are in and matched to a house.` + `Add your
  people` (`call-list.tsx:26-32`). Not producible.
- **No matches**: `No one is matched to a house yet, so there is nothing to call about.` + `Open the
  review queue` (`call-list.tsx:33-39`). Not producible.
- **Text notice**, under the heading, `role="status"` (`text-notice.tsx`), only when the "Text me the
  call list" add-on turned itself off: `You replied STOP, so we stopped texting you. Turn it back on
  here and confirm your number again.` or `Your phone stopped taking our texts, so we turned off Text
  me the call list. Check your number in Settings and confirm it again.` Not producible.
- **Action errors** (`role="alert"`, 15px): `Sign in again to save this.`, `Unknown person.`,
  `Unknown action.` (`call-actions.ts`), `This name is not on this month’s list anymore.`, `Too late
  to undo. It’s saved.` (`db/call-log.ts:42, 64`), and `Viewing as another agent is read only.`

**Gap found in the code:** if all three names are dismissed, the list holds three valid rows, so
`quiet` is false and nothing renders under the heading at all (`call-list-view.ts:50-75`). This is
an empty section with no next action, against invariant 7. Also, the zero-name quiet line names no
next action. Reported, not fixed.

**View-as** (an admin reading an agent's account; see `top-bar.md`): the banner is on top; `Unpause`,
`Resume` and `Skip this month` are not rendered (`home-card.tsx:53, 122, 138`); `Call` still opens
the panel, but in place of the two actions it shows `Viewing as another agent is read only.`
(`call-entry.tsx:115`, `auth/write-guard.ts:3`). Navigation links (Open settings, Open billing, etc.)
stay. Not producible: the seed has no admin account.

**Loading** (`loading.tsx`): `Loading…` (15px, `px-4 py-10`). Not captured.

**Error** (`error.tsx`): `We couldn't load your home page.` / `Try again. If it keeps happening,
sign out and sign in.` / `Try again` (a text-style button that calls `reset`). Not producible. The top
bar stays above it (the layout is outside this boundary).

## Fixed copy
- `Worth a call this month` **Fixed** — `call-list.test.ts:96`
- `Quiet month. That happens.` **Fixed** — `call-list.test.ts:97`
- `{expanded ? 'Close' : 'Call'}` **Fixed** — `call-list.test.ts:107`; e2e clicks the button by
  name `Call` (`e2e/screens.ts:55`)
- `Mark as called`, `Not now` **Fixed** — `call-list.test.ts:120-121`
- Tags `Big sale next door` (coral), `Paid off their loan` (green), `Taxes worth a talk` (blue),
  `Been a while` (grey) **Fixed** — `call-list.test.ts:66-69`, classes `:155`
- `We paused your monthly note.`, `A few people marked it as spam, so we stopped to protect everyone`,
  `Contact us`; must not contain `Unpause` or blame words (complaint rate, threshold, your fault,
  bought, suppression) **Fixed** — `admin/sends-ui.test.ts:35-43`
- The Contact us href goes through `pausedAccountMailto`, never an inline mailto **Fixed** —
  `config/support.test.ts:10`
- `You replied STOP, so we stopped texting you. Turn it back on here and confirm your number again.`
  **Fixed** — `text/text.integration.test.ts:186`
- `Viewing as another agent is read only.` — the constant is held by `auth/write-guard.test.ts:4`
- Must not say `past clients` anywhere in the call list — `signup/signup.test.ts:95` (MLS framing:
  the note goes to whoever lives there now, OR-026)
- Any text matching `couldn.t load|could not load` fails the browser pass (`e2e/screens.spec.ts:11`),
  so the error and missing-account copy must keep that wording to stay detectable.
- Product-rule copy, no test: the billing card bodies (they promise nothing is lost, which is true:
  nothing is deleted on cancel, `billing.integration.test.ts:129`), and the panel's loan heading
  `Recorded against the property` — the panel must never show a balance or payoff
  (`jobs/call-log.integration.test.ts:172` asserts no balance/owe/remaining/payoff).

## Tests that assert on this screen
- `call-list.test.ts:29-62` — score order, quiet line never padded, empty states, unknown kinds dropped.
- `:65` tag labels and colours; `:72` same local month as the job; `:78` exact three blocks in order.
- `:88` no stat cards, `%`, `/250`, progress bars or counters in any dashboard file.
- `:94` every call-list state's copy and hrefs; `:102` Call is inline, never a modal; tel/mailto links.
- `:115` both actions are server actions with a 5-second undo; `:125` panel reuses the note's blocks.
- `:131` Not now hides a name without making the month quiet; `:142` paused accounts keep the list.
- `:155` each tag is a contrast-tested token pair, never blue on blue-soft.
- `call-list.integration.test.ts:89` no-people then no-matches; `:96` paused account keeps the list.
- `jobs/call-log.integration.test.ts:108` both actions persist and undo inside the window only;
  `:172` panel shows recorded blocks and no balance; `:191` a deleted person leaves the list.
- `billing/billing.integration.test.ts:85, 129, 166` — no_subscription, canceled, past_due cards.
- `admin/sends-ui.test.ts:35`, `config/support.test.ts:10` — system-pause copy and link.
- `text/text.integration.test.ts:151, 174` — unreachable and stopped notices.
- `tokens.test.ts:45` — muted-ink on surface (4.56:1) holds the grey tag and called rows.
- Browser pass (`e2e/screens.spec.ts`, rules in `e2e/checks.ts`) on dashboard and
  dashboard-call-open at 390 and 1440: no horizontal scroll, no clipped text, no text under 15px, and on
  the phone every tap target at least 44px except links inside a sentence.

## What the v0 export did, and why we did not take it
The export's `/app` is `reference/v0-export/components/app/dashboard.tsx`. The audit
(`docs/audits/OR-027-v0-audit.md:119, 263, 269-281`) records:
- A greeting header ("Here's your month, …", `:26`) and a coral "N people need a look before the 1st"
  alert with **Fix these** linking to `/match` (`:31-47`). We route to `/app/people/review` and put
  the message in the one send card.
- A "Your groups" list (`:67-93`). Rejected: "Separate Groups navigation item" is in
  PROJECT_STATE.md's rejected table; groups live on People only.
- A "Next send" block with three MiniFact tiles, "Built from / Per homeowner / Your effort: None"
  (`:115-119`). Rejected as stat-card shaped ("Dashboard stat cards… Analytics theater",
  PROJECT_STATE.md:63); `sendCardClass` forbids figures, counts or tiles.
- Called rows dimmed with `opacity-50` (`:146`); no Not now and no undo; Mark as called was
  store-only. We persist both through server actions with a 5-second undo.
- A `reading_closely` engagement signal (`signal-meta.tsx:30-35`): not in the schema (invariant 8).
- Text at 12.5-14px and 36px buttons; blue-on-blue-soft tags at 4.42:1. All under our floors.
- Kept: the row shape (name, tag, sentence, inline Call expand) — the audit's "take" list.
