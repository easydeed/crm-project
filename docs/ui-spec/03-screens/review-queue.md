# Review queue — `/app/people/review`
**Capture:** review-queue (390 and 1440). The wrong-house mode, the no-parcel panel, the Undo bar, the done states, loading and error are not captured.

## What the agent came here to do

When the agent imports a list, every address is matched to a house on the county record. Most match on
their own. Some do not: the address was typed loosely ("15 Oakdale"), or two houses fit, or nothing on the
record fits (a PO Box). Those people are not mailed until somebody says which house is theirs. This screen
puts them in front of the agent **one person at a time**, shows up to three candidate houses, and asks the
agent to pick one ("This one"), say none of them is right, fix the address, or leave the person out.

The agent arrives from the People list's "Review them" link, the import result's "Review them" link, the
dashboard's call list (`src/app/app/call-list.tsx:35`, `src/app/app/home-card.tsx:94`), or a person's page.
A person's page also has "Wrong house?" (`src/app/app/people/[id]/person-detail.tsx:105-108`) for someone
already matched: that opens this screen in **wrong-house mode** for just that one person
(`?contact=<id>&mode=wrong-house`, `src/app/app/people/review/page.tsx:22-37`).

Who is in the queue: people whose status is `needs_review`, plus `no_parcel` people the agent has not yet
decided about (`src/people/review-state.ts:6-11`, query at `src/db/review-queue.ts:33-49`). They come in
name order. `no_parcel` means "no house on the record matches this address".

## Layout

The shared app chrome sits above everything: the top bar (wordmark, "People" highlighted, "Add-ons",
"Settings") and a "Log out" link (`src/app/app/layout.tsx:26-34`). Then, inside `<main className="px-4 py-10">`
(`review-queue.tsx:133`), top to bottom:

1. **Header**, 22px semibold: `Needs a look · 1 of 7` (from `reviewHeader`, `src/people/review-state.ts:20-22`).
   The two numbers are this person's position and how many are left in this visit's list.
2. **What the agent typed** (`review-queue.tsx:137-141`), max width 3xl: a medium-weight `You gave us:`, then
   the person's name, then the address exactly as imported.
3. **Candidate cards** (`candidate-cards.tsx:17`): a `<ul>` that is **one column on a phone and three columns
   from 768px up** (`grid-cols-1 md:grid-cols-3`). At 1440 the capture shows two cards side by side with an
   empty third column; at 390 they stack. Each card, top to bottom:
   - street, line break, `city, zip` (medium weight);
   - `Recorded owner: <name>` if the record names one;
   - the **"Name matches" tag** if the contact's last name appears in the recorded owner's name;
   - house facts in muted ink, e.g. `3 beds · 2 baths · 1,600 sq ft` (`formatHouseFacts`, review-state.ts:45-59;
     any unknown piece is left out, and the line disappears if all are unknown);
   - the matcher's reason in plain words (capture: `Street number not found on this street`);
   - the **"This one"** button: full width on a phone, natural width from 768px (`w-full md:w-auto`).
4. **`None of these`**, a text-link-styled button under the cards (`review-queue.tsx:154-165`).
5. **No-parcel panel** (instead of 3 and 4) when the person has no candidates, or after "None of these".
6. A read-only line when an admin is viewing as this agent, an error line, and the sticky **Undo** bar.

At 390 nothing else changes: the text column is simply the phone width minus 16px gutters.

### The card outline: the one `--border` card (OR-032)

Everywhere else in the app a card's edge is `--rule`, a faint decorative divider (`src/app/globals.css:12`).
Candidate cards are the documented exception and take `--border`, the control-outline token that clears
3:1 (light `#7c879d` on white, 3.61:1). The reason, written in `globals.css:12-13`: *"on a phone they stack
and the outline says which "This one" picks which house."* Two stacked cards each with a dark button: if the
edges are faint, the agent cannot tell whether a button belongs to the card above it or below it, and picks
the wrong house for a real person's mail. The rule behind it (`docs/audits/reskin-screen-log.md:62-69`): a
boundary that marks something you act on is not decoration, and a token swap may never make it fainter.

### `NAME_MATCH_TAG_CLASS`: why "Name matches" is not green

Defined in `src/app/app/people/status-tag.ts:17-21`: a pill (`rounded-full px-3 py-0.5`) in
`bg-blue-soft text-foreground`. Green in this app means "On the map" (a confirmed match, `status-tag.ts:10`).
A last name appearing on the deed is **evidence about one candidate, not an answer**, so the colour must not
assert one. Coral is also forbidden (it means needs review). The test holds both: it must contain
`bg-blue-soft text-foreground` and must not match green or coral (`review-ui.test.ts:86-92`). The label
carries the meaning; the colour only repeats it. The pair is in the contrast test (`src/app/tokens.test.ts:41`).

## Controls

| Label (quoted) | What it does | Disabled look / when | Where focus goes after |
|---|---|---|---|
| `This one` (`candidate-cards.tsx:42-49`, `buttonClass`) | Attaches that house to the person; the person leaves the queue and the next one shows. Starts a 5-second Undo. **This button is the only thing that picks a house**: the card itself is not clickable (`review-ui.test.ts:101-107`). | `disabledClass` (surface fill, muted words, inset ring) while a save is running or in view-as. | No `focus()` call. The button unmounts with the card, so focus falls to the page; the new person's header is not focused. |
| `None of these` (`review-queue.tsx:156-163`, `linkClass` on a `<button>`) | Hides the cards and shows the no-parcel panel for this person. Client-only; nothing is saved. | Native disabled while saving or in view-as. `linkClass` has no disabled styling of its own. | Not moved. |
| `Fix the address` (`no-parcel-panel.tsx:50-57`, `linkClass`) | Reveals an `Address` field prefilled with what was typed, and a `Save address` button. | Same as above. | Not moved; the field has no `autoFocus`. |
| `Address` field (`no-parcel-panel.tsx:31-38`, `fieldClass`) | Edits the address. | Native disabled while saving / view-as. | — |
| `Save address` (`no-parcel-panel.tsx:39-46`, `buttonClass`) | Saves the new address and re-runs the match. If it now matches one house, the person leaves the queue; otherwise the card list or panel refreshes with the new result. | `disabledClass`. | Not moved. |
| `Leave them out` (`no-parcel-panel.tsx:61-68`, `buttonClass`) | Marks the person reviewed with no house: they stay in People but get no email. Starts Undo. | `disabledClass`. | Not moved. |
| `Undo` (`review-queue.tsx:192-202`, `buttonClass`) | Shown for 5 seconds after a pick or a leave-out (`UNDO_MS = 5000`, line 19). Restores the previous state and returns to that person. Sticky to the bottom of the viewport on a `--background` strip. | `disabledClass` while saving / view-as. | Not moved. |
| `See who was left out` (done state, `done-state.tsx:33-38`) | Opens People filtered to left-out `no_parcel` people. | — | Navigates. |
| `Back to your people` (done state, `done-state.tsx:41-45`) | Goes to `/app/people`. | — | Navigates. |
| `Try again` (error, `error.tsx:15-21`) | Re-renders the route. | — | — |

Note for the redesign: the `Address` input **and** the `Save address` button both sit inside one `<label>`
(`no-parcel-panel.tsx:31-47`). It works, but it is unusual markup.

## States

| State | What renders (quoted) | Captured / producible |
|---|---|---|
| Populated, with candidates | Header, `You gave us:`, cards, `None of these` | **Captured** (review-queue): Anita Flores, 411 Ashford Ave; cards 410 and 412 Ashford Ave; "Name matches" on 410. |
| Populated, no candidates (no-parcel panel) | `We couldn't find this address.` then `Fix the address`, `Leave them out`, and muted `They won't get the monthly email.` | Producible from the seed: Helen Cho (`PO Box 312`) is 4 of 7 in name order; or tap `None of these` on anyone. Not captured. |
| Fix-the-address open | `Address` field and `Save address` replace the link | Producible from the seed. Not captured. |
| Saving | Every control disabled; no spinner or text | From the code (`pending`, `review-queue.tsx:43`). |
| Undo window | Sticky `Undo` button for 5 s | Producible. Not captured. |
| Action error | The server's message in a `role="alert"` line, e.g. `We could not find that person.`, `That house is not one of the matches.` (`src/db/review-write.ts:75-77`), `Nothing to undo.` (`src/people/save-review.ts:119`) | Not producible from the seed; described from the code at `review-queue.tsx:187-191`. |
| View-as (admin viewing an agent) | Controls disabled, plus `Viewing as another agent is read only.` (`src/auth/write-guard.ts:3`) | Not producible from the seed without an admin session; from the code at `review-queue.tsx:186`. |
| Empty / done, nobody left out | `Everyone's on the map.` + `Back to your people` | Producible by working through the queue. Not captured. |
| Done, some left out | `All done. 1 person won't get the email until you fix their address.` (plural: `All done. N people won't get…`, `review-state.ts:61-66`) + `See who was left out` + `Back to your people` | Producible. Not captured. |
| Wrong-house mode, done | `They're on the map.` + `Back to your people` | Producible from the seed via a matched person's `Wrong house?`. Not captured. |
| Loading (`loading.tsx`) | `Loading the next person…` | Not captured. |
| Error (`error.tsx`) | `We couldn't load this review.` / `Try again, or go back to your people.` / `Try again` | Not producible from the seed. Note: the copy says "go back to your people" but the screen offers no link to People, only Try again. |

## Fixed copy

All strings live in `src/people/review-copy.ts`; the tests assert that the components use the constants
(`review-ui.test.ts:17-66`), so changing a constant's wording changes the screen without failing a test, and
the constants themselves are not string-asserted unless noted.

- `You gave us:`, `This one`, `None of these`, `Name matches`, `Recorded owner`, `We couldn't find this address.`,
  `Fix the address`, `Leave them out`, `They won't get the monthly email.`, `Everyone's on the map.`,
  `They're on the map.`, `Back to your people`, `Undo`, `Save address`, `See who was left out`
  (`review-copy.ts:1-16`). **Fixed** by constant use in `review-ui.test.ts:17-59`.
- `Needs a look · ${position} of ${total}` — **Fixed**, `src/people/review-state.test.ts:26`.
- `All done. 1 person won't get the email until you fix their address.` and the plural — **Fixed**,
  `review-state.test.ts:58`. Product rule: it says plainly who will not be mailed.
- `Loading the next person` — **Fixed**, `review-ui.test.ts:62`. `couldn't load this review` — **Fixed**, `review-ui.test.ts:63`.
- `They won't get the monthly email.` carries a product rule (leaving someone out stops their mail); no test
  holds its wording.

## Tests that assert on this screen

- `src/app/app/people/review/review-ui.test.ts`
  - :8 one person at a time; header is `reviewHeader(index + 1, list.length)`.
  - :17 cards show the typed name and address, street/city/zip, owner, facts, reason, Name matches, This one; `grid-cols-1` and `md:grid-cols-3`.
  - :37 the no-parcel panel has its four strings. :45 done states and the left-out link are real links.
  - :54 Undo is five seconds. :61 the four states exist. :68 every file is 15px or 22px and has focus rings.
  - :86 "Name matches" uses the neutral pair, not green or coral. :94 cards are outlined in `--border` and
    globals.css records the OR-032 exception. :101 only the `This one` button calls `onChoose`.
  - :109 `linkClass` is imported, not copied.
- `src/people/review-state.test.ts`: :12 who is in the queue, :20 who is left out, :26 header, :31 and :41
  name-match rules (last name, accent-folded, whole words), :51 facts omit unknown pieces, :58 done copy.
- `src/people/review.integration.test.ts:167` choose, leave out, undo, rematch, wrong house against a
  database; :290 view-as cannot choose or leave out.
- `src/people/url.test.ts:30` queue and wrong-house hrefs. `src/app/app/people/people-ui.test.ts:79-84,108`
  person page links into this screen.
- Whole-tree: `src/app/design-debt.test.ts:113` (tokens only), `src/app/shared-classes.test.ts:30,39`,
  `src/app/disabled-state.test.ts:19,61` (no opacity; `disabled` only on native controls).
- Browser (`e2e/screens.ts:68`, run by `e2e/screens.spec.ts`): page loads under 400 with no "couldn't load"
  text, then `e2e/checks.ts`: no horizontal scroll at 390, 44px tap targets on phone (inline links exempt),
  no text under 15px, no clipping.

## What the v0 export did, and why we did not take it

The export's closest screen is `/match` (`reference/v0-export/app/match/page.tsx`, `components/match/*`). The
audit calls it "Real screen, weak … The export's copy is homeowner-facing ("Which home should we watch?", :58)"
(`docs/audits/OR-027-v0-audit.md:126`).

- **The whole card was the button, and the first card was pre-selected.** `lot-card.tsx:17-26` makes the
  card a toggle; `match-flow.tsx:30-33` auto-selects the first candidate, then one `This is the one` button
  confirms. A tap anywhere picks a house, and the default answer is the matcher's guess. Ours makes the agent
  press a button on the card they mean; `review-ui.test.ts:101` holds that.
- **Fake waiting.** A 1300ms "Searching county parcels" spinner (`match-flow.tsx:24-52`) with no real work
  behind it, and no error state (audit :311).
- **Small text, no focus style.** 12-13px for owner, APN and deed lines; no focus ring on `lot-card:17` or
  `match-flow:85` (audit :308). Our floor is 15px.
- **Invented record data.** "fabricated APN and owner, not 'This one'" (audit :310).
- **No undo** — "the 'confirm' routes away after a 700ms timeout" (audit :309).
