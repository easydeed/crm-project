# OR-030 — Re-skin: /app dashboard

Drafted by the builder. Approved by the Director with Decisions A and B as
defaulted and the amendment at the end.

```
TASK: OR-030
BRANCH: feat/reskin-dashboard

OBJECTIVE
The /app dashboard restyled with the OR-028 tokens: the send card, the
call list and the homeowners link. Same three components, same
behavior, same copy. Clears the three /app debt files.

WHY
The first screen with real content and the most markup-asserting tests
in the app. If the tokens hold here, they hold everywhere.

SCOPE
- src/app/app/call-entry.tsx, call-tags.ts, call-panel.tsx: restyle
  in place, clear their debt
- src/app/app/call-list.tsx, home-card.tsx, home-billing-card.tsx,
  homeowners-section.tsx: restyle in place (no debt entries)
- src/app/app/people/ui.ts: mutedClass only (Decision A)
- src/app/design-debt.test.ts: delete the cleared entries
- src/app/app/call-list.test.ts: new assertions only; all 16 existing
  tests stay exactly as they are
- Out of scope:
  - the top bar (OR-029)
  - text-notice.tsx (already token-clean)
  - /app loading.tsx and error.tsx beyond tokens they already use
  - every other screen

CURRENT STATE (read from the code)
- page.tsx renders exactly <HomeSendCard>, <CallListSection> and
  <HomeownersSection>, in that order. A test enforces "nothing else".
- Call entries are rows:
  - border-foreground/15 dividers
  - the called state is a bg-foreground/5 tint, with the name in
    #3d3d3d (dark: #c8c8c8)
  - "Not now" has a border-foreground/40 outline
- Tags are hard-coded hex pairs, per kind, in light and dark (16
  colours).
- The Call panel is an inline block with a border-foreground/20 border.
- mutedClass in people/ui.ts is #3d3d3d (dark: #c8c8c8). It is shared by
  the dashboard, the review queue and /app/start.

DESIRED BEHAVIOR

1. Tags use token pairs that are already in the contrast test:

   | Tag   | Pair                                        | Light / dark  |
   |-------|---------------------------------------------|---------------|
   | coral | --coral-text on --coral-soft                | 5.65 / 6.80   |
   | green | --green-text on --green-soft                | 5.12 / 7.99   |
   | blue  | --foreground on --blue-soft (not blue text) | 15.30 / 13.32 |
   | grey  | --muted-ink on --surface                    | 4.56 / 6.81   |

   Labels, colour names and the data-tag-color attribute don't change.
   Tags stay 15px.

2. Call entries stay rows, not cards:
   - dividers become --rule
   - the called state becomes a --surface tint, with the name in
     --muted-ink and "Called this month." unchanged
   - "Not now" gets a --border outline (3:1); "Mark as called" and
     "Call" keep the foreground fill
   - no opacity-50 or other dimming on called rows (the export dims
     them; ours never did)

3. The Call panel sits on --surface with a --rule border, radius lg.
   Everything inside it stays as it is: tel: and mailto: links, the
   record and loan blocks, and "Nothing recorded on this house yet."

4. DECISION A — mutedClass. APPROVED: fix it in place in people/ui.ts,
   to text-muted-ink (#63708a light, #9aa3b5 dark).
   - It is one shared definition used by the dashboard, the review
     queue and /app/start, so one change fixes all three.
   - It takes #3d3d3d and #c8c8c8 out of people/ui.ts's debt entry,
     which stays owned by OR-031 for its input border.
   - Visible effect: secondary text on /app, the review queue and
     /app/start gets lighter. #3d3d3d is 10.6:1; --muted-ink is 4.98:1
     on white and 4.56:1 on --surface.

5. DECISION B — the send card. APPROVED: it becomes a card: --rule
   border, radius lg, no shadow, on --background, with its current copy
   and actions. Covers every state (import, settings, paused,
   system-paused, billing, scheduled).
   - It holds one message and at most one action; no figures, counts or
     tiles.

6. What the export has that we do not bring, each rejected for a reason:
   - the "Your groups" list: groups live on People; a second groups
     surface is the rejected "separate Groups navigation" by another name
   - the three MiniFact tiles: the rejected stat cards
   - a "Fix these" alert linking to /match: our review queue is
     /app/people/review, and the send card already names it
   - the reading_closely tag: an engagement signal; only the statuses
     and events in the schema exist
   - dimming on called rows: a called person stays fully readable
   Nothing new is added to page.tsx.

ACCEPTANCE CRITERIA
1. All 16 existing call-list.test.ts tests pass unchanged. That covers:
   - exactly three components, in order
   - no stat cards, counters, "%" or progress bars
   - the quiet-month copy
   - the import and review hrefs
   - Call opening an inline panel, never a modal
   - the five-second undo and "Not now"
   - the paused-with-list state
   - the reused record and loan blocks
   - the called dates on the person page
2. New assertion: each tag's classes name exactly the token pair in the
   table above, and that pair is in tokens.test.ts's PAIRS.
3. design-debt.test.ts:
   - the entries for call-entry.tsx, call-tags.ts and call-panel.tsx
     are deleted
   - people/ui.ts loses #3d3d3d and #c8c8c8
   - the /app scan passes
4. The contrast test passes unchanged: every pair used is already in
   PAIRS.
5. The browser pass is 37/37 at both widths.
6. The desktop baselines are recaptured, and the report lists every
   changed screen and why. Expected:
   - dashboard, dashboard-call-open
   - review-queue, start, start-few, start-found, start-malformed and
     start-nothing (Decision A)
7. No dependency, no schema change, no copy change, no test loosened.
8. Two deliberate breaks, each red in CI on its intended signal only,
   each reverted to an identical tree:
   - a hex colour back into call-tags.ts: the debt scan goes red
   - an entry count rendered in call-list.tsx ({list.entries.length}):
     the no-stat-cards test goes red
9. pnpm verify passes, CI green before merge.

DO NOT
- Add, remove or reorder anything on /app
- Change any copy, href, action or undo timing
- Bring the export's groups list, stat tiles, alert or engagement tag
- Use blue text on --blue-soft, or opacity to show state
- Touch src/digest/ (the panel reuses its record and loan blocks as-is)
```

## Amendment (Director)

```
Amendment to OR-030:

The grey tag uses --muted-ink on --surface at 4.56:1, which is 0.06
above the floor. Add a comment at that pair in tokens.test.ts naming
what depends on it: the grey call tag, and mutedClass on any --surface
background. If a later packet darkens --surface, the failure should say
what it breaks, not just which pair.
```

The report must say plainly that /app, the review queue and /app/start all
lighten in this packet (Decision A), so their baselines move before OR-032
and OR-035 run.
