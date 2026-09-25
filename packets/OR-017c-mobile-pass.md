# OR-017c — mobile pass

```
TASK: OR-017c
BRANCH: feat/mobile-pass

OBJECTIVE
Every agent-facing screen works at 390px, proven in a real browser.

WHY
Mobile has been NOT PROVEN on five packets. The buyer is a 57-year-old
agent checking this between appointments. One thorough pass beats five
partial ones.

SCOPE
- Every /app route: dashboard, people, person detail, review queue,
  import, settings, billing, add-ons
- The public /u/[token] page
- Out of scope: /admin, which is desktop only and fine that way

DESIRED BEHAVIOR

At 390x844 in a real browser, logged in, with seeded data:

  Dashboard — call entries become name, tag, sentence, then a full-width
    Call button. The panel stacks beneath and never covers the list.
  People — rows become name over address with the status tag
    right-aligned. The bulk bar stays visible and usable when active.
    Filters are reachable in one tap.
  Person detail — sections stack, no horizontal scroll.
  Review queue — candidate cards stack vertically, full width, and
    "This one" is a full-width button. This screen matters most: a wrong
    tap attaches the wrong house, which puts another household's recorded
    details in a homeowner's email.
  Import — the drop zone and paste box are usable; the result summary
    reads cleanly.
  Settings and Billing — single column forms; accent swatches and the
    cancel action are at least 44px.
  Add-ons — rows stack; switches are at least 44px and not adjacent to
    a link that could be mis-tapped.
  /u/[token] — single column, "Update my address" clearly primary.

Global: no horizontal page scroll anywhere. Tap targets at least 44px.
Nothing under 15px carries information. Legible without zoom.

METHOD
Drive it with Playwright against a scratch database, the same approach
OR-017b used for the call panel. Take a screenshot of every screen and
report which ones needed changes.

ACCEPTANCE CRITERIA
1. Every screen above renders correctly at 390x844 in a real browser,
   with a screenshot per screen in the report
2. document.documentElement.scrollWidth equals the viewport width on
   every screen, asserted, not eyeballed
3. Every interactive element is at least 44px in its smaller dimension,
   asserted across all screens
4. Review queue candidate cards stack and "This one" is full-width
5. The bulk bar stays usable at 390px
6. No content is clipped or overlapped on any screen
7. Desktop layouts are unchanged, proven by a 1440px pass on the same
   screens
8. pnpm verify passes, CI green before merge

DO NOT
- Redesign anything; this is a responsive pass, not a visual one
- Change desktop layouts except where a shared component requires it,
  and say so if it does
- Add a dependency other than Playwright as a dev dependency, which you
  may add
```
