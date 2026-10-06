# Add-ons — `/app/addons`

**Capture:** addons, addons-lender-form (both at 390 and 1440)

## What the agent came here to do

Switch a paid or free extra on or off, and see what the month will cost. Two add-ons exist in
production today (`src/addons/registry.ts:31`, held by `src/addons/registry.test.ts:11`):

- **Text me the call list**, $2 a month: this month's three names texted to the agent's own
  phone. It needs a verified phone, which the agent sets up on Settings, not here
  (`src/addons/text-call-list.ts:22-35`).
- **Add my lender**, free: the agent's lender partner's name and NMLS (the lender's licence
  number) printed beside the agent's at the bottom of each note. It needs a small form filled in
  on this page before it can switch on (`src/addons/lender.ts:29-42`).

Prices come only from `ADDON_PRICES` in `src/config/costs.ts:18-24`; the base plan is
`PLAN.priceCents` = $19 (`src/config/costs.ts:8-12`).

## Layout

Top to bottom (`src/app/app/addons/page.tsx:31-36`, `addons-panel.tsx:13-40`):

1. App top bar and "Log out" (shared shell, `src/app/app/layout.tsx`).
2. `<h1>` "Add-ons", 22px semibold.
3. One section per **band** that has at least one add-on (`addons-panel.tsx:18`). A band is a
   price group: `extras` ("Extras") and `texting` ("Texting your clients", with a muted note
   explaining carrier costs) (`row-data.ts:23-30`). In production both add-ons are `extras`, so
   **only "Extras" renders; the texting heading and its carrier note never appear on the live
   page** today. They are proven only by the test fixture (`src/addons/fixtures.ts:30-34`).
4. Each row (`addon-row.tsx:69-96`), separated by a faint `--rule` line under each row:
   title (17px semibold), then the saved-config summary if any (e.g. "Marcus Lee · NMLS 123456",
   `lender.ts:38-41`), blurb, price line, an optional muted row note, and the switch.
5. The **bill bar** (`bill-bar.tsx:9-23`): a dark inverted box (`bg-foreground`, light text)
   listing "Base plan", then each add-on that is on, a divider, "Total a month" and the total,
   and the note "Changes take effect on your next bill."

**1440 vs 390.** There are no `sm:/md:/lg:` breakpoints on this page. Each row is
`flex flex-wrap justify-between` with the text capped at `max-w-xl` (576px). At 1440 the switch
sits at the far right edge of the row, about 750px from the end of the blurb (capture: addons,
desktop). At 390 the text fills the line and the switch wraps under the price, left-aligned
(capture: addons, mobile). The bill bar spans the full content width at both sizes.
The switch gets `max-sm:-my-1 max-sm:py-2` (`addon-switch.tsx:19`) and the global phone rule
gives every button `min-height: 44px` (`src/app/globals.css:106-114`).

## Controls

| Label (quoted) | What it does | Disabled look / when | Focus after |
|---|---|---|---|
| Switch, accessible name = the add-on title, e.g. `Add my lender`; visible text `On` / `Off` (`addon-switch.tsx:17-33`) | A `role="switch"` button. Off → on: a plain add-on latches at once; a config-gated add-on with no saved config opens its form instead and shows `Fill in the settings below to switch this on.` (`addon-row.tsx:56-59`); "Text me the call list" asks the server, which refuses without a verified phone (`text-call-list.ts:73-76`). On → off: switches off and keeps the config. The bill bar updates as soon as the server accepts. | Native `disabled` while the request runs and in view-as. **Its only disabled styling is `disabled:cursor-not-allowed`** (`addon-switch.tsx:19`); it does not take `disabledClass`, so a disabled switch looks the same as a live one. | Nothing moves focus. No `focus()` or `autoFocus` in `src/app/app/addons/`. The form opens below the switch; focus stays on the switch. |
| `Save and switch on` / `Saving…` (`addon-config-form.tsx:83-89`) | Submits the lender form; on success the form closes, the switch reads On, the summary line appears and the bill gains a line. On failure each bad field shows its own message under it. | `buttonClass` with `disabledClass` (surface fill, muted words, inset ring) while saving. | Stays where it was; the form unmounts on success, so focus falls to the document. |
| Config fields (lender): `Lender's full name`, `NMLS number`, `Lender's email`, `Phone (optional)`, `Company (optional)` (labels from `.describe()` in `lender.ts:8-17`; " (optional)" added at `addon-config-form.tsx:42`) | Text inputs on the shared `fieldClass`. The form is built from the add-on's schema at startup (`src/addons/config-fields.ts`). The form also supports a checkbox and a select (`addon-config-form.tsx:11-23`), but no production add-on uses them. | Native `disabled` while saving. | — |
| `Go to Settings` (`addon-row.tsx:86-88`) | Appears after the message when an add-on sets up its config on another page and is off. Today only "Text me the call list", linking to `/app/settings#phone`. | — | Navigates. |
| `Try again` (error screen, `error.tsx:15-21`) | Calls Next's `reset()` to re-render the page. Styled as `linkClass`, not a button. | — | — |

## States

- **Populated, all off** — the seed writes no `account_addons` rows (`scripts/seed.ts`), so
  both rows read `Off` and the bill is `Base plan $19` / `Total a month $19`. Captured: addons.
- **Lender form open** — after tapping the Add my lender switch: message
  `Fill in the settings below to switch this on.`, five empty fields, the muted line
  `Switching this off keeps these settings, so switching it back on won't ask again.`
  (`row-data.ts:33`) and `Save and switch on`. Captured: addons-lender-form.
- **Field errors** — producible from the seed by submitting the empty form. A missing required
  field says `This one is needed.` (`src/addons/state.ts:74`); bad values say
  `Enter the lender's full name.`, `NMLS is 6 to 8 digits, numbers only.`,
  `Enter an email like name@lender.com.`, `Use a US phone number, like 909-555-0147.`
  (`lender.ts:8-14`). Each is `role="alert"` under its field. Not captured.
- **Lender on** — summary `<name> · NMLS <nmls>` under the title, switch `On`, bill gains
  `Add my lender $0`, total unchanged (`src/digest/lender.test.ts:73`). Producible; not captured.
- **Text me the call list refused** — the seeded agent has a phone but it is not verified
  (`scripts/e2e-setup.ts` sets no `phoneVerifiedAt`), so the switch shows
  `Verify your phone in Settings first.` (`text-call-list.ts:51`) followed by `Go to Settings`.
  Producible from the seed; not captured.
- **Text me the call list on** — needs a verified phone; bill gains `Text me the call list $2`,
  total `$21`. Not producible from the seed; described from `addon-row.tsx` and
  `src/text/text.test.ts:99`.
- **Empty** — `Nothing extra yet. We'll add things here.` (`row-data.ts:32`), with the bill still
  at `$19`. Only when nothing is registered; not producible in production. Held by
  `addons-ui.test.ts:34`.
- **Loading** — `Loading add-ons…` (`loading.tsx:4`). Not captured.
- **Error** — `<h1>` `We couldn't load your add-ons.`, `Nothing changed. Try again.`, and
  `Try again` (`error.tsx:13-20`). Not captured.
- **View-as** (an admin looking at an agent's account, read-only) — switches are disabled
  (`page.tsx:34`, `addon-row.tsx:78`) and the form never opens (`addon-row.tsx:93`). If a
  request still reaches the server it answers `Viewing as another agent is read only.`
  (`src/auth/write-guard.ts:3`). Not producible from the seed.
- **Unknown add-on rows** — a stored row for a key nothing registers is skipped here and shown
  to admin only (`page.tsx:13`, `src/addons/state.ts:66`).

## The asymmetry rule: an off row must not look unavailable

A switched-off add-on is a choice the agent made and can reverse in one tap. It must read
"switched off", never "unavailable". So a row renders **byte-for-byte the same on or off apart
from the switch**: same title weight, same ink, no opacity, no grey, no badge.

- Held by `src/app/app/addons/addons-ui.test.ts:21-32`: it renders one row off and on, strips
  the switch, and requires the rest to be identical, with no `opacity`, `text-foreground/`,
  `text-gray` or `disabled` anywhere in it, and `>Off<` present in the off render.
- The rule dates from OR-021 (`packets/OR-021-addon-framework.md`, item 3: "Full contrast whether
  on or off — a switched-off add-on must not look unavailable. The switch is the only thing that
  changes appearance.").
- It is restated where the shared disabled style is defined: `disabledClass` is "Only for
  controls that are disabled; never for a state the agent chose and can reverse, such as an
  add-on switched off (OR-021)" (`src/app/app/people/ui.ts:4-8`), and in `addon-row.tsx:14-19`.
- In OR-033 the builder deliberately re-added the export's on/off icon badge to prove the test
  catches it; only this test went red, and the change was reverted (commit 4652436, "BREAK ... the
  export's on/off badge").

The switch itself carries state three ways: the knob position and fill (`bg-foreground` when on,
`bg-background` when off), the word `On`/`Off`, and `aria-checked`. The accessible name is the
add-on title only; state is not in the name.

## Fixed copy

- `Phone carriers charge us to send text messages to people, and they make us register first. That's why this one costs more.` **Fixed** — `addons-ui.test.ts:47` (not visible in production today; see Layout).
- `Extras`, `Texting your clients` (as `<h2>`) **Fixed** — `addons-ui.test.ts:44-45`.
- `Nothing extra yet. We'll add things here.` **Fixed** — `addons-ui.test.ts:36` (via `EMPTY_STATE`).
- `Changes take effect on your next bill.` **Fixed** — `addons-ui.test.ts:38`. It is there because the bill is display only: Stripe does not bill add-ons yet (`bill-bar.tsx:5`, OR-021 item 5). Claiming more would break invariant 5.
- `Off` / `On` in words **Fixed** — `addons-ui.test.ts:31`.
- `$9 a month 250 included`, `Free` (price-line format) **Fixed** — `addons-ui.test.ts:49-50`; `Free` for the lender also `src/digest/lender.test.ts:76`.
- `Loading add-ons`, `Try again` **Fixed** — `addons-ui.test.ts:65-66`.
- `NMLS is 6 to 8 digits, numbers only.` **Fixed** — `src/addons/lender.integration.test.ts:77`.
- `Verify your phone in Settings first.` **Fixed** — `src/text/text.integration.test.ts:94-95`.
- Bill line labels `Base plan`, `Text me the call list`, `Add my lender` **Fixed** — `src/text/text.test.ts:103`, `src/digest/lender.test.ts:77`.
- `Takes effect on the next note.` (lender row note, `lender.ts:37`): no test; it tells the agent that notes already composed are not rewritten (commit 8a3c44c).

## Tests that assert on this screen

- `src/app/app/addons/addons-ui.test.ts:21` — off row identical to on row apart from the switch; no opacity/grey/disabled; `>Off<`.
- `addons-ui.test.ts:34` — empty state renders, bill still $19 with the next-bill note, no switches.
- `addons-ui.test.ts:42` — both band headings, carrier note under texting, bill lists only what is on (total $28 with the fixtures).
- `addons-ui.test.ts:55` — both switch actions go through `assertWritable`, so view-as cannot toggle.
- `addons-ui.test.ts:64` — four states exist (loading, error, panel).
- `addons-ui.test.ts:70` — the bill bar is exactly `bg-foreground … text-background`, a pair the contrast test checks.
- `addons-ui.test.ts:76` — config inputs use the shared `fieldClass`, no local input class.
- `addons-ui.test.ts:82` — row note, band note and keeps-settings line use `mutedClass`.
- `addons-ui.test.ts:88` — the error screen uses `linkClass`, not a copy of it.
- `src/app/disabled-state.test.ts:43` — `addon-config-form.tsx` uses `buttonClass`, not a copy.
- `src/app/app/top-bar.test.ts:4` — the top bar links to `/app/addons`.
- `src/addons/bill.test.ts:6` — bill total right for every on/off combination.
- `src/addons/registry.test.ts:11` — production registers exactly `text_call_list` and `lender`.
- `src/addons/state.integration.test.ts:83, 94` — invalid config cannot latch (server-side); off then on keeps config.
- `src/addons/lender.integration.test.ts:71` — lender cannot switch on without name, NMLS, email; NMLS error is inline.
- `src/text/text.integration.test.ts:92` — call-list add-on refuses without a verified phone.
- `e2e/screens.spec.ts:6` with `e2e/checks.ts` for addons and addons-lender-form — no horizontal scroll at 390, 44px tap targets on phone (a link inside a line of text is exempt), no text under 15px, no clipping. Both captures report no problems (`e2e/screenshots/*/addons*.json` are `[]`).

## What the v0 export did, and why we did not take it

The export maps to this screen as `addons-manager.tsx` + `addon-*.tsx`
(`docs/audits/OR-027-v0-audit.md:122`). Not taken:

- **Icon badge that changes colour when off** — `reference/v0-export/components/app/addon-extra-row.tsx:22-26`, `addon.enabled ? 'bg-blue text-white' : 'bg-blue-soft text-blue'`. It makes an off row look unavailable, the OR-021 failure (audit row 3, `OR-027-v0-audit.md:262`; `packets/OR-033-reskin-addons.md:93-96`).
- **No On/Off words**; the switch position alone carried state (audit :262).
- **aria-label "Turn X off/on"** (`addons-manager.tsx:111, 117`): puts the state in the name. Ours names the add-on and lets `aria-checked` carry state (OR-033 packet :100-101).
- **A blue switch**: `--blue` is used nowhere in /app; introducing it on one control is a system decision (OR-033 packet :97-99).
- **Toasts on toggle** (`addons-manager.tsx:68, 82, 120`, via `sonner`, a dependency we don't have). The bill moving is the confirmation (OR-033 packet :102).
- **Invented add-ons**: "Weekly market note", "Farm a street", "Text my clients" with 2¢ overage (`reference/v0-export/lib/mock-data.ts:346-390`). None exist in our registry; the export seeds them from mock data, so it has no empty state (audit :318) and its switches write to a client store with no `assertWritable` (audit :320).
- **Tap targets and type**: switches and buttons at 36px (audit :212, :215), labels at 12.5px (`addon-business-form:58, 94, 147`, audit :227).
- **Kept from it**: the dark inverted bill bar (`addon-bill.tsx:36`, `bg-ink`) and the row-with-bill layout (audit :430; OR-033 Decision A, packet :71-86).
