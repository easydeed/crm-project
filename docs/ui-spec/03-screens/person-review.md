# Review one person's match — `/app/people/[id]/review`
**Capture:** not captured. This route draws nothing of its own: it redirects. The screen it lands on
is captured as **review-queue**, but only at the queue's first person (`e2e/screens.ts:68`), not at a
person chosen from their page.

Paths are relative to `src/app/app/people/` unless they start with `src/`, `e2e/` or `reference/`.
"Seed" is the local demo data (`scripts/seed.ts`, `src/db/fixtures/la-verne*.ts`).

## What the agent came here to do
Settle which house one person lives in. The agent is on a person's page, sees "Needs a look", and taps
"Review this match" (`[id]/person-detail.tsx:112-118`). They want to pick the right house, fix the
typed address, or decide to leave this person out of the monthly email.

## How the route works
`[id]/review/page.tsx:12-19`: check the session, look the person up in this account (live, not deleted),
`notFound()` if missing, then `redirect('/app/people/review?contact={id}')` (`src/people/url.ts:35-41`).
The review queue then opens **at that person** inside the whole queue
(`review/page.tsx:40-43`): the header counts the full queue, e.g. `Needs a look · 7 of 7`
(`src/people/review-state.ts`, `reviewHeader`). The queue is everyone who is "Needs a look", plus
"Couldn't find" people not yet reviewed, sorted by name (`src/db/review-queue.ts:33-48`).

Two edge cases, from the code:
- **The person is not in the queue** (already "On the map", or left out earlier). `findIndex` gives -1,
  which is clamped to 0 (`review/page.tsx:41-43`), so the agent sees **someone else**, the first person
  in the queue, with no explanation. If the queue is empty they see the done screen. The only link into
  this route is shown for "Needs a look" people, so this needs a stale tab or a typed URL.
- **"Wrong house?"** on an "On the map" person does not use this route. It links straight to
  `/app/people/review?contact={id}&mode=wrong-house` (`[id]/person-detail.tsx:106`), which shows that
  one person alone, re-matched from their address, with the current house among the cards
  (`review/page.tsx:25-37`, `src/db/review-queue.ts:78-87`). It is the other per-person review, so it is
  covered here.

## Layout (the review screen it lands on)
One column, `px-4 py-10` (`review/review-queue.tsx:133`).
1. `<h1>` `Needs a look · {n} of {total}` at 22px (`:134-136`). Wrong-house mode also says
   `Needs a look · 1 of 1`, although the person is on the map.
2. `You gave us:` then the typed name and address (`:137-141`).
3. Either **candidate cards** (when we stored possible houses) or the **couldn't-find panel**.
   - Cards (`review/candidate-cards.tsx`): one column at 390, three columns from `md` (768px) up (`:17`).
     Each card is outlined in `--border` (an exception to the faint `--rule`, because the card is
     something to act on) and shows street, city and zip; `Recorded owner: {name}`; a blue-soft
     `Name matches` tag when the owner's last name matches; beds, baths and sq ft in muted text; the
     match reason; and a full-width "This one" button at 390, auto width from `md` (`:21-49`).
     Under the cards, a "None of these" text button (`review-queue.tsx:154-165`).
   - Couldn't-find panel (`review/no-parcel-panel.tsx`): `We couldn't find this address.`, a
     "Fix the address" text button that reveals an Address field and "Save address", then
     "Leave them out" and the muted line `They won't get the monthly email.` (`:28-71`).
4. View-as notice and error line (`review-queue.tsx:186-191`).
5. After a decision, an "Undo" button for five seconds, `sticky bottom-0` on the page background
   (`:192-203`, `UNDO_MS = 5000` at :19).

In the seed, the four review fixtures (Anita Flores, Darryl Stone, Greg Walsh, Mei Lin) have stored
candidates (`scripts/seed.ts:64`). Samir Qureshi and Priya Nair are "Needs a look" with **no**
candidates, so their review shows the couldn't-find panel under a "Needs a look" header.

## Controls
| Label (quoted) | What it does | Disabled look / when | Focus after |
|---|---|---|---|
| "This one" (`candidate-cards.tsx:42-48`) | Attaches that house; the person leaves the queue and the next one slides into place | `disabledClass` while a decision is saving, or in view-as | The code moves no focus; the content under the agent's finger changes to the next person |
| "None of these" (`review-queue.tsx:156-163`) | Hides the cards and shows the couldn't-find panel. Nothing is saved | Same | Stays (the button unmounts) |
| "Fix the address" (`no-parcel-panel.tsx:50-57`) | Reveals the Address field, pre-filled with what was typed | Same | Not moved to the field |
| "Address" field + "Save address" (`:31-47`) | Re-matches with the new address; the person either leaves the queue or comes back with new cards | Same | Not moved |
| "Leave them out" (`:61-68`) | Marks them reviewed and out of the monthly email; they stay on the list as "Couldn't find" | Same | Next person |
| "Undo" (`review-queue.tsx:194-201`) | Reverses the last decision within 5 seconds and returns to that person | Saving or view-as | Returns to the restored person |
| Done screen "See who was left out" (`review/done-state.tsx:33-38`) | Opens `/app/people?status=no_parcel&leftOut=1` | Only when someone was left out, and not in wrong-house mode | Navigates |
| Done screen "Back to your people" (`:41-45`) | Goes to `/app/people` | Never | Navigates |

There is no link back to this person's page anywhere on the review screen.

## States
| State | What renders | Source |
|---|---|---|
| Landing at a person with cards | As above | Producible from the seed (open Anita Flores, then "Review this match"); not captured at a chosen person |
| Landing at a person with no cards | Couldn't-find panel under a "Needs a look" header | Producible (Samir Qureshi or Priya Nair); not captured |
| **Done too early (a defect found in the code)** | When the queue opens part-way through, deciding moves forward but never wraps back. After the last person in name order is decided, `list[index]` is empty and the done screen shows (`review-queue.tsx:45, 61-63, 108`), e.g. `Everyone's on the map.`, while the people before the starting point are still waiting. Opening Samir Qureshi (7 of 7 in the seed) and deciding once should produce it | Found by reading the code; **not run in a browser** |
| Done, nobody left out | `Everyone's on the map.` + "Back to your people" (`done-state.tsx:21-26`) | Producible |
| Done, some left out | `All done. {n} people won't get the email until you fix their address.` (or `1 person`) + "See who was left out" (`src/people/review-state.ts`, `reviewLeftOutDone`) | Producible |
| Done, wrong-house mode | `They're on the map.` + "Back to your people" | Producible from any "On the map" person |
| Loading | First `Loading this person…` (`[id]/loading.tsx:4`) while the redirect resolves, then `Loading the next person…` (`review/loading.tsx:4`) | Not captured |
| Error | Before the redirect: `We couldn't load this person.` (`[id]/error.tsx:13`). After: `We couldn't load this review.` / `Try again, or go back to your people.` / "Try again" (`review/error.tsx:13-21`) | Not captured |
| Not found | `We couldn't find that person.` (`[id]/not-found.tsx:7`) for a wrong or deleted id. A wrong id in wrong-house mode hits Next.js's built-in 404 page: no `not-found.tsx` exists above `review/` | Producible with a wrong id |
| Decision error | `role="alert"` line, e.g. `That house is not one of the matches.`, `We could not find that person.` (`src/db/review-write.ts:75-80`), `Nothing to undo.` (`src/people/save-review.ts:119`) | Described from the code |
| View-as | Muted `Viewing as another agent is read only.`; every decision control disabled (`review-queue.tsx:186`) | Not producible from the seed |

## Fixed copy
All review strings live in one file, `src/people/review-copy.ts:1-16`, and the tests check that each
screen uses the constant, not the literal words:
- `You gave us:`, `None of these` (`review-ui.test.ts:17`); `This one`, `Name matches`, `Recorded owner` (`:17`, `:86`); `We couldn't find this address.`, `Fix the address`, `Leave them out`, `They won't get the monthly email.` (`:37`); `Everyone's on the map.`, `Back to your people`, the left-out link (`:45`); `Undo` (`:54`). **Fixed** by constant.
- `Needs a look · 3 of 7` format: **Fixed**, `src/people/review-state.test.ts:26`.
- `All done. 2 people won't get the email until you fix their address.` / `1 person`: **Fixed**, `src/people/review-state.test.ts:58`.
- `They won't get the monthly email.` carries a product rule: leaving someone out stops their email. No test holds the literal wording.
- `Loading the next person`, `couldn't load this review`: **Fixed**, `review-ui.test.ts:61`.

## Tests that assert on this screen
- `people-ui.test.ts:113`: the per-person route looks the person up and redirects to `reviewQueueHref(person.id)`; the old "That step is not built yet" placeholder is gone.
- `src/people/url.test.ts:30`: `/app/people/review?contact=abc` and `…&mode=wrong-house`.
- `review/review-ui.test.ts:8` (one at a time, accurate header), `:17` (cards), `:37` (couldn't-find options), `:45` (done states), `:54` (five-second undo), `:61` (four states), `:68` (15px/22px, focus rings), `:86` ("Name matches" is neutral blue-soft, evidence not an answer), `:94` (cards outlined in `--border`), `:101` (only "This one" picks a house; tapping the card does nothing), `:109` (shared `linkClass`).
- `src/people/review.integration.test.ts:167`: choose, leave out, undo, re-match, and wrong-house candidates exclude the wrong parcel. `:290`: view-as cannot decide.
- `src/db/soft-delete.integration.test.ts:134`: a deleted person is not in the queue and cannot be left out.
- Browser checks (`e2e/checks.ts`) run only on the review-queue capture at its first person; this entry is not checked.

## What the v0 export did, and why we did not take it
The export has no per-person review. A contact page ran an inline MatchFlow ("Match this homeowner to a
parcel", `reference/v0-export/components/app/contact-detail.tsx:110-135`) or sent the agent to `/match`.
`docs/audits/OR-027-v0-audit.md:301` marks "Person review opens the queue at that contact" BREAKS.
Why not: the confirm wrote a fabricated record (`recordedPrice: 720000`, `assessedValue: 792000`,
audit :405); `/match` copy is homeowner-facing ("Which home should we watch?", audit :126); lot cards
show fabricated APNs and owners and no "This one" (audit :310); there is no undo and the confirm routes
away after a 700ms timeout (audit :309); and text under 15px with missing focus styles (audit :308).
