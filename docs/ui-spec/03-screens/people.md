# People — `/app/people`
**Capture:** people, people-bulk-bar (390 and 1440)

Paths below are relative to `src/app/app/people/` unless they start with `src/`, `e2e/` or `reference/`.
"Seed" means the local demo data (`scripts/seed.ts` + `src/db/fixtures/la-verne*.ts`): one agent with
51 people, 44 "On the map", 6 "Needs a look", 1 "Couldn't find", every one with an email, no groups,
nobody unsubscribed. "View-as" means an admin looking at an agent's account; every write is refused
(`src/auth/write-guard.ts:3`).

## What the agent came here to do
Find one person fast (search by name, email or street), see who is on the map and who isn't, sort
people into optional groups, and occasionally clean up: export a list or delete people who should
stop getting the monthly note. It is also the only place groups are managed: PROJECT_STATE.md
rejects a separate Groups nav item ("Two destinations for the same objects is how the last product
grew two address books").

## Layout
One column, `px-4 py-10` (`page.tsx:24`), the same at 1440 and 390 apart from the points marked.
1. `<h1>` "People" at 22px (`page.tsx:25`).
2. Count line: "1 person" / "N people", counting the whole list, not the filtered view (`people-board.tsx:64-66`).
3. Link row: "Add people" and, only when someone is in the review queue, "Review them" (`people-board.tsx:67-76`).
4. Search field, full width up to `max-w-sm` (`people-board.tsx:83-92`).
5. Filters (`people-filters.tsx`): a **Status** row, a **Group** row (only when groups exist, :55),
   an **Email** row (only when someone has no email or the no-email filter is on, :83). Each is a
   wrapping row of text links with a count in brackets. The current one is dark text on a
   `--blue-soft` pill, semibold, with `aria-current="page"` (:4-5).
6. "Select all" checkbox, then the list (`people-list.tsx`). Each row is a 3-column grid
   (`grid-cols-[auto_minmax(0,1fr)_auto]`, :37): checkbox | name (link to the person), address on its
   own line (wraps, never truncated: `break-words`, :52), an "Edit" link | status tag right-aligned,
   with an "Unsubscribed" tag under it when that applies (:57-64). Rows are separated by a 16px gap, no rules.
7. "Export this list" text button (`people-board.tsx:122-132`).
8. The bulk bar, only while something is selected (see below). It is `sticky bottom-0` on
   `--background` with a `--rule` top border (`people-bulk-bar.tsx:50`), so it rides the bottom of the
   viewport while the agent scrolls the list.
9. **Groups** section, `<h2>` at 18px, `max-w-xl` (`group-manager.tsx:46-48`).

**At 390 (below Tailwind's `sm`, 640px):**
- Each row's checkbox label grows to a 44px tap area through negative margin plus padding
  (`max-sm:-mx-3.5 max-sm:-my-3.5 max-sm:p-3.5`, `people-list.tsx:39`). "Select all" gets
  `max-sm:min-h-11` (:23).
- The bulk bar's controls stack in one column. From `sm` up they sit in a wrapping row, bottom-aligned
  (`people-bulk-bar.tsx:60, 61, 80`). The group forms stack the same way (`group-manager.tsx:71, 87`).
- `src/app/globals.css:106-121` gives every button, select and text input `min-height: 44px` on phones.
  Text links are not enlarged; they pass the tap check only because each sits in a line with other
  text.

## Controls
| Label (quoted) | What it does | Disabled look / when | Focus after |
|---|---|---|---|
| "Add people" (`people-board.tsx:69`) | Goes to `/app/people/import` | Never disabled | Navigates |
| "Review them" (`:73`) | Goes to the review queue `/app/people/review`. Shown only when at least one person is "Needs a look" or is "Couldn't find" and not yet reviewed (`:41`, `src/people/review-state.ts:6-10`) | Hidden, not disabled, when the queue is empty | Navigates |
| "Search" field, placeholder "Name, email, or address" (`:84, :90`) | Filters as you type, on the device, across name, email and the typed address (`src/people/filter.ts:10-16`). Not written to the URL | Never | Stays in field |
| Status: "All", "On the map", "Needs a look", "Couldn't find", each "(n)" (`people-filters.tsx:33-53`, labels `src/people/status.ts:3-18`) | Writes `?status=` to the URL (`src/people/url.ts:20-33`). **"Needs a look" is different: it goes to the review queue, not a filtered list** (`people-filters.tsx:38-41`). Counts respect the current group | Never | Navigates (same page) |
| Group: "All people (n)", then each group "Name (n)" (`:59-79`) | Writes `?group=`; counts respect the current status | Never | Navigates |
| Email: "Everyone (n)", "Missing an email (n)" (`:87-100`) | Writes `?noEmail=1`. MLS closings arrive without an email (`src/people/filter.ts:23`) | Row hidden when everyone has an email | Navigates |
| "Select all" checkbox (`people-list.tsx:24-31`) | Selects every row in the current filtered view; if all of them are already selected, unselects them (`people-board.tsx:111-119`) | Never | Stays |
| Row checkbox, accessible name "Select {name}" (`people-list.tsx:45`) | Adds or removes that person from the selection. The first one opens the bulk bar | Never | Stays |
| Row name link (`:49-51`) | Opens `/app/people/{id}` | Never | Navigates |
| Row "Edit" (`:53-55`) | Opens `/app/people/{id}/edit` | Never | Navigates |
| "Export this list" (`people-board.tsx:130`) | Downloads `people-YYYY-MM-DD.csv` of the **filtered** rows with columns Name, Email, Phone, Address, Close date, Notes, Status, Groups, Parcel address, APN (`src/people/export.ts:17-28, 64-69`) | Never; works in view-as | Stays |

**Bulk bar** (`people-bulk-bar.tsx`), rendered only when the selection is not empty (`:44`):
| Label | What it does | Disabled look / when | Focus after |
|---|---|---|---|
| "1 person selected" / "N people selected" (`:51-53`) | Status line | n/a | n/a |
| "Add to group" select, first option "Pick a group", or "Make a group first" when there are none (`:65-75`) | Chooses a group | `disabledClass` when view-as or no groups (`:67`) | n/a |
| "Add to group" button (`:76-78`) | Adds every selected person to that group, then clears the selection and refreshes (`:40-42`, `people-board.tsx:57-60`) | View-as, a save in flight, or no groups (`:76`). In the seed (no groups) it is disabled in capture people-bulk-bar | The bar unmounts on success; the code moves no focus |
| "Remove from group" select + button (`:84-97`) | Removes the selected people from that group. This bar is the only place to take someone out of a group | Same rules as Add | Same |
| "Export" (`:99-101`) | Downloads the **selected** rows, same CSV | Never disabled, even in view-as | Stays |
| "Delete" (`:115-117`) | See "The delete confirmation" below | View-as or a save in flight (`:115`) | Native dialog; see below |

**Groups section** (`group-manager.tsx`):
| Label | What it does | Disabled | Focus after |
|---|---|---|---|
| "New group" (`:53-55` or `:59-61`) | Reveals the create form (no dialog) | Never | Stays on the button; the code does not focus the new field |
| "Group name" field + "Save group" (`:72-78`) | Creates the group, hides the form, refreshes | View-as or saving | Form unmounts |
| Per group: "{name} ({count})", a "Rename" field pre-filled with the name and a "Rename" button (`:84-101`) | Renames | View-as or saving | Stays |
| "Delete group" text button (`:117-119`) | Native confirm `Remove the group "{name}"? People stay on your list.` (`:108-110`); OK deletes the group only | View-as or saving | Native dialog |

## The delete confirmation (hard rule)
There is no custom dialog. Delete is a form whose `onSubmit` calls the browser's own `window.confirm`;
Cancel calls `event.preventDefault()` and nothing is sent (`people-bulk-bar.tsx:102-118`). The question:
- one person selected: `Delete {name}? They'll stop getting the monthly note. If you import them again later, they'll come back.` (`:107`)
- several: `Delete {n} people? They'll stop getting the monthly note. If you import them again later, they'll come back.` (`:108`)

OK sends the selected ids to `deleteSelectedAction` (`actions.ts:45-50`). That is a **soft delete**:
it stamps `deleted_at` on each contact and keeps their group memberships, match candidates, call log
and unsubscribe state (`src/db/contact-write.ts:76-89`). The person disappears from every list and the
call list. Importing the same person again restores the row, and an earlier unsubscribe still stands
(`src/db/soft-delete.integration.test.ts:181`). That is why the copy promises "they'll come back" and
must never say "cannot be undone": until commit f1fa606 (packet OR-006b) it did say "This cannot be
undone.", which was false once OR-006a made delete soft. On success the selection clears and the list
refreshes; no toast or message is shown. In view-as the button is disabled and the bar shows
`Viewing as another agent is read only.` (`:54`).

Focus: the code calls no `focus()`. Cancel leaves the browser to return focus (normally to Delete).
After OK the bar unmounts, so focus drops to the page.

## States
| State | What renders | Source |
|---|---|---|
| Populated | As above. 51 people in the seed | capture: people |
| Selection open | Bulk bar at the bottom, group controls disabled (no groups in the seed) | capture: people-bulk-bar |
| Empty (no people) | Count "0 people", "Add people" link, then `No people yet. Add a list to get started.` (`people-board.tsx:77-80`); search, filters, list and export are not rendered; the Groups section still is | Not producible from the seed; described from the code |
| No search results | `No people match that search.` (`:96-98`) | Producible by typing; not captured |
| Filter matches nobody | `No people match that filter.` (`:98`) | Not producible from the seed (every filter link it shows has a count above 0); a group with no members would produce it. Described from the code |
| Loading (route) | `Loading your people…` (`loading.tsx:4`); the same line is the Suspense fallback under the h1 (`page.tsx:26`) | Not captured |
| Error | `<h1>` `We couldn't load your people.`, `Try again. If it keeps happening, sign out and sign in.`, and a "Try again" text button that re-renders the segment (`error.tsx:13-22`) | Not captured; described from the code |
| No groups | Groups section: `Groups are optional. Make one if you want to sort people.` + "New group" (`group-manager.tsx:51-56`); no Group filter row | Seed; captured in both people captures |
| Someone missing an email | Email filter row appears | Not producible from the seed (every seeded person has an email) |
| Unsubscribed person | Grey "Unsubscribed" tag under the status (`people-list.tsx:59-63`) | Not producible from the seed |
| View-as | Bulk bar and Groups show `Viewing as another agent is read only.`; every write control disabled; Export still works | Not producible from the seed |
| Left-out view `?status=no_parcel&leftOut=1` | Reached only from the review queue's "See who was left out" (`review/done-state.tsx:35`). The list shows only people the agent chose to leave out (`src/people/filter.ts:35`, `src/people/review-state.ts:16-17`), but **nothing on screen says this extra filter is on**: only "Couldn't find" is marked, and its count includes everyone not found | Described from the code |
| Save error (bulk or group) | The message in a `role="alert"` paragraph (`people-bulk-bar.tsx:55-59`, `group-manager.tsx:65-69`), e.g. `You already have a group with that name.` (`src/db/groups.ts:44`), `Add a group name.` (`src/people/parse-fields.ts:42`) | Described from the code |

Status tags (`status-tag.ts:9-15`): "On the map" green-text on green-soft; "Needs a look" coral-text on
coral-soft; "Couldn't find" and "Unsubscribed" muted-ink on surface. The word carries the meaning;
colour repeats it.

## Fixed copy
- `On the map`, `Needs a look`, `Couldn't find`, and filter `All`: **Fixed**, `src/people/status.test.ts:8, 19`.
- `1 person`, `Add people`, `Review them`, `Name, email, or address`, `Export this list`: **Fixed**, `people-ui.test.ts:29`.
- `All people`: **Fixed**, `people-ui.test.ts:44`.
- `Add to group`, `Remove from group`, `Export`, `Delete`, `Delete ${names[0]}?`: **Fixed**, `people-ui.test.ts:52`.
- `They'll stop getting the monthly note. If you import them again later, they'll come back.`: **Fixed**, and "cannot be undone" is banned, `people-ui.test.ts:120`. Legal/product rule: it must state what actually happens.
- `Groups are optional. Make one if you want to sort people.`, `New group`, `People stay on your list.`: **Fixed**, `people-ui.test.ts:63`. The test also bans "default group", "Everyone" and "All contacts" in the group manager.
- `Unsubscribed` is the only word allowed in the status cell besides the status: **Fixed**, `people-ui.test.ts:162`.
- `Loading your people`, `couldn't load your people`, `No people yet. Add a list to get started.`: **Fixed**, `people-ui.test.ts:104`.
- `Viewing as another agent is read only.`: product rule; held by `src/people/people.integration.test.ts:283` (the server refusal), not by a markup test here.

## Tests that assert on this screen
- `people-ui.test.ts:8`: list shows only name, address, status (+ Unsubscribed); no email, phone, engagement, or candidates; grid and right-aligned status.
- `:29`: count, Add people, Review them, search placeholder, export uses the filtered rows; no engagement words.
- `:44`: filters use `STATUS_FILTERS`, write the URL, "Needs a look" links to the queue.
- `:52`: bulk bar renders only with a selection, is sticky, has the four actions and the delete question.
- `:63`: groups live here, are optional, deleting a group keeps the people.
- `:104`: loading, error and empty copy exist.
- `:120`: delete copy says re-import brings them back; never "cannot be undone".
- `:129`: each status tag uses a token pair the contrast test checks (`src/app/tokens.test.ts:74`).
- `:145`: Delete is `destructiveButtonClass` and uses `window.confirm(` on both screens.
- `:155`: current filter is dark text on blue-soft with exactly 5 `aria-current`.
- `:162`: status cell words are only "Unsubscribed" (an allowlist, not a denylist).
- `src/app/disabled-state.test.ts:28`: `buttonClass` and `destructiveButtonClass` end with `disabledClass`; no opacity anywhere (:19).
- `src/people/filter.test.ts:26, 38, 55, 70`: search fields, 250th row found, status+group combine, left-out filter.
- `src/people/url.test.ts:9, 14, 22, 30`: filter URLs. `src/people/export.test.ts:4, 8`: file name, every column.
- `src/people/people.integration.test.ts:142, 171, 242, 283, 315`: no 250 cap; groups never delete people; soft delete; view-as refused; account isolation.
- `src/db/soft-delete.integration.test.ts:105, 181`: deleted people leave list and counts; re-import restores with unsubscribe intact.
- `e2e/screens.ts:58-66` + `e2e/screens.spec.ts:6-18`: both captures must load without "couldn't load" text, and pass `e2e/checks.ts`: no horizontal scroll at 390, 44px tap targets on the phone (links inside a line of text exempt, checkboxes measured by their label), no text under 15px, no clipping.

## What the v0 export did, and why we did not take it
`reference/v0-export/components/app/people-list.tsx` (517 lines, over our 300-line limit):
- **No delete confirmation.** "Remove" deletes on click and shows a toast `Removed ${selectedIds.length} homeowners.` (:383-391). Audit row 1 (`docs/audits/OR-027-v0-audit.md:260`): BREAKS the delete-copy test.
- **Engagement tags** "Opening", "Never opened", "Quiet", "May have moved" (`contact-meta.tsx:13-21`, shown at `people-list.tsx:459-465`). Invariant 8: no invented metrics.
- **A "Farm" scope** of 140 generated rows (`:49, 158`) whose links land on "not found" (audit :409).
- **Filters in `useState`**, read from the URL once and never written back (audit :295), so a filtered view could not be shared or reloaded.
- **No CSV export** (audit :294); `{n} shown` at 12px uppercase (:415-416); names and addresses `truncate`d (:451, 454), which our clipping check fails; 32px checkboxes, selects and the "Clear selection" icon button (audit :211-216).
OR-031 kept our markup and took only the visual (audit :457). The export's row density is reference only (audit :430).
