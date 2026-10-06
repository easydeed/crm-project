# Edit a person — `/app/people/[id]/edit`
**Capture:** not captured (not in `e2e/screens.ts`)

Paths are relative to `src/app/app/people/` unless they start with `src/`, `e2e/` or `reference/`.
"View-as" means an admin looking at an agent's account; writes are refused (`src/auth/write-guard.ts:3`).

## What the agent came here to do
Correct a person's details: most often add the email an MLS closing arrived without, or fix an
address we couldn't find. Saving a changed address re-runs the house match on the spot, so this form is
also how a "Couldn't find" person gets onto the map (the person page's "Fix the address" link lands here,
`[id]/person-detail.tsx:121`).

## Layout
One column, `px-4 py-10` (`[id]/edit/page.tsx:20`), identical at 1440 and 390 apart from field heights.
1. `<h1>` `Edit {name}` at 22px (`[id]/edit/page.tsx:21`).
2. A form, `max-w-xl`, 16px between items (`[id]/edit/person-form.tsx:42`). Each field is a 15px label
   with the input below it (`fieldClass` is a block, `max-w-sm`), and its error line directly under the input:
   Name, Email, Phone, Address, Close date, Notes (a textarea at least 112px tall, `min-h-28`, :103).
3. View-as notice, then a form-level error line, then the saved message (`:108-114`).
4. "Save" button (`:115-117`).
5. "Back to {name}" link (`:118-120`).

At 390 (below 640px), `src/app/globals.css:106-121` makes every input, the textarea and the button at
least 44px tall. There is no other responsive change. There is no Delete and no Cancel on this screen;
"Back to {name}" is the way out.

## Controls
| Label (quoted) | What it does | Disabled look / when | Focus after |
|---|---|---|---|
| "Name" (`:45-53`) | Required (`required`, and the server answers `Add a name.`, `src/people/parse-fields.ts:5`) | Never disabled, even in view-as | — |
| "Email" (`:56-65`) | Required, `type="email"`. Server: `We need an email we can send to.` (`parse-fields.ts:12`). A duplicate in the same list returns `Already in your list` as the form error (`src/db/contact-write.ts:65`) | Never | — |
| "Phone" (`:68-76`) | Optional, `type="tel"`, pre-filled as `(909) 555-0147` when it is 10 digits (`:21-25`). Server: `Use a US phone number, like 909-555-0147.` (`src/config/phone.ts:23`) | Never | — |
| "Address" (`:79-87`) | Required. Server: `Add an address.` (`parse-fields.ts:19`). If it changed, we re-match the house and clear the "updated by the homeowner" date (`src/db/contact-write.ts:32-33, 55`) | Never | — |
| "Close date" (`:90-98`) | Optional, `type="date"` (the browser's date picker). Server: `Use a date like 2020-06-15.` (`parse-fields.ts:27, 30`) | Never | — |
| "Notes" (`:101-106`) | Optional free text; blank saves as nothing | Never | — |
| "Save" / "Saving…" (`:115-117`) | Sends every field to `saveContactAction` (`actions.ts:29-34`). On success the page refreshes from the server, so the `<h1>` shows a new name (`:37-39`) | `disabledClass` while saving or in view-as (`:115`) | The code moves no focus. Field errors carry `aria-invalid` and `role="alert"`; the success line is `aria-live="polite"` (`:12-19, 51, 111`) |
| "Back to {name}" (`:118-120`) | Goes to `/app/people/{id}` | Never | Navigates |

Note for the designer: every field uses `defaultValue`, so after a failed save the browser keeps what
the agent typed. In view-as the fields stay editable and only Save is disabled.

## States
| State | What renders | Source |
|---|---|---|
| Populated | Every field pre-filled from the person (`:50, 62, 73, 84, 95, 105`); missing values show as empty fields | Producible from the seed for any person; not captured |
| Saved, address unchanged | `Saved.` (`:112`) | Producible; not captured |
| Saved, address changed | `Saved. We re-checked the address.` (`:112`). The new match status shows on the person page, not here | Producible; not captured |
| Field errors | One line under each bad field, e.g. `Add a name.` (`:53, 65, 76, 87, 98`) | Phone's error is producible by typing a non-US number (`type="tel"` has no browser check). The others are mostly caught first by the browser's own `required` / `type="email"` / date-picker checks; described from the code. Not captured |
| Form error | `Already in your list`, `We could not find that person.` (`src/db/contact-write.ts:30, 65`) or the view-as line, under the fields (`:109`) | Described from the code |
| Loading | Shares the person route's `Loading this person…` (`[id]/loading.tsx:4`; the edit folder has no loading file of its own) | Not captured |
| Error | Shares `[id]/error.tsx`: `We couldn't load this person.` / `Try again, or go back to your people.` / "Try again" | Not captured |
| Not found | Shares `[id]/not-found.tsx`: `We couldn't find that person.` / `They may have been removed from your list.` / "Back to your people" | Producible with a wrong id |
| Empty | Not applicable: there is always a person to edit, or the not-found state | — |
| View-as | `Viewing as another agent is read only.` above Save; Save disabled (`:108, 115`) | Not producible from the seed |

## Fixed copy
- `defaultValue={person.name}`, `defaultValue={person.email ?? ''}`, `phoneValue(person.phone)`, `defaultValue={person.addressRaw}`, `defaultValue={person.closeDate ?? ''}`, `defaultValue={person.notes ?? ''}`: every field pre-fills. **Fixed**, `people-ui.test.ts:93`.
- `Saved. We re-checked the address.`: **Fixed**, `people-ui.test.ts:93`. It is the only signal that the match was re-run.
- `Viewing as another agent is read only.`: the server refusal is held by `src/people/people.integration.test.ts:283`; no markup test checks it on this form.
- `Edit {name}`, `Save`, `Saving…`, `Saved.`, `Back to {name}`, and the field error strings: no test holds their wording on this screen.

## Tests that assert on this screen
- `people-ui.test.ts:93`: the form pre-fills every field and names the re-match save.
- `people-ui.test.ts:104`: the shared `[id]` loading, error and not-found files exist (they also cover this route).
- `src/people/people.integration.test.ts:198`: an address edit re-matches and stores candidates the way import does.
- `src/people/people.integration.test.ts:283`: view-as cannot edit; the person keeps their name.
- `src/db/soft-delete.integration.test.ts:134`: editing a deleted person fails.
- `src/app/disabled-state.test.ts:28`: Save's disabled look is the shared one, never opacity.
- `src/app/sweep.test.ts:8`: `fieldClass` is a block, so labels sit above inputs (OR-037 moved this form; `docs/audits/reskin-screen-log.md:47`).
- No browser test visits this screen, so the 390px layout checks in `e2e/checks.ts` do not run on it.

## What the v0 export did, and why we did not take it
Nothing to take: the export has no edit screen. `docs/audits/OR-027-v0-audit.md:139` lists
`/app/people/[id]/edit` among the real screens with "no export equivalent", and :299 marks the
pre-fill test "NO EQUIVALENT". The nearest thing is the export's notes box on the contact page, which
saved on blur with a toast (`reference/v0-export/components/app/contact-detail.tsx:186-193`). A redesign
must keep this form and its test.
