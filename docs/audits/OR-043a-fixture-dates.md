# OR-043a — Dated fixtures and stable captures

Measured on a fresh seed on 2026-10-07.

## The finding

The in-app email preview had never shown an email.

- The settings and person-detail screens preview the first matched person by name, Aisha Rahman.
- Her note was skipped at every date the seed has been run against, with "Nothing new on their
  street this month."
- A skip is a legitimate state that renders cleanly, so every capture since the captures began looked like a
  working preview.

I built the note for all 45 seeded homeowners at two dates:

| asOf | Homeowners with a note | Aisha |
|---|---|---|
| 2025-04-15 | 27 of 45 (record and street sales; taxes for the three Oakdale people) | skipped |
| 2026-10-07 | 0 of 45 | skipped |

The seed did not decay. `src/db/fixtures/la-verne.ts` was committed on 2026-09-17, and its newest
recorded event, 2025-03-21, was already outside every window that day. The 2024-25 dates look as if
they were written for a "now" in the spring of 2025. A fixed date is only right relative to the
day it was written for. OR-043's report said these dates "aged out"; they never fired.

## A second blind spot: the capture couldn't have shown it

With Aisha's note fixed, the first capture still showed an empty frame. The preview's iframe sits
below the fold, and a full-page capture doesn't paint an iframe the viewport never reached. A probe
of the live page showed the frame rendering the whole note, from a 5,191-character srcdoc. So the capture would
have shown a blank frame even if a note had existed.

Both screens now have a prepare step that fails unless the note is there:
- `settings` captures the email, scrolled into view so it paints. The 640px frame shows the note's
  top: the sender, the recorder stamp and the tax block.
- `person-detail` captures the plain text, which shows the whole note, including both street-sales
  lines and their document numbers.

Scrolling inside the frame to the street-sales block timed out. The frame is sandboxed with no
scripts allowed.

The plain text has no block labels: the two street-sales lines and the tax lines appear with no
heading. That's logged in 05-open as a product question, not changed here.

## Every dated row in the seed and fixtures

| Row | Window it feeds | Status |
|---|---|---|
| `la-verne.ts` oakdaleSales: 3 deeds, 2024-05-14 to 2025-03-21 | Sale nearby (45 days), street median (12 months), street sales (12 months) | Expired before the seed was written |
| `la-verne.ts` matched contacts: closeDate and their own deed, 2018 to 2024 | Street sales (12 months); tax tenure (at least 5 years) | Street sales expired by 2025-12-15 at the latest. Tenure only grows. |
| `la-verne.ts` unmatched closeDates (3) | None: displayed only | Can't expire |
| `la-verne.ts` parcels lastRefreshedAt 2026-08-01 | Nothing reads it outside the schema and fixtures | Logged in 05-open |
| `la-verne-review.ts` deeds (2015, 2018, 2023) and closeDate | None: ordering for the recorded owner | Can't expire |
| `src/digest/fixtures/scenarios.ts`, AS_OF 2026-09-15 | Yes, against its own fixed AS_OF | Can't expire. Feeds /sample and sample-text-dark. |
| `src/signals/fixtures/scenarios.ts` | Yes, against its own fixed asOf | Can't expire |
| `src/providers/fixtures/closed-listings.ts`, 2017 to 2025 | None | Can't expire |
| `scripts/e2e-setup.ts` currentPeriodEnd 2099-01-01 | Subscription active | Expires in 2099 |
| `src/db/fixtures/e2e-live.ts` (OR-043, OR-043a) | Yes, dated from the run | Can't expire; its test checks three run dates |

A fixed date paired with a fixed asOf can't age. The rows that age are fixed dates read against
today: the seed, read by the dashboard, the call lists and the in-app previews.

## What this packet changes

**Live street sales for the previewed person.**
- `e2e-live.ts` adds two sales on Bonita Ave, Aisha's street, dated 60 and 150 days before the run.
- Both are inside the 12-month street-sales window and outside the 45-day sale window, so Dana's
  call list is unchanged.
- Their median, $650,000, stays under 115% of every tenured neighbour's assessed value, so nobody on
  Bonita gains a tax tag.
- e2e setup now fails if:
  - the previews stop showing Aisha
  - her note is skipped
  - her note has no street sales

**A seed guard.** `seed-dates.test.ts` fails on any seeded recorded event newer than 2025-03-21.
- A recent fixed date would fire for some months and then stop, with nothing failing.
- A recent date belongs in `e2e-live.ts`, dated from the run.
- The seed stays fixed by rule (Decision A).

**Ties broken by a random id.** Two sorts break ties by contact id:
- `compareStrength` in `src/signals/select.ts`
- the display sort in `src/app/app/call-list-view.ts`

Seeded contacts have fixed ids. A row created at run time gets a random one, and its tied order
then changes on every reseed. The OR-043 quiet agent was that case, and is fixed. The determinism
check below is what would catch the next one.

**design-debt sees a colour behind a name.**
- The style-prop rule matched only a quoted keyword.
- It now matches any colour property with any value, so `style={{ backgroundColor: INK_COLOR }}` is
  debt.
- The accent swatches in `appearance-form.tsx` are the one permanent entry: each shows the email's
  accent colour itself.

## Strings that move on a calendar

These don't expire, but they change with the date:
- "You've owned it N years and M months" changes monthly.
- The call list is built for the current month.

A baseline and a comparison taken either side of midnight on the 1st differ with no code change.

Since this packet, the previews also print the live sales' recorded dates ("recorded August 8,
2026"). Those dates move every day, so a baseline and a comparison must now be taken on the same
day, not just in the same month. The procedure in `reskin-screen-log.md` says so.
