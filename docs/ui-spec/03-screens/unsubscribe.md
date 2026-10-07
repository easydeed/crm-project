# Unsubscribe — `/u/[token]`

**Capture:** unsubscribe (390 and 1440: `e2e/screens.ts:82`)

**This page is for the homeowner, not the agent.** It is the one screen in the product that a
homeowner sees. They reach it from the unsubscribe link in the monthly note their agent sends. They
have no account and never log in. The person reading is often older, on a phone, and may have no
idea what "onrecord" is: the email came from their agent. Everything else in this spec is
agent-facing.

**It is not a React page.** `src/app/u/[token]/route.ts` is a server route that returns a whole
HTML document as a string. The markup and its own small stylesheet are built in
`src/unsubscribe/html.ts`. None of the app's tokens, classes (`buttonClass`, `linkClass`, ...),
fonts or dark mode reach it. A redesign edits that string, and it stays dependency-free, with no
script and no external CSS or font.

## What the homeowner came here to do

Stop the emails, or, more often, tell us they moved. The page offers both on one screen, with no
login, no confirmation step and no persuasion. Requirement from OR-014: "A homeowner can leave, or
correct their address, without logging in. The one-click POST acts immediately. Tokens are signed
and do not expire." (`packets/OR-014.md:5-7`).

The `[token]` in the address names one person and one email stream (`monthly` or `weekly`) and is
signed so nobody can guess another person's link (`src/unsubscribe/token.ts:22-27`). It never
expires, so a link in a two-year-old email still works (`PROJECT_STATE.md:86`).

Mail clients also call this address directly. A "one-click" unsubscribe (the Unsubscribe button
Gmail and Apple Mail show at the top of a message) POSTs here with the body
`List-Unsubscribe=One-Click` and no `intent` field. That stops the
emails and returns the plain text `Unsubscribed`, not this page (`route.ts:66-72`).

## Layout

The same at 1440 and 390, apart from tap-target height. Styles: `src/unsubscribe/html.ts:61-71`.

- Page: white background, ink `#0E1729` text, Georgia serif at 16px with 1.45 line height, 32px top
  and 16px side padding (`:62`). Always light; there is no dark-mode rule. The page title is
  `Your email` (`:60`).
- One column, at most 32rem (512px) wide, centred (`:63`). Top to bottom (`:74-81`):
  1. `<h1>`: the house's address, 22px, weight 600 (`:64, 75`). It reads like
     `1142 Oakdale Ave, La Verne, 91750`, from the matched county parcel, or the address as the
     agent typed it when there is no match (`src/unsubscribe/load.ts:85`). There is no logo, no
     wordmark and no agent name here.
  2. A notice line, only after an action (`:18, 76`).
  3. The "address stopped accepting our email" line, only when blocked (`:41-43, 77`).
  4. The address form: label `Address`, a full-width input pre-filled with the address on file, and
     the `Update my address` button. Then the line `Moved? Tell us where and we'll switch to your new home.`
     (`:44-53, 78`).
  5. One stop button per email stream still on (`:22-32, 79`).
  6. `Actually, keep them coming`, only after a stop the homeowner may undo (`:33-40, 80`).
- Buttons are the browser's own buttons with 8×12px padding, 16px Georgia, 16px above each
  (`:67`). Inputs are full width, 8px padding (`:66`).
- Focus: a 2px ink outline, offset 2px, on buttons, inputs and links (`:68`).
- Phone (under 640px): every input and button is at least 44px tall (`:70`).
- One rule makes the first form's button 18px and bold: `form:first-of-type button` (`:69`). The
  first form on the page is the address form, so in practice the emphasised button is
  `Update my address`, not the stop button. Whether that was the intent is not recorded; the rule
  dates from the first commit (`e424df9`). The export also made "update my address" the primary
  choice. If you redesign the hierarchy, decide it on purpose.

## Controls

Every control is a plain `<form method="post">`; there is no script. Each submit reloads the whole
page, and focus goes to the top of the new page. No control is ever shown disabled: a control that
does not apply is not rendered.

| Label (quoted) | What it does | When it is shown | Focus after |
|---|---|---|---|
| `Address` input + `Update my address` (`html.ts:46-52`) | Re-matches the typed address against the county record and points future notes at it. The homeowner stays subscribed whatever the outcome (`src/unsubscribe/act.ts:61-99`). | Whenever the address is not blocked. | Page reload. |
| `Stop these emails` (`html.ts:13, 29`) | Stops the monthly note for this person and adds the address to the suppression list (`act.ts:12-29`). | When the monthly stream is on. | Page reload. |
| `Stop the weekly note` (`html.ts:13`) | The same, for the weekly stream. Posts to that stream's own token (`html.ts:26`). | When a weekly stream is on. Then every stream still on gets its own button (`html.ts:20-21`). | Page reload. |
| `Actually, keep them coming` (`html.ts:33-40`) | Undoes the homeowner's own unsubscribe, logs the reversal, and turns the stream back on (`act.ts:41-54`). | After this stream was stopped, and only when every stop on the address is the homeowner's own (not a bounce, complaint, or backfilled stop). | Page reload. |

"Suppression" means the address is on a global do-not-mail list that outlives the person's record:
deleting and re-importing them cannot restart the emails (`PROJECT_STATE.md:43`).

## States

| State | What renders (quoted) | Source |
|---|---|---|
| Subscribed, monthly | Address `<h1>`, address form, `Moved? Tell us where and we'll switch to your new home.`, `Stop these emails`. | Captured: unsubscribe. The seed subscribes every contact to monthly through a database trigger (`drizzle/0006_subscribe_on_create.sql`). |
| Stopped (from this page) | Notice `These emails have stopped.` (`route.ts:73`), address form, `Actually, keep them coming`. No stop button. | Producible from the seed by pressing `Stop these emails`. Not captured. |
| Kept coming | Notice `These emails will keep coming.` (`route.ts:63`), the form and the stop button again. | Producible from the seed (stop, then undo). Not captured. |
| Address matched | Notice `We'll use {address}.`, the matched parcel as street, city, zip (`act.ts:102`; the test expects the shape `We'll use {street}, La Verne, 91750.`). | Producible with a seeded parcel address. Not captured. |
| Address ambiguous | `We couldn't match that to one house. You're still getting these emails.` (`act.ts:104`). | Producible by hand. Not captured. |
| Address not found | `We couldn't find that house on the record. You're still getting these emails.` (`act.ts:106`). | Producible by hand. Not captured. |
| Blocked (the address bounced or complained) | Address `<h1>` and `This address stopped accepting our email. Ask {agent name} to add a different one.` (`html.ts:42`). No form, no stop button, no undo. A forged "keep" or "update" is ignored (`route.ts:52-54`). | Not producible from the seed (it has no bounce or complaint events); described from the code. |
| Weekly and monthly both on | `Stop these emails` and `Stop the weekly note`. | Not producible from the seed or from any current code path: nothing creates an active weekly subscription (only `src/import/import-contacts.ts:143` inserts weekly rows, already stopped). Described from `html.ts:20-21`. |
| Stopped, not reversible | Notice and address form; no undo. | Not producible from the seed; described from `html.ts:35`. |
| Bad or tampered token, or the person no longer exists | HTTP 404 with an empty body (`route.ts:9, 31, 50`). The browser shows its own blank or 404 page; we render nothing. | Described from the code. Held by `unsubscribe.test.ts:15`. |
| One-click from a mail client | Plain text `Unsubscribed`. | Described from the code. Held by `unsubscribe.integration.test.ts:157-159`. |
| Loading | None. The server returns one finished document. | — |
| Error | No page of our own. A server failure gets Next.js's default 500. | Not producible from the seed. |

A person the agent deleted still gets the page: the lookup deliberately includes soft-deleted
contacts (`load.ts:43`), so a homeowner can always leave.

## Fixed copy

- `Update my address` and `Moved? Tell us where and we'll switch to your new home.` **Fixed**:
  `src/unsubscribe/unsubscribe.test.ts:68-69`.
- `Stop these emails` **Fixed**: `unsubscribe.test.ts:70`, `unsubscribe.integration.test.ts:146`.
- `Stop the weekly note` **Fixed**: `unsubscribe.test.ts:81`.
- `These emails have stopped.` and `Actually, keep them coming` **Fixed**: `unsubscribe.test.ts:87-88`,
  `unsubscribe.integration.test.ts:151-153`.
- `These emails will keep coming.` **Fixed**: `unsubscribe.integration.test.ts:187`.
- `This address stopped accepting our email. Ask {agent} to add a different one.` **Fixed**:
  `unsubscribe.test.ts:97-99`, `unsubscribe.integration.test.ts:251`.
- `We couldn't find that house on the record.`, `You're still getting these emails.` and
  `We couldn't match that to one house.` **Fixed**: `unsubscribe.integration.test.ts:203-204, 216`.
- `We'll use {address}.` **Fixed**: `unsubscribe.integration.test.ts:229`.
- `Unsubscribed` (plain text, one-click) **Fixed**: `unsubscribe.integration.test.ts:159`.
- **No persuasion.** The page must never say "are you sure", "miss out" or "before you go". **Fixed**
  by a regex: `unsubscribe.test.ts:72` and `unsubscribe.integration.test.ts:154`. The spirit is
  wider than the three phrases: leaving takes one press, with no confirmation and no guilt.
- The page must not mention a weekly email unless one is on. **Fixed**: `unsubscribe.test.ts:71`,
  `unsubscribe.integration.test.ts:147` (the word `weekly` must not appear).

## Tests that assert on this screen

- `src/unsubscribe/unsubscribe.test.ts:15` — a token is stable and scoped; a tampered one 404s.
- `unsubscribe.test.ts:34` — every email carries both unsubscribe headers (the one-click path).
- `unsubscribe.test.ts:62` — the page shows the house and only the streams still on; no persuasion.
- `unsubscribe.test.ts:92` — a bounced address gets no address form and no undo; the route ignores anything but stop.
- `unsubscribe.test.ts:106` — "keep them coming" shows only when every stop is the homeowner's own.
- `unsubscribe.test.ts:117` — a bounce or complaint anywhere on the address makes it irreversible.
- `src/unsubscribe/unsubscribe.integration.test.ts:133` — one click leaves, undo restores, the token is the same later.
- `unsubscribe.integration.test.ts:195` — a failed re-match stays subscribed; a match confirms the new house.
- `unsubscribe.integration.test.ts:235` — a bounce cannot be undone from the public page.
- `e2e/screens.spec.ts:7-18` (capture "unsubscribe", 390 and 1440): status under 400; no
  `/couldn.t load|could not load/i` text; then `e2e/checks.ts`: no horizontal scroll (`:23-24`), no
  text under 15px (`:66`), no clipping (`:68-75`), and 44px tap targets on the phone (`:40-56`). The
  OR-017c pass found this page 4px too wide at 390 (the input was content-box at width 100%); the
  `box-sizing: border-box` at `html.ts:66` is the fix (OR-026).
- `e2e/desktop-unchanged.spec.ts` — on demand, pixel-exact at 1440. The re-skin log records that this
  page "is server HTML with its own CSS and has not changed in any packet"
  (`docs/audits/reskin-screen-log.md:60`).

Not covered: `src/app/design-debt.test.ts` scans `src/app` for raw colours, so the hex values in
`src/unsubscribe/html.ts` are outside it. The Fraunces allowlist (`design-scope.test.ts:31`) does
cover it, so Fraunces may not appear here.

## What the v0 export did, and why we did not take it

The export's `/unsubscribe` (`reference/v0-export/app/unsubscribe/page.tsx`) is a React page on a
client-side mock. The audit maps it to our `/u/[token]` (`docs/audits/OR-027-v0-audit.md:128`) and
finds it breaks all four page tests (`:343-349`).

| Export | Where | Why not |
|---|---|---|
| Two hard-coded streams, `useState({ monthly: true, weekly: true })` | `unsubscribe/page.tsx:17` | Shows streams the person may not have. Ours shows only those still on (`unsubscribe.test.ts:62`). |
| `The weekly market update`, a stream that does not exist | `:71` | Invented scope (audit `:345`). |
| `Stop everything` as a 13px muted link | `:79-83` | Under 15px, low emphasis on the action the person came for; about 20px tall (audit `:218`). |
| `Stop this` buttons at 13px, `Stopped` at 13px | `:182-191` | Under 15px; chips 24–38px tall (audit `:217`). |
| `Update my address instead`, a blue card with 14px help text | `:45-58` | The idea (moving is the common case) we already had; the 14px text and Base UI focus halo (2.16:1, audit `:242`) we did not take. |
| No bounce state, no reversibility rule | — | A bounced or complained address could "sign back up" (audit `:346-348`). |
| `If you change your mind, your agent can add you back anytime.` | `:154` | False here: a stop is global and only the homeowner can undo their own (`PROJECT_STATE.md:43`). |
| Inputs and buttons at 40px | audit `:213, 215` | Under 44px on a phone. |
| An untokenised green `#e7f6ef` badge | `:211` | Decoration with no meaning. |
