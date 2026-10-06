# Signup step 2 — `/app/start`
**Capture:** start, start-found, start-few, start-nothing, start-malformed (each at 390 and 1440). The
searching skeleton, the MLS-unreachable error, the "homes added" result, loading and error are not captured.

## What the agent came here to do

A new agent lands here straight after checkout (`src/app/register/actions.ts:43-45`), and can come back
from Settings via "Find my closings again" (`src/signup/start-href.ts`, `settings/details-form.tsx:85`).
The page offers three ways forward, in this order (`start-flow.tsx:12`): **find my closings** (type an MLS
agent ID and pull the homes they sold), **upload a list** (their own past clients, the same form as
`/app/people/import`), or **skip for now**.

### The MLS framing rule — read this before touching any copy

When an agent sells a house, the person who lives there afterwards is usually the **buyer**. If the agent
represented the seller (the listing side), the buyer may be someone they never met. So the houses pulled
from the MLS are **not past clients**: they are addresses, and the monthly note goes to whoever lives there
now. The product decided this in OR-026 ("option 2", `PROJECT_STATE.md:11, 35`): the CSV upload is where
the agent's real past clients come from; the MLS import is a bonus list of houses, "and the copy says so
plainly."

What goes wrong otherwise: an agent who reads "here are your 47 past clients" mails 47 strangers as if they
were old friends. The test file says it directly: "The MLS framing sentences are what stop an agent mailing
a stranger as if they were a past client" (`start-reskin.test.ts:6-9`). That is why:

- the framing sentences must render at **full contrast** — no muted grey, no colour, no tinted panel, on
  them or on anything around them (`start-reskin.test.ts:36-52`). A greyed-out caveat reads as small print.
  OR-035 proved this by greying the listing-side note on purpose and watching the test fail;
- the found line says "homes you've sold" and must never say "client" (`signup.test.ts:93`);
- each imported house is named `Homeowner at <address>`, a name "that claims no person"
  (`src/signup/closings.ts:15-21`, `signup.test.ts:22`);
- the dashboard no longer says "past clients" (`signup.test.ts:95`).

A redesign may move these sentences, but must keep every one of them on screen, at full strength, in the
same plain words.

## Layout

App chrome on top (top bar with no item highlighted; "Log out"). Then `<main className="px-4 py-10">`
(`page.tsx:20`), one column, max width 2xl for each section. Top to bottom:

1. `Add your people`, 22px semibold (`page.tsx:21`) — the same heading as `/app/people/import`.
2. **Intro** (framing sentence 1, `page.tsx:22`, max width xl).
3. **Find my closings** section (`start-flow.tsx:31-90`): 18px heading `Find my closings`; label
   `Your MLS agent ID`; a text field prefilled with `?agent=` or the account's saved ID; muted help line;
   the `Find my closings` button (full width under 640px, `max-sm:w-full`). Results, the skeleton or the
   found-nothing line appear under the button, inside this section.
4. **Upload a list** section, 48px below (`start-flow.tsx:91-96`): 18px heading, then the whole import form
   (tabs, drop zone, `Import`). Always rendered, at full size, whatever the search returned
   (`signup.test.ts:60-61`). See import.md.
5. `Skip for now`, 48px below (`start-flow.tsx:97-101`).

At 390 the only layout differences are the full-width buttons and the 44px minimum height on controls and
on `.tap` links (`src/app/globals.css:106-120`).

### The closings list (`closings-results.tsx`)

After a search that finds homes (`:41-103`):

- 22px heading: the **agent's own name** (capture: `Dana Whitfield`).
- the found line, e.g. `We found 47 homes you've sold. Untick any you'd rather leave out.`
- the **listing-side note** (framing sentence 2).
- if 1–4 homes: the **few note** (framing sentence 3) ending in an inline link `add those here` that jumps to
  the upload section (`href="#upload"`).
- a list with `--rule` dividers above, between and below rows. Each row is one label (at least 44px tall,
  `min-h-11`) holding: a checkbox, ticked by default; the address and city (medium weight, wraps);
  `Closed February 7, 2025 · $1,015,000` (or `Price not reported`); and the **MLS attribution**.
- the live count `47 of 47 ticked` (`aria-live="polite"`) and the button `Use these 47` / `Use this 1`.

**`<MlsAttribution>` on every row** (`:80`, `src/digest/mls-attribution.tsx`). Every block of MLS data must
credit the listing office and agent (CLAUDE.md invariant 9, "No exceptions, including previews and sample pages"). The app
variant renders `Listing courtesy of Hill Realty / Sam Ortiz.` (or `Listing courtesy of the listing office.`)
at 15px in the surrounding text colour. It cannot be dropped, collapsed, or shown once for the whole list:
the browser check counts one per row (`e2e/screens.ts:93`). Close price is an MLS figure, so it travels with
a status ("Closed") and a date and is never mixed with a county-recorded figure.

## Controls

| Label (quoted) | What it does | Disabled look / when | Where focus goes after |
|---|---|---|---|
| `Your MLS agent ID` field (`start-flow.tsx:39-48`) | The ID to search. Kept as typed after a search (controlled on purpose, `:23`). `aria-invalid` and the error/panel as description when malformed. | Never disabled. | — |
| `Find my closings` (`:70-72`) | Checks the ID; if well formed, saves it to the account and asks the MLS for this agent's closed sales. | `disabledClass` while searching and in view-as. | No `focus()` call; results render below. |
| Row checkbox (`closings-results.tsx:64-71`) | Untick to leave that home out. Updates the count and the button label. | Never disabled. | — |
| `add those here` (few note, `:50-52`) | In-page jump to the upload section. Inline link, exempt from the 44px rule. | — | Browser anchor jump. |
| `Use these N` / `Use this 1` (`:95-101`) | Imports the ticked homes through the one import path (the server re-reads the list; `src/signup/closings.ts:52-74`). | `disabledClass` with nothing ticked, while importing, and in view-as. | List is replaced by the result (`aria-live="polite"`); no `focus()`. |
| `Add their emails` (result, `:122-126`) | Opens People filtered to contacts with no email (`/app/people?noEmail=1`). | — | Navigates. |
| Upload section controls | See import.md. | | |
| `Skip for now` (`start-flow.tsx:98-100`) | Goes to the dashboard, `/app`. Nothing is saved or asked. | — | Navigates. |
| `Try again` / `Add people` (error screen) | Retry; or go to `/app/people/import`. | — | — |

## States

The fixture IDs below come from the test corpus (`e2e/screens.ts:21-22`); the seeded account's own saved
ID is `C01998432` (`src/db/fixtures/la-verne.ts:24`). Searching saves the ID to the account, so the
plain "start" capture shows whichever ID the previous run searched last (`CRMLS-P0000` in the current
captures), not the seed's.

| State | What renders (quoted) | Captured / producible |
|---|---|---|
| Idle | Intro, the find form with help line `It's on your MLS profile page. Not sure? Use the next option.`, upload, skip | **Captured** (start) |
| Malformed ID | `role="alert"` bold line `That doesn't look like an MLS agent ID. It's letters and numbers, with no spaces.` (`src/config/account-fields.ts:31`; empty field: `Enter your MLS agent ID.`, `closings.ts:43`), then a `--rule`-edged panel `Where do I find my agent ID?` / `Sign in to your MLS and open your profile page. Your agent ID is listed there, usually near your name. It is not your DRE number.` The help line is replaced by these. Nothing is searched or saved. | **Captured** (start-malformed, ID `dana whitfield`) |
| Searching | A `role="status"` `aria-busy` block: `Searching your MLS.` over five 48px `--rule` bars (`start-flow.tsx:107-117`). A skeleton, not a spinner: static, so reduced motion needs nothing. The bars use `--rule` because `--surface` would vanish (OR-035 Decision A). | From the code; too brief to capture. |
| Found (5 or more) | The closings list above | **Captured** (start-found, 47 homes, one row unticked: `46 of 47 ticked`, `Use these 46`) |
| Few (1–4) | The list plus the few note | **Captured** (start-few, 3 homes). Threshold `FEW_CLOSINGS = 5` (`src/signup/closings-count.ts`). |
| Nothing found | `role="status"` (never `alert`) line `We couldn't find closings under that ID. That's common if you mostly represent buyers.`; the upload section follows at full size | **Captured** (start-nothing). Not an error: an empty answer is normal for a buyer's agent, and the MLS returns the same empty list for an ID it does not know (`closings.ts:34-39`). |
| MLS unreachable | `role="alert"` line `We couldn't reach your MLS just now. Try again, or upload a list below.` (`actions.ts:18`) | Not producible from the seed; described from the code at `start-flow.tsx:64-68`. |
| Import error | `role="alert"`: `Search for your closings first.` or `Tick at least one home to add.` (`closings.ts:66,72`), or the unreachable line | From the code. |
| Homes added | 18px `47 homes added. We don't get email addresses from the MLS, so add those next — we can't send without one.`; muted lines like `3 not added: Already in your list`; `Add their emails` | Producible by pressing `Use these N`; not captured (the browser pass imports nothing so other screens stay stable, `e2e/screens.ts:83`). |
| View-as | `Viewing as another agent is read only.`; search and import refuse | Needs an admin session; from the code (`start-flow.tsx:30`). |
| Loading (`loading.tsx`) | `Loading…` | Not captured. |
| Error (`error.tsx`) | `We couldn't load this page.` / `Try again. You can also add people from the People page.` / `Try again`, `Add people` | Not producible from the seed. |

## Fixed copy

All in `src/signup/copy.ts`.

- `Add the homes you've sold, upload your own list of past clients, or both. For a home you sold, the monthly note goes to whoever lives there now, who may not be your client.` (intro, `:5-6`) — **Fixed**: must contain `the homes you've sold` and `goes to whoever lives there now` (`signup.test.ts:89-90`); full contrast (`start-reskin.test.ts:37`). MLS framing rule.
- `The note goes to whoever lives there now. For a home you listed, that's usually the buyer, not the seller you represented. Your past clients come from your own list, which you can upload below.` (`:14-15`) — **Fixed** (`signup.test.ts:91-92`; full contrast `start-reskin.test.ts:38`). MLS framing rule.
- `That's fewer than we'd expect. Buyer-side sales usually aren't listed under your ID —` + `add those here` (`:17-18`) — **Fixed**: full contrast (`start-reskin.test.ts:39`); browser text (`e2e/screens.ts:108`).
- `We couldn't find closings under that ID. That's common if you mostly represent buyers.` (`:19-20`) — **Fixed**: no "sorry/error/failed/invalid" (`signup.test.ts:59`), `role="status"` (`signup.test.ts:54`, `e2e/screens.ts:116-118`), full contrast (`start-reskin.test.ts:40`).
- `${n} homes added. We don't get email addresses from the MLS, so add those next — we can't send without one.` (`:46-49`) — **Fixed** (`signup.test.ts:47`; full contrast `start-reskin.test.ts:41`). Says plainly that nothing sends yet.
- `We found 47 homes you've sold. Untick any you'd rather leave out.`, `46 of 47 ticked`, `Use these 47`, `Use this 1` — **Fixed** (`signup.test.ts:34`); found line must not say "client" (`signup.test.ts:93`).
- `That doesn't look like an MLS agent ID. It's letters and numbers, with no spaces.` — **Fixed** (`signup.test.ts:13`, `e2e/screens.ts:130`). `Where do I find my agent ID?` — **Fixed** (`e2e/screens.ts:132`).
- `Your MLS agent ID`, `Find my closings`, `Upload a list` — **Fixed** by the browser pass, which finds them by label, role and heading (`e2e/screens.ts:25-26,122`).
- `Listing courtesy of …` — required attribution (invariant 9); held by `signup.test.ts:71` and `e2e/screens.ts:93`.
- `Skip for now`, `Searching your MLS.`, `Add their emails`, the `whereBody` text: no test holds the wording.

## Tests that assert on this screen

- `src/signup/signup.test.ts`: :13 ID format and the one message; :22 a closing becomes `Homeowner at …` with
  no email; :34 found/ticked/button copy agree; :42 few note for 1–4 only; :47 added line; :54 found-nothing
  is `role="status"`, never alert, and the upload section always follows; :64 malformed is an inline field
  error with the where-to-find panel; :71 `<MlsAttribution … variant="app" />` on every listing; :77 People
  filters to no-email contacts; :88 the MLS framing.
- `src/app/app/start/start-reskin.test.ts`: :44 the five framing sentences render with no muted ink, colour,
  fill or opacity on them or any ancestor (parses the JSX); :54 skeleton bars are `bg-rule`, drop zone edge
  `--border`; :59 `linkClass` used, not copied.
- `src/signup/closings.integration.test.ts`: :54 malformed refused and not saved, empty result is found not
  error; :69 only ticked homes import, re-read server-side; :96 same match status as a CSV import; :116
  re-import adds nobody; :128 nothing ticked imports nothing; :140, :149, :158 the 15-minute search cache.
- Whole-tree: `design-debt.test.ts:113`, `shared-classes.test.ts:30,39`, `disabled-state.test.ts:19,61`.
- Browser: `e2e/screens.ts:84-135` — start-found (47 boxes, 47 attributions, untick updates count and
  button), start-few, start-nothing (status not alert, field keeps the searched ID, upload heading visible),
  start-malformed (alert, `aria-invalid`, panel, no found-nothing line). Then `e2e/checks.ts` on each: no
  horizontal scroll at 390, 44px tap targets on phone (a checkbox is measured by its label; inline links
  exempt), no text under 15px, no clipping.

## What the v0 export did, and why we did not take it

There is nothing to take. The audit: "Real screens with **no export equivalent**: `/app/start` (MLS step 2) …"
(`docs/audits/OR-027-v0-audit.md:139`), and the export's `/register` is a homeowner signup ("Start following
your home", audit :125). On the framing test: "The export has no MLS import screen. It does promise past
clients: `marketing/call-list.tsx` and hero copy talk about "clients"" (audit :265) — the very promise the
framing rule forbids. The export's own MLS attribution (`lab/mls-attribution.tsx:11`) is 12px with a 9px
mark, so "the required attribution would itself fail" (audit :228). The re-skin instruction for this screen
was "restyle only, and keep the status/alert semantics and `MlsAttribution`" (audit :461).
