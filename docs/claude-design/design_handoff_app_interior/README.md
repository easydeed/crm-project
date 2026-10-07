# Handoff: onrecord app interior re-skin (v1)

Repo: `easydeed/crm-project` (`main`). Target: the Next.js app under `src/app`, styled with Tailwind + the CSS tokens in `src/app/globals.css`. This package re-skins every agent-facing `/app` screen, the two auth pages and the homeowner unsubscribe page to one visual system.

## About the design files

`App Screens v2.dc.html` is a **design reference built in HTML**, not production code. Do not copy its markup. Recreate each screen inside the existing codebase — Tailwind classes, the shared `buttonClass` / `fieldClass` / `linkClass` / `disabledClass` in `src/app/app/people/ui.ts`, the tokens in `globals.css` — and keep every test in `docs/ui-spec/**` passing. Where this document and a test disagree, the test wins; tell the designer.

Open the file in a browser: it is a canvas of artboards, newest round at the top. Each artboard carries a mono caption with its route and width (`/app/people · 1440 · bulk bar`) and a `data-screen-label`.

## Fidelity

**High-fidelity.** Colors, type sizes, spacing, radii, control heights and copy are final. Recreate pixel-close at 1440 and 390. Copy strings marked *Fixed* in `docs/ui-spec/03-screens/*.md` must not change.

## The system in one paragraph

White page. Every screen opens with a solid navy top bar (`#0E1729`) carrying the wordmark and three nav links; the current section is a white pill. Under it a thin identity line (account · brokerage, "Log out" in blue). Content sits in a single column (`max-width 760px` at 1440; full width minus 16px gutters at 390). Every grouping is a **panel**: 1px `#C9D2E0` border, 12px radius, a `#F2F5FA` header strip with a 19px/600 title, white body. Field/value data is a **two-column table** inside a panel (label column shaded `#F2F5FA`, 500 weight, muted ink). Lists that rank (the call list, the Start steps) are numbered in blue. Blue (`#2F5BFF`) is used for links and numerals only. Brass (`#D4A84B`) appears once, on the navy bill bar total. Status colours (green/rust/blue-soft) are reserved for status chips. Nothing is translucent; disabled is a fill change, never opacity.

## Design tokens

Existing tokens in `globals.css` cover most of this. Proposed additions are marked **new**.

Colors
- `--background` `#FFFFFF` — page
- `--foreground` `#0E1729` — ink, navy bars, primary buttons
- `--muted-ink` `#63708A` — secondary text, table label column, help lines (5.6:1 on white)
- `--surface` `#F2F5FA` — panel header strips, table label cells, selected list rows, disabled fills
- `--rule` `#C9D2E0` — panel borders, dividers (darkened one step from the old rule so panels read as panels)
- `--border` `#7C879D` — input borders (1.5px), secondary button borders, drop-zone dashes, review-card outlines (2px)
- `--blue` `#2F5BFF` — links, list numerals, email-preview eyebrow. Hover `#1F44CC`. 5.2:1 on white
- `--blue-soft` `#E7EDFF` — selected filter chip fill, "Name matches" / "Taxes worth a talk" chips (ink text on it)
- `--green` `#087552` text on `--green-soft` `#E7F6EF` — On the map / Active / Paid / Paid off their loan / Saved
- `--rust` `#B42D17` text on `--rust-soft` `#FFEFEB` — Needs a look / Big sale next door; also the Delete button's text
- `--brass` `#D4A84B` **new** — bill total on navy only (8.1:1 on `#0E1729`). Never on white
- `--on-navy-muted` `#C7CDD8` **new** — fine print on navy (bill bar footnote, 9.9:1)
- `--navy-rule` `#6B7487` **new** — divider inside navy surfaces

Type — Inter (app), Georgia (email preview and the unsubscribe page only). No Fraunces anywhere in these screens.
- Page title h1: 24px / 1.3 / 600 / letter-spacing −0.01em (22px at 390)
- Panel title h2: 19px / 1.3 / 600
- Table-strip label (small header): 16–17px / 600
- Body: 17px / 1.5 / 400
- Field label: 16px / 600, sits above its input
- Secondary / meta: 15px / 1.5 / 400, `--muted-ink`
- Chip: 15px / 1 / 600
- Call-list numeral: 26px / 1 / 700 `--blue` (22px in Start step headers)
- Nav links: 16px / 500; current 600
- Wordmark: 18px / 700
- Bill total: 22px / 1.3 / 600 `--brass`
- Email preview: Georgia 16px / 1.55; eyebrow 12px uppercase 0.08em (preview only — exempt from the 15px floor because it mirrors the sent email)
- Floor: 15px everywhere else (e2e check)

Spacing (px): 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 64
- Top bar: `padding 8px 32px` (8px 16px at 390); items `min-height 44px`
- Identity line: `padding 0 32px` (0 16px), 44px tall via the Log out link, 1px `--rule` bottom
- Page content: `padding 28px 32px 64px` (20px 16px 40px at 390); 20–24px gap between blocks
- Panel header: `padding 14px 24px` (14px 20px at 390)
- Panel body: `padding 20px 24px 24px` (16–20px at 390)
- Table cell: `padding 12px 24px`; label column 140–160px (88–104px at 390)
- Form grid at 1440: 2 columns, `gap 18px 24px`; Sending panel 3 columns
- Field: label→input gap 6px; between fields 18px
- Chip: `padding 8px 12px`

Radii: 16px desktop artboard / 24px phone artboard (frame only); 12px panel; 10px nested table or list inside a panel; 8px inputs, buttons, chips-as-filters, nav pill, email preview; 6px status chip; 999px toggle track.

Borders: 1px `--rule` panels and dividers; 1.5px `--border` inputs and secondary buttons; 2px `--border` review candidate cards; 2px dashed `--border` drop zone; 2px toggle track.

Shadows: none. Disabled controls use `box-shadow: inset 0 0 0 1px --border` as a ring.

Controls
- Primary button: `--foreground` fill, white 17px/600, `min-height 48px`, `padding 0 22–28px`, radius 8
- Secondary button: white fill, 1.5px `--border`, ink 17px/600, 48px
- Destructive (Delete): secondary button with `--rust` text
- Disabled: `--surface` fill, `--muted-ink` text, inset 1px `--border` ring, `cursor: not-allowed`. Never opacity
- Text link: 17px/400 `--blue`, underline, `text-underline-offset 4px`, `min-height 44px` inline-flex. Meta links 15px
- Input / select: 48px, 1.5px `--border`, radius 8, 17px text, `padding 0 14px`. Textarea `padding 12px 14px`
- Checkbox: 22×22, `accent-color --foreground`; the row label supplies the 44px target
- Toggle (`role=switch`): 56×32 track, 22px knob at 3px inset; off = white track, `--border` border and knob; on = `--foreground` track and border, white knob; "Off"/"On" word to the right at 17px/600
- Segmented control (`aria-pressed`): 1.5px `--border` wrapper radius 8; pressed segment `--foreground` fill white text 600; others white, 500
- Status chip: 15px/600, `padding 8px 12px`, radius 6, colour pairs above; "Couldn't find" = `--surface` fill, `--muted-ink` text, 1px `--rule` border
- Filter chip (link): 44px tall, `padding 0 14px`, radius 8, 1px `--rule`; current = `--blue-soft` fill, 600 weight
- Focus: 2px `--foreground` outline, offset 2px (keep the existing `focus-visible` rules)

## Shared chrome (every `/app` screen)

Top bar — `src/app/app/top-bar.tsx`, `nav-link.tsx`
- `<header>` flex, space-between, `--foreground` background, white text
- Wordmark link "onrecord" 18px/700, 44px tall
- `<nav>` 3 links: People, Add-ons, Settings. 16px/500, `padding 0 14px` (0 10px at 390), 44px, radius 8. Current: white fill, ink text, 600, `aria-current="page"`. Hover on non-current: `rgba(255,255,255,.12)` fill
- Dashboard (`/app`) and `/app/start` highlight nothing

Identity line (under the bar, white)
- Left: `Dana Whitfield · Coastline Realty` 15px/500 `--muted-ink`
- Right: "Log out" 15px `--blue` underline, 44px tall
- 1px `--rule` bottom border

## Screens

Routes map to `docs/ui-spec/03-screens/*.md`; read each before building — they list the fixed copy and the tests. Below is what changed visually.

### Dashboard — `/app` (390 + 1440)
Purpose: see when the next note sends; call three people.
- Hero panel (plain panel, no header strip): h1 `Your next email goes out November 1 to 44 homeowners.`; row: primary `Preview it`, link `Skip this month`
- Panel "Worth a call this month": `<ul>` of three `<li>`, 1px `--rule` between. Each row is a grid `40px / 1fr / auto` (36px / 1fr at 390, button spans both columns): blue numeral 26px/700; name 19px/600; reason chip (rust / green / blue-soft); one-sentence why 17px; meta 15px muted `address · Closed date`; secondary `Call` button (`aria-expanded`)
- Expanded row (390 shown): button reads `Close`; nested table (radius 10, label col 88px) Phone (tel link, blue) / Email (mailto, blue, `overflow-wrap:anywhere`) / House / On the record; then `Mark as called` (primary, flex 1 1 160) + `Not now` (secondary)
- Panel "Your homeowners": `51 people on your list. 44 are matched to a house.` + link `Open people`

### People — `/app/people` (390 + 1440)
- Title row: h1 `People` + `51 people` muted; right: link `Review them`, primary `Add people` (stacks at 390)
- One panel. Header strip holds Search (label + 48px search input, max 384px) and Status filter chips: `All (51)` current, `On the map (44)`, `Needs a look (6)`, `Couldn't find (1)`
- `Select all` row 48px, 1px rule
- Rows: grid `auto / 1fr / auto / auto` (1440) — checkbox 22px, name (ink, 600, no underline) over address (15px muted), `Edit` 15px blue link, status chip right-aligned `min-width 124px`. At 390: `auto / 1fr / auto`, Edit moves under the address. Selected row: `--surface` background
- Link under panel: `Export this list`
- Panel "Groups" (1440 only in mock; same at 390): copy + secondary `New group`
- Bulk bar: fixed to bottom, `--foreground` fill, `padding 16px 32px`: `1 person selected` 17px/600; disabled select `Make a group first` + disabled `Add to group`; right: white `Export`, white `Delete` with rust text. At 390 stacks vertically, Export/Delete `flex:1`. Content gets 140px (210px at 390) bottom padding so nothing hides under it

### Person — `/app/people/[id]` (390 + 1440)
- Back link `← Back to your people`; h1 name + status chip inline (stacked at 390); right: primary `Edit`, destructive `Delete` (at 390 these move below the tables, each `flex 1 1 120px`)
- Details table panel (no header strip), label col 140px (104px): Email, Phone, Address, Close date, Notes, Match, Calls, Groups
- Panel "On the record" (17px/600 strip): `1142 Oakdale Ave · APN 8381-012-004` + link `Wrong house?`
- Panel "Add to group": Group name input (max 384) + primary `New group`
- Panel "Preview their email": two segmented controls (Desktop|Phone, Email|Plain text) then the email preview card (Georgia, 1px rule, radius 8, max 600px, `padding 32px 36px`; 24px 20px at 390)

### Review queue — `/app/people/review` (390 + 1440)
- h1 `Needs a look · 1 of 7`
- "You gave us:" panel — at 1440 a two-col table (label 140px) with name 19px/600 and address; at 390 a header strip reading `You gave us:` in muted 16px/600 over the name/address
- Candidate cards: `<ul>` grid 3 columns at 1440 (`gap 16px`), 1 column at 390. Each `<li>`: **2px `--border` outline**, radius 12, header strip with the address on two lines (19px/600), body gap 10: `Recorded owner: …`, optional `Name matches` blue-soft chip, meta 15px muted, reason line, primary `This one` pinned bottom (`margin-top:auto`; full width at 390)
- Link `None of these`

### Settings — `/app/settings` (1440; 390 stacks the same panels)
- Grid `minmax(0,760px) / minmax(0,1fr)`, gap 24; right column is the sticky Preview panel (`top 24px`)
- Panel "Your details": 2-col form: Full name, Email (read-only text + `Contact us to change your email.`), Brokerage, DRE number, Phone, MLS agent ID (+ help + link `Find my closings again`), full-row `Save`
- Panel "Phone for texts" (`id="phone"`): copy + primary `Text me a code`
- Panel "How the email looks": Sender name, Reply-to; fieldset "Accent color" with five 44px swatches (blue `#2F5BFF`, green `#0E9F6E`, rust `#B42D17`, ink `#0E1729`, violet `#5B3FB8`), selected = 2px ink outline offset 3px; `Save`
- Panel "Sending": 3-col selects Send day (1st/15th), Time of day, Timezone; checkbox `Pause my monthly note`; `Save`
- Panel "Billing": one link `Plan, card, invoices, and canceling`
- Panel "Preview": segmented controls + email preview (eyebrow in `--blue` here)

### Add-ons — `/app/addons`
- Panel "Extras": two `<li>` rows (1px rule between), `padding 22px 24px`: title 19px/600, description 17px, price 17px/600 (`$2 a month` / `Free`), optional 15px muted note; right: toggle + On/Off word
- **Bill bar** (not a panel): `--foreground` fill, radius 12, `padding 22px 24px`, white 17px rows `Base plan $19`, `Add my lender $0`, 1px `--navy-rule` divider, total row 22px/600 in `--brass`, footnote 15px `--on-navy-muted`

### Billing — `/app/settings/billing`
- Back link `← Settings`, h1 `Billing`
- Panel "Your plan": table (label 160px) Plan / Status (green chip `Active`) / Next charge / Card; footer row with link `Cancel my plan`
- Panel "Invoices": rows `date (min 180px) · $19 600 · Paid green 600 · View invoice link right`

### Cancel — `/app/settings/billing/cancel`
- h1 `Cancel your plan`; single plain panel (padding 24): copy; row: primary `Cancel my plan` + link `Keep my plan`

### Import — `/app/people/import` (1440 empty · 390 paste + mapping)
- Back link, h1 `Add your people`, intro sentence
- One panel whose header strip is a **tab row** (`role=tablist`): tabs are 48px, radius 8 8 0 0; selected tab = white fill, 1px rule on three sides, `margin-bottom:-1px` so it fuses with the body; unselected = transparent, 500 weight. At 390 tabs `flex:1`
- Upload tab body: drop zone (2px dashed `--border`, radius 10, `padding 32px 24px`, centered): `Drop a .csv here, or choose one.` + secondary-styled label `Choose a file` wrapping a visually-hidden file input. Drag-over: `--surface` fill. Then status line `Drop a file or paste a list to start.`, then disabled `Import`
- Paste tab body: label `One person per line, comma or tab.` over a monospace textarea (IBM Plex Mono 16px, min 140px); status `2 people ready to import.`; mapping block = nested table (radius 10) with strip `Tell us what each column is.`, label col 96px holding the CSV header, value cell a 48px select; enabled `Import` (full width at 390)
- Result state (not drawn): keep `import-result.tsx` structure inside a panel titled with the `N people are in.` heading; the three counts as a 3-row table

### Start — `/app/start` (1440, found state)
- No nav item current. h1 `Add your people` + intro (framing sentence 1, full ink — **never muted**)
- Panel **1 Find my closings** (blue numeral 22px/700 in the header strip): inline form — label `Your MLS agent ID` + 48px input (320px) + primary `Find my closings` (wraps/full width at 390); help line 15px muted. Results below a 1px rule inside the same body: agent name 22px/600, found line, listing-side note (framing sentence 2, full ink), list in a 1px rule box radius 10 — each row a checkbox label 44px+, address 17px/600, `Closed … · $…` 17px, `Listing courtesy of …` 15px **in ink** (attribution, one per row, never collapsed). Unticked row: `--surface` fill. Then primary `Use these 4` + live count `4 of 5 ticked`
- Panel **2 Upload a list** (`id="upload"`): the Import panel verbatim
- Link `Skip for now`
- Malformed / nothing-found / skeleton states keep the copy and roles in `start.md`; the skeleton bars are `--rule` 48px radius 8

### Edit person — `/app/people/[id]/edit` (390)
- Back link `← Back to {name}`, h1 `Edit {name}`
- Panel "Their details": stacked fields Name, Email, Phone, Address (+ help `Change it and we re-check the house.`), Close date (`type=date`), Notes (textarea min 112px); saved line = green chip `Saved` + `We re-checked the address.` (`aria-live=polite`); primary `Save` full width. Field errors: 15px ink line directly under the input, `aria-invalid` on the input, no colour

### Sign in — `/login` · Create your account — `/register` (390; identical column at 1440)
- Navy bar with the wordmark centered, no nav, no identity line
- `<main>` centers a 384px column: h1 centered (24px); the form inside a plain panel (`padding 24px 20px`); the cross-link (`Create an account` / `Sign in`) centered below in blue
- Login: Email, Password, error `That email and password don't match.` (17px ink, `role=alert`, no colour), primary `Sign in` full width
- Register: Name, Email, Password (label with 15px muted `At least 10 characters` **above** the input, tied by `aria-describedby`; give the input an accessible name — see `register.md` gap), 1px rule divider, Brokerage / DRE number / Phone each with a 15px muted `Optional` suffix in the label, primary `Create account`, plan line 17px. The plan line text comes from `PLAN_LINE`; never type the price
- No display type, no artwork, no demo credentials, no terms link (none exists)

### Unsubscribe — `/u/[token]` (390 subscribed · 1440 stopped)
Homeowner page. Server-rendered string in `src/unsubscribe/html.ts`; inline its own CSS, no fonts, no script, always light.
- Georgia throughout. No wordmark, no agent name, no navy bar
- 512px column centered, `padding 40px 16px` (64px 32px at 1440)
- h1 address 24px/600, first thing on the page
- Notice line after an action: chip (`Stopped` = surface/ink/rule) + `These emails have stopped.` (`role=status`)
- Panel "Moved?": `Tell us where and we'll switch to your new home.`, Address input, **primary** `Update my address` 18px/700 (keeps the existing first-form emphasis, now on purpose)
- Panel "Done with these?": secondary `Stop these emails` — one per stream still on; never mention weekly unless on
- After a stop: link-styled `<button>` `Actually, keep them coming` in blue (only when reversible)
- Blocked state: h1 + `This address stopped accepting our email. Ask {agent} to add a different one.` — no forms
- No persuasion copy anywhere (tested by regex)

## Interactions & behavior

- Navigation, actions and states are unchanged from the codebase; this is a re-skin. Keep every `role`, `aria-*`, `aria-live`, `disabled` on native controls only
- Call row: `Call` toggles `aria-expanded`, label flips to `Close`, panel expands with no animation (reduced-motion safe). If you add motion: 160ms ease-out height/opacity, respect `prefers-reduced-motion`
- Hover: links darken to `#1F44CC`; primary buttons `#1A2440`; secondary buttons `--surface` fill; nav links white 12% fill
- Focus: 2px `--foreground` outline offset 2px (existing)
- Phone rule (<640px): all inputs/buttons/`.tap` links ≥44px — already true via `globals.css`; the designs use 48px controls so nothing changes
- Bulk bar appears when ≥1 selected; content keeps bottom padding equal to the bar height
- Import tabs: selected tab visual only; no tabpanel wiring exists — don't add arrow-key handling unless you also add `aria-controls`

## State management

No new state. Existing `useActionState` forms, selection sets and tab state remain. New visual-only derived states: selected row (`--surface`), unticked closing (`--surface`), current nav pill (`aria-current`).

## Assets

- Inter (Google Fonts or `src/app/fonts/inter-latin.woff2` already in repo), IBM Plex Mono 500 for the artboard captions only (not needed in product; the paste textarea may use the system monospace stack)
- No icons, no imagery. The accent swatches are plain colour squares

## Screenshots

`screenshots/` holds one PNG per artboard at 2×, named by screen label. They are for orientation; the HTML file is the source of truth.

## Files

- `App Screens v2.dc.html` — all screens, Rounds 2–5 (newest at top). Open directly in a browser
- `Landing Page v6.dc.html` — the marketing page this interior is matched to (reference only)
- `Signal Colors.dc.html` — status colour pairs and contrast notes
- Specs: `docs/ui-spec/02-system.md` and `03-screens/*.md` in the repo
