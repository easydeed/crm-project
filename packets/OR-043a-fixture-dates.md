# OR-043a — Fixtures that expire, ties that wobble

Drafted by the builder; approved by the Director with all three decisions as defaulted and one amendment.

```
TASK: OR-043a
BRANCH: chore/fixture-dates

OBJECTIVE
Every capture shows what the product produces today, and shows it the same
way on every reseed.

WHAT I FOUND (measured on a fresh seed, 2026-10-07)

1. The in-app email preview has never shown an email.
   - settings and person-detail both preview the first matched person by
     name, Aisha Rahman.
   - Her note is skipped today: "Nothing new on their street this month."
   - I built the note for all 45 seeded homeowners at two dates:
     - asOf 2025-04-15: 27 of 45 get a note (record, street sales, and taxes
       for the three Oakdale people). Aisha is one of the 18 skipped.
     - asOf today: 0 of 45. Every seeded homeowner is skipped.
   - So the street-sales block isn't rendering a thinner note. The email
     preview in /app has rendered no note in any capture since the
     captures began. Only /sample shows an email, and it uses its own fixed
     fixture (see 3).

2. The seed's dates were already expired when it was written.
   - la-verne.ts was committed on 2026-09-17. Its newest windowed date is
     2025-03-21, 18 months earlier.
   - The OR-043 report said these dates "aged out". That was wrong: they
     never fired in this repo's life.
   - The 2024-25 dates look like they were written against a "now" in the
     spring of 2025. A fixed date is only right relative to the day it was
     written for.

3. What doesn't expire.
   - A fixed date paired with a fixed asOf can't age. That covers:
     - the digest scenarios (AS_OF 2026-09-15), which feed /sample and
       sample-text-dark
     - the signal scenarios
   - Dates that are only displayed or ordered, never windowed, can't expire
     either:
     - the unmatched contacts' close dates
     - the review queue's deeds (2015, 2018, 2023)
     - the closed-listings fixture (no window)

4. Ties broken by a random id. Two sorts break ties by contact id:
   compareStrength in src/signals/select.ts, and the display sort in
   call-list-view.ts.
   - Seed contacts have fixed ids, so seeded rows order the same every
     time.
   - Any row created at run time gets a random id. The OR-043 quiet agent
     was that case, and is fixed.
   - The capture method has no check that a reseed reproduces a capture.
     That is the gap that hid it.

5. Strings that move on a calendar without expiring.
   - "You've owned it N years and M months" (ownedForPhrase) changes
     monthly.
   - The call list is built for the current month.
   - A baseline and a compare taken either side of a month boundary
     differ, with no code change.
   - The procedure runs both on the same day, so this has not bitten yet.

INVENTORY: every dated row in the seed and fixtures

| Row | Feeds a window? | Status today |
|---|---|---|
| la-verne oakdaleSales (3 deeds, 2024-05 to 2025-03) | sold_nearby 45d, street median 12mo, street sales 12mo | Expired before the seed was written |
| la-verne matched contacts: closeDate and own deed (2018-2024) | street sales 12mo; tax tenure ≥5y | Street sales expired by 2025-12-15 at the latest. Tenure only grows. |
| la-verne unmatched closeDates (3) | no (displayed) | Fine |
| la-verne parcels lastRefreshedAt 2026-08-01 | nothing reads it outside the schema and fixtures | Fine (see follow-up) |
| la-verne-review deeds and closeDate | no (ordering for recorded owner) | Fine |
| digest scenarios, AS_OF 2026-09-15 | yes, against their own fixed AS_OF | Can't expire |
| signal scenarios | yes, against their own fixed asOf | Can't expire |
| closed-listings fixture (2017-2025) | no window | Fine |
| e2e-setup currentPeriodEnd 2099-01-01 | subscription active | Expires in 2099 |
| e2e-live (OR-043) | yes, dated from the run | Can't expire, by test |

SCOPE
1. Run-relative street sales for the previewed person.
   - e2e-live gains sales on Aisha Rahman's street, dated from the run, in
     e2e setup only.
   - With them, settings and person-detail preview a real note: the record
     block, street sales and, if the median clears the gap, taxes.
   - Setup fails if Aisha's note is skipped, the same way it fails if a
     call tag is missing.
2. A determinism check in the capture method.
   - capture.sh runs twice at one commit, each from a fresh seed and setup.
     The two runs must be byte-identical.
   - Run once in this packet and logged.
   - Written into the reskin-screen-log procedure as step 0, before any
     comparison is trusted.
3. A fixed-date guard for the seed.
   - A test reads la-verne.ts and lists every date literal that sits on a
     field a window reads (recordedAt on deeds and reconveyances).
   - The list is pinned, with the reason each is allowed: "the seed is
     fixed by rule. Live dates come from e2e-live."
   - A new windowed date in the seed fails until someone decides where it
     belongs.
4. (Cheap, the INK_COLOR shape) design-debt widens its style-prop rule.
   - Today it catches only a quoted colour keyword.
   - It will catch any colour property with any value, including a name
     like INK_COLOR.
   - The one legitimate use, the accent swatches in appearance-form.tsx,
     becomes a permanent entry: "shows the email's accent colour itself."
   - That closes the gap break 2 exposed. The banner test held then, but
     design-debt would have missed the colour on its own.

DESIRED BEHAVIOR / DECISIONS

1. DECISION A — where moving dates live. Default: e2e setup only, as now.
   - The seed stays fixed by the standing rule.
   - The cost: `pnpm dev` on a fresh seed shows a dashboard of "Been a
     while" rows and no email preview, for anyone working locally.
   - Say "seed" to move the windowed rows of la-verne.ts to dates relative
     to the seed run. Local dev would then show the product as it is. It
     reverses the rule you set in OR-043, and la-verne.test's fixed
     expectations would need rewriting.

2. DECISION B — which person the previews show. Default: keep Aisha and
   give her street live sales.
   - The alternative is to pick a person who already has sales, but
     nobody has any today, so it would not help.

3. DECISION C — the INK_COLOR rule. Default: in this packet. It is about
   ten lines plus one permanent entry. Say "05-open" to log it there
   instead, as you suggested.

PROPERTY TESTS (each proven both ways)
- e2e-live: every new street-sale date is inside the 12-month window for
  three run dates, and the file has no date literal. This extends the
  OR-043 test.
- Setup: Aisha's note is not skipped, or setup throws (proven by dating
  one sale 13 months back).
- Seed guard: the pinned list of windowed literals in la-verne.ts.
  - Red on a new deed with a fixed date.
  - Green on a reworded comment.
- design-debt:
  - Red on style={{ backgroundColor: INK_COLOR }} in the banner.
  - Green on style={{ width: size }}.

ACCEPTANCE CRITERIA
1. The inventory above is in docs/audits/OR-043a-fixture-dates.md, with
   each row's window and status.
2. settings and person-detail capture a note with a "What sold on your
   street" block, light and desktop. Every street-sales line carries its
   document number. No MLS figure is mixed in.
3. The determinism check:
   - two fresh-seed captures at one commit are byte-identical, 27 of 27
   - written into the procedure
4. Desktop exact comparison against the parent: only settings and
   person-detail change, plus any screen the report names with a cause.
5. pnpm verify passes, browser pass green at both widths, CI green.
6. Two deliberate breaks, each red on its intended signal, each reverted
   to an identical tree:
   - one live street sale dated 13 months back: setup red
   - the banner on style INK_COLOR: design-debt red
7. No schema change, no dependency, no copy change, scripts/seed.ts
   untouched (under Decision A's default).

DO NOT
- Put a moving date in scripts/seed.ts or la-verne.ts (unless Decision A
  says "seed")
- Change any window, threshold or signal score to make a fixture fire
- Invent a street-sales figure that combines recorded and MLS data
```

## Found while drafting, not absorbed

- **`parcels.lastRefreshedAt`** is written by the seed and nothing outside
  the schema and fixtures reads it. That may be an invariant 2 field
  (write-only), or something reads it that my search missed. It belongs to
  a later audit, not this packet.
- **Correction to the OR-043 report.** "They almost certainly produced real
  signals when they were written" was wrong. The seed was committed
  already 18 months past its newest windowed date.

## Director's decisions

- A: moving dates in e2e setup only. The seed stays fixed and la-verne.test's
  expectations stay meaningful. Note the `pnpm dev` cost in the README so the
  next person doesn't take an empty preview for a bug.
- B: keep Aisha, give her street live sales.
- C: the INK_COLOR rule in this packet.
- Log `parcels.lastRefreshedAt` (write-only) in 05-open.

## Amendment

```
Item 2's determinism check runs twice at one commit. Make it three runs,
and run the third after the other two have both passed rather than back
to back. The quiet-dashboard instability surfaced because a tie broke on
a random id; two consecutive runs can agree by chance where three are
less likely to. Report the three tree hashes.

Also: the month-boundary problem named in your findings — "owned N years
and M months", and the call list being built for the current month —
goes in reskin-screen-log's procedure, not just the report. A baseline
and comparison taken either side of midnight on the 1st would differ
with no code change, and the only reason it has not bitten is that we
have always run both on the same day. Write it down as a procedural
caveat so the next person running a comparison on the 31st knows.
```
