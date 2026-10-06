# Import — `/app/people/import`
**Capture:** import (390 and 1440). It shows the empty "Upload a file" state only. The paste tab, column
mapping, the working state, the error line and the result are not captured.

## What the agent came here to do

Get their own list of past clients into the product: a spreadsheet exported from an old CRM, or names
typed or pasted from anywhere. Each row needs a name, an email and an address. The app matches every address
to a house on the county record, then says how many landed, how many need a look, and which rows it skipped
and why. This list is the agent's **sphere** — the people they actually know — as opposed to the MLS
import on `/app/start`, which brings in houses (see start.md).

The same form (`ImportForm`) is also the "Upload a list" section of `/app/start`
(`src/app/app/start/start-flow.tsx:91-96`), so every change here shows up there too.

Entry points: "Add people" on People (`src/app/app/people/people-board.tsx`, asserted at
`people-ui.test.ts:33`), the dashboard's empty state (`call-list.test.ts:98`), and the /app/start error
screen's "Add people" link (`src/app/app/start/error.tsx:26-31`).

## Layout

App chrome on top (top bar with "People" highlighted, "Log out"). Then `<main className="px-4 py-10">`
(`page.tsx:10`), one column, the same order at 1440 and 390:

1. `Add your people`, 22px semibold (`page.tsx:11`).
2. `Upload a file or paste a list. We match each address to the county record.` (max width xl, `page.tsx:12-14`).
3. The form (`import-form.tsx:43`), 32px below:
   - a two-tab row, `Upload a file` | `Paste a list`. The selected tab is semibold and underlined; there is no
     other tab styling (`import-form.tsx:146`).
   - **Upload tab**: the **drop zone**, a dashed `--border` box, max width xl, 24px padding
     (`import-form.tsx:59-90`). Inside: `Drop a .csv here, or choose one.` (replaced by the file's name once
     one is chosen) and a native file input styled as a field. While a file is dragged over, the box fills
     with `--surface`.
   - **Paste tab**: a labelled textarea, at least 192px tall (`min-h-48`), label
     `One person per line, comma or tab.` (`import-form.tsx:92-103`).
   - a status line (see States).
   - the **column mapping** block, only when the columns could not be recognised.
   - the `Import` button (`buttonClass`). It is natural width on a phone too (no `max-sm:w-full`, unlike
     "Find my closings" on /app/start).

At 390 the drop zone and textarea take the full width; the tabs, file input, textarea, select and button
get a 44px minimum height from the phone rule in `src/app/globals.css:106-114`.

The drop zone's edge is `--border`, not the faint `--rule`: it marks where to act, and OR-035 ("Decision B")
refused a swap that would have made it fainter than before (`docs/audits/reskin-screen-log.md:62-69`;
held by `src/app/app/start/start-reskin.test.ts:54-57`).

Note: this form defines its own local `fieldClass` (`import-form.tsx:18-19`): wider (`max-w-xl`) and not
`block`, unlike the shared `fieldClass` in `src/app/app/people/ui.ts`.

### Column mapping

Shown when a file or paste has content but the app could not tell which column is the name, email and
address (`needsMapping`, `import-form.tsx:38, 114-124`). "Complete" means: a name (or first + last), an
email, and an address (or street, or city + ZIP) (`src/import/detect-columns.ts:58-65`).

`column-mapping.tsx:14-33`: the line `Tell us what each column is.`, then one row per column: the column's
header in medium weight (or `Column 3` if blank), and a select. Rows wrap on a narrow screen
(`flex flex-wrap`). Select options, in order (`detect-columns.ts:32-43`): `This is the —`, `This is the name`,
`This is the first name`, `This is the last name`, `This is the email`, `This is the address`,
`This is the street`, `This is the city`, `This is the ZIP`, `This is the close date`. Each select's
accessible name is `This is the <header>`.

If the first row is not a header row, the "headers" shown are the first person's values (e.g. a name and
an email), because the form uses row one either way (`import-form.tsx:32-33`).

## Controls

| Label (quoted) | What it does | Disabled look / when | Where focus goes after |
|---|---|---|---|
| `Upload a file` / `Paste a list` (tabs, `import-form.tsx:50-57`) | Switches between drop zone and textarea. The text already loaded is kept. `role="tab"` with `aria-selected`; no arrow-key handling and no tabpanel wiring. | Native disabled while importing; no visual disabled style (plain button). | Not moved. |
| Drop zone (`import-form.tsx:59-75`) | Accepts a dropped file; shows its name; reads it as text. Not keyboard-reachable on its own; the file input inside is. | — | — |
| File input (`import-form.tsx:77-89`) | Native chooser, `.csv` only. | Native disabled while importing or in view-as. | Native. |
| Textarea (`import-form.tsx:94-102`) | Paste or type rows. | Same. | — |
| Column selects (`column-mapping.tsx:19-30`) | Say what each column is. | Never disabled. | — |
| `Import` (`import-form.tsx:126-128`) | Sends the rows. Label becomes `Matching addresses…` while it runs. | `disabledClass` (surface fill, muted words, inset `--border` ring) until there is at least one row, while running, and in view-as. Captured disabled in "import". | The form is replaced by the result; no `focus()` call. The result `<section>` is `aria-live="polite"`. |
| `See why 1 was skipped` / `See why N were skipped` (result, `import-result.tsx:42-54`) | Native `<details>` disclosure listing each skipped line and why. | — | Native. |
| `Review them` (result, only if any need a look) | Opens `/app/people/review`. | — | Navigates. |
| `Go to your people` (result) | Opens `/app/people`. | — | Navigates. |

Code behaviour a designer should know: when the mapping is incomplete the row count still shows and
`Import` is still enabled (`rows` is built from the incomplete mapping, `import-form.tsx:37,126`). Rows sent
that way come back as skipped (`No email — we can't send without one`, `Missing an address`) rather than as
the server's `Tell us which column is the name, email, and address.` message, which only the raw-CSV path
reaches (`src/import/run-import.ts:45-47`).

## States

The screen's four states are inside the form, plus the route-level loading and error it inherits from
`/app/people` (the import folder has no `loading.tsx` or `error.tsx` of its own).

| State | What renders (quoted) | Captured / producible |
|---|---|---|
| Empty | `Drop a file or paste a list to start.` (`import-form.tsx:106-108`), `Import` disabled | **Captured** (import) |
| Has rows | `1 person ready to import.` / `N people ready to import.` (`:109-113`) | Producible by choosing any CSV. Not captured. |
| Needs mapping | `Tell us what each column is.` + selects | Producible with a CSV whose headers are unrecognised. Not captured. |
| Working (loading) | `Matching addresses…` as a line (`:105`) and on the button; tabs and inputs disabled | Producible. Not captured. |
| Error | `role="alert"` line above the tabs (`:45-49`): `Add a file or paste a list first.`, `Tell us which column is the name, email, and address.` (`run-import.ts:23,40,46`), or `Viewing as another agent is read only.` | From the code; the first needs a crafted post. Not captured. |
| Result (populated) | See below | Producible by importing a CSV (not from the seed alone). Not captured. |
| View-as | `Viewing as another agent is read only.` above the tabs (`:44`), inputs and `Import` disabled | Needs an admin session; from the code. |
| Route loading | `Loading your people…` (`src/app/app/people/loading.tsx:4`) | Not captured. |
| Route error | `We couldn't load your people.` / `Try again. If it keeps happening, sign out and sign in.` / `Try again` (`people/error.tsx:20-29`) | Not producible from the seed. |

### The import result (`import-result.tsx`)

Replaces the whole form (`import-form.tsx:40`). Top to bottom:

1. 18px heading: `1 person is in.` / `N people are in.` (`:10-12`).
2. If anyone was deleted earlier and re-imported: `1 person was already on your list and came back.` /
   `N people were already on your list and came back.` (`:13-19`).
3. A list of three counts — the three match outcomes the schema defines, and nothing else:
   `N on the map` (matched to a house), `N need a look` (goes to the review queue),
   `N have no house on the record` (`:20-24`).
4. If any address is on the global opt-out list: `1 person is on your list but won’t get the note.` /
   `N people are on your list but won’t get the note.`, then `Line 4 · Name — They asked not to hear from us.`
   per person (`:25-40`; reason from `src/suppression/suppressions.ts:12`). They are added, but never
   subscribed: someone who unsubscribed from any agent stays unsubscribed.
5. If rows were skipped: the `See why…` disclosure (`:41-55`), each `Line N · Name — <reason>`.
6. `Review them` (only if any need a look) and `Go to your people`, stacked (`:56-65`).

## Fixed copy

- Skip reasons, `src/import/skip-reasons.ts:3-8`: `No email — we can't send without one`, `Already in your list`,
  `Missing an address`, `Over your 250-person limit`. **Fixed**, `src/import/skip-reasons.test.ts:5`.
- Result: `on the map`, `need a look`, `have no house on the record`, `See why`, `Review them`,
  `Go to your people`, and `href="/app/people/review"`. **Fixed**, `skip-reasons.test.ts:12`.
- `They asked not to hear from us.` and `won’t get the note.` carry the suppression rule (an opt-out is
  never silently undone by a re-import). No test holds this wording.
- `1 person was already on your list and came back.` matches the delete confirmation's promise ("If you
  import them again later, they'll come back.", `people-ui.test.ts:120`). Not itself asserted.

## Tests that assert on this screen

- `src/import/skip-reasons.test.ts:5` exact skip strings; `:12` result links and counts.
- `src/app/app/start/start-reskin.test.ts:54` drop zone edge is `border border-dashed border-border p-6`;
  `:59` `import-result.tsx` uses `linkClass`, not a copy of it.
- `src/app/disabled-state.test.ts:44-58` `import-form.tsx` uses `buttonClass`, not a copy; `:19` no opacity
  anywhere; `:61` `disabled` only on native controls.
- `src/import/detect-columns.test.ts`, `parse-csv.test.ts`, `import-contacts.integration.test.ts`,
  `subscription-creation.integration.test.ts`: the logic behind the screen (column detection, parsing,
  skip and opt-out handling), not the markup.
- `people-ui.test.ts:33` and `call-list.test.ts:98` link here.
- Whole-tree: `design-debt.test.ts:113`, `shared-classes.test.ts:30,39`.
- Browser: `e2e/screens.ts:69` (import), and the "Upload a list" section inside every /app/start capture.
  `e2e/checks.ts`: no horizontal scroll at 390, 44px tap targets on phone (inline links exempt), no text
  under 15px, no clipping.

## What the v0 export did, and why we did not take it

The audit lists `/app/people/import` among "Real screens with no export equivalent"
(`docs/audits/OR-027-v0-audit.md:139`). The nearest thing is a dialog on the export's People list,
`reference/v0-export/components/app/add-people-dialog.tsx`:

- **Every pasted row was added.** It splits each line on comma or tab, drops lines with fewer than three
  parts, and adds the rest with status `needs_review`, engagement `never_opened` and the group `My Sphere`
  (`add-people-dialog.tsx:64-85`). No skip reasons, no limit, no opt-out check. Audit :355: "**BREAKS** …
  every pasted row is added." The engagement field is an invented metric (invariant 8).
- **A toast instead of a result screen**: `Imported ${parsed.length} homeowners.` (`:91`). Audit :356:
  "A toast replaces the result screen." The agent never learns who was skipped or who needs a look.
- **Fixed column order** (`One per line: Name, Email, Address, City.`, `:148`), no mapping step.
- **Small type**: 13-14px labels and a 13px monospace textarea (`:106, 129-132, 225`). Our floor is 15px.
