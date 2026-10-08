# Person — `/app/people/[id]`
**Capture:** person-detail (390 and 1440), with the note in plain text (OR-043a)

Paths are relative to `src/app/app/people/` unless they start with `src/`, `e2e/` or `reference/`.
The captured person is the first "On the map" person by name (`scripts/e2e-setup.ts:39-47`), which in
the seed is Aisha Rahman. "View-as" means an admin looking at an agent's account; writes are refused
(`src/auth/write-guard.ts:3`).

## What the agent came here to do
Check one person before a call or after an import: their contact details, which house we matched them
to, when the agent last marked a call, which groups they're in, and what this month's email to them
looks like. From here the agent fixes a wrong match, edits details, adds them to a group, or deletes them.

## Layout
Since OR-045: a 760px column, with 16px page margins (32px from `sm`), built on a grid
(`[id]/person-detail.tsx`). At 390 the blocks run top to bottom in the order below. From `sm`, Edit
and Delete move up beside the name, as drawn. The grid's `order` classes do this with one copy of each
control.

1. **"Back to your people"**, 44px on phones (`.tap`).
2. **The name** as `<h1>` (22px, 24px from `sm`), with the status tag beside it.
3. **Their details**: the shared label-and-value table (`DetailsTable`, `src/app/app/details-table.tsx`),
   17px.
   - Labels sit in a `--surface` column in muted ink: 104px at 390, 140px from `sm`. That is 4.56:1,
     the tightest pair the contrast test allows.
   - Values sit on the page.
   - It is still a `<dl>`. Rows, every one kept:
     - **Email**: the address, or `None yet. We can't send without one.`
     - **Phone**: formatted when it is 10 digits (`formatUsPhone`), else as stored, or `None on file`
     - **Address**: what the agent typed. If the homeowner changed it from their email's link, a
       second line `Updated by the homeowner on {Month D, YYYY}.`
     - **Close date**: as stored, or `None on file`
     - **Notes**: or `None on file`
     - **Match**: the status word
     - **Calls**: one line per marked call, `You called them on {Month D, YYYY}.`, or `None marked yet.
       Mark a call from your home page.`
     - **Groups**: comma-separated names, or `None yet`
4. **The match block**, which depends on status.
   - **On the map:** a panel whose `--surface` strip is the `<h2>` "On the record". Its body is
     `{parcel address} · APN {apn}` and "Wrong house?" at 44px.
     - The words are unchanged; "On the record" moved from the start of the sentence into the strip.
     - The design's MLS listing under this label was refused: the record is recorded data only.
   - **Needs a look:** "Review this match", 44px.
   - **Couldn't find:** "Fix the address", 44px. It goes to the edit form.
5. **Edit** (the primary button, a link) and **Delete** (outlined, coral words), with the view-as
   notice and any delete error under them.
6. **Add to group**: a panel with a header strip.
   - It keeps both states: a new group's name when there are none, or the group select.
   - It keeps **Manage groups**, the only route from here to group management. The design dropped it;
     OR-045 refused that.
7. **Preview their email**: a panel with a header strip (`DigestPreviewPanel framed`) around the
   unchanged preview below. It stays a sandboxed iframe; the design's inline `<div>` was refused.

**The email preview panel** (`src/app/digest/preview-panel.tsx`). This is the real renderer that
produces the monthly email, run for this person today (`[id]/page.tsx:40-43`). Two outcomes:
- **No email this month**: one line of text naming why, no empty frame (`preview-panel.tsx:104-108`).
  The reasons: `This person is not matched to a house yet.` when there is no house
  (`src/digest/skip-copy.ts:1`), or `Nothing new on their street this month.` when nothing was recorded
  (`src/digest/skip-copy.ts:6`, `src/digest/render.ts:25-27`).
- **An email**: two toggle pairs, then the email. "Desktop" / "Phone" set the frame to 600px or 380px
  wide; "Email" / "Plain text" switch between the HTML and the text version (`:51-68`). The pressed
  toggle is filled `--foreground` with `--background` words; the other is outlined in `--border` (`:31`).
  Each pair is a `role="group"` with a hidden label "Preview size" / "Preview format" (`:22-25`).
  The HTML sits in a sandboxed iframe, 640px tall, white in both themes because that is how an inbox
  shows it (`:70-78`; `src/app/design-debt.test.ts:24-27`). `max-w-full` caps the frame at the column
  width, so at 390 "Desktop" cannot actually show 600px. Plain text is a `<pre>` at 15px on the page
  background (`:80-85`). Any MLS figures in the email carry their attribution inside the email itself
  (`src/digest/blocks/four-doors.ts:1`); the panel adds none.

## Controls
| Label (quoted) | What it does | Disabled look / when | Focus after |
|---|---|---|---|
| "Back to your people" (`:39`) | Goes to `/app/people` | Never | Navigates |
| "Wrong house?" (`:107`, `src/people/review-copy.ts:14`) | Opens the review screen for this person alone in wrong-house mode, `/app/people/review?contact={id}&mode=wrong-house` (`src/people/url.ts:35-41`). See person-review.md | Only shown for "On the map" | Navigates |
| "Review this match" (`:115`) | `/app/people/{id}/review`, which opens the review queue at this person | Only shown for "Needs a look" | Navigates |
| "Fix the address" (`:122`) | `/app/people/{id}/edit` | Only shown for "Couldn't find" | Navigates |
| "Edit" (`:127-129`) | `/app/people/{id}/edit` | A link, never disabled, also in view-as (the edit form's Save is disabled there) | Navigates |
| "Delete" (`:139-141`) | See below | `disabledClass` (surface fill, muted words, inset border ring) in view-as (`:139`). Not disabled while the request runs | Native dialog |
| "Group" select, first option "Pick a group", + "Add to group" (`add-to-group.tsx:64-77`) | Adds this person to the chosen group and refreshes | View-as or saving (`:66, 75`) | Stays; the code moves no focus |
| No groups yet: "Group name" field + "New group" button (`:50-58`) | Creates the group **and** puts this person in it (`src/people/save-groups.ts:21-41`) | View-as or saving | Stays |
| "Manage groups" (`:81-83`) | Goes to `/app/people`, where groups are renamed and deleted. There is no "remove from group" on this screen; that lives in the People bulk bar | Never | Navigates |
| "Desktop" / "Phone", "Email" / "Plain text" (`preview-panel.tsx:55-66`) | Switch the preview; `aria-pressed` marks the current one | Never; previews work in view-as (`people-preview.test.ts:8`) | Stays |

## The delete confirmation (hard rule)
Delete is a form whose `onSubmit` asks the browser's own `window.confirm` (`[id]/person-detail.tsx:130-142`):

`Delete {name}? They'll stop getting the monthly note. If you import them again later, they'll come back.` (`:133`)

Cancel prevents the submit; nothing happens. OK sends `deleteContactAction` (`actions.ts:36-43`), a soft
delete: the contact gets a `deleted_at` stamp and keeps its groups, match candidates, call log and
unsubscribe state (`src/db/contact-write.ts:76-89`), so a re-import restores them, still unsubscribed if
they had asked to stop (`src/db/soft-delete.integration.test.ts:181`). On success the server redirects to
`/app/people` with no message (`actions.ts:41`). If the person was already gone the error
`We could not find that person.` (`src/people/save-contact.ts:78`) appears in a `role="alert"` line (`:145-149`).
The words "cannot be undone" are banned: they were the copy until commit f1fa606 (packet OR-006b) and
became false when OR-006a made delete soft. Focus: the code calls no `focus()`; after OK the page navigates.

## States
| State | What renders | Source |
|---|---|---|
| Populated, On the map | All fields, the On the record panel, "Wrong house?", and the preview | capture: person-detail. Since OR-043a the seeded person, Aisha Rahman, has a note: e2e setup adds live sales on her street. The capture shows the note as plain text, through the `showNoteText` prepare step, which fails unless both street-sales lines are there. Before OR-043a the preview only ever showed `Nothing new on their street this month.` |
| Needs a look / Couldn't find | Match block becomes "Review this match" / "Fix the address"; preview reads `This person is not matched to a house yet.` | Producible from the seed by opening Samir Qureshi / Helen Cho; not captured |
| Email preview frame | Toggles + iframe | Not captured; whether any seeded person has news this month depends on the date. Described from the code |
| Missing email | `None yet. We can't send without one.` | Not producible from the seed |
| Homeowner changed address | Second address line `Updated by the homeowner on …` | Not producible from the seed |
| Marked calls | `You called them on …` lines | Producible by marking a call on `/app`; not captured |
| In groups | Group names joined by `, ` | Not producible from the seed (no groups) |
| Loading | `Loading this person…` (`[id]/loading.tsx:4`) | Not captured |
| Error | `<h1>` `We couldn't load this person.`, `Try again, or go back to your people.`, "Try again" button (`[id]/error.tsx:13-21`). There is no link back on this screen despite the words | Not captured; described from the code |
| Not found (bad id, other account's person, or deleted) | `<h1>` `We couldn't find that person.`, `They may have been removed from your list.`, "Back to your people" (`[id]/not-found.tsx:7-15`) | Producible with any wrong id; not captured |
| Empty | Not applicable: a person always has a name and address | — |
| View-as | `Viewing as another agent is read only.` under the action row and in Add to group; Delete and group controls disabled | Not producible from the seed |

## Fixed copy
- `Updated by the homeowner on`: **Fixed**, `people-ui.test.ts:24`.
- Labels `Email`, `Phone`, `Address`, `Close date`, `Notes`, `Match`, `Groups`; `Review this match`; `Fix the address`; `Delete ${person.name}?`: **Fixed**, `people-ui.test.ts:71`.
- `Wrong house?` (via `REVIEW_WRONG_HOUSE`): **Fixed** by reference, `people-ui.test.ts:84-85`.
- `They'll stop getting the monthly note. If you import them again later, they'll come back.`: **Fixed**, never "cannot be undone", `people-ui.test.ts:120`. Product rule: say what really happens.
- `You called them on {day}.`: **Fixed**, `src/app/app/call-list.test.ts:148`.
- `Loading this person`, `couldn't load this person`, `couldn't find that person`: **Fixed**, `people-ui.test.ts:104`.
- `Preview their email` and the `UNMATCHED_REASON` skip line: **Fixed**, `people-preview.test.ts:8`.
- `Desktop`, `Phone`, `Email`, `Plain text`, `title="Email preview"`: **Fixed**, `src/app/digest/preview-panel.test.ts:6`.
- `None yet. We can't send without one.` and `On the record:`: no test holds them. "On the record" sits next to an APN, a recorded fact; keep county-record framing, and never add a value or estimate there (CLAUDE.md domain rules).

## Tests that assert on this screen
- `people-ui.test.ts:24`: homeowner address change is named.
- `:71`: every field label, parcel address and APN, the three status links and their hrefs, delete question, AddToGroup, phone formatting.
- `:104`: loading, error and not-found files exist with their copy.
- `:120`, `:145`: delete copy, and Delete is `destructiveButtonClass` with `window.confirm(`.
- `people-preview.test.ts:8`: the page builds the real digest for this person, under `effectiveAccountId`, with no write guard, so the preview also works in view-as.
- `src/app/digest/preview-panel.test.ts:6`: iframe is `sandbox=""` with `srcDoc`, toggles and `aria-pressed`, `motion-reduce:transition-none`, no `@import`. `:22`: a skip shows its reason, not an empty frame.
- `src/app/sweep.test.ts:19`: plain text sits on `bg-background`; toggles are outlined in `--border`. Until OR-037 the plain text drew #ededed on white in dark mode (1.17:1).
- `src/app/design-debt.test.ts:24`: `bg-white` on the iframe is the one permanent colour exception.
- `src/app/app/call-list.test.ts:148`: called dates shown.
- `src/people/people.integration.test.ts:242, 283, 315`: soft delete keeps memberships; view-as cannot delete; another account cannot read or delete.
- `src/app/disabled-state.test.ts:28`: Delete's disabled look is the shared one, never opacity.
- `e2e/screens.ts:67` + `e2e/screens.spec.ts:6-18` + `e2e/checks.ts`: loads with no "couldn't load" text; no horizontal scroll at 390; 44px tap targets on the phone (inline links exempt); no text under 15px outside the email iframe; no clipping.

## What the v0 export did, and why we did not take it
`reference/v0-export/components/app/contact-detail.tsx`:
- **No delete confirmation.** "Remove" calls `deleteContact`, toasts `${contact.name} removed.` and routes away (:227-238). Audit row 1 (`docs/audits/OR-027-v0-audit.md:260`): BREAKS the delete-copy test.
- **Engagement tag** next to the status (:69-70), from `ENGAGEMENT_META` ("Opening", "Quiet", "May have moved", "Never opened"). Invariant 8.
- **"Flag as moved"**, a manual toggle (:201-226). Ours names the recorded change instead ("Updated by the homeowner on …"); audit :302.
- **Inline MatchFlow** with a fabricated record on confirm: `recordedPrice: 720000`, `assessedValue: 792000`, `streetMedian: 915000` (:116-135; audit :405). Ours links to the review queue and invents nothing.
- Notes saved on blur with a toast (:186-193); we edit notes on the edit screen.
- 36px mail and phone icon buttons (:74-90; audit :216) fail the 44px tap rule.
- No email preview at all (audit :335): the export has no iframe anywhere.
OR-031 kept our markup and changed only the visual (audit :457).
